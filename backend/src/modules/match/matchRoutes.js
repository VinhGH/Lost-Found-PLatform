import express from 'express';
import { verifyToken } from '../../middleware/authMiddleware.js';
import * as controller from './matchController.js';

const router = express.Router();

// All match routes require authentication
router.post('/', verifyToken, controller.createMatch);
router.get('/my', verifyToken, controller.getMyMatches);
router.get('/post/:postId', controller.getMatchesByPost);
router.get('/:id', controller.getMatchById);
router.put('/:id/status', verifyToken, controller.updateMatchStatus);
router.delete('/:id', verifyToken, controller.deleteMatch);

export default router;

