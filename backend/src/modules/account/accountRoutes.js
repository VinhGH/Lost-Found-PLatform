const express = require('express');
const router = express.Router();
const controller = require('./accountController');
const { verifyToken } = require('../../middleware/authMiddleware');

router.post('/login', controller.login);
router.post('/register', controller.register);
router.get('/profile', verifyToken, controller.getProfile);

module.exports = router;
