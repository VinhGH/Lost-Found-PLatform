import express from 'express';
import { verifyToken } from '../../middleware/authMiddleware.js';
import * as controller from './postController.js';

const router = express.Router();

// Public routes
router.get('/', controller.getAllPosts);
router.get('/types', controller.getPostTypes);
router.get('/type/:postType', controller.getPostsByType);
router.get('/:id', controller.getPostById);
router.get('/:id/image', controller.getImageByPostId);
router.get('/:id/images', controller.getPostImages);

// Protected routes
router.get('/my/posts', verifyToken, controller.getMyPosts); // Must be before /:id to avoid conflict
router.post('/', verifyToken, controller.createPost);
router.put('/:id', verifyToken, controller.updatePost);
router.delete('/:id', verifyToken, controller.deletePost);

export default router;
