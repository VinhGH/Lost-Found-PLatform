// User API Service
class UserApi {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    this.authToken = localStorage.getItem('userToken');
    this.userData = JSON.parse(localStorage.getItem('userData') || 'null');
  }

  // Set authentication data
  setAuthData(token, userData) {
    this.authToken = token;
    this.userData = userData;
    localStorage.setItem('userToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
  }

  // Clear authentication data
  clearAuthData() {
    this.authToken = null;
    this.userData = null;
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
  }

  // Get current user data (merge with saved profile if exists)
  getCurrentUser() {
    // 🔹 Đọc userData từ localStorage mới nhất (không dùng cache)
    try {
      const savedUserData = localStorage.getItem('userData');
      if (!savedUserData) {
        return null;
      }
      
      const userData = JSON.parse(savedUserData);
      if (!userData || !userData.email) {
        return null;
      }
      
      // 🔹 Merge với profile đã lưu nếu có
      const profileKey = `userProfile_${userData.email}`;
      const savedProfile = localStorage.getItem(profileKey);
      if (savedProfile) {
        try {
          const profileData = JSON.parse(savedProfile);
          // Merge profile data với userData (ưu tiên profile data cho name, phone, address, avatar)
          // 🔹 KHÔNG merge email - email luôn lấy từ userData (không cho phép thay đổi)
          const mergedUser = {
            ...userData,
            name: profileData.name || userData.name,
            phone: profileData.phone || userData.phone,
            address: profileData.address || userData.address,
            avatar: profileData.avatar || userData.avatar,
            // 🔹 Email luôn giữ nguyên từ userData (không cho phép thay đổi từ profile)
            email: userData.email,
            // Giữ nguyên các field khác từ userData (id, role, status, etc.)
          };
          // 🔹 Cập nhật this.userData để sync
          this.userData = mergedUser;
          return mergedUser;
        } catch (error) {
          console.error('Error parsing saved profile:', error);
        }
      }
      
      // 🔹 Cập nhật this.userData
      this.userData = userData;
      return userData;
    } catch (error) {
      console.error('Error getting current user:', error);
      return this.userData || null;
    }
  }

  // Update user data (for profile updates)
  updateUserData(updatedData) {
    // 🔹 Đọc userData từ localStorage (không dùng cache)
    try {
      const savedUserData = localStorage.getItem('userData');
      if (!savedUserData) {
        console.warn('⚠️ Không tìm thấy userData trong localStorage');
        return null;
      }
      
      const userData = JSON.parse(savedUserData);
      // 🔹 Loại bỏ email khỏi updatedData nếu có (không cho phép thay đổi email)
      const { email, ...dataWithoutEmail } = updatedData;
      const updatedUser = {
        ...userData,
        ...dataWithoutEmail,
        // 🔹 Email luôn giữ nguyên từ userData gốc (không cho phép thay đổi)
        email: userData.email
      };
      
      // 🔹 Cập nhật vào localStorage và this.userData
      this.setAuthData(this.authToken, updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Error updating user data:', error);
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.authToken && !!this.userData;
  }

  // Login user
  async loginUser(credentials) {
    try {
      // For demo purposes, simulate API call
      if (credentials.email === 'user@dtu.edu.vn' && credentials.password === 'user123') {
        // 🔹 Kiểm tra xem có profile đã lưu không
        const profileKey = `userProfile_${credentials.email}`;
        let savedProfile = null;
        try {
          const saved = localStorage.getItem(profileKey);
          if (saved) {
            savedProfile = JSON.parse(saved);
          }
        } catch (e) {
          console.error('Error loading saved profile:', e);
        }
        
        // 🔹 Tạo userData, merge với profile đã lưu nếu có
        const userData = {
          id: 1,
          name: savedProfile?.name || 'Nguyễn Văn A',
          email: credentials.email,
          phone: savedProfile?.phone || '0123456789',
          studentId: '21IT001',
          role: 'user',
          status: 'active',
          joinDate: '2024-01-15',
          lastActive: '2024-12-20',
          avatar: savedProfile?.avatar || null,
          address: savedProfile?.address || null
        };

        const token = 'user_token_' + Date.now();
        
        this.setAuthData(token, userData);
        
        // 🔹 Lưu profile nếu chưa có
        if (!savedProfile) {
          localStorage.setItem(profileKey, JSON.stringify({
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            address: userData.address || 'Đại học Duy Tân, Đà Nẵng',
            avatar: userData.avatar
          }));
        }
        
        return {
          success: true,
          token: token,
          data: userData
        };
      } else {
        return {
          success: false,
          error: 'Email hoặc mật khẩu không đúng'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Đăng nhập thất bại. Vui lòng thử lại.'
      };
    }
  }

  // Register user
  async registerUser(userData) {
    try {
      // For demo purposes, simulate API call
      const newUser = {
        id: Date.now(),
        name: userData.name || 'User',
        email: userData.email,
        phone: userData.phone || '',
        studentId: userData.studentId || '',
        role: 'user',
        status: 'active',
        joinDate: new Date().toISOString().split('T')[0],
        lastActive: new Date().toISOString().split('T')[0],
        avatar: null,
        address: 'Đại học Duy Tân, Đà Nẵng'
      };

      const token = 'user_token_' + Date.now();
      
      this.setAuthData(token, newUser);
      
      // 🔹 Lưu profile vào localStorage
      const profileKey = `userProfile_${userData.email}`;
      localStorage.setItem(profileKey, JSON.stringify({
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        address: newUser.address,
        avatar: newUser.avatar
      }));
      
      return {
        success: true,
        token: token,
        data: newUser
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Đăng ký thất bại. Vui lòng thử lại.'
      };
    }
  }

  // Get user profile
  async getUserProfile() {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Chưa đăng nhập'
        };
      }

      return {
        success: true,
        data: this.userData
      };
    } catch (error) {
      console.error('Get profile error:', error);
      return {
        success: false,
        error: 'Không thể lấy thông tin người dùng'
      };
    }
  }

  // Update user profile
  async updateUserProfile(profileData) {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Chưa đăng nhập'
        };
      }

      const updatedUser = {
        ...this.userData,
        ...profileData,
        lastActive: new Date().toISOString().split('T')[0]
      };

      this.setAuthData(this.authToken, updatedUser);

      return {
        success: true,
        data: updatedUser
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: 'Không thể cập nhật thông tin'
      };
    }
  }

  // Get posts (lost/found items)
  async getPosts(filters = {}) {
    try {
      // Mock data for posts
      const mockPosts = [
        {
          id: 1,
          title: 'Tìm thấy ví da màu đen',
          description: 'Tìm thấy ví da màu đen tại khu vực thư viện, bên trong có thẻ sinh viên và một số tiền mặt.',
          type: 'found',
          category: 'Ví/Túi',
          location: 'Thư viện DTU',
          date: '2024-12-20',
          time: '14:30',
          status: 'active',
          reporter: {
            name: 'Nguyễn Văn A',
            avatar: 'A',
            studentId: '21IT001'
          },
          images: ['wallet1.jpg', 'wallet2.jpg'],
          contactInfo: '0123456789',
          likes: 12,
          comments: 3,
          shares: 1
        },
        {
          id: 2,
          title: 'Mất điện thoại iPhone 13',
          description: 'Mất điện thoại iPhone 13 màu xanh tại khu vực canteen, có vỏ bảo vệ màu đen.',
          type: 'lost',
          category: 'Điện thoại',
          location: 'Canteen DTU',
          date: '2024-12-19',
          time: '11:15',
          status: 'active',
          reporter: {
            name: 'Trần Thị B',
            avatar: 'B',
            studentId: '21IT002'
          },
          images: [],
          contactInfo: '0987654321',
          likes: 8,
          comments: 5,
          shares: 2
        },
        {
          id: 3,
          title: 'Tìm thấy laptop Dell',
          description: 'Tìm thấy laptop Dell tại phòng máy tính, có sticker DTU trên mặt laptop.',
          type: 'found',
          category: 'Laptop',
          location: 'Phòng máy tính A1',
          date: '2024-12-18',
          time: '16:45',
          status: 'active',
          reporter: {
            name: 'Lê Văn C',
            avatar: 'C',
            studentId: '21IT003'
          },
          images: ['laptop1.jpg'],
          contactInfo: '0369852147',
          likes: 15,
          comments: 7,
          shares: 3
        }
      ];

      // Apply filters
      let filteredPosts = mockPosts;
      
      if (filters.type) {
        filteredPosts = filteredPosts.filter(post => post.type === filters.type);
      }
      
      if (filters.category) {
        filteredPosts = filteredPosts.filter(post => post.category === filters.category);
      }
      
      if (filters.location) {
        filteredPosts = filteredPosts.filter(post => 
          post.location.toLowerCase().includes(filters.location.toLowerCase())
        );
      }

      return {
        success: true,
        data: filteredPosts
      };
    } catch (error) {
      console.error('Get posts error:', error);
      return {
        success: false,
        error: 'Không thể lấy danh sách bài đăng'
      };
    }
  }

  // Create new post
  async createPost(postData) {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Chưa đăng nhập'
        };
      }

      const newPost = {
        id: Date.now(),
        ...postData,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        status: 'pending', // New posts need admin approval
        reporter: {
          name: this.userData.name,
          avatar: this.userData.name.charAt(0),
          studentId: this.userData.studentId
        },
        likes: 0,
        comments: 0,
        shares: 0
      };

      return {
        success: true,
        data: newPost
      };
    } catch (error) {
      console.error('Create post error:', error);
      return {
        success: false,
        error: 'Không thể tạo bài đăng'
      };
    }
  }

  // Get post comments
  async getPostComments(postId) {
    try {
      // Mock comments data
      const mockComments = [
        {
          id: 1,
          postId: postId,
          author: 'Nguyễn Thị E',
          content: 'Tôi cũng mất ví tương tự ở khu vực này hôm qua, có thể liên hệ để xác nhận không?',
          time: '2 giờ trước'
        },
        {
          id: 2,
          postId: postId,
          author: 'Trần Văn F',
          content: 'Cảm ơn bạn đã tìm thấy, tôi sẽ liên hệ ngay để nhận lại.',
          time: '1 giờ trước'
        }
      ];

      return {
        success: true,
        data: mockComments
      };
    } catch (error) {
      console.error('Get comments error:', error);
      return {
        success: false,
        error: 'Không thể lấy bình luận'
      };
    }
  }

  // Add comment to post
  async addComment(postId, comment) {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Chưa đăng nhập'
        };
      }

      const newComment = {
        id: Date.now(),
        postId: postId,
        author: this.userData.name,
        content: comment,
        time: 'Vừa xong'
      };

      return {
        success: true,
        data: newComment
      };
    } catch (error) {
      console.error('Add comment error:', error);
      return {
        success: false,
        error: 'Không thể thêm bình luận'
      };
    }
  }

  // Like/Unlike post
  async toggleLike(postId) {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Chưa đăng nhập'
        };
      }

      // Mock like toggle
      return {
        success: true,
        data: {
          postId: postId,
          liked: true,
          likesCount: Math.floor(Math.random() * 50) + 1
        }
      };
    } catch (error) {
      console.error('Toggle like error:', error);
      return {
        success: false,
        error: 'Không thể thực hiện thao tác'
      };
    }
  }

  // Get categories
  async getCategories() {
    try {
      const categories = [
        'Điện thoại',
        'Laptop',
        'Ví/Túi',
        'Chìa khóa',
        'Phụ kiện',
        'Sách vở',
        'Quần áo',
        'Khác'
      ];

      return {
        success: true,
        data: categories
      };
    } catch (error) {
      console.error('Get categories error:', error);
      return {
        success: false,
        error: 'Không thể lấy danh mục'
      };
    }
  }

  // Get locations
  async getLocations() {
    try {
      const locations = [
        'Thư viện DTU',
        'Canteen DTU',
        'Phòng máy tính A1',
        'Bãi xe sinh viên',
        'Sân thể thao DTU',
        'Khu giảng đường',
        'Khu ký túc xá',
        'Khác'
      ];

      return {
        success: true,
        data: locations
      };
    } catch (error) {
      console.error('Get locations error:', error);
      return {
        success: false,
        error: 'Không thể lấy địa điểm'
      };
    }
  }

  // Change password
  async changePassword({ currentPassword, newPassword }) {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Chưa đăng nhập'
        };
      }

      // For demo purposes, simulate API call
      // In real app, this would call backend API
      
      // ✅ Nếu có currentPassword, kiểm tra mật khẩu hiện tại
      // ✅ Nếu không có currentPassword (đã xác nhận OTP), bỏ qua bước này
      if (currentPassword !== undefined) {
        // Check current password (demo: default is "user123")
        if (currentPassword !== 'user123') {
          return {
            success: false,
            error: 'Mật khẩu hiện tại không đúng'
          };
        }
      }

      // Simulate successful password change
      // In real app, you would update password in backend
      console.log('✅ Password changed successfully');
      
      return {
        success: true,
        message: 'Đổi mật khẩu thành công'
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: 'Không thể đổi mật khẩu. Vui lòng thử lại.'
      };
    }
  }
}

// Create and export singleton instance
const userApi = new UserApi();
export default userApi;

