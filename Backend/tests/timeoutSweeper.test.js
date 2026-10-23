const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://mock.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role-key';
process.env.INTERNAL_DEBUG_TOKEN = 'test-internal-secret-token';
process.env.NODE_ENV = 'test';

const supabase = require('../src/config/supabase');
const app = require('../src/app');
const matchSweeper = require('../src/services/matchSweeper');

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

test('Phase 4 Match Timeout Sweeper & Disconnect Authority Suite', async (t) => {
  const { server, baseUrl } = await startServer();
  const originalRpc = supabase.rpc;

  t.after(() => {
    supabase.rpc = originalRpc;
    matchSweeper.stopSweeper();
    server.close();
  });

  // --- SERVICE TESTS ---

  await t.test('sweepOnce: successfully invokes RPC and returns telemetry', async () => {
    let capturedArgs = null;
    supabase.rpc = async (fnName, args) => {
      if (fnName === 'sweep_expired_matches') {
        capturedArgs = args;
        return {
          data: {
            status: 'success',
            swept_count: 3,
            disconnect_forfeits: 1,
            terminal_resolutions: 1,
            turn_timeouts: 1,
            first_move_abandonments: 0,
            swept_match_ids: ['m1', 'm2', 'm3']
          },
          error: null
        };
      }
      return { data: null, error: new Error('Unknown RPC') };
    };

    const result = await matchSweeper.sweepOnce(30);
    assert.equal(result.success, true);
    assert.equal(capturedArgs.p_batch_limit, 30);
    assert.equal(result.data.swept_count, 3);
    assert.equal(result.data.disconnect_forfeits, 1);
    assert.equal(result.data.turn_timeouts, 1);
  });

  await t.test('sweepOnce: clamps batch limit bounds to [1, 100]', async () => {
    let capturedLimits = [];
    supabase.rpc = async (fnName, args) => {
      capturedLimits.push(args.p_batch_limit);
      return { data: { status: 'success', swept_count: 0 }, error: null };
    };

    await matchSweeper.sweepOnce(-10);
    await matchSweeper.sweepOnce(500);

    assert.equal(capturedLimits[0], 1);
    assert.equal(capturedLimits[1], 100);
  });

  await t.test('sweepOnce: prevents overlapping executions (in-flight lock)', async () => {
    let resolveSlowRpc;
    const slowRpcPromise = new Promise((resolve) => {
      resolveSlowRpc = resolve;
    });

    supabase.rpc = async () => {
      await slowRpcPromise;
      return { data: { status: 'success', swept_count: 1 }, error: null };
    };

    // Trigger first sweep (will hang on slowRpcPromise)
    const run1Promise = matchSweeper.sweepOnce(25);

    // Trigger second sweep while first is in-flight
    const run2 = await matchSweeper.sweepOnce(25);
    assert.equal(run2.success, true);
    assert.equal(run2.skipped, true);
    assert.match(run2.message, /already in progress/i);

    // Release first sweep
    resolveSlowRpc();
    const run1 = await run1Promise;
    assert.equal(run1.success, true);
    assert.equal(run1.data.swept_count, 1);
  });

  await t.test('sweepOnce: handles database RPC failure gracefully', async () => {
    supabase.rpc = async () => {
      return { data: null, error: { message: 'Database connection timeout' } };
    };

    const result = await matchSweeper.sweepOnce(25);
    assert.equal(result.success, false);
    assert.equal(result.error, 'Database connection timeout');
  });

  await t.test('startSweeper & stopSweeper: manages interval lifecycle cleanly', async () => {
    supabase.rpc = async () => ({ data: { status: 'success', swept_count: 0 }, error: null });

    assert.equal(matchSweeper.isSweeperRunning(), false);

    const handle = matchSweeper.startSweeper({ intervalMs: 100000 });
    assert.ok(handle);
    assert.equal(matchSweeper.isSweeperRunning(), true);

    // Calling start again returns existing handle idempotently
    const secondHandle = matchSweeper.startSweeper({ intervalMs: 100000 });
    assert.equal(secondHandle, handle);

    matchSweeper.stopSweeper();
    assert.equal(matchSweeper.isSweeperRunning(), false);
  });

  // --- HTTP ROUTE TESTS (POST /api/_internal/sweep-expired-matches) ---

  await t.test('POST /api/_internal/sweep-expired-matches: rejects missing token with 403', async () => {
    const res = await fetch(`${baseUrl}/api/_internal/sweep-expired-matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchLimit: 25 })
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, 'Forbidden');
  });

  await t.test('POST /api/_internal/sweep-expired-matches: rejects incorrect token with 403', async () => {
    const res = await fetch(`${baseUrl}/api/_internal/sweep-expired-matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': 'wrong-token'
      },
      body: JSON.stringify({ batchLimit: 25 })
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, 'Forbidden');
  });

  await t.test('POST /api/_internal/sweep-expired-matches: validates batchLimit parameter', async () => {
    const res = await fetch(`${baseUrl}/api/_internal/sweep-expired-matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': 'test-internal-secret-token'
      },
      body: JSON.stringify({ batchLimit: -5 })
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /between 1 and 100/i);
  });

  await t.test('POST /api/_internal/sweep-expired-matches: executes sweep with valid token', async () => {
    supabase.rpc = async (fnName, args) => {
      assert.equal(fnName, 'sweep_expired_matches');
      assert.equal(args.p_batch_limit, 50);
      return {
        data: {
          status: 'success',
          swept_count: 2,
          disconnect_forfeits: 1,
          turn_timeouts: 1,
          terminal_resolutions: 0,
          first_move_abandonments: 0,
          swept_match_ids: ['uuid-1', 'uuid-2']
        },
        error: null
      };
    };

    const res = await fetch(`${baseUrl}/api/_internal/sweep-expired-matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': 'test-internal-secret-token'
      },
      body: JSON.stringify({ batchLimit: 50 })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.swept_count, 2);
    assert.equal(body.disconnect_forfeits, 1);
    assert.equal(body.turn_timeouts, 1);
    assert.deepEqual(body.swept_match_ids, ['uuid-1', 'uuid-2']);
  });

  await t.test('POST /api/_internal/sweep-expired-matches: returns 502 on database failure', async () => {
    supabase.rpc = async () => ({
      data: null,
      error: { message: 'Database query timeout' }
    });

    const res = await fetch(`${baseUrl}/api/_internal/sweep-expired-matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': 'test-internal-secret-token'
      },
      body: JSON.stringify({ batchLimit: 25 })
    });

    assert.equal(res.status, 502);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.details, 'Database query timeout');
  });

  await t.test('POST /api/_internal/sweep-expired-matches: accepts batchLimit via query parameter', async () => {
    let capturedLimit = null;
    supabase.rpc = async (fnName, args) => {
      capturedLimit = args.p_batch_limit;
      return { data: { status: 'success', swept_count: 0 }, error: null };
    };

    const res = await fetch(`${baseUrl}/api/_internal/sweep-expired-matches?batchLimit=15`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': 'test-internal-secret-token'
      }
    });

    assert.equal(res.status, 200);
    assert.equal(capturedLimit, 15);
  });

  await t.test('POST /api/_internal/sweep-expired-matches: honors INTERNAL_SWEEPER_TOKEN priority', async () => {
    const prevSweeperToken = process.env.INTERNAL_SWEEPER_TOKEN;
    process.env.INTERNAL_SWEEPER_TOKEN = 'priority-sweeper-secret';

    try {
      supabase.rpc = async () => ({ data: { status: 'success', swept_count: 0 }, error: null });

      const res = await fetch(`${baseUrl}/api/_internal/sweep-expired-matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-token': 'priority-sweeper-secret'
        }
      });

      assert.equal(res.status, 200);
    } finally {
      if (prevSweeperToken) {
        process.env.INTERNAL_SWEEPER_TOKEN = prevSweeperToken;
      } else {
        delete process.env.INTERNAL_SWEEPER_TOKEN;
      }
    }
  });

  await t.test('sweepOnce: catches and handles thrown exceptions safely', async () => {
    supabase.rpc = async () => {
      throw new Error('Fatal socket disconnect');
    };

    const result = await matchSweeper.sweepOnce(25);
    assert.equal(result.success, false);
    assert.equal(result.error, 'Fatal socket disconnect');
  });
});
