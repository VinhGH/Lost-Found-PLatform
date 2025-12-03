/**
 * API Configuration
 * Cấu hình kết nối với Backend API
 */

// API Base URL - sử dụng biến môi trường hoặc URL mặc định
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://lost-found-platform.onrender.com/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication endpoints
  auth: {
    register: '/accounts/register',
    login: '/accounts/login',
    profile: '/accounts/profile',
    updateProfile: '/accounts/profile',
    requestOtp: '/auth/request-otp',
    verifyOtp: '/auth/verify-otp',
    requestPasswordReset: '/auth/request-password-reset',
    resetPassword: '/auth/reset-password',
  },
  accounts: {
    changePassword: '/accounts/change-password',
  },

  // Posts endpoints
  posts: {
    getAll: '/posts',
    getById: (id) => `/posts/${id}`,
    create: '/posts',
    update: (id) => `/posts/${id}`,
    delete: (id) => `/posts/${id}`,
    getMyPosts: '/posts/my',
    getByType: (type) => `/posts/type/${type}`,
  },

  // Categories endpoints
  categories: {
    getAll: '/categories',
  },

  // Locations endpoints
  locations: {
    getAll: '/locations',
  },
};

// Storage keys
export const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  USER_DATA: 'userData',
  ADMIN_TOKEN: 'adminToken',
  ADMIN_DATA: 'adminData',
};

// API Response status
export const API_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
};

// Default request configuration
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

// Request timeout (milliseconds)
export const REQUEST_TIMEOUT = 30000; // 30 seconds

