import express from 'express';
import * as controller from './categoryController.js';

const router = express.Router();

// Public routes
router.get('/', controller.getAllCategories);
router.get('/:id', controller.getCategoryById);

export default router;

