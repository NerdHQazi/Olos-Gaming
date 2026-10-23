-- Phase 2: trusted move application and authoritative result finalization.
-- This is a replacement for the un-applied original 20260814 migration.

ALTER TABLE public.matches
    ADD COLUMN IF NOT EXISTS game_move_number INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS resolution_state TEXT NOT NULL DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS authoritative_gameplay_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS terminal_position_hash TEXT,
    ADD COLUMN IF NOT EXISTS terminal_move_number INTEGER,
    ADD COLUMN IF NOT EXISTS terminal_reason TEXT,
    ADD COLUMN IF NOT EXISTS terminal_winner_id UUID REFERENCES auth.users(id);

ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_resolution_state_check;
ALTER TABLE public.matches
    ADD CONSTRAINT matches_resolution_state_check
    CHECK (resolution_state IN ('none', 'pending', 'resolved'));

ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_terminal_winner_is_participant;
ALTER TABLE public.matches
    ADD CONSTRAINT matches_terminal_winner_is_participant
    CHECK (
        terminal_winner_id IS NULL
        OR terminal_winner_id = player1_id
        OR terminal_winner_id = player2_id
    );

-- Existing active boards were produced by the legacy client-trusting move path.
-- Let pre-game matches start with the authoritative engine, but require legacy
-- in-progress matches to finish through their existing path.
UPDATE public.matches
SET authoritative_gameplay_enabled = FALSE
WHERE status = 'active'
    AND board_state IS NOT NULL;

-- Receipt rows are server-authored audit evidence. Participants may read them,
-- but must use submit_match_result rather than write this table directly.
DROP POLICY IF EXISTS "Players can upsert their own result submission" ON public.match_result_submissions;
DROP POLICY IF EXISTS "Players can update their own result submission" ON public.match_result_submissions;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.match_result_submissions FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.apply_validated_game_move(
    p_match_id UUID,
    p_player_id UUID,
    p_expected_move_number INTEGER,
    p_board_state JSONB,
    p_next_turn UUID,
    p_terminal_reason TEXT DEFAULT NULL,
    p_terminal_winner_id UUID DEFAULT NULL,
    p_terminal_position_hash TEXT DEFAULT NULL,
    p_move_payload JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $apply_validated_move_tag$
DECLARE
    v_match RECORD;
    v_is_terminal BOOLEAN;
BEGIN
    SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;

    IF v_match.id IS NULL THEN RETURN jsonb_build_object('error', 'Match not found'); END IF;
    IF v_match.status <> 'active' OR v_match.resolution_state <> 'none' THEN
        RETURN jsonb_build_object('error', 'Match is not accepting moves');
    END IF;
    IF NOT v_match.authoritative_gameplay_enabled THEN
        RETURN jsonb_build_object('error', 'Legacy match cannot enter authoritative gameplay');
    END IF;
    IF p_player_id <> v_match.player1_id AND p_player_id <> v_match.player2_id THEN
        RETURN jsonb_build_object('error', 'Player not in match');
    END IF;
    IF v_match.current_turn <> p_player_id THEN RETURN jsonb_build_object('error', 'Not your turn'); END IF;
    IF p_expected_move_number <> v_match.game_move_number THEN
        RETURN jsonb_build_object('error', 'Stale move', 'move_number', v_match.game_move_number);
    END IF;

    v_is_terminal := p_terminal_reason IS NOT NULL;
    IF v_is_terminal AND (p_terminal_position_hash IS NULL OR p_terminal_reason NOT IN ('chess_checkmate', 'chess_stalemate', 'checkers_no_legal_moves')) THEN
        RETURN jsonb_build_object('error', 'Invalid terminal result');
    END IF;
    IF NOT v_is_terminal AND p_next_turn = p_player_id THEN
        RETURN jsonb_build_object('error', 'Next turn must change after a complete move');
    END IF;
    IF NOT v_is_terminal AND p_next_turn <> v_match.player1_id AND p_next_turn <> v_match.player2_id THEN
        RETURN jsonb_build_object('error', 'Invalid next turn');
    END IF;
    IF p_terminal_winner_id IS NOT NULL AND p_terminal_winner_id <> v_match.player1_id AND p_terminal_winner_id <> v_match.player2_id THEN
        RETURN jsonb_build_object('error', 'Terminal winner must be a participant');
    END IF;

    UPDATE public.matches
    SET
        board_state = p_board_state,
        current_turn = CASE WHEN v_is_terminal THEN current_turn ELSE p_next_turn END,
        game_move_number = game_move_number + 1,
        resolution_state = CASE WHEN v_is_terminal THEN 'pending' ELSE 'none' END,
        terminal_position_hash = CASE WHEN v_is_terminal THEN p_terminal_position_hash ELSE NULL END,
        terminal_move_number = CASE WHEN v_is_terminal THEN game_move_number + 1 ELSE NULL END,
        terminal_reason = CASE WHEN v_is_terminal THEN p_terminal_reason ELSE NULL END,
        terminal_winner_id = CASE WHEN v_is_terminal THEN p_terminal_winner_id ELSE NULL END,
        last_move_timestamp = NOW()
    WHERE id = p_match_id;

    INSERT INTO public.match_events (match_id, player_id, event_type, payload)
    VALUES (
        p_match_id,
        p_player_id,
        CASE WHEN v_is_terminal THEN 'validated_terminal_move' ELSE 'validated_move' END,
        COALESCE(p_move_payload, '{}'::jsonb) || jsonb_build_object(
            'move_number', v_match.game_move_number + 1,
            'terminal_reason', p_terminal_reason
        )
    );

    RETURN jsonb_build_object(
        'status', CASE WHEN v_is_terminal THEN 'resolution_pending' ELSE 'moved' END,
        'move_number', v_match.game_move_number + 1,
        'resolution_state', CASE WHEN v_is_terminal THEN 'pending' ELSE 'none' END,
        'terminal_position_hash', p_terminal_position_hash,
        'terminal_reason', p_terminal_reason
    );
END;
$apply_validated_move_tag$ LANGUAGE plpgsql SECURITY DEFINER;

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
        status = 'finished', winner_id = p_winner_id, resolution_state = 'resolved',
        disconnected_player_id = NULL, disconnect_deadline = NULL,
        authority_resolution_reason = p_resolution_reason,
        authority_resolution_payload = COALESCE(p_resolution_payload, '{}'::jsonb),
        authority_resolved_at = NOW(), last_move_timestamp = NOW()
    WHERE id = p_match_id;

    IF p_winner_id IS NOT NULL THEN PERFORM public.release_winnings(p_match_id, p_winner_id); END IF;

    INSERT INTO public.match_events (match_id, player_id, event_type, payload)
    VALUES (
        p_match_id, COALESCE(p_winner_id, v_match.player1_id), 'authoritative_result',
        jsonb_build_object(
            'winner_id', p_winner_id, 'reason', p_resolution_reason,
            'resolved_at', NOW(), 'resolution_payload', COALESCE(p_resolution_payload, '{}'::jsonb)
        )
    );

    RETURN jsonb_build_object('status', 'resolved', 'winner_id', p_winner_id, 'reason', p_resolution_reason);
END;
$finalize_tag$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.submit_match_result(
    p_match_id UUID,
    p_player_id UUID,
    p_result JSONB
) RETURNS JSONB AS $submit_result_tag$
DECLARE
    v_authenticated_user_id UUID;
    v_match RECORD;
    v_hash TEXT;
    v_move_number INTEGER;
    v_derived_outcome TEXT;
BEGIN
    v_authenticated_user_id := auth.uid();
    IF v_authenticated_user_id IS NULL THEN RETURN jsonb_build_object('error', 'Unauthorized'); END IF;
    IF p_player_id IS NOT NULL AND p_player_id <> v_authenticated_user_id THEN
        RETURN jsonb_build_object('error', 'Authenticated user mismatch');
    END IF;

    SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;
    IF v_match.id IS NULL THEN RETURN jsonb_build_object('error', 'Match not found'); END IF;
    IF v_authenticated_user_id <> v_match.player1_id AND v_authenticated_user_id <> v_match.player2_id THEN
        RETURN jsonb_build_object('error', 'Player not in match');
    END IF;
    IF v_match.status = 'finished' THEN
        RETURN jsonb_build_object('status', 'already_finished', 'winner_id', v_match.winner_id, 'reason', v_match.authority_resolution_reason);
    END IF;
    IF v_match.status <> 'active' OR v_match.resolution_state <> 'pending' THEN
        RETURN jsonb_build_object('error', 'Match is not awaiting result receipt');
    END IF;

    v_hash := p_result->>'terminal_position_hash';
    BEGIN
        v_move_number := (p_result->>'terminal_move_number')::INTEGER;
    EXCEPTION WHEN invalid_text_representation THEN
        RETURN jsonb_build_object('error', 'Invalid terminal_move_number');
    END;
    IF v_hash IS NULL OR v_hash <> v_match.terminal_position_hash OR v_move_number IS NULL OR v_move_number <> v_match.terminal_move_number THEN
        RETURN jsonb_build_object('error', 'Terminal receipt does not match server state');
    END IF;

    v_derived_outcome := CASE
        WHEN v_match.terminal_winner_id IS NULL THEN 'draw'
        WHEN v_match.terminal_winner_id = v_authenticated_user_id THEN 'win'
        ELSE 'loss'
    END;

    INSERT INTO public.match_result_submissions (match_id, player_id, declared_winner_id, outcome, payload, submitted_at)
    VALUES (p_match_id, v_authenticated_user_id, v_match.terminal_winner_id, v_derived_outcome, COALESCE(p_result, '{}'::jsonb), NOW())
    ON CONFLICT (match_id, player_id) DO UPDATE SET
        declared_winner_id = EXCLUDED.declared_winner_id, outcome = EXCLUDED.outcome,
        payload = EXCLUDED.payload, submitted_at = NOW();

    RETURN public.finalize_match_outcome(
        p_match_id, v_match.terminal_winner_id, v_match.terminal_reason,
        jsonb_build_object(
            'terminal_position_hash', v_match.terminal_position_hash,
            'terminal_move_number', v_match.terminal_move_number,
            'submitted_by', v_authenticated_user_id
        )
    );
END;
$submit_result_tag$ LANGUAGE plpgsql SECURITY DEFINER;

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
    IF v_authenticated_user_id IS NULL THEN RETURN jsonb_build_object('error', 'Unauthorized'); END IF;
    IF p_actor_id IS NOT NULL AND p_actor_id <> v_authenticated_user_id THEN
        RETURN jsonb_build_object('error', 'Authenticated user mismatch');
    END IF;
    v_effective_player_id := v_authenticated_user_id;

    SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;
    IF v_match.status <> 'active' THEN RETURN jsonb_build_object('error', 'Match not active'); END IF;
    IF v_effective_player_id <> v_match.player1_id AND v_effective_player_id <> v_match.player2_id THEN
        RETURN jsonb_build_object('error', 'Player not in match');
    END IF;
    IF v_match.resolution_state = 'pending' THEN
        RETURN jsonb_build_object('status', 'resolution_pending');
    END IF;

    v_elapsed_seconds := EXTRACT(EPOCH FROM (NOW() - v_match.last_move_timestamp))::int;
    IF v_elapsed_seconds < 1 THEN RETURN jsonb_build_object('status', 'no_change'); END IF;
    v_p1_new_time := v_match.player1_time_remaining;
    v_p2_new_time := v_match.player2_time_remaining;

    IF v_match.game_type = 'snake' THEN
        v_p1_new_time := v_p1_new_time - v_elapsed_seconds;
        v_p2_new_time := v_p2_new_time - v_elapsed_seconds;
    ELSIF v_match.current_turn = v_match.player1_id THEN
        v_p1_new_time := v_p1_new_time - v_elapsed_seconds;
    ELSE
        v_p2_new_time := v_p2_new_time - v_elapsed_seconds;
    END IF;

    IF v_p1_new_time <= 0 OR v_p2_new_time <= 0 THEN
        IF v_match.game_type = 'snake' THEN
            v_timeout_winner := CASE
                WHEN v_match.player1_score > v_match.player2_score THEN v_match.player1_id
                WHEN v_match.player2_score > v_match.player1_score THEN v_match.player2_id
                ELSE NULL
            END;
        ELSE
            v_timeout_winner := CASE WHEN v_p1_new_time <= 0 THEN v_match.player2_id ELSE v_match.player1_id END;
        END IF;

        UPDATE public.matches
        SET player1_time_remaining = GREATEST(0, v_p1_new_time),
            player2_time_remaining = GREATEST(0, v_p2_new_time)
        WHERE id = p_match_id;

        RETURN public.finalize_match_outcome(
            p_match_id,
            v_timeout_winner,
            CASE WHEN v_match.game_type = 'snake' THEN 'timer_expired' ELSE 'timeout' END,
            jsonb_build_object('p1_time', GREATEST(0, v_p1_new_time), 'p2_time', GREATEST(0, v_p2_new_time))
        );
    END IF;

    UPDATE public.matches
    SET player1_time_remaining = v_p1_new_time,
        player2_time_remaining = v_p2_new_time,
        last_move_timestamp = NOW()
    WHERE id = p_match_id;
    RETURN jsonb_build_object('status', 'updated', 'p1_time', v_p1_new_time, 'p2_time', v_p2_new_time);
END;
$timer_update_tag$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.forfeit_match(
    p_match_id UUID,
    p_player_id UUID
) RETURNS JSONB AS $forfeit_match_tag$
DECLARE
    v_authenticated_user_id UUID;
    v_match RECORD;
    v_opponent_id UUID;
BEGIN
    v_authenticated_user_id := auth.uid();
    IF v_authenticated_user_id IS NULL THEN RETURN jsonb_build_object('error', 'Unauthorized'); END IF;
    IF p_player_id IS NOT NULL AND p_player_id <> v_authenticated_user_id THEN
        RETURN jsonb_build_object('error', 'Authenticated user mismatch');
    END IF;

    SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;
    IF v_match.status <> 'active' AND v_match.status <> 'reconnecting' THEN RETURN jsonb_build_object('error', 'Match is not active'); END IF;
    IF v_authenticated_user_id <> v_match.player1_id AND v_authenticated_user_id <> v_match.player2_id THEN
        RETURN jsonb_build_object('error', 'Player not in match');
    END IF;
    IF v_match.resolution_state = 'pending' THEN RETURN jsonb_build_object('status', 'resolution_pending'); END IF;

    v_opponent_id := CASE WHEN v_match.player1_id = v_authenticated_user_id THEN v_match.player2_id ELSE v_match.player1_id END;
    PERFORM public.finalize_match_outcome(
        p_match_id, v_opponent_id, 'player_forfeit', jsonb_build_object('forfeited_by', v_authenticated_user_id)
    );
    INSERT INTO public.match_events (match_id, player_id, event_type, payload)
    VALUES (p_match_id, v_authenticated_user_id, 'forfeit', jsonb_build_object('forfeited_by', v_authenticated_user_id));
    RETURN jsonb_build_object('status', 'success', 'winner_id', v_opponent_id);
END;
$forfeit_match_tag$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_player_disconnection(
    p_match_id UUID,
    p_player_id UUID
) RETURNS JSONB AS $disconnection_tag$
DECLARE
    v_authenticated_user_id UUID;
    v_match RECORD;
BEGIN
    v_authenticated_user_id := auth.uid();
    IF v_authenticated_user_id IS NULL THEN RETURN jsonb_build_object('error', 'Unauthorized'); END IF;
    IF p_player_id IS NOT NULL AND p_player_id <> v_authenticated_user_id THEN
        RETURN jsonb_build_object('error', 'Authenticated user mismatch');
    END IF;

    SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;
    IF v_match.id IS NULL THEN RETURN jsonb_build_object('error', 'Match not found'); END IF;
    IF v_authenticated_user_id <> v_match.player1_id AND v_authenticated_user_id <> v_match.player2_id THEN
        RETURN jsonb_build_object('error', 'Player not in match');
    END IF;
    IF v_match.resolution_state = 'pending' THEN RETURN jsonb_build_object('status', 'resolution_pending'); END IF;

    UPDATE public.matches
    SET status = 'reconnecting',
        disconnect_deadline = NOW() + INTERVAL '60 seconds',
        disconnected_player_id = v_authenticated_user_id
    WHERE id = p_match_id AND status = 'active';
    RETURN jsonb_build_object('status', 'reconnecting', 'deadline', NOW() + INTERVAL '60 seconds');
END;
$disconnection_tag$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.apply_validated_game_move(UUID, UUID, INTEGER, JSONB, UUID, TEXT, UUID, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.perform_game_move(UUID, UUID, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.finalize_match_outcome(UUID, UUID, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_match_result(UUID, UUID, JSONB) TO authenticated;

DO $grant_validated_move_service_role$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.apply_validated_game_move(UUID, UUID, INTEGER, JSONB, UUID, TEXT, UUID, TEXT, JSONB) TO service_role';
    END IF;
END;
$grant_validated_move_service_role$;

ALTER FUNCTION public.apply_validated_game_move(UUID, UUID, INTEGER, JSONB, UUID, TEXT, UUID, TEXT, JSONB) SET search_path = public, pg_temp;
ALTER FUNCTION public.finalize_match_outcome(UUID, UUID, TEXT, JSONB) SET search_path = public, pg_temp;
ALTER FUNCTION public.submit_match_result(UUID, UUID, JSONB) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_game_timers(UUID, UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.forfeit_match(UUID, UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_player_disconnection(UUID, UUID) SET search_path = public, pg_temp;
