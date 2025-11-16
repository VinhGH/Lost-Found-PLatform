import express from 'express';
import { verifyToken, requireAdmin, optionalAuth } from '../../middleware/authMiddleware.js';
import * as controller from './postController.js';

const router = express.Router();

// Public routes (with optional auth to detect admin)
router.get('/', optionalAuth, controller.getAllPosts);
router.get('/types', controller.getPostTypes);
router.get('/type/:type', optionalAuth, controller.getPostsByType);

// Protected routes (must be before /:id to avoid conflict)
router.get('/my', verifyToken, controller.getMyPosts);

// Admin routes (must be before /:id)
router.patch('/:id/approve', verifyToken, requireAdmin, controller.approvePost);
router.patch('/:id/reject', verifyToken, requireAdmin, controller.rejectPost);

// Public routes with :id param (must be after specific routes)
router.get('/:id', controller.getPostById);
router.post('/', verifyToken, controller.createPost);
router.put('/:id', verifyToken, controller.updatePost);
router.delete('/:id', verifyToken, controller.deletePost);

export default router;
