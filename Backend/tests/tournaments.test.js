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

test('Tournaments API Suite (Phase 7)', async (t) => {
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

  const validTournamentId = '00000000-0000-0000-0000-000000000001';
  const testUserId = '11111111-1111-1111-1111-111111111111';

  const mockTournamentRow = {
    id: validTournamentId,
    title: 'OLOS Championship Series #47',
    description: 'Premier Quantum Chess knockout tournament.',
    game_type: 'chess',
    status: 'registration_open',
    format: 'single_elimination',
    entry_fee_gvt: 50.0,
    prize_pool_gvt: 500.0,
    currency: 'GVT',
    max_participants: 8,
    current_participants: 6,
    round_number: 1,
    total_rounds: 3,
    bracket_data: {
      quarters: [
        { p1: 'Satoshi12', p1Score: 3, p2: 'ChainLord', p2Score: 1 },
        { p1: 'Nafisa', p1Score: 2, p2: 'BlockMaster', p2Score: 0 }
      ],
      semis: [],
      finals: null
    },
    rules: [
      'Mode: Single Elimination Knockout',
      'Game Timer: 10 mins max per round',
      'Disconnection results in automatic forfeit'
    ],
    prize_distribution: [
      { place: '1st Place', amount: '250 GVT', pct: '50% of Pool', highlight: true },
      { place: '2nd Place', amount: '125 GVT', pct: '25% of Pool', highlight: false },
      { place: '3rd - 4th Place', amount: '62.5 GVT each', pct: '12.5% of Pool', highlight: false }
    ],
    starts_at: '2026-11-01T12:00:00Z',
    registration_deadline: '2026-11-01T11:00:00Z',
    created_at: '2026-10-15T00:00:00Z'
  };

  // ─────────────────────────────────────────────────────────────
  // 1. GET /api/tournaments (List)
  // ─────────────────────────────────────────────────────────────

  await t.test('GET /api/tournaments - returns paginated list of tournaments with USD estimates', async () => {
    supabase.from = (table) => {
      assert.strictEqual(table, 'tournaments');
      return {
        select: (cols, opts) => {
          assert.strictEqual(opts.count, 'exact');
          return {
            order: (field, orderOpts) => ({
              range: (from, to) => Promise.resolve({
                data: [mockTournamentRow],
                error: null,
                count: 1
              })
            })
          };
        }
      };
    };

    const res = await fetch(`${baseUrl}/api/tournaments`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 1);

    const first = body.data[0];
    assert.strictEqual(first.id, validTournamentId);
    assert.strictEqual(first.title, 'OLOS Championship Series #47');
    assert.strictEqual(first.entryFeeGvt, 50.0);
    assert.strictEqual(first.entryFeeUsd, 5.0);
    assert.strictEqual(first.prizePoolGvt, 500.0);
    assert.strictEqual(first.prizePoolUsd, 50.0);
    assert.strictEqual(first.roundStatus, 'REGISTRATION OPEN');
    assert.strictEqual(body.pagination.total, 1);
  });

  await t.test('GET /api/tournaments - handles filtering by gameType, status, search, and sorting', async () => {
    let capturedSearch = null;
    let capturedGameType = null;
    let capturedStatus = null;
    let capturedOrderField = null;

    supabase.from = (table) => {
      assert.strictEqual(table, 'tournaments');
      const builder = {
        select: () => builder,
        ilike: (col, val) => {
          capturedSearch = val;
          return builder;
        },
        eq: (col, val) => {
          if (col === 'game_type') capturedGameType = val;
          if (col === 'status') capturedStatus = val;
          return builder;
        },
        order: (field) => {
          capturedOrderField = field;
          return builder;
        },
        range: () => Promise.resolve({
          data: [mockTournamentRow],
          error: null,
          count: 1
        })
      };
      return builder;
    };

    const res = await fetch(`${baseUrl}/api/tournaments?search=Championship&gameType=chess&status=registration_open&sort=prize`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(capturedSearch, '%Championship%');
    assert.strictEqual(capturedGameType, 'chess');
    assert.strictEqual(capturedStatus, 'registration_open');
    assert.strictEqual(capturedOrderField, 'prize_pool_gvt');
  });

  await t.test('GET /api/tournaments - rejects invalid query parameters with 400', async () => {
    const res = await fetch(`${baseUrl}/api/tournaments?limit=500&page=-1`);
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Invalid query parameters');
  });

  await t.test('GET /api/tournaments - handles database failure with 500', async () => {
    supabase.from = () => ({
      select: () => ({
        order: () => ({
          range: () => Promise.resolve({
            data: null,
            error: { code: '42P01', message: 'relation tournaments does not exist' }
          })
        })
      })
    });

    const res = await fetch(`${baseUrl}/api/tournaments`);
    assert.strictEqual(res.status, 500);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Failed to retrieve tournaments');
  });

  // ─────────────────────────────────────────────────────────────
  // 2. GET /api/tournaments/:id (Details)
  // ─────────────────────────────────────────────────────────────

  await t.test('GET /api/tournaments/:id - rejects invalid UUID format with 400', async () => {
    const res = await fetch(`${baseUrl}/api/tournaments/not-a-valid-uuid`);
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Invalid tournament ID format');
  });

  await t.test('GET /api/tournaments/:id - returns 404 when tournament does not exist', async () => {
    supabase.from = (table) => {
      assert.strictEqual(table, 'tournaments');
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null })
          })
        })
      };
    };

    const res = await fetch(`${baseUrl}/api/tournaments/00000000-0000-0000-0000-000000000099`);
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Tournament not found');
  });

  await t.test('GET /api/tournaments/:id - returns 200 with rules, bracketTree, and prize distribution', async () => {
    supabase.from = (table) => {
      if (table === 'tournaments') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: mockTournamentRow, error: null })
            })
          })
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/tournaments/${validTournamentId}`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.id, validTournamentId);
    assert.strictEqual(body.data.title, 'OLOS Championship Series #47');
    assert.strictEqual(body.data.isRegistered, false);
    assert.strictEqual(body.data.bracketTree.quarters.length, 2);
    assert.strictEqual(body.data.rules.length, 3);
    assert.strictEqual(body.data.prizeDistribution.length, 3);
  });

  await t.test('GET /api/tournaments/:id - reflects caller registration when authenticated', async () => {
    supabase.auth.getUser = async (token) => {
      assert.strictEqual(token, 'valid-player-token');
      return {
        data: { user: { id: testUserId, email: 'player@example.com' } },
        error: null
      };
    };

    supabase.from = (table) => {
      if (table === 'tournaments') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: mockTournamentRow, error: null })
            })
          })
        };
      }
      if (table === 'tournament_participants') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({
                  data: { id: 'part-1', seed: 4, status: 'registered', registered_at: '2026-10-15T10:00:00Z' },
                  error: null
                })
              })
            })
          })
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/tournaments/${validTournamentId}`, {
      headers: { Authorization: 'Bearer valid-player-token' }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.isRegistered, true);
    assert.strictEqual(body.data.userParticipation.seed, 4);
  });

  // ─────────────────────────────────────────────────────────────
  // 3. POST /api/tournaments/:id/register (Registration)
  // ─────────────────────────────────────────────────────────────

  await t.test('POST /api/tournaments/:id/register - rejects unauthenticated requests with 401', async () => {
    const res = await fetch(`${baseUrl}/api/tournaments/${validTournamentId}/register`, {
      method: 'POST'
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Authorization token required');
  });

  await t.test('POST /api/tournaments/:id/register - rejects invalid UUID format with 400', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId, email: 'player@example.com' } },
      error: null
    });

    const res = await fetch(`${baseUrl}/api/tournaments/invalid-uuid/register`, {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' }
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Invalid tournament ID format');
  });

  await t.test('POST /api/tournaments/:id/register - returns 404 when tournament does not exist', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId, email: 'player@example.com' } },
      error: null
    });

    supabase.rpc = async (fn, params) => {
      assert.strictEqual(fn, 'register_tournament_participant');
      assert.strictEqual(params.p_user_id, testUserId);
      return {
        data: null,
        error: { code: 'P0001', message: 'Tournament not found' }
      };
    };

    const res = await fetch(`${baseUrl}/api/tournaments/${validTournamentId}/register`, {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' }
    });
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Tournament not found');
  });

  await t.test('POST /api/tournaments/:id/register - returns 400 when tournament registration is closed', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId, email: 'player@example.com' } },
      error: null
    });

    supabase.rpc = async () => ({
      data: null,
      error: { code: 'P0001', message: 'Tournament registration is closed' }
    });

    const res = await fetch(`${baseUrl}/api/tournaments/${validTournamentId}/register`, {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' }
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Tournament registration is closed');
  });

  await t.test('POST /api/tournaments/:id/register - returns 400 when tournament is at maximum capacity', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId, email: 'player@example.com' } },
      error: null
    });

    supabase.rpc = async () => ({
      data: null,
      error: { code: 'P0001', message: 'Tournament is at maximum capacity' }
    });

    const res = await fetch(`${baseUrl}/api/tournaments/${validTournamentId}/register`, {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' }
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Tournament is at maximum capacity');
  });

  await t.test('POST /api/tournaments/:id/register - returns 409 when user is already registered', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId, email: 'player@example.com' } },
      error: null
    });

    supabase.rpc = async () => ({
      data: null,
      error: { code: 'P0001', message: 'User is already registered for this tournament' }
    });

    const res = await fetch(`${baseUrl}/api/tournaments/${validTournamentId}/register`, {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' }
    });
    assert.strictEqual(res.status, 409);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'User is already registered for this tournament');
  });

  await t.test('POST /api/tournaments/:id/register - returns 400 when user has insufficient GVT balance', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId, email: 'player@example.com' } },
      error: null
    });

    supabase.rpc = async () => ({
      data: null,
      error: { code: 'P0001', message: 'Insufficient GVT balance for tournament entry' }
    });

    const res = await fetch(`${baseUrl}/api/tournaments/${validTournamentId}/register`, {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' }
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Insufficient GVT balance for tournament entry fee');
  });

  await t.test('POST /api/tournaments/:id/register - returns 403 when RPC detects unauthorized caller', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId, email: 'player@example.com' } },
      error: null
    });

    supabase.rpc = async () => ({
      data: null,
      error: { code: 'P0001', message: 'Unauthorized: Caller cannot register for another user' }
    });

    const res = await fetch(`${baseUrl}/api/tournaments/${validTournamentId}/register`, {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' }
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Unauthorized caller identity');
  });

  await t.test('POST /api/tournaments/:id/register - succeeds via atomic RPC result with fee deduction', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId, email: 'player@example.com' } },
      error: null
    });

    const mockRpcSuccess = {
      success: true,
      participantId: '22222222-2222-2222-2222-222222222222',
      tournamentId: validTournamentId,
      tournamentTitle: 'OLOS Championship Series #47',
      entryFeeDeducted: 50.0,
      remainingBalance: 950.0,
      currentParticipants: 7,
      maxParticipants: 8,
      status: 'registered'
    };

    supabase.rpc = async (fn, params) => {
      assert.strictEqual(fn, 'register_tournament_participant');
      assert.strictEqual(params.p_user_id, testUserId);
      assert.strictEqual(params.p_tournament_id, validTournamentId);
      return { data: mockRpcSuccess, error: null };
    };

    const res = await fetch(`${baseUrl}/api/tournaments/${validTournamentId}/register`, {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.message, 'Successfully registered for tournament');
    assert.strictEqual(body.data.entryFeeDeducted, 50.0);
    assert.strictEqual(body.data.remainingBalance, 950.0);
    assert.strictEqual(body.data.currentParticipants, 7);
  });

  await t.test('POST /api/tournaments/:id/register - fails closed with 500 when RPC encounters an unexpected database error', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId, email: 'player@example.com' } },
      error: null
    });

    supabase.rpc = async () => ({
      data: null,
      error: { code: 'XX000', message: 'connection failure during query' }
    });

    const res = await fetch(`${baseUrl}/api/tournaments/${validTournamentId}/register`, {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' }
    });

    assert.strictEqual(res.status, 500);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Failed to register for tournament');
  });

  await t.test('POST /api/tournaments/:id/register - returns 400 when registration deadline has passed', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId, email: 'player@example.com' } },
      error: null
    });

    supabase.rpc = async () => ({
      data: null,
      error: { code: 'P0001', message: 'Tournament registration deadline has passed' }
    });

    const res = await fetch(`${baseUrl}/api/tournaments/${validTournamentId}/register`, {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' }
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Tournament registration deadline has passed');
  });

  await t.test('POST /api/tournaments/:id/register - returns 400 when tournament has already started', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId, email: 'player@example.com' } },
      error: null
    });

    supabase.rpc = async () => ({
      data: null,
      error: { code: 'P0001', message: 'Tournament has already started' }
    });

    const res = await fetch(`${baseUrl}/api/tournaments/${validTournamentId}/register`, {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' }
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Tournament has already started');
  });

  await t.test('POST /api/tournaments/:id/register - returns 409 when Postgres throws unique violation 23505', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId, email: 'player@example.com' } },
      error: null
    });

    supabase.rpc = async () => ({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint "uq_tournament_participant"' }
    });

    const res = await fetch(`${baseUrl}/api/tournaments/${validTournamentId}/register`, {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' }
    });
    assert.strictEqual(res.status, 409);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'User is already registered for this tournament');
  });

  await t.test('POST /api/tournaments/:id/register - succeeds for a free tournament (entry fee 0)', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId, email: 'player@example.com' } },
      error: null
    });

    const mockFreeSuccess = {
      success: true,
      participantId: '33333333-3333-3333-3333-333333333333',
      tournamentId: validTournamentId,
      tournamentTitle: 'Free Beginner Cup',
      entryFeeDeducted: 0,
      remainingBalance: 100.0,
      currentParticipants: 4,
      maxParticipants: 8,
      status: 'registered'
    };

    supabase.rpc = async () => ({ data: mockFreeSuccess, error: null });

    const res = await fetch(`${baseUrl}/api/tournaments/${validTournamentId}/register`, {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.entryFeeDeducted, 0);
  });

  await t.test('GET /api/tournaments/:id - gracefully uses default schema fallbacks when rules or bracket_data are null', async () => {
    const rawTournamentRow = {
      id: validTournamentId,
      title: 'Minimal Tournament',
      description: null,
      game_type: 'checkers',
      status: 'upcoming',
      format: null,
      entry_fee_gvt: 0,
      prize_pool_gvt: 0,
      currency: null,
      max_participants: 8,
      current_participants: 0,
      round_number: 1,
      total_rounds: 3,
      bracket_data: null,
      rules: null,
      prize_distribution: null,
      starts_at: null,
      registration_deadline: null,
      created_at: '2026-10-15T00:00:00Z'
    };

    supabase.from = (table) => {
      assert.strictEqual(table, 'tournaments');
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: rawTournamentRow, error: null })
          })
        })
      };
    };

    const res = await fetch(`${baseUrl}/api/tournaments/${validTournamentId}`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.roundStatus, 'UPCOMING');
    assert.strictEqual(body.data.format, 'single_elimination');
    assert.strictEqual(body.data.bracketTree.quarters.length, 0);
    assert.strictEqual(body.data.rules.length, 4);
    assert.strictEqual(body.data.prizeDistribution.length, 3);
  });
});
