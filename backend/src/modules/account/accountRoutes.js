// 📂 backend/src/modules/account/accountRoutes.js
import express from 'express';
import { login, register, getProfile } from './accountController.js';
import { verifyToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

// 🔐 Đăng nhập
router.post('/login', login);

// 📝 Đăng ký
router.post('/register', register);

// 👤 Lấy thông tin người dùng (bắt buộc token)
router.get('/profile', verifyToken, getProfile);

export default router;
