/**
 * API Service - Kết nối trực tiếp với Backend
 * File này thay thế userApi.js và adminApi.js với real API calls
 */

import httpClient from './httpClient';
import { API_ENDPOINTS, STORAGE_KEYS } from './apiConfig';

class ApiService {
  constructor() {
    this.authToken = localStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    this.userData = this.getUserDataFromStorage();
  }

  // ==================== STORAGE MANAGEMENT ====================
  
  /**
   * Get user data from localStorage
   */
  getUserDataFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  /**
   * Save authentication data
   */
  setAuthData(token, userData) {
    this.authToken = token;
    this.userData = userData;
    localStorage.setItem(STORAGE_KEYS.USER_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  }

  /**
   * Clear authentication data
   */
  clearAuthData() {
    this.authToken = null;
    this.userData = null;
    localStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.authToken && !!this.userData;
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.getUserDataFromStorage();
  }

  // ==================== AUTHENTICATION APIs ====================

  /**
   * Register new user
   * @param {Object} userData - { email, password, user_name, phone_number }
   */
  async register(userData) {
    try {
      console.log('📝 Registering user:', userData.email);
      
      const response = await httpClient.post(API_ENDPOINTS.auth.register, userData);

      if (response.success && response.token) {
        // Save authentication data
        this.setAuthData(response.token, response.data.user || response.data);
        console.log('✅ Registration successful');
      }

      return response;
    } catch (error) {
      console.error('❌ Registration error:', error);
      return {
        success: false,
        error: error.message || 'Đăng ký thất bại',
      };
    }
  }

  /**
   * Login user
   * @param {Object} credentials - { email, password }
   */
  async login(credentials) {
    try {
      console.log('🔐 Logging in user:', credentials.email);
      
      const response = await httpClient.post(API_ENDPOINTS.auth.login, credentials);

      if (response.success && response.token) {
        // Save authentication data
        this.setAuthData(response.token, response.data.user || response.data);
        console.log('✅ Login successful');
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

  /**
   * Logout user
   */
  logout() {
    console.log('👋 Logging out user');
    this.clearAuthData();
    return { success: true };
  }

  /**
   * Get user profile
   */
  async getProfile() {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Chưa đăng nhập',
        };
      }

      console.log('👤 Getting user profile');
      
      const response = await httpClient.get(API_ENDPOINTS.auth.profile);

      if (response.success && response.data) {
        // Update user data in storage
        this.setAuthData(this.authToken, response.data.user || response.data);
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

  /**
   * Update user profile
   * @param {Object} profileData - { user_name, phone_number, avatar }
   */
  async updateProfile(profileData) {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Chưa đăng nhập',
        };
      }

      console.log('✏️ Updating user profile:', profileData);
      
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

  // ==================== POSTS APIs ====================

  /**
   * Get all posts with optional filters
   * @param {Object} filters - { type, category, status, search, page, limit }
   */
  async getPosts(filters = {}) {
    try {
      console.log('📋 Getting posts with filters:', filters);
      
      const response = await httpClient.get(API_ENDPOINTS.posts.getAll, filters);

      return response;
    } catch (error) {
      console.error('❌ Get posts error:', error);
      return {
        success: false,
        error: error.message || 'Không thể lấy danh sách bài đăng',
      };
    }
  }

  /**
   * Get post by ID
   * @param {number} id - Post ID
   * @param {string} type - 'lost' or 'found'
   */
  async getPostById(id, type) {
    try {
      console.log(`📄 Getting post ${id} (type: ${type})`);
      
      const response = await httpClient.get(
        API_ENDPOINTS.posts.getById(id),
        { type }
      );

      return response;
    } catch (error) {
      console.error('❌ Get post error:', error);
      return {
        success: false,
        error: error.message || 'Không thể lấy thông tin bài đăng',
      };
    }
  }

  /**
   * Create new post
   * @param {Object} postData - { type, title, description, category, location, images }
   */
  async createPost(postData) {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Bạn cần đăng nhập để tạo bài đăng',
        };
      }

      console.log('📝 Creating post:', postData.title);
      
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

  /**
   * Update post
   * @param {number} id - Post ID
   * @param {string} type - 'lost' or 'found'
   * @param {Object} updateData - Data to update
   */
  async updatePost(id, type, updateData) {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Bạn cần đăng nhập để cập nhật bài đăng',
        };
      }

      console.log(`✏️ Updating post ${id} (type: ${type})`);
      
      const response = await httpClient.put(
        API_ENDPOINTS.posts.update(id),
        updateData,
        { type }
      );

      return response;
    } catch (error) {
      console.error('❌ Update post error:', error);
      return {
        success: false,
        error: error.message || 'Không thể cập nhật bài đăng',
      };
    }
  }

  /**
   * Delete post
   * @param {number} id - Post ID
   * @param {string} type - 'lost' or 'found'
   */
  async deletePost(id, type) {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Bạn cần đăng nhập để xóa bài đăng',
        };
      }

      console.log(`🗑️ Deleting post ${id} (type: ${type})`);
      
      const response = await httpClient.delete(
        API_ENDPOINTS.posts.delete(id),
        { type }
      );

      return response;
    } catch (error) {
      console.error('❌ Delete post error:', error);
      return {
        success: false,
        error: error.message || 'Không thể xóa bài đăng',
      };
    }
  }

  /**
   * Get my posts (posts created by current user)
   */
  async getMyPosts() {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Bạn cần đăng nhập để xem bài đăng của mình',
        };
      }

      console.log('📋 Getting my posts');
      
      const response = await httpClient.get(API_ENDPOINTS.posts.getMyPosts);

      return response;
    } catch (error) {
      console.error('❌ Get my posts error:', error);
      return {
        success: false,
        error: error.message || 'Không thể lấy danh sách bài đăng của bạn',
      };
    }
  }

  /**
   * Get posts by type
   * @param {string} type - 'lost' or 'found'
   * @param {Object} filters - Additional filters
   */
  async getPostsByType(type, filters = {}) {
    try {
      console.log(`📋 Getting ${type} posts`);
      
      const response = await httpClient.get(
        API_ENDPOINTS.posts.getByType(type),
        filters
      );

      return response;
    } catch (error) {
      console.error('❌ Get posts by type error:', error);
      return {
        success: false,
        error: error.message || 'Không thể lấy danh sách bài đăng',
      };
    }
  }

  // ==================== CATEGORIES APIs ====================

  /**
   * Get all categories
   */
  async getCategories() {
    try {
      console.log('📁 Getting categories');
      
      const response = await httpClient.get(API_ENDPOINTS.categories.getAll);

      return response;
    } catch (error) {
      console.error('❌ Get categories error:', error);
      return {
        success: false,
        error: error.message || 'Không thể lấy danh sách danh mục',
        // Fallback to default categories
        data: [
          { id: 1, name: 'Ví/Túi', type: 'both' },
          { id: 2, name: 'Điện thoại', type: 'both' },
          { id: 3, name: 'Laptop', type: 'both' },
          { id: 4, name: 'Chìa khóa', type: 'both' },
          { id: 5, name: 'Sách vở', type: 'both' },
          { id: 6, name: 'Phụ kiện', type: 'both' },
          { id: 7, name: 'Khác', type: 'both' },
        ],
      };
    }
  }

  // ==================== LOCATIONS APIs ====================

  /**
   * Get all locations
   */
  async getLocations() {
    try {
      console.log('📍 Getting locations');
      
      const response = await httpClient.get(API_ENDPOINTS.locations.getAll);

      return response;
    } catch (error) {
      console.error('❌ Get locations error:', error);
      return {
        success: false,
        error: error.message || 'Không thể lấy danh sách địa điểm',
        // Fallback to default locations
        data: [
          { id: 1, building: 'A', room: '101', address: '254 Nguyễn Văn Linh', formatted: 'Tòa A - Phòng 101 - 254 Nguyễn Văn Linh' },
          { id: 2, building: 'B', room: '201', address: '254 Nguyễn Văn Linh', formatted: 'Tòa B - Phòng 201 - 254 Nguyễn Văn Linh' },
          { id: 3, building: 'C', room: 'Thư viện', address: '254 Nguyễn Văn Linh', formatted: 'Tòa C - Thư viện - 254 Nguyễn Văn Linh' },
        ],
      };
    }
  }

  // ==================== COMPATIBILITY METHODS ====================
  // These methods maintain compatibility with existing frontend code

  /**
   * Login user (alias for compatibility)
   */
  async loginUser(credentials) {
    return this.login(credentials);
  }

  /**
   * Register user (alias for compatibility)
   */
  async registerUser(userData) {
    return this.register(userData);
  }

  /**
   * Get user profile (alias for compatibility)
   */
  async getUserProfile() {
    return this.getProfile();
  }

  /**
   * Update user profile (placeholder - needs backend implementation)
   */
  async updateUserProfile(profileData) {
    // TODO: Implement backend endpoint for profile update
    console.warn('⚠️ Update profile endpoint not implemented yet');
    return {
      success: false,
      error: 'Chức năng cập nhật profile chưa được triển khai',
    };
  }

  /**
   * Update user data in localStorage
   */
  updateUserData(updatedData) {
    if (!this.userData) return null;
    
    const updatedUser = {
      ...this.userData,
      ...updatedData,
    };
    
    this.setAuthData(this.authToken, updatedUser);
    return updatedUser;
  }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;

