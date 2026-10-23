#!/usr/bin/env node

/**
 * Standalone CLI runner for Match Timeout and Disconnect Sweeper.
 * Suitable for execution via crontab, systemd timers, container cron jobs,
 * or CI/CD scheduled runners.
 *
 * Usage:
 *   node scripts/sweep_matches.js [batchLimit]
 */

require('dotenv').config();
const { sweepOnce } = require('../src/services/matchSweeper');

async function main() {
  const argLimit = process.argv[2] ? parseInt(process.argv[2], 10) : undefined;
  const batchLimit = Number.isInteger(argLimit) && argLimit > 0 ? argLimit : 25;

  console.log(`[CLI Sweeper] Starting match sweep (batchLimit: ${batchLimit})...`);
  const startTime = Date.now();

  try {
    const result = await sweepOnce(batchLimit);
    const duration = Date.now() - startTime;

    if (!result.success) {
      console.error(`[CLI Sweeper] Sweep failed (${duration}ms):`, result.error);
      process.exit(1);
    }

    if (result.skipped) {
      console.log(`[CLI Sweeper] Sweep skipped: ${result.message}`);
      process.exit(0);
    }

    const { swept_count, disconnect_forfeits, turn_timeouts, terminal_resolutions, first_move_abandonments } = result.data || {};
    console.log(`[CLI Sweeper] Sweep completed in ${duration}ms. Swept: ${swept_count || 0} ` +
      `[Disconnects: ${disconnect_forfeits || 0}, Timeouts: ${turn_timeouts || 0}, ` +
      `Terminal: ${terminal_resolutions || 0}, Abandoned: ${first_move_abandonments || 0}]`);
    process.exit(0);
  } catch (err) {
    console.error('[CLI Sweeper] Unexpected error:', err.message);
    process.exit(1);
  }
}

main();
