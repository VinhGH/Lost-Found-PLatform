const jwt = require('jsonwebtoken');
const accountModel = require('./accountModel');
const { comparePassword, hashPassword } = require('../../utils/hash');

class AccountController {
  // ===========================
  // 🔹 LOGIN HANDLER
  // ===========================
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Kiểm tra đầu vào
      if (!email || !password)
        return res.status(400).json({ success: false, message: 'Email and password required' });
      if (!email.endsWith('@dtu.edu.vn'))
        return res.status(400).json({ success: false, message: 'Email must end with @dtu.edu.vn' });

      // Lấy user theo email
      const user = await accountModel.getByEmail(email);
      if (!user)
        return res.status(401).json({ success: false, message: 'Invalid email or password' });

      // So khớp mật khẩu
      const valid = await comparePassword(password, user.Password);
      if (!valid)
        return res.status(401).json({ success: false, message: 'Invalid email or password' });

      // Tạo JWT token
      const token = jwt.sign(
        { accountId: user.Account_id, role: user.Role, email: user.Email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Trả về thông tin user
      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          account_id: user.Account_id,
          email: user.Email,
          role: user.Role,
          user_name: user.User_name,
          avatar: user.Avatar,
          phone_number: user.Phone_number
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // ===========================
  // 🔹 REGISTER HANDLER
  // ===========================
  async register(req, res, next) {
    try {
      // ✅ Giải nén đủ các trường từ request body
      const { email, password, user_name, phone_number } = req.body;

      if (!email || !password)
        return res.status(400).json({ success: false, message: 'Email and password required' });
      if (!email.endsWith('@dtu.edu.vn'))
        return res.status(400).json({ success: false, message: 'Email must end with @dtu.edu.vn' });

      // Kiểm tra email đã tồn tại chưa
      const existingUser = await accountModel.getByEmail(email);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }

      // Hash mật khẩu
      const hashedPassword = await hashPassword(password);

      // Gọi model để tạo tài khoản mới
      const newUser = await accountModel.create({
        email,
        password: hashedPassword,
        user_name: user_name || 'Anonymous',
        phone_number: phone_number || null,
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        user: {
          account_id: newUser?.Account_id || null,
          email: email,
          role: 'Student'
        }
      });
    } catch (error) {
      console.error('❌ Register error:', error.message);
      next(error);
    }
  }

  // ===========================
  // 🔹 PROFILE HANDLER
  // ===========================
  async getProfile(req, res, next) {
    res.json({ success: true, message: 'Profile endpoint - OK' });
  }
}

module.exports = new AccountController();
