-- Phase 5: Authoritative Draw Settlement and Payout Finalization
-- Migration: 20260824_phase5_draw_settlement.sql
--
-- Fixes Phase 5 defect where draw matches never released locked player stakes.
-- Modifies match_payouts to allow NULL winner_id for draws and introduces
-- atomic, idempotent draw settlement with strict locked-balance validation.

-- 1. Schema update: Allow winner_id to be NULL in match_payouts for draws
ALTER TABLE public.match_payouts ALTER COLUMN winner_id DROP NOT NULL;

-- 2. Authoritative draw settlement function
CREATE OR REPLACE FUNCTION public.settle_match_draw(
    p_match_id UUID
) RETURNS JSONB AS $settle_draw_tag$
DECLARE
    v_match RECORD;
    v_p1_wallet RECORD;
    v_p2_wallet RECORD;
    v_stake NUMERIC;
    v_inserted_match_id UUID;
BEGIN
    -- Lock match row to serialize settlement
    SELECT * INTO v_match
    FROM public.matches
    WHERE id = p_match_id
    FOR UPDATE;

    IF v_match.id IS NULL THEN
        RAISE EXCEPTION 'Match not found: %', p_match_id;
    END IF;

    -- Ensure match is legitimately finished and is a draw
    IF v_match.status <> 'finished' THEN
        RAISE EXCEPTION 'Match is not in finished state (status: %)', v_match.status;
    END IF;

    IF v_match.winner_id IS NOT NULL THEN
        RAISE EXCEPTION 'Match has a decisive winner (%), not a draw', v_match.winner_id;
    END IF;

    IF v_match.player1_id IS NULL OR v_match.player2_id IS NULL THEN
        RAISE EXCEPTION 'Match missing participant IDs';
    END IF;

    v_stake := COALESCE(v_match.stake_amount, 0);
    IF v_stake < 0 THEN
        RAISE EXCEPTION 'Negative stake amount is invalid: %', v_stake;
    END IF;

    -- Idempotency check: insert ledger record for the draw
    -- match_id is PRIMARY KEY on match_payouts
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
        NULL,
        v_stake,
        v_stake * 2,
        0.00,
        v_stake * 2,
        NULL
    )
    ON CONFLICT (match_id) DO NOTHING
    RETURNING match_id INTO v_inserted_match_id;

    -- If row already existed, this match has already been settled. Exit idempotently.
    IF v_inserted_match_id IS NULL THEN
        RETURN jsonb_build_object(
            'status', 'already_settled',
            'match_id', p_match_id
        );
    END IF;

    -- If paid match (stake > 0), refund wallets atomically
    IF v_stake > 0 THEN
        -- Lock wallets in deterministic order by user_id to prevent deadlocks
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

        -- Strictly validate locked balances: DO NOT use GREATEST clamping to hide discrepancies
        IF v_p1_wallet.locked_balance < v_stake THEN
            RAISE EXCEPTION 'Player 1 locked balance insufficient for refund (user: %, locked: %, required: %)',
                v_match.player1_id, v_p1_wallet.locked_balance, v_stake;
        END IF;

        IF v_p2_wallet.locked_balance < v_stake THEN
            RAISE EXCEPTION 'Player 2 locked balance insufficient for refund (user: %, locked: %, required: %)',
                v_match.player2_id, v_p2_wallet.locked_balance, v_stake;
        END IF;

        -- Refund Player 1: unlock stake and restore spendable balance
        UPDATE public.wallets
        SET
            balance = balance + v_stake,
            locked_balance = locked_balance - v_stake,
            updated_at = NOW()
        WHERE user_id = v_match.player1_id;

        -- Refund Player 2: unlock stake and restore spendable balance
        UPDATE public.wallets
        SET
            balance = balance + v_stake,
            locked_balance = locked_balance - v_stake,
            updated_at = NOW()
        WHERE user_id = v_match.player2_id;
    END IF;

    -- Write audit event into match_events
    INSERT INTO public.match_events (match_id, player_id, event_type, payload)
    VALUES (
        p_match_id,
        v_match.player1_id,
        'draw_settlement',
        jsonb_build_object(
            'match_id', p_match_id,
            'stake_amount', v_stake,
            'refunded_amount', v_stake,
            'player1_id', v_match.player1_id,
            'player2_id', v_match.player2_id,
            'settled_at', NOW()
        )
    );

    RETURN jsonb_build_object(
        'status', 'draw_settled',
        'match_id', p_match_id,
        'refund_amount_per_player', v_stake
    );
END;
$settle_draw_tag$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Enhance finalize_match_outcome to route draws to settle_match_draw
CREATE OR REPLACE FUNCTION public.finalize_match_outcome(
    p_match_id UUID,
    p_winner_id UUID,
    p_resolution_reason TEXT,
    p_resolution_payload JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $finalize_tag$
DECLARE
    v_match RECORD;
BEGIN
    SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;
    IF v_match.id IS NULL THEN RETURN jsonb_build_object('error', 'Match not found'); END IF;
    IF v_match.status = 'finished' THEN
        RETURN jsonb_build_object('status', 'already_finished', 'winner_id', v_match.winner_id, 'reason', v_match.authority_resolution_reason);
    END IF;
    IF v_match.status <> 'active' AND v_match.status <> 'reconnecting' THEN RETURN jsonb_build_object('error', 'Match is not resolvable'); END IF;
    IF p_winner_id IS NOT NULL AND p_winner_id <> v_match.player1_id AND p_winner_id <> v_match.player2_id THEN
        RETURN jsonb_build_object('error', 'Winner must be a participant');
    END IF;
    IF v_match.resolution_state = 'pending'
       AND (p_resolution_reason IS DISTINCT FROM v_match.terminal_reason
            OR p_winner_id IS DISTINCT FROM v_match.terminal_winner_id) THEN
        RETURN jsonb_build_object('error', 'Pending terminal result has precedence');
    END IF;

    UPDATE public.matches
    SET
        status = 'finished',
        winner_id = p_winner_id,
        resolution_state = 'resolved',
        disconnected_player_id = NULL,
        disconnect_deadline = NULL,
        authority_resolution_reason = p_resolution_reason,
        authority_resolution_payload = COALESCE(p_resolution_payload, '{}'::jsonb),
        authority_resolved_at = NOW(),
        last_move_timestamp = NOW()
    WHERE id = p_match_id;

    -- Route decisive win vs draw settlement
    IF p_winner_id IS NOT NULL THEN
        PERFORM public.release_winnings(p_match_id, p_winner_id);
    ELSE
        PERFORM public.settle_match_draw(p_match_id);
    END IF;

    INSERT INTO public.match_events (match_id, player_id, event_type, payload)
    VALUES (
        p_match_id,
        COALESCE(p_winner_id, v_match.player1_id),
        'authoritative_result',
        jsonb_build_object(
            'winner_id', p_winner_id,
            'reason', p_resolution_reason,
            'resolved_at', NOW(),
            'resolution_payload', COALESCE(p_resolution_payload, '{}'::jsonb)
        )
    );

    RETURN jsonb_build_object(
        'status', 'resolved',
        'winner_id', p_winner_id,
        'reason', p_resolution_reason
    );
END;
$finalize_tag$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Set security paths and privileges
REVOKE EXECUTE ON FUNCTION public.settle_match_draw(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.finalize_match_outcome(UUID, UUID, TEXT, JSONB) FROM PUBLIC, anon, authenticated;

DO $grant_settle_draw_service_role$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.settle_match_draw(UUID) TO service_role';
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.finalize_match_outcome(UUID, UUID, TEXT, JSONB) TO service_role';
    END IF;
END;
$grant_settle_draw_service_role$;

ALTER FUNCTION public.settle_match_draw(UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.finalize_match_outcome(UUID, UUID, TEXT, JSONB) SET search_path = public, pg_temp;

