-- Prevent reconnecting to stale long-lived active matches.
-- Reconnect should only occur for recently-created matches.

CREATE OR REPLACE FUNCTION public.find_opponent(
    p_user_id UUID,
    p_game_type TEXT,
    p_stake_amount NUMERIC
) RETURNS JSONB AS $find_opponent_tag$
DECLARE
    v_authenticated_user_id UUID;
    v_effective_user_id UUID;
    v_old_entry RECORD;
    v_opponent_record RECORD;
    v_match_id UUID;
BEGIN
    v_authenticated_user_id := auth.uid();

    IF v_authenticated_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Unauthorized');
    END IF;

    IF p_user_id IS NOT NULL AND p_user_id <> v_authenticated_user_id THEN
        RETURN jsonb_build_object('error', 'Authenticated user mismatch');
    END IF;

    v_effective_user_id := v_authenticated_user_id;

    SELECT id INTO v_match_id
    FROM public.matches
    WHERE status = 'active'
      AND (player1_id = v_effective_user_id OR player2_id = v_effective_user_id)
      AND game_type = p_game_type
      AND stake_amount = p_stake_amount
      AND created_at > (NOW() - INTERVAL '60 seconds')
    LIMIT 1;

    IF v_match_id IS NOT NULL THEN
        RETURN jsonb_build_object('status', 'matched', 'match_id', v_match_id, 'reconnected', true);
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.match_queue
        WHERE user_id = v_effective_user_id
          AND game_type = p_game_type
          AND stake_amount = p_stake_amount
          AND status = 'searching'
    ) THEN
        RETURN jsonb_build_object('status', 'searching', 'info', 'already_in_queue');
    END IF;

    FOR v_old_entry IN
        SELECT stake_amount
        FROM public.match_queue
        WHERE user_id = v_effective_user_id AND status = 'searching'
    LOOP
        PERFORM public.unlock_stake(v_effective_user_id, v_old_entry.stake_amount);
    END LOOP;

    DELETE FROM public.match_queue WHERE user_id = v_effective_user_id;

    IF p_stake_amount NOT IN (10, 50, 100, 500) THEN
        RETURN jsonb_build_object('error', 'Invalid stake amount.');
    END IF;

    IF NOT public.lock_stake(v_effective_user_id, p_stake_amount) THEN
        RETURN jsonb_build_object('error', 'Insufficient balance');
    END IF;

    SELECT * INTO v_opponent_record
    FROM public.match_queue
    WHERE game_type = p_game_type
      AND stake_amount = p_stake_amount
      AND status = 'searching'
      AND user_id <> v_effective_user_id
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_opponent_record.id IS NOT NULL THEN
        DELETE FROM public.match_queue WHERE id = v_opponent_record.id;

        INSERT INTO public.matches (player1_id, player2_id, game_type, stake_amount, status, current_turn)
        VALUES (v_opponent_record.user_id, v_effective_user_id, p_game_type, p_stake_amount, 'active', v_opponent_record.user_id)
        RETURNING id INTO v_match_id;

        RETURN jsonb_build_object('status', 'matched', 'match_id', v_match_id);
    ELSE
        INSERT INTO public.match_queue (user_id, game_type, stake_amount, status)
        VALUES (v_effective_user_id, p_game_type, p_stake_amount, 'searching');

        RETURN jsonb_build_object('status', 'searching');
    END IF;
END;
$find_opponent_tag$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.find_opponent(UUID, TEXT, NUMERIC)
    SET search_path = public, pg_temp;