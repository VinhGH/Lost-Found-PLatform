import express from 'express';
import { getPosts } from '../controllers/postController.js';

const router = express.Router();

// GET /api/posts - Get all posts with account information
router.get('/posts', getPosts);

export default router;
