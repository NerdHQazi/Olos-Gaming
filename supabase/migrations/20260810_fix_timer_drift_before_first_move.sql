-- Prevent immediate timeout from elapsed wall-clock time before the first move.
-- For turn-based games, timers should start deducting after at least one move is made.

CREATE OR REPLACE FUNCTION public.update_game_timers(
    p_match_id UUID,
    p_actor_id UUID DEFAULT NULL
) RETURNS JSONB AS $timer_update_tag$
DECLARE
    v_authenticated_user_id UUID;
    v_effective_player_id UUID;
    v_match RECORD;
    v_elapsed_seconds INTEGER;
    v_p1_new_time INTEGER;
    v_p2_new_time INTEGER;
    v_timeout_winner UUID;
BEGIN
    v_authenticated_user_id := auth.uid();

    IF v_authenticated_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Unauthorized');
    END IF;

    IF p_actor_id IS NOT NULL AND p_actor_id <> v_authenticated_user_id THEN
        RETURN jsonb_build_object('error', 'Authenticated user mismatch');
    END IF;

    v_effective_player_id := v_authenticated_user_id;

    SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;

    IF v_match.status <> 'active' THEN
        RETURN jsonb_build_object('error', 'Match not active');
    END IF;

    IF v_effective_player_id <> v_match.player1_id AND v_effective_player_id <> v_match.player2_id THEN
        RETURN jsonb_build_object('error', 'Player not in match');
    END IF;

    -- No timer progression before first move in turn-based games.
    -- This avoids deducting minutes that elapsed between room join and first action.
    IF v_match.game_type <> 'snake' AND NOT EXISTS (
        SELECT 1 FROM public.match_events
        WHERE match_id = p_match_id
          AND event_type = 'move'
        LIMIT 1
    ) THEN
        RETURN jsonb_build_object('status', 'awaiting_first_move');
    END IF;

    v_elapsed_seconds := EXTRACT(EPOCH FROM (NOW() - v_match.last_move_timestamp))::int;

    IF v_elapsed_seconds < 1 THEN
        RETURN jsonb_build_object('status', 'no_change');
    END IF;

    v_p1_new_time := v_match.player1_time_remaining;
    v_p2_new_time := v_match.player2_time_remaining;

    IF v_match.game_type = 'snake' THEN
        v_p1_new_time := v_p1_new_time - v_elapsed_seconds;
        v_p2_new_time := v_p2_new_time - v_elapsed_seconds;
    ELSE
        IF v_match.current_turn = v_match.player1_id THEN
            v_p1_new_time := v_p1_new_time - v_elapsed_seconds;
        ELSE
            v_p2_new_time := v_p2_new_time - v_elapsed_seconds;
        END IF;
    END IF;

    IF v_p1_new_time <= 0 OR v_p2_new_time <= 0 THEN
        IF v_match.game_type = 'snake' THEN
            v_timeout_winner := CASE
                WHEN v_match.player1_score > v_match.player2_score THEN v_match.player1_id
                WHEN v_match.player2_score > v_match.player1_score THEN v_match.player2_id
                ELSE NULL
            END;

            UPDATE public.matches
            SET
                player1_time_remaining = 0,
                player2_time_remaining = 0
            WHERE id = p_match_id;

            RETURN public.finalize_match_outcome(
                p_match_id,
                v_timeout_winner,
                'timer_expired',
                jsonb_build_object('p1_score', v_match.player1_score, 'p2_score', v_match.player2_score)
            );
        END IF;

        v_timeout_winner := CASE WHEN v_p1_new_time <= 0 THEN v_match.player2_id ELSE v_match.player1_id END;

        UPDATE public.matches
        SET
            player1_time_remaining = GREATEST(0, v_p1_new_time),
            player2_time_remaining = GREATEST(0, v_p2_new_time)
        WHERE id = p_match_id;

        RETURN public.finalize_match_outcome(
            p_match_id,
            v_timeout_winner,
            'timeout',
            jsonb_build_object('p1_time', GREATEST(0, v_p1_new_time), 'p2_time', GREATEST(0, v_p2_new_time))
        );
    END IF;

    UPDATE public.matches
    SET
        player1_time_remaining = v_p1_new_time,
        player2_time_remaining = v_p2_new_time,
        last_move_timestamp = NOW()
    WHERE id = p_match_id;

    RETURN jsonb_build_object('status', 'updated', 'p1_time', v_p1_new_time, 'p2_time', v_p2_new_time);
END;
$timer_update_tag$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.update_game_timers(UUID, UUID)
    SET search_path = public, pg_temp;
