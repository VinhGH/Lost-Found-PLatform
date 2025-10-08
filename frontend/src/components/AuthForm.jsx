import React, { useState } from 'react';
import './AuthForm.css';
import { login, register } from '../services/auth';

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate email domain
      if (!formData.email.endsWith('@dtu.edu.vn')) {
        setError('Email phải kết thúc bằng @dtu.edu.vn');
        return;
      }

      if (isLogin) {
        // Login logic
        console.log('🔄 Attempting login...');
        const response = await login(formData.email, formData.password);
        console.log('✅ Server response:', response);
        
        if (response.success && response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          alert('Đăng nhập thành công!');
          // Redirect to home or dashboard
          window.location.href = '/';
        }
      } else {
        // Register logic
        if (formData.password !== formData.confirmPassword) {
          setError('Mật khẩu xác nhận không khớp');
          return;
        }
        
        console.log('🔄 Attempting register...');
        const response = await register({
          email: formData.email,
          password: formData.password
        });
        console.log('✅ Server response:', response);
        
        if (response.success) {
          alert('Đăng ký thành công! Vui lòng đăng nhập.');
          setIsLogin(true);
          setFormData({ email: '', password: '', confirmPassword: '' });
        }
      }
    } catch (error) {
      console.error('❌ Auth error:', error);
      setError(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      confirmPassword: ''
    });
    setError('');
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        {/* Left side - DTU Branding */}
        <div className="auth-left">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <span className="breadcrumb-item">
              <img src="/img/home.png" alt="Home" className="home-icon" />
              Trang chủ
            </span>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-item">
              {isLogin ? 'Đăng nhập' : 'Đăng ký'}
            </span>
          </div>

          {/* Welcome Text */}
          <h1 className="welcome-title">
            Chào mừng đến với<br />
            cộng đồng tìm kiếm đồ DTU
          </h1>

          {/* DTU Logo */}
          <div className="dtu-branding">
            <img 
              src="/img/logo_dtu_while.png" 
              alt="DTU Logo" 
              className="logo-image-full"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <span className="logo-text-fallback" style={{display: 'none'}}>DTU</span>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="auth-right">
          {/* Google Sign In Button */}
          <button className="google-btn">
            <img src="/img/google.png" alt="Google" className="google-icon" />
            Đăng nhập bằng Google
          </button>

          {/* Divider */}
          <div className="divider">
            <span>Hoặc</span>
          </div>

          {/* Instructions */}
          <p className="form-instruction">
            Sử dụng email@dtu.edu.vn để {isLogin ? 'đăng nhập' : 'đăng ký'} vào hệ thống
          </p>

          {/* Error Message */}
          {error && (
            <div className="error-message" style={{
              color: '#ff4444',
              backgroundColor: '#ffe6e6',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '15px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email Field */}
            <div className="form-group">
              <label>Nhập Email của bạn</label>
              <input
                type="email"
                placeholder="email@dtu.edu.vn"
                value={formData.email}
                onChange={handleInputChange('email')}
                required
              />
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label>Mật khẩu</label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  required
                  autoComplete="new-password"
                  data-lpignore="true"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <img 
                    src={showPassword ? "/img/eyeoff.png" : "/img/eye.png"} 
                    alt={showPassword ? "Hide password" : "Show password"} 
                    className="eye-icon" 
                  />
                </button>
              </div>
            </div>

            {/* Confirm Password Field (only for registration) */}
            {!isLogin && (
              <div className="form-group">
                <label>Nhập lại mật khẩu</label>
                <div className="password-input">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange('confirmPassword')}
                    required
                    autoComplete="new-password"
                    data-lpignore="true"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <img 
                      src={showConfirmPassword ? "/img/eyeoff.png" : "/img/eye.png"} 
                      alt={showConfirmPassword ? "Hide password" : "Show password"} 
                      className="eye-icon" 
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký ngay')}
            </button>

            {/* Toggle Form Link */}
            <p className="toggle-form">
              {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
              <button
                type="button"
                className="toggle-link"
                onClick={toggleForm}
              >
                {isLogin ? 'Đăng ký' : 'Đăng nhập'}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
