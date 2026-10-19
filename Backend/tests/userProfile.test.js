const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

// Ensure required environment variables exist for loading configuration
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://mock.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role-key';
process.env.NODE_ENV = 'test';

const supabase = require('../src/config/supabase');
const app = require('../src/app');

// Helper to start the Express app on an ephemeral port
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${port}`
      });
    });
  });
}

test('GET /api/user/profile Suite', async (t) => {
  const { server, baseUrl } = await startServer();

  // Save original Supabase methods so we can restore them
  const originalGetUser = supabase.auth.getUser;
  const originalFrom = supabase.from;

  t.after(() => {
    supabase.auth.getUser = originalGetUser;
    supabase.from = originalFrom;
    server.close();
  });

  await t.test('returns 401 when Authorization header is missing', async () => {
    const res = await fetch(`${baseUrl}/api/user/profile`);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Authorization token required');
  });

  await t.test('returns 401 when Authorization header does not start with Bearer', async () => {
    const res = await fetch(`${baseUrl}/api/user/profile`, {
      headers: { Authorization: 'Basic somecredentials' }
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Authorization token required');
  });

  await t.test('returns 401 when token is empty or whitespace', async () => {
    const res = await fetch(`${baseUrl}/api/user/profile`, {
      headers: { Authorization: 'Bearer    ' }
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Authorization token required');
  });

  await t.test('returns 401 when Supabase rejects the token as invalid or expired', async () => {
    supabase.auth.getUser = async (token) => {
      assert.strictEqual(token, 'expired-token');
      return { data: null, error: new Error('JWT expired') };
    };

    const res = await fetch(`${baseUrl}/api/user/profile`, {
      headers: { Authorization: 'Bearer expired-token' }
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Invalid or expired token');
  });

  await t.test('returns 404 when user profile does not exist in profiles table', async () => {
    const testUserId = '00000000-0000-0000-0000-000000000001';
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId, email: 'ghost@example.com' } },
      error: null
    });

    supabase.from = (table) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: (col, val) => ({
              maybeSingle: async () => {
                assert.strictEqual(col, 'id');
                assert.strictEqual(val, testUserId);
                return { data: null, error: null };
              }
            })
          })
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/user/profile`, {
      headers: { Authorization: 'Bearer valid-token-no-profile' }
    });
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'User profile not found');
  });

  await t.test('returns 500 when profiles table query fails with database or permission error', async () => {
    supabase.auth.getUser = async (token) => {
      assert.strictEqual(token, 'valid-token-db-error');
      return {
        data: { user: { id: '00000000-0000-0000-0000-000000000001', email: 'test@example.com' } },
        error: null
      };
    };

    supabase.from = (table) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: null,
                error: { code: '42501', message: 'permission denied for table profiles' }
              })
            })
          })
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/user/profile`, {
      headers: { Authorization: 'Bearer valid-token-db-error' }
    });
    assert.strictEqual(res.status, 500);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Failed to retrieve user profile');
  });

  await t.test('returns 200 with full profile, wallet balance, and derived match stats', async () => {
    const testUserId = '11111111-1111-1111-1111-111111111111';
    const opponentId = '22222222-2222-2222-2222-222222222222';

    supabase.auth.getUser = async (token) => {
      assert.strictEqual(token, 'valid-token-active-user');
      return {
        data: { user: { id: testUserId, email: 'player@example.com' } },
        error: null
      };
    };

    const mockProfile = {
      id: testUserId,
      username: 'QueenGambit',
      full_name: 'Beth Harmon',
      avatar_url: 'https://example.com/avatar.png',
      email: 'player@example.com',
      wallet_address: '0x71C2a849429188e6E875f284e36D28C59fbaA42B',
      updated_at: new Date().toISOString()
    };

    const mockWallet = {
      balance: 1450.50,
      locked_balance: 100.00
    };

    // 5 completed matches, in reverse chronological order (most recent first):
    // 1. Win (streak 1)
    // 2. Win (streak 2 -> current streak = 2)
    // 3. Loss (broke streak)
    // 4. Win (part of earlier streak)
    // 5. Win (earlier streak = 2 -> best streak = 2)
    const mockMatches = [
      { id: 'm1', player1_id: testUserId, player2_id: opponentId, winner_id: testUserId, status: 'finished', created_at: '2026-10-07T12:00:00Z' },
      { id: 'm2', player1_id: opponentId, player2_id: testUserId, winner_id: testUserId, status: 'finished', created_at: '2026-10-06T12:00:00Z' },
      { id: 'm3', player1_id: testUserId, player2_id: opponentId, winner_id: opponentId, status: 'forfeited', created_at: '2026-10-05T12:00:00Z' },
      { id: 'm4', player1_id: opponentId, player2_id: testUserId, winner_id: testUserId, status: 'finished', created_at: '2026-10-04T12:00:00Z' },
      { id: 'm5', player1_id: testUserId, player2_id: opponentId, winner_id: testUserId, status: 'finished', created_at: '2026-10-03T12:00:00Z' },
    ];

    supabase.from = (table) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: (col, val) => ({
              maybeSingle: async () => {
                assert.strictEqual(col, 'id');
                assert.strictEqual(val, testUserId);
                return { data: mockProfile, error: null };
              }
            })
          })
        };
      }
      if (table === 'wallets') {
        return {
          select: () => ({
            eq: (col, val) => ({
              maybeSingle: async () => {
                assert.strictEqual(col, 'user_id');
                assert.strictEqual(val, testUserId);
                return { data: mockWallet, error: null };
              }
            })
          })
        };
      }
      if (table === 'matches') {
        return {
          select: () => ({
            or: (orFilter) => {
              assert.ok(orFilter.includes(`player1_id.eq.${testUserId}`));
              assert.ok(orFilter.includes(`player2_id.eq.${testUserId}`));
              return {
                in: (col, statusArr) => {
                  assert.strictEqual(col, 'status');
                  assert.deepStrictEqual(statusArr, ['finished', 'forfeited']);
                  return {
                    order: (orderCol, { ascending }) => {
                      assert.strictEqual(orderCol, 'created_at');
                      assert.strictEqual(ascending, false);
                      return Promise.resolve({ data: mockMatches, error: null });
                    }
                  };
                }
              };
            }
          })
        };
      }
      throw new Error(`Unexpected table requested: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/user/profile`, {
      headers: { Authorization: 'Bearer valid-token-active-user' }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.deepStrictEqual(body.data, {
      id: testUserId,
      username: 'QueenGambit',
      fullName: 'Beth Harmon',
      email: 'player@example.com',
      avatarUrl: 'https://example.com/avatar.png',
      walletAddress: '0x71C2a849429188e6E875f284e36D28C59fbaA42B',
      balanceGvt: 1450.50,
      lockedBalanceGvt: 100.00,
      stats: {
        totalMatches: 5,
        wins: 4,
        losses: 1,
        draws: 0,
        winRate: 80.0,
        currentStreak: 2,
        bestStreak: 2
      }
    });
  });

  await t.test('handles user with zero matches and fallback wallet correctly', async () => {
    const testUserId = '33333333-3333-3333-3333-333333333333';

    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId, email: 'newuser@example.com' } },
      error: null
    });

    supabase.from = (table) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: testUserId,
                  username: 'Newbie',
                  full_name: null,
                  avatar_url: null,
                  email: 'newuser@example.com',
                  wallet_address: null,
                  updated_at: new Date().toISOString()
                },
                error: null
              })
            })
          })
        };
      }
      if (table === 'wallets') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }) // wallet not yet created, should fallback
            })
          })
        };
      }
      if (table === 'matches') {
        return {
          select: () => ({
            or: () => ({
              in: () => ({
                order: () => Promise.resolve({ data: [], error: null })
              })
            })
          })
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/user/profile`, {
      headers: { Authorization: 'Bearer token-newbie' }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.balanceGvt, 1000.0);
    assert.strictEqual(body.data.lockedBalanceGvt, 0.0);
    assert.deepStrictEqual(body.data.stats, {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0.0,
      currentStreak: 0,
      bestStreak: 0
    });
  });
});
