-- Matchmaking reliability hardening:
-- 1) Serialize per-user matchmaking mutations to avoid cross-call lock contention.
-- 2) Bound lock waits so callers fail fast instead of hanging.
-- 3) Return structured diagnostics for lock/timing failures.

CREATE OR REPLACE FUNCTION public.find_opponent(
    p_user_id UUID,
    p_game_type TEXT,
    p_stake_amount NUMERIC
) RETURNS JSONB AS $find_opponent_diag_tag$
DECLARE
    v_authenticated_user_id UUID;
    v_effective_user_id UUID;
    v_old_entry RECORD;
    v_opponent_record RECORD;
    v_match_id UUID;
    v_phase TEXT := 'init';
    v_started_at TIMESTAMPTZ := clock_timestamp();
    v_user_lock_started_at TIMESTAMPTZ;
    v_bucket_lock_started_at TIMESTAMPTZ;
    v_user_lock_wait_ms INTEGER := 0;
    v_bucket_lock_wait_ms INTEGER := 0;
    v_total_ms INTEGER := 0;
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

    v_phase := 'acquire_user_lock';
    v_user_lock_started_at := clock_timestamp();
    WHILE NOT pg_try_advisory_xact_lock(hashtext('mm_user'), hashtext(v_effective_user_id::TEXT)) LOOP
        IF (EXTRACT(EPOCH FROM (clock_timestamp() - v_user_lock_started_at)) * 1000)::INTEGER >= 2500 THEN
            v_user_lock_wait_ms := (EXTRACT(EPOCH FROM (clock_timestamp() - v_user_lock_started_at)) * 1000)::INTEGER;
            v_total_ms := (EXTRACT(EPOCH FROM (clock_timestamp() - v_started_at)) * 1000)::INTEGER;
            RAISE LOG '[find_opponent] user lock timeout user=% phase=% wait_ms=% total_ms=%',
                v_effective_user_id, v_phase, v_user_lock_wait_ms, v_total_ms;

            RETURN jsonb_build_object(
                'error', 'Matchmaking busy. Please retry.',
                'code', 'MM_USER_LOCK_TIMEOUT',
                'phase', v_phase,
                'duration_ms', v_total_ms,
                'lock_wait_ms', jsonb_build_object('user', v_user_lock_wait_ms, 'bucket', v_bucket_lock_wait_ms)
            );
        END IF;

        PERFORM pg_sleep(0.05);
    END LOOP;
    v_user_lock_wait_ms := (EXTRACT(EPOCH FROM (clock_timestamp() - v_user_lock_started_at)) * 1000)::INTEGER;

    -- Serialize queue matching per game+stake bucket to avoid race/double matching.
    v_phase := 'acquire_bucket_lock';
    v_bucket_lock_started_at := clock_timestamp();
    WHILE NOT pg_try_advisory_xact_lock(hashtext('mm_bucket'), hashtext(lower(p_game_type) || ':' || p_stake_amount::TEXT)) LOOP
        IF (EXTRACT(EPOCH FROM (clock_timestamp() - v_bucket_lock_started_at)) * 1000)::INTEGER >= 2500 THEN
            v_bucket_lock_wait_ms := (EXTRACT(EPOCH FROM (clock_timestamp() - v_bucket_lock_started_at)) * 1000)::INTEGER;
            v_total_ms := (EXTRACT(EPOCH FROM (clock_timestamp() - v_started_at)) * 1000)::INTEGER;
            RAISE LOG '[find_opponent] bucket lock timeout user=% game=% stake=% wait_ms=% total_ms=%',
                v_effective_user_id, p_game_type, p_stake_amount, v_bucket_lock_wait_ms, v_total_ms;

            RETURN jsonb_build_object(
                'error', 'Matchmaking queue busy. Please retry.',
                'code', 'MM_BUCKET_LOCK_TIMEOUT',
                'phase', v_phase,
                'duration_ms', v_total_ms,
                'lock_wait_ms', jsonb_build_object('user', v_user_lock_wait_ms, 'bucket', v_bucket_lock_wait_ms)
            );
        END IF;

        PERFORM pg_sleep(0.05);
    END LOOP;
    v_bucket_lock_wait_ms := (EXTRACT(EPOCH FROM (clock_timestamp() - v_bucket_lock_started_at)) * 1000)::INTEGER;

    v_phase := 'reconnect_check';
    SELECT id INTO v_match_id
    FROM public.matches
    WHERE status = 'active'
      AND (player1_id = v_effective_user_id OR player2_id = v_effective_user_id)
      AND game_type = p_game_type
      AND stake_amount = p_stake_amount
      AND (
        created_at > (NOW() - INTERVAL '60 seconds')
        OR player1_score > 0
        OR player2_score > 0
        OR board_state IS NOT NULL
      )
    LIMIT 1;

    IF v_match_id IS NOT NULL THEN
        v_total_ms := (EXTRACT(EPOCH FROM (clock_timestamp() - v_started_at)) * 1000)::INTEGER;
        RETURN jsonb_build_object(
            'status', 'matched',
            'match_id', v_match_id,
            'reconnected', true,
            'diag', jsonb_build_object('duration_ms', v_total_ms, 'user_lock_wait_ms', v_user_lock_wait_ms, 'bucket_lock_wait_ms', v_bucket_lock_wait_ms)
        );
    END IF;

    v_phase := 'already_in_queue_check';
    IF EXISTS (
        SELECT 1 FROM public.match_queue
        WHERE user_id = v_effective_user_id
          AND game_type = p_game_type
          AND stake_amount = p_stake_amount
          AND status = 'searching'
    ) THEN
        v_total_ms := (EXTRACT(EPOCH FROM (clock_timestamp() - v_started_at)) * 1000)::INTEGER;
        RETURN jsonb_build_object(
            'status', 'searching',
            'info', 'already_in_queue',
            'diag', jsonb_build_object('duration_ms', v_total_ms, 'user_lock_wait_ms', v_user_lock_wait_ms, 'bucket_lock_wait_ms', v_bucket_lock_wait_ms)
        );
    END IF;

    v_phase := 'clear_stale_queue';
    FOR v_old_entry IN
        DELETE FROM public.match_queue
        WHERE user_id = v_effective_user_id
          AND status = 'searching'
        RETURNING stake_amount
    LOOP
        PERFORM public.unlock_stake(v_effective_user_id, v_old_entry.stake_amount);
    END LOOP;

    IF p_stake_amount NOT IN (10, 50, 100, 500) THEN
        RETURN jsonb_build_object('error', 'Invalid stake amount.');
    END IF;

    v_phase := 'lock_stake';
    IF NOT public.lock_stake(v_effective_user_id, p_stake_amount) THEN
        RETURN jsonb_build_object('error', 'Insufficient balance');
    END IF;

    v_phase := 'find_opponent_queue';
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
        v_phase := 'consume_opponent_queue';
        DELETE FROM public.match_queue WHERE id = v_opponent_record.id;

        v_phase := 'find_existing_pair_match';
        SELECT id INTO v_match_id
        FROM public.matches
        WHERE status = 'active'
          AND game_type = p_game_type
          AND stake_amount = p_stake_amount
                    AND (
                        created_at > (NOW() - INTERVAL '60 seconds')
                        OR player1_score > 0
                        OR player2_score > 0
                        OR board_state IS NOT NULL
                    )
          AND (
            (player1_id = v_opponent_record.user_id AND player2_id = v_effective_user_id)
            OR
            (player1_id = v_effective_user_id AND player2_id = v_opponent_record.user_id)
          )
        ORDER BY created_at DESC
        LIMIT 1;

        IF v_match_id IS NULL THEN
            v_phase := 'insert_match';
            INSERT INTO public.matches (player1_id, player2_id, game_type, stake_amount, status, current_turn)
            VALUES (v_opponent_record.user_id, v_effective_user_id, p_game_type, p_stake_amount, 'active', v_opponent_record.user_id)
            RETURNING id INTO v_match_id;
        END IF;

        v_total_ms := (EXTRACT(EPOCH FROM (clock_timestamp() - v_started_at)) * 1000)::INTEGER;
        RETURN jsonb_build_object(
            'status', 'matched',
            'match_id', v_match_id,
            'diag', jsonb_build_object('duration_ms', v_total_ms, 'user_lock_wait_ms', v_user_lock_wait_ms, 'bucket_lock_wait_ms', v_bucket_lock_wait_ms)
        );
    END IF;

    v_phase := 'insert_queue';
    INSERT INTO public.match_queue (user_id, game_type, stake_amount, status)
    VALUES (v_effective_user_id, p_game_type, p_stake_amount, 'searching');

    v_total_ms := (EXTRACT(EPOCH FROM (clock_timestamp() - v_started_at)) * 1000)::INTEGER;
    RETURN jsonb_build_object(
        'status', 'searching',
        'diag', jsonb_build_object('duration_ms', v_total_ms, 'user_lock_wait_ms', v_user_lock_wait_ms, 'bucket_lock_wait_ms', v_bucket_lock_wait_ms)
    );
EXCEPTION
    WHEN OTHERS THEN
        v_total_ms := (EXTRACT(EPOCH FROM (clock_timestamp() - v_started_at)) * 1000)::INTEGER;
        RAISE LOG '[find_opponent] error user=% game=% stake=% phase=% code=% msg=% duration_ms=%',
            COALESCE(v_effective_user_id, v_authenticated_user_id), p_game_type, p_stake_amount, v_phase, SQLSTATE, SQLERRM, v_total_ms;

        RETURN jsonb_build_object(
            'error', 'Matchmaking unavailable. Please retry.',
            'code', SQLSTATE,
            'phase', v_phase,
            'duration_ms', v_total_ms,
            'message', SQLERRM
        );
END;
$find_opponent_diag_tag$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.cancel_matchmaking(
    p_user_id UUID
) RETURNS JSONB AS $cancel_matchmaking_diag_tag$
DECLARE
    v_authenticated_user_id UUID;
    v_old_entry RECORD;
    v_phase TEXT := 'init';
    v_started_at TIMESTAMPTZ := clock_timestamp();
    v_user_lock_started_at TIMESTAMPTZ;
    v_user_lock_wait_ms INTEGER := 0;
    v_total_ms INTEGER := 0;
BEGIN
    PERFORM set_config('lock_timeout', '2500ms', true);
    PERFORM set_config('statement_timeout', '10000ms', true);

    v_authenticated_user_id := auth.uid();

    IF v_authenticated_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Unauthorized');
    END IF;

    IF p_user_id IS NOT NULL AND p_user_id <> v_authenticated_user_id THEN
        RETURN jsonb_build_object('error', 'Authenticated user mismatch');
    END IF;

    v_phase := 'acquire_user_lock';
    v_user_lock_started_at := clock_timestamp();
    WHILE NOT pg_try_advisory_xact_lock(hashtext('mm_user'), hashtext(v_authenticated_user_id::TEXT)) LOOP
        IF (EXTRACT(EPOCH FROM (clock_timestamp() - v_user_lock_started_at)) * 1000)::INTEGER >= 2500 THEN
            v_user_lock_wait_ms := (EXTRACT(EPOCH FROM (clock_timestamp() - v_user_lock_started_at)) * 1000)::INTEGER;
            v_total_ms := (EXTRACT(EPOCH FROM (clock_timestamp() - v_started_at)) * 1000)::INTEGER;
            RAISE LOG '[cancel_matchmaking] user lock timeout user=% phase=% wait_ms=% total_ms=%',
                v_authenticated_user_id, v_phase, v_user_lock_wait_ms, v_total_ms;

            RETURN jsonb_build_object(
                'error', 'Cancel busy. Please retry.',
                'code', 'MM_CANCEL_LOCK_TIMEOUT',
                'phase', v_phase,
                'duration_ms', v_total_ms,
                'lock_wait_ms', v_user_lock_wait_ms
            );
        END IF;

        PERFORM pg_sleep(0.05);
    END LOOP;
    v_user_lock_wait_ms := (EXTRACT(EPOCH FROM (clock_timestamp() - v_user_lock_started_at)) * 1000)::INTEGER;

    v_phase := 'clear_queue_and_unlock';
    FOR v_old_entry IN
        DELETE FROM public.match_queue
        WHERE user_id = v_authenticated_user_id
          AND status = 'searching'
        RETURNING stake_amount
    LOOP
        PERFORM public.unlock_stake(v_authenticated_user_id, v_old_entry.stake_amount);
    END LOOP;

    v_total_ms := (EXTRACT(EPOCH FROM (clock_timestamp() - v_started_at)) * 1000)::INTEGER;
    RETURN jsonb_build_object(
        'status', 'cancelled',
        'diag', jsonb_build_object('duration_ms', v_total_ms, 'user_lock_wait_ms', v_user_lock_wait_ms)
    );
EXCEPTION
    WHEN OTHERS THEN
        v_total_ms := (EXTRACT(EPOCH FROM (clock_timestamp() - v_started_at)) * 1000)::INTEGER;
        RAISE LOG '[cancel_matchmaking] error user=% phase=% code=% msg=% duration_ms=%',
            v_authenticated_user_id, v_phase, SQLSTATE, SQLERRM, v_total_ms;

        RETURN jsonb_build_object(
            'error', 'Cancel failed. Please retry.',
            'code', SQLSTATE,
            'phase', v_phase,
            'duration_ms', v_total_ms,
            'message', SQLERRM
        );
END;
$cancel_matchmaking_diag_tag$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.find_opponent(UUID, TEXT, NUMERIC) SET search_path = public, pg_temp;
ALTER FUNCTION public.cancel_matchmaking(UUID) SET search_path = public, pg_temp;