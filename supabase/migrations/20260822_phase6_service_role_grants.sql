-- =============================================================================
-- Migration: Phase 1–6 Service Role Grants
-- Created for: OLOS Gaming Platform
-- Purpose: Grant service_role required SQL privileges on core platform tables.
--
-- Context:
--   Previous migrations (20260804_fix_auth_table_grants.sql and
--   20260813_matchmaking_client_grants.sql) tightened table-level DAC privileges
--   for anon and authenticated roles, but omitted service_role.
--   In PostgreSQL / Supabase, while service_role possesses BYPASSRLS, table-level
--   GRANTs are still strictly enforced. Consequently, backend services querying
--   via the service_role key encountered HTTP 500 / PostgreSQL 42501 (Permission Denied).
--
-- Security Invariants Preserved:
--   1. RLS remains ENABLED on all tables.
--   2. anon and authenticated roles remain strictly bound by RLS policies.
--   3. wallets UPDATE/DELETE permissions remain withheld from anon/authenticated,
--      ensuring balance mutations occur solely through audited SECURITY DEFINER RPCs
--      or trusted backend workflows.
-- =============================================================================

-- 1. profiles: Profile reading for user stats, match participants, leaderboards, and guild rosters.
GRANT ALL ON TABLE public.profiles TO service_role;

-- 2. wallets: Wallet queries, balance lookups, and administrative ledger checks.
GRANT ALL ON TABLE public.wallets TO service_role;

-- 3. match_events: Gameplay event logging, replay retrieval, and dispute audit trails.
GRANT ALL ON TABLE public.match_events TO service_role;

-- 4. match_payouts: Payout ledger reads for match summary resolution and reward verification.
GRANT ALL ON TABLE public.match_payouts TO service_role;

-- 5. match_queue: Matchmaking queue monitoring, cleanup, and worker operations.
GRANT ALL ON TABLE public.match_queue TO service_role;

-- 6. match_result_submissions: Authoritative match result audit receipts and reconciliation.
GRANT ALL ON TABLE public.match_result_submissions TO service_role;
