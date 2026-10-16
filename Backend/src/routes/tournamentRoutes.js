const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// GET /api/tournaments - Public/Optional Auth: List & search tournaments
router.get('/', optionalAuth, tournamentController.listTournaments);

// GET /api/tournaments/:id - Public/Optional Auth: Inspect tournament details, rules, and bracket tree
router.get('/:id', optionalAuth, tournamentController.getTournamentDetails);

// POST /api/tournaments/:id/register - Required Auth: Register for tournament and deduct entry stake
router.post('/:id/register', requireAuth, tournamentController.registerTournament);

module.exports = router;
