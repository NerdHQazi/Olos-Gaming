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

function createMatchMockBuilder(matches) {
  const builder = {
    select: () => builder,
    in: () => builder,
    order: () => builder,
    gte: () => builder,
    ilike: () => builder,
    range: (from, to) => {
      const slice = matches ? matches.slice(from, to + 1) : [];
      return Promise.resolve({ data: slice, error: null });
    },
  };
  return builder;
}

test('GET /api/leaderboard/players Suite', async (t) => {
  const { server, baseUrl } = await startServer();
  const originalFrom = supabase.from;

  t.after(() => {
    supabase.from = originalFrom;
    server.close();
  });

  const player1Id = '11111111-1111-1111-1111-111111111111';
  const player2Id = '22222222-2222-2222-2222-222222222222';
  const player3Id = '33333333-3333-3333-3333-333333333333';

  await t.test('returns 200 with default sorting by wins, pagination, and calculated metrics', async () => {
    const mockMatches = [
      {
        id: 'm1',
        player1_id: player1Id,
        player2_id: player2Id,
        winner_id: player1Id,
        stake_amount: 50,
        game_type: 'chess',
        created_at: '2026-10-10T20:00:00Z',
      },
      {
        id: 'm2',
        player1_id: player1Id,
        player2_id: player2Id,
        winner_id: player1Id,
        stake_amount: 50,
        game_type: 'chess',
        created_at: '2026-10-09T20:00:00Z',
      },
      {
        id: 'm3',
        player1_id: player2Id,
        player2_id: player3Id,
        winner_id: player2Id,
        stake_amount: 100,
        game_type: 'checkers',
        created_at: '2026-10-08T20:00:00Z',
      },
    ];

    const mockProfiles = [
      {
        id: player1Id,
        username: 'Grandmaster1',
        full_name: 'GM One',
        avatar_url: 'https://example.com/p1.png',
      },
      {
        id: player2Id,
        username: 'CheckersPro',
        full_name: 'CP Two',
        avatar_url: null,
      },
    ];

    supabase.from = (table) => {
      if (table === 'matches') {
        return createMatchMockBuilder(mockMatches);
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            in: async () => ({ data: mockProfiles, error: null }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/leaderboard/players`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 2);
    assert.strictEqual(body.pagination.total, 2);
    assert.strictEqual(body.pagination.page, 1);
    assert.strictEqual(body.pagination.limit, 50);
    assert.strictEqual(body.filters.sortBy, 'wins');
    assert.strictEqual(body.filters.game, 'all');
    assert.strictEqual(body.filters.timeframe, 'all-time');

    // Rank 1: player1 (2 wins, 0 losses, 0 draws, earned/earnedGvt: 50 * 0.8 * 2 = 80, streak: 2)
    const first = body.data[0];
    assert.strictEqual(first.rank, 1);
    assert.strictEqual(first.userId, player1Id);
    assert.strictEqual(first.username, 'Grandmaster1');
    assert.strictEqual(first.fullName, 'GM One');
    assert.strictEqual(first.avatarUrl, 'https://example.com/p1.png');
    assert.strictEqual(first.wins, 2);
    assert.strictEqual(first.losses, 0);
    assert.strictEqual(first.draws, 0);
    assert.strictEqual(first.totalMatches, 2);
    assert.strictEqual(first.winRate, 100);
    assert.strictEqual(first.earned, 80);
    assert.strictEqual(first.earnedGvt, 80);
    assert.strictEqual(first.streak, 2);
    assert.strictEqual(first.email, undefined, 'Must not expose email/PII');

    // Rank 2: player2 (1 win, 2 losses, 0 draws, earned/earnedGvt: 100 * 0.8 = 80, streak: 0)
    const second = body.data[1];
    assert.strictEqual(second.rank, 2);
    assert.strictEqual(second.userId, player2Id);
    assert.strictEqual(second.username, 'CheckersPro');
    assert.strictEqual(second.wins, 1);
    assert.strictEqual(second.losses, 2);
    assert.strictEqual(second.draws, 0);
    assert.strictEqual(second.totalMatches, 3);
    assert.strictEqual(second.winRate, 33.3);
    assert.strictEqual(second.earned, 80);
    assert.strictEqual(second.earnedGvt, 80);
    assert.strictEqual(second.streak, 0);
  });

  await t.test('correctly accounts for draws in match totals and resets streak', async () => {
    // Player 1 won match m1, drew match m2, won match m3
    // Because m2 is a draw, it breaks Player 1's streak; current streak is 1, not 2.
    // Draws must also be counted in draws and totalMatches.
    const mockMatches = [
      {
        id: 'm1',
        player1_id: player1Id,
        player2_id: player2Id,
        winner_id: player1Id,
        stake_amount: 50,
        game_type: 'chess',
        created_at: '2026-10-10T20:00:00Z',
      },
      {
        id: 'm2',
        player1_id: player1Id,
        player2_id: player2Id,
        winner_id: null, // Draw
        stake_amount: 50,
        game_type: 'chess',
        created_at: '2026-10-09T20:00:00Z',
      },
      {
        id: 'm3',
        player1_id: player1Id,
        player2_id: player3Id,
        winner_id: player1Id,
        stake_amount: 50,
        game_type: 'chess',
        created_at: '2026-10-08T20:00:00Z',
      },
    ];

    supabase.from = (table) => {
      if (table === 'matches') {
        return createMatchMockBuilder(mockMatches);
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            in: async () => ({
              data: [
                { id: player1Id, username: 'PlayerOne' },
                { id: player2Id, username: 'PlayerTwo' },
              ],
              error: null,
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/leaderboard/players`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    const p1 = body.data.find((p) => p.userId === player1Id);
    assert.ok(p1);
    assert.strictEqual(p1.wins, 2);
    assert.strictEqual(p1.losses, 0);
    assert.strictEqual(p1.draws, 1, 'Draw must be recorded');
    assert.strictEqual(p1.totalMatches, 3, 'Total matches must include draws');
    assert.strictEqual(p1.winRate, 66.7);
    assert.strictEqual(p1.streak, 1, 'Draw must reset the winning streak from the latest match');
  });

  await t.test('sorts by earnings when sortBy=earnings', async () => {
    // Player 1 has 3 wins with 10 GVT stake => 24 GVT earned
    // Player 2 has 1 win with 100 GVT stake => 80 GVT earned
    const mockMatches = [
      {
        id: 'm1',
        player1_id: player2Id,
        player2_id: player3Id,
        winner_id: player2Id,
        stake_amount: 100,
        game_type: 'chess',
        created_at: '2026-10-10T12:00:00Z',
      },
      {
        id: 'm2',
        player1_id: player1Id,
        player2_id: player3Id,
        winner_id: player1Id,
        stake_amount: 10,
        game_type: 'chess',
        created_at: '2026-10-10T11:00:00Z',
      },
      {
        id: 'm3',
        player1_id: player1Id,
        player2_id: player3Id,
        winner_id: player1Id,
        stake_amount: 10,
        game_type: 'chess',
        created_at: '2026-10-10T10:00:00Z',
      },
      {
        id: 'm4',
        player1_id: player1Id,
        player2_id: player3Id,
        winner_id: player1Id,
        stake_amount: 10,
        game_type: 'chess',
        created_at: '2026-10-10T09:00:00Z',
      },
    ];

    supabase.from = (table) => {
      if (table === 'matches') {
        return createMatchMockBuilder(mockMatches);
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            in: async () => ({
              data: [
                { id: player1Id, username: 'PlayerOne' },
                { id: player2Id, username: 'PlayerTwo' },
              ],
              error: null,
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/leaderboard/players?sortBy=earnings`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.strictEqual(body.filters.sortBy, 'earnings');
    assert.strictEqual(body.data[0].userId, player2Id, 'Player 2 should rank 1st with 80 GVT');
    assert.strictEqual(body.data[0].earned, 80);
    assert.strictEqual(body.data[0].earnedGvt, 80);
    assert.strictEqual(body.data[1].userId, player1Id, 'Player 1 should rank 2nd with 24 GVT');
    assert.strictEqual(body.data[1].earned, 24);
    assert.strictEqual(body.data[1].earnedGvt, 24);
  });

  await t.test('applies tie-breaking rules: earnings then recent activity', async () => {
    const mockMatches = [
      {
        id: 'm1',
        player1_id: player1Id,
        player2_id: player3Id,
        winner_id: player1Id,
        stake_amount: 50,
        game_type: 'chess',
        created_at: '2026-10-10T15:00:00Z',
      },
      {
        id: 'm2',
        player1_id: player2Id,
        player2_id: player3Id,
        winner_id: player2Id,
        stake_amount: 50,
        game_type: 'chess',
        created_at: '2026-10-10T10:00:00Z',
      },
    ];

    supabase.from = (table) => {
      if (table === 'matches') {
        return createMatchMockBuilder(mockMatches);
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            in: async () => ({
              data: [
                { id: player1Id, username: 'RecentWinner' },
                { id: player2Id, username: 'OlderWinner' },
              ],
              error: null,
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/leaderboard/players?sortBy=wins`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.strictEqual(body.data[0].userId, player1Id, 'Most recent win breaks tie');
    assert.strictEqual(body.data[1].userId, player2Id);
  });

  await t.test('supports pagination parameters (limit and page)', async () => {
    const mockMatches = [
      {
        id: 'm1',
        player1_id: player1Id,
        player2_id: player3Id,
        winner_id: player1Id,
        stake_amount: 50,
        game_type: 'chess',
        created_at: '2026-10-10T10:00:00Z',
      },
      {
        id: 'm2',
        player1_id: player2Id,
        player2_id: player3Id,
        winner_id: player2Id,
        stake_amount: 25,
        game_type: 'chess',
        created_at: '2026-10-10T09:00:00Z',
      },
    ];

    supabase.from = (table) => {
      if (table === 'matches') {
        return createMatchMockBuilder(mockMatches);
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            in: async () => ({
              data: [{ id: player2Id, username: 'PlayerTwo' }],
              error: null,
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/leaderboard/players?limit=1&page=2`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.strictEqual(body.pagination.page, 2);
    assert.strictEqual(body.pagination.limit, 1);
    assert.strictEqual(body.pagination.total, 2);
    assert.strictEqual(body.pagination.totalPages, 2);
    assert.strictEqual(body.data.length, 1);
    assert.strictEqual(body.data[0].rank, 2);
    assert.strictEqual(body.data[0].userId, player2Id);
  });

  await t.test('normalizes UI query values like "All Games" and "All Time"', async () => {
    let capturedGame = null;
    let capturedCutoff = null;

    supabase.from = (table) => {
      if (table === 'matches') {
        const builder = {
          select: () => builder,
          in: () => builder,
          order: () => builder,
          gte: (col, val) => {
            capturedCutoff = val;
            return builder;
          },
          ilike: (col, val) => {
            capturedGame = val;
            return builder;
          },
          range: () => Promise.resolve({ data: [], error: null }),
        };
        return builder;
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    // Test "All Games" and "All Time"
    const res1 = await fetch(`${baseUrl}/api/leaderboard/players?game=All%20Games&timeframe=All%20Time`);
    assert.strictEqual(res1.status, 200);
    const body1 = await res1.json();
    assert.strictEqual(body1.filters.game, 'all');
    assert.strictEqual(body1.filters.timeframe, 'all-time');
    assert.strictEqual(capturedGame, null, 'Game "all" should not filter by ilike');
    assert.strictEqual(capturedCutoff, null, 'Timeframe "all-time" should not apply cutoff');

    // Test "Daily" and "Chess"
    const res2 = await fetch(`${baseUrl}/api/leaderboard/players?game=Chess&timeframe=Daily`);
    assert.strictEqual(res2.status, 200);
    const body2 = await res2.json();
    assert.strictEqual(body2.filters.game, 'chess');
    assert.strictEqual(body2.filters.timeframe, 'daily');
    assert.strictEqual(capturedGame, 'chess');
    assert.ok(capturedCutoff !== null);
  });

  await t.test('scans across multiple chunks for large match datasets', async () => {
    // Generate 1200 mock matches to test multi-batch scanning (batch size is 1000)
    const largeMatches = [];
    for (let i = 0; i < 1200; i++) {
      largeMatches.push({
        id: `m_${i}`,
        player1_id: player1Id,
        player2_id: player2Id,
        winner_id: player1Id,
        stake_amount: 10,
        game_type: 'chess',
        created_at: new Date(Date.now() - i * 60000).toISOString(),
      });
    }

    let batchCount = 0;
    supabase.from = (table) => {
      if (table === 'matches') {
        const builder = {
          select: () => builder,
          in: () => builder,
          order: () => builder,
          range: (from, to) => {
            batchCount++;
            const slice = largeMatches.slice(from, to + 1);
            return Promise.resolve({ data: slice, error: null });
          },
        };
        return builder;
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            in: async () => ({
              data: [{ id: player1Id, username: 'PlayerOne' }],
              error: null,
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/leaderboard/players`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.ok(batchCount >= 2, 'Should have queried at least 2 batches');
    assert.strictEqual(body.data[0].wins, 1200, 'Should aggregate all 1200 matches across batches');
  });

  await t.test('returns empty array when no matches exist', async () => {
    supabase.from = (table) => {
      if (table === 'matches') {
        return createMatchMockBuilder([]);
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/leaderboard/players`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.strictEqual(body.success, true);
    assert.deepStrictEqual(body.data, []);
    assert.strictEqual(body.pagination.total, 0);
    assert.strictEqual(body.pagination.totalPages, 0);
  });

  await t.test('returns 400 when query validation fails for invalid game', async () => {
    const res = await fetch(`${baseUrl}/api/leaderboard/players?game=poker`);
    assert.strictEqual(res.status, 400);
    const body = await res.json();

    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Validation failed');
    assert.ok(body.errors.some((e) => e.field === 'game'));
  });

  await t.test('returns 400 when query validation fails for invalid limit or page', async () => {
    const res = await fetch(`${baseUrl}/api/leaderboard/players?limit=500&page=-1`);
    assert.strictEqual(res.status, 400);
    const body = await res.json();

    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Validation failed');
    assert.ok(body.errors.some((e) => e.field === 'limit'));
    assert.ok(body.errors.some((e) => e.field === 'page'));
  });

  await t.test('returns 500 when Supabase query fails', async () => {
    supabase.from = (table) => {
      if (table === 'matches') {
        const builder = {
          select: () => builder,
          in: () => builder,
          order: () => builder,
          range: () => Promise.resolve({ data: null, error: new Error('DB connection error') }),
        };
        return builder;
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/leaderboard/players`);
    assert.strictEqual(res.status, 500);
    const body = await res.json();

    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Failed to retrieve leaderboard data');
  });

  await t.test('gracefully falls back when profile lookup fails or player profile is missing', async () => {
    const mockMatches = [
      {
        id: 'm1',
        player1_id: player1Id,
        player2_id: player2Id,
        winner_id: player1Id,
        stake_amount: 10,
        game_type: 'chess',
        created_at: '2026-10-10T10:00:00Z',
      },
    ];

    supabase.from = (table) => {
      if (table === 'matches') {
        return createMatchMockBuilder(mockMatches);
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            in: async () => ({ data: null, error: new Error('Profile service unavailable') }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    };

    const res = await fetch(`${baseUrl}/api/leaderboard/players`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data[0].username, 'Anonymous');
    assert.strictEqual(body.data[0].avatarUrl, null);
    assert.strictEqual(body.data[0].earned, 8);
    assert.strictEqual(body.data[0].earnedGvt, 8);
  });
});
