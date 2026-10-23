-- Migration: 20260826_phase1_security_remediation.sql
-- Description: Phase 1 Security Remediation (SEC-01 through SEC-06)
--   1. SEC-01: Revoke public/anon/authenticated execution of lock_stake and unlock_stake; restrict to trusted roles and assert actor identity.
--   2. SEC-02: Prevent client-supplied wallet balances via column privileges, BEFORE INSERT trigger, and tightened RLS WITH CHECK policy.
--   3. SEC-04 & SEC-05: Harden release_winnings with deterministic wallet lock ordering, participant checks, and strict escrow verification (zero clamping).
--   4. SEC-03: Safely disable in-place match resurrection in trigger_rematch to protect ledger idempotency and immutable match accounting.
--   5. SEC-06: Restrict client match_events INSERT policy to safe, whitelisted event types.

BEGIN;

-- ============================================================================
-- 1. SEC-01: Revoke Public Execution on Stake Management Functions
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.lock_stake(UUID, NUMERIC) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.unlock_stake(UUID, NUMERIC) FROM PUBLIC;

DO $revoke_stake_anon_auth$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.lock_stake(UUID, NUMERIC) FROM anon';
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.unlock_stake(UUID, NUMERIC) FROM anon';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.lock_stake(UUID, NUMERIC) FROM authenticated';
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.unlock_stake(UUID, NUMERIC) FROM authenticated';
    END IF;
END;
$revoke_stake_anon_auth$;

DO $grant_stake_service_role$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.lock_stake(UUID, NUMERIC) TO service_role';
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.unlock_stake(UUID, NUMERIC) TO service_role';
    END IF;
END;
$grant_stake_service_role$;

CREATE OR REPLACE FUNCTION public.lock_stake(
    p_user_id UUID,
    p_amount NUMERIC
) RETURNS BOOLEAN AS $lock_stake_tag$
DECLARE
    v_balance NUMERIC;
BEGIN
    IF p_amount <= 0 THEN
        RETURN FALSE;
    END IF;

    -- Enforce actor identity when invoked inside an authenticated user session
    IF auth.role() IS NOT NULL AND auth.role() NOT IN ('service_role', 'postgres') THEN
        IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
            RAISE EXCEPTION 'Unauthorized stake locking attempt for user %', p_user_id;
        END IF;
    END IF;

    SELECT balance INTO v_balance FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;

    IF v_balance IS NOT NULL AND v_balance >= p_amount THEN
        UPDATE public.wallets
        SET
            balance = balance - p_amount,
            locked_balance = locked_balance + p_amount,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$lock_stake_tag$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.unlock_stake(
    p_user_id UUID,
    p_amount NUMERIC
) RETURNS BOOLEAN AS $unlock_stake_tag$
DECLARE
    v_locked_balance NUMERIC;
BEGIN
    IF p_amount <= 0 THEN
        RETURN FALSE;
    END IF;

    -- Enforce actor identity when invoked inside an authenticated user session
    IF auth.role() IS NOT NULL AND auth.role() NOT IN ('service_role', 'postgres') THEN
        IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
            RAISE EXCEPTION 'Unauthorized stake unlocking attempt for user %', p_user_id;
        END IF;
    END IF;

    SELECT locked_balance INTO v_locked_balance FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;

    IF v_locked_balance IS NOT NULL AND v_locked_balance >= p_amount THEN
        UPDATE public.wallets
        SET
            balance = balance + p_amount,
            locked_balance = locked_balance - p_amount,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$unlock_stake_tag$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ============================================================================
-- 2. SEC-02: Trusted Wallet Provisioning & Balance Injection Prevention
-- ============================================================================

-- Layer 1: Restrict direct authenticated INSERT to user_id column only
DO $wallet_grants$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE 'REVOKE INSERT ON TABLE public.wallets FROM authenticated';
        EXECUTE 'GRANT INSERT (user_id) ON TABLE public.wallets TO authenticated';
    END IF;
END;
$wallet_grants$;

-- Layer 2: Trigger enforcing default values for non-service roles
CREATE OR REPLACE FUNCTION public.enforce_wallet_defaults_on_insert()
RETURNS TRIGGER AS $wallet_defaults_tag$
BEGIN
    IF auth.role() IS NOT NULL AND auth.role() NOT IN ('service_role', 'postgres') THEN
        NEW.balance := 1000.00;
        NEW.locked_balance := 0.00;
        NEW.updated_at := NOW();
    END IF;
    RETURN NEW;
END;
$wallet_defaults_tag$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_enforce_wallet_defaults_on_insert ON public.wallets;
CREATE TRIGGER trg_enforce_wallet_defaults_on_insert
    BEFORE INSERT ON public.wallets
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_wallet_defaults_on_insert();

-- Layer 3: Tighten RLS INSERT policy
DROP POLICY IF EXISTS "Users can insert their own wallet" ON public.wallets;
CREATE POLICY "Users can insert their own wallet" ON public.wallets
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND balance = 1000.00
        AND (locked_balance = 0.00 OR locked_balance IS NULL)
    );

-- Validate existing non-negative check constraints if unvalidated
DO $validate_wallet_constraints$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'wallets_balance_nonnegative'
          AND conrelid = 'public.wallets'::regclass
          AND NOT convalidated
    ) THEN
        ALTER TABLE public.wallets VALIDATE CONSTRAINT wallets_balance_nonnegative;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'wallets_locked_balance_nonnegative'
          AND conrelid = 'public.wallets'::regclass
          AND NOT convalidated
    ) THEN
        ALTER TABLE public.wallets VALIDATE CONSTRAINT wallets_locked_balance_nonnegative;
    END IF;
END;
$validate_wallet_constraints$;

-- ============================================================================
-- 3. SEC-04 & SEC-05: Strict Escrow Validation & Deterministic Row Locking
-- ============================================================================

CREATE OR REPLACE FUNCTION public.release_winnings(
    p_match_id UUID,
    p_winner_id UUID
) RETURNS VOID AS $release_tag$
DECLARE
    v_match RECORD;
    v_total_stake NUMERIC;
    v_fee NUMERIC;
    v_winner_prize NUMERIC;
    v_inserted_match_id UUID;
    v_p1_wallet RECORD;
    v_p2_wallet RECORD;
BEGIN
    SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;

    IF v_match.id IS NULL THEN
        RAISE EXCEPTION 'Match not found';
    END IF;

    IF v_match.status <> 'finished' OR v_match.winner_id IS NULL THEN
        RETURN;
    END IF;

    -- Verify participants exist and winner is legitimate participant
    IF v_match.player1_id IS NULL OR v_match.player2_id IS NULL THEN
        RAISE EXCEPTION 'Match participants missing';
    END IF;

    IF v_match.winner_id <> v_match.player1_id AND v_match.winner_id <> v_match.player2_id THEN
        RAISE EXCEPTION 'Winner is not a match participant';
    END IF;

    IF p_winner_id IS DISTINCT FROM v_match.winner_id THEN
        RAISE EXCEPTION 'Winner mismatch';
    END IF;

    v_total_stake := v_match.stake_amount * 2;
    v_fee := v_total_stake * 0.10;
    v_winner_prize := v_total_stake - v_fee;

    -- 1. Idempotent payout ledger insertion: ON CONFLICT DO NOTHING
    INSERT INTO public.match_payouts (
        match_id,
        winner_id,
        stake_amount,
        total_pot,
        fee_amount,
        payout_amount,
        triggered_by
    )
    VALUES (
        p_match_id,
        v_match.winner_id,
        v_match.stake_amount,
        v_total_stake,
        v_fee,
        v_winner_prize,
        p_winner_id
    )
    ON CONFLICT (match_id) DO NOTHING
    RETURNING match_id INTO v_inserted_match_id;

    -- If already settled in match_payouts, exit cleanly without double-crediting
    IF v_inserted_match_id IS NULL THEN
        RETURN;
    END IF;

    -- Free matches do not mutate wallet balances
    IF v_match.stake_amount <= 0 THEN
        RETURN;
    END IF;

    -- 2. Lock wallets in deterministic order by user_id to prevent deadlocks
    IF v_match.player1_id < v_match.player2_id THEN
        SELECT * INTO v_p1_wallet FROM public.wallets WHERE user_id = v_match.player1_id FOR UPDATE;
        SELECT * INTO v_p2_wallet FROM public.wallets WHERE user_id = v_match.player2_id FOR UPDATE;
    ELSE
        SELECT * INTO v_p2_wallet FROM public.wallets WHERE user_id = v_match.player2_id FOR UPDATE;
        SELECT * INTO v_p1_wallet FROM public.wallets WHERE user_id = v_match.player1_id FOR UPDATE;
    END IF;

    IF v_p1_wallet.user_id IS NULL THEN
        RAISE EXCEPTION 'Player 1 wallet not found for user: %', v_match.player1_id;
    END IF;
    IF v_p2_wallet.user_id IS NULL THEN
        RAISE EXCEPTION 'Player 2 wallet not found for user: %', v_match.player2_id;
    END IF;

    -- 3. Strict escrow validation: REJECT insufficient locked balance without clamping
    IF v_p1_wallet.locked_balance < v_match.stake_amount THEN
        RAISE EXCEPTION 'Player 1 locked balance insufficient for payout release (user: %, locked: %, required: %)',
            v_match.player1_id, v_p1_wallet.locked_balance, v_match.stake_amount;
    END IF;

    IF v_p2_wallet.locked_balance < v_match.stake_amount THEN
        RAISE EXCEPTION 'Player 2 locked balance insufficient for payout release (user: %, locked: %, required: %)',
            v_match.player2_id, v_p2_wallet.locked_balance, v_match.stake_amount;
    END IF;

    -- 4. Deduct locked stakes strictly (exact subtraction)
    UPDATE public.wallets
    SET
        locked_balance = locked_balance - v_match.stake_amount,
        updated_at = NOW()
    WHERE user_id = v_match.player1_id;

    UPDATE public.wallets
    SET
        locked_balance = locked_balance - v_match.stake_amount,
        updated_at = NOW()
    WHERE user_id = v_match.player2_id;

    -- 5. Credit winner prize to spendable balance
    UPDATE public.wallets
    SET
        balance = balance + v_winner_prize,
        updated_at = NOW()
    WHERE user_id = v_match.winner_id;
END;
$release_tag$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.release_winnings(UUID, UUID) FROM PUBLIC;
DO $revoke_release_anon_auth$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.release_winnings(UUID, UUID) FROM anon';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.release_winnings(UUID, UUID) FROM authenticated';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.release_winnings(UUID, UUID) TO service_role';
    END IF;
END;
$revoke_release_anon_auth$;

-- ============================================================================
-- 4. SEC-03: Safely Disable In-Place Rematches
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_rematch(
    p_match_id UUID
) RETURNS JSONB AS $trigger_rematch_tag$
BEGIN
    RETURN jsonb_build_object(
        'status', 'error',
        'code', 'REMATCH_DISABLED',
        'error', 'In-place match rematches are disabled to preserve financial auditability and ledger idempotency. Please start a new matchmaking queue.'
    );
END;
$trigger_rematch_tag$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ============================================================================
-- 5. SEC-06: Restrict Client Event Types on match_events
-- ============================================================================

DROP POLICY IF EXISTS "Players can insert events for their matches" ON public.match_events;
CREATE POLICY "Players can insert events for their matches" ON public.match_events
    FOR INSERT WITH CHECK (
        player_id = auth.uid()
        AND event_type IN (
            'ready',
            'chat_message',
            'rematch_request',
            'rematch_accepted',
            'rematch_declined',
            'player_ping'
        )
        AND EXISTS (
            SELECT 1 FROM public.matches
            WHERE matches.id = match_events.match_id
              AND (matches.player1_id = auth.uid() OR matches.player2_id = auth.uid())
        )
    );

COMMIT;
