import express from 'express';
import { verifyToken } from '../../middleware/authMiddleware.js';
import * as controller from './chatController.js';

const router = express.Router();

// All chat routes require authentication
router.post('/conversations', verifyToken, controller.createConversation);
router.get('/conversations', verifyToken, controller.getConversations);
router.get('/conversations/:id', verifyToken, controller.getConversationById);
router.get('/conversations/:id/messages', verifyToken, controller.getMessages);
router.post('/conversations/:id/messages', verifyToken, controller.sendMessage);

// Post-based conversation routes
router.post('/conversations/by-post', verifyToken, controller.createOrGetConversationByPost);
router.delete('/conversations/:id', verifyToken, controller.deleteConversation);

export default router;

