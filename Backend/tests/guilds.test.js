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

test('Guilds & Social System Suite (Phase 6)', async (t) => {
  const { server, baseUrl } = await startServer();
  const originalFrom = supabase.from;
  const originalRpc = supabase.rpc;
  const originalGetUser = supabase.auth.getUser;

  t.after(() => {
    supabase.from = originalFrom;
    supabase.rpc = originalRpc;
    supabase.auth.getUser = originalGetUser;
    server.close();
  });

  const mockGuildId1 = '00000000-0000-0000-0000-000000000001';
  const mockGuildId2 = '00000000-0000-0000-0000-000000000002';
  const mockUserId1 = '11111111-1111-1111-1111-111111111111';
  const mockUserId2 = '22222222-2222-2222-2222-222222222222';

  const mockGuilds = [
    {
      id: mockGuildId1,
      name: 'Cyber Serpents',
      short_name: 'CS',
      description: 'Elite competitive on-chain gaming guild',
      tagline: 'Strike Fast, Strike Hard',
      icon_url: '/guilds/cyberSerpentImage.png',
      created_by: mockUserId1,
      is_private: true,
      max_members: 30,
      min_rank: 'Silver Bracket (Tier II)',
      entry_fee: 100,
      is_featured: true,
      tier: 'Tier 1 Elite',
      tier_bracket: 'Elite I',
      total_staked: 45000,
      currency: 'GVT',
      total_wins: 142,
      total_matches: 196,
      total_earned: 98000,
      win_rate: 72.4,
      tags: ['Competitive', 'Snake', 'Chess'],
      created_at: '2026-08-01T12:00:00Z',
    },
    {
      id: mockGuildId2,
      name: 'Alpha Blitzers',
      short_name: 'AB',
      description: 'High-speed tactical arena squad',
      tagline: 'Dominating every board',
      icon_url: '/guilds/alphaBlitzerImage.png',
      created_by: mockUserId2,
      is_private: false,
      max_members: 25,
      min_rank: 'Bronze Bracket (Tier III)',
      entry_fee: 50,
      is_featured: false,
      tier: 'Tier 2 Pro',
      tier_bracket: 'Gold II',
      total_staked: 18500,
      currency: 'GVT',
      total_wins: 98,
      total_matches: 150,
      total_earned: 42000,
      win_rate: 65.3,
      tags: ['Checkers', 'Casual'],
      created_at: '2026-08-05T12:00:00Z',
    },
  ];

  await t.test('GET /api/guilds - returns list of guilds and featured banner', async () => {
    supabase.from = (table) => {
      if (table === 'guilds') {
        return {
          select: () => ({
            or: () => ({
              range: async () => ({ data: mockGuilds, count: mockGuilds.length, error: null }),
            }),
            contains: () => ({
              range: async () => ({ data: mockGuilds, count: mockGuilds.length, error: null }),
            }),
            order: function () {
              return {
                order: () => ({
                  range: async () => ({ data: mockGuilds, count: mockGuilds.length, error: null }),
                }),
                range: async () => ({ data: mockGuilds, count: mockGuilds.length, error: null }),
              };
            },
            range: async () => ({ data: mockGuilds, count: mockGuilds.length, error: null }),
          }),
        };
      }
      if (table === 'guild_members') {
        return {
          select: () => Promise.resolve({
            data: [
              { guild_id: mockGuildId1 },
              { guild_id: mockGuildId1 },
              { guild_id: mockGuildId2 },
            ],
            error: null,
          }),
        };
      }
      return originalFrom.call(supabase, table);
    };

    const res = await fetch(`${baseUrl}/api/guilds`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(Array.isArray(body.data), true);
    assert.equal(body.data.length, 2);
    assert.equal(body.data[0].name, 'Cyber Serpents');
    assert.equal(body.data[0].shortName, 'CS');
    assert.equal(body.data[0].members, 2);
    assert.equal(body.featured.name, 'Cyber Serpents');
    assert.equal(body.pagination.total, 2);
  });

  await t.test('GET /api/guilds - validates query parameters', async () => {
    const res = await fetch(`${baseUrl}/api/guilds?limit=500&sort=invalid_sort`);
    assert.equal(res.status, 400);

    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, 'Validation failed');
  });

  await t.test('POST /api/guilds - rejects unauthenticated requests with 401', async () => {
    const res = await fetch(`${baseUrl}/api/guilds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Guild',
        tag: 'NEWG',
      }),
    });

    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /Authorization token required/i);
  });

  await t.test('POST /api/guilds - rejects invalid payload with 400', async () => {
    supabase.auth.getUser = async (token) => {
      if (token === 'valid-token') {
        return { data: { user: { id: mockUserId1, email: 'leader@example.com' } }, error: null };
      }
      return { data: { user: null }, error: new Error('Invalid token') };
    };

    const res = await fetch(`${baseUrl}/api/guilds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        name: 'AB', // too short
        tag: 'LONGTAGNAME', // too long (>5)
        maxMembers: 100, // exceeds max 50
      }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, 'Validation failed');
  });

  await t.test('POST /api/guilds - rejects when user has insufficient GVT balance with 400', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: mockUserId1 } },
      error: null,
    });

    supabase.rpc = async (funcName) => {
      if (funcName === 'create_guild_with_leader') {
        return {
          data: null,
          error: { message: 'Insufficient GVT balance for guild contract creation (5 GVT required)' },
        };
      }
      return originalRpc.call(supabase, funcName);
    };

    const res = await fetch(`${baseUrl}/api/guilds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        name: 'Viper Strike',
        tag: 'VIPR',
      }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /Insufficient GVT balance/i);
  });

  await t.test('POST /api/guilds - rejects duplicate guild name or tag with 409', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: mockUserId1 } },
      error: null,
    });

    supabase.rpc = async (funcName) => {
      if (funcName === 'create_guild_with_leader') {
        return {
          data: null,
          error: { message: 'A guild with this name already exists' },
        };
      }
      return originalRpc.call(supabase, funcName);
    };

    const res = await fetch(`${baseUrl}/api/guilds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        name: 'Cyber Serpents',
        tag: 'CS',
      }),
    });

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /already exists/i);
  });

  await t.test('POST /api/guilds - rejects cross-user creation with 403 when RPC detects unauthorized caller', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: mockUserId1 } },
      error: null,
    });

    supabase.rpc = async (funcName) => {
      if (funcName === 'create_guild_with_leader') {
        return {
          data: null,
          error: { message: 'Unauthorized: Caller cannot create guild for another user' },
        };
      }
      return originalRpc.call(supabase, funcName);
    };

    const res = await fetch(`${baseUrl}/api/guilds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        name: 'Spoofed Guild',
        tag: 'SPOOF',
      }),
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /Unauthorized/i);
  });

  await t.test('POST /api/guilds - fails closed with 500 when RPC encounters an error (no non-atomic fallback)', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: mockUserId1 } },
      error: null,
    });

    supabase.rpc = async (funcName) => {
      if (funcName === 'create_guild_with_leader') {
        return {
          data: null,
          error: { code: 'PGRST202', message: 'Could not find the function create_guild_with_leader in schema cache' },
        };
      }
      return originalRpc.call(supabase, funcName);
    };

    const res = await fetch(`${baseUrl}/api/guilds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        name: 'Failure Test Guild',
        tag: 'FAIL',
      }),
    });

    assert.equal(res.status, 500);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /Internal server error while creating guild/i);
  });

  await t.test('POST /api/guilds - successfully creates guild and registers Leader', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: mockUserId1 } },
      error: null,
    });

    supabase.rpc = async (funcName, args) => {
      if (funcName === 'create_guild_with_leader') {
        return {
          data: {
            success: true,
            guildId: '00000000-0000-0000-0000-000000000099',
            name: args.p_name,
            shortName: args.p_short_name,
            deductedFee: 5.0,
            role: 'Leader',
          },
          error: null,
        };
      }
      return originalRpc.call(supabase, funcName);
    };

    const res = await fetch(`${baseUrl}/api/guilds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        name: 'Iron Valkyries',
        tag: 'VALK',
        description: 'Elite squad',
        maxMembers: 30,
        entryFee: 100,
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.name, 'Iron Valkyries');
    assert.equal(body.data.shortName, 'VALK');
    assert.equal(body.data.role, 'Leader');
  });

  await t.test('GET /api/guilds/:id - returns 404 when guild not found or invalid id', async () => {
    const resInvalid = await fetch(`${baseUrl}/api/guilds/not-a-uuid`);
    assert.equal(resInvalid.status, 404);

    supabase.from = (table) => {
      if (table === 'guilds') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        };
      }
      return originalFrom.call(supabase, table);
    };

    const resNotFound = await fetch(`${baseUrl}/api/guilds/00000000-0000-0000-0000-000000000099`);
    assert.equal(resNotFound.status, 404);
  });

  await t.test('GET /api/guilds/:id - returns full profile, roster, and deferred metadata', async () => {
    supabase.from = (table) => {
      if (table === 'guilds') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: mockGuilds[0], error: null }),
            }),
          }),
        };
      }
      if (table === 'guild_members') {
        return {
          select: () => ({
            eq: async () => ({
              data: [
                { id: 'gm-1', user_id: mockUserId1, role: 'Leader', joined_at: '2026-08-01T12:00:00Z' },
                { id: 'gm-2', user_id: mockUserId2, role: 'Member', joined_at: '2026-08-02T12:00:00Z' },
              ],
              error: null,
            }),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            in: async () => ({
              data: [
                { id: mockUserId1, username: 'ViperKing', avatar_url: '/avatar1.png' },
                { id: mockUserId2, username: 'SnakeGod99', avatar_url: '/avatar2.png' },
              ],
              error: null,
            }),
          }),
        };
      }
      return originalFrom.call(supabase, table);
    };

    const res = await fetch(`${baseUrl}/api/guilds/${mockGuildId1}`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.guild.name, 'Cyber Serpents');
    assert.equal(body.data.members.length, 2);
    assert.equal(body.data.members[0].username, 'ViperKing');
    assert.equal(body.data.members[0].role, 'Leader');
    assert.equal(Array.isArray(body.data.chatPreview), true);
    assert.equal(Array.isArray(body.data.upcomingBattles), true);
    assert.equal(Array.isArray(body.data.battleHistory), true);
    assert.equal(Array.isArray(body.data.incomeBreakdown), true);
    assert.equal(Array.isArray(body.data.treasuryTransactions), true);
  });

  await t.test('POST /api/guilds/:id/apply - rejects unauthenticated requests with 401', async () => {
    const res = await fetch(`${baseUrl}/api/guilds/${mockGuildId1}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivation: 'I want to join!' }),
    });

    assert.equal(res.status, 401);
  });

  await t.test('POST /api/guilds/:id/apply - rejects when user is already a member with 400', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: mockUserId1 } },
      error: null,
    });

    supabase.from = (table) => {
      if (table === 'guilds') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: mockGuilds[0], error: null }),
            }),
          }),
        };
      }
      if (table === 'guild_members') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { id: 'gm-1' }, error: null }),
              }),
            }),
          }),
        };
      }
      return originalFrom.call(supabase, table);
    };

    const res = await fetch(`${baseUrl}/api/guilds/${mockGuildId1}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ motivation: 'Let me in!' }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.message, /already a member/i);
  });

  await t.test('POST /api/guilds/:id/apply - rejects duplicate pending application with 409', async () => {
    supabase.auth.getUser = async () => ({
      data: { user: { id: '33333333-3333-3333-3333-333333333333' } },
      error: null,
    });

    supabase.from = (table) => {
      if (table === 'guilds') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: mockGuilds[0], error: null }),
            }),
          }),
        };
      }
      if (table === 'guild_members') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === 'guild_applications') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: { id: 'app-existing', status: 'pending' }, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      return originalFrom.call(supabase, table);
    };

    const res = await fetch(`${baseUrl}/api/guilds/${mockGuildId1}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ motivation: 'Applying again!' }),
    });

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.match(body.message, /already have a pending application/i);
  });

  await t.test('POST /api/guilds/:id/apply - successfully submits membership application', async () => {
    const applicantId = '44444444-4444-4444-4444-444444444444';
    supabase.auth.getUser = async () => ({
      data: { user: { id: applicantId } },
      error: null,
    });

    supabase.from = (table) => {
      if (table === 'guilds') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: mockGuilds[0], error: null }),
            }),
          }),
        };
      }
      if (table === 'guild_members') {
        return {
          select: (cols, opts) => {
            if (opts?.head) {
              return {
                eq: async () => ({ count: 10, error: null }),
              };
            }
            return {
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
            };
          },
        };
      }
      if (table === 'guild_applications') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
            }),
          }),
          insert: (appData) => ({
            select: () => ({
              single: async () => ({
                data: {
                  id: 'app-new-1',
                  guild_id: appData.guild_id,
                  user_id: appData.user_id,
                  status: 'pending',
                  created_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        };
      }
      return originalFrom.call(supabase, table);
    };

    const res = await fetch(`${baseUrl}/api/guilds/${mockGuildId1}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        motivation: 'I am a top tier chess and snake player with 75% winrate.',
        guildHistory: 'None',
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'pending');
    assert.equal(body.data.guildId, mockGuildId1);
  });

  await t.test('POST /api/guilds/:id/apply - rejects concurrent race duplicate with 409 on partial unique index violation (code 23505)', async () => {
    const applicantId = '55555555-5555-5555-5555-555555555555';
    supabase.auth.getUser = async () => ({
      data: { user: { id: applicantId } },
      error: null,
    });

    supabase.from = (table) => {
      if (table === 'guilds') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: mockGuilds[0], error: null }),
            }),
          }),
        };
      }
      if (table === 'guild_members') {
        return {
          select: (cols, opts) => {
            if (opts?.head) {
              return {
                eq: async () => ({ count: 10, error: null }),
              };
            }
            return {
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
            };
          },
        };
      }
      if (table === 'guild_applications') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: null,
                error: {
                  code: '23505',
                  message: 'duplicate key value violates unique constraint "idx_uq_guild_pending_app"',
                },
              }),
            }),
          }),
        };
      }
      return originalFrom.call(supabase, table);
    };

    const res = await fetch(`${baseUrl}/api/guilds/${mockGuildId1}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        motivation: 'Fast concurrent click application',
      }),
    });

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /already have a pending application/i);
  });

  await t.test('GET /api/leaderboard/guilds - returns competitive ranking array', async () => {
    supabase.from = (table) => {
      if (table === 'guilds') {
        return {
          select: () => ({
            order: function () {
              return {
                order: () => ({
                  range: async () => ({ data: mockGuilds, count: mockGuilds.length, error: null }),
                }),
              };
            },
          }),
        };
      }
      if (table === 'guild_members') {
        return {
          select: () => Promise.resolve({
            data: [{ guild_id: mockGuildId1 }, { guild_id: mockGuildId1 }],
            error: null,
          }),
        };
      }
      return originalFrom.call(supabase, table);
    };

    const res = await fetch(`${baseUrl}/api/leaderboard/guilds`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(Array.isArray(body.data), true);
    assert.equal(body.data.length, 2);
    assert.equal(body.data[0].name, 'Cyber Serpents');
    assert.equal(body.data[0].rank, 1);
    assert.equal(body.data[0].totalWins, 142);
    assert.equal(body.data[1].name, 'Alpha Blitzers');
    assert.equal(body.data[1].rank, 2);
  });
});
