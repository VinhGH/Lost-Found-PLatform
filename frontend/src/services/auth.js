import api from './api';

// ✅ Hàm login
export const login = async (email, password) => {
  try {
    const res = await api.post('/accounts/login', { email, password });
    return res.data; // trả về JSON { success, token, user }
  } catch (err) {
    console.error("❌ Login failed:", err.response?.data || err.message);
    
    // Trả về lỗi với cấu trúc chuẩn
    if (err.response?.data) {
      throw err.response.data;
    } else if (err.message) {
      throw { message: err.message };
    } else {
      throw { message: "Server error" };
    }
  }
};

// ✅ Hàm register
export const register = async (userData) => {
  try {
    const res = await api.post('/accounts/register', userData);
    return res.data; // trả về JSON { success, message }
  } catch (err) {
    console.error("❌ Register failed:", err.response?.data || err.message);
    
    // Trả về lỗi với cấu trúc chuẩn
    if (err.response?.data) {
      throw err.response.data;
    } else if (err.message) {
      throw { message: err.message };
    } else {
      throw { message: "Server error" };
    }
  }
};

// ✅ Lưu token để gọi API protected
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete api.defaults.headers.common["Authorization"];
  }
};
