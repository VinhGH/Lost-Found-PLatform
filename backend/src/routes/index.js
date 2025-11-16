import express from 'express';
import accountRoutes from '../modules/account/accountRoutes.js';
import postRoutes from '../modules/post/postRoutes.js';
import matchRoutes from '../modules/match/matchRoutes.js';
import chatRoutes from '../modules/chat/chatRoutes.js';
import notificationRoutes from '../modules/notification/notificationRoutes.js';
import categoryRoutes from '../modules/category/categoryRoutes.js';
import locationRoutes from '../modules/location/locationRoutes.js';

const router = express.Router();

// Mount routes
router.use('/accounts', accountRoutes);
router.use('/posts', postRoutes);
router.use('/matches', matchRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/categories', categoryRoutes);
router.use('/locations', locationRoutes);

export default router;
