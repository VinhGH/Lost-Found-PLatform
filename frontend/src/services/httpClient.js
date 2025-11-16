/**
 * HTTP Client
 * Xử lý tất cả các HTTP requests đến backend
 */

import { API_BASE_URL, DEFAULT_HEADERS, REQUEST_TIMEOUT, STORAGE_KEYS } from './apiConfig';

class HttpClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = REQUEST_TIMEOUT;
  }

  /**
   * Get authentication token from localStorage
   * Check both user and admin tokens
   */
  getAuthToken() {
    // Try admin token first, then user token
    return localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || 
           localStorage.getItem(STORAGE_KEYS.USER_TOKEN);
  }

  /**
   * Get default headers với authentication token nếu có
   */
  getHeaders(customHeaders = {}) {
    const headers = { ...DEFAULT_HEADERS, ...customHeaders };
    
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  /**
   * Build full URL
   */
  buildURL(endpoint, queryParams = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    // Add query parameters
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] !== undefined && queryParams[key] !== null) {
        url.searchParams.append(key, queryParams[key]);
      }
    });
    
    return url.toString();
  }

  /**
   * Handle API response
   */
  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    
    // Parse response based on content type
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Check if response is successful
    if (!response.ok) {
      const error = new Error(data.message || 'API request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  /**
   * Make HTTP request with timeout
   */
  async requestWithTimeout(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - vui lòng thử lại');
      }
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, queryParams = {}, customHeaders = {}) {
    try {
      const url = this.buildURL(endpoint, queryParams);
      const headers = this.getHeaders(customHeaders);

      console.log(`🔵 GET ${url}`);
      
      const response = await this.requestWithTimeout(url, {
        method: 'GET',
        headers,
      });

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
        error: error.message || 'Không thể kết nối đến server',
        status: error.status,
      };
    }
  }

  /**
   * POST request
   */
  async post(endpoint, body = {}, customHeaders = {}) {
    try {
      const url = this.buildURL(endpoint);
      const headers = this.getHeaders(customHeaders);

      console.log(`🔵 POST ${url}`, body);

      const response = await this.requestWithTimeout(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await this.handleResponse(response);
      console.log(`✅ POST ${endpoint} - Success`, data);
      
      // Backend returns flat structure: { success, message, token, user, data }
      return {
        success: true,
        data: data, // Keep the whole response
        message: data.message,
        token: data.token, // For authentication responses
      };
    } catch (error) {
      console.error(`❌ POST ${endpoint} - Error:`, error);
      return {
        success: false,
        error: error.message || 'Không thể kết nối đến server',
        status: error.status,
      };
    }
  }

  /**
   * PUT request
   */
  async put(endpoint, body = {}, queryParams = {}, customHeaders = {}) {
    try {
      const url = this.buildURL(endpoint, queryParams);
      const headers = this.getHeaders(customHeaders);

      console.log(`🔵 PUT ${url}`, body);

      const response = await this.requestWithTimeout(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });

      const data = await this.handleResponse(response);
      console.log(`✅ PUT ${endpoint} - Success`, data);
      
      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      console.error(`❌ PUT ${endpoint} - Error:`, error);
      return {
        success: false,
        error: error.message || 'Không thể kết nối đến server',
        status: error.status,
      };
    }
  }

  /**
   * PATCH request
   */
  async patch(endpoint, body = {}, customHeaders = {}) {
    try {
      const url = this.buildURL(endpoint);
      const headers = this.getHeaders(customHeaders);

      console.log(`🔵 PATCH ${url}`, body);

      const response = await this.requestWithTimeout(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      });

      const data = await this.handleResponse(response);
      console.log(`✅ PATCH ${endpoint} - Success`, data);
      
      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      console.error(`❌ PATCH ${endpoint} - Error:`, error);
      return {
        success: false,
        error: error.message || 'Không thể kết nối đến server',
        status: error.status,
      };
    }
  }

  /**
   * DELETE request
   */
  async delete(endpoint, queryParams = {}, customHeaders = {}) {
    try {
      const url = this.buildURL(endpoint, queryParams);
      const headers = this.getHeaders(customHeaders);

      console.log(`🔵 DELETE ${url}`);

      const response = await this.requestWithTimeout(url, {
        method: 'DELETE',
        headers,
      });

      const data = await this.handleResponse(response);
      console.log(`✅ DELETE ${endpoint} - Success`, data);
      
      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      console.error(`❌ DELETE ${endpoint} - Error:`, error);
      return {
        success: false,
        error: error.message || 'Không thể kết nối đến server',
        status: error.status,
      };
    }
  }
}

// Export singleton instance
const httpClient = new HttpClient();
export default httpClient;

