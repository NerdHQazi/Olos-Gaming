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

test('Marketplace Purchase and User Inventory Suite (Phase 5)', async (t) => {
  const { server, baseUrl } = await startServer();
  const originalGetUser = supabase.auth.getUser;
  const originalFrom = supabase.from;
  const originalRpc = supabase.rpc;

  t.after(() => {
    supabase.auth.getUser = originalGetUser;
    supabase.from = originalFrom;
    supabase.rpc = originalRpc;
    server.close();
  });

  const testUserId = 'user-uuid-1111';
  const testUserAuth = { id: testUserId, email: 'player@example.com' };

  // Setup default mock auth
  supabase.auth.getUser = async (token) => {
    if (token === 'valid-token') {
      return { data: { user: testUserAuth }, error: null };
    }
    return { data: { user: null }, error: new Error('Invalid token') };
  };

  await t.test('POST /api/marketplace/purchase - rejects unauthenticated requests with 401', async () => {
    const res = await fetch(`${baseUrl}/api/marketplace/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: 'item-1', quantity: 1 }),
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  await t.test('POST /api/marketplace/purchase - rejects invalid request body with 400', async () => {
    const res = await fetch(`${baseUrl}/api/marketplace/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ itemId: '', quantity: -5 }),
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Validation failed');
  });

  await t.test('POST /api/marketplace/purchase - returns 404 when item not found', async () => {
    supabase.rpc = async () => ({
      data: null,
      error: { message: 'Item not found or inactive' },
    });
    supabase.from = (table) => {
      if (table === 'marketplace_items') {
        const b = {
          select: () => b,
          eq: () => b,
          maybeSingle: async () => ({ data: null, error: null }),
        };
        return b;
      }
      return {};
    };

    const res = await fetch(`${baseUrl}/api/marketplace/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ itemId: 'nonexistent-item', quantity: 1 }),
    });
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  await t.test('POST /api/marketplace/purchase - returns 409 when item is out of stock', async () => {
    supabase.rpc = async () => ({
      data: null,
      error: { message: 'Item is out of stock' },
    });
    supabase.from = (table) => {
      if (table === 'marketplace_items') {
        const b = {
          select: () => b,
          eq: () => b,
          maybeSingle: async () => ({
            data: { id: 'item-out', name: 'Rare Skin', status: 'active', supply: 0, price_gvt: 50 },
            error: null,
          }),
        };
        return b;
      }
      return {};
    };

    const res = await fetch(`${baseUrl}/api/marketplace/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ itemId: 'item-out', quantity: 1 }),
    });
    assert.strictEqual(res.status, 409);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Item is out of stock');
  });

  await t.test('POST /api/marketplace/purchase - returns 400 when user has insufficient GVT balance', async () => {
    supabase.rpc = async () => ({
      data: null,
      error: { message: 'Insufficient GVT balance' },
    });

    const res = await fetch(`${baseUrl}/api/marketplace/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ itemId: 'expensive-item', quantity: 1 }),
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Insufficient GVT balance');
  });

  await t.test('POST /api/marketplace/purchase - fails closed with 500 when RPC fails (no non-atomic fallback)', async () => {
    let directTableCalled = false;
    supabase.rpc = async () => ({
      data: null,
      error: { code: 'PGRST202', message: 'Could not find the function in schema cache' },
    });

    supabase.from = (table) => {
      directTableCalled = true;
      throw new Error(`Unexpected direct table query on ${table} during RPC failure`);
    };

    const res = await fetch(`${baseUrl}/api/marketplace/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ itemId: 'item-blade', quantity: 1 }),
    });

    assert.strictEqual(res.status, 500);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(directTableCalled, false, 'Controller must not attempt direct table fallback when RPC fails');
  });

  await t.test('POST /api/marketplace/purchase - returns 403 when RPC returns Unauthorized authorization error', async () => {
    supabase.rpc = async () => ({
      data: null,
      error: { message: 'Unauthorized: Caller cannot purchase for another user' },
    });

    const res = await fetch(`${baseUrl}/api/marketplace/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ itemId: 'item-blade', quantity: 1 }),
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /Unauthorized/);
  });

  await t.test('POST /api/marketplace/purchase - succeeds via atomic RPC result and enforces caller user ID', async () => {
    let rpcCalledWith = null;

    supabase.rpc = async (func, args) => {
      assert.strictEqual(func, 'purchase_marketplace_item');
      rpcCalledWith = args;
      return {
        data: {
          success: true,
          transactionId: 'tx-rpc-777',
          purchasedItem: {
            id: 'item-rpc',
            name: 'RPC Nano Shield',
            badge: 'LEGENDARY',
            category: 'boosts',
            priceGvt: 500,
            imageUrl: '/shield.png',
          },
          deductedAmount: 500,
          remainingBalance: 1500,
        },
        error: null,
      };
    };

    const res = await fetch(`${baseUrl}/api/marketplace/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ itemId: 'item-rpc', quantity: 1 }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.transactionId, 'tx-rpc-777');
    assert.strictEqual(body.deductedAmount, 500);
    assert.strictEqual(body.remainingBalance, 1500);
    assert.strictEqual(rpcCalledWith.p_user_id, testUserId, 'Must strictly pass authenticated user ID to RPC');
    assert.strictEqual(rpcCalledWith.p_item_id, 'item-rpc');
  });

  await t.test('GET /api/user/inventory - rejects unauthenticated requests with 401', async () => {
    const res = await fetch(`${baseUrl}/api/user/inventory`);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  await t.test('GET /api/user/inventory - returns player inventory list with USD rates', async () => {
    const mockInventory = [
      {
        id: 'inv-1',
        item_id: 'item-blade',
        quantity: 2,
        acquired_at: '2026-08-15T12:00:00Z',
        marketplace_items: {
          id: 'item-blade',
          name: 'Cyber Katana',
          badge: 'RARE',
          category: 'weapons',
          collection: 'Genesis',
          price_gvt: 250,
          image_url: '/katana.png',
          asset_metadata: { has3dPreview: true },
        },
      },
    ];

    supabase.from = (table) => {
      assert.strictEqual(table, 'user_inventory');
      const b = {
        select: () => b,
        eq: () => b,
        order: async () => ({ data: mockInventory, error: null }),
      };
      return b;
    };

    const res = await fetch(`${baseUrl}/api/user/inventory`, {
      headers: { Authorization: 'Bearer valid-token' },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(Array.isArray(body.data), true);
    assert.strictEqual(body.data.length, 1);
    const first = body.data[0];
    assert.strictEqual(first.inventoryId, 'inv-1');
    assert.strictEqual(first.itemId, 'item-blade');
    assert.strictEqual(first.quantity, 2);
    assert.strictEqual(first.priceGvt, 250);
    assert.strictEqual(first.priceUsd, 25.0);
    assert.strictEqual(first.name, 'Cyber Katana');
    assert.strictEqual(first.badge, 'RARE');
    assert.strictEqual(first.category, 'weapons');
  });

  await t.test('GET /api/user/inventory - returns empty data array when player owns no items', async () => {
    supabase.from = (table) => {
      const b = {
        select: () => b,
        eq: () => b,
        order: async () => ({ data: [], error: null }),
      };
      return b;
    };

    const res = await fetch(`${baseUrl}/api/user/inventory`, {
      headers: { Authorization: 'Bearer valid-token' },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.deepStrictEqual(body.data, []);
  });
});
