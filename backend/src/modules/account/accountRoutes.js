import express from 'express';
import { verifyToken } from '../../middleware/authMiddleware.js';
import { login, register, getProfile, updateProfile, changePassword } from './accountController.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.post('/change-password', verifyToken, changePassword);

export default router;
