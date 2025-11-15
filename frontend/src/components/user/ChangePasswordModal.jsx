import React, { useState, useRef, useEffect } from "react";
import "./ChangePasswordModal.css";
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Warning as WarningIcon,
  ArrowBack as ArrowBackIcon
} from "@mui/icons-material";
import userApi from "../../services/userApi";

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
  const [forgotPasswordStep, setForgotPasswordStep] = useState("email"); // 'email' | 'otp'
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [otpInputs, setOtpInputs] = useState(["", "", "", "", "", ""]); // 6 số OTP
  const otpInputRefs = useRef([]);
  // ✅ State để track xem đã xác nhận OTP thành công chưa (sau đó chỉ hiện 2 input)
  const [otpVerified, setOtpVerified] = useState(false);

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
    if (password.length < 6) {
      return "Mật khẩu phải có ít nhất 6 ký tự";
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

    // ✅ Validate form
    const errors = {};
    
    // ✅ Nếu chưa xác nhận OTP (otpVerified = false), cần kiểm tra mật khẩu hiện tại
    if (!otpVerified) {
      const currentPasswordError = validatePassword(currentPassword);
      if (currentPasswordError) errors.currentPassword = currentPasswordError;
    }

    const newPasswordError = validatePassword(newPassword);
    if (newPasswordError) errors.newPassword = newPasswordError;

    const confirmPasswordError = validateConfirmPassword(newPassword, confirmPassword);
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setIsLoading(false);
      return;
    }

    // ✅ Kiểm tra mật khẩu hiện tại (chỉ khi chưa xác nhận OTP)
    if (!otpVerified) {
      const currentUser = userApi.getCurrentUser();
      if (!currentUser) {
        setError("Không tìm thấy thông tin người dùng");
        setIsLoading(false);
        return;
      }

      // ✅ Kiểm tra mật khẩu hiện tại (demo: mật khẩu mặc định là "user123")
      if (currentPassword !== "user123") {
        setError("Mật khẩu hiện tại không đúng");
        setIsLoading(false);
        return;
      }

      // ✅ Kiểm tra mật khẩu mới không được trùng với mật khẩu cũ
      if (currentPassword === newPassword) {
        setError("Mật khẩu mới phải khác mật khẩu hiện tại");
        setIsLoading(false);
        return;
      }
    }

    try {
      // ✅ Gọi API đổi mật khẩu
      // Nếu đã xác nhận OTP, không cần currentPassword
      const response = await userApi.changePassword({
        currentPassword: otpVerified ? undefined : currentPassword,
        newPassword,
      });

      if (response.success) {
        // ✅ Đổi mật khẩu thành công
        if (onSuccess) {
          onSuccess("Đổi mật khẩu thành công");
        }
        // ✅ Reset state và đóng modal
        setOtpVerified(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        onClose();
      } else {
        setError(response.error || "Đổi mật khẩu thất bại");
      }
    } catch (error) {
      console.error("❌ Change password error:", error);
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Xử lý "Quên mật khẩu"
  const handleForgotPassword = () => {
    const currentUser = userApi.getCurrentUser();
    // ✅ Tự động điền email đã đăng nhập
    const userEmail = currentUser?.email || "";
    setForgotPasswordEmail(userEmail);
    setShowForgotPassword(true);
    setForgotPasswordStep("email");
    setOtpInputs(["", "", "", "", "", ""]);
    setError("");
    setValidationErrors({});
  };

  // ✅ Xử lý gửi mã OTP hoặc xác nhận mã OTP
  const handleSendOtp = async () => {
    if (forgotPasswordStep === "email") {
      // ✅ Bước 1: Gửi mã OTP
      const emailError = validateEmail(forgotPasswordEmail);
      if (emailError) {
        setValidationErrors({ email: emailError });
        return;
      }

      // ✅ Tạo mã OTP ngẫu nhiên 6 số
      // 🔹 Mã OTP giả để test: 123456
      const generatedOtp = process.env.NODE_ENV === 'development' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();

      // ✅ Hiển thị mã OTP trong console và alert để test
      console.log('🔐 Mã OTP quên mật khẩu:', generatedOtp);
      if (process.env.NODE_ENV === 'development') {
        alert(`🔐 Mã OTP quên mật khẩu: ${generatedOtp}\n\n(Chỉ hiển thị trong môi trường development)`);
      }

      // ✅ Lưu OTP vào localStorage (trong thực tế sẽ gửi qua email)
      localStorage.setItem(
        "forgotPasswordOtp",
        JSON.stringify({
          email: forgotPasswordEmail,
          otp: generatedOtp,
          timestamp: Date.now(),
        })
      );

      // ✅ Chuyển sang bước nhập OTP
      setForgotPasswordStep("otp");
      setValidationErrors({});

      // ✅ Focus vào ô OTP đầu tiên
      setTimeout(() => {
        if (otpInputRefs.current[0]) {
          otpInputRefs.current[0].focus();
        }
      }, 100);
    } else {
      // ✅ Bước 2: Xác nhận mã OTP
      const enteredOtp = otpInputs.join("");
      if (enteredOtp.length !== 6) {
        setError("Vui lòng nhập đầy đủ 6 số mã OTP");
        return;
      }

      // ✅ Kiểm tra mã OTP
      const savedOtpData = localStorage.getItem("forgotPasswordOtp");
      if (savedOtpData) {
        const { email, otp, timestamp } = JSON.parse(savedOtpData);

        // ✅ Kiểm tra mã OTP có hết hạn không (5 phút)
        if (Date.now() - timestamp > 5 * 60 * 1000) {
          setError("Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.");
          setForgotPasswordStep("email");
          setOtpInputs(["", "", "", "", "", ""]);
          return;
        }

        if (email === forgotPasswordEmail && otp === enteredOtp) {
          // ✅ Mã OTP đúng - quay lại form đổi mật khẩu nhưng chỉ hiện 2 input
          setOtpVerified(true);
          setShowForgotPassword(false);
          setForgotPasswordStep("email");
          setForgotPasswordEmail("");
          setOtpInputs(["", "", "", "", "", ""]);
          setCurrentPassword(""); // Clear mật khẩu hiện tại
          setNewPassword(""); // Reset mật khẩu mới
          setConfirmPassword(""); // Reset xác nhận mật khẩu
          setError("");
          setValidationErrors({});
          localStorage.removeItem("forgotPasswordOtp");
        } else {
          setError("Mã OTP không đúng. Vui lòng thử lại.");
          setOtpInputs(["", "", "", "", "", ""]);
          setTimeout(() => {
            if (otpInputRefs.current[0]) {
              otpInputRefs.current[0].focus();
            }
          }, 100);
        }
      } else {
        setError("Mã OTP không hợp lệ. Vui lòng gửi lại mã mới.");
        setForgotPasswordStep("email");
        setOtpInputs(["", "", "", "", "", ""]);
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
    setOtpVerified(false); // Reset OTP verified state
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
              {/* ✅ Chỉ hiện input "Mật khẩu hiện tại" khi chưa xác nhận OTP */}
              {!otpVerified && (
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
              )}

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

              {/* ✅ Chỉ hiện link "Quên mật khẩu" khi chưa xác nhận OTP */}
              {!otpVerified && (
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
                    setError("");
                    setValidationErrors({});
                    // ✅ Quay lại form đổi mật khẩu (không reset otpVerified nếu đã xác nhận)
                  }}
                >
                  <ArrowBackIcon className="back-icon" />
                  <span>Quay lại</span>
                </button>
              <h2>
                {forgotPasswordStep === "email"
                  ? "Quên mật khẩu"
                  : "Nhập mã OTP"}
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
              )}

              <button
                type="button"
                className="btn-update"
                onClick={handleSendOtp}
              >
                {forgotPasswordStep === "email" ? "Gửi mã" : "Xác nhận"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;

