import otpModel from './otpModel.js';
import accountModel from '../account/accountModel.js';
import { sendOtpEmail } from '../../utils/emailService.js';
import { hashPassword } from '../../utils/hash.js';
import { validatePassword } from '../../utils/passwordValidator.js';

/**
 * Generate 6-digit OTP code
 * @returns {string}
 */
const generateOtpCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Request OTP for registration
 * POST /api/auth/request-otp
 */
export const requestOtp = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Validate email format
    if (!email.endsWith('@dtu.edu.vn')) {
      return res.status(400).json({
        success: false,
        message: 'Email must end with @dtu.edu.vn'
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    // Check if email already registered
    const existingUser = await accountModel.getByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Generate OTP
    const otpCode = generateOtpCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + (parseInt(process.env.OTP_EXPIRE_MINUTES) || 5));

    // Invalidate previous unused OTPs for this email (optional security measure)
    await otpModel.invalidateAllForEmail(email);

    // Save OTP to database with password in payload
    const otpRecord = await otpModel.create({
      email,
      otpCode,
      payload: { password },
      expiresAt: expiresAt.toISOString()
    });

    // Send OTP email via Gmail SMTP
    console.log('📤 Calling sendOtpEmail function...');
    const emailResult = await sendOtpEmail(email, otpCode);
    console.log('📥 Email result received:', {
      success: emailResult.success,
      error: emailResult.error,
      message: emailResult.message
    });

    if (!emailResult.success) {
      console.error('❌ Failed to send OTP email:', emailResult.error);
      console.error('📧 Email:', email);
      console.error('🔑 OTP Code:', otpCode);
      console.error('💾 OTP saved to DB with ID:', otpRecord?.id);
      
      // Return error - user needs to know email wasn't sent
      return res.status(500).json({
        success: false,
        message: 'Không thể gửi email OTP. Vui lòng kiểm tra cấu hình email server.',
        error: emailResult.error
      });
    }

    console.log('✅ OTP requested and sent for:', email);
    console.log('🔑 OTP Code:', otpCode);

    res.status(200).json({
      success: true,
      message: 'OTP has been sent to your email'
    });
  } catch (error) {
    console.error('❌ Request OTP error:', error);
    next(error);
  }
};

/**
 * Verify OTP and create account
 * POST /api/auth/verify-otp
 */
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Validate email format
    if (!email.endsWith('@dtu.edu.vn')) {
      return res.status(400).json({
        success: false,
        message: 'Email must end with @dtu.edu.vn'
      });
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be 6 digits'
      });
    }

    // Find valid OTP
    const otpRecord = await otpModel.findValidOtp(email, otp);

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Check if email already registered (double check)
    const existingUser = await accountModel.getByEmail(email);
    if (existingUser) {
      // Mark OTP as used even if account exists
      await otpModel.markAsUsed(otpRecord.id);
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Get password from payload
    const { password } = otpRecord.payload;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP payload'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create account
    const newUser = await accountModel.create({
      email,
      password: hashedPassword,
      user_name: 'Anonymous',
      phone_number: null
    });

    // Mark OTP as used
    await otpModel.markAsUsed(otpRecord.id);

    console.log('✅ Account created via OTP verification for:', email);

    // Return success WITHOUT token (user must login separately)
    res.status(200).json({
      success: true,
      message: 'Email verified successfully. Please login.'
    });
  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    next(error);
  }
};

/**
 * Request password reset OTP
 * POST /api/auth/request-password-reset
 */
export const requestPasswordResetOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    if (!email.endsWith('@dtu.edu.vn')) {
      return res.status(400).json({
        success: false,
        message: 'Email must end with @dtu.edu.vn'
      });
    }

    const user = await accountModel.getByEmail(email);
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Nếu địa chỉ email này có trong hệ thống, chúng tôi đã gửi mã OTP đến hộp thư của bạn.'
      });
    }

    const otpCode = generateOtpCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + (parseInt(process.env.OTP_EXPIRE_MINUTES) || 5));

    await otpModel.invalidateAllForEmail(email);

    const otpRecord = await otpModel.create({
      email,
      otpCode,
      payload: { purpose: 'password_reset' },
      expiresAt: expiresAt.toISOString()
    });

    console.log('📤 Sending password reset OTP...');
    const emailResult = await sendOtpEmail(email, otpCode);
    console.log('📥 Email result received:', {
      success: emailResult.success,
      error: emailResult.error,
      message: emailResult.message
    });

    if (!emailResult.success) {
      console.error('❌ Failed to send password reset OTP:', emailResult.error);
      console.error('📧 Email:', email);
      console.error('🔑 OTP Code:', otpCode);
      console.error('💾 OTP saved to DB with ID:', otpRecord?.id);

      return res.status(500).json({
        success: false,
        message: 'Không thể gửi email OTP. Vui lòng kiểm tra cấu hình email server.',
        error: emailResult.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Nếu địa chỉ email này có trong hệ thống, chúng tôi đã gửi mã OTP đến hộp thư của bạn.'
    });
  } catch (error) {
    console.error('❌ Request password reset OTP error:', error);
    next(error);
  }
};

/**
 * Reset password using OTP
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP and new password are required'
      });
    }

    if (!email.endsWith('@dtu.edu.vn')) {
      return res.status(400).json({
        success: false,
        message: 'Email must end with @dtu.edu.vn'
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be 6 digits'
      });
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    const user = await accountModel.getByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const otpRecord = await otpModel.findValidOtp(email, otp);
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    if (!otpRecord.payload || otpRecord.payload.password) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP purpose'
      });
    }

    if (otpRecord.payload.purpose !== 'password_reset') {
      return res.status(400).json({
        success: false,
        message: 'OTP is not for password reset'
      });
    }

    const hashedPassword = await hashPassword(newPassword);
    await accountModel.updatePasswordByEmail(email, hashedPassword);
    await otpModel.markAsUsed(otpRecord.id);

    console.log('✅ Password reset successfully for:', email);

    res.status(200).json({
      success: true,
      message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập.'
    });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    next(error);
  }
};

