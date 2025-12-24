import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Create Nodemailer transporter for Gmail SMTP
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === 'true' || true, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // App Password from Google
    },
  });
};

/**
 * Send OTP email via Gmail SMTP
 * @param {string} to - Recipient email address
 * @param {string} otpCode - 6-digit OTP code
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const sendOtpEmail = async (to, otpCode) => {
  try {
    console.log('📧 Attempting to send OTP email to:', to);
    console.log('📮 SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
    console.log('📮 EMAIL_FROM:', process.env.EMAIL_FROM || 'NOT SET');

    // Validate configuration
    if (!process.env.SMTP_USER) {
      console.error('❌ SMTP_USER not configured in .env file');
      console.error('💡 Please add SMTP_USER=your-email@gmail.com to your .env file');
      return {
        success: false,
        error: 'Email service not configured - SMTP_USER missing'
      };
    }

    if (!process.env.SMTP_PASS) {
      console.error('❌ SMTP_PASS not configured in .env file');
      console.error('💡 Please add SMTP_PASS=your-app-password to your .env file');
      return {
        success: false,
        error: 'Email service not configured - SMTP_PASS missing'
      };
    }

    if (!process.env.EMAIL_FROM) {
      console.error('❌ EMAIL_FROM not configured in .env file');
      console.error('💡 Please add EMAIL_FROM=your-email@gmail.com to your .env file');
      return {
        success: false,
        error: 'Email sender not configured - EMAIL_FROM missing'
      };
    }

    // Create transporter
    const transporter = createTransporter();

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: to,
      subject: 'Mã OTP xác minh email - Lost & Found DTU',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Mã OTP xác minh email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">TimDoDTU</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">DTU Lost & Found Platform</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Xác minh email của bạn</h2>
            <p>Xin chào,</p>
            <p>Bạn đang đăng ký tài khoản trên nền tảng Lost & Found DTU. Vui lòng sử dụng mã OTP sau để xác minh email của bạn:</p>
            
            <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <p style="margin: 0; font-size: 14px; color: #666; margin-bottom: 10px;">Mã OTP của bạn:</p>
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${otpCode}
              </div>
            </div>
            
            <p style="color: #e74c3c; font-weight: bold;">⚠️ Mã OTP này có hiệu lực trong 5 phút.</p>
            <p style="color: #e74c3c;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; margin: 0;">
              Email này được gửi tự động từ hệ thống Lost & Found DTU.<br>
              Vui lòng không trả lời email này.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
TimDoDTU - DTU Lost & Found Platform

Xác minh email của bạn

Xin chào,

Bạn đang đăng ký tài khoản trên nền tảng Lost & Found DTU. Vui lòng sử dụng mã OTP sau để xác minh email của bạn:

Mã OTP: ${otpCode}

⚠️ Mã OTP này có hiệu lực trong 5 phút.

Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.

---
Email này được gửi tự động từ hệ thống Lost & Found DTU.
Vui lòng không trả lời email này.
      `
    };

    console.log('📤 Sending email via Gmail SMTP...');
    console.log('   From:', process.env.EMAIL_FROM);
    console.log('   To:', to);

    // Send email with timeout (45 seconds max)
    const emailTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email sending timeout after 45 seconds')), 45000);
    });

    const info = await Promise.race([
      transporter.sendMail(mailOptions),
      emailTimeout
    ]);

    console.log('✅ OTP email sent successfully to:', to);
    console.log('📧 Message ID:', info.messageId);

    return {
      success: true,
      message: 'OTP email sent successfully',
      data: {
        messageId: info.messageId,
        response: info.response
      }
    };
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email'
    };
  }
};

/**
 * Send AI Match notification email via Gmail SMTP
 * @param {string} to - Recipient email address
 * @param {string} userName - User's name
 * @param {string} userPostTitle - Title of user's post
 * @param {string} matchedPostTitle - Title of the matched post
 * @param {number} similarityScore - Match similarity score (0-1)
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const sendMatchNotificationEmail = async (to, userName, userPostTitle, matchedPostTitle, similarityScore) => {
  try {
    console.log('📧 Attempting to send AI Match notification email to:', to);

    // Validate configuration
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.EMAIL_FROM) {
      console.error('❌ Email service not configured properly');
      return {
        success: false,
        error: 'Email service not configured'
      };
    }

    // Create transporter
    const transporter = createTransporter();

    // Convert similarity score to percentage
    const matchPercentage = Math.round(similarityScore * 100);

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: to,
      subject: '🎯 Tìm thấy bài đăng phù hợp - Lost & Found DTU',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tìm thấy bài đăng phù hợp</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🎯 TimDoDTU</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">DTU Lost & Found Platform</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Xin chào ${userName || 'bạn'},</h2>
            <p>Chúng tôi có tin vui cho bạn! 🎉</p>
            <p>Hệ thống AI của chúng tôi đã tìm thấy một bài đăng có độ phù hợp <strong style="color: #667eea;">${matchPercentage}%</strong> với bài đăng của bạn.</p>
            
            <div style="background: white; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 5px;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">📝 Bài đăng của bạn:</p>
              <p style="margin: 0; font-size: 16px; font-weight: bold; color: #333;">"${userPostTitle}"</p>
            </div>

            <div style="background: white; border-left: 4px solid #52c41a; padding: 20px; margin: 25px 0; border-radius: 5px;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">✅ Bài đăng phù hợp:</p>
              <p style="margin: 0; font-size: 16px; font-weight: bold; color: #333;">"${matchedPostTitle}"</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://lost-found-dtu.vercel.app'}/matches" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
                Xem chi tiết ngay
              </a>
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              💡 <strong>Gợi ý:</strong> Hãy kiểm tra thông tin chi tiết và liên hệ với người đăng bài để xác nhận nhé!
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; margin: 0;">
              Email này được gửi tự động từ hệ thống Lost & Found DTU.<br>
              Vui lòng không trả lời email này.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
TimDoDTU - DTU Lost & Found Platform

Xin chào ${userName || 'bạn'},

Chúng tôi có tin vui cho bạn! 🎉

Hệ thống AI của chúng tôi đã tìm thấy một bài đăng có độ phù hợp ${matchPercentage}% với bài đăng của bạn.

📝 Bài đăng của bạn: "${userPostTitle}"
✅ Bài đăng phù hợp: "${matchedPostTitle}"

Hãy truy cập ${process.env.FRONTEND_URL || 'https://lost-found-dtu.vercel.app'}/matches để xem chi tiết.

💡 Gợi ý: Hãy kiểm tra thông tin chi tiết và liên hệ với người đăng bài để xác nhận nhé!

---
Email này được gửi tự động từ hệ thống Lost & Found DTU.
Vui lòng không trả lời email này.
      `
    };

    console.log('📤 Sending AI Match notification email via Gmail SMTP...');
    console.log('   From:', process.env.EMAIL_FROM);
    console.log('   To:', to);

    // Send email with timeout (45 seconds max)
    const emailTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email sending timeout after 45 seconds')), 45000);
    });

    const info = await Promise.race([
      transporter.sendMail(mailOptions),
      emailTimeout
    ]);

    console.log('✅ AI Match notification email sent successfully to:', to);
    console.log('📧 Message ID:', info.messageId);

    return {
      success: true,
      message: 'AI Match notification email sent successfully',
      data: {
        messageId: info.messageId,
        response: info.response
      }
    };
  } catch (error) {
    console.error('❌ Error sending AI Match notification email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email'
    };
  }
};

/**
 * Send account lock notification email
 * @param {string} to - Recipient email address
 * @param {string} userName - User's name
 * @param {string} reason - Reason for lock (optional)
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const sendAccountLockEmail = async (to, userName, reason = '') => {
  try {
    console.log('📧 Attempting to send account lock email to:', to);

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.EMAIL_FROM) {
      return { success: false, error: 'Email service not configured' };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: to,
      subject: '⚠️ Tài khoản của bạn đã bị khóa - Lost & Found DTU',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">⚠️ TimDoDTU</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">DTU Lost & Found Platform</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #e74c3c; margin-top: 0;">Tài khoản của bạn đã bị khóa</h2>
            <p>Xin chào <strong>${userName || 'bạn'}</strong>,</p>
            <p>Chúng tôi rất tiếc phải thông báo rằng tài khoản của bạn đã bị khóa bởi quản trị viên.</p>
            
            ${reason ? `
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; color: #856404;"><strong>Lý do:</strong> ${reason}</p>
            </div>
            ` : ''}

            <div style="background: white; border: 1px solid #ddd; padding: 20px; margin: 25px 0; border-radius: 5px;">
              <p style="margin: 0 0 10px 0; font-weight: bold;">Điều này có nghĩa là:</p>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Bạn không thể đăng nhập vào hệ thống</li>
                <li>Các bài đăng của bạn sẽ bị ẩn</li>
                <li>Bạn không thể tạo bài đăng mới</li>
              </ul>
            </div>

            <p style="color: #666; font-size: 14px;">
              💡 <strong>Cần hỗ trợ?</strong> Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ với quản trị viên qua email: <a href="mailto:${process.env.SMTP_USER}">${process.env.SMTP_USER}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; margin: 0;">
              Email này được gửi tự động từ hệ thống Lost & Found DTU.<br>
              Vui lòng không trả lời email này.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
TimDoDTU - DTU Lost & Found Platform

Tài khoản của bạn đã bị khóa

Xin chào ${userName || 'bạn'},

Chúng tôi rất tiếc phải thông báo rằng tài khoản của bạn đã bị khóa bởi quản trị viên.

${reason ? `Lý do: ${reason}` : ''}

Điều này có nghĩa là:
- Bạn không thể đăng nhập vào hệ thống
- Các bài đăng của bạn sẽ bị ẩn
- Bạn không thể tạo bài đăng mới

💡 Cần hỗ trợ? Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ với quản trị viên qua email: ${process.env.SMTP_USER}

---
Email này được gửi tự động từ hệ thống Lost & Found DTU.
      `
    };

    const emailTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email timeout')), 45000);
    });

    const info = await Promise.race([transporter.sendMail(mailOptions), emailTimeout]);

    console.log('✅ Account lock email sent to:', to);
    return { success: true, message: 'Account lock email sent', data: { messageId: info.messageId } };
  } catch (error) {
    console.error('❌ Error sending account lock email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send account unlock notification email
 * @param {string} to - Recipient email address
 * @param {string} userName - User's name
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const sendAccountUnlockEmail = async (to, userName) => {
  try {
    console.log('📧 Attempting to send account unlock email to:', to);

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.EMAIL_FROM) {
      return { success: false, error: 'Email service not configured' };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: to,
      subject: '✅ Tài khoản của bạn đã được mở khóa - Lost & Found DTU',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0;">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">✅ TimDoDTU</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">DTU Lost & Found Platform</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #52c41a; margin-top: 0;">Tài khoản đã được mở khóa! 🎉</h2>
            <p>Xin chào <strong>${userName || 'bạn'}</strong>,</p>
            <p>Chúng tôi vui mừng thông báo rằng tài khoản của bạn đã được mở khóa bởi quản trị viên.</p>
            
            <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; color: #155724;"><strong>✅ Bạn có thể:</strong></p>
              <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #155724;">
                <li>Đăng nhập vào hệ thống</li>
                <li>Tạo và quản lý bài đăng</li>
                <li>Sử dụng đầy đủ các tính năng</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://lost-found-dtu.vercel.app'}/login" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                Đăng nhập ngay
              </a>
            </div>

            <p style="color: #666; font-size: 14px;">
              💡 Vui lòng tuân thủ các quy định của cộng đồng để tránh bị khóa lại trong tương lai.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; margin: 0;">
              Email này được gửi tự động từ hệ thống Lost & Found DTU.<br>
              Vui lòng không trả lời email này.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
TimDoDTU - DTU Lost & Found Platform

Tài khoản đã được mở khóa! 🎉

Xin chào ${userName || 'bạn'},

Chúng tôi vui mừng thông báo rằng tài khoản của bạn đã được mở khóa bởi quản trị viên.

✅ Bạn có thể:
- Đăng nhập vào hệ thống
- Tạo và quản lý bài đăng
- Sử dụng đầy đủ các tính năng

Đăng nhập tại: ${process.env.FRONTEND_URL || 'https://lost-found-dtu.vercel.app'}/login

💡 Vui lòng tuân thủ các quy định của cộng đồng để tránh bị khóa lại trong tương lai.

---
Email này được gửi tự động từ hệ thống Lost & Found DTU.
      `
    };

    const emailTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email timeout')), 45000);
    });

    const info = await Promise.race([transporter.sendMail(mailOptions), emailTimeout]);

    console.log('✅ Account unlock email sent to:', to);
    return { success: true, message: 'Account unlock email sent', data: { messageId: info.messageId } };
  } catch (error) {
    console.error('❌ Error sending account unlock email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send post status change notification email
 * @param {string} to - Recipient email address
 * @param {string} userName - User's name
 * @param {string} postTitle - Post title
 * @param {string} action - 'approved' | 'rejected' | 'deleted'
 * @param {string} reason - Reason for rejection/deletion (optional)
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const sendPostStatusEmail = async (to, userName, postTitle, action, reason = '') => {
  try {
    console.log(`📧 Attempting to send post ${action} email to:`, to);

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.EMAIL_FROM) {
      return { success: false, error: 'Email service not configured' };
    }

    const transporter = createTransporter();

    // Configure based on action
    const config = {
      approved: {
        subject: '✅ Bài đăng của bạn đã được duyệt - Lost & Found DTU',
        icon: '✅',
        title: 'Bài đăng đã được duyệt!',
        color: '#52c41a',
        bgColor: '#d4edda',
        borderColor: '#28a745',
        textColor: '#155724',
        message: 'Chúc mừng! Bài đăng của bạn đã được quản trị viên phê duyệt và hiện đã được công khai trên hệ thống.',
        cta: 'Xem bài đăng'
      },
      rejected: {
        subject: '❌ Bài đăng của bạn bị từ chối - Lost & Found DTU',
        icon: '❌',
        title: 'Bài đăng bị từ chối',
        color: '#e74c3c',
        bgColor: '#f8d7da',
        borderColor: '#dc3545',
        textColor: '#721c24',
        message: 'Rất tiếc, bài đăng của bạn đã bị từ chối bởi quản trị viên.',
        cta: 'Tạo bài mới'
      },
      deleted: {
        subject: '🗑️ Bài đăng của bạn đã bị xóa - Lost & Found DTU',
        icon: '🗑️',
        title: 'Bài đăng đã bị xóa',
        color: '#ff9800',
        bgColor: '#fff3cd',
        borderColor: '#ffc107',
        textColor: '#856404',
        message: 'Bài đăng của bạn đã bị xóa bởi quản trị viên.',
        cta: 'Về trang chủ'
      }
    };

    const cfg = config[action] || config.rejected;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: to,
      subject: cfg.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">${cfg.icon} TimDoDTU</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">DTU Lost & Found Platform</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: ${cfg.color}; margin-top: 0;">${cfg.title}</h2>
            <p>Xin chào <strong>${userName || 'bạn'}</strong>,</p>
            <p>${cfg.message}</p>
            
            <div style="background: white; border-left: 4px solid ${cfg.borderColor}; padding: 20px; margin: 25px 0; border-radius: 5px;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">📝 Bài đăng:</p>
              <p style="margin: 0; font-size: 16px; font-weight: bold; color: #333;">"${postTitle}"</p>
            </div>

            ${reason ? `
            <div style="background: ${cfg.bgColor}; border-left: 4px solid ${cfg.borderColor}; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; color: ${cfg.textColor};"><strong>Lý do:</strong> ${reason}</p>
            </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://lost-found-dtu.vercel.app'}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                ${cfg.cta}
              </a>
            </div>

            ${action === 'approved' ? `
            <p style="color: #666; font-size: 14px;">
              💡 <strong>Gợi ý:</strong> Bài đăng của bạn giờ đây có thể được người khác tìm thấy. Hãy kiểm tra thường xuyên để không bỏ lỡ tin nhắn!
            </p>
            ` : `
            <p style="color: #666; font-size: 14px;">
              💡 Vui lòng đảm bảo bài đăng tuân thủ quy định cộng đồng trước khi đăng lại.
            </p>
            `}
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; margin: 0;">
              Email này được gửi tự động từ hệ thống Lost & Found DTU.<br>
              Vui lòng không trả lời email này.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
TimDoDTU - DTU Lost & Found Platform

${cfg.title}

Xin chào ${userName || 'bạn'},

${cfg.message}

📝 Bài đăng: "${postTitle}"

${reason ? `Lý do: ${reason}` : ''}

Truy cập: ${process.env.FRONTEND_URL || 'https://lost-found-dtu.vercel.app'}

---
Email này được gửi tự động từ hệ thống Lost & Found DTU.
      `
    };

    const emailTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email timeout')), 45000);
    });

    const info = await Promise.race([transporter.sendMail(mailOptions), emailTimeout]);

    console.log(`✅ Post ${action} email sent to:`, to);
    return { success: true, message: `Post ${action} email sent`, data: { messageId: info.messageId } };
  } catch (error) {
    console.error(`❌ Error sending post ${action} email:`, error);
    return { success: false, error: error.message };
  }
};

