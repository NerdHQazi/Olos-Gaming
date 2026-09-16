-- Phase 2: Authority Hardening
-- Goal: backend-authoritative winner resolution and canonical finalization path.

ALTER TABLE public.matches
    ADD COLUMN IF NOT EXISTS authority_resolution_reason TEXT,
    ADD COLUMN IF NOT EXISTS authority_resolution_payload JSONB,
    ADD COLUMN IF NOT EXISTS authority_resolved_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS public.match_result_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    declared_winner_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    outcome TEXT NOT NULL CHECK (outcome IN ('win', 'loss', 'draw', 'undetermined')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (match_id, player_id)
);

ALTER TABLE public.match_result_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players can view their own result submissions" ON public.match_result_submissions;
CREATE POLICY "Players can view their own result submissions" ON public.match_result_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.matches
            WHERE matches.id = match_result_submissions.match_id
              AND (matches.player1_id = auth.uid() OR matches.player2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Players can upsert their own result submission" ON public.match_result_submissions;
CREATE POLICY "Players can upsert their own result submission" ON public.match_result_submissions
    FOR INSERT WITH CHECK (
        player_id = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM public.matches
            WHERE matches.id = match_result_submissions.match_id
              AND (matches.player1_id = auth.uid() OR matches.player2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Players can update their own result submission" ON public.match_result_submissions;
CREATE POLICY "Players can update their own result submission" ON public.match_result_submissions
    FOR UPDATE USING (player_id = auth.uid())
    WITH CHECK (player_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_match_result_submissions_match_player
    ON public.match_result_submissions (match_id, player_id);

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

    IF v_match.id IS NULL THEN
        RETURN jsonb_build_object('error', 'Match not found');
    END IF;

    IF v_match.status = 'finished' THEN
        RETURN jsonb_build_object(
            'status', 'already_finished',
            'winner_id', v_match.winner_id,
            'reason', v_match.authority_resolution_reason
        );
    END IF;

    IF v_match.status <> 'active' AND v_match.status <> 'reconnecting' THEN
        RETURN jsonb_build_object('error', 'Match is not resolvable');
    END IF;

    IF p_winner_id IS NOT NULL
       AND p_winner_id <> v_match.player1_id
       AND p_winner_id <> v_match.player2_id THEN
        RETURN jsonb_build_object('error', 'Winner must be a participant');
    END IF;

    UPDATE public.matches
    SET
        status = 'finished',
        winner_id = p_winner_id,
        disconnected_player_id = NULL,
        disconnect_deadline = NULL,
        authority_resolution_reason = p_resolution_reason,
        authority_resolution_payload = COALESCE(p_resolution_payload, '{}'::jsonb),
        authority_resolved_at = NOW(),
        last_move_timestamp = NOW()
    WHERE id = p_match_id;

    IF p_winner_id IS NOT NULL THEN
        PERFORM public.release_winnings(p_match_id, p_winner_id);
    END IF;

    INSERT INTO public.match_events (match_id, player_id, event_type, payload)
    VALUES (
        p_match_id,
        COALESCE(p_winner_id, v_match.player1_id),
        'authoritative_result',
        jsonb_build_object(
            'winner_id', p_winner_id,
            'reason', p_resolution_reason,
            'resolved_at', NOW(),
            'resolution_payload', COALESCE(p_resolution_payload, '{}'::jsonb)
        )
    );

    RETURN jsonb_build_object(
        'status', 'resolved',
        'winner_id', p_winner_id,
        'reason', p_resolution_reason
    );
END;
$finalize_tag$ LANGUAGE plpgsql SECURITY DEFINER;

-- Internal-only authority helper.
REVOKE EXECUTE ON FUNCTION public.finalize_match_outcome(UUID, UUID, TEXT, JSONB) FROM PUBLIC;

DO $revoke_finalize_anon$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.finalize_match_outcome(UUID, UUID, TEXT, JSONB) FROM anon';
    END IF;
END;
$revoke_finalize_anon$;

DO $revoke_finalize_authenticated$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.finalize_match_outcome(UUID, UUID, TEXT, JSONB) FROM authenticated';
    END IF;
END;
$revoke_finalize_authenticated$;

CREATE OR REPLACE FUNCTION public.submit_match_result(
    p_match_id UUID,
    p_player_id UUID,
    p_result JSONB
) RETURNS JSONB AS $submit_result_tag$
DECLARE
    v_authenticated_user_id UUID;
    v_effective_player_id UUID;
    v_match RECORD;
    v_declared_winner_id UUID;
    v_outcome TEXT;
    v_submission_count INTEGER;
    v_p1_submission RECORD;
    v_p2_submission RECORD;
    v_server_winner UUID;
    v_resolution_reason TEXT;
    v_resolution_payload JSONB;
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

    IF v_match.id IS NULL THEN
        RETURN jsonb_build_object('error', 'Match not found');
    END IF;

    IF v_effective_player_id <> v_match.player1_id AND v_effective_player_id <> v_match.player2_id THEN
        RETURN jsonb_build_object('error', 'Player not in match');
    END IF;

    IF v_match.status = 'finished' THEN
        RETURN jsonb_build_object(
            'status', 'already_finished',
            'winner_id', v_match.winner_id,
            'reason', v_match.authority_resolution_reason
        );
    END IF;

    IF v_match.status <> 'active' AND v_match.status <> 'reconnecting' THEN
        RETURN jsonb_build_object('error', 'Match is not resolvable');
    END IF;

    BEGIN
        v_declared_winner_id := NULLIF(p_result->>'declared_winner_id', '')::UUID;
    EXCEPTION WHEN invalid_text_representation THEN
        RETURN jsonb_build_object('error', 'Invalid declared_winner_id');
    END;

    v_outcome := LOWER(COALESCE(p_result->>'outcome', 'undetermined'));

    IF v_outcome NOT IN ('win', 'loss', 'draw', 'undetermined') THEN
        RETURN jsonb_build_object('error', 'Invalid outcome');
    END IF;

    IF v_declared_winner_id IS NOT NULL
       AND v_declared_winner_id <> v_match.player1_id
       AND v_declared_winner_id <> v_match.player2_id THEN
        RETURN jsonb_build_object('error', 'declared_winner_id must be a participant');
    END IF;

    INSERT INTO public.match_result_submissions (
        match_id,
        player_id,
        declared_winner_id,
        outcome,
        payload,
        submitted_at
    ) VALUES (
        p_match_id,
        v_effective_player_id,
        v_declared_winner_id,
        v_outcome,
        COALESCE(p_result, '{}'::jsonb),
        NOW()
    )
    ON CONFLICT (match_id, player_id)
    DO UPDATE SET
        declared_winner_id = EXCLUDED.declared_winner_id,
        outcome = EXCLUDED.outcome,
        payload = EXCLUDED.payload,
        submitted_at = NOW();

    SELECT count(*)::int
    INTO v_submission_count
    FROM public.match_result_submissions
    WHERE match_id = p_match_id;

    IF v_submission_count < 2 THEN
        RETURN jsonb_build_object('status', 'awaiting_opponent_submission');
    END IF;

    SELECT * INTO v_p1_submission
    FROM public.match_result_submissions
    WHERE match_id = p_match_id
      AND player_id = v_match.player1_id;

    SELECT * INTO v_p2_submission
    FROM public.match_result_submissions
    WHERE match_id = p_match_id
      AND player_id = v_match.player2_id;

    IF v_p1_submission.id IS NULL OR v_p2_submission.id IS NULL THEN
        RETURN jsonb_build_object('status', 'awaiting_opponent_submission');
    END IF;

    -- Deterministic backend rule set.
    IF v_p1_submission.declared_winner_id IS NOT NULL
       AND v_p1_submission.declared_winner_id = v_p2_submission.declared_winner_id THEN
        v_server_winner := v_p1_submission.declared_winner_id;
        v_resolution_reason := 'dual_submission_agreement';
    ELSIF v_p1_submission.outcome = 'draw' AND v_p2_submission.outcome = 'draw' THEN
        v_server_winner := NULL;
        v_resolution_reason := 'dual_submission_draw';
    ELSIF v_match.player1_score > v_match.player2_score THEN
        v_server_winner := v_match.player1_id;
        v_resolution_reason := 'server_score_tiebreak';
    ELSIF v_match.player2_score > v_match.player1_score THEN
        v_server_winner := v_match.player2_id;
        v_resolution_reason := 'server_score_tiebreak';
    ELSIF v_match.player1_time_remaining <= 0 AND v_match.player2_time_remaining > 0 THEN
        v_server_winner := v_match.player2_id;
        v_resolution_reason := 'server_timer_tiebreak';
    ELSIF v_match.player2_time_remaining <= 0 AND v_match.player1_time_remaining > 0 THEN
        v_server_winner := v_match.player1_id;
        v_resolution_reason := 'server_timer_tiebreak';
    ELSE
        v_server_winner := NULL;
        v_resolution_reason := 'unresolved_conflict_draw';
    END IF;

    v_resolution_payload := jsonb_build_object(
        'player1_submission', to_jsonb(v_p1_submission),
        'player2_submission', to_jsonb(v_p2_submission)
    );

    RETURN public.finalize_match_outcome(
        p_match_id,
        v_server_winner,
        v_resolution_reason,
        v_resolution_payload
    );
END;
$submit_result_tag$ LANGUAGE plpgsql SECURITY DEFINER;

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
        INSERT INTO public.match_events (match_id, player_id, event_type, payload)
        VALUES (
            p_match_id,
            v_effective_player_id,
            'client_finish_claim',
            jsonb_build_object('claim', p_move_data)
        );
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

        PERFORM public.finalize_match_outcome(
            v_match.id,
            v_winner_id,
            'disconnect_forfeit',
            jsonb_build_object('disconnected_player_id', v_match.disconnected_player_id)
        );
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

    PERFORM public.finalize_match_outcome(
        p_match_id,
        v_opponent_id,
        'player_forfeit',
        jsonb_build_object('forfeited_by', v_effective_player_id)
    );

    INSERT INTO public.match_events (match_id, player_id, event_type, payload)
    VALUES (p_match_id, v_effective_player_id, 'forfeit', jsonb_build_object('forfeited_by', v_effective_player_id));

    RETURN jsonb_build_object('status', 'success', 'winner_id', v_opponent_id);
END;
$forfeit_match_tag$ LANGUAGE plpgsql SECURITY DEFINER;

-- Retire insecure legacy overload. Only the authenticated actor signature remains.
DROP FUNCTION IF EXISTS public.update_game_timers(UUID);

-- check_forfeits is system-only.
REVOKE EXECUTE ON FUNCTION public.check_forfeits() FROM PUBLIC;

DO $revoke_check_forfeits_anon$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.check_forfeits() FROM anon';
    END IF;
END;
$revoke_check_forfeits_anon$;

DO $revoke_check_forfeits_authenticated$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.check_forfeits() FROM authenticated';
    END IF;
END;
$revoke_check_forfeits_authenticated$;

DO $grant_check_forfeits_service_role$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.check_forfeits() TO service_role';
    END IF;
END;
$grant_check_forfeits_service_role$;

ALTER FUNCTION public.finalize_match_outcome(UUID, UUID, TEXT, JSONB) SET search_path = public, pg_temp;
ALTER FUNCTION public.submit_match_result(UUID, UUID, JSONB) SET search_path = public, pg_temp;
ALTER FUNCTION public.perform_game_move(UUID, UUID, JSONB) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_game_timers(UUID, UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.check_forfeits() SET search_path = public, pg_temp;
ALTER FUNCTION public.forfeit_match(UUID, UUID) SET search_path = public, pg_temp;
