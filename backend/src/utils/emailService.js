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
