const { z } = require('zod');
const supabase = require('../config/supabase');

const GVT_USD_RATE = 0.1;

const CATEGORY_TABS = [
  { id: 'all', label: 'All' },
  { id: 'skins', label: 'Skins' },
  { id: 'power-ups', label: 'Power-Ups' },
  { id: 'boosts', label: 'Boosts' },
  { id: 'bundles', label: 'Bundles' },
  { id: 'limited-edition', label: 'Limited Edition' },
];

const catalogQuerySchema = z.object({
  category: z
    .string()
    .transform((v) => v.trim().toLowerCase())
    .pipe(z.enum(['all', 'skins', 'power-ups', 'boosts', 'bundles', 'limited-edition']))
    .default('all'),
  search: z.string().trim().optional(),
  sort: z
    .string()
    .transform((v) => v.trim().toLowerCase())
    .pipe(z.enum(['newest', 'price-asc', 'price-desc', 'name']))
    .default('newest'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  page: z.coerce.number().int().min(1).default(1),
});

/**
 * GET /api/marketplace/items
 * Public catalog endpoint returning items, promo banner, category tabs, and sales stats.
 */
const getMarketplaceCatalog = async (req, res) => {
  const parsed = catalogQuerySchema.safeParse(req.query || {});
  if (!parsed.success) {
    const errorList = parsed.error.issues || parsed.error.errors || [];
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorList.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
  }

  const { category, search, sort, limit, page } = parsed.data;
  const offset = (page - 1) * limit;

  try {
    // 1. Fetch active promotional banner
    let promoData = null;
    const { data: promo, error: promoError } = await supabase
      .from('marketplace_promos')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (promoError) {
      console.warn('[MarketplaceController] Warning fetching promo banner:', promoError.message);
    } else if (promo) {
      const priceGvt = Number(promo.price_gvt) || 0;
      promoData = {
        id: promo.id,
        badge: promo.badge || 'LEGENDARY',
        title: promo.title,
        name: promo.name,
        collection: promo.collection || 'Genesis',
        description: promo.description || '',
        imageUrl: promo.image_url,
        endsAt: promo.ends_at,
        priceGvt,
        priceUsd: Number((priceGvt * GVT_USD_RATE).toFixed(2)),
        ctaLabel: promo.cta_label || 'Grab the Pack',
        bundleItemIds: promo.bundle_item_ids || [],
        createdBy: promo.created_by || 'CyberStrike Studios',
      };
    }

    // 2. Fetch catalog items
    let query = supabase
      .from('marketplace_items')
      .select('*', { count: 'exact' })
      .eq('status', 'active');

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    if (search && search.length > 0) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (sort === 'price-asc') {
      query = query.order('price_gvt', { ascending: true });
    } else if (sort === 'price-desc') {
      query = query.order('price_gvt', { ascending: false });
    } else if (sort === 'name') {
      query = query.order('name', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: items, count, error: itemsError } = await query;

    if (itemsError) {
      console.error('[MarketplaceController] Error fetching marketplace items:', itemsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve marketplace catalog',
      });
    }

    const formattedItems = (items || []).map((item) => {
      const priceGvt = Number(item.price_gvt) || 0;
      return {
        id: item.id,
        name: item.name,
        badge: item.badge,
        category: item.category,
        collection: item.collection || 'Genesis',
        priceGvt,
        priceUsd: Number((priceGvt * GVT_USD_RATE).toFixed(2)),
        imageUrl: item.image_url,
        createdBy: item.created_by || 'CyberStrike Studios',
        isLimitedEdition: Boolean(item.is_limited_edition),
      };
    });

    const total = count != null ? count : formattedItems.length;
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: {
        promo: promoData,
        categories: CATEGORY_TABS,
        items: formattedItems,
        trending: [],
        recentlySold: [],
      },
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      filters: {
        category,
        search: search || null,
        sort,
      },
    });
  } catch (error) {
    console.error('[MarketplaceController] Unexpected error in catalog:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching marketplace catalog',
    });
  }
};

/**
 * GET /api/marketplace/items/:id
 * Public endpoint to inspect a single item with creator info, attributes, and 3D preview metadata.
 */
const getMarketplaceItemById = async (req, res) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Invalid item ID',
    });
  }

  try {
    // 1. Fetch item from marketplace_items
    let item = null;
    let isPromoItem = false;

    const { data: itemData, error: itemError } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (itemError) {
      console.error('[MarketplaceController] Error fetching item by ID:', itemError);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve marketplace item',
      });
    }

    item = itemData;

    // If not found in items, check marketplace_promos
    if (!item) {
      const { data: promoData, error: promoError } = await supabase
        .from('marketplace_promos')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (promoError) {
        console.warn('[MarketplaceController] Warning fetching promo by ID:', promoError.message);
      } else if (promoData) {
        item = promoData;
        isPromoItem = true;
      }
    }

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    const priceGvt = Number(item.price_gvt) || 0;
    const priceUsd = Number((priceGvt * GVT_USD_RATE).toFixed(2));

    // 2. Fetch related items (excluding current item)
    const { data: relatedItemsData } = await supabase
      .from('marketplace_items')
      .select('id, name, badge, category, collection, price_gvt, image_url, created_by')
      .eq('status', 'active')
      .neq('id', id)
      .limit(3);

    const relatedItems = (relatedItemsData || []).map((r) => {
      const rPrice = Number(r.price_gvt) || 0;
      return {
        id: r.id,
        name: r.name,
        badge: r.badge,
        category: r.category,
        collection: r.collection || 'Genesis',
        priceGvt: rPrice,
        priceUsd: Number((rPrice * GVT_USD_RATE).toFixed(2)),
        imageUrl: r.image_url,
      };
    });

    const assetMetadata = item.asset_metadata || {};

    return res.status(200).json({
      success: true,
      data: {
        id: item.id,
        name: item.name,
        description: item.description || '',
        badge: item.badge || 'COMMON',
        category: isPromoItem ? 'bundles' : item.category,
        collection: item.collection || 'Genesis',
        priceGvt,
        priceUsd,
        imageUrl: item.image_url,
        createdBy: item.created_by || 'CyberStrike Studios',
        isLimitedEdition: Boolean(item.is_limited_edition),
        supply: item.supply != null ? item.supply : null,
        assetMetadata: {
          has3dPreview: assetMetadata.has3dPreview ?? true,
          previewNote: assetMetadata.previewNote ?? 'Drag to rotate 360° · Animated cyber spine emissive shaders',
          attributes: assetMetadata.attributes ?? [
            { trait: 'Speed Boost', value: '+15%' },
            { trait: 'Visibility', value: '-10%' },
            { trait: 'Emissive Glow', value: 'Neon Cyan' },
          ],
        },
        relatedItems,
        createdAt: item.created_at,
      },
    });
  } catch (error) {
    console.error('[MarketplaceController] Unexpected error in item inspection:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching item',
    });
  }
};

const purchaseBodySchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(100).default(1),
  currency: z.literal('GVT').default('GVT'),
});

/**
 * POST /api/marketplace/purchase
 * Authenticated purchase endpoint with atomic balance debit and inventory crediting.
 */
const purchaseMarketplaceItem = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: User authentication required',
    });
  }

  const parsed = purchaseBodySchema.safeParse(req.body || {});
  if (!parsed.success) {
    const errorList = parsed.error.issues || parsed.error.errors || [];
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorList.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
  }

  const { itemId, quantity } = parsed.data;

  try {
    // Strictly execute atomic Postgres RPC (enforces row locks on item and wallet)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('purchase_marketplace_item', {
      p_user_id: userId,
      p_item_id: itemId,
      p_quantity: quantity,
    });

    if (rpcError) {
      const errMsg = rpcError.message || '';
      if (errMsg.includes('Insufficient GVT balance')) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient GVT balance',
        });
      }
      if (errMsg.includes('Item is out of stock')) {
        return res.status(409).json({
          success: false,
          message: 'Item is out of stock',
        });
      }
      if (errMsg.includes('Item not found') || errMsg.includes('inactive')) {
        return res.status(404).json({
          success: false,
          message: 'Item not found',
        });
      }
      if (errMsg.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          message: errMsg,
        });
      }

      console.error('[MarketplaceController] RPC Error during purchase:', rpcError);
      return res.status(500).json({
        success: false,
        message: rpcError.message || 'Purchase transaction failed',
      });
    }

    if (!rpcResult || !rpcResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Purchase transaction failed to return valid confirmation',
      });
    }

    return res.status(200).json(rpcResult);
  } catch (error) {
    console.error('[MarketplaceController] Unexpected purchase error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while processing purchase',
    });
  }
};

module.exports = {
  getMarketplaceCatalog,
  getMarketplaceItemById,
  purchaseMarketplaceItem,
};
