/**
 * Real API Service - THAY THẾ userApi.js
 * Kết nối trực tiếp với backend thật
 * 
 * HƯỚNG DẪN MIGRATE:
 * 1. Trong components, import: import apiService from '../services/api';
 * 2. Thay thế: userApi.loginUser() → apiService.loginUser()
 * 3. Tất cả methods giữ nguyên tên, chỉ thay đối tượng
 */

import httpClient from './httpClient';
import { API_ENDPOINTS, STORAGE_KEYS } from './apiConfig';

class RealApiService {
  constructor() {
    this.authToken = localStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    this.userData = this.getUserDataFromStorage();
  }

  // ==================== STORAGE MANAGEMENT ====================
  
  getUserDataFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  setAuthData(token, userData) {
    this.authToken = token;
    this.userData = userData;
    localStorage.setItem(STORAGE_KEYS.USER_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  }

  clearAuthData() {
    this.authToken = null;
    this.userData = null;
    localStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }

  isAuthenticated() {
    return !!this.authToken && !!this.userData;
  }

  getCurrentUser() {
    return this.getUserDataFromStorage();
  }

  updateUserData(updatedData) {
    if (!this.userData) return null;
    
    const updatedUser = {
      ...this.userData,
      ...updatedData,
    };
    
    this.setAuthData(this.authToken, updatedUser);
    return updatedUser;
  }

  // ==================== AUTHENTICATION APIs ====================

  async loginUser(credentials) {
    try {
      console.log('🔐 LOGIN:', credentials.email);
      
      const response = await httpClient.post(API_ENDPOINTS.auth.login, credentials);

      if (response.success) {
        // Backend returns: { success, message, token, user }
        // httpClient wraps it: { success, data: { success, message, token, user }, message }
        const token = response.data?.token || response.token;
        const user = response.data?.user || response.data;
        
        if (token && user) {
          this.setAuthData(token, user);
          console.log('✅ Login success');
          
          // Return formatted response
          return {
            success: true,
            token: token,
            data: user,
          };
        }
      }

      return response;
    } catch (error) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        error: error.message || 'Đăng nhập thất bại',
      };
    }
  }

  async registerUser(userData) {
    try {
      console.log('📝 REGISTER:', userData.email);
      
      const response = await httpClient.post(API_ENDPOINTS.auth.register, {
        email: userData.email,
        password: userData.password,
        user_name: userData.name || userData.user_name,
        phone_number: userData.phone || userData.phone_number,
      });

      if (response.success) {
        // Backend returns: { success, message, token, user }
        // httpClient wraps it: { success, data: { success, message, token, user }, message }
        const token = response.data?.token || response.token;
        const user = response.data?.user || response.data;
        
        if (token && user) {
          this.setAuthData(token, user);
          console.log('✅ Register success');
          
          // Return formatted response
          return {
            success: true,
            token: token,
            data: user,
          };
        }
      }

      return response;
    } catch (error) {
      console.error('❌ Register error:', error);
      return {
        success: false,
        error: error.message || 'Đăng ký thất bại',
      };
    }
  }

  async getUserProfile() {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Chưa đăng nhập',
        };
      }

      const response = await httpClient.get(API_ENDPOINTS.auth.profile);

      if (response.success && response.data) {
        const user = response.data.user || response.data;
        this.setAuthData(this.authToken, user);
      }

      return response;
    } catch (error) {
      console.error('❌ Get profile error:', error);
      return {
        success: false,
        error: error.message || 'Không thể lấy thông tin người dùng',
      };
    }
  }

  async updateUserProfile(profileData) {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Chưa đăng nhập',
        };
      }

      console.log('✏️ UPDATE USER PROFILE:', profileData);
      
      const response = await httpClient.put(API_ENDPOINTS.auth.updateProfile, profileData);

      if (response.success && response.data) {
        // Update user data in storage
        const updatedUser = response.data.user || response.data;
        this.setAuthData(this.authToken, updatedUser);
        console.log('✅ Profile updated successfully');
      }

      return response;
    } catch (error) {
      console.error('❌ Update profile error:', error);
      return {
        success: false,
        error: error.message || 'Không thể cập nhật thông tin người dùng',
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
    // TODO: Backend endpoint chưa có
    console.warn('⚠️ Change password endpoint not implemented');
    return {
      success: false,
      error: 'Chức năng đổi mật khẩu chưa được triển khai',
    };
  }

  // ==================== POSTS APIs ====================

  async getPosts(filters = {}) {
    try {
      const response = await httpClient.get(API_ENDPOINTS.posts.getAll, filters);

      // Format response to match frontend expectations
      if (response.success && response.data) {
        const posts = response.data.posts || response.data;
        const pagination = response.data.pagination;

        return {
          success: true,
          data: posts,
          pagination: pagination,
        };
      }

      return response;
    } catch (error) {
      console.error('❌ Get posts error:', error);
      return {
        success: false,
        error: error.message || 'Không thể lấy danh sách bài đăng',
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
          error: 'Bạn cần đăng nhập để tạo bài đăng',
        };
      }

      const response = await httpClient.post(API_ENDPOINTS.posts.create, postData);

      return response;
    } catch (error) {
      console.error('❌ Create post error:', error);
      return {
        success: false,
        error: error.message || 'Không thể tạo bài đăng',
      };
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
      error: 'Chức năng bình luận chưa được triển khai',
    };
  }

  async toggleLike(postId) {
    // TODO: Backend endpoint chưa có
    return {
      success: false,
      error: 'Chức năng thích bài đăng chưa được triển khai',
    };
  }

  // ==================== CATEGORIES & LOCATIONS APIs ====================

  async getCategories() {
    try {
      const response = await httpClient.get(API_ENDPOINTS.categories.getAll);

      if (response.success && response.data) {
        // Format to array of strings for compatibility
        const categories = Array.isArray(response.data) 
          ? response.data.map(c => c.name || c)
          : ['Ví/Túi', 'Điện thoại', 'Laptop', 'Chìa khóa', 'Sách vở', 'Phụ kiện', 'Khác'];

        return {
          success: true,
          data: categories,
        };
      }

      // Fallback categories
      return {
        success: true,
        data: ['Ví/Túi', 'Điện thoại', 'Laptop', 'Chìa khóa', 'Sách vở', 'Phụ kiện', 'Khác'],
      };
    } catch (error) {
      console.error('❌ Get categories error:', error);
      return {
        success: true,
        data: ['Ví/Túi', 'Điện thoại', 'Laptop', 'Chìa khóa', 'Sách vở', 'Phụ kiện', 'Khác'],
      };
    }
  }

  async getLocations() {
    try {
      const response = await httpClient.get(API_ENDPOINTS.locations.getAll);

      if (response.success && response.data) {
        // Format to array of strings for compatibility
        const locations = Array.isArray(response.data)
          ? response.data.map(l => l.formatted || l.address || l)
          : ['Thư viện DTU', 'Canteen DTU', 'Phòng máy tính A1', 'Khu ký túc xá'];

        return {
          success: true,
          data: locations,
        };
      }

      // Fallback locations
      return {
        success: true,
        data: ['Thư viện DTU', 'Canteen DTU', 'Phòng máy tính A1', 'Khu ký túc xá'],
      };
    } catch (error) {
      console.error('❌ Get locations error:', error);
      return {
        success: true,
        data: ['Thư viện DTU', 'Canteen DTU', 'Phòng máy tính A1', 'Khu ký túc xá'],
      };
    }
  }

  // ==================== ADMIN APIs ====================

  async approvePost(postId, type) {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Bạn cần đăng nhập để duyệt bài',
        };
      }

      console.log(`🔐 Approving post ${postId} (type: ${type})`);

      const response = await httpClient.patch(
        `/posts/${postId}/approve?type=${type}`,
        {}
      );

      return response;
    } catch (error) {
      console.error('❌ Approve post error:', error);
      return {
        success: false,
        error: error.message || 'Không thể duyệt bài đăng',
      };
    }
  }

  async rejectPost(postId, type, reason = '') {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Bạn cần đăng nhập để từ chối bài',
        };
      }

      console.log(`❌ Rejecting post ${postId} (type: ${type})`);

      const response = await httpClient.patch(
        `/posts/${postId}/reject?type=${type}`,
        { reason }
      );

      return response;
    } catch (error) {
      console.error('❌ Reject post error:', error);
      return {
        success: false,
        error: error.message || 'Không thể từ chối bài đăng',
      };
    }
  }
}

// Export singleton instance
const realApiService = new RealApiService();
export default realApiService;

