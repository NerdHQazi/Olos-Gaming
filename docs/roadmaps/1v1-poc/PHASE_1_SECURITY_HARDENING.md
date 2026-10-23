# Phase 1: Security Hardening

## Purpose

Protect authority boundaries and prevent obvious abuse paths before building authoritative gameplay.

## Why It Exists

Server authority cannot be trusted if core access controls and privilege boundaries are weak. Phase 1 establishes minimum safety guarantees so later authority work is meaningful.

## Relation to Director Demo

Supports all demo pillars indirectly by ensuring the POC cannot be trivially bypassed through privilege misuse, unauthorized calls, or duplicate-settlement abuse.

## Requirements

- Harden function authority boundaries for user-facing and internal settlement paths.
- Ensure sensitive settlement actions are internal-only by privilege design.
- Enforce authenticated actor checks on user-entry RPC paths.
- Add payout idempotency safeguards.
- Tighten high-risk RLS/policy gaps that enable spoofed game events or unauthorized writes.

## Audit Findings: Security & Authority Architecture

### 1. Function Privilege Boundaries & RPC Exposure
- **`public.lock_stake(UUID, NUMERIC)` & `public.unlock_stake(UUID, NUMERIC)` [CRITICAL]:**
  - Defined with `SECURITY DEFINER` and search path `public, pg_temp` (pinned in `20260811`), but **`REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated` was never executed**.
  - Neither function validates caller identity (`auth.uid() = p_user_id` or `auth.role() = 'service_role'`).
  - **Live Verification Probe:** Direct PostgREST RPC call with the anonymous API key executed successfully (`status: 200, error: undefined`), confirming that any unauthenticated web visitor can invoke `unlock_stake` or `lock_stake` arbitrarily for any user UUID.
- **`public.release_winnings(UUID, UUID)` [SECURE]:**
  - Defined with `SECURITY DEFINER`. Direct execution is explicitly revoked from `PUBLIC`, `anon`, and `authenticated`.
  - **Live Verification Probe:** PostgREST RPC call with anon key rejected with PostgreSQL error `42501` (permission denied).
- **`public.apply_validated_game_move` & `public.finalize_match_outcome` [SECURE]:**
  - Direct client execution is properly revoked in `20260814`. Executable only via server-side service role. Both returned `42501` on anon probes.

### 2. Wallet Invariant & Mutation Lifecycle
- **Unrestricted Direct `INSERT` on `public.wallets` [CRITICAL]:**
  - In `20260804_fix_auth_table_grants.sql`, table grant `GRANT SELECT, INSERT ON TABLE public.wallets TO authenticated;` was added.
  - The RLS policy `Users can insert their own wallet` (`20260224_initial_schema.sql`) uses `WITH CHECK (auth.uid() = user_id)` without column-level restrictions or checks on initial balances.
  - An authenticated user without an initial wallet (or if the trigger fails) can issue a REST `POST /rest/v1/wallets` inserting arbitrary balances (e.g., `balance: 999999999.00`).
- **Deficit Masking via `GREATEST(..., 0)` in `release_winnings` [HIGH]:**
  - `release_winnings` sets `locked_balance = GREATEST(locked_balance - v_match.stake_amount, 0)`.
  - If a player's locked stake was drained (e.g., via the public `unlock_stake` exploit), the deficit is silently masked and the winner is still credited unbacked tokens, violating system balance invariants.
- **Deadlock Vulnerability in `release_winnings` [HIGH]:**
  - Updates `wallets` sequentially by `player1_id` then `player2_id`.
  - Concurrent finalization of reciprocal matches between the same two users will deadlock in PostgreSQL. (Note: `settle_match_draw` was hardened in Phase 5 to sort by `LEAST/GREATEST(user_id)`, but `release_winnings` remains unhardened).
- **Unbacked Resurrected Matches via `public.trigger_rematch` [HIGH]:**
  - Resets a finished match (`status = 'active'`, `winner_id = NULL`, scores reset) but **does not deduct or lock any stake** from either player.
  - When the rematch completes, `release_winnings` hits `ON CONFLICT (match_id) DO NOTHING` on `match_payouts` and exits without paying the winner. If payout logic were modified, it would payout unbacked winnings.

### 3. Matchmaking Queue Isolation & Concurrency
- **Bucket-Level Advisory Locking (`find_opponent`):**
  - Serializes matchmaking by `pg_advisory_xact_lock(hashtext('find_opponent:' || p_game_type || ':' || p_stake_amount::TEXT))` and user-level advisory lock `hashtext('mm_user'), hashtext(v_user_id)`.
  - Opponents are selected using `FOR UPDATE SKIP LOCKED`.
- **Queue Stake Locking & Refund Integrity (`cancel_matchmaking`):**
  - Uses `DELETE FROM public.match_queue WHERE user_id = ... RETURNING stake_amount` inside an advisory lock to atomically remove queue entries before unlocking stakes, preventing double-match race conditions.

### 4. Migration Tracking & Reproducibility
- Local untracked files (`20260814` through `20260825`) are deployed and active in the Supabase PostgreSQL database.
- Repository hygiene requires tracking all active migrations to guarantee fresh environment reproducibility.

---

## Defect Severity Matrix

| Defect ID | Severity | Area | Description | Impact | Remediation Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **CRITICAL** | RPC Authority | `public.unlock_stake` and `public.lock_stake` have public execution granted and no caller authorization checks. | Direct fund draining / unauthorized stake unlocking over public REST/RPC. | Confirmed defect; remediation SQL planned. |
| **SEC-02** | **CRITICAL** | RLS / Grants | Direct `INSERT` on `public.wallets` granted to `authenticated` with arbitrary balance payload. | Arbitrary balance creation by client. | Confirmed defect; remediation SQL planned. |
| **SEC-03** | **HIGH** | Wallet Logic | `trigger_rematch` resurrects matches without locking stakes, resulting in blocked payouts and unbacked play. | Rematch payout failure or unbacked token minting. | Confirmed defect; remediation SQL planned. |
| **SEC-04** | **HIGH** | Wallet Ledger | `release_winnings` uses `GREATEST(locked_balance - stake, 0)` instead of strict balance verification. | Deficit masking; unbacked winnings creation. | Confirmed defect; remediation SQL planned. |
| **SEC-05** | **HIGH** | Concurrency | `release_winnings` updates wallets in fixed `player1`/`player2` order instead of sorted UUIDs. | Database deadlocks on concurrent reciprocal match settlements. | Confirmed defect; remediation SQL planned. |
| **SEC-06** | **MEDIUM** | Event Logging | `match_events` RLS INSERT policy does not restrict `event_type`. | Clients can inject spoofed authoritative events. | Confirmed defect; remediation SQL planned. |
| **SEC-07** | **LOW** | Migration Hygiene| 9 active migrations untracked in local git working tree. | Deployment reproducibility risks across fresh environments. | Confirmed defect; tracking plan defined. |

---

## Remediation Plan

### Step 1: Privilege Revocations & Caller Check Hardening (SEC-01, SEC-02)
1. **Revoke Public Execution on Wallet Mutations:**
   ```sql
   REVOKE EXECUTE ON FUNCTION public.lock_stake(UUID, NUMERIC) FROM PUBLIC, anon, authenticated;
   REVOKE EXECUTE ON FUNCTION public.unlock_stake(UUID, NUMERIC) FROM PUBLIC, anon, authenticated;
   ```
2. **Add Caller Identity Check to Internal/Admin RPCs:**
   - Enforce `IF auth.role() <> 'service_role' AND auth.uid() <> p_user_id THEN RAISE EXCEPTION 'Unauthorized'; END IF;` inside `lock_stake` and `unlock_stake`.
3. **Revoke Client Insert on Wallets & Drop Permissive Policy:**
   ```sql
   REVOKE INSERT ON TABLE public.wallets FROM authenticated;
   DROP POLICY IF EXISTS "Users can insert their own wallet" ON public.wallets;
   ```
   - Ensure wallet provisioning is exclusively handled by `public.handle_new_user_provisioning()` database trigger running as `SECURITY DEFINER`.

### Step 2: Wallet Settlement & Concurrency Hardening (SEC-03, SEC-04, SEC-05)
1. **Sort Wallet Locking in `release_winnings`:**
   - Lock wallets in deterministic order using `LEAST(p1, p2)` and `GREATEST(p1, p2)` with `FOR UPDATE` before mutating balances to eliminate deadlocks.
2. **Enforce Strict Locked Balance Invariants:**
   - Verify `locked_balance >= v_match.stake_amount` before deducting; raise an exception if balance is insufficient rather than masking deficits with `GREATEST(..., 0)`.
3. **Hardened Rematch Lifecycle:**
   - In `trigger_rematch`, require both players to lock stakes atomically via `lock_stake` before setting `status = 'active'`.
   - Clear or create a new unique identifier or child match sequence so `match_payouts` records do not collide on `ON CONFLICT (match_id)`.

### Step 3: Event Injection Hardening (SEC-06)
1. Update `public.match_events` RLS policy to restrict client-insertable `event_type` to a safe whitelist (e.g., `'chat_message'`, `'rematch_requested'`, `'rematch_accepted'`), forbidding client insertion of `'validated_move'`, `'authoritative_result'`, or settlement events.

---

## Acceptance Criteria

- Internal settlement function is not effectively executable by anon/authenticated.
- User-facing functions reject actor mismatch and unauthorized requests.
- Duplicate payout attempts do not double-credit balances.
- Security-critical migration chain applies cleanly in order.

## Validation Requirements

- Run full migration-chain validation in clean local PostgreSQL.
- Execute privilege audit for settlement function grants and effective role access.
- Execute payout-path and idempotency tests with before/after balance and ledger checks.
- Document PASS/FAIL outcomes with raw SQL output for critical checks.

## Exit Criteria

- All Phase 1 acceptance criteria pass.
- No open authority-boundary defects remain at this phase level.
- Evidence is sufficient to begin Phase 2 authority work.

## Dependencies

- Baseline schema and RPC surfaces exist.
- Migration ordering is deterministic and reproducible.
- Test harness can execute SQL and function-level validation scenarios.
