// 📂 backend/src/routes/accountRoutes.js
import express from 'express';
import { getAccounts } from '../controllers/accountController.js';

const router = express.Router();

// ✅ Đúng: chỉ cần '/' vì đã có prefix '/api/accounts' ở index.js
router.get('/', getAccounts);

export default router;
