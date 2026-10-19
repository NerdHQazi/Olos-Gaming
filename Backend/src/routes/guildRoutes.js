const express = require('express');
const router = express.Router();
const guildController = require('../controllers/guildController');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// GET /api/guilds - Public/Optional Auth: List & search guilds
router.get('/', optionalAuth, guildController.listGuilds);

// POST /api/guilds - Required Auth: Create a new guild
router.post('/', requireAuth, guildController.createGuild);

// GET /api/guilds/:id - Public/Optional Auth: Inspect guild profile & roster
router.get('/:id', optionalAuth, guildController.getGuildById);

// POST /api/guilds/:id/apply - Required Auth: Submit membership application
router.post('/:id/apply', requireAuth, guildController.applyToGuild);

module.exports = router;
