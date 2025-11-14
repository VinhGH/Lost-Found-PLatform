// 📂 backend/src/modules/account/accountController.js
import jwt from 'jsonwebtoken';
import accountModel from './accountModel.js';
import { comparePassword, hashPassword } from '../../utils/hash.js';

// =====================
// 🔐 LOGIN
// =====================
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: 'Email and password required' });

    if (!email.endsWith('@dtu.edu.vn'))
      return res
        .status(400)
        .json({ success: false, message: 'Email must end with @dtu.edu.vn' });

    const user = await accountModel.getByEmail(email);
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: 'Invalid email or password' });

    const valid = await comparePassword(password, user.password);
    if (!valid)
      return res
        .status(401)
        .json({ success: false, message: 'Invalid email or password' });

    const token = jwt.sign(
      { accountId: user.account_id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// =====================
// 🧪 REGISTER
// =====================
export const register = async (req, res, next) => {
  try {
    const { email, password, user_name, phone_number } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: 'Email and password required' });

    if (!email.endsWith('@dtu.edu.vn'))
      return res
        .status(400)
        .json({ success: false, message: 'Email must end with @dtu.edu.vn' });

    const existingUser = await accountModel.getByEmail(email);
    if (existingUser)
      return res
        .status(400)
        .json({ success: false, message: 'Email already registered' });

    const hashedPassword = await hashPassword(password);

    const newUser = await accountModel.create({
      email,
      password: hashedPassword,
      user_name: user_name || 'Anonymous',
      phone_number: phone_number || null,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: newUser,
    });
  } catch (error) {
    console.error('❌ Register error:', error.message);
    next(error);
  }
};

// =====================
// 👤 GET PROFILE (đúng chuẩn Supabase)
// =====================
export const getProfile = async (req, res, next) => {
  try {
    const accountId = req.user?.accountId;

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const user = await accountModel.getById(accountId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};
