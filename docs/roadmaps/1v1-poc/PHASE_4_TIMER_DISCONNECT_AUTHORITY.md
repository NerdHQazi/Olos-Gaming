# Phase 4: Timer / Disconnect Authority

## Purpose

Handle reconnects, forfeits, turn timeouts, abandoned matches, and authority-controlled match resolution without client trust assumptions or frozen timers.

## Why It Exists

A server-authoritative 1v1 platform must handle real-world volatility (player disconnects, closed browser tabs, malicious cessation of timer ticks, and abandoned matches) deterministically. Without server-driven sweeps, un-ticked matches remain frozen in `active` or `reconnecting` status indefinitely, locking user stakes in `wallets.locked_balance`.

## Audit Findings & Baseline State

1. **Client-Dependent Heartbeat Vulnerability:**
   - `update_game_timers(p_match_id, p_actor_id)` requires `auth.uid() = player1_id OR player2_id`.
   - `game_tick/index.ts` requires a valid authenticated user JWT.
   - When both players close their tab, lose network connectivity, or deliberately stop calling `game_tick`, match timers freeze forever.
2. **Uncalled Forfeit Sweeper:**
   - `check_forfeits()` was defined in `20260811` and updated in `20260812`, granted only to `service_role`.
   - **Critical Gap:** Nothing in the codebase, backend, or cloud environment invokes `check_forfeits()`. No `pg_cron` extension is active.
3. **Incomplete Timeout Coverage in Legacy `check_forfeits()`:**
   - Legacy `check_forfeits()` only checks `status = 'reconnecting' AND disconnect_deadline < NOW()`.
   - It ignores active turn timeouts (`status = 'active'` where turn player clock has expired).
   - It ignores stalled pending terminal resolutions (`status = 'active' AND resolution_state = 'pending'` where client disconnected before invoking `submit_match_result`).
   - It ignores turn-based matches abandoned before the first move (`game_move_number = 0` where timer deduction is paused).
4. **Concurrency & Multi-Instance Contention:**
   - Legacy `check_forfeits()` used `FOR UPDATE`, risking row contention and lock blocking across multiple server instances.
   - Production requirement: must use `FOR UPDATE SKIP LOCKED` and batch limits to enable parallel, non-blocking execution across horizontal replicas.

## Architecture & Implementation Plan

### 1. Database Layer (`20260825_phase4_timeout_sweeper.sql`)

Implement `public.sweep_expired_matches(p_batch_limit INT DEFAULT 25) RETURNS JSONB`:
- **Security:** `SECURITY DEFINER`, `SET search_path = public, pg_temp;`.
- **Privileges:** `REVOKE EXECUTE FROM PUBLIC, anon, authenticated; GRANT EXECUTE TO service_role;`.
- **Concurrency Safety:** Queries candidate matches using `FOR UPDATE SKIP LOCKED LIMIT p_batch_limit`.
- **Category 1 — Expired Disconnects:**
  - Condition: `status = 'reconnecting' AND disconnect_deadline < NOW()`
  - Resolution: Forfeit to remaining connected player (`finalize_match_outcome(match_id, winner_id, 'disconnect_forfeit')`). If `disconnected_player_id` is unknown, settle as refund draw.
- **Category 2 — Stalled Terminal Resolutions:**
  - Condition: `status = 'active' AND resolution_state = 'pending' AND last_move_timestamp < NOW() - INTERVAL '45 seconds'`
  - Resolution: Auto-finalize using `terminal_winner_id` and `terminal_reason`.
- **Category 3 — Active Turn Timeouts:**
  - Condition: `status = 'active' AND resolution_state = 'none'` (moves > 0 or snake)
  - Calculation: Elapsed time since `last_move_timestamp`. If current turn player clock $\le 0$, award win to opponent with reason `'timeout'`. For snake matches, compare scores on timeout or settle draw if equal.
- **Category 4 — First-Move Abandonment:**
  - Condition: `status = 'active' AND resolution_state = 'none' AND game_move_number = 0 AND created_at < NOW() - INTERVAL '15 minutes'`
  - Resolution: Settle as abandoned draw (`winner_id = NULL`, reason `'abandoned_first_move'`), releasing both players' locked stakes back to their spendable wallet balance atomically.
- **Telemetry:** Returns structured JSONB containing counts (`swept_count`, `disconnect_forfeits`, `turn_timeouts`, `terminal_resolutions`, `first_move_abandonments`) and processed match IDs.
- **Legacy Compatibility:** Update `public.check_forfeits()` to delegate to `sweep_expired_matches(50)`.

### 2. Backend Sweeper Service & Scheduler (`Backend/src/services/matchSweeper.js`)

- **Dual-Trigger Model:**
  1. **External Webhook / Cron Endpoint:** `POST /api/_internal/sweep-expired-matches` protected by `x-internal-token`. Allows external schedulers (Supabase cron, Cloudflare Workers, Render Cron, uptime monitors) to trigger sweeps without relying on in-memory state.
  2. **In-Process Background Sweeper:** An opt-in, self-recovering background interval in `Backend/src/services/matchSweeper.js`. Enabled via `MATCH_SWEEPER_ENABLED` (defaults to true), with interval `MATCH_SWEEPER_INTERVAL_MS` (default 15s).
- **In-Flight Run Guard:** Ensures an in-process tick does not stack on top of a slow database query.
- **Graceful Lifecycle:** Clean `startSweeper()` and `stopSweeper()` hooks supporting `SIGTERM` and testing harnesses.

### 3. Concurrency & Payout Idempotency

- `finalize_match_outcome` is the sole mutation gate.
- It verifies `status` transitions atomically (`status = 'finished'`, `resolution_state = 'resolved'`).
- `release_winnings` and `settle_match_draw` both use `INSERT INTO match_payouts ... ON CONFLICT (match_id) DO NOTHING` and locked wallet updates, preventing double payouts under concurrent or repeated executions.

## Risks & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Clock skew between server and DB** | Premature or delayed timeouts | Use PostgreSQL `NOW()` for all deadline calculations and elapsed time measurements. |
| **Multi-instance race conditions** | Duplicate resolutions or deadlocks | `FOR UPDATE SKIP LOCKED` skips locked rows instantly; `finalize_match_outcome` verifies `status` idempotently. |
| **First move timer drift confusion** | Games canceled prematurely | Set first-move abandonment threshold to 15 minutes, allowing ample time for slow client loading. |
| **Service role credential leakage** | Unauthorized sweep triggers | Revoke execute from public/anon/authenticated. Require `x-internal-token` for HTTP trigger. |

## Validation Gates & Verified Results

1. **SQL Verification (Database-Executed on Isolated PostgreSQL 16 container):**
   - Migration `supabase/migrations/20260825_phase4_timeout_sweeper.sql` applied successfully.
   - Test suite `supabase/tests/phase4_timeout_sweeper.sql` executed inside a transaction and passed all assertions:
     - Disconnect forfeit (P1 disconnected $\rightarrow$ P2 wins with payout).
     - Disconnect forfeit (P2 disconnected $\rightarrow$ P1 wins with payout).
     - Stalled terminal resolution (45s elapsed $\rightarrow$ auto-finalized with recorded reason/winner).
     - Turn timeout (turn player clock exhausted $\rightarrow$ opponent win with reason `'timeout'`).
     - Snake decisive timeout (P1 score > P2 score $\rightarrow$ P1 win with reason `'timer_expired'`).
     - Snake tied timeout (P1 score = P2 score $\rightarrow$ settled as draw with stake refund).
     - First-move abandonment (0 moves after 15m $\rightarrow$ settled as draw with full stake refunds).
     - Active valid match $\rightarrow$ left untouched in `active` state.
     - Sweeper idempotency $\rightarrow$ immediate second sweep processes 0 matches without side-effects.
     - Batch limit clamping and limiting $\rightarrow$ strictly respected (`LIMIT (v_limit - v_swept_count)`).
   - Test transaction safely rolled back without residual state.

2. **Backend Automated Regression Suite (127 passing tests):**
   - `Backend/tests/timeoutSweeper.test.js` (14 passing tests):
     - `sweepOnce`: RPC argument validation, batch clamping `[1, 100]`, in-flight lock against concurrent runs, database error handling, and uncaught exception handling.
     - `startSweeper` / `stopSweeper`: Clean interval lifecycle management.
     - `POST /api/_internal/sweep-expired-matches`: Missing token (403), incorrect token (403), dedicated `INTERNAL_SWEEPER_TOKEN` authentication, batch limit validation (400), query parameter parsing (`?batchLimit=15`), successful execution (200), and RPC failure handling (502).
   - All 127 backend automated tests across 10 suites pass with 0 failures.

3. **Production Scheduler Configuration & Limitations:**
   - **Repository-Side Components Ready:**
     - In-process interval worker in `Backend/src/services/matchSweeper.js` (starts on server listen if `MATCH_SWEEPER_ENABLED=true`).
     - Internal HTTP trigger `POST /api/_internal/sweep-expired-matches` protected by `x-internal-token`.
     - Standalone CLI runner in `Backend/scripts/sweep_matches.js` for crontab/systemd/CI runners.
     - Multi-instance concurrency guaranteed safe by `FOR UPDATE SKIP LOCKED`.
   - **Deployment Limitations & Host Requirements:**
     - Supabase `pg_cron` is not configured in this database.
     - No external cloud scheduler (e.g. Cloudflare Worker or Render Cron) is currently provisioned in the repository.
     - For production deployment, either configure `MATCH_SWEEPER_ENABLED=true` in the Node environment, or schedule an external HTTP ping to `/api/_internal/sweep-expired-matches` every 15–30s.

## Manual Approval & Deployment Gate

**DO NOT APPLY MIGRATION AUTOMATICALLY.**

Before applying `20260825_phase4_timeout_sweeper.sql` to the production Supabase database:
1. Verify that `20260824_phase5_draw_settlement.sql` has already been applied (as Phase 4 relies on `settle_match_draw`).
2. Review the migration SQL in `supabase/migrations/20260825_phase4_timeout_sweeper.sql`.
3. Set `INTERNAL_SWEEPER_TOKEN` or `INTERNAL_DEBUG_TOKEN` in the production backend environment.
4. Set `MATCH_SWEEPER_ENABLED=true` in the production backend environment, or configure an external cron job targeting `POST /api/_internal/sweep-expired-matches`.
5. Execute the migration SQL manually in Supabase SQL Editor or via Supabase CLI.
