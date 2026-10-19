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
        baseUrl: `http://127.0.0.1:${port}`
      });
    });
  });
}

function createMatchesQueryMock({ data = [], count = null, error = null, onIn, onOrder } = {}) {
  const query = {
    in(field, values) {
      if (onIn) onIn(field, values);
      return query;
    },
    order(field, opts) {
      if (onOrder) onOrder(field, opts);
      return query;
    },
    range(from, to) {
      return Promise.resolve({ data, count: count !== null ? count : (data ? data.length : 0), error });
    }
  };
  return query;
}

test('GET /api/user/matches/recent Suite', async (t) => {
  const { server, baseUrl } = await startServer();

  const originalGetUser = supabase.auth.getUser;
  const originalFrom = supabase.from;

  t.after(() => {
    supabase.auth.getUser = originalGetUser;
    supabase.from = originalFrom;
    server.close();
  });

  const testUserId = '11111111-1111-1111-1111-111111111111';
  const opponentId = '22222222-2222-2222-2222-222222222222';
  const matchId1 = '00000000-0000-0000-0000-000000000001';
  const matchId2 = '00000000-0000-0000-0000-000000000002';
  const matchId3 = '00000000-0000-0000-0000-000000000003';
  const matchId4 = '00000000-0000-0000-0000-000000000004';

  // 1. Authentication
  await t.test('returns 401 when Authorization header is missing', async () => {
    const res = await fetch(`${baseUrl}/api/user/matches/recent`);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Authorization token required');
  });

  await t.test('returns 401 when Authorization token is invalid', async () => {
    supabase.auth.getUser = async () => ({
      data: null,
      error: { message: 'Invalid token' }
    });

    const res = await fetch(`${baseUrl}/api/user/matches/recent`, {
      headers: { Authorization: 'Bearer invalid-token' }
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Invalid or expired token');
  });

  // 2. Query validation
  await t.test('rejects invalid limit or status query parameters with 400', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId } },
      error: null
    });

    const res1 = await fetch(`${baseUrl}/api/user/matches/recent?limit=100`, {
      headers: { Authorization: 'Bearer valid-token' }
    });
    assert.strictEqual(res1.status, 400);
    const body1 = await res1.json();
    assert.strictEqual(body1.success, false);
    assert.strictEqual(body1.message, 'Invalid query parameters');

    const res2 = await fetch(`${baseUrl}/api/user/matches/recent?status=invalid_status`, {
      headers: { Authorization: 'Bearer valid-token' }
    });
    assert.strictEqual(res2.status, 400);
  });

  // 3. Empty matches
  await t.test('returns 200 with empty array when user has no matches', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId } },
      error: null
    });

    supabase.from = (table) => {
      assert.strictEqual(table, 'matches');
      return {
        select: () => ({
          or: () => createMatchesQueryMock({ data: [], count: 0 })
        })
      };
    };

    const res = await fetch(`${baseUrl}/api/user/matches/recent`, {
      headers: { Authorization: 'Bearer valid-token' }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 0);
    assert.strictEqual(body.pagination.total, 0);
    assert.strictEqual(body.pagination.limit, 5);
    assert.strictEqual(body.pagination.page, 1);
  });

  // 4. Returns formatted recent matches with opponent profiles and payouts
  await t.test('returns formatted recent matches with opponent details and rewards', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId } },
      error: null
    });

    const mockMatches = [
      {
        id: matchId1,
        player1_id: testUserId,
        player2_id: opponentId,
        game_type: 'chess',
        stake_amount: 50.0,
        player1_score: 1,
        player2_score: 0,
        status: 'finished',
        winner_id: testUserId,
        created_at: '2026-10-15T10:00:00Z',
        last_move_timestamp: '2026-10-15T10:15:00Z',
        authority_resolved_at: '2026-10-15T10:15:00Z',
        authority_resolution_reason: 'chess_checkmate',
        terminal_reason: 'chess_checkmate'
      },
      {
        id: matchId2,
        player1_id: opponentId,
        player2_id: testUserId,
        game_type: 'checkers',
        stake_amount: 20.0,
        player1_score: 1,
        player2_score: 0,
        status: 'finished',
        winner_id: opponentId,
        created_at: '2026-10-14T10:00:00Z',
        last_move_timestamp: '2026-10-14T10:20:00Z',
        authority_resolved_at: '2026-10-14T10:20:00Z',
        authority_resolution_reason: 'checkers_wipeout',
        terminal_reason: null
      }
    ];

    const mockOpponentProfile = {
      id: opponentId,
      username: 'GrandmasterJane',
      full_name: 'Jane Doe',
      avatar_url: '/avatars/jane.png'
    };

    const mockPayout = {
      match_id: matchId1,
      winner_id: testUserId,
      stake_amount: 50.0,
      total_pot: 100.0,
      fee_amount: 10.0,
      payout_amount: 90.0
    };

    supabase.from = (table) => {
      if (table === 'matches') {
        return {
          select: () => ({
            or: () => createMatchesQueryMock({ data: mockMatches, count: 2 })
          })
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [mockOpponentProfile], error: null })
          })
        };
      }
      if (table === 'match_payouts') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [mockPayout], error: null })
          })
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/user/matches/recent?limit=5`, {
      headers: { Authorization: 'Bearer valid-token' }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 2);
    assert.strictEqual(body.pagination.total, 2);

    // Match 1: User won
    const m1 = body.data[0];
    assert.strictEqual(m1.matchId, matchId1);
    assert.strictEqual(m1.isWinner, true);
    assert.strictEqual(m1.isDraw, false);
    assert.strictEqual(m1.gameType, 'chess');
    assert.strictEqual(m1.opponent.username, 'GrandmasterJane');
    assert.strictEqual(m1.scores.userScore, 1);
    assert.strictEqual(m1.scores.opponentScore, 0);
    assert.strictEqual(m1.rewards.stakeReturned, 50.0);
    assert.strictEqual(m1.rewards.winnings, 40.0);
    assert.strictEqual(m1.rewards.fee, 10.0);
    assert.strictEqual(m1.rewards.netEarnings, 40.0);
    assert.strictEqual(m1.rewards.currency, 'GVT');
    assert.strictEqual(m1.rewards.settled, true);
    assert.strictEqual(m1.resolvedReason, 'chess_checkmate');

    // Match 2: User lost
    const m2 = body.data[1];
    assert.strictEqual(m2.matchId, matchId2);
    assert.strictEqual(m2.isWinner, false);
    assert.strictEqual(m2.isDraw, false);
    assert.strictEqual(m2.gameType, 'checkers');
    assert.strictEqual(m2.opponent.username, 'GrandmasterJane');
    assert.strictEqual(m2.rewards.netEarnings, -20.0);
    assert.strictEqual(m2.rewards.stakeReturned, 0.0);
    assert.strictEqual(m2.rewards.fee, 0.0);
    assert.strictEqual(m2.rewards.settled, true);
  });

  // 5. Handles draws
  await t.test('handles draw matches correctly with stake returned and zero winnings', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId } },
      error: null
    });

    const mockDrawMatch = [
      {
        id: matchId3,
        player1_id: testUserId,
        player2_id: opponentId,
        game_type: 'chess',
        stake_amount: 30.0,
        player1_score: 0,
        player2_score: 0,
        status: 'finished',
        winner_id: null,
        created_at: '2026-10-13T10:00:00Z',
        last_move_timestamp: '2026-10-13T10:30:00Z',
        authority_resolved_at: '2026-10-13T10:30:00Z',
        authority_resolution_reason: 'draw_stalemate',
        terminal_reason: null
      }
    ];

    supabase.from = (table) => {
      if (table === 'matches') {
        return {
          select: () => ({
            or: () => createMatchesQueryMock({ data: mockDrawMatch, count: 1 })
          })
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [], error: null }) // Profile not found
          })
        };
      }
      if (table === 'match_payouts') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [], error: null })
          })
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/user/matches/recent`, {
      headers: { Authorization: 'Bearer valid-token' }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 1);

    const draw = body.data[0];
    assert.strictEqual(draw.isWinner, false);
    assert.strictEqual(draw.isDraw, true);
    assert.strictEqual(draw.rewards.stakeReturned, 30.0);
    assert.strictEqual(draw.rewards.winnings, 0.0);
    assert.strictEqual(draw.rewards.netEarnings, 0.0);
    assert.strictEqual(draw.rewards.fee, 0.0);
    assert.strictEqual(draw.rewards.settled, true);
    assert.strictEqual(draw.opponent.username, null); // Gracefully handled missing profile
  });

  // 6. Fix 1 Regression: Paid match with no authoritative match_payouts record returns zero reported earnings and settled: false
  await t.test('Fix 1: returns zero reported earnings and settled=false when paid match lacks payout record', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId } },
      error: null
    });

    const mockUnsettledMatch = [
      {
        id: matchId4,
        player1_id: testUserId,
        player2_id: opponentId,
        game_type: 'chess',
        stake_amount: 100.0,
        player1_score: 1,
        player2_score: 0,
        status: 'finished',
        winner_id: testUserId,
        created_at: '2026-10-16T12:00:00Z',
        last_move_timestamp: '2026-10-16T12:20:00Z',
        authority_resolved_at: '2026-10-16T12:20:00Z',
        authority_resolution_reason: 'chess_checkmate',
        terminal_reason: null
      }
    ];

    supabase.from = (table) => {
      if (table === 'matches') {
        return {
          select: () => ({
            or: () => createMatchesQueryMock({ data: mockUnsettledMatch, count: 1 })
          })
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [], error: null })
          })
        };
      }
      if (table === 'match_payouts') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [], error: null }) // No payout record exists
          })
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/user/matches/recent`, {
      headers: { Authorization: 'Bearer valid-token' }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 1);

    const m = body.data[0];
    assert.strictEqual(m.matchId, matchId4);
    assert.strictEqual(m.isWinner, true);
    assert.strictEqual(m.rewards.stakeReturned, 0.0);
    assert.strictEqual(m.rewards.winnings, 0.0);
    assert.strictEqual(m.rewards.fee, 0.0);
    assert.strictEqual(m.rewards.netEarnings, 0.0);
    assert.strictEqual(m.rewards.currency, 'GVT');
    assert.strictEqual(m.rewards.settled, false);
  });

  // 7. Fix 1 Regression: Free match (stake 0) with no payout record returns settled: true and zero earnings
  await t.test('Fix 1: returns settled=true and zero earnings for free finished match', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId } },
      error: null
    });

    const mockFreeMatch = [
      {
        id: 'free-match-1',
        player1_id: testUserId,
        player2_id: opponentId,
        game_type: 'chess',
        stake_amount: 0.0,
        player1_score: 1,
        player2_score: 0,
        status: 'finished',
        winner_id: testUserId,
        created_at: '2026-10-16T12:00:00Z',
        last_move_timestamp: '2026-10-16T12:15:00Z',
        authority_resolved_at: '2026-10-16T12:15:00Z',
        authority_resolution_reason: 'chess_checkmate',
        terminal_reason: null
      }
    ];

    supabase.from = (table) => {
      if (table === 'matches') {
        return {
          select: () => ({
            or: () => createMatchesQueryMock({ data: mockFreeMatch, count: 1 })
          })
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [], error: null })
          })
        };
      }
      if (table === 'match_payouts') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [], error: null })
          })
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/user/matches/recent`, {
      headers: { Authorization: 'Bearer valid-token' }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);

    const m = body.data[0];
    assert.strictEqual(m.isWinner, true);
    assert.strictEqual(m.rewards.stakeReturned, 0.0);
    assert.strictEqual(m.rewards.winnings, 0.0);
    assert.strictEqual(m.rewards.fee, 0.0);
    assert.strictEqual(m.rewards.netEarnings, 0.0);
    assert.strictEqual(m.rewards.settled, true);
  });

  // 8. Fix 2 Regression: Include reconnecting matches in the active status filter
  await t.test('Fix 2: includes reconnecting in active status filter query', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId } },
      error: null
    });

    let inField = null;
    let inValues = null;

    const mockReconnectingMatch = [
      {
        id: 'reconnecting-match-1',
        player1_id: testUserId,
        player2_id: opponentId,
        game_type: 'chess',
        stake_amount: 10.0,
        player1_score: 0,
        player2_score: 0,
        status: 'reconnecting',
        winner_id: null,
        created_at: '2026-10-16T14:00:00Z',
        last_move_timestamp: '2026-10-16T14:05:00Z',
        authority_resolved_at: null,
        authority_resolution_reason: null,
        terminal_reason: null
      }
    ];

    supabase.from = (table) => {
      if (table === 'matches') {
        return {
          select: () => ({
            or: () => createMatchesQueryMock({
              data: mockReconnectingMatch,
              count: 1,
              onIn: (field, values) => {
                inField = field;
                inValues = values;
              }
            })
          })
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [], error: null })
          })
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/user/matches/recent?status=active`, {
      headers: { Authorization: 'Bearer valid-token' }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(inField, 'status');
    assert.deepStrictEqual(inValues, ['active', 'waiting', 'reconnecting']);
    assert.strictEqual(body.data[0].status, 'reconnecting');
    assert.strictEqual(body.data[0].rewards, null);
  });

  // 9. Fix 3 Regression: Deterministic secondary ordering by match ID
  await t.test('Fix 3: applies created_at DESC followed by id DESC for deterministic pagination', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId } },
      error: null
    });

    const orderCalls = [];

    supabase.from = (table) => {
      if (table === 'matches') {
        return {
          select: () => ({
            or: () => createMatchesQueryMock({
              data: [],
              count: 0,
              onOrder: (field, opts) => {
                orderCalls.push({ field, opts });
              }
            })
          })
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/user/matches/recent`, {
      headers: { Authorization: 'Bearer valid-token' }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(orderCalls.length, 2);
    assert.deepStrictEqual(orderCalls[0], { field: 'created_at', opts: { ascending: false } });
    assert.deepStrictEqual(orderCalls[1], { field: 'id', opts: { ascending: false } });
  });

  // 10. Handles active/incomplete match
  await t.test('handles active matches with null rewards', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId } },
      error: null
    });

    const mockActiveMatch = [
      {
        id: 'active-match-1',
        player1_id: testUserId,
        player2_id: opponentId,
        game_type: 'chess',
        stake_amount: 15.0,
        player1_score: 0,
        player2_score: 0,
        status: 'active',
        winner_id: null,
        created_at: '2026-10-16T10:00:00Z',
        last_move_timestamp: '2026-10-16T10:05:00Z',
        authority_resolved_at: null,
        authority_resolution_reason: null,
        terminal_reason: null
      }
    ];

    supabase.from = (table) => {
      if (table === 'matches') {
        return {
          select: () => ({
            or: () => createMatchesQueryMock({ data: mockActiveMatch, count: 1 })
          })
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [], error: null })
          })
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/user/matches/recent`, {
      headers: { Authorization: 'Bearer valid-token' }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data[0].rewards, null);
    assert.strictEqual(body.data[0].status, 'active');
  });

  // 11. Database error handling
  await t.test('returns 500 when database query fails', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId } },
      error: null
    });

    supabase.from = () => ({
      select: () => ({
        or: () => createMatchesQueryMock({
          data: null,
          error: { message: 'Database error' },
          count: null
        })
      })
    });

    const res = await fetch(`${baseUrl}/api/user/matches/recent`, {
      headers: { Authorization: 'Bearer valid-token' }
    });

    assert.strictEqual(res.status, 500);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Failed to retrieve recent matches');
  });
});
