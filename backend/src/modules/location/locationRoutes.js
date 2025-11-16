import express from 'express';
import { verifyToken } from '../../middleware/authMiddleware.js';
import * as controller from './locationController.js';

const router = express.Router();

// Public routes
router.get('/', controller.getAllLocations);
router.get('/:id', controller.getLocationById);

// Protected routes (admin only for create/update/delete)
router.post('/', verifyToken, controller.createLocation);
router.put('/:id', verifyToken, controller.updateLocation);
router.delete('/:id', verifyToken, controller.deleteLocation);

export default router;

