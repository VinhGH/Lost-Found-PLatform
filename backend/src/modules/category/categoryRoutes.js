import express from 'express';
import * as controller from './categoryController.js';
import { verifyToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', controller.getAllCategories);
router.get('/:id', controller.getCategoryById);

// Admin routes (protected)
router.post('/', verifyToken, controller.createCategory);
router.put('/:id', verifyToken, controller.updateCategory);
router.delete('/:id', verifyToken, controller.deleteCategory);

export default router;

