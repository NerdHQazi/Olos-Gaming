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

test('GET /api/matches/:matchId/summary Suite', async (t) => {
  const { server, baseUrl } = await startServer();

  const originalGetUser = supabase.auth.getUser;
  const originalFrom = supabase.from;

  t.after(() => {
    supabase.auth.getUser = originalGetUser;
    supabase.from = originalFrom;
    server.close();
  });

  const validMatchId = '00000000-0000-0000-0000-000000000001';
  const player1Id = '11111111-1111-1111-1111-111111111111';
  const player2Id = '22222222-2222-2222-2222-222222222222';
  const outsiderId = '99999999-9999-9999-9999-999999999999';

  await t.test('returns 401 when Authorization header is missing', async () => {
    const res = await fetch(`${baseUrl}/api/matches/${validMatchId}/summary`);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Authorization token required');
  });

  await t.test('returns 401 when token is invalid or expired', async () => {
    supabase.auth.getUser = async () => ({
      data: null,
      error: new Error('Invalid token')
    });

    const res = await fetch(`${baseUrl}/api/matches/${validMatchId}/summary`, {
      headers: { Authorization: 'Bearer invalid-token' }
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Invalid or expired token');
  });

  await t.test('returns 400 when matchId is not a valid UUID format', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: player1Id, email: 'player1@example.com' } },
      error: null
    });

    const res = await fetch(`${baseUrl}/api/matches/not-a-valid-uuid/summary`, {
      headers: { Authorization: 'Bearer valid-token' }
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Invalid match ID format');
  });

  await t.test('returns 404 when match is not found in database', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: player1Id, email: 'player1@example.com' } },
      error: null
    });

    supabase.from = (table) => {
      if (table === 'matches') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null })
            })
          })
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/matches/${validMatchId}/summary`, {
      headers: { Authorization: 'Bearer valid-token' }
    });
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Match not found');
  });

  await t.test('returns 403 when authenticated user is not a participant in the match', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: outsiderId, email: 'outsider@example.com' } },
      error: null
    });

    supabase.from = (table) => {
      if (table === 'matches') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: validMatchId,
                  player1_id: player1Id,
                  player2_id: player2Id,
                  status: 'finished'
                },
                error: null
              })
            })
          })
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/matches/${validMatchId}/summary`, {
      headers: { Authorization: 'Bearer valid-token' }
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Forbidden: You are not a participant in this match');
  });

  await t.test('returns 200 with winner summary, payout calculation, and opponent profile', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: player1Id, email: 'player1@example.com' } },
      error: null
    });

    const mockMatch = {
      id: validMatchId,
      player1_id: player1Id,
      player2_id: player2Id,
      game_type: 'chess',
      stake_amount: 25.0,
      player1_score: 1,
      player2_score: 0,
      status: 'finished',
      winner_id: player1Id,
      authority_resolution_reason: 'chess_checkmate',
      authority_resolved_at: '2026-10-08T07:30:00Z',
      last_move_timestamp: '2026-10-08T07:29:50Z',
      game_move_number: 42,
      terminal_move_number: 42,
      terminal_reason: 'chess_checkmate',
      created_at: '2026-10-08T07:15:00Z'
    };

    const mockPayout = {
      winner_id: player1Id,
      stake_amount: 25.0,
      total_pot: 50.0,
      fee_amount: 5.0,
      payout_amount: 45.0
    };

    const mockOpponentProfile = {
      id: player2Id,
      username: 'Grandmaster2',
      full_name: 'Opponent Player',
      avatar_url: 'https://example.com/avatar2.png'
    };

    supabase.from = (table) => {
      if (table === 'matches') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: mockMatch, error: null })
            })
          })
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: (col, val) => ({
              maybeSingle: async () => {
                assert.strictEqual(col, 'id');
                assert.strictEqual(val, player2Id);
                return { data: mockOpponentProfile, error: null };
              }
            })
          })
        };
      }
      if (table === 'match_payouts') {
        return {
          select: () => ({
            eq: (col, val) => ({
              maybeSingle: async () => {
                assert.strictEqual(col, 'match_id');
                assert.strictEqual(val, validMatchId);
                return { data: mockPayout, error: null };
              }
            })
          })
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/matches/${validMatchId}/summary`, {
      headers: { Authorization: 'Bearer valid-token' }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.deepStrictEqual(body.data, {
      matchId: validMatchId,
      gameType: 'chess',
      status: 'finished',
      winnerId: player1Id,
      isWinner: true,
      isDraw: false,
      stakeAmount: 25.0,
      rewards: {
        stakeReturned: 25.0,
        winnings: 20.0,
        fee: 5.0,
        currency: 'GVT'
      },
      opponent: {
        id: player2Id,
        username: 'Grandmaster2',
        fullName: 'Opponent Player',
        avatarUrl: 'https://example.com/avatar2.png'
      },
      scores: {
        userScore: 1,
        opponentScore: 0
      },
      stats: {
        totalMoves: 42,
        resolvedReason: 'chess_checkmate'
      },
      resolvedAt: '2026-10-08T07:30:00Z',
      createdAt: '2026-10-08T07:15:00Z'
    });
  });

  await t.test('returns 200 and gracefully falls back to formula rewards when match_payouts fails with permission error', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: player1Id, email: 'player1@example.com' } },
      error: null
    });

    const mockMatch = {
      id: validMatchId,
      player1_id: player1Id,
      player2_id: player2Id,
      game_type: 'chess',
      stake_amount: 25.0,
      player1_score: 1,
      player2_score: 0,
      status: 'finished',
      winner_id: player1Id,
      authority_resolution_reason: 'chess_checkmate',
      authority_resolved_at: '2026-10-08T07:30:00Z',
      last_move_timestamp: '2026-10-08T07:29:55Z',
      game_move_number: 42,
      created_at: '2026-10-08T07:15:00Z'
    };

    supabase.from = (table) => {
      if (table === 'matches') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: mockMatch, error: null })
            })
          })
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: player2Id, username: 'Grandmaster2', full_name: null, avatar_url: null },
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
              maybeSingle: async () => ({
                data: null,
                error: { code: '42501', message: 'permission denied for table match_payouts' }
              })
            })
          })
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/matches/${validMatchId}/summary`, {
      headers: { Authorization: 'Bearer valid-token' }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.isWinner, true);
    // Formula fallback: stakeAmount = 25, totalPot = 50, fee = 5.0 (10%), winnings = 20.0
    assert.deepStrictEqual(body.data.rewards, {
      stakeReturned: 25.0,
      winnings: 20.0,
      fee: 5.0,
      currency: 'GVT'
    });
  });

  await t.test('returns 200 with loser summary (zero winnings) when caller lost', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: player2Id, email: 'player2@example.com' } },
      error: null
    });

    const mockMatch = {
      id: validMatchId,
      player1_id: player1Id,
      player2_id: player2Id,
      game_type: 'checkers',
      stake_amount: 50.0,
      player1_score: 12,
      player2_score: 4,
      status: 'finished',
      winner_id: player1Id, // player1 won, so player2 lost
      authority_resolution_reason: 'checkers_pieces_depleted',
      authority_resolved_at: '2026-10-08T07:45:00Z',
      last_move_timestamp: '2026-10-08T07:45:00Z',
      game_move_number: 28,
      created_at: '2026-10-08T07:20:00Z'
    };

    supabase.from = (table) => {
      if (table === 'matches') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: mockMatch, error: null })
            })
          })
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: player1Id, username: 'PlayerOne', full_name: 'Player One', avatar_url: null },
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
              maybeSingle: async () => ({ data: null, error: null })
            })
          })
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/matches/${validMatchId}/summary`, {
      headers: { Authorization: 'Bearer valid-token-player2' }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.isWinner, false);
    assert.strictEqual(body.data.isDraw, false);
    assert.deepStrictEqual(body.data.rewards, {
      stakeReturned: 0.0,
      winnings: 0.0,
      fee: 0.0,
      currency: 'GVT'
    });
    assert.deepStrictEqual(body.data.scores, {
      userScore: 4,
      opponentScore: 12
    });
    assert.strictEqual(body.data.opponent.id, player1Id);
    assert.strictEqual(body.data.opponent.username, 'PlayerOne');
  });

  await t.test('returns 200 with draw summary when winner_id is null in a finished match', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: player1Id, email: 'player1@example.com' } },
      error: null
    });

    const mockMatch = {
      id: validMatchId,
      player1_id: player1Id,
      player2_id: player2Id,
      game_type: 'chess',
      stake_amount: 100.0,
      player1_score: 0,
      player2_score: 0,
      status: 'finished',
      winner_id: null, // Draw
      authority_resolution_reason: 'chess_stalemate',
      authority_resolved_at: '2026-10-08T07:55:00Z',
      created_at: '2026-10-08T07:30:00Z'
    };

    supabase.from = (table) => {
      if (table === 'matches') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: mockMatch, error: null })
            })
          })
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: player2Id, username: 'OpponentUser', full_name: null, avatar_url: null },
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
              maybeSingle: async () => ({ data: null, error: null })
            })
          })
        };
      }
      if (table === 'match_events') {
        return {
          select: () => ({
            eq: () => ({
              eq: async () => ({ count: 50, error: null })
            })
          })
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/matches/${validMatchId}/summary`, {
      headers: { Authorization: 'Bearer valid-token' }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.isWinner, false);
    assert.strictEqual(body.data.isDraw, true);
    assert.deepStrictEqual(body.data.rewards, {
      stakeReturned: 100.0,
      winnings: 0.0,
      fee: 0.0,
      currency: 'GVT'
    });
    assert.strictEqual(body.data.stats.resolvedReason, 'chess_stalemate');
    assert.strictEqual(body.data.stats.totalMoves, 50);
  });

  await t.test('returns 200 for active match with null rewards and unresolved stats', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: player1Id, email: 'player1@example.com' } },
      error: null
    });

    const mockMatch = {
      id: validMatchId,
      player1_id: player1Id,
      player2_id: player2Id,
      game_type: 'chess',
      stake_amount: 10.0,
      player1_score: 0,
      player2_score: 0,
      status: 'active',
      winner_id: null,
      game_move_number: 14,
      created_at: '2026-10-08T07:58:00Z'
    };

    supabase.from = (table) => {
      if (table === 'matches') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: mockMatch, error: null })
            })
          })
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: player2Id, username: 'OpponentUser', full_name: null, avatar_url: null },
                error: null
              })
            })
          })
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/matches/${validMatchId}/summary`, {
      headers: { Authorization: 'Bearer valid-token' }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'active');
    assert.strictEqual(body.data.rewards, null);
    assert.strictEqual(body.data.resolvedAt, null);
    assert.strictEqual(body.data.stats.resolvedReason, null);
    assert.strictEqual(body.data.stats.totalMoves, 14);
  });
});
