const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const { optionalAuth } = require('../middleware/auth');

// GET /api/leaderboard/players - Public player leaderboard
router.get('/players', leaderboardController.getPlayerLeaderboard);

// GET /api/leaderboard/guilds - Public/Optional Auth guild leaderboard
router.get('/guilds', optionalAuth, leaderboardController.getGuildLeaderboard);

module.exports = router;
