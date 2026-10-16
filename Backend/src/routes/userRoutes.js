const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');

router.get('/profile', requireAuth, userController.getProfile);
router.get('/inventory', requireAuth, userController.getUserInventory);
router.get('/matches/recent', requireAuth, userController.getRecentMatches);

module.exports = router;

