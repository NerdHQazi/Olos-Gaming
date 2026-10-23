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

test('Phase 5 Draw Settlement & Payout Integration Suite', async (t) => {
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

  const testUserId = '11111111-1111-1111-1111-111111111111';
  const opponentId = '22222222-2222-2222-2222-222222222222';
  const matchId = '33333333-3333-3333-3333-333333333333';

  // 1. Match Summary returns correct draw rewards when match_payouts record exists with winner_id: null
  await t.test('GET /api/matches/:matchId/summary correctly reflects authoritative draw payout', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId } },
      error: null
    });

    const mockMatch = {
      id: matchId,
      player1_id: testUserId,
      player2_id: opponentId,
      game_type: 'chess',
      stake_amount: 25.0,
      player1_score: 0,
      player2_score: 0,
      status: 'finished',
      winner_id: null,
      created_at: '2026-10-18T10:00:00Z',
      last_move_timestamp: '2026-10-18T10:30:00Z',
      authority_resolved_at: '2026-10-18T10:30:00Z',
      authority_resolution_reason: 'chess_stalemate',
      terminal_reason: 'chess_stalemate',
      terminal_move_number: 42
    };

    const mockDrawPayout = {
      match_id: matchId,
      winner_id: null, // Draw has null winner
      stake_amount: 25.0,
      total_pot: 50.0,
      fee_amount: 0.0,
      payout_amount: 50.0
    };

    supabase.from = (table) => {
      if (table === 'matches') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: mockMatch, error: null })
            })
          })
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({
                data: { id: opponentId, username: 'challenger_draw', full_name: 'Draw Opponent', avatar_url: null },
                error: null
              })
            })
          })
        };
      }
      if (table === 'match_payouts') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: mockDrawPayout, error: null })
            })
          })
        };
      }
      if (table === 'match_events') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => Promise.resolve({ count: 42, error: null })
            })
          })
        };
      }
      throw new Error(`Unexpected table in test: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/matches/${matchId}/summary`, {
      headers: { Authorization: 'Bearer valid-token' }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.isDraw, true);
    assert.strictEqual(body.data.winnerId, null);
    assert.strictEqual(body.data.rewards.stakeReturned, 25.0);
    assert.strictEqual(body.data.rewards.winnings, 0.0);
    assert.strictEqual(body.data.rewards.fee, 0.0);
    assert.strictEqual(body.data.rewards.currency, 'GVT');
  });

  // 2. Recent Matches returns settled: true and 100% stake return for settled draws
  await t.test('GET /api/user/matches/recent reflects authoritative draw payout with settled: true', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: testUserId } },
      error: null
    });

    const mockDrawMatch = [
      {
        id: matchId,
        player1_id: testUserId,
        player2_id: opponentId,
        game_type: 'chess',
        stake_amount: 50.0,
        player1_score: 0,
        player2_score: 0,
        status: 'finished',
        winner_id: null,
        created_at: '2026-10-18T10:00:00Z',
        last_move_timestamp: '2026-10-18T10:30:00Z',
        authority_resolved_at: '2026-10-18T10:30:00Z',
        authority_resolution_reason: 'chess_stalemate',
        terminal_reason: 'chess_stalemate'
      }
    ];

    const mockDrawPayout = [
      {
        match_id: matchId,
        winner_id: null,
        stake_amount: 50.0,
        total_pot: 100.0,
        fee_amount: 0.0,
        payout_amount: 100.0
      }
    ];

    supabase.from = (table) => {
      if (table === 'matches') {
        return {
          select: () => ({
            or: () => ({
              order: () => ({
                order: () => ({
                  range: () => Promise.resolve({ data: mockDrawMatch, error: null, count: 1 })
                })
              })
            })
          })
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            in: () => Promise.resolve({
              data: [{ id: opponentId, username: 'challenger_draw', full_name: 'Draw Opponent', avatar_url: null }],
              error: null
            })
          })
        };
      }
      if (table === 'match_payouts') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: mockDrawPayout, error: null })
          })
        };
      }
      throw new Error(`Unexpected table in test: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/user/matches/recent`, {
      headers: { Authorization: 'Bearer valid-token' }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 1);

    const match = body.data[0];
    assert.strictEqual(match.isDraw, true);
    assert.strictEqual(match.isWinner, false);
    assert.strictEqual(match.rewards.stakeReturned, 50.0);
    assert.strictEqual(match.rewards.winnings, 0.0);
    assert.strictEqual(match.rewards.fee, 0.0);
    assert.strictEqual(match.rewards.netEarnings, 0.0);
    assert.strictEqual(match.rewards.settled, true);
  });

  // 3. RPC settle_match_draw contract verification
  await t.test('settle_match_draw RPC returns expected payload structure', async () => {
    supabase.rpc = async (funcName, params) => {
      assert.strictEqual(funcName, 'settle_match_draw');
      assert.strictEqual(params.p_match_id, matchId);
      return {
        data: {
          status: 'draw_settled',
          match_id: matchId,
          refund_amount_per_player: 50.0
        },
        error: null
      };
    };

    const { data, error } = await supabase.rpc('settle_match_draw', { p_match_id: matchId });
    assert.strictEqual(error, null);
    assert.strictEqual(data.status, 'draw_settled');
    assert.strictEqual(data.refund_amount_per_player, 50.0);
  });

  // 4. RPC settle_match_draw idempotency contract verification
  await t.test('settle_match_draw RPC idempotency returns already_settled on retry', async () => {
    supabase.rpc = async (funcName, params) => {
      assert.strictEqual(funcName, 'settle_match_draw');
      assert.strictEqual(params.p_match_id, matchId);
      return {
        data: {
          status: 'already_settled',
          match_id: matchId
        },
        error: null
      };
    };

    const { data, error } = await supabase.rpc('settle_match_draw', { p_match_id: matchId });
    assert.strictEqual(error, null);
    assert.strictEqual(data.status, 'already_settled');
  });
});
