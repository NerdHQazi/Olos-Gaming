-- Phase 1 Security Hardening Test Suite
-- Target: supabase/tests/phase1_security_remediation.sql
-- Executes inside an isolated transaction and asserts all Phase 1 security invariants.

BEGIN;

DO $phase1_tests$
DECLARE
    v_u1 UUID := gen_random_uuid();
    v_u2 UUID := gen_random_uuid();
    v_u3 UUID := gen_random_uuid();

    v_match_id UUID := gen_random_uuid();
    v_draw_match_id UUID := gen_random_uuid();
    v_free_match_id UUID := gen_random_uuid();

    v_p1_wallet RECORD;
    v_p2_wallet RECORD;
    v_payout RECORD;
    v_res JSONB;
    v_err_caught BOOLEAN := FALSE;
BEGIN
    -- ------------------------------------------------------------------------
    -- 1. SEC-01: Privilege Assertions
    -- ------------------------------------------------------------------------
    IF has_function_privilege('anon', 'public.lock_stake(uuid,numeric)', 'EXECUTE') THEN
        RAISE EXCEPTION 'Test 1.1 Failed: anon role must not have EXECUTE on lock_stake';
    END IF;

    IF has_function_privilege('authenticated', 'public.lock_stake(uuid,numeric)', 'EXECUTE') THEN
        RAISE EXCEPTION 'Test 1.2 Failed: authenticated role must not have EXECUTE on lock_stake';
    END IF;

    IF has_function_privilege('anon', 'public.unlock_stake(uuid,numeric)', 'EXECUTE') THEN
        RAISE EXCEPTION 'Test 1.3 Failed: anon role must not have EXECUTE on unlock_stake';
    END IF;

    IF has_function_privilege('authenticated', 'public.unlock_stake(uuid,numeric)', 'EXECUTE') THEN
        RAISE EXCEPTION 'Test 1.4 Failed: authenticated role must not have EXECUTE on unlock_stake';
    END IF;

    IF has_function_privilege('anon', 'public.release_winnings(uuid,uuid)', 'EXECUTE') THEN
        RAISE EXCEPTION 'Test 1.5 Failed: anon role must not have EXECUTE on release_winnings';
    END IF;

    IF has_function_privilege('authenticated', 'public.release_winnings(uuid,uuid)', 'EXECUTE') THEN
        RAISE EXCEPTION 'Test 1.6 Failed: authenticated role must not have EXECUTE on release_winnings';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        IF NOT has_function_privilege('service_role', 'public.lock_stake(uuid,numeric)', 'EXECUTE') THEN
            RAISE EXCEPTION 'Test 1.7 Failed: service_role must have EXECUTE on lock_stake';
        END IF;
        IF NOT has_function_privilege('service_role', 'public.unlock_stake(uuid,numeric)', 'EXECUTE') THEN
            RAISE EXCEPTION 'Test 1.8 Failed: service_role must have EXECUTE on unlock_stake';
        END IF;
        IF NOT has_function_privilege('service_role', 'public.release_winnings(uuid,uuid)', 'EXECUTE') THEN
            RAISE EXCEPTION 'Test 1.9 Failed: service_role must have EXECUTE on release_winnings';
        END IF;
    END IF;

    -- ------------------------------------------------------------------------
    -- 2. Signup & Provisioning Trigger Verification
    -- ------------------------------------------------------------------------
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES
        (v_u1, 'test_user1_' || v_u1 || '@test.local', '{"username":"user_one","full_name":"User One"}'::jsonb),
        (v_u2, 'test_user2_' || v_u2 || '@test.local', '{"username":"user_two","full_name":"User Two"}'::jsonb),
        (v_u3, 'test_user3_' || v_u3 || '@test.local', '{"username":"user_three","full_name":"User Three"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;

    -- Verify provisioning trigger automatically created profile and wallet with 1000.00 balance
    SELECT * INTO v_p1_wallet FROM public.wallets WHERE user_id = v_u1;
    IF v_p1_wallet.user_id IS NULL OR v_p1_wallet.balance <> 1000.00 OR v_p1_wallet.locked_balance <> 0.00 THEN
        RAISE EXCEPTION 'Test 2 Failed: user 1 wallet not properly auto-provisioned (balance: %, locked: %)',
            v_p1_wallet.balance, v_p1_wallet.locked_balance;
    END IF;

    SELECT * INTO v_p2_wallet FROM public.wallets WHERE user_id = v_u2;
    IF v_p2_wallet.user_id IS NULL OR v_p2_wallet.balance <> 1000.00 OR v_p2_wallet.locked_balance <> 0.00 THEN
        RAISE EXCEPTION 'Test 2 Failed: user 2 wallet not properly auto-provisioned';
    END IF;

    -- ------------------------------------------------------------------------
    -- 3. SEC-02: Missing-Wallet Recovery & Balance Injection Prevention
    -- ------------------------------------------------------------------------
    -- Delete wallet for v_u3 to test recovery insert
    DELETE FROM public.wallets WHERE user_id = v_u3;

    -- Recovery insert passing only user_id (simulating WalletContext.tsx)
    INSERT INTO public.wallets (user_id) VALUES (v_u3);
    SELECT * INTO v_p1_wallet FROM public.wallets WHERE user_id = v_u3;
    IF v_p1_wallet.balance <> 1000.00 OR v_p1_wallet.locked_balance <> 0.00 THEN
        RAISE EXCEPTION 'Test 3.1 Failed: recovery wallet insert did not default to 1000.00 balance';
    END IF;

    -- ------------------------------------------------------------------------
    -- 4. Legitimate Matchmaking Stake Locking Flow
    -- ------------------------------------------------------------------------
    -- Player 1 calls find_opponent (internal helper locks stake)
    -- Simulate authenticated session for Player 1
    PERFORM set_config('request.jwt.claim.sub', v_u1::text, true);
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

    v_res := public.find_opponent(v_u1, 'chess', 100.00);
    IF v_res->>'status' <> 'searching' THEN
        RAISE EXCEPTION 'Test 4.1 Failed: Player 1 expected searching status, got: %', v_res;
    END IF;

    SELECT * INTO v_p1_wallet FROM public.wallets WHERE user_id = v_u1;
    IF v_p1_wallet.balance <> 900.00 OR v_p1_wallet.locked_balance <> 100.00 THEN
        RAISE EXCEPTION 'Test 4.2 Failed: Player 1 balance after queueing mismatch (bal: %, locked: %)',
            v_p1_wallet.balance, v_p1_wallet.locked_balance;
    END IF;

    -- Player 2 calls find_opponent -> should match with Player 1
    PERFORM set_config('request.jwt.claim.sub', v_u2::text, true);
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

    v_res := public.find_opponent(v_u2, 'chess', 100.00);
    IF v_res->>'status' <> 'matched' THEN
        RAISE EXCEPTION 'Test 4.3 Failed: Player 2 expected matched status, got: %', v_res;
    END IF;

    v_match_id := (v_res->>'match_id')::uuid;

    SELECT * INTO v_p2_wallet FROM public.wallets WHERE user_id = v_u2;
    IF v_p2_wallet.balance <> 900.00 OR v_p2_wallet.locked_balance <> 100.00 THEN
        RAISE EXCEPTION 'Test 4.4 Failed: Player 2 balance after match mismatch (bal: %, locked: %)',
            v_p2_wallet.balance, v_p2_wallet.locked_balance;
    END IF;

    -- ------------------------------------------------------------------------
    -- 5. Matchmaking Cancellation & Stake Refund Flow
    -- ------------------------------------------------------------------------
    -- Player 3 queues for snake 50 stake
    PERFORM set_config('request.jwt.claim.sub', v_u3::text, true);
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

    v_res := public.find_opponent(v_u3, 'snake', 50.00);
    IF v_res->>'status' <> 'searching' THEN
        RAISE EXCEPTION 'Test 5.1 Failed: Player 3 expected searching status';
    END IF;

    SELECT * INTO v_p1_wallet FROM public.wallets WHERE user_id = v_u3;
    IF v_p1_wallet.balance <> 950.00 OR v_p1_wallet.locked_balance <> 50.00 THEN
        RAISE EXCEPTION 'Test 5.2 Failed: Player 3 balance mismatch after queueing';
    END IF;

    -- Player 3 cancels matchmaking
    v_res := public.cancel_matchmaking(v_u3);
    IF v_res->>'status' <> 'cancelled' THEN
        RAISE EXCEPTION 'Test 5.3 Failed: Player 3 expected cancelled status, got: %', v_res;
    END IF;

    SELECT * INTO v_p1_wallet FROM public.wallets WHERE user_id = v_u3;
    IF v_p1_wallet.balance <> 1000.00 OR v_p1_wallet.locked_balance <> 0.00 THEN
        RAISE EXCEPTION 'Test 5.4 Failed: Player 3 balance not refunded upon cancellation (bal: %, locked: %)',
            v_p1_wallet.balance, v_p1_wallet.locked_balance;
    END IF;

    -- Switch back to service_role context for settlement testing
    PERFORM set_config('request.jwt.claim.role', 'service_role', true);
    PERFORM set_config('request.jwt.claim.sub', '', true);

    -- ------------------------------------------------------------------------
    -- 6. SEC-04: Strict Escrow Rejection (Zero Deficit Masking)
    -- ------------------------------------------------------------------------
    -- Set match to finished with Winner = Player 1
    UPDATE public.matches
    SET status = 'finished', winner_id = v_u1
    WHERE id = v_match_id;

    -- Simulate drained locked balance on loser (Player 2)
    UPDATE public.wallets SET locked_balance = 50.00 WHERE user_id = v_u2;

    BEGIN
        v_err_caught := FALSE;
        PERFORM public.release_winnings(v_match_id, v_u1);
    EXCEPTION
        WHEN OTHERS THEN
            v_err_caught := TRUE;
    END;

    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'Test 6 Failed: release_winnings must reject payout when locked_balance is insufficient';
    END IF;

    -- Verify no payout record was inserted on failure
    IF EXISTS (SELECT 1 FROM public.match_payouts WHERE match_id = v_match_id) THEN
        RAISE EXCEPTION 'Test 6 Failed: match_payouts record must not exist after failed escrow validation';
    END IF;

    -- Restore correct locked balance on loser
    UPDATE public.wallets SET locked_balance = 100.00 WHERE user_id = v_u2;

    -- ------------------------------------------------------------------------
    -- 7. Deterministic Payout Execution & Idempotency
    -- ------------------------------------------------------------------------
    PERFORM public.release_winnings(v_match_id, v_u1);

    SELECT * INTO v_p1_wallet FROM public.wallets WHERE user_id = v_u1;
    SELECT * INTO v_p2_wallet FROM public.wallets WHERE user_id = v_u2;

    -- Total pot = 200, fee (10%) = 20, prize = 180
    -- P1 gets: 900 + 180 = 1080.00, locked_balance = 0.00
    IF v_p1_wallet.balance <> 1080.00 OR v_p1_wallet.locked_balance <> 0.00 THEN
        RAISE EXCEPTION 'Test 7.1 Failed: winner balance mismatch (bal: %, locked: %)',
            v_p1_wallet.balance, v_p1_wallet.locked_balance;
    END IF;

    -- P2 gets: 900 balance, locked_balance decremented from 100 to 0
    IF v_p2_wallet.balance <> 900.00 OR v_p2_wallet.locked_balance <> 0.00 THEN
        RAISE EXCEPTION 'Test 7.2 Failed: loser balance mismatch (bal: %, locked: %)',
            v_p2_wallet.balance, v_p2_wallet.locked_balance;
    END IF;

    -- Verify payout ledger row
    SELECT * INTO v_payout FROM public.match_payouts WHERE match_id = v_match_id;
    IF v_payout.payout_amount <> 180.00 OR v_payout.fee_amount <> 20.00 THEN
        RAISE EXCEPTION 'Test 7.3 Failed: match_payouts ledger amounts mismatch';
    END IF;

    -- Idempotency Retry: call release_winnings again
    PERFORM public.release_winnings(v_match_id, v_u1);

    -- Balances must be completely unchanged
    SELECT * INTO v_p1_wallet FROM public.wallets WHERE user_id = v_u1;
    IF v_p1_wallet.balance <> 1080.00 OR v_p1_wallet.locked_balance <> 0.00 THEN
        RAISE EXCEPTION 'Test 7.4 Failed: release_winnings retry modified winner balance';
    END IF;

    -- ------------------------------------------------------------------------
    -- 8. Phase 5 Draw Settlement Compatibility
    -- ------------------------------------------------------------------------
    -- Create draw match between U1 and U2 with stake 50
    INSERT INTO public.matches (id, player1_id, player2_id, game_type, stake_amount, status, winner_id)
    VALUES (v_draw_match_id, v_u1, v_u2, 'chess', 50.00, 'finished', NULL);

    -- Lock 50 stake from both
    UPDATE public.wallets SET balance = balance - 50.00, locked_balance = locked_balance + 50.00 WHERE user_id IN (v_u1, v_u2);

    -- Execute Phase 5 draw settlement
    v_res := public.settle_match_draw(v_draw_match_id);
    IF v_res->>'status' <> 'draw_settled' THEN
        RAISE EXCEPTION 'Test 8.1 Failed: settle_match_draw did not return draw_settled: %', v_res;
    END IF;

    -- Both players must have their 50.00 stake refunded to balance
    SELECT * INTO v_p1_wallet FROM public.wallets WHERE user_id = v_u1;
    SELECT * INTO v_p2_wallet FROM public.wallets WHERE user_id = v_u2;

    IF v_p1_wallet.balance <> 1080.00 OR v_p1_wallet.locked_balance <> 0.00 THEN
        RAISE EXCEPTION 'Test 8.2 Failed: Player 1 draw refund mismatch';
    END IF;
    IF v_p2_wallet.balance <> 900.00 OR v_p2_wallet.locked_balance <> 0.00 THEN
        RAISE EXCEPTION 'Test 8.3 Failed: Player 2 draw refund mismatch';
    END IF;

    -- ------------------------------------------------------------------------
    -- 9. SEC-03: Safe Rematch Disabling
    -- ------------------------------------------------------------------------
    v_res := public.trigger_rematch(v_match_id);
    IF v_res->>'status' <> 'error' OR v_res->>'code' <> 'REMATCH_DISABLED' THEN
        RAISE EXCEPTION 'Test 9.1 Failed: trigger_rematch must return REMATCH_DISABLED error, got: %', v_res;
    END IF;

    -- Verify match was not resurrected
    IF NOT EXISTS (SELECT 1 FROM public.matches WHERE id = v_match_id AND status = 'finished') THEN
        RAISE EXCEPTION 'Test 9.2 Failed: match status was mutated after disabled rematch call';
    END IF;

    -- ------------------------------------------------------------------------
    -- 10. Free Match Payout Compatibility (Stake = 0)
    -- ------------------------------------------------------------------------
    INSERT INTO public.matches (id, player1_id, player2_id, game_type, stake_amount, status, winner_id)
    VALUES (v_free_match_id, v_u1, v_u2, 'chess', 0.00, 'finished', v_u1);

    PERFORM public.release_winnings(v_free_match_id, v_u1);

    -- Winner and loser balances must remain completely unchanged
    SELECT * INTO v_p1_wallet FROM public.wallets WHERE user_id = v_u1;
    IF v_p1_wallet.balance <> 1080.00 THEN
        RAISE EXCEPTION 'Test 10 Failed: free match modified winner balance';
    END IF;

    RAISE NOTICE 'ALL PHASE 1 SECURITY REMEDIATION TESTS PASSED!';
END;
$phase1_tests$;

ROLLBACK;
