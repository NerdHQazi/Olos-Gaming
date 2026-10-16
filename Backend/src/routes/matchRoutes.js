const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { requireAuth } = require('../middleware/auth');

router.get('/:matchId/summary', requireAuth, matchController.getMatchSummary);

module.exports = router;
