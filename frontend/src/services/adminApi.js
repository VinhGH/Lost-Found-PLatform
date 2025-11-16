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
  }

  // Clear authentication data
  clearAuthData() {
    this.authToken = null;
    this.adminData = null;
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
  }

  // Get current admin data
  getCurrentAdmin() {
    return this.adminData;
  }

  // Get admin user (alias for getCurrentAdmin)
  getAdminUser() {
    return this.adminData;
  }

  // Check if admin is authenticated
  isAuthenticated() {
    return !!this.authToken && !!this.adminData;
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

      this.setAuthData(data.token, adminData);

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
  async getAdmins() {
    // Mock data for demo
    return {
      success: true,
      data: [
        {
          id: 1,
          name: 'Admin User',
          email: 'admin@dtu.edu.vn',
          username: 'admin',
          role: 'Admin',
          status: 'active',
          lastLogin: '2024-12-20',
          createdDate: '2024-01-01'
        },
        {
          id: 2,
          name: 'Manager User',
          email: 'manager@dtu.edu.vn',
          username: 'manager',
          role: 'Manager',
          status: 'active',
          lastLogin: '2024-12-19',
          createdDate: '2024-02-15'
        },
        {
          id: 3,
          name: 'Support User',
          email: 'support@dtu.edu.vn',
          username: 'support',
          role: 'Support',
          status: 'inactive',
          lastLogin: '2024-12-10',
          createdDate: '2024-03-01'
        }
      ]
    };
  }

  async getUsers() {
    // Mock data for demo
    return {
      success: true,
      data: [
        {
          id: 1,
          name: 'Nguyễn Văn A',
          phone: '0123456789',
          email: 'nguyenvana@dtu.edu.vn',
          role: 'user',
          status: 'active',
          isLocked: false,
          joinDate: '2024-01-15',
          lastActive: '2024-12-20'
        },
        {
          id: 2,
          name: 'Trần Thị B',
          phone: '0987654321',
          email: 'tranthib@dtu.edu.vn',
          role: 'user',
          status: 'inactive',
          isLocked: true,
          joinDate: '2024-02-10',
          lastActive: '2024-12-19'
        }
      ]
    };
  }

  async getLostItems() {
    // Mock data for demo
    return {
      success: true,
      data: [
        {
          id: 1,
          title: 'Mất ví da',
          description: 'Ví da màu nâu, có thẻ sinh viên',
          location: 'Thư viện',
          date: '2024-12-20',
          status: 'pending',
          contact: '0123456789'
        }
      ]
    };
  }

  async getApprovedPosts() {
    // Mock data for demo
    return {
      success: true,
      data: [
        {
          id: 1,
          title: 'Tìm thấy điện thoại',
          description: 'Điện thoại iPhone màu đen',
          location: 'Cafeteria',
          date: '2024-12-19',
          status: 'approved',
          contact: '0987654321'
        }
      ]
    };
  }
}

// Create and export singleton instance
const adminApi = new AdminApi();
export default adminApi;
