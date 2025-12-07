// Admin API Service
class AdminApi {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    this.authToken = localStorage.getItem('adminToken');
    this.adminData = JSON.parse(localStorage.getItem('adminData') || 'null');
  }

  // Set authentication data
  setAuthData(token, adminData) {
    this.authToken = token;
    this.adminData = adminData;
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminData', JSON.stringify(adminData));
    
    // ✅ KHÔNG xóa user token khi admin login - cho phép mở 2 tab cùng lúc
    // httpClient sẽ tự động ưu tiên đúng token dựa trên context
    // Chỉ xóa user token khi admin logout
    console.log('✅ Admin token saved (user token preserved for multi-tab support)');
  }

  // Clear authentication data
  clearAuthData() {
    this.authToken = null;
    this.adminData = null;
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    // ✅ Chỉ xóa admin token khi logout, không xóa user token
    console.log('✅ Admin token cleared (user token preserved)');
  }

  // Get current admin data
  getCurrentAdmin() {
    // ✅ Đọc lại từ localStorage để đảm bảo sync với multi-tab
    const data = localStorage.getItem('adminData');
    this.adminData = data ? JSON.parse(data) : null;
    return this.adminData;
  }

  // Get admin user (alias for getCurrentAdmin)
  getAdminUser() {
    // ✅ Đọc lại từ localStorage để đảm bảo sync với multi-tab
    return this.getCurrentAdmin();
  }

  // Check if admin is authenticated
  isAuthenticated() {
    // ✅ Đọc lại từ localStorage mỗi lần check để đảm bảo sync với multi-tab
    const token = localStorage.getItem('adminToken');
    const data = localStorage.getItem('adminData');
    this.authToken = token;
    this.adminData = data ? JSON.parse(data) : null;
    return !!token && !!this.adminData;
  }

  // Login admin
  async loginAdmin(credentials) {
    try {
      // Convert username to full email if needed
      const email = credentials.username.includes('@') 
        ? credentials.username 
        : `${credentials.username}@dtu.edu.vn`;

      // Call real backend API
      const response = await fetch(`${this.baseURL}/accounts/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: credentials.password
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Invalid credentials');
      }

      // Check if user is actually an admin
      if (data.user.role !== 'Admin') {
        throw new Error('Access denied: Admin privileges required');
      }

      // Map backend response to admin format
      const adminData = {
        id: data.user.account_id,
        username: data.user.email.split('@')[0],
        name: data.user.user_name || 'Admin User',
        email: data.user.email,
        role: data.user.role,
        phone: data.user.phone_number,
        avatar: data.user.avatar,
        permissions: ['all']
      };

      // ✅ Lưu token và admin data
      this.setAuthData(data.token, adminData);
      
      // ✅ Log để debug
      console.log('✅ Admin login successful');
      console.log('🔑 Admin token saved:', data.token ? 'Yes' : 'No');
      console.log('📧 Admin email:', adminData.email);
      console.log('👤 Admin role:', adminData.role);
      console.log('🔍 Checking localStorage...');
      console.log('  - adminToken:', localStorage.getItem('adminToken') ? 'Exists' : 'Missing');
      console.log('  - userToken:', localStorage.getItem('userToken') ? 'Exists' : 'Missing');

      return {
        success: true,
        data: adminData,
        token: data.token
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Logout admin
  logoutAdmin() {
    this.clearAuthData();
    return { success: true };
  }

  // Logout (alias for logoutAdmin)
  logout() {
    return this.logoutAdmin();
  }

  // Get admin headers for API requests
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authToken}`
    };
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      
      return {
        success: true,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Admin management methods
  // ✅ Đã xóa mock data - sẽ implement API calls khi backend có endpoints
  async getAdmins() {
    // TODO: Implement API call
    // return await this.request('/accounts/admins');
    return {
      success: false,
      error: 'API endpoint chưa được triển khai'
    };
  }

  async getUsers() {
    // TODO: Implement API call
    // return await this.request('/accounts/users');
    return {
      success: false,
      error: 'API endpoint chưa được triển khai'
    };
  }

  // ✅ Đã xóa mock methods - không còn cần thiết vì đã dùng API thật
  // getLostItems() và getApprovedPosts() đã được thay thế bằng API calls trong components
}

// Create and export singleton instance
const adminApi = new AdminApi();
export default adminApi;
