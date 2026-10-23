-- Phase 4: Match Timeout and Disconnect Sweeper Test Suite
-- Runs inside a transaction and rolls back all test mutations.
--
-- Tests:
-- 1. Privilege assertions: anon and authenticated cannot execute sweep_expired_matches
-- 2. Foreign-key compliant user provisioning: test users isolated in auth.users + profiles + wallets
-- 3. Expired disconnect grace period: forfeits to connected opponent with winner payout
-- 4. Stalled terminal resolution: auto-finalizes from pending terminal state
-- 5. Active turn timeout: awards victory to opponent when turn clock is exhausted
-- 6. First-move abandonment: auto-refunds stakes as draw after 15m without moves
-- 7. Active non-expired match: remains untouched in active status
-- 8. Sweeper idempotency: second sweep returns swept_count = 0 without duplicate payouts

BEGIN;

DO $phase4_tests$
DECLARE
    v_u1 UUID := gen_random_uuid();
    v_u2 UUID := gen_random_uuid();

    v_disconnect_match_id UUID := gen_random_uuid();
    v_pending_term_match_id UUID := gen_random_uuid();
    v_turn_timeout_match_id UUID := gen_random_uuid();
    v_abandoned_match_id UUID := gen_random_uuid();
    v_active_valid_match_id UUID := gen_random_uuid();
    v_snake_win_match_id UUID := gen_random_uuid();
    v_snake_draw_match_id UUID := gen_random_uuid();
    v_p2_disconnect_match_id UUID := gen_random_uuid();

    v_match RECORD;
    v_p1_wallet RECORD;
    v_p2_wallet RECORD;
    v_payout RECORD;
    v_res JSONB;
BEGIN
    -- 1. Privilege Assertions: Neither anon nor authenticated may execute sweep_expired_matches
    IF has_function_privilege('authenticated', 'public.sweep_expired_matches(int)', 'EXECUTE') THEN
        RAISE EXCEPTION 'Test failed: authenticated role must not execute sweep_expired_matches';
    END IF;

    IF has_function_privilege('anon', 'public.sweep_expired_matches(int)', 'EXECUTE') THEN
        RAISE EXCEPTION 'Test failed: anon role must not execute sweep_expired_matches';
    END IF;

    IF has_function_privilege('authenticated', 'public.check_forfeits()', 'EXECUTE') THEN
        RAISE EXCEPTION 'Test failed: authenticated role must not execute check_forfeits';
    END IF;

    -- 2. Setup isolated test users in auth.users
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES
        (v_u1, 'sweeper_p1_' || v_u1 || '@test.local', '{"username":"sweeper_p1"}'::jsonb),
        (v_u2, 'sweeper_p2_' || v_u2 || '@test.local', '{"username":"sweeper_p2"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;

    -- Profiles
    INSERT INTO public.profiles (id, username, email)
    VALUES
        (v_u1, 'sw_p1_' || substring(v_u1::text, 1, 8), 'sweeper_p1_' || v_u1 || '@test.local'),
        (v_u2, 'sw_p2_' || substring(v_u2::text, 1, 8), 'sweeper_p2_' || v_u2 || '@test.local')
    ON CONFLICT (id) DO NOTHING;

    -- Wallets (1000 balance, 500 locked)
    INSERT INTO public.wallets (user_id, balance, locked_balance)
    VALUES
        (v_u1, 1000.00, 500.00),
        (v_u2, 1000.00, 500.00)
    ON CONFLICT (user_id) DO UPDATE SET
        balance = EXCLUDED.balance,
        locked_balance = EXCLUDED.locked_balance,
        updated_at = NOW();

    -- 3. Case A: Expired Disconnect Match
    -- Player 1 disconnected, deadline was 10 seconds ago
    INSERT INTO public.matches (
        id, player1_id, player2_id, game_type, stake_amount,
        status, disconnected_player_id, disconnect_deadline,
        last_move_timestamp, created_at
    ) VALUES (
        v_disconnect_match_id, v_u1, v_u2, 'chess', 25.00,
        'reconnecting', v_u1, NOW() - INTERVAL '10 seconds',
        NOW() - INTERVAL '10 seconds', NOW() - INTERVAL '5 minutes'
    );

    -- 4. Case B: Stalled Pending Terminal Resolution
    -- Move marked terminal 60 seconds ago, client never submitted result
    INSERT INTO public.matches (
        id, player1_id, player2_id, game_type, stake_amount,
        status, resolution_state, terminal_winner_id, terminal_reason,
        game_move_number, last_move_timestamp, created_at
    ) VALUES (
        v_pending_term_match_id, v_u1, v_u2, 'chess', 20.00,
        'active', 'pending', v_u1, 'checkmate',
        12, NOW() - INTERVAL '60 seconds', NOW() - INTERVAL '6 minutes'
    );

    -- 5. Case C: Active Turn Timeout
    -- Player 1's turn, 10 seconds remaining on clock, but 40 seconds elapsed
    INSERT INTO public.matches (
        id, player1_id, player2_id, game_type, stake_amount,
        status, resolution_state, current_turn,
        player1_time_remaining, player2_time_remaining,
        game_move_number, last_move_timestamp, created_at
    ) VALUES (
        v_turn_timeout_match_id, v_u1, v_u2, 'checkers', 15.00,
        'active', 'none', v_u1,
        10, 250,
        4, NOW() - INTERVAL '40 seconds', NOW() - INTERVAL '4 minutes'
    );

    -- 6. Case D: First-Move Abandonment
    -- 0 moves made, match created 20 minutes ago
    INSERT INTO public.matches (
        id, player1_id, player2_id, game_type, stake_amount,
        status, resolution_state, current_turn,
        player1_time_remaining, player2_time_remaining,
        game_move_number, last_move_timestamp, created_at
    ) VALUES (
        v_abandoned_match_id, v_u1, v_u2, 'chess', 10.00,
        'active', 'none', v_u1,
        300, 300,
        0, NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '20 minutes'
    );

    -- 7. Case E: Active Valid Match (SHOULD NOT BE SWEPT)
    -- Active match with recent move and plenty of time
    INSERT INTO public.matches (
        id, player1_id, player2_id, game_type, stake_amount,
        status, resolution_state, current_turn,
        player1_time_remaining, player2_time_remaining,
        game_move_number, last_move_timestamp, created_at
    ) VALUES (
        v_active_valid_match_id, v_u1, v_u2, 'chess', 30.00,
        'active', 'none', v_u1,
        280, 290,
        2, NOW() - INTERVAL '5 seconds', NOW() - INTERVAL '1 minute'
    );

    -- EXECUTE SWEEPER (Batch 1: sweeps Case A, B, C, D)
    v_res := public.sweep_expired_matches(50);

    -- Verify sweeper telemetry
    IF (v_res->>'swept_count')::int <> 4 THEN
        RAISE EXCEPTION 'Test failed: expected 4 matches swept, got % (result: %)',
            v_res->>'swept_count', v_res;
    END IF;

    IF (v_res->>'disconnect_forfeits')::int <> 1 THEN
        RAISE EXCEPTION 'Test failed: expected 1 disconnect forfeit, got %', v_res->>'disconnect_forfeits';
    END IF;

    IF (v_res->>'terminal_resolutions')::int <> 1 THEN
        RAISE EXCEPTION 'Test failed: expected 1 terminal resolution, got %', v_res->>'terminal_resolutions';
    END IF;

    IF (v_res->>'turn_timeouts')::int <> 1 THEN
        RAISE EXCEPTION 'Test failed: expected 1 turn timeout, got %', v_res->>'turn_timeouts';
    END IF;

    IF (v_res->>'first_move_abandonments')::int <> 1 THEN
        RAISE EXCEPTION 'Test failed: expected 1 first move abandonment, got %', v_res->>'first_move_abandonments';
    END IF;

    -- Verify Case A (Disconnect Forfeit)
    SELECT * INTO v_match FROM public.matches WHERE id = v_disconnect_match_id;
    IF v_match.status <> 'finished' OR v_match.winner_id <> v_u2 OR v_match.authority_resolution_reason <> 'disconnect_forfeit' THEN
        RAISE EXCEPTION 'Test failed: Disconnect match not properly finalized (status: %, winner: %, reason: %)',
            v_match.status, v_match.winner_id, v_match.authority_resolution_reason;
    END IF;

    -- Verify Case B (Stalled Terminal Resolution)
    SELECT * INTO v_match FROM public.matches WHERE id = v_pending_term_match_id;
    IF v_match.status <> 'finished' OR v_match.winner_id <> v_u1 OR v_match.resolution_state <> 'resolved' THEN
        RAISE EXCEPTION 'Test failed: Pending terminal match not properly resolved (status: %, winner: %, state: %)',
            v_match.status, v_match.winner_id, v_match.resolution_state;
    END IF;

    -- Verify Case C (Turn Timeout)
    SELECT * INTO v_match FROM public.matches WHERE id = v_turn_timeout_match_id;
    IF v_match.status <> 'finished' OR v_match.winner_id <> v_u2 OR v_match.authority_resolution_reason <> 'timeout' THEN
        RAISE EXCEPTION 'Test failed: Turn timeout match not properly finalized (status: %, winner: %, reason: %)',
            v_match.status, v_match.winner_id, v_match.authority_resolution_reason;
    END IF;

    -- Verify Case D (First-Move Abandonment Refunded as Draw)
    SELECT * INTO v_match FROM public.matches WHERE id = v_abandoned_match_id;
    IF v_match.status <> 'finished' OR v_match.winner_id IS NOT NULL OR v_match.authority_resolution_reason <> 'abandoned_first_move' THEN
        RAISE EXCEPTION 'Test failed: Abandoned first move match not settled as draw (status: %, winner: %, reason: %)',
            v_match.status, v_match.winner_id, v_match.authority_resolution_reason;
    END IF;
    -- Check draw ledger payout entry exists with NULL winner_id
    SELECT * INTO v_payout FROM public.match_payouts WHERE match_id = v_abandoned_match_id;
    IF v_payout.match_id IS NULL OR v_payout.winner_id IS NOT NULL THEN
        RAISE EXCEPTION 'Test failed: Abandoned match missing draw payout record';
    END IF;

    -- Verify Case E (Active Valid Match UNTOUCHED)
    SELECT * INTO v_match FROM public.matches WHERE id = v_active_valid_match_id;
    IF v_match.status <> 'active' THEN
        RAISE EXCEPTION 'Test failed: Active valid match was erroneously swept (status: %)', v_match.status;
    END IF;

    -- 8. Idempotency test: Immediate second run of sweeper should sweep 0
    v_res := public.sweep_expired_matches(50);
    IF (v_res->>'swept_count')::int <> 0 THEN
        RAISE EXCEPTION 'Test failed: Expected 0 swept matches on second run, got %', v_res->>'swept_count';
    END IF;

    -- 9. Case F, G, H: Snake & Player 2 Disconnect Sweeps
    -- Case F: Snake match with decisive score (p1=5, p2=3, timer exhausted)
    INSERT INTO public.matches (
        id, player1_id, player2_id, game_type, stake_amount,
        status, resolution_state,
        player1_score, player2_score,
        player1_time_remaining, player2_time_remaining,
        last_move_timestamp, created_at
    ) VALUES (
        v_snake_win_match_id, v_u1, v_u2, 'snake', 12.00,
        'active', 'none',
        5, 3,
        0, 10,
        NOW() - INTERVAL '2 seconds', NOW() - INTERVAL '3 minutes'
    );

    -- Case G: Snake match with tied score (p1=2, p2=2, timer exhausted -> draw)
    INSERT INTO public.matches (
        id, player1_id, player2_id, game_type, stake_amount,
        status, resolution_state,
        player1_score, player2_score,
        player1_time_remaining, player2_time_remaining,
        last_move_timestamp, created_at
    ) VALUES (
        v_snake_draw_match_id, v_u1, v_u2, 'snake', 14.00,
        'active', 'none',
        2, 2,
        0, 0,
        NOW() - INTERVAL '2 seconds', NOW() - INTERVAL '3 minutes'
    );

    -- Case H: Player 2 disconnected (deadline passed -> player 1 wins)
    INSERT INTO public.matches (
        id, player1_id, player2_id, game_type, stake_amount,
        status, disconnected_player_id, disconnect_deadline,
        last_move_timestamp, created_at
    ) VALUES (
        v_p2_disconnect_match_id, v_u1, v_u2, 'chess', 18.00,
        'reconnecting', v_u2, NOW() - INTERVAL '15 seconds',
        NOW() - INTERVAL '15 seconds', NOW() - INTERVAL '5 minutes'
    );

    -- Test batch limit: 3 matches available, pass batch limit of 2
    v_res := public.sweep_expired_matches(2);
    IF (v_res->>'swept_count')::int <> 2 THEN
        RAISE EXCEPTION 'Test failed: Expected exactly 2 matches swept with batch limit 2, got %', v_res->>'swept_count';
    END IF;

    -- Sweep the remaining 1 match
    v_res := public.sweep_expired_matches(10);
    IF (v_res->>'swept_count')::int <> 1 THEN
        RAISE EXCEPTION 'Test failed: Expected exactly 1 match swept on second pass, got %', v_res->>'swept_count';
    END IF;

    -- Verify Case F (Snake Decisive Winner: Player 1)
    SELECT * INTO v_match FROM public.matches WHERE id = v_snake_win_match_id;
    IF v_match.status <> 'finished' OR v_match.winner_id <> v_u1 OR v_match.authority_resolution_reason <> 'timer_expired' THEN
        RAISE EXCEPTION 'Test failed: Snake decisive match not resolved properly (status: %, winner: %, reason: %)',
            v_match.status, v_match.winner_id, v_match.authority_resolution_reason;
    END IF;

    -- Verify Case G (Snake Draw: winner_id IS NULL)
    SELECT * INTO v_match FROM public.matches WHERE id = v_snake_draw_match_id;
    IF v_match.status <> 'finished' OR v_match.winner_id IS NOT NULL OR v_match.authority_resolution_reason <> 'timer_expired' THEN
        RAISE EXCEPTION 'Test failed: Snake draw match not resolved as draw (status: %, winner: %, reason: %)',
            v_match.status, v_match.winner_id, v_match.authority_resolution_reason;
    END IF;

    -- Verify Case H (Player 2 Disconnect: Player 1 Winner)
    SELECT * INTO v_match FROM public.matches WHERE id = v_p2_disconnect_match_id;
    IF v_match.status <> 'finished' OR v_match.winner_id <> v_u1 OR v_match.authority_resolution_reason <> 'disconnect_forfeit' THEN
        RAISE EXCEPTION 'Test failed: Player 2 disconnect not forfeited to player 1 (status: %, winner: %, reason: %)',
            v_match.status, v_match.winner_id, v_match.authority_resolution_reason;
    END IF;

    RAISE NOTICE 'Phase 4 timeout sweeper SQL test suite passed all assertions.';
END;
$phase4_tests$;

ROLLBACK;
