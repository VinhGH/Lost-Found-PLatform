import React, { useState, useEffect, useRef } from 'react';
import './AuthForm.css';
import adminApi from '../services/adminApi.js';
import userApi from '../services/userApi.js';
import ThemeToggle from './common/ThemeToggle';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Warning as WarningIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

const AuthForm = ({ onAdminLoginSuccess, onUserLoginSuccess, initialMode = 'login', onBack }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');

  useEffect(() => {
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
  
  // ✅ State cho tính năng "Quên mật khẩu"
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState('email'); // 'email' | 'otp'
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [otpCode, setOtpCode] = useState(''); // Mã OTP đã gửi (lưu tạm)
  const [otpInputs, setOtpInputs] = useState(['', '', '', '', '', '']); // 6 số OTP
  const otpInputRefs = useRef([]);

  // ✅ State cho tính năng xác minh OTP khi đăng ký
  const [showRegisterOtp, setShowRegisterOtp] = useState(false);
  const [registerOtpInputs, setRegisterOtpInputs] = useState(['', '', '', '', '', '']); // 6 số OTP
  const registerOtpInputRefs = useRef([]);
  const [registerFormData, setRegisterFormData] = useState(null); // Lưu thông tin đăng ký tạm thời

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
    if (password.length < 6) {
      return 'Mật khẩu phải có ít nhất 6 ký tự';
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

    const passwordError = validatePassword(formData.password);
    if (passwordError) errors.password = passwordError;

    if (!isLogin) {
      const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword);
      if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setIsLoading(false);
      return;
    }

    // ✅ Nếu là đăng ký và chưa xác minh OTP, chuyển sang bước OTP
    if (!isLogin && !showRegisterOtp) {
      // Tạo mã OTP ngẫu nhiên 6 số
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Lưu OTP và thông tin đăng ký vào localStorage
      localStorage.setItem('registerOtp', JSON.stringify({
        email: formData.email,
        otp: generatedOtp,
        timestamp: Date.now(),
        formData: formData // Lưu thông tin đăng ký
      }));

      // Chuyển sang bước nhập OTP
      setShowRegisterOtp(true);
      setRegisterFormData(formData);
      setIsLoading(false);
      
      // Focus vào ô OTP đầu tiên
      setTimeout(() => {
        if (registerOtpInputRefs.current[0]) {
          registerOtpInputRefs.current[0].focus();
        }
      }, 100);
      return;
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
            adminApi.setAuthData(response.token, response.data);
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
            userApi.setAuthData(response.token, response.data);
            onUserLoginSuccess(response.data);
            return;
          } else {
            throw new Error(response.error || 'Đăng nhập thất bại');
          }
        }
      } else {
        if (isAdminAccount(formData.email)) {
          setError('Không thể đăng ký tài khoản admin qua form này');
        } else {
          const response = await userApi.registerUser({
            email: formData.email,
            password: formData.password
          });

          if (response.success) {
            userApi.setAuthData(response.token, response.data);
            onUserLoginSuccess(response.data);
            return;
          } else {
            throw new Error(response.error || 'Đăng ký thất bại');
          }
        }
      }
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
    setShowRegisterOtp(false);
    setRegisterOtpInputs(['', '', '', '', '', '']);
    setRegisterFormData(null);
  };

  // ✅ Xử lý "Quên mật khẩu"
  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setForgotPasswordEmail('');
    setForgotPasswordStep('email');
    setOtpCode('');
    setOtpInputs(['', '', '', '', '', '']);
    setError('');
    setValidationErrors({});
  };

  // ✅ Xử lý gửi mã OTP hoặc xác nhận mã OTP
  const handleSendOtp = async () => {
    if (forgotPasswordStep === 'email') {
      // ✅ Bước 1: Gửi mã OTP
      const emailError = validateEmail(forgotPasswordEmail);
      if (emailError) {
        setValidationErrors({ email: emailError });
        return;
      }

      // ✅ Tạo mã OTP ngẫu nhiên 6 số
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setOtpCode(generatedOtp);
      
      // ✅ Lưu OTP vào localStorage (trong thực tế sẽ gửi qua email)
      localStorage.setItem('forgotPasswordOtp', JSON.stringify({
        email: forgotPasswordEmail,
        otp: generatedOtp,
        timestamp: Date.now()
      }));

      // ✅ Chuyển sang bước nhập OTP
      setForgotPasswordStep('otp');
      setValidationErrors({});
      
      // ✅ Focus vào ô OTP đầu tiên
      setTimeout(() => {
        if (otpInputRefs.current[0]) {
          otpInputRefs.current[0].focus();
        }
      }, 100);
    } else {
      // ✅ Bước 2: Xác nhận mã OTP
      const enteredOtp = otpInputs.join('');
      if (enteredOtp.length !== 6) {
        setError('Vui lòng nhập đầy đủ 6 số mã OTP');
        return;
      }

      // ✅ Kiểm tra mã OTP
      const savedOtpData = localStorage.getItem('forgotPasswordOtp');
      if (savedOtpData) {
        const { email, otp, timestamp } = JSON.parse(savedOtpData);
        
        // ✅ Kiểm tra mã OTP có hết hạn không (5 phút)
        if (Date.now() - timestamp > 5 * 60 * 1000) {
          setError('Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.');
          setForgotPasswordStep('email');
          setOtpInputs(['', '', '', '', '', '']);
          return;
        }

        if (email === forgotPasswordEmail && otp === enteredOtp) {
          // ✅ Mã OTP đúng - hiển thị thông báo thành công
          alert('✅ Mã OTP xác nhận thành công! Vui lòng kiểm tra email để đặt lại mật khẩu.');
          // ✅ Reset form
          setShowForgotPassword(false);
          setForgotPasswordStep('email');
          setForgotPasswordEmail('');
          setOtpCode('');
          setOtpInputs(['', '', '', '', '', '']);
          localStorage.removeItem('forgotPasswordOtp');
        } else {
          setError('Mã OTP không đúng. Vui lòng thử lại.');
          setOtpInputs(['', '', '', '', '', '']);
          setTimeout(() => {
            if (otpInputRefs.current[0]) {
              otpInputRefs.current[0].focus();
            }
          }, 100);
        }
      } else {
        setError('Mã OTP không hợp lệ. Vui lòng gửi lại mã mới.');
        setForgotPasswordStep('email');
        setOtpInputs(['', '', '', '', '', '']);
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

  // ✅ Xử lý xóa OTP (backspace)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpInputs[index] && index > 0) {
      setTimeout(() => {
        if (otpInputRefs.current[index - 1]) {
          otpInputRefs.current[index - 1].focus();
        }
      }, 10);
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

    // ✅ Kiểm tra mã OTP
    const savedOtpData = localStorage.getItem('registerOtp');
    if (savedOtpData) {
      const { email, otp, timestamp, formData: savedFormData } = JSON.parse(savedOtpData);
      
      // ✅ Kiểm tra mã OTP có hết hạn không (5 phút)
      if (Date.now() - timestamp > 5 * 60 * 1000) {
        setError('Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.');
        setShowRegisterOtp(false);
        setRegisterOtpInputs(['', '', '', '', '', '']);
        setRegisterFormData(null);
        localStorage.removeItem('registerOtp');
        return;
      }

      if (email === savedFormData.email && otp === enteredOtp) {
        // ✅ Mã OTP đúng - thực hiện đăng ký
        setIsLoading(true);
        setError('');
        
        try {
          if (isAdminAccount(savedFormData.email)) {
            setError('Không thể đăng ký tài khoản admin qua form này');
            setIsLoading(false);
            return;
          }

          const response = await userApi.registerUser({
            email: savedFormData.email,
            password: savedFormData.password
          });

          if (response.success) {
            userApi.setAuthData(response.token, response.data);
            // ✅ Xóa OTP đã dùng
            localStorage.removeItem('registerOtp');
            onUserLoginSuccess(response.data);
            return;
          } else {
            throw new Error(response.error || 'Đăng ký thất bại');
          }
        } catch (error) {
          console.error('❌ Register error:', error);
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
      } else {
        setError('Mã OTP không đúng. Vui lòng thử lại.');
        setRegisterOtpInputs(['', '', '', '', '', '']);
        setTimeout(() => {
          if (registerOtpInputRefs.current[0]) {
            registerOtpInputRefs.current[0].focus();
          }
        }, 100);
      }
    } else {
      setError('Mã OTP không hợp lệ. Vui lòng thử lại.');
      setShowRegisterOtp(false);
      setRegisterOtpInputs(['', '', '', '', '', '']);
      setRegisterFormData(null);
    }
  };

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

          {!showForgotPassword && !showRegisterOtp && (
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
                  setError('');
                  setValidationErrors({});
                }}
              >
                <ArrowBackIcon className="back-icon" />
                <span>Quay lại đăng nhập</span>
              </button>

              <h3 className="forgot-password-title">
                {forgotPasswordStep === 'email' ? 'Quên mật khẩu' : 'Nhập mã OTP'}
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
                      className={validationErrors.email ? 'input-error' : ''}
                    />
                    {validationErrors.email && (
                      <span className="validation-error">{validationErrors.email}</span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="forgot-password-instruction">
                    Mã OTP đã được gửi đến email <strong>{forgotPasswordEmail}</strong>
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
              )}

              <button
                type="button"
                className="submit-btn"
                onClick={handleSendOtp}
              >
                {forgotPasswordStep === 'email' ? 'Gửi mã' : 'Xác nhận'}
              </button>
            </div>
          )}

          {showRegisterOtp && (
            // ✅ Form xác minh OTP đăng ký
            <div className="forgot-password-form">
              <button
                type="button"
                className="back-to-login-btn"
                onClick={() => {
                  setShowRegisterOtp(false);
                  setRegisterOtpInputs(['', '', '', '', '', '']);
                  setRegisterFormData(null);
                  setError('');
                  setValidationErrors({});
                  localStorage.removeItem('registerOtp');
                }}
              >
                <ArrowBackIcon className="back-icon" />
                <span>Quay lại đăng ký</span>
              </button>

              <h3 className="forgot-password-title">
                Xác minh Email
              </h3>

              <p className="forgot-password-instruction">
                Mã OTP đã được gửi đến email <strong>{formData.email}</strong>
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
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AuthForm;
