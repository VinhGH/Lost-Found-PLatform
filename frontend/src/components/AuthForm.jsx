import React, { useState, useEffect } from 'react';
import './AuthForm.css';
import adminApi from '../services/adminApi.js';
import userApi from '../services/userApi.js';
import ThemeToggle from './common/ThemeToggle';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Warning as WarningIcon,
  Google as GoogleIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

const AuthForm = ({ onAdminLoginSuccess, onUserLoginSuccess, initialMode = 'login', onBack }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');

  // Update isLogin when initialMode changes
  useEffect(() => {
    setIsLogin(initialMode === 'login');
    // Clear form data when switching modes
    setFormData({
      email: '',
      password: '',
      confirmPassword: ''
    });
    setError('');
    setFieldErrors({});
  }, [initialMode]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Check if email is admin account
  const isAdminAccount = (email) => {
    const adminEmails = [
      'admin@dtu.edu.vn',
      'administrator@dtu.edu.vn'
    ];
    return adminEmails.includes(email.toLowerCase());
  };

  const validateForm = () => {
    const newErrors = {};
    const trimmedEmail = formData.email.trim();

    if (!trimmedEmail) {
      newErrors.email = 'Vui lòng nhập email DTU.';
    } else if (!/^[A-Z0-9._%+-]+@dtu\.edu\.vn$/i.test(trimmedEmail)) {
      newErrors.email = 'Email phải thuộc tên miền @dtu.edu.vn.';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự.';
    }

    if (!isLogin) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Vui lòng nhập lại mật khẩu.';
      } else if (formData.confirmPassword !== formData.password) {
        newErrors.confirmPassword = 'Mật khẩu nhập lại không khớp.';
      }
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    setFieldErrors({});

    try {
      const email = formData.email.trim();
      if (isLogin) {
        // Handle login
        if (isAdminAccount(email)) {
          // Try real API login for other admin accounts
          const adminCredentials = {
            username: email.split('@')[0], // Extract username from email
            password: formData.password
          };

          const response = await adminApi.loginAdmin(adminCredentials);
          if (response.success) {
            adminApi.setAuthData(response.token, response.data);
            onAdminLoginSuccess(response.data);
            return;
          } else {
            throw new Error(response.error || 'Đăng nhập thất bại');
          }
        } else {
          // Regular user login
          const response = await userApi.loginUser({
            email,
            password: formData.password
          });
          
          if (response.success) {
            userApi.setAuthData(response.token, response.data);
            // Call the callback to navigate to user dashboard
            onUserLoginSuccess(response.data);
            return;
          } else {
            throw new Error(response.error || 'Đăng nhập thất bại');
          }
        }
      } else {
        // Handle registration
        if (isAdminAccount(email)) {
          setError('Không thể đăng ký tài khoản admin qua form này');
        } else {
          // Regular user registration
          const response = await userApi.registerUser({
            email,
            password: formData.password
          });
          
          if (response.success) {
            userApi.setAuthData(response.token, response.data);
            // Call the callback to navigate to user dashboard
            onUserLoginSuccess(response.data);
            return;
          } else {
            throw new Error(response.error || 'Đăng ký thất bại');
          }
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsLoading(false);
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
    setFieldErrors({});
  };


  return (
    <div className="auth-container">
      <ThemeToggle />
      <div className="auth-wrapper">
        {/* Left side - DTU Branding */}
        <div className="auth-left">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <span className="breadcrumb-item">
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
          {/* Back Button */}
          {onBack && (
            <button className="auth-back-btn" onClick={onBack}>
              <ArrowBackIcon className="back-icon" />
              <span>Quay lại trang chủ</span>
            </button>
          )}
          
          {/* Google Sign In Button */}
          <button className="google-btn">
            <GoogleIcon className="google-icon" />
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
            <div className="error-message">
              <WarningIcon className="error-icon" />
              <span>{error}</span>
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
                disabled={isLoading}
                className={fieldErrors.email ? 'input-error' : ''}
              />
              {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
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
                  autoComplete="new-password"
                  data-lpignore="true"
                  disabled={isLoading}
                  className={fieldErrors.password ? 'input-error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <VisibilityOffIcon className="eye-icon" />
                  ) : (
                    <VisibilityIcon className="eye-icon" />
                  )}
                </button>
              </div>
              {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
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
                    autoComplete="new-password"
                    data-lpignore="true"
                    disabled={isLoading}
                    className={fieldErrors.confirmPassword ? 'input-error' : ''}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <VisibilityOffIcon className="eye-icon" />
                    ) : (
                      <VisibilityIcon className="eye-icon" />
                    )}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="field-error">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  {isLogin ? 'Đang đăng nhập...' : 'Đang đăng ký...'}
                </>
              ) : (
                isLogin ? 'Đăng nhập' : 'Đăng ký ngay'
              )}
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
