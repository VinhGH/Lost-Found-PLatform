import React, { useState, useRef, useEffect } from "react";
import "./ChangePasswordModal.css";
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Warning as WarningIcon,
  ArrowBack as ArrowBackIcon
} from "@mui/icons-material";
import userApi from "../../services/realApi"; // ✅ REAL API

const ChangePasswordModal = ({ onClose, onSuccess }) => {
  // ✅ Khóa scroll của body khi modal mở
  useEffect(() => {
    // Lưu giá trị overflow ban đầu
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;
    
    // Lưu scroll position hiện tại
    const scrollY = window.scrollY;
    
    // Khóa scroll của body và html
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    
    // Cleanup: khôi phục scroll khi component unmount
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;
      
      // Khôi phục scroll position
      window.scrollTo(0, scrollY);
    };
  }, []);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // ✅ State cho tính năng "Quên mật khẩu"
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState("email"); // 'email' | 'otp' | 'newPassword'
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [otpInputs, setOtpInputs] = useState(["", "", "", "", "", ""]); // 6 số OTP
  const otpInputRefs = useRef([]);
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);

  // ✅ Validation cho email
  const validateEmail = (email) => {
    if (!email) {
      return "Email không được để trống";
    }
    if (!email.endsWith("@dtu.edu.vn")) {
      return "Email phải có định dạng @dtu.edu.vn";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Email không hợp lệ";
    }
    return "";
  };

  // ✅ Validation cho password
  const validatePassword = (password) => {
    if (!password) {
      return "Mật khẩu không được để trống";
    }
    if (password.length < 8) {
      return "Mật khẩu phải có ít nhất 8 ký tự";
    }
    
    // Kiểm tra có chữ cái
    if (!/[a-zA-Z]/.test(password)) {
      return "Mật khẩu phải chứa ít nhất một chữ cái";
    }
    
    // Kiểm tra có số
    if (!/\d/.test(password)) {
      return "Mật khẩu phải chứa ít nhất một chữ số";
    }
    
    // Kiểm tra có ký tự đặc biệt
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return "Mật khẩu phải chứa ít nhất một ký tự đặc biệt (!@#$%^&*...)";
    }
    
    return "";
  };

  // ✅ Validation cho confirm password
  const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword) {
      return "Vui lòng xác nhận mật khẩu";
    }
    if (password !== confirmPassword) {
      return "Mật khẩu xác nhận không khớp";
    }
    return "";
  };

  // ✅ Xử lý đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setValidationErrors({});

    const errors = {};

    const currentPasswordError = validatePassword(currentPassword);
    if (currentPasswordError) errors.currentPassword = currentPasswordError;

    const newPasswordError = validatePassword(newPassword);
    if (newPasswordError) errors.newPassword = newPasswordError;

    const confirmPasswordError = validateConfirmPassword(newPassword, confirmPassword);
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

    // ✅ Kiểm tra mật khẩu mới không được trùng với mật khẩu cũ
    if (!errors.newPassword && currentPassword && newPassword && currentPassword === newPassword) {
      errors.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await userApi.changePassword({
        currentPassword,
        newPassword,
      });

      if (response.success) {
        if (onSuccess) {
          onSuccess("Đổi mật khẩu thành công");
        }
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        onClose();
      } else {
        setError(response.error || response.message || "Đổi mật khẩu thất bại");
      }
    } catch (error) {
      console.error("❌ Change password error:", error);
      setError(error.response?.data?.message || error.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Xử lý "Quên mật khẩu"
  const handleForgotPassword = () => {
    // 🔹 Force refresh user data từ localStorage mới nhất
    const currentUser = userApi.getCurrentUser();
    const userEmail = currentUser?.email || "";
    
    console.log('🔑 Opening forgot password with email:', userEmail);
    
    setForgotPasswordEmail(userEmail);
    setShowForgotPassword(true);
    setForgotPasswordStep("email");
    setOtpInputs(["", "", "", "", "", ""]);
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setError("");
    setValidationErrors({});
  };

  const handleForgotPasswordAction = async () => {
    // Bước 1: Gửi mã OTP đến email
    if (forgotPasswordStep === "email") {
      const emailError = validateEmail(forgotPasswordEmail);
      if (emailError) {
        setValidationErrors({ email: emailError });
        return;
      }

      setIsForgotPasswordLoading(true);
      setError("");

      try {
        const response = await userApi.requestPasswordResetOtp(forgotPasswordEmail);
        if (response.success) {
          setForgotPasswordStep("otp");
          setValidationErrors({});
          setOtpInputs(["", "", "", "", "", ""]);

          setTimeout(() => {
            if (otpInputRefs.current[0]) {
              otpInputRefs.current[0].focus();
            }
          }, 100);
        } else {
          setError(response.error || response.message || "Không thể gửi mã OTP. Vui lòng thử lại.");
        }
      } catch (error) {
        console.error("❌ Forgot password - request OTP error:", error);
        setError("Không thể gửi mã OTP. Vui lòng thử lại.");
      } finally {
        setIsForgotPasswordLoading(false);
      }
    }
    // Bước 2: Xác nhận mã OTP đã nhập (không gọi API)
    else if (forgotPasswordStep === "otp") {
      const enteredOtp = otpInputs.join("");
      if (enteredOtp.length !== 6) {
        setError("Vui lòng nhập đầy đủ 6 số mã OTP");
        return;
      }

      // Chỉ validate OTP đã đủ 6 số, chưa gọi API verify
      // API verify OTP sẽ được gọi khi submit mật khẩu mới
      if (onSuccess) {
        onSuccess("Xác nhận mã OTP thành công. Vui lòng nhập mật khẩu mới.");
      }

      // Chuyển sang bước nhập mật khẩu mới
      setForgotPasswordStep("newPassword");
      setValidationErrors({});
      setError("");
    }
    // Bước 3: Đặt lại mật khẩu mới
    else if (forgotPasswordStep === "newPassword") {
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
      setError("");

      try {
        const enteredOtp = otpInputs.join("");
        const response = await userApi.resetPassword({
          email: forgotPasswordEmail,
          otp: enteredOtp,
          newPassword: forgotNewPassword
        });

        if (response.success) {
          if (onSuccess) {
            onSuccess("Đặt lại mật khẩu thành công");
          }
          setShowForgotPassword(false);
          setForgotPasswordStep("email");
          setForgotPasswordEmail("");
          setOtpInputs(["", "", "", "", "", ""]);
          setForgotNewPassword("");
          setForgotConfirmPassword("");
          setError("");
          setValidationErrors({});
        } else {
          setError(response.error || response.message || "Đặt lại mật khẩu thất bại. Vui lòng thử lại.");
        }
      } catch (error) {
        console.error("❌ Reset password error:", error);
        setError(error.response?.data?.message || error.message || "Đặt lại mật khẩu thất bại. Vui lòng thử lại.");
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
    if (error) setError("");
  };

  // ✅ Xử lý xóa OTP (backspace)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpInputs[index] && index > 0) {
      setTimeout(() => {
        if (otpInputRefs.current[index - 1]) {
          otpInputRefs.current[index - 1].focus();
        }
      }, 10);
    }
  };

  // ✅ Reset form khi đóng modal
  const handleCancel = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setValidationErrors({});
    setShowForgotPassword(false);
    setForgotPasswordStep("email");
    setForgotPasswordEmail("");
    setOtpInputs(["", "", "", "", "", ""]);
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setIsForgotPasswordLoading(false);
    onClose();
  };

  return (
    <div className="change-password-modal-overlay" onClick={handleCancel}>
      <div className="change-password-modal" onClick={(e) => e.stopPropagation()}>
        {!showForgotPassword ? (
          <>
            <div className="modal-header">
              <h2>Đổi mật khẩu</h2>
              <button className="close-btn" onClick={handleCancel}>
                ×
              </button>
            </div>

            {error && (
              <div className="error-message">
                <WarningIcon className="error-icon" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="change-password-form">
              <div className="form-group">
                <label>Mật khẩu hiện tại</label>
                <div className="password-input">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu hiện tại"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (validationErrors.currentPassword) {
                        setValidationErrors({
                          ...validationErrors,
                          currentPassword: "",
                        });
                      }
                      if (error) setError("");
                    }}
                    disabled={isLoading}
                    className={validationErrors.currentPassword ? "input-error" : ""}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    disabled={isLoading}
                  >
                    {showCurrentPassword ? (
                      <VisibilityOffIcon className="eye-icon" />
                    ) : (
                      <VisibilityIcon className="eye-icon" />
                    )}
                  </button>
                </div>
                {validationErrors.currentPassword && (
                  <span className="validation-error">
                    {validationErrors.currentPassword}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Mật khẩu mới</label>
                <div className="password-input">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu mới"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (validationErrors.newPassword) {
                        setValidationErrors({
                          ...validationErrors,
                          newPassword: "",
                        });
                      }
                      if (error) setError("");
                    }}
                    disabled={isLoading}
                    className={validationErrors.newPassword ? "input-error" : ""}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={isLoading}
                  >
                    {showNewPassword ? (
                      <VisibilityOffIcon className="eye-icon" />
                    ) : (
                      <VisibilityIcon className="eye-icon" />
                    )}
                  </button>
                </div>
                {validationErrors.newPassword && (
                  <span className="validation-error">
                    {validationErrors.newPassword}
                  </span>
                )}
                {!validationErrors.newPassword && (
                  <span className="password-hint">Ít nhất 8 ký tự, bao gồm chữ, số và ký tự đặc biệt</span>
                )}
              </div>

              <div className="form-group">
                <label>Nhập lại mật khẩu mới</label>
                <div className="password-input">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (validationErrors.confirmPassword) {
                        setValidationErrors({
                          ...validationErrors,
                          confirmPassword: "",
                        });
                      }
                      if (error) setError("");
                    }}
                    disabled={isLoading}
                    className={validationErrors.confirmPassword ? "input-error" : ""}
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
                  <span className="validation-error">
                    {validationErrors.confirmPassword}
                  </span>
                )}
              </div>

              <div className="forgot-password-link">
                <button
                  type="button"
                  className="forgot-password-btn"
                  onClick={handleForgotPassword}
                >
                  Quên mật khẩu?
                </button>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-update"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Đang cập nhật...
                    </>
                  ) : (
                    "Cập nhật"
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="modal-header">
                <button
                  type="button"
                  className="back-btn"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordStep("email");
                    setForgotPasswordEmail("");
                    setOtpInputs(["", "", "", "", "", ""]);
                    setForgotNewPassword("");
                    setForgotConfirmPassword("");
                    setError("");
                    setValidationErrors({});
                    // ✅ Quay lại form đổi mật khẩu
                  }}
                >
                  <ArrowBackIcon className="back-icon" />
                  <span>Quay lại</span>
                </button>
              <h2>
                {forgotPasswordStep === "email"
                  ? "Quên mật khẩu"
                  : forgotPasswordStep === "otp"
                  ? "Nhập mã OTP"
                  : "Đặt lại mật khẩu"}
              </h2>
              <button className="close-btn" onClick={handleCancel}>
                ×
              </button>
            </div>

            {error && (
              <div className="error-message">
                <WarningIcon className="error-icon" />
                <span>{error}</span>
              </div>
            )}

            <div className="forgot-password-form">
              {forgotPasswordStep === "email" ? (
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
                          setValidationErrors({
                            ...validationErrors,
                            email: "",
                          });
                        }
                      }}
                      className={validationErrors.email ? "input-error" : ""}
                      readOnly={!!forgotPasswordEmail} // ✅ Email tự động điền và không cho chỉnh sửa
                      style={{ backgroundColor: forgotPasswordEmail ? '#f8f9fa' : 'white', cursor: forgotPasswordEmail ? 'not-allowed' : 'text' }}
                    />
                    {validationErrors.email && (
                      <span className="validation-error">
                        {validationErrors.email}
                      </span>
                    )}
                  </div>
                </>
              ) : forgotPasswordStep === "otp" ? (
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
                          onChange={(e) =>
                            handleOtpInputChange(index, e.target.value)
                          }
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
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Nhập mật khẩu mới"
                        value={forgotNewPassword}
                        onChange={(e) => {
                          setForgotNewPassword(e.target.value);
                          if (validationErrors.newPassword) {
                            setValidationErrors({
                              ...validationErrors,
                              newPassword: "",
                            });
                          }
                        }}
                        className={validationErrors.newPassword ? "input-error" : ""}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <VisibilityOffIcon className="eye-icon" />
                        ) : (
                          <VisibilityIcon className="eye-icon" />
                        )}
                      </button>
                    </div>
                    {validationErrors.newPassword && (
                      <span className="validation-error">
                        {validationErrors.newPassword}
                      </span>
                    )}
                    {!validationErrors.newPassword && (
                      <span className="password-hint">Ít nhất 8 ký tự, bao gồm chữ, số và ký tự đặc biệt</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Nhập lại mật khẩu mới</label>
                    <div className="password-input">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Nhập lại mật khẩu mới"
                        value={forgotConfirmPassword}
                        onChange={(e) => {
                          setForgotConfirmPassword(e.target.value);
                          if (validationErrors.confirmPassword) {
                            setValidationErrors({
                              ...validationErrors,
                              confirmPassword: "",
                            });
                          }
                        }}
                        className={validationErrors.confirmPassword ? "input-error" : ""}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <VisibilityOffIcon className="eye-icon" />
                        ) : (
                          <VisibilityIcon className="eye-icon" />
                        )}
                      </button>
                    </div>
                    {validationErrors.confirmPassword && (
                      <span className="validation-error">
                        {validationErrors.confirmPassword}
                      </span>
                    )}
                  </div>
                </>
              )}

              <button
                type="button"
                className="btn-update"
                onClick={handleForgotPasswordAction}
                disabled={isForgotPasswordLoading}
              >
                {isForgotPasswordLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    {forgotPasswordStep === "email"
                      ? "Đang gửi..."
                      : forgotPasswordStep === "otp"
                      ? "Đang xác minh..."
                      : "Đang xử lý..."}
                  </>
                ) : (
                  forgotPasswordStep === "email"
                    ? "Gửi mã"
                    : forgotPasswordStep === "otp"
                    ? "Xác nhận mã"
                    : "Đặt lại mật khẩu"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;

