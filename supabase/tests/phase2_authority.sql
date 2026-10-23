-- Phase 2 authority integration checks.
--
-- Run only after manual review/application of 20260814 and Edge Function deployment.
-- This script creates no users. Runtime cases must use only qa_player_a_0810 and
-- qa_player_b_0810 in a disposable/staging match and must be wrapped in a rollback.

BEGIN;

DO $phase2_privilege_assertions$
BEGIN
    IF has_function_privilege(
        'authenticated',
        'public.apply_validated_game_move(uuid,uuid,integer,jsonb,uuid,text,uuid,text,jsonb)',
        'EXECUTE'
    ) THEN
        RAISE EXCEPTION 'authenticated must not execute apply_validated_game_move';
    END IF;

    IF has_function_privilege(
        'anon',
        'public.apply_validated_game_move(uuid,uuid,integer,jsonb,uuid,text,uuid,text,jsonb)',
        'EXECUTE'
    ) THEN
        RAISE EXCEPTION 'anon must not execute apply_validated_game_move';
    END IF;

    IF NOT has_function_privilege(
        'authenticated',
        'public.submit_match_result(uuid,uuid,jsonb)',
        'EXECUTE'
    ) THEN
        RAISE EXCEPTION 'authenticated must execute the receipt-only result RPC';
    END IF;

    IF has_function_privilege(
        'authenticated',
        'public.finalize_match_outcome(uuid,uuid,text,jsonb)',
        'EXECUTE'
    ) THEN
        RAISE EXCEPTION 'authenticated must not execute finalization';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'match_result_submissions'
          AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
    ) THEN
        RAISE EXCEPTION 'match_result_submissions must not have client-write policies';
    END IF;
END;
$phase2_privilege_assertions$;

-- Runtime matrix, executed manually in the QA match after the normal browser
-- flow has created it. Keep all cases in this transaction and ROLLBACK after
-- capturing evidence:
--
-- 1. Stale revision: replay submit_game_move with an earlier move number.
--    Expected: "Stale move" and unchanged board/move number.
-- 2. Wrong actor: use the other existing QA account for the current turn.
--    Expected: "Not your turn" and unchanged board.
-- 3. Forged receipt: alter terminal_position_hash or terminal_move_number in
--    submit_match_result. Expected: receipt mismatch and no finalization.
-- 4. Direct persistence RPC: invoke apply_validated_game_move as authenticated.
--    Expected: permission denied.
-- 5. Pending precedence: after a terminal move is persisted but before its
--    receipt, invoke update_game_timers and forfeit_match as a participant.
--    Expected: {"status":"resolution_pending"}; no winner/payout mutation.
-- 6. Idempotency: submit the same valid receipt twice.
--    Expected: one match_payouts row for the match and stable wallet balances.

ROLLBACK;
