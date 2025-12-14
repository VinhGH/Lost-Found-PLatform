/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - Contains at least one letter (a-z, A-Z)
 * - Contains at least one number (0-9)
 * - Contains at least one special character (!@#$%^&*...)
 * 
 * @param {string} password - Password to validate
 * @returns {Object} - { valid: boolean, message: string }
 */
export const validatePassword = (password) => {
  if (!password) {
    return {
      valid: false,
      message: 'Mật khẩu không được để trống'
    };
  }

  if (password.length < 8) {
    return {
      valid: false,
      message: 'Mật khẩu phải có ít nhất 8 ký tự'
    };
  }

  // Check for at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    return {
      valid: false,
      message: 'Mật khẩu phải chứa ít nhất một chữ cái'
    };
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return {
      valid: false,
      message: 'Mật khẩu phải chứa ít nhất một chữ số'
    };
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      valid: false,
      message: 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt (!@#$%^&*...)'
    };
  }

  return {
    valid: true,
    message: 'Mật khẩu hợp lệ'
  };
};
