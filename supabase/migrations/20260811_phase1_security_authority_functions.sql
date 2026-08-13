-- Phase 1: Security and Authority Hardening (function updates)

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
BEGIN
    SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;

    IF v_match.id IS NULL THEN
        RAISE EXCEPTION 'Match not found';
    END IF;

    IF v_match.status <> 'finished' OR v_match.winner_id IS NULL THEN
        RETURN;
    END IF;

    IF p_winner_id IS DISTINCT FROM v_match.winner_id THEN
        RAISE EXCEPTION 'Winner mismatch';
    END IF;

    v_total_stake := v_match.stake_amount * 2;
    v_fee := v_total_stake * 0.10;
    v_winner_prize := v_total_stake - v_fee;

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

    IF v_inserted_match_id IS NULL THEN
        RETURN;
    END IF;

    UPDATE public.wallets
    SET locked_balance = GREATEST(locked_balance - v_match.stake_amount, 0)
    WHERE user_id = v_match.player1_id;

    UPDATE public.wallets
    SET locked_balance = GREATEST(locked_balance - v_match.stake_amount, 0)
    WHERE user_id = v_match.player2_id;

    UPDATE public.wallets
    SET
        balance = balance + v_winner_prize,
        updated_at = NOW()
    WHERE user_id = v_match.winner_id;
END;
$release_tag$ LANGUAGE plpgsql SECURITY DEFINER;

-- Internal settlement function: prevent direct invocation from app-auth roles.
REVOKE EXECUTE ON FUNCTION public.release_winnings(UUID, UUID) FROM PUBLIC;

DO $revoke_release_winnings_anon$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.release_winnings(UUID, UUID) FROM anon';
    END IF;
END;
$revoke_release_winnings_anon$;

DO $revoke_release_winnings_authenticated$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.release_winnings(UUID, UUID) FROM authenticated';
    END IF;
END;
$revoke_release_winnings_authenticated$;

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
      AND (
        created_at > (NOW() - INTERVAL '60 seconds')
        OR player1_score > 0
        OR player2_score > 0
        OR board_state IS NOT NULL
      )
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

CREATE OR REPLACE FUNCTION public.validate_apple_eaten(
    p_match_id UUID,
    p_player_id UUID,
    p_x INTEGER,
    p_y INTEGER
) RETURNS JSONB AS $validate_apple_tag$
DECLARE
    v_authenticated_user_id UUID;
    v_effective_player_id UUID;
    v_match RECORD;
    v_new_apple_x INTEGER;
    v_new_apple_y INTEGER;
BEGIN
    v_authenticated_user_id := auth.uid();

    IF v_authenticated_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Unauthorized');
    END IF;

    IF p_player_id IS NOT NULL AND p_player_id <> v_authenticated_user_id THEN
        RETURN jsonb_build_object('error', 'Authenticated user mismatch');
    END IF;

    v_effective_player_id := v_authenticated_user_id;

    SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;

    IF v_match.status <> 'active' THEN
        RETURN jsonb_build_object('error', 'Match is not active');
    END IF;

    IF (v_match.current_apple_pos->>'x')::int = p_x AND (v_match.current_apple_pos->>'y')::int = p_y THEN
        IF v_match.player1_id = v_effective_player_id THEN
            UPDATE public.matches SET player1_score = player1_score + 10 WHERE id = p_match_id;
        ELSIF v_match.player2_id = v_effective_player_id THEN
            UPDATE public.matches SET player2_score = player2_score + 10 WHERE id = p_match_id;
        ELSE
            RETURN jsonb_build_object('error', 'Player not in match');
        END IF;

        v_new_apple_x := floor(random() * 20);
        v_new_apple_y := floor(random() * 20);

        UPDATE public.matches
        SET current_apple_pos = jsonb_build_object('x', v_new_apple_x, 'y', v_new_apple_y)
        WHERE id = p_match_id;

        RETURN jsonb_build_object(
            'status', 'success',
            'new_apple', jsonb_build_object('x', v_new_apple_x, 'y', v_new_apple_y),
            'new_score', (CASE WHEN v_match.player1_id = v_effective_player_id THEN v_match.player1_score + 10 ELSE v_match.player2_score + 10 END)
        );
    ELSE
        RETURN jsonb_build_object('error', 'Position mismatch');
    END IF;
END;
$validate_apple_tag$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.perform_game_move(
    p_match_id UUID,
    p_player_id UUID,
    p_move_data JSONB
) RETURNS JSONB AS $perform_move_tag$
DECLARE
    v_authenticated_user_id UUID;
    v_effective_player_id UUID;
    v_match RECORD;
BEGIN
    v_authenticated_user_id := auth.uid();

    IF v_authenticated_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Unauthorized');
    END IF;

    IF p_player_id IS NOT NULL AND p_player_id <> v_authenticated_user_id THEN
        RETURN jsonb_build_object('error', 'Authenticated user mismatch');
    END IF;

    v_effective_player_id := v_authenticated_user_id;

    SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;

    IF v_match.status <> 'active' THEN
        RETURN jsonb_build_object('error', 'Match is not active');
    END IF;

    IF v_effective_player_id <> v_match.player1_id AND v_effective_player_id <> v_match.player2_id THEN
        RETURN jsonb_build_object('error', 'Player not in match');
    END IF;

    IF v_match.current_turn <> v_effective_player_id THEN
        RETURN jsonb_build_object('error', 'Not your turn');
    END IF;

    UPDATE public.matches
    SET
        board_state = p_move_data->'new_board',
        current_turn = (CASE WHEN v_effective_player_id = player1_id THEN player2_id ELSE player1_id END),
        last_move_timestamp = NOW()
    WHERE id = p_match_id;

    INSERT INTO public.match_events (match_id, player_id, event_type, payload)
    VALUES (p_match_id, v_effective_player_id, 'move', p_move_data);

    IF p_move_data->>'status' = 'finished' THEN
        UPDATE public.matches
        SET
            status = 'finished',
            winner_id = v_effective_player_id
        WHERE id = p_match_id;

        PERFORM public.release_winnings(p_match_id, v_effective_player_id);
    END IF;

    RETURN jsonb_build_object('status', 'success');
END;
$perform_move_tag$ LANGUAGE plpgsql SECURITY DEFINER;

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
            UPDATE public.matches
            SET
                player1_time_remaining = 0,
                player2_time_remaining = 0,
                status = 'finished',
                winner_id = (CASE
                    WHEN player1_score > player2_score THEN player1_id
                    WHEN player2_score > player1_score THEN player2_id
                    ELSE NULL
                END),
                last_move_timestamp = NOW()
            WHERE id = p_match_id;

            IF v_match.player1_score > v_match.player2_score THEN
                PERFORM public.release_winnings(p_match_id, v_match.player1_id);
            ELSIF v_match.player2_score > v_match.player1_score THEN
                PERFORM public.release_winnings(p_match_id, v_match.player2_id);
            END IF;

            RETURN jsonb_build_object(
                'status', 'finished',
                'reason', 'timer_expired',
                'p1_score', v_match.player1_score,
                'p2_score', v_match.player2_score
            );
        ELSE
            UPDATE public.matches
            SET
                player1_time_remaining = GREATEST(0, v_p1_new_time),
                player2_time_remaining = GREATEST(0, v_p2_new_time),
                status = 'finished',
                winner_id = (CASE WHEN v_p1_new_time <= 0 THEN player2_id ELSE player1_id END),
                last_move_timestamp = NOW()
            WHERE id = p_match_id;

            PERFORM public.release_winnings(p_match_id, (CASE WHEN v_p1_new_time <= 0 THEN v_match.player2_id ELSE v_match.player1_id END));

            RETURN jsonb_build_object('status', 'timeout', 'winner_id', (CASE WHEN v_p1_new_time <= 0 THEN v_match.player2_id ELSE v_match.player1_id END));
        END IF;
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

CREATE OR REPLACE FUNCTION public.handle_player_disconnection(
    p_match_id UUID,
    p_player_id UUID
) RETURNS JSONB AS $disconnection_tag$
DECLARE
    v_authenticated_user_id UUID;
BEGIN
    v_authenticated_user_id := auth.uid();

    IF v_authenticated_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Unauthorized');
    END IF;

    IF p_player_id IS NOT NULL AND p_player_id <> v_authenticated_user_id THEN
        RETURN jsonb_build_object('error', 'Authenticated user mismatch');
    END IF;

    UPDATE public.matches
    SET
        status = 'reconnecting',
        disconnect_deadline = NOW() + INTERVAL '60 seconds',
        disconnected_player_id = v_authenticated_user_id
    WHERE id = p_match_id
      AND status = 'active'
      AND (player1_id = v_authenticated_user_id OR player2_id = v_authenticated_user_id);

    RETURN jsonb_build_object('status', 'reconnecting', 'deadline', NOW() + INTERVAL '60 seconds');
END;
$disconnection_tag$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_player_reconnection(
    p_match_id UUID,
    p_player_id UUID
) RETURNS JSONB AS $reconnection_tag$
DECLARE
    v_authenticated_user_id UUID;
BEGIN
    v_authenticated_user_id := auth.uid();

    IF v_authenticated_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Unauthorized');
    END IF;

    IF p_player_id IS NOT NULL AND p_player_id <> v_authenticated_user_id THEN
        RETURN jsonb_build_object('error', 'Authenticated user mismatch');
    END IF;

    UPDATE public.matches
    SET
        status = 'active',
        disconnect_deadline = NULL,
        disconnected_player_id = NULL
    WHERE id = p_match_id
      AND status = 'reconnecting'
      AND (player1_id = v_authenticated_user_id OR player2_id = v_authenticated_user_id);

    RETURN jsonb_build_object('status', 'active');
END;
$reconnection_tag$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_forfeits()
RETURNS VOID AS $forfeit_tag$
DECLARE
    v_match RECORD;
    v_winner_id UUID;
BEGIN
    FOR v_match IN
        SELECT *
        FROM public.matches
        WHERE status = 'reconnecting'
          AND disconnect_deadline < NOW()
        FOR UPDATE
    LOOP
        v_winner_id := CASE
            WHEN v_match.disconnected_player_id = v_match.player1_id THEN v_match.player2_id
            WHEN v_match.disconnected_player_id = v_match.player2_id THEN v_match.player1_id
            ELSE NULL
        END;

        UPDATE public.matches
        SET
            status = 'finished',
            winner_id = v_winner_id,
            disconnected_player_id = NULL,
            last_move_timestamp = NOW()
        WHERE id = v_match.id;

        IF v_winner_id IS NOT NULL THEN
            PERFORM public.release_winnings(v_match.id, v_winner_id);
        END IF;
    END LOOP;
END;
$forfeit_tag$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.forfeit_match(
    p_match_id UUID,
    p_player_id UUID
) RETURNS JSONB AS $forfeit_match_tag$
DECLARE
    v_authenticated_user_id UUID;
    v_effective_player_id UUID;
    v_match RECORD;
    v_opponent_id UUID;
BEGIN
    v_authenticated_user_id := auth.uid();

    IF v_authenticated_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Unauthorized');
    END IF;

    IF p_player_id IS NOT NULL AND p_player_id <> v_authenticated_user_id THEN
        RETURN jsonb_build_object('error', 'Authenticated user mismatch');
    END IF;

    v_effective_player_id := v_authenticated_user_id;

    SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;

    IF v_match.status <> 'active' AND v_match.status <> 'reconnecting' THEN
        RETURN jsonb_build_object('error', 'Match is not active');
    END IF;

    IF v_effective_player_id <> v_match.player1_id AND v_effective_player_id <> v_match.player2_id THEN
        RETURN jsonb_build_object('error', 'Player not in match');
    END IF;

    v_opponent_id := (CASE WHEN v_match.player1_id = v_effective_player_id THEN v_match.player2_id ELSE v_match.player1_id END);

    UPDATE public.matches
    SET
        status = 'finished',
        winner_id = v_opponent_id,
        disconnected_player_id = NULL,
        last_move_timestamp = NOW()
    WHERE id = p_match_id;

    PERFORM public.release_winnings(p_match_id, v_opponent_id);

    INSERT INTO public.match_events (match_id, player_id, event_type, payload)
    VALUES (p_match_id, v_effective_player_id, 'forfeit', jsonb_build_object('forfeited_by', v_effective_player_id));

    RETURN jsonb_build_object('status', 'success', 'winner_id', v_opponent_id);
END;
$forfeit_match_tag$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.trigger_rematch(
    p_match_id UUID
) RETURNS JSONB AS $trigger_rematch_tag$
DECLARE
    v_authenticated_user_id UUID;
    v_match RECORD;
    v_new_apple_x INTEGER;
    v_new_apple_y INTEGER;
    v_other_player_id UUID;
BEGIN
    v_authenticated_user_id := auth.uid();

    IF v_authenticated_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Unauthorized');
    END IF;

    SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;

    IF v_match.status <> 'finished' THEN
        RETURN jsonb_build_object('error', 'Match not finished');
    END IF;

    IF v_authenticated_user_id <> v_match.player1_id AND v_authenticated_user_id <> v_match.player2_id THEN
        RETURN jsonb_build_object('error', 'Player not in match');
    END IF;

    v_other_player_id := CASE
        WHEN v_authenticated_user_id = v_match.player1_id THEN v_match.player2_id
        ELSE v_match.player1_id
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM public.match_events
        WHERE match_id = p_match_id
          AND event_type = 'rematch_accepted'
          AND player_id = v_authenticated_user_id
    ) OR NOT EXISTS (
        SELECT 1
        FROM public.match_events
        WHERE match_id = p_match_id
          AND event_type = 'rematch_accepted'
          AND player_id = v_other_player_id
    ) THEN
        RETURN jsonb_build_object('error', 'Both players must accept rematch');
    END IF;

    v_new_apple_x := floor(random() * 20);
    v_new_apple_y := floor(random() * 20);

    UPDATE public.matches
    SET
        player1_score = 0,
        player2_score = 0,
        player1_time_remaining = 600,
        player2_time_remaining = 600,
        status = 'active',
        winner_id = NULL,
        disconnect_deadline = NULL,
        disconnected_player_id = NULL,
        current_apple_pos = jsonb_build_object('x', v_new_apple_x, 'y', v_new_apple_y),
        last_move_timestamp = NOW(),
        created_at = NOW()
    WHERE id = p_match_id;

    RETURN jsonb_build_object('status', 'success');
END;
$trigger_rematch_tag$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.cancel_matchmaking(
    p_user_id UUID
) RETURNS JSONB AS $cancel_matchmaking_tag$
DECLARE
    v_authenticated_user_id UUID;
    v_old_entry RECORD;
BEGIN
    v_authenticated_user_id := auth.uid();

    IF v_authenticated_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Unauthorized');
    END IF;

    IF p_user_id IS NOT NULL AND p_user_id <> v_authenticated_user_id THEN
        RETURN jsonb_build_object('error', 'Authenticated user mismatch');
    END IF;

    FOR v_old_entry IN
        SELECT stake_amount
        FROM public.match_queue
        WHERE user_id = v_authenticated_user_id AND status = 'searching'
    LOOP
        PERFORM public.unlock_stake(v_authenticated_user_id, v_old_entry.stake_amount);
    END LOOP;

    DELETE FROM public.match_queue
    WHERE user_id = v_authenticated_user_id AND status = 'searching';

    RETURN jsonb_build_object('status', 'cancelled');
END;
$cancel_matchmaking_tag$ LANGUAGE plpgsql SECURITY DEFINER;

-- SECURITY DEFINER audit hardening: pin search_path to trusted schemas.
ALTER FUNCTION public.lock_stake(UUID, NUMERIC) SET search_path = public, pg_temp;
ALTER FUNCTION public.unlock_stake(UUID, NUMERIC) SET search_path = public, pg_temp;
ALTER FUNCTION public.release_winnings(UUID, UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.find_opponent(UUID, TEXT, NUMERIC) SET search_path = public, pg_temp;
ALTER FUNCTION public.validate_apple_eaten(UUID, UUID, INTEGER, INTEGER) SET search_path = public, pg_temp;
ALTER FUNCTION public.perform_game_move(UUID, UUID, JSONB) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_game_timers(UUID, UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_player_disconnection(UUID, UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_player_reconnection(UUID, UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.check_forfeits() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user_provisioning() SET search_path = public, pg_temp;
ALTER FUNCTION public.forfeit_match(UUID, UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.trigger_rematch(UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.cancel_matchmaking(UUID) SET search_path = public, pg_temp;
