import express from 'express';
import { requestOtp, verifyOtp, requestPasswordResetOtp, resetPassword } from './otpController.js';

const router = express.Router();

// Public routes - no authentication required
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/request-password-reset', requestPasswordResetOtp);
router.post('/reset-password', resetPassword);

export default router;

