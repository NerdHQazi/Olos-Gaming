-- Phase 5: Draw settlement test suite
-- Runs inside a transaction and rolls back all test mutations.
--
-- Tests:
-- 1. Privilege assertions: anon and authenticated cannot execute settle_match_draw or finalize_match_outcome
-- 2. Foreign-key compliant user provisioning: test users isolated in auth.users
-- 3. Successful refund: both wallets receive balance += stake and locked_balance -= stake
-- 4. Authoritative ledger entry: match_payouts row created with winner_id IS NULL
-- 5. Idempotency: second settlement call produces already_settled and no wallet change
-- 6. Invalid state rejection: active match cannot be settled
-- 7. Decisive winner rejection: match with winner cannot be settled as draw
-- 8. Locked balance validation: fails explicitly on insufficient locked_balance (no clamping)
-- 9. Free match draw: stake_amount = 0 handled cleanly

BEGIN;

DO $phase5_tests$
DECLARE
    v_u1 UUID := gen_random_uuid();
    v_u2 UUID := gen_random_uuid();
    v_match_id UUID := gen_random_uuid();
    v_active_match_id UUID := gen_random_uuid();
    v_won_match_id UUID := gen_random_uuid();
    v_free_match_id UUID := gen_random_uuid();
    v_p1_wallet RECORD;
    v_p2_wallet RECORD;
    v_payout RECORD;
    v_res JSONB;
    v_error_caught BOOLEAN := FALSE;
BEGIN
    -- 1. Privilege Assertions: Neither settle_match_draw nor finalize_match_outcome may be called directly by clients
    IF has_function_privilege('authenticated', 'public.settle_match_draw(uuid)', 'EXECUTE') THEN
        RAISE EXCEPTION 'Test failed: authenticated role must not execute settle_match_draw';
    END IF;

    IF has_function_privilege('anon', 'public.settle_match_draw(uuid)', 'EXECUTE') THEN
        RAISE EXCEPTION 'Test failed: anon role must not execute settle_match_draw';
    END IF;

    IF has_function_privilege('authenticated', 'public.finalize_match_outcome(uuid,uuid,text,jsonb)', 'EXECUTE') THEN
        RAISE EXCEPTION 'Test failed: authenticated role must not execute finalize_match_outcome';
    END IF;

    IF has_function_privilege('anon', 'public.finalize_match_outcome(uuid,uuid,text,jsonb)', 'EXECUTE') THEN
        RAISE EXCEPTION 'Test failed: anon role must not execute finalize_match_outcome';
    END IF;

    -- 2. Setup isolated test users in auth.users to satisfy foreign-key constraints
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES
        (v_u1, 'test_draw_p1_' || v_u1 || '@test.local', '{"username":"draw_p1"}'::jsonb),
        (v_u2, 'test_draw_p2_' || v_u2 || '@test.local', '{"username":"draw_p2"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;

    -- Ensure profiles exist (if trigger did not fire or profiles are required)
    INSERT INTO public.profiles (id, username, email)
    VALUES
        (v_u1, 'draw_p1_' || substring(v_u1::text, 1, 8), 'test_draw_p1_' || v_u1 || '@test.local'),
        (v_u2, 'draw_p2_' || substring(v_u2::text, 1, 8), 'test_draw_p2_' || v_u2 || '@test.local')
    ON CONFLICT (id) DO NOTHING;

    -- Upsert wallets with explicit initial test balances (500 balance, 50 locked)
    INSERT INTO public.wallets (user_id, balance, locked_balance)
    VALUES
        (v_u1, 500.00, 50.00),
        (v_u2, 500.00, 50.00)
    ON CONFLICT (user_id) DO UPDATE SET
        balance = EXCLUDED.balance,
        locked_balance = EXCLUDED.locked_balance,
        updated_at = NOW();

    -- Setup finished draw match (stake = 50.00 per player)
    INSERT INTO public.matches (
        id, player1_id, player2_id, game_type, stake_amount,
        status, winner_id, resolution_state, authority_resolution_reason
    ) VALUES (
        v_match_id, v_u1, v_u2, 'chess', 50.00,
        'finished', NULL, 'resolved', 'chess_stalemate'
    );

    -- 3. Test Successful Refund
    v_res := public.settle_match_draw(v_match_id);
    IF (v_res->>'status') <> 'draw_settled' THEN
        RAISE EXCEPTION 'Test failed: expected draw_settled, got %', v_res;
    END IF;

    SELECT * INTO v_p1_wallet FROM public.wallets WHERE user_id = v_u1;
    SELECT * INTO v_p2_wallet FROM public.wallets WHERE user_id = v_u2;

    IF v_p1_wallet.balance <> 550.00 OR v_p1_wallet.locked_balance <> 0.00 THEN
        RAISE EXCEPTION 'Test failed: Player 1 wallet refund incorrect (balance=%, locked=%)',
            v_p1_wallet.balance, v_p1_wallet.locked_balance;
    END IF;

    IF v_p2_wallet.balance <> 550.00 OR v_p2_wallet.locked_balance <> 0.00 THEN
        RAISE EXCEPTION 'Test failed: Player 2 wallet refund incorrect (balance=%, locked=%)',
            v_p2_wallet.balance, v_p2_wallet.locked_balance;
    END IF;

    -- 4. Verify match_payouts ledger row
    SELECT * INTO v_payout FROM public.match_payouts WHERE match_id = v_match_id;
    IF v_payout.match_id IS NULL THEN
        RAISE EXCEPTION 'Test failed: match_payouts row not created for draw';
    END IF;
    IF v_payout.winner_id IS NOT NULL THEN
        RAISE EXCEPTION 'Test failed: match_payouts winner_id must be NULL for draw';
    END IF;
    IF v_payout.stake_amount <> 50.00 OR v_payout.total_pot <> 100.00 THEN
        RAISE EXCEPTION 'Test failed: payout amounts incorrect (stake=%, pot=%)',
            v_payout.stake_amount, v_payout.total_pot;
    END IF;

    -- 5. Test Idempotency (Second Call must not double-credit wallets)
    v_res := public.settle_match_draw(v_match_id);
    IF (v_res->>'status') <> 'already_settled' THEN
        RAISE EXCEPTION 'Test failed: expected already_settled on duplicate call, got %', v_res;
    END IF;

    SELECT * INTO v_p1_wallet FROM public.wallets WHERE user_id = v_u1;
    IF v_p1_wallet.balance <> 550.00 OR v_p1_wallet.locked_balance <> 0.00 THEN
        RAISE EXCEPTION 'Test failed: double-refund occurred on idempotent call';
    END IF;

    -- 6. Test Invalid State Rejection (Active Match)
    INSERT INTO public.matches (
        id, player1_id, player2_id, game_type, stake_amount,
        status, winner_id, resolution_state
    ) VALUES (
        v_active_match_id, v_u1, v_u2, 'chess', 20.00,
        'active', NULL, 'none'
    );

    v_error_caught := FALSE;
    BEGIN
        PERFORM public.settle_match_draw(v_active_match_id);
    EXCEPTION WHEN OTHERS THEN
        v_error_caught := TRUE;
    END;
    IF NOT v_error_caught THEN
        RAISE EXCEPTION 'Test failed: settle_match_draw must reject active matches';
    END IF;

    -- 7. Test Decisive Match Rejection (Match with Winner)
    INSERT INTO public.matches (
        id, player1_id, player2_id, game_type, stake_amount,
        status, winner_id, resolution_state
    ) VALUES (
        v_won_match_id, v_u1, v_u2, 'chess', 20.00,
        'finished', v_u1, 'resolved'
    );

    v_error_caught := FALSE;
    BEGIN
        PERFORM public.settle_match_draw(v_won_match_id);
    EXCEPTION WHEN OTHERS THEN
        v_error_caught := TRUE;
    END;
    IF NOT v_error_caught THEN
        RAISE EXCEPTION 'Test failed: settle_match_draw must reject matches with decisive winner';
    END IF;

    -- 8. Test Insufficient Locked Balance Rejection (Strict Validation, No Clamping)
    UPDATE public.wallets SET balance = 500.00, locked_balance = 10.00 WHERE user_id = v_u1;
    UPDATE public.wallets SET balance = 500.00, locked_balance = 50.00 WHERE user_id = v_u2;

    v_match_id := gen_random_uuid();
    INSERT INTO public.matches (
        id, player1_id, player2_id, game_type, stake_amount,
        status, winner_id, resolution_state
    ) VALUES (
        v_match_id, v_u1, v_u2, 'chess', 50.00,
        'finished', NULL, 'resolved'
    );

    v_error_caught := FALSE;
    BEGIN
        PERFORM public.settle_match_draw(v_match_id);
    EXCEPTION WHEN OTHERS THEN
        v_error_caught := TRUE;
    END;
    IF NOT v_error_caught THEN
        RAISE EXCEPTION 'Test failed: settle_match_draw must raise exception on insufficient locked balance';
    END IF;

    -- Verify wallet was NOT mutated / NOT clamped
    SELECT * INTO v_p1_wallet FROM public.wallets WHERE user_id = v_u1;
    IF v_p1_wallet.locked_balance <> 10.00 OR v_p1_wallet.balance <> 500.00 THEN
        RAISE EXCEPTION 'Test failed: wallet was mutated despite insufficient balance failure';
    END IF;

    -- 9. Test Free Match Draw (stake_amount = 0)
    INSERT INTO public.matches (
        id, player1_id, player2_id, game_type, stake_amount,
        status, winner_id, resolution_state
    ) VALUES (
        v_free_match_id, v_u1, v_u2, 'chess', 0.00,
        'finished', NULL, 'resolved'
    );

    v_res := public.settle_match_draw(v_free_match_id);
    IF (v_res->>'status') <> 'draw_settled' THEN
        RAISE EXCEPTION 'Test failed: free match draw settlement failed, got %', v_res;
    END IF;

    SELECT * INTO v_payout FROM public.match_payouts WHERE match_id = v_free_match_id;
    IF v_payout.match_id IS NULL OR v_payout.total_pot <> 0.00 THEN
        RAISE EXCEPTION 'Test failed: match_payouts record for free draw incorrect';
    END IF;

    RAISE NOTICE 'Phase 5 draw settlement test assertions: ALL PASSED';
END;
$phase5_tests$;

ROLLBACK;
