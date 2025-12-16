/**
 * HTTP Client – FIXED TOKEN LOGIC (FINAL VERSION)
 */

import {
  API_BASE_URL,
  DEFAULT_HEADERS,
  REQUEST_TIMEOUT,
  OTP_REQUEST_TIMEOUT,
  MATCH_REQUEST_TIMEOUT,
  STORAGE_KEYS,
} from "./apiConfig";

class HttpClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = REQUEST_TIMEOUT;
  }

  /**
   * Get timeout duration based on endpoint
   * OTP endpoints need more time for email sending
   * AI Matching endpoints need more time for AI processing
   */
  getTimeoutForEndpoint(endpoint) {
    const otpEndpoints = [
      '/auth/request-otp',
      '/auth/request-password-reset',
      '/auth/verify-otp',
      '/auth/reset-password'
    ];

    const matchEndpoints = [
      '/matches/my',
      '/matches/post',
      '/matches/scan'
    ];

    const isOtpEndpoint = otpEndpoints.some(otp => endpoint.includes(otp));
    const isMatchEndpoint = matchEndpoints.some(match => endpoint.includes(match));

    if (isMatchEndpoint) return MATCH_REQUEST_TIMEOUT;
    if (isOtpEndpoint) return OTP_REQUEST_TIMEOUT;
    return REQUEST_TIMEOUT;
  }

  /**
   * TOKEN SELECTION LOGIC (FIXED)
   * - preferUser = true  → LUÔN dùng userToken
   * - preferAdmin = true → LUÔN dùng adminToken
   * - Không set gì → Ưu tiên userToken trước, adminToken sau
   */
  getAuthToken(options = {}) {
    const { preferUser = false, preferAdmin = false } = options;

    const adminToken = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
    const userToken = localStorage.getItem(STORAGE_KEYS.USER_TOKEN);

    // --- FORCE USER TOKEN ---
    if (preferUser) {
      console.log("🔑 [TOKEN] Using USER token (forced)");
      return userToken || null;
    }

    // --- FORCE ADMIN TOKEN ---
    if (preferAdmin) {
      console.log("🔑 [TOKEN] Using ADMIN token (forced)");
      return adminToken || null;
    }

    // --- DEFAULT BEHAVIOR ---
    // 👉 Ưu tiên USER TOKEN (để user không bao giờ bị dùng adminToken)
    if (userToken) {
      console.log("🔑 [TOKEN] Using USER token (default)");
      return userToken;
    }

    if (adminToken) {
      console.log("🔑 [TOKEN] Using ADMIN token (default)");
      return adminToken;
    }

    console.log("⚠️ [TOKEN] No token found");
    return null;
  }

  getHeaders(customHeaders = {}, authOptions = {}) {
    const headers = { ...DEFAULT_HEADERS, ...customHeaders };
    const token = this.getAuthToken(authOptions);

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  buildURL(endpoint, queryParams = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`);
    Object.keys(queryParams).forEach((key) => {
      if (queryParams[key] !== undefined && queryParams[key] !== null) {
        url.searchParams.append(key, queryParams[key]);
      }
    });
    return url.toString();
  }

  async handleResponse(response) {
    const contentType = response.headers.get("content-type");

    let data = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        localStorage.removeItem(STORAGE_KEYS.ADMIN_DATA);
      }

      // ✅ AUTO-LOGOUT on 403 if account is locked
      if (response.status === 403 && data.message?.includes("bị khóa")) {
        console.warn("🔒 Account locked - Auto logout");
        localStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        localStorage.removeItem(STORAGE_KEYS.ADMIN_DATA);
        sessionStorage.removeItem('currentView');

        // Show alert and redirect to login
        alert("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
        window.location.href = "/";
      }

      const error = new Error(data.message || "API request failed");
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  async requestWithTimeout(url, options, endpoint = '') {
    const timeout = this.getTimeoutForEndpoint(endpoint);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    console.log(`⏱️ Request timeout set to ${timeout / 1000}s for ${endpoint}`);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        throw new Error(`Request timeout (${timeout / 1000}s) - vui lòng thử lại`);
      }

      throw error;
    }
  }

  // ===================== GET ======================
  async get(endpoint, queryParams = {}, customHeaders = {}, authOptions = {}) {
    try {
      // Auto force user token for user endpoints
      if (
        endpoint.startsWith("/accounts/profile") ||
        endpoint.startsWith("/posts/my")
      ) {
        authOptions.preferUser = true;
      }

      const url = this.buildURL(endpoint, queryParams);
      const headers = this.getHeaders(customHeaders, authOptions);

      console.log(`🔵 GET ${url}`);

      const response = await this.requestWithTimeout(url, {
        method: "GET",
        headers,
      }, endpoint);

      const data = await this.handleResponse(response);
      console.log(`✅ GET ${endpoint} - Success`, data);

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      console.error(`❌ GET ${endpoint} - Error:`, error);
      return {
        success: false,
        error: error.message,
        status: error.status,
      };
    }
  }

  // ===================== POST ======================
  async post(endpoint, body = {}, customHeaders = {}, authOptions = {}) {
    try {
      const url = this.buildURL(endpoint);
      const headers = this.getHeaders(customHeaders, authOptions);

      console.log(`🔵 POST ${url}`);

      const response = await this.requestWithTimeout(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }, endpoint);

      const data = await this.handleResponse(response);
      console.log(`✅ POST ${endpoint} - Success`, data);

      return {
        success: true,
        data,
        message: data.message,
        token: data.token,
      };
    } catch (error) {
      console.error(`❌ POST ${endpoint} - Error:`, error);
      return { success: false, error: error.message, status: error.status };
    }
  }

  // ===================== PUT ======================
  async put(endpoint, body = {}, queryParams = {}, customHeaders = {}, authOptions = {}) {
    try {
      const url = this.buildURL(endpoint, queryParams);
      const headers = this.getHeaders(customHeaders, authOptions);

      console.log(`🔵 PUT ${url}`, body);

      const response = await this.requestWithTimeout(url, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      }, endpoint);

      const data = await this.handleResponse(response);
      console.log(`✅ PUT ${endpoint} - Success`, data);

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      console.error(`❌ PUT ${endpoint} - Error:`, error);
      return { success: false, error: error.message, status: error.status };
    }
  }

  // ===================== PATCH ======================
  async patch(endpoint, body = {}, customHeaders = {}, authOptions = {}) {
    try {
      const url = this.buildURL(endpoint);
      const headers = this.getHeaders(customHeaders, authOptions);

      console.log(`🔵 PATCH ${url}`, body);

      const response = await this.requestWithTimeout(url, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      }, endpoint);

      const data = await this.handleResponse(response);

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      console.error(`❌ PATCH ${endpoint} - Error:`, error);
      return { success: false, error: error.message, status: error.status };
    }
  }

  // ===================== DELETE ======================
  async delete(endpoint, queryParams = {}, customHeaders = {}, authOptions = {}) {
    try {
      const url = this.buildURL(endpoint, queryParams);
      const headers = this.getHeaders(customHeaders, authOptions);

      console.log(`🔵 DELETE ${url}`);

      const response = await this.requestWithTimeout(url, {
        method: "DELETE",
        headers,
      }, endpoint);

      const data = await this.handleResponse(response);

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      console.error(`❌ DELETE ${endpoint} - Error:`, error);
      return { success: false, error: error.message, status: error.status };
    }
  }
}

const httpClient = new HttpClient();
export default httpClient;
