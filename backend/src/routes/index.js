const express = require('express');
const router = express.Router();

const accountRoutes = require('../modules/account/accountRoutes');
router.use('/accounts', accountRoutes);

module.exports = router;
