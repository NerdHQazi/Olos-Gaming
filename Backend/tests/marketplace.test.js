const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://mock.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role-key';
process.env.NODE_ENV = 'test';

const supabase = require('../src/config/supabase');
const app = require('../src/app');

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${port}`,
      });
    });
  });
}

test('Marketplace API Suite', async (t) => {
  const { server, baseUrl } = await startServer();
  const originalFrom = supabase.from;

  t.after(() => {
    supabase.from = originalFrom;
    server.close();
  });

  const mockPromo = {
    id: 'promo-genesis-viper-elite',
    title: 'Genesis Viper Elite Pack',
    name: 'Neon Viper Skin',
    badge: 'LEGENDARY',
    collection: 'Genesis',
    description: 'Unlock premium neon visual upgrades and 3 powerful consumable boosts.',
    image_url: '/snakeNft.png',
    ends_at: '2026-10-15T12:00:00Z',
    price_gvt: 120,
    cta_label: 'Grab the Pack',
    bundle_item_ids: ['item-001', 'item-002'],
    created_by: 'CyberStrike Studios',
    is_active: true,
  };

  const mockItems = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Neon Cobra Fang Skin',
      description: 'Luminous trail shaders',
      badge: 'LEGENDARY',
      category: 'skins',
      collection: 'Genesis',
      price_gvt: 450,
      image_url: '/neonCobraFang.png',
      created_by: 'CyberStrike Studios',
      is_limited_edition: false,
      supply: 500,
      status: 'active',
      created_at: '2026-08-14T20:00:00Z',
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Hyper Speed Boost v2',
      description: 'Temporary 2x speed multiplier',
      badge: 'EPIC',
      category: 'boosts',
      collection: 'Hyper',
      price_gvt: 120,
      image_url: '/hyperSpeedBoost.png',
      created_by: 'CyberStrike Studios',
      is_limited_edition: false,
      supply: 2000,
      status: 'active',
      created_at: '2026-08-14T19:00:00Z',
    },
  ];

  await t.test('GET /api/marketplace/items returns catalog, categories, promo, and USD rates', async () => {
    supabase.from = (table) => {
      if (table === 'marketplace_promos') {
        const promoBuilder = {
          select: () => promoBuilder,
          eq: () => promoBuilder,
          order: () => promoBuilder,
          limit: () => promoBuilder,
          maybeSingle: async () => ({ data: mockPromo, error: null }),
        };
        return promoBuilder;
      }
      if (table === 'marketplace_items') {
        const itemBuilder = {
          select: () => itemBuilder,
          eq: () => itemBuilder,
          order: () => itemBuilder,
          range: (from, to) => Promise.resolve({ data: mockItems.slice(from, to + 1), count: mockItems.length, error: null }),
        };
        return itemBuilder;
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/marketplace/items`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.strictEqual(body.success, true);
    assert.ok(body.data.promo, 'Promo banner must be returned');
    assert.strictEqual(body.data.promo.title, 'Genesis Viper Elite Pack');
    assert.strictEqual(body.data.promo.priceGvt, 120);
    assert.strictEqual(body.data.promo.priceUsd, 12); // 120 * 0.1

    assert.ok(Array.isArray(body.data.categories));
    assert.strictEqual(body.data.categories.length, 6);

    assert.strictEqual(body.data.items.length, 2);
    const firstItem = body.data.items[0];
    assert.strictEqual(firstItem.name, 'Neon Cobra Fang Skin');
    assert.strictEqual(firstItem.priceGvt, 450);
    assert.strictEqual(firstItem.priceUsd, 45); // 450 * 0.1
    assert.strictEqual(firstItem.badge, 'LEGENDARY');

    assert.deepStrictEqual(body.data.trending, []);
    assert.deepStrictEqual(body.data.recentlySold, []);
    assert.strictEqual(body.pagination.total, 2);
  });

  await t.test('GET /api/marketplace/items handles category filtering, search, and sorting', async () => {
    let capturedCategory = null;
    let capturedSearch = null;
    let capturedSortCol = null;
    let capturedSortAsc = null;

    supabase.from = (table) => {
      if (table === 'marketplace_promos') {
        const promoBuilder = {
          select: () => promoBuilder,
          eq: () => promoBuilder,
          order: () => promoBuilder,
          limit: () => promoBuilder,
          maybeSingle: async () => ({ data: null, error: null }),
        };
        return promoBuilder;
      }
      if (table === 'marketplace_items') {
        const itemBuilder = {
          select: () => itemBuilder,
          eq: (col, val) => {
            if (col === 'category') capturedCategory = val;
            return itemBuilder;
          },
          or: (val) => {
            capturedSearch = val;
            return itemBuilder;
          },
          order: (col, opts) => {
            capturedSortCol = col;
            capturedSortAsc = opts?.ascending;
            return itemBuilder;
          },
          range: () => Promise.resolve({ data: [mockItems[0]], count: 1, error: null }),
        };
        return itemBuilder;
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/marketplace/items?category=skins&search=Cobra&sort=price-asc`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.strictEqual(capturedCategory, 'skins');
    assert.ok(capturedSearch.includes('Cobra'));
    assert.strictEqual(capturedSortCol, 'price_gvt');
    assert.strictEqual(capturedSortAsc, true);
    assert.strictEqual(body.filters.category, 'skins');
    assert.strictEqual(body.filters.search, 'Cobra');
    assert.strictEqual(body.filters.sort, 'price-asc');
  });

  await t.test('GET /api/marketplace/items validates query parameters', async () => {
    const res1 = await fetch(`${baseUrl}/api/marketplace/items?category=weapons`);
    assert.strictEqual(res1.status, 400);
    const body1 = await res1.json();
    assert.strictEqual(body1.success, false);
    assert.strictEqual(body1.message, 'Validation failed');

    const res2 = await fetch(`${baseUrl}/api/marketplace/items?sort=cheapest`);
    assert.strictEqual(res2.status, 400);

    const res3 = await fetch(`${baseUrl}/api/marketplace/items?limit=500`);
    assert.strictEqual(res3.status, 400);
  });

  await t.test('GET /api/marketplace/items handles database failure', async () => {
    supabase.from = (table) => {
      if (table === 'marketplace_promos') {
        const promoBuilder = {
          select: () => promoBuilder,
          eq: () => promoBuilder,
          order: () => promoBuilder,
          limit: () => promoBuilder,
          maybeSingle: async () => ({ data: null, error: null }),
        };
        return promoBuilder;
      }
      if (table === 'marketplace_items') {
        const itemBuilder = {
          select: () => itemBuilder,
          eq: () => itemBuilder,
          order: () => itemBuilder,
          range: () => Promise.resolve({ data: null, count: null, error: new Error('Table not found') }),
        };
        return itemBuilder;
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/marketplace/items`);
    assert.strictEqual(res.status, 500);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Failed to retrieve marketplace catalog');
  });

  await t.test('GET /api/marketplace/items/:id returns complete item details and related items', async () => {
    const targetItem = mockItems[0];
    supabase.from = (table) => {
      if (table === 'marketplace_items') {
        const builder = {
          select: () => builder,
          eq: (col, val) => {
            if (col === 'id' && val === targetItem.id) {
              return { maybeSingle: async () => ({ data: targetItem, error: null }) };
            }
            return builder;
          },
          neq: () => builder,
          limit: () => Promise.resolve({ data: [mockItems[1]], error: null }),
        };
        return builder;
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/marketplace/items/${targetItem.id}`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.id, targetItem.id);
    assert.strictEqual(body.data.name, 'Neon Cobra Fang Skin');
    assert.strictEqual(body.data.priceGvt, 450);
    assert.strictEqual(body.data.priceUsd, 45);
    assert.ok(body.data.assetMetadata.has3dPreview);
    assert.ok(Array.isArray(body.data.assetMetadata.attributes));
    assert.strictEqual(body.data.relatedItems.length, 1);
    assert.strictEqual(body.data.relatedItems[0].id, mockItems[1].id);
  });

  await t.test('GET /api/marketplace/items/:id inspects promo bundle when ID matches promo', async () => {
    supabase.from = (table) => {
      if (table === 'marketplace_items') {
        const builder = {
          select: () => builder,
          eq: () => builder,
          neq: () => builder,
          limit: () => Promise.resolve({ data: [], error: null }),
          maybeSingle: async () => ({ data: null, error: null }),
        };
        return builder;
      }
      if (table === 'marketplace_promos') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: mockPromo, error: null }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/marketplace/items/${mockPromo.id}`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.id, mockPromo.id);
    assert.strictEqual(body.data.name, 'Neon Viper Skin');
    assert.strictEqual(body.data.priceGvt, 120);
    assert.strictEqual(body.data.priceUsd, 12);
  });

  await t.test('GET /api/marketplace/items/:id returns 404 when item does not exist', async () => {
    supabase.from = (table) => {
      if (table === 'marketplace_items') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        };
      }
      if (table === 'marketplace_promos') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/marketplace/items/non-existent-id`);
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Item not found');
  });
});
