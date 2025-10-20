import express from 'express';
import { verifyToken } from '../../middleware/authMiddleware.js';
import * as controller from './notificationController.js';

const router = express.Router();

// All notification routes require authentication
router.get('/', verifyToken, controller.getNotifications);
router.get('/unread-count', verifyToken, controller.getUnreadCount);
router.put('/mark-all-read', verifyToken, controller.markAllAsRead);
router.put('/:id/read', verifyToken, controller.markAsRead);
router.delete('/:id', verifyToken, controller.deleteNotification);

export default router;

