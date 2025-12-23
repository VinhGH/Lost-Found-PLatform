/**
 * Real API Service - THAY THẾ userApi.js
 * Kết nối trực tiếp với backend thật
 *
 * HƯỚNG DẪN MIGRATE:
 * 1. Trong components, import: import apiService from '../services/api';
 * 2. Thay thế: userApi.loginUser() → apiService.loginUser()
 * 3. Tất cả methods giữ nguyên tên, chỉ thay đối tượng
 */

import httpClient from "./httpClient";
import { API_BASE_URL, API_ENDPOINTS, STORAGE_KEYS } from "./apiConfig";

class RealApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.authToken = localStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    this.userData = this.getUserDataFromStorage();
  }

  // ==================== PROFILE OVERRIDE HELPERS ====================

  // ==================== STORAGE MANAGEMENT ====================

  getUserDataFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  }

  setAuthData(token, userData) {
    if (!userData) return null;

    console.log(
      "🔐 setAuthData called with email:",
      userData?.email,
      "name:",
      userData?.name || userData?.user_name
    );

    // ================= APPLY OVERRIDE (giữ nguyên như cũ) =================
    let finalUserData = { ...userData };

    // =====================================================
    // 🔥 QUY TẮC MỚI: MỖI ROLE LƯU VÀO MỘT KHO RIÊNG
    // =====================================================
    const isStudent = userData.role === "Student";
    const isAdmin = userData.role === "Admin";

    // Clear old corresponding storage
    if (isStudent) {
      localStorage.removeItem("userData");
      localStorage.removeItem("userToken");
    } else if (isAdmin) {
      localStorage.removeItem("adminData");
      localStorage.removeItem("adminToken");
    }

    // Lưu token đúng chỗ
    if (isStudent) {
      localStorage.setItem("userToken", token);
    } else if (isAdmin) {
      localStorage.setItem("adminToken", token);
    }

    // ⛔ QUAN TRỌNG: LƯU USER VÀO KHO ĐÚNG THEO ROLE
    if (isStudent) {
      localStorage.setItem("userData", JSON.stringify(finalUserData));
      console.log("💾 Saved STUDENT userData:", finalUserData.email);
    } else if (isAdmin) {
      localStorage.setItem("adminData", JSON.stringify(finalUserData));
      console.log("💾 Saved ADMIN adminData:", finalUserData.email);
    } else {
      console.warn("⚠️ Unknown role when saving userData:", userData.role);
    }

    // Update instance
    this.authToken = token;
    this.userData = finalUserData;

    console.log(
      "✅ setAuthData completed - saved role:",
      userData.role,
      "email:",
      finalUserData.email
    );

    return finalUserData;
  }

  clearAuthData() {
    const currentEmail = this.userData?.email;

    this.authToken = null;
    this.userData = null;
    localStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);

    // 🔹 Clear profile cache nếu có
    if (currentEmail) {
      localStorage.removeItem(`userProfile_${currentEmail}`);
      console.log("✅ Cleared profile cache for:", currentEmail);
    }

    console.log("✅ User auth data cleared");
  }

  isAuthenticated() {
    return !!this.authToken && !!this.userData;
  }

  getCurrentUser() {
    // 🔹 Đọc từ localStorage và cập nhật instance variable
    const userData = this.getUserDataFromStorage();
    if (userData) {
      this.userData = userData;
    }
    return userData;
  }

  updateUserData(updatedData) {
    // 🔹 Đọc userData mới nhất từ localStorage
    const currentUserData = this.getUserDataFromStorage();
    if (!currentUserData) return null;

    // 🔹 Merge với data mới, đảm bảo email được giữ nguyên từ currentUserData
    const updatedUser = {
      ...currentUserData,
      ...updatedData,
      // 🔹 Giữ nguyên email từ currentUserData (không cho phép thay đổi email qua updateUserData)
      email: currentUserData.email,
    };

    // 🔹 Clear và lưu lại vào localStorage (có áp dụng override nếu cần)
    const syncedUser = this.setAuthData(this.authToken, updatedUser);

    console.log(
      "✅ UserData updated in localStorage:",
      syncedUser.name || syncedUser.user_name,
      "email:",
      syncedUser.email
    );

    return syncedUser;
  }

  // ==================== AUTHENTICATION APIs ====================

  async loginUser(credentials) {
    try {
      console.log("🔐 LOGIN:", credentials.email);

      const response = await httpClient.post(
        API_ENDPOINTS.auth.login,
        credentials
      );

      if (response.success) {
        // Backend returns: { success, message, token, user }
        // httpClient wraps it: { success, data: { success, message, token, user }, token: data.token, message }
        const token = response.token || response.data?.token;
        const user = response.data?.user || response.data;

        console.log("🔍 Login response:", {
          hasToken: !!token,
          hasUser: !!user,
          tokenSource: response.token
            ? "response.token"
            : response.data?.token
              ? "response.data.token"
              : "none",
          responseKeys: Object.keys(response),
        });

        if (token && user) {
          console.log(
            "📥 Backend response - user.email:",
            user.email,
            "user.user_name:",
            user.user_name
          );

          // ✅ Map backend fields (user_name, phone_number) to frontend fields (name, phone)
          const mappedUser = {
            ...user,
            name: user.user_name || user.name || "Người dùng",
            phone: user.phone_number || user.phone || "",
            // Giữ nguyên các field khác
            email: user.email,
            avatar: user.avatar,
            address: user.address || "",
            account_id: user.account_id,
            role: user.role,
          };

          console.log(
            "🔄 Mapped user - email:",
            mappedUser.email,
            "name:",
            mappedUser.name
          );

          const syncedUser = this.setAuthData(token, mappedUser) || mappedUser;
          console.log("✅ Login success - Token saved to localStorage");
          console.log("🔑 Token preview:", token.substring(0, 20) + "...");

          // Return formatted response
          return {
            success: true,
            token: token,
            data: syncedUser,
          };
        } else {
          console.error("❌ Login failed - Missing token or user:", {
            token: !!token,
            user: !!user,
          });
        }
      }

      return response;
    } catch (error) {
      console.error("❌ Login error:", error);
      return {
        success: false,
        error: error.message || "Đăng nhập thất bại",
      };
    }
  }

  async registerUser(userData) {
    try {
      console.log("📝 REGISTER:", userData.email);

      const response = await httpClient.post(API_ENDPOINTS.auth.register, {
        email: userData.email,
        password: userData.password,
        user_name: userData.name || userData.user_name,
        phone_number: userData.phone || userData.phone_number,
      });

      if (response.success) {
        // Backend returns: { success, message, token, user }
        // httpClient wraps it: { success, data: { success, message, token, user }, token: data.token, message }
        const token = response.token || response.data?.token;
        const user = response.data?.user || response.data;

        console.log("🔍 Register response:", {
          hasToken: !!token,
          hasUser: !!user,
          tokenSource: response.token
            ? "response.token"
            : response.data?.token
              ? "response.data.token"
              : "none",
        });

        if (token && user) {
          // ✅ Map backend fields (user_name, phone_number) to frontend fields (name, phone)
          const mappedUser = {
            ...user,
            name: user.user_name || user.name || "Người dùng",
            phone: user.phone_number || user.phone || "",
            // Giữ nguyên các field khác
            email: user.email,
            avatar: user.avatar,
            address: user.address || "",
            account_id: user.account_id,
            role: user.role,
          };

          // ✅ KHÔNG tự động lưu token vào localStorage khi đăng ký
          // Component sẽ tự quyết định có lưu token hay không (tùy vào flow)
          console.log(
            "✅ Register success - Token available but not saved to localStorage"
          );
          console.log("🔑 Token preview:", token.substring(0, 20) + "...");

          // Return formatted response
          return {
            success: true,
            token: token,
            data: mappedUser,
          };
        } else {
          console.error("❌ Register failed - Missing token or user:", {
            token: !!token,
            user: !!user,
          });
        }
      }

      return response;
    } catch (error) {
      console.error("❌ Register error:", error);
      return {
        success: false,
        error: error.message || "Đăng ký thất bại",
      };
    }
  }

  // ==================== OTP APIs ====================

  /**
   * Request OTP for registration
   * @param {Object} data - { email, password }
   * @returns {Promise<Object>}
   */
  async requestOtp(data) {
    try {
      console.log("📧 REQUEST OTP:", data.email);

      const response = await httpClient.post(API_ENDPOINTS.auth.requestOtp, {
        email: data.email,
        password: data.password,
      });

      return response;
    } catch (error) {
      console.error("❌ Request OTP error:", error);
      return {
        success: false,
        error: error.message || "Không thể gửi mã OTP",
      };
    }
  }

  /**
   * Verify OTP and complete registration
   * @param {Object} data - { email, otp }
   * @returns {Promise<Object>}
   */
  async verifyOtp(data) {
    try {
      console.log("✅ VERIFY OTP:", data.email);

      const response = await httpClient.post(API_ENDPOINTS.auth.verifyOtp, {
        email: data.email,
        otp: data.otp,
      });

      return response;
    } catch (error) {
      console.error("❌ Verify OTP error:", error);
      return {
        success: false,
        error: error.message || "Xác minh OTP thất bại",
      };
    }
  }

  /**
   * Request OTP for password reset
   * @param {string} email
   * @returns {Promise<Object>}
   */
  async requestPasswordResetOtp(email) {
    try {
      console.log("📧 REQUEST PASSWORD RESET OTP:", email);

      const response = await httpClient.post(
        API_ENDPOINTS.auth.requestPasswordReset,
        {
          email,
        }
      );

      return response;
    } catch (error) {
      console.error("❌ Request password reset OTP error:", error);
      return {
        success: false,
        error: error.message || "Không thể gửi mã OTP đặt lại mật khẩu",
      };
    }
  }

  /**
   * Verify OTP for password reset (without resetting password)
   * @param {Object} data - { email, otp }
   * @returns {Promise<Object>}
   */
  async verifyPasswordResetOtp(data) {
    try {
      console.log("🔍 VERIFY PASSWORD RESET OTP:", data.email);

      const response = await httpClient.post(
        API_ENDPOINTS.auth.verifyPasswordResetOtp,
        {
          email: data.email,
          otp: data.otp,
        }
      );

      return response;
    } catch (error) {
      console.error("❌ Verify password reset OTP error:", error);
      return {
        success: false,
        error: error.message || "Mã OTP không hợp lệ hoặc đã hết hạn",
      };
    }
  }

  /**
   * Reset password using OTP
   * @param {Object} data - { email, otp, newPassword }
   * @returns {Promise<Object>}
   */
  async resetPassword(data) {
    try {
      console.log("🔄 RESET PASSWORD:", data.email);

      const response = await httpClient.post(API_ENDPOINTS.auth.resetPassword, {
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword,
      });

      return response;
    } catch (error) {
      console.error("❌ Reset password error:", error);
      return {
        success: false,
        error: error.message || "Đặt lại mật khẩu thất bại",
      };
    }
  }

  // ==================== FIXED getUserProfile ====================
  async getUserProfile() {
    try {
      if (!this.isAuthenticated()) {
        return { success: false, error: "Chưa đăng nhập" };
      }

      const response = await httpClient.get(
        API_ENDPOINTS.auth.profile,
        {},
        {},
        { preferUserToken: true }
      );

      if (response.success && response.data) {
        const user = response.data.user || response.data;

        let mappedUser = {
          ...user,
          name: user.user_name || user.name || "Người dùng",
          phone: user.phone_number || user.phone || "",
          email: user.email,
          avatar: user.avatar,
          address: user.address || "",
          account_id: user.account_id,
          role: user.role,
        };

        // ⛔ KHÔNG GỌI setAuthData() TẠI ĐÂY
        return {
          ...response,
          data: {
            ...response.data,
            user: mappedUser,
          },
        };
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message || "Không thể lấy thông tin người dùng",
      };
    }
  }

  // ==================== GET OTHER USER PROFILE ====================
  async getUserProfileById(userId) {
    try {
      if (!this.isAuthenticated()) {
        return { success: false, error: "Chưa đăng nhập" };
      }

      // Gọi API lấy thông tin user khác (cần backend hỗ trợ endpoint này)
      // Nếu chưa có endpoint riêng, có thể dùng endpoint admin hoặc endpoint public profile
      // Tạm thời giả định có endpoint /api/auth/profile/:id hoặc tương tự
      // Hoặc dùng endpoint lấy bài đăng của user đó để lấy info

      // UPDATE: Backend chưa có endpoint get profile by ID cho user thường.
      // Tuy nhiên, ta có thể lấy thông tin từ Chat hoặc Post.
      // Ở đây ta sẽ mock tạm hoặc gọi API nếu có.

      // Nếu backend hỗ trợ:
      // const response = await httpClient.get(`${API_ENDPOINTS.auth.profile}/${userId}`);

      // Hiện tại chưa có endpoint, ta sẽ trả về null để UserProfile tự xử lý (dùng data từ chat/post)
      // Hoặc nếu cần thiết, ta sẽ thêm endpoint vào backend sau.

      // Tạm thời trả về lỗi để FE biết chưa support
      return { success: false, error: "API chưa hỗ trợ lấy profile user khác" };

    } catch (error) {
      return {
        success: false,
        error: error.message || "Không thể lấy thông tin người dùng",
      };
    }
  }

  // ==================== FIXED updateUserProfile ====================
  async updateUserProfile(profileData) {
    try {
      if (!this.isAuthenticated()) {
        return { success: false, error: "Chưa đăng nhập" };
      }
      // ⛔ FE BLOCK: Không cho admin đổi tên
      if (this.userData?.role === "Admin") {
        delete profileData.user_name;
        delete profileData.name;
      }

      console.log("✏️ UPDATE USER PROFILE:", profileData);

      const response = await httpClient.put(
        API_ENDPOINTS.auth.updateProfile,
        profileData
      );

      if (response.success && response.data) {
        const updatedUser = response.data.user || response.data;

        const mappedUser = {
          ...updatedUser,
          name: updatedUser.user_name || updatedUser.name || "Người dùng",
          phone: updatedUser.phone_number || updatedUser.phone || "",
          email: updatedUser.email,
          avatar: updatedUser.avatar,
          address: updatedUser.address || "",
          account_id: updatedUser.account_id,
          role: updatedUser.role,
        };

        const syncedUser =
          this.setAuthData(this.authToken, mappedUser) || mappedUser;

        console.log("✅ Profile updated successfully:", syncedUser);

        return {
          ...response,
          data: {
            ...response.data,
            user: syncedUser,
          },
        };
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message || "Không thể cập nhật thông tin người dùng",
      };
    }
  }
  // Alias for compatibility
  async updateProfile(profileData) {
    return this.updateUserProfile(profileData);
  }

  async getProfile() {
    return this.getUserProfile();
  }

  async changePassword({ currentPassword, newPassword }) {
    try {
      console.log("🔐 CHANGE PASSWORD");

      const response = await httpClient.post(
        API_ENDPOINTS.accounts.changePassword,
        {
          currentPassword,
          newPassword,
        }
      );

      return response;
    } catch (error) {
      console.error("❌ Change password error:", error);
      return {
        success: false,
        error: error.message || "Đổi mật khẩu thất bại",
      };
    }
  }

  // ==================== POSTS APIs ====================

  async getPosts(filters = {}) {
    try {
      const response = await httpClient.get(
        API_ENDPOINTS.posts.getAll,
        filters
      );

      if (!response.success || !response.data) return response;

      const rawPosts = response.data.posts || response.data;

      // 🔥 Lấy user hiện tại để sửa lại tên author cho bài của mình
      const currentUser = this.getCurrentUser();

      const posts = rawPosts.map((post) => {
        // ⚙️ Lấy accountId (nếu backend có trả)
        const accountId = post.accountId || post.account_id || null;

        return {
          id: post.id,
          type: post.type,
          title: post.title,
          description: post.description,
          category: post.category,
          location: post.location,

          // Ảnh
          images: Array.isArray(post.images) ? post.images : [],
          image:
            (Array.isArray(post.images) && post.images[0]) ||
            post.image ||
            null,

          status: post.status,

          // ⏰ GIỮ NGUYÊN TIMESTAMP BE TRẢ VỀ (đã là ms rồi, KHÔNG parse lại)
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          approvedAt: post.approvedAt,
          displayTime: post.displayTime,

          // Thông tin owner
          accountId,
          contact: post.contact,

          // 👤 FIX TÊN USER: nếu là bài của user hiện tại → ép dùng tên trong localStorage
          author:
            currentUser &&
              accountId &&
              (accountId === currentUser.account_id ||
                accountId === currentUser.accountId)
              ? currentUser.name || currentUser.user_name || post.author
              : post.author,
        };
      });

      return {
        success: true,
        data: posts,
        pagination: response.data.pagination,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Không thể lấy danh sách bài đăng",
      };
    }
  }

  // Alias for compatibility
  async getAllPosts(filters = {}) {
    return this.getPosts(filters);
  }

  async createPost(postData) {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: "Bạn cần đăng nhập để tạo bài đăng",
        };
      }

      const response = await httpClient.post(
        API_ENDPOINTS.posts.create,
        postData,
        {},
        { preferUserToken: true } // 🔥 FIX QUAN TRỌNG
      );

      return response;
    } catch (error) {
      console.error("❌ Create post error:", error);
      return {
        success: false,
        error: error.message || "Không thể tạo bài đăng",
      };
    }
  }

  async getMyPosts() {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: "Bạn cần đăng nhập để xem bài đăng của mình",
        };
      }

      const response = await httpClient.get(
        API_ENDPOINTS.posts.getMyPosts,
        {},
        {},
        { preferUserToken: true } // 🔥 BẮT BUỘC
      );

      if (response.success && response.data) {
        const posts = response.data.posts || response.data;
        return {
          success: true,
          data: Array.isArray(posts) ? posts : [],
        };
      }

      return response;
    } catch (error) {
      console.error("❌ Get my posts error:", error);
      return {
        success: false,
        error: error.message || "Không thể lấy danh sách bài đăng của bạn",
        data: [],
      };
    }
  }

  async updatePost(postId, type, updateData) {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: "Bạn cần đăng nhập để cập nhật bài đăng",
        };
      }

      if (!type || !["lost", "found"].includes(type.toLowerCase())) {
        return {
          success: false,
          error: "Type is required (lost or found)",
        };
      }

      const response = await httpClient.put(
        `${API_ENDPOINTS.posts.update(postId)}?type=${type.toLowerCase()}`,
        updateData,
        {},
        { preferUserToken: true } // 🔥 BẮT BUỘC
      );

      return response;
    } catch (error) {
      console.error("❌ Update post error:", error);
      return {
        success: false,
        error: error.message || "Không thể cập nhật bài đăng",
      };
    }
  }

  async deletePost(postId, type) {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: "Bạn cần đăng nhập để xóa bài đăng",
        };
      }

      if (!type || !["lost", "found"].includes(type.toLowerCase())) {
        return {
          success: false,
          error: "Type is required (lost or found)",
        };
      }

      const response = await httpClient.delete(
        API_ENDPOINTS.posts.delete(postId),
        { type: type.toLowerCase() },
        {},
        { preferUserToken: true } // 🔥 BẮT BUỘC
      );

      return response;
    } catch (error) {
      console.error("❌ Delete post error:", error);
      return {
        success: false,
        error: error.message || "Không thể xóa bài đăng",
      };
    }
  }

  async incrementPostView(postId, type) {
    try {
      if (!type || !['lost', 'found'].includes(type.toLowerCase())) {
        console.error('❌ Invalid type for incrementPostView:', type);
        return { success: false, error: 'Invalid type' };
      }

      const response = await httpClient.post(
        `/posts/${postId}/view?type=${type.toLowerCase()}`,
        {},
        {},
        { preferUserToken: false } // Public endpoint, no auth required
      );

      return response;
    } catch (error) {
      console.error('❌ Increment view error:', error);
      // Silent failure - don't show error to user
      return { success: false, error: error.message };
    }
  }

  async getPostComments(postId) {
    // TODO: Backend endpoint chưa có
    return {
      success: true,
      data: [],
    };
  }

  async addComment(postId, comment) {
    // TODO: Backend endpoint chưa có
    return {
      success: false,
      error: "Chức năng bình luận chưa được triển khai",
    };
  }

  async toggleLike(postId) {
    // TODO: Backend endpoint chưa có
    return {
      success: false,
      error: "Chức năng thích bài đăng chưa được triển khai",
    };
  }

  // ==================== CATEGORIES & LOCATIONS APIs ====================

  async getCategories() {
    try {
      const response = await httpClient.get(API_ENDPOINTS.categories.getAll);

      if (response.success && response.data) {
        // Format to array of strings for compatibility
        const categories = Array.isArray(response.data)
          ? response.data.map((c) => c.name || c)
          : [
            "Ví/Túi",
            "Điện thoại",
            "Laptop",
            "Chìa khóa",
            "Sách vở",
            "Phụ kiện",
            "Khác",
          ];

        return {
          success: true,
          data: categories,
        };
      }

      // Fallback categories
      return {
        success: true,
        data: [
          "Ví/Túi",
          "Điện thoại",
          "Laptop",
          "Chìa khóa",
          "Sách vở",
          "Phụ kiện",
          "Khác",
        ],
      };
    } catch (error) {
      console.error("❌ Get categories error:", error);
      return {
        success: true,
        data: [
          "Ví/Túi",
          "Điện thoại",
          "Laptop",
          "Chìa khóa",
          "Sách vở",
          "Phụ kiện",
          "Khác",
        ],
      };
    }
  }

  async getLocations() {
    try {
      const response = await httpClient.get(API_ENDPOINTS.locations.getAll);

      if (response.success && response.data) {
        // Format to array of strings for compatibility
        const locations = Array.isArray(response.data)
          ? response.data.map((l) => l.formatted || l.address || l)
          : [
            "Thư viện DTU",
            "Canteen DTU",
            "Phòng máy tính A1",
            "Khu ký túc xá",
          ];

        return {
          success: true,
          data: locations,
        };
      }

      // Fallback locations
      return {
        success: true,
        data: [
          "Thư viện DTU",
          "Canteen DTU",
          "Phòng máy tính A1",
          "Khu ký túc xá",
        ],
      };
    } catch (error) {
      console.error("❌ Get locations error:", error);
      return {
        success: true,
        data: [
          "Thư viện DTU",
          "Canteen DTU",
          "Phòng máy tính A1",
          "Khu ký túc xá",
        ],
      };
    }
  }

  // ==================== ADMIN APIs ====================

  async approvePost(postId, type) {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: "Bạn cần đăng nhập để duyệt bài",
        };
      }

      console.log(`🔐 Approving post ${postId} (type: ${type})`);

      const response = await httpClient.patch(
        `/posts/${postId}/approve?type=${type}`,
        {}
      );

      return response;
    } catch (error) {
      console.error("❌ Approve post error:", error);
      return {
        success: false,
        error: error.message || "Không thể duyệt bài đăng",
      };
    }
  }

  async rejectPost(postId, type, reason = "") {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: "Bạn cần đăng nhập để từ chối bài",
        };
      }

      console.log(`❌ Rejecting post ${postId} (type: ${type})`);

      const response = await httpClient.patch(
        `/posts/${postId}/reject?type=${type}`,
        { reason }
      );

      return response;
    } catch (error) {
      console.error("❌ Reject post error:", error);
      return {
        success: false,
        error: error.message || "Không thể từ chối bài đăng",
      };
    }
  }

  // ==================== CHAT APIs ====================

  /**
   * Get all conversations for current user
   * @returns {Promise<Object>}
   */
  async getConversations() {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: "Bạn cần đăng nhập để xem tin nhắn",
        };
      }

      console.log("💬 GET CONVERSATIONS");

      const response = await httpClient.get(
        "/chat/conversations",
        {},
        {},
        { preferUserToken: true }
      );

      return response;
    } catch (error) {
      console.error("❌ Get conversations error:", error);
      return {
        success: false,
        error: error.message || "Không thể lấy danh sách cuộc trò chuyện",
      };
    }
  }

  /**
   * Create or get conversation by post
   * @param {number} postId - ID of the post
   * @param {string} postType - 'lost' or 'found'
   * @param {number} targetAccountId - Account ID of post owner
   * @returns {Promise<Object>}
   */
  async createOrGetConversationByPost(postId, postType, targetAccountId) {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: "Bạn cần đăng nhập để bắt đầu trò chuyện",
        };
      }

      console.log("💬 CREATE/GET CONVERSATION BY POST:", { postId, postType, targetAccountId });

      const response = await httpClient.post(
        "/chat/conversations/by-post",
        {
          post_id: postId,
          post_type: postType,
          target_account_id: targetAccountId,
        },
        {},
        { preferUserToken: true }
      );

      return response;
    } catch (error) {
      console.error("❌ Create/get conversation by post error:", error);
      return {
        success: false,
        error: error.message || "Không thể tạo cuộc trò chuyện",
      };
    }
  }

  /**
   * Get messages for a conversation
   * @param {number} conversationId
   * @param {Object} options - { limit, offset }
   * @returns {Promise<Object>}
   */
  async getConversationMessages(conversationId, options = {}) {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: "Bạn cần đăng nhập để xem tin nhắn",
        };
      }

      console.log("💬 GET MESSAGES:", conversationId);

      const response = await httpClient.get(
        `/chat/conversations/${conversationId}/messages`,
        options,
        {},
        { preferUserToken: true }
      );

      return response;
    } catch (error) {
      console.error("❌ Get conversation messages error:", error);
      return {
        success: false,
        error: error.message || "Không thể lấy tin nhắn",
      };
    }
  }

  /**
   * Send message in a conversation
   * @param {number} conversationId
   * @param {string} message
   * @returns {Promise<Object>}
   */
  async sendMessage(conversationId, message) {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: "Bạn cần đăng nhập để gửi tin nhắn",
        };
      }

      console.log("💬 SEND MESSAGE:", conversationId);

      const response = await httpClient.post(
        `/chat/conversations/${conversationId}/messages`,
        { message },
        {},
        { preferUserToken: true }
      );

      return response;
    } catch (error) {
      console.error("❌ Send message error:", error);
      return {
        success: false,
        error: error.message || "Không thể gửi tin nhắn",
      };
    }
  }

  /**
   * Mark all messages as read in a conversation
   * @param {number} conversationId
   * @returns {Promise<Object>}
   */
  async markMessagesAsRead(conversationId) {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: "Bạn cần đăng nhập",
        };
      }

      console.log("✓✓ MARK MESSAGES AS READ:", conversationId);

      const response = await httpClient.patch(
        `/chat/conversations/${conversationId}/messages/read`,
        {},
        {},
        { preferUserToken: true }
      );

      return response;
    } catch (error) {
      console.error("❌ Mark messages as read error:", error);
      return {
        success: false,
        error: error.message || "Không thể đánh dấu tin nhắn đã đọc",
      };
    }
  }


  /**
   * Delete conversation (soft delete for current user)
   * @param {number} conversationId
   * @returns {Promise<Object>}
   */
  async deleteConversation(conversationId) {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: "Bạn cần đăng nhập để xóa cuộc trò chuyện",
        };
      }

      console.log("💬 DELETE CONVERSATION:", conversationId);

      const response = await httpClient.delete(
        `/chat/conversations/${conversationId}`,
        {},
        {},
        { preferUserToken: true }
      );

      return response;
    } catch (error) {
      console.error("❌ Delete conversation error:", error);
      return {
        success: false,
        error: error.message || "Không thể xóa cuộc trò chuyện",
      };
    }
  }

  // ==================== NOTIFICATION APIs ====================

  /**
   * Get all notifications for current user
   * @param {Object} filters - { is_read, limit }
   * @returns {Promise<Object>}
   */
  async getNotifications(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.is_read !== undefined) {
        params.append('is_read', filters.is_read);
      }
      if (filters.limit) {
        params.append('limit', filters.limit);
      }

      const queryString = params.toString();
      const endpoint = queryString ? `/notifications?${queryString}` : '/notifications';

      const response = await httpClient.get(endpoint, {}, {}, { preferUserToken: true });

      return response;
    } catch (error) {
      console.error("❌ Get notifications error:", error);
      return {
        success: false,
        error: error.message || "Không thể lấy danh sách thông báo",
      };
    }
  }

  /**
   * Get unread notification count
   * @returns {Promise<Object>}
   */
  async getUnreadCount() {
    try {
      const response = await httpClient.get('/notifications/unread-count', {}, {}, { preferUserToken: true });

      return response;
    } catch (error) {
      console.error("❌ Get unread count error:", error);
      return {
        success: false,
        error: error.message || "Không thể lấy số lượng thông báo chưa đọc",
      };
    }
  }

  /**
   * Mark notification as read
   * @param {number} notificationId
   * @returns {Promise<Object>}
   */
  async markNotificationAsRead(notificationId) {
    try {
      const response = await httpClient.put(
        `/notifications/${notificationId}/read`,
        {},
        {},
        { preferUserToken: true }
      );

      return response;
    } catch (error) {
      console.error("❌ Mark notification as read error:", error);
      return {
        success: false,
        error: error.message || "Không thể đánh dấu thông báo đã đọc",
      };
    }
  }

  /**
   * Mark all notifications as read
   * @returns {Promise<Object>}
   */
  async markAllNotificationsAsRead() {
    try {
      const response = await httpClient.put(
        '/notifications/mark-all-read',
        {},
        {},
        { preferUserToken: true }
      );

      return response;
    } catch (error) {
      console.error("❌ Mark all notifications as read error:", error);
      return {
        success: false,
        error: error.message || "Không thể đánh dấu tất cả thông báo đã đọc",
      };
    }
  }

  /**
   * Delete a notification
   * @param {number} notificationId
   * @returns {Promise<Object>}
   */
  async deleteNotification(notificationId) {
    try {
      const response = await httpClient.delete(
        `/notifications/${notificationId}`,
        {},
        {},
        { preferUserToken: true }
      );

      return response;
    } catch (error) {
      console.error("❌ Delete notification error:", error);
      return {
        success: false,
        error: error.message || "Không thể xóa thông báo",
      };
    }
  }
}

// Export singleton instance
const realApiService = new RealApiService();
export default realApiService;
