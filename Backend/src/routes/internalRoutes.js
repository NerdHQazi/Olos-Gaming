const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { sweepOnce } = require('../services/matchSweeper');

// Protected health check. Set INTERNAL_DEBUG_TOKEN in the environment and
// provide it as header 'x-internal-token' when calling this endpoint.
router.get('/supabase-health', async (req, res) => {
  const token = req.headers['x-internal-token'];
  if (!process.env.INTERNAL_DEBUG_TOKEN) {
    return res.status(500).json({ success: false, message: 'Internal debug token not configured on server' });
  }

  if (!token || token !== process.env.INTERNAL_DEBUG_TOKEN) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  try {
    // Perform a harmless select to verify Supabase connectivity (requires read access)
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      console.error('[Internal] Supabase health check error:', error);
      return res.status(502).json({ success: false, message: 'Supabase call failed', details: error.message });
    }

    return res.json({ success: true, message: 'Supabase reachable', sampleRows: (data || []).length });
  } catch (err) {
    console.error('[Internal] Supabase health exception:', err);
    return res.status(500).json({ success: false, message: 'Exception during health check' });
  }
});

// Protected endpoint to trigger match timeout and disconnect sweeps.
// Can be invoked by external schedulers (e.g. Supabase cron, Cloudflare Workers, uptime monitors).
router.post('/sweep-expired-matches', async (req, res) => {
  const token = req.headers['x-internal-token'];
  const expectedToken = process.env.INTERNAL_SWEEPER_TOKEN || process.env.INTERNAL_DEBUG_TOKEN;

  if (!expectedToken) {
    return res.status(500).json({ success: false, message: 'Internal token not configured on server' });
  }

  if (!token || token !== expectedToken) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const rawBatchLimit = req.body?.batchLimit ?? req.query?.batchLimit ?? 25;
  const numLimit = Number(rawBatchLimit);
  if (!Number.isInteger(numLimit) || numLimit < 1 || numLimit > 100) {
    return res.status(400).json({
      success: false,
      message: 'batchLimit must be an integer between 1 and 100'
    });
  }

  const result = await sweepOnce(numLimit);
  if (!result.success) {
    return res.status(502).json({
      success: false,
      message: 'Failed to execute match sweep',
      details: result.error
    });
  }

  return res.json({
    success: true,
    message: result.skipped ? 'Sweep skipped' : 'Sweep executed successfully',
    ...(result.data || {})
  });
});

module.exports = router;

