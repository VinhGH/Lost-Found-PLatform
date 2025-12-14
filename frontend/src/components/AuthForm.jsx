import React, { useState, useEffect, useRef } from 'react';
import './AuthForm.css';
import adminApi from '../services/adminApi.js';
import userApi from '../services/realApi.js'; // ✅ REAL API - Connects to backend
import ThemeToggle from './common/ThemeToggle';
import ToastNotification from './common/ToastNotification';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Warning as WarningIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

const AuthForm = ({ onAdminLoginSuccess, onUserLoginSuccess, initialMode = 'login', onBack }) => {
  // ✅ Stage state: 'register' | 'otp' | 'login'
  const [stage, setStage] = useState(initialMode === 'login' ? 'login' : 'register');
  const [isLogin, setIsLogin] = useState(initialMode === 'login'); // Keep for backward compatibility

  useEffect(() => {
    const newStage = initialMode === 'login' ? 'login' : 'register';
    setStage(newStage);
    setIsLogin(initialMode === 'login');
    setFormData({
      email: '',
      password: '',
      confirmPassword: ''
    });
    setError('');
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
  const [validationErrors, setValidationErrors] = useState({});
  const [toastNotification, setToastNotification] = useState(null);
  
  // ✅ State cho tính năng "Quên mật khẩu"
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState('email'); // 'email' | 'otp' | 'newPassword'
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [otpInputs, setOtpInputs] = useState(['', '', '', '', '', '']); // 6 số OTP
  const otpInputRefs = useRef([]);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);

  // ✅ State cho tính năng xác minh OTP khi đăng ký
  const [registerOtpInputs, setRegisterOtpInputs] = useState(['', '', '', '', '', '']); // 6 số OTP
  const registerOtpInputRefs = useRef([]);
  const [registerFormData, setRegisterFormData] = useState(null); // Lưu thông tin đăng ký tạm thời (email + password)
  const [resendCountdown, setResendCountdown] = useState(0); // Countdown for resend OTP (seconds)

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
    if (error) setError('');
    // ✅ Clear validation error khi user nhập
    if (validationErrors[field]) {
      setValidationErrors({
        ...validationErrors,
        [field]: ''
      });
    }
  };

  // ✅ Validation cho email
  const validateEmail = (email) => {
    if (!email) {
      return 'Email không được để trống';
    }
    if (!email.endsWith('@dtu.edu.vn')) {
      return 'Email phải có định dạng @dtu.edu.vn';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Email không hợp lệ';
    }
    return '';
  };

  // ✅ Validation cho password
  const validatePassword = (password) => {
    if (!password) {
      return 'Mật khẩu không được để trống';
    }
    if (password.length < 8) {
      return 'Mật khẩu phải có ít nhất 8 ký tự';
    }
    
    // Kiểm tra có chữ cái
    if (!/[a-zA-Z]/.test(password)) {
      return 'Mật khẩu phải chứa ít nhất một chữ cái';
    }
    
    // Kiểm tra có số
    if (!/\d/.test(password)) {
      return 'Mật khẩu phải chứa ít nhất một chữ số';
    }
    
    // Kiểm tra có ký tự đặc biệt
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt (!@#$%^&*...)';
    }
    
    return '';
  };

  // ✅ Validation cho confirm password
  const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword) {
      return 'Vui lòng xác nhận mật khẩu';
    }
    if (password !== confirmPassword) {
      return 'Mật khẩu xác nhận không khớp';
    }
    return '';
  };

  const isAdminAccount = (email) => {
    const adminEmails = ['admin@dtu.edu.vn', 'administrator@dtu.edu.vn'];
    return adminEmails.includes(email.toLowerCase());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setValidationErrors({});

    // ✅ Validate form
    const errors = {};
    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;

    // ✅ Validation mật khẩu: Đăng nhập chỉ check empty, Đăng ký check đầy đủ
    if (isLogin) {
      if (!formData.password) {
        errors.password = 'Mật khẩu không được để trống';
      }
    } else {
      const passwordError = validatePassword(formData.password);
      if (passwordError) errors.password = passwordError;
    }

    if (!isLogin) {
      const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword);
      if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setIsLoading(false);
      return;
    }

    // ✅ Nếu là đăng ký, gọi API request-otp
    if (!isLogin && stage === 'register') {
      try {
        // Gọi API request-otp
        const response = await userApi.requestOtp({
          email: formData.email,
          password: formData.password
        });

        if (response.success) {
          // Lưu email + password để dùng khi verify OTP
          setRegisterFormData({
            email: formData.email,
            password: formData.password
          });
          
          // Chuyển sang stage OTP
          setStage('otp');
          setResendCountdown(30); // Start countdown 30s
          setIsLoading(false);
          
          // Focus vào ô OTP đầu tiên
          setTimeout(() => {
            if (registerOtpInputRefs.current[0]) {
              registerOtpInputRefs.current[0].focus();
            }
          }, 100);
          return;
        } else {
          throw new Error(response.error || response.message || 'Không thể gửi mã OTP');
        }
      } catch (error) {
        console.error('❌ Request OTP error:', error);
        let errorMessage = 'Không thể gửi mã OTP. Vui lòng thử lại.';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        setError(errorMessage);
        setIsLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        if (isAdminAccount(formData.email)) {
          const adminCredentials = {
            username: formData.email.split('@')[0],
            password: formData.password
          };

          const response = await adminApi.loginAdmin(adminCredentials);

          if (response.success) {
            // ✅ adminApi.loginAdmin() đã tự động gọi setAuthData() bên trong
            // Không cần gọi lại setAuthData() ở đây để tránh duplicate
            console.log('✅ Admin login response received, token:', response.token ? 'Exists' : 'Missing');
            onAdminLoginSuccess(response.data);
            return;
          } else {
            throw new Error(response.error || 'Đăng nhập thất bại');
          }
        } else {
          const response = await userApi.loginUser({
            email: formData.email,
            password: formData.password
          });

          if (response.success) {
            // 🔹 KHÔNG cần gọi setAuthData ở đây vì loginUser() đã gọi rồi
            console.log('✅ Login response with email:', response.data?.email);
            onUserLoginSuccess(response.data);
            return;
          } else {
            throw new Error(response.error || 'Đăng nhập thất bại');
          }
        }
      }
      // ✅ Đăng ký luôn đi qua OTP flow (dòng 136-167), không có flow đăng ký trực tiếp
    } catch (error) {
      console.error('❌ Auth error:', error);

      let errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleForm = () => {
    const newStage = isLogin ? 'register' : 'login';
    setStage(newStage);
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      confirmPassword: ''
    });
    setError('');
    setValidationErrors({});
    setShowForgotPassword(false);
    setForgotPasswordStep('email');
    setRegisterOtpInputs(['', '', '', '', '', '']);
    setRegisterFormData(null);
    setResendCountdown(0);
  };

  // ✅ Xử lý "Quên mật khẩu"
  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    // ✅ Tự động điền email từ form đăng nhập (nếu có)
    setForgotPasswordEmail(formData.email || '');
    setForgotPasswordStep('email');
    setOtpInputs(['', '', '', '', '', '']);
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setError('');
    setValidationErrors({});
  };

  // ✅ Xử lý gửi mã OTP, xác minh OTP, hoặc đặt lại mật khẩu
  const handleForgotPasswordAction = async () => {
    // Bước 1: Gửi mã OTP đến email
    if (forgotPasswordStep === 'email') {
      const emailError = validateEmail(forgotPasswordEmail);
      if (emailError) {
        setValidationErrors({ email: emailError });
        return;
      }

      setIsForgotPasswordLoading(true);
      setError('');

      try {
        const response = await userApi.requestPasswordResetOtp(forgotPasswordEmail);
        if (response.success) {
          setForgotPasswordStep('otp');
          setValidationErrors({});
          setOtpInputs(['', '', '', '', '', '']);
          setToastNotification({
            type: 'success',
            title: 'Đã gửi mã OTP',
            message: response.message || 'Vui lòng kiểm tra email để lấy mã OTP đặt lại mật khẩu.'
          });

          setTimeout(() => {
            if (otpInputRefs.current[0]) {
              otpInputRefs.current[0].focus();
            }
          }, 100);
        } else {
          setError(response.error || response.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
        }
      } catch (error) {
        console.error('❌ Forgot password - request OTP error:', error);
        setError('Không thể gửi mã OTP. Vui lòng thử lại.');
      } finally {
        setIsForgotPasswordLoading(false);
      }
    } 
    // Bước 2: Xác nhận mã OTP đã nhập (GỌI API VERIFY)
    else if (forgotPasswordStep === 'otp') {
      const enteredOtp = otpInputs.join('');
      if (enteredOtp.length !== 6) {
        setError('Vui lòng nhập đầy đủ 6 số mã OTP');
        return;
      }

      setIsForgotPasswordLoading(true);
      setError('');

      try {
        // ✅ GỌI API VERIFY OTP
        const response = await userApi.verifyPasswordResetOtp({
          email: forgotPasswordEmail,
          otp: enteredOtp
        });

        if (response.success) {
          setToastNotification({
            type: 'success',
            title: 'Xác nhận mã OTP',
            message: response.message || 'Vui lòng nhập mật khẩu mới của bạn.'
          });

          // Chuyển sang bước nhập mật khẩu mới
          setForgotPasswordStep('newPassword');
          setValidationErrors({});
          setError('');
        } else {
          setError(response.error || response.message || 'Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.');
          // Reset OTP inputs để người dùng nhập lại
          setOtpInputs(['', '', '', '', '', '']);
          setTimeout(() => {
            if (otpInputRefs.current[0]) {
              otpInputRefs.current[0].focus();
            }
          }, 100);
        }
      } catch (error) {
        console.error('❌ Verify password reset OTP error:', error);
        setError('Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.');
        setOtpInputs(['', '', '', '', '', '']);
        setTimeout(() => {
          if (otpInputRefs.current[0]) {
            otpInputRefs.current[0].focus();
          }
        }, 100);
      } finally {
        setIsForgotPasswordLoading(false);
      }
    }
    // Bước 3: Đặt lại mật khẩu mới
    else if (forgotPasswordStep === 'newPassword') {
      const newPasswordError = validatePassword(forgotNewPassword);
      if (newPasswordError) {
        setValidationErrors({ newPassword: newPasswordError });
        return;
      }

      const confirmPasswordError = validateConfirmPassword(forgotNewPassword, forgotConfirmPassword);
      if (confirmPasswordError) {
        setValidationErrors({ confirmPassword: confirmPasswordError });
        return;
      }

      setIsForgotPasswordLoading(true);
      setError('');

      try {
        const enteredOtp = otpInputs.join('');
        const response = await userApi.resetPassword({
          email: forgotPasswordEmail,
          otp: enteredOtp,
          newPassword: forgotNewPassword
        });

        if (response.success) {
          setToastNotification({
            type: 'success',
            title: 'Đặt lại mật khẩu thành công',
            message: 'Vui lòng đăng nhập với mật khẩu mới.'
          });

          setShowForgotPassword(false);
          setForgotPasswordStep('email');
          setForgotPasswordEmail('');
          setOtpInputs(['', '', '', '', '', '']);
          setForgotNewPassword('');
          setForgotConfirmPassword('');
          setError('');
          setValidationErrors({});
        } else {
          setError(response.error || response.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
        }
      } catch (error) {
        console.error('❌ Reset password error:', error);
        setError(error.response?.data?.message || error.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
      } finally {
        setIsForgotPasswordLoading(false);
      }
    }
  };

  // ✅ Xử lý nhập OTP
  const handleOtpInputChange = (index, value) => {
    // ✅ Chỉ cho phép nhập số
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtpInputs = [...otpInputs];
    newOtpInputs[index] = value;
    setOtpInputs(newOtpInputs);

    // ✅ Tự động focus sang ô tiếp theo
    if (value && index < 5) {
      setTimeout(() => {
        if (otpInputRefs.current[index + 1]) {
          otpInputRefs.current[index + 1].focus();
        }
      }, 10);
    }

    // ✅ Clear error khi user nhập
    if (error) setError('');
  };

  // ✅ Xử lý xóa OTP (backspace) và Enter để submit
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpInputs[index] && index > 0) {
      setTimeout(() => {
        if (otpInputRefs.current[index - 1]) {
          otpInputRefs.current[index - 1].focus();
        }
      }, 10);
    } else if (e.key === 'Enter') {
      // ✅ Nhấn Enter để submit OTP
      e.preventDefault();
      handleForgotPasswordAction();
    }
  };

  // ✅ Xử lý nhập OTP cho đăng ký
  const handleRegisterOtpInputChange = (index, value) => {
    // ✅ Chỉ cho phép nhập số
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtpInputs = [...registerOtpInputs];
    newOtpInputs[index] = value;
    setRegisterOtpInputs(newOtpInputs);

    // ✅ Tự động focus sang ô tiếp theo
    if (value && index < 5) {
      setTimeout(() => {
        if (registerOtpInputRefs.current[index + 1]) {
          registerOtpInputRefs.current[index + 1].focus();
        }
      }, 10);
    }

    // ✅ Clear error khi user nhập
    if (error) setError('');
  };

  // ✅ Xử lý xóa OTP đăng ký (backspace)
  const handleRegisterOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !registerOtpInputs[index] && index > 0) {
      setTimeout(() => {
        if (registerOtpInputRefs.current[index - 1]) {
          registerOtpInputRefs.current[index - 1].focus();
        }
      }, 10);
    }
  };

  // ✅ Xử lý xác nhận OTP đăng ký
  const handleVerifyRegisterOtp = async () => {
    const enteredOtp = registerOtpInputs.join('');
    if (enteredOtp.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 số mã OTP');
      return;
    }

    if (!registerFormData) {
      setError('Thông tin đăng ký không hợp lệ. Vui lòng thử lại.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (isAdminAccount(registerFormData.email)) {
        setError('Không thể đăng ký tài khoản admin qua form này');
        setIsLoading(false);
        return;
      }

      // ✅ Gọi API verify-otp
      const response = await userApi.verifyOtp({
        email: registerFormData.email,
        otp: enteredOtp
      });

      if (response.success) {
        // ✅ Hiển thị toast notification thành công
        setToastNotification({
          type: 'success',
          title: 'Xác minh email thành công',
          message: 'Tạo tài khoản thành công! Hãy đăng nhập.'
        });
        
        // ✅ Chuyển về stage LOGIN
        // KHÔNG lưu token, KHÔNG gọi onLoginSuccess, chỉ quay về login
        setIsLoading(false);
        setStage('login');
        setIsLogin(true);
        setRegisterOtpInputs(['', '', '', '', '', '']); // Reset 6 ô OTP
        setRegisterFormData(null);
        setResendCountdown(0);
        setFormData({
          email: registerFormData.email,
          password: '',
          confirmPassword: ''
        });
        setError('');
        setValidationErrors({});
        return;
      } else {
        throw new Error(response.error || response.message || 'Xác minh OTP thất bại');
      }
    } catch (error) {
      console.error('❌ Verify OTP error:', error);
      let errorMessage = 'Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      setError(errorMessage);
      setRegisterOtpInputs(['', '', '', '', '', '']);
      setTimeout(() => {
        if (registerOtpInputRefs.current[0]) {
          registerOtpInputRefs.current[0].focus();
        }
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Xử lý resend OTP
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || !registerFormData) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await userApi.requestOtp({
        email: registerFormData.email,
        password: registerFormData.password
      });

      if (response.success) {
        setResendCountdown(30); // Reset countdown to 30s
        setToastNotification({
          type: 'success',
          title: 'Đã gửi lại mã OTP',
          message: 'Mã OTP mới đã được gửi đến email của bạn.'
        });
      } else {
        throw new Error(response.error || response.message || 'Không thể gửi lại mã OTP');
      }
    } catch (error) {
      console.error('❌ Resend OTP error:', error);
      let errorMessage = 'Không thể gửi lại mã OTP. Vui lòng thử lại.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Countdown timer cho resend OTP
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  return (
    <div className="auth-container">
      <ThemeToggle />
      <div className="auth-wrapper">

        <div className="auth-left">
          <div className="welcome-title-container">
            <h1 className="welcome-title">
              TimDoDTU
            </h1>
            <p className="welcome-subtitle">
              DTU Lost & Found
            </p>
          </div>

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
            <span className="logo-text-fallback" style={{ display: 'none' }}>DTU</span>
          </div>
        </div>

        <div className="auth-right">
          {onBack && (
            <button className="auth-back-btn" onClick={onBack}>
              <ArrowBackIcon className="back-icon" />
              <span>Quay lại trang chủ</span>
            </button>
          )}

          <p className="form-instruction">
            Sử dụng email@dtu.edu.vn để {isLogin ? 'đăng nhập' : 'đăng ký'} vào hệ thống
          </p>

          {error && (
            <div className="error-message">
              <WarningIcon className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          {!showForgotPassword && stage !== 'otp' && (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Nhập Email của bạn</label>
                <input
                  type="email"
                  placeholder="email@dtu.edu.vn"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  required
                  disabled={isLoading}
                  className={validationErrors.email ? 'input-error' : ''}
                />
                {validationErrors.email && (
                  <span className="validation-error">{validationErrors.email}</span>
                )}
              </div>

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
                    disabled={isLoading}
                    className={validationErrors.password ? 'input-error' : ''}
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
                {validationErrors.password && (
                  <span className="validation-error">{validationErrors.password}</span>
                )}
                {!isLogin && !validationErrors.password && (
                  <span className="password-hint">Ít nhất 8 ký tự, bao gồm chữ, số và ký tự đặc biệt</span>
                )}
              </div>

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
                      disabled={isLoading}
                      className={validationErrors.confirmPassword ? 'input-error' : ''}
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
                  {validationErrors.confirmPassword && (
                    <span className="validation-error">{validationErrors.confirmPassword}</span>
                  )}
                </div>
              )}

              {isLogin && (
                <div className="forgot-password-link">
                  <button
                    type="button"
                    className="forgot-password-btn"
                    onClick={handleForgotPassword}
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              )}

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
          )}

          {showForgotPassword && (
            // ✅ Form "Quên mật khẩu"
            <div className="forgot-password-form">
              <button
                type="button"
                className="back-to-login-btn"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordStep('email');
                  setForgotPasswordEmail('');
                  setOtpInputs(['', '', '', '', '', '']);
                      setForgotNewPassword('');
                      setForgotConfirmPassword('');
                  setError('');
                  setValidationErrors({});
                }}
              >
                <ArrowBackIcon className="back-icon" />
                <span>Quay lại đăng nhập</span>
              </button>

              <h3 className="forgot-password-title">
                {forgotPasswordStep === 'email' 
                  ? 'Quên mật khẩu' 
                  : forgotPasswordStep === 'otp'
                  ? 'Nhập mã OTP'
                  : 'Đặt lại mật khẩu'}
              </h3>

              {forgotPasswordStep === 'email' ? (
                <>
                  <p className="forgot-password-instruction">
                    Nhập email của bạn để nhận mã OTP đặt lại mật khẩu
                  </p>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="email@dtu.edu.vn"
                      value={forgotPasswordEmail}
                      onChange={(e) => {
                        setForgotPasswordEmail(e.target.value);
                        if (validationErrors.email) {
                          setValidationErrors({ ...validationErrors, email: '' });
                        }
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleForgotPasswordAction()}
                      className={validationErrors.email ? 'input-error' : ''}
                    />
                    {validationErrors.email && (
                      <span className="validation-error">{validationErrors.email}</span>
                    )}
                  </div>
                </>
              ) : forgotPasswordStep === 'otp' ? (
                <>
                  <p className="forgot-password-instruction">
                    Nhập mã OTP đã được gửi đến <strong>{forgotPasswordEmail}</strong>
                  </p>
                  <div className="form-group">
                    <label>Nhập mã OTP (6 số)</label>
                    <div className="otp-input-container">
                      {otpInputs.map((value, index) => (
                        <input
                          key={index}
                          ref={(el) => (otpInputRefs.current[index] = el)}
                          type="text"
                          maxLength="1"
                          value={value}
                          onChange={(e) => handleOtpInputChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className="otp-input"
                          autoComplete="off"
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="forgot-password-instruction">
                    Nhập mật khẩu mới cho tài khoản <strong>{forgotPasswordEmail}</strong>
                  </p>
                  <div className="form-group">
                    <label>Mật khẩu mới</label>
                    <div className="password-input">
                      <input
                        type={showForgotNewPassword ? 'text' : 'password'}
                        placeholder="••••••••••"
                        value={forgotNewPassword}
                        onChange={(e) => {
                          setForgotNewPassword(e.target.value);
                          if (validationErrors.newPassword) {
                            setValidationErrors({ ...validationErrors, newPassword: '' });
                          }
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleForgotPasswordAction()}
                        className={validationErrors.newPassword ? 'input-error' : ''}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        tabIndex="-1"
                      >
                        {showForgotNewPassword ? (
                          <VisibilityOffIcon className="eye-icon" />
                        ) : (
                          <VisibilityIcon className="eye-icon" />
                        )}
                      </button>
                    </div>
                    {validationErrors.newPassword && (
                      <span className="validation-error">{validationErrors.newPassword}</span>
                    )}
                    {!validationErrors.newPassword && (
                      <span className="password-hint">Ít nhất 8 ký tự, bao gồm chữ, số và ký tự đặc biệt</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Nhập lại mật khẩu mới</label>
                    <div className="password-input">
                      <input
                        type={showForgotConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••••"
                        value={forgotConfirmPassword}
                        onChange={(e) => {
                          setForgotConfirmPassword(e.target.value);
                          if (validationErrors.confirmPassword) {
                            setValidationErrors({ ...validationErrors, confirmPassword: '' });
                          }
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleForgotPasswordAction()}
                        className={validationErrors.confirmPassword ? 'input-error' : ''}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                        tabIndex="-1"
                      >
                        {showForgotConfirmPassword ? (
                          <VisibilityOffIcon className="eye-icon" />
                        ) : (
                          <VisibilityIcon className="eye-icon" />
                        )}
                      </button>
                    </div>
                    {validationErrors.confirmPassword && (
                      <span className="validation-error">{validationErrors.confirmPassword}</span>
                    )}
                  </div>
                </>
              )}

              <button
                type="button"
                className="submit-btn"
                onClick={handleForgotPasswordAction}
                disabled={isForgotPasswordLoading}
              >
                {isForgotPasswordLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    {forgotPasswordStep === 'email' 
                      ? 'Đang gửi...' 
                      : forgotPasswordStep === 'otp'
                      ? 'Đang xác minh...'
                      : 'Đang xử lý...'}
                  </>
                ) : (
                  forgotPasswordStep === 'email' 
                    ? 'Gửi mã' 
                    : forgotPasswordStep === 'otp'
                    ? 'Xác nhận mã'
                    : 'Đặt lại mật khẩu'
                )}
              </button>
            </div>
          )}

          {stage === 'otp' && (
            // ✅ Form xác minh OTP đăng ký
            <div className="forgot-password-form">
              <button
                type="button"
                className="back-to-login-btn"
                onClick={() => {
                  setStage('register');
                  setIsLogin(false);
                  setRegisterOtpInputs(['', '', '', '', '', '']);
                  setRegisterFormData(null);
                  setResendCountdown(0);
                  setError('');
                  setValidationErrors({});
                }}
              >
                <ArrowBackIcon className="back-icon" />
                <span>Quay lại đăng ký</span>
              </button>

              <h3 className="forgot-password-title">
                Xác minh Email
              </h3>

              <p className="forgot-password-instruction">
                Mã OTP đã được gửi đến email <strong>{registerFormData?.email || formData.email}</strong>
              </p>

              <div className="form-group">
                <label>Nhập mã OTP (6 số)</label>
                <div className="otp-input-container">
                  {registerOtpInputs.map((value, index) => (
                    <input
                      key={index}
                      ref={(el) => (registerOtpInputRefs.current[index] = el)}
                      type="text"
                      maxLength="1"
                      value={value}
                      onChange={(e) => handleRegisterOtpInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleRegisterOtpKeyDown(index, e)}
                      className="otp-input"
                      autoComplete="off"
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="submit-btn"
                onClick={handleVerifyRegisterOtp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Đang xác minh...
                  </>
                ) : (
                  'Xác nhận'
                )}
              </button>

              {/* Resend OTP button */}
              <div style={{ textAlign: 'center', marginTop: '15px' }}>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCountdown > 0 || isLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCountdown > 0 ? '#999' : '#667eea',
                    cursor: resendCountdown > 0 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    textDecoration: resendCountdown > 0 ? 'none' : 'underline',
                    padding: '5px'
                  }}
                >
                  {resendCountdown > 0
                    ? `Gửi lại mã (${resendCountdown}s)`
                    : 'Gửi lại mã OTP'}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Toast Notification */}
      {toastNotification && (
        <ToastNotification
          notification={toastNotification}
          onClose={() => setToastNotification(null)}
        />
      )}
    </div>
  );
};

export default AuthForm;
