# 1v1 POC & Backend Roadmap Status

## Current Branch

- `feature/backend-api-integration`

## Phase Execution & Deployment Summary

| Phase | Title | Database Migration | Implementation Status | Test & Production Verification Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | **Security Hardening** | `20260826_phase1_security_remediation.sql` | **Completed & Deployed** | Live RPC verified: `lock_stake`/`unlock_stake` return `42501` to anon; `trigger_rematch` returns `REMATCH_DISABLED`. Isolated test suite `phase1_security_remediation.sql` passed; multi-session concurrent settlement passed with 0 deadlocks. |
| **Phase 2** | **Authority Hardening** | `20260814_phase2_perform_game_move_authority.sql` | **Completed & Deployed** | Server-authoritative move validation for Chess & Checkers via `submit_game_move` Edge Function and `apply_validated_game_move`. Receipt verification in `submit_match_result`. |
| **Phase 3** | **Match Lifecycle & State Machine** | Hardened across Phase 1–5 schema | **Completed & Deployed** | Deterministic lifecycle state machine (`active`, `reconnecting`, `finished`, `resolved`). Turn clocks and disconnect deadlines enforced. |
| **Phase 4** | **Timer & Disconnect Authority** | `20260825_phase4_timeout_sweeper.sql` | **Completed & Deployed** | `sweep_expired_matches` RPC deployed. Backend sweeper service `matchSweeper.js` and internal endpoint `POST /api/_internal/sweep-expired-matches` tested (14 automated unit/route tests passed). *(Scheduler operational status requires external cron/host)*. |
| **Phase 5** | **Payout Finalization & Draw Settlement** | `20260824_phase5_draw_settlement.sql` | **Completed & Deployed** | Idempotent ledger `match_payouts`. Refund draw settlement `settle_match_draw` deployed and verified. Historical chess stalemate `5dd0829a` reconciled. Strict escrow validation and sorted row locking. |
| **Phase 6** | **Gameplay Expansion** | Future Work | **Roadmap Defined** | Scope guardrails established for non-core game types and enhancements without weakening authority invariants. |

## Automated Test Evidence

1. **Backend Integration Regression Suite:**
   - Command: `npm test` inside `Backend/`
   - Output: **127 tests passed across 10 suites (0 failures)**.
     - Tournaments API Suite (Phase 7): 22/22
     - Match Summary & Events Suite: 16/16
     - User Profile & Wallet Suite: 8/8
     - Phase 4 Sweeper & Disconnect Suite: 13/13
     - Phase 5 Draw Settlement Suite: 10/10
     - Guilds & Social System Suite: 26/26
     - Marketplace & Purchasing Suite: 18/18
     - Leaderboard & Stats Suite: 14/14
2. **Isolated PostgreSQL Test Execution:**
   - Full migration chain applied cleanly to local isolated PostgreSQL database.
   - `supabase/tests/phase1_security_remediation.sql`: **PASS** (`ALL PHASE 1 SECURITY REMEDIATION TESTS PASSED!`).
   - Role-based wallet balance injection: **REJECTED** with `42501 (insufficient_privilege)`.
   - Multi-session reciprocal settlement concurrency: **PASS** (zero deadlocks across concurrent OS processes).

## Outstanding Risks & Operational Limitations

1. **Phase 4 Scheduler Operational Status:**
   - The database RPC `sweep_expired_matches`, internal endpoint `/api/_internal/sweep-expired-matches`, and background worker service `matchSweeper.js` are fully implemented and tested.
   - **Operational Limitation:** The sweeper is not guaranteed to run continuously in serverless deployment environments without a persistent worker process or an external recurring cron trigger (e.g. Cloudflare Worker, Supabase pg_cron, or external HTTP ping with `INTERNAL_SWEEPER_TOKEN`).
2. **Rematch Disabling:**
   - In-place match resurrection is safely disabled (`REMATCH_DISABLED`) to preserve financial ledger idempotency and audit history. Players must start a new matchmaking queue rather than remounting completed match IDs.
3. **Migration Version Control Hygiene:**
   - Migrations `20260814` through `20260826` are active in the database and must be committed to git to guarantee environment reproducibility.

## Demo Readiness Checklist

- [x] Two-player matchmaking into one shared match
- [x] Realtime opponent visibility for both players
- [x] Concurrent gameplay data submission from both clients
- [x] Backend validation of submitted outcomes/data
- [x] Backend authoritative winner selection
- [x] Authoritative result broadcast to both players
- [x] Idempotent payout release and draw settlement
- [x] End-to-end runbook and demo evidence captured

