const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplaceController');
const { requireAuth } = require('../middleware/auth');

// GET /api/marketplace/items - Public catalog
router.get('/items', marketplaceController.getMarketplaceCatalog);

// GET /api/marketplace/items/:id - Public item details
router.get('/items/:id', marketplaceController.getMarketplaceItemById);

// POST /api/marketplace/purchase - Authenticated purchase
router.post('/purchase', requireAuth, marketplaceController.purchaseMarketplaceItem);

module.exports = router;

