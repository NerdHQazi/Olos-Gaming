const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://mock.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role-key';
process.env.NODE_ENV = 'test';

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

test('Deployment Readiness: Health Check & Trust Proxy Suite', async (t) => {
  const { server, baseUrl } = await startServer();

  t.after(() => {
    server.close();
  });

  await t.test('GET /api/health: returns 200 with status ok and valid uptime', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(typeof body.uptime, 'number');
    assert.ok(body.uptime >= 0);
  });

  await t.test('trust proxy configuration: Express app has trust proxy configured to 1', async () => {
    assert.equal(app.get('trust proxy'), 1, 'app.get("trust proxy") must be set to 1 for Render');
  });

  await t.test('trust proxy: correctly identifies client IP and ignores prepended spoofed IPs', async () => {
    let capturedIp = null;
    const testRoutePath = '/api/_test-proxy-ip-capture';

    // Temporarily mount a lightweight probe route on app
    app.get(testRoutePath, (req, res) => {
      capturedIp = req.ip;
      res.json({ ip: req.ip, ips: req.ips });
    });

    // Case A: Standard single forwarded IP from proxy
    const resSingle = await fetch(`${baseUrl}${testRoutePath}`, {
      headers: { 'x-forwarded-for': '198.51.100.25' }
    });
    assert.equal(resSingle.status, 200);
    assert.equal(capturedIp, '198.51.100.25', 'Should detect forwarded client IP from single hop');

    // Case B: Malicious client attempts to spoof IP by prepending it
    // Client sends spoofed IP '203.0.113.195', but actual client connecting to proxy is '198.51.100.50'
    const resSpoofed = await fetch(`${baseUrl}${testRoutePath}`, {
      headers: { 'x-forwarded-for': '203.0.113.195, 198.51.100.50' }
    });
    assert.equal(resSpoofed.status, 200);
    assert.equal(
      capturedIp,
      '198.51.100.50',
      'Should select the immediate client IP (last hop before proxy) and reject prepended spoofed IP'
    );
  });

  await t.test('GET /api/health: exhausts general API limiter and confirms health check is not throttled', async () => {
    const exhaustedClientIp = '198.51.100.99';

    // 1. Send 100 requests to an endpoint protected by the general API rate limiter (/api/docs)
    const requestBatch = [];
    for (let i = 0; i < 100; i++) {
      requestBatch.push(fetch(`${baseUrl}/api/docs`, {
        headers: { 'x-forwarded-for': exhaustedClientIp }
      }));
    }
    await Promise.all(requestBatch);

    // 2. The 101st request to the rate-limited endpoint MUST be throttled (HTTP 429)
    const resThrottled = await fetch(`${baseUrl}/api/docs`, {
      headers: { 'x-forwarded-for': exhaustedClientIp }
    });
    assert.equal(resThrottled.status, 429, '101st request to /api/docs must be rate-limited to 429');

    // 3. From the exact same exhausted client IP, GET /api/health MUST still return 200
    const resHealth = await fetch(`${baseUrl}/api/health`, {
      headers: { 'x-forwarded-for': exhaustedClientIp }
    });
    assert.equal(resHealth.status, 200, 'GET /api/health must return 200 even when client IP has exhausted rate limit');
    const healthBody = await resHealth.json();
    assert.equal(healthBody.status, 'ok');

    // 4. Verify that normal endpoints remain throttled for this IP
    const resStillThrottled = await fetch(`${baseUrl}/api/docs`, {
      headers: { 'x-forwarded-for': exhaustedClientIp }
    });
    assert.equal(resStillThrottled.status, 429, 'Subsequent request to /api/docs must remain 429');

    // 5. Verify that a separate client IP is not affected (per-IP rate limiting)
    const freshClientIp = '198.51.100.100';
    const resFresh = await fetch(`${baseUrl}/api/docs`, {
      headers: { 'x-forwarded-for': freshClientIp }
    });
    assert.equal(resFresh.status, 200, 'Separate client IP must not be throttled');
  });
});
