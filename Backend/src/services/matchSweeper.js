const supabase = require('../config/supabase');

let sweeperIntervalHandle = null;
let isSweeping = false;

/**
 * Execute a single timeout and disconnect sweep pass.
 * @param {number} batchLimit - Maximum matches to process in this batch (1-100)
 * @returns {Promise<{success: boolean, data?: object, skipped?: boolean, message?: string, error?: string}>}
 */
const sweepOnce = async (batchLimit = 25) => {
  if (isSweeping) {
    return {
      success: true,
      skipped: true,
      message: 'Sweep already in progress, skipping overlapping run'
    };
  }

  isSweeping = true;
  try {
    const validLimit = Math.max(1, Math.min(Number(batchLimit) || 25, 100));
    const { data, error } = await supabase.rpc('sweep_expired_matches', {
      p_batch_limit: validLimit
    });

    if (error) {
      console.error('[MatchSweeper] RPC error during sweep:', error.message);
      return {
        success: false,
        error: error.message
      };
    }

    if (data?.swept_count > 0) {
      console.log(`[MatchSweeper] Successfully swept ${data.swept_count} matches:`, {
        disconnects: data.disconnect_forfeits,
        turnTimeouts: data.turn_timeouts,
        terminalResolutions: data.terminal_resolutions,
        abandonedFirstMoves: data.first_move_abandonments
      });
    }

    return {
      success: true,
      data
    };
  } catch (err) {
    console.error('[MatchSweeper] Exception during sweep:', err.message);
    return {
      success: false,
      error: err.message
    };
  } finally {
    isSweeping = false;
  }
};

/**
 * Start the periodic background sweeper.
 * Safe across horizontal replicas because the underlying RPC uses FOR UPDATE SKIP LOCKED.
 * @param {object} options
 * @param {number} options.intervalMs - Polling interval in ms (default 15000)
 * @param {number} options.batchLimit - Batch size per sweep (default 25)
 */
const startSweeper = (options = {}) => {
  if (sweeperIntervalHandle) {
    return sweeperIntervalHandle;
  }

  const intervalMs = Number(options.intervalMs || process.env.MATCH_SWEEPER_INTERVAL_MS) || 15000;
  const batchLimit = Number(options.batchLimit || process.env.MATCH_SWEEPER_BATCH_SIZE) || 25;

  console.log(`[MatchSweeper] Starting background sweeper (interval: ${intervalMs}ms, batch: ${batchLimit})`);

  // Run once immediately
  sweepOnce(batchLimit).catch((err) => {
    console.error('[MatchSweeper] Initial sweep error:', err.message);
  });

  sweeperIntervalHandle = setInterval(() => {
    sweepOnce(batchLimit).catch((err) => {
      console.error('[MatchSweeper] Interval sweep error:', err.message);
    });
  }, intervalMs);

  if (sweeperIntervalHandle.unref) {
    sweeperIntervalHandle.unref();
  }

  return sweeperIntervalHandle;
};

/**
 * Stop the background sweeper interval.
 */
const stopSweeper = () => {
  if (sweeperIntervalHandle) {
    clearInterval(sweeperIntervalHandle);
    sweeperIntervalHandle = null;
    console.log('[MatchSweeper] Background sweeper stopped');
  }
};

const isSweeperRunning = () => {
  return sweeperIntervalHandle !== null;
};

module.exports = {
  sweepOnce,
  startSweeper,
  stopSweeper,
  isSweeperRunning
};
