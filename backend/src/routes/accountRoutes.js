// 📂 backend/src/routes/accountRoutes.js
import express from 'express';
import { getAccounts } from '../controllers/accountController.js';
import { login, register, getProfile } from '../modules/account/accountController.js';

const router = express.Router();

// ✅ Auth routes
router.post('/login', login);
router.post('/register', register);

// ✅ Profile routes  
router.get('/profile', getProfile);

// ✅ Admin routes
router.get('/', getAccounts);

export default router;
