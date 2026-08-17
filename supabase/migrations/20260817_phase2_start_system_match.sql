-- PvS Phase 2: matchmaking entry point that pairs a human directly against the
-- provisioned System account, bypassing match_queue and the Ready/countdown flow.

CREATE OR REPLACE FUNCTION public.start_system_match(
    p_user_id UUID,
    p_game_type TEXT,
    p_stake_amount NUMERIC
) RETURNS JSONB AS $start_system_match_tag$
DECLARE
    v_authenticated_user_id UUID;
    v_effective_user_id UUID;
    v_system_user_id UUID;
    v_match_id UUID;
BEGIN
    PERFORM set_config('lock_timeout', '2500ms', true);
    PERFORM set_config('statement_timeout', '15000ms', true);

    v_authenticated_user_id := auth.uid();
    IF v_authenticated_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Unauthorized');
    END IF;
    IF p_user_id IS NOT NULL AND p_user_id <> v_authenticated_user_id THEN
        RETURN jsonb_build_object('error', 'Authenticated user mismatch');
    END IF;
    v_effective_user_id := v_authenticated_user_id;

    -- PvS is only wired up for the turn-based games with a System move selector (Phase 3/4).
    IF lower(p_game_type) NOT IN ('chess', 'checkers') THEN
        RETURN jsonb_build_object('error', 'Player vs System is not available for this game');
    END IF;

    IF p_stake_amount NOT IN (10, 50, 100, 500) THEN
        RETURN jsonb_build_object('error', 'Invalid stake amount.');
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('start_system_match'), hashtext(v_effective_user_id::TEXT));

    SELECT id INTO v_system_user_id FROM auth.users WHERE email = 'olosgamingsoc@gmail.com';
    IF v_system_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'System account is not provisioned');
    END IF;

    IF NOT public.lock_stake(v_effective_user_id, p_stake_amount) THEN
        RETURN jsonb_build_object('error', 'Insufficient balance');
    END IF;

    IF NOT public.lock_stake(v_system_user_id, p_stake_amount) THEN
        PERFORM public.unlock_stake(v_effective_user_id, p_stake_amount);
        RETURN jsonb_build_object('error', 'System treasury has insufficient balance');
    END IF;

    INSERT INTO public.matches (player1_id, player2_id, game_type, stake_amount, status, current_turn)
    VALUES (v_effective_user_id, v_system_user_id, p_game_type, p_stake_amount, 'active', v_effective_user_id)
    RETURNING id INTO v_match_id;

    RETURN jsonb_build_object(
        'status', 'matched',
        'match_id', v_match_id,
        'player1_id', v_effective_user_id,
        'player2_id', v_system_user_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('error', 'Player vs System matchmaking unavailable. Please retry.', 'code', SQLSTATE, 'message', SQLERRM);
END;
$start_system_match_tag$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.start_system_match(UUID, TEXT, NUMERIC) SET search_path = public, pg_temp;
