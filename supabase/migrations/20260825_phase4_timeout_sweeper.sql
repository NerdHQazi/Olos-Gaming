-- Phase 4: Automated Match Timeout and Disconnect Handling Sweeper
-- Migration: 20260825_phase4_timeout_sweeper.sql
--
-- Introduces public.sweep_expired_matches(p_batch_limit INT) for reliable,
-- concurrency-safe, multi-instance timeout sweeping using SELECT FOR UPDATE SKIP LOCKED.
-- Covers:
--  1. Expired disconnect grace periods (status = 'reconnecting' AND disconnect_deadline < NOW())
--  2. Stalled pending terminal resolutions (status = 'active' AND resolution_state = 'pending')
--  3. Active turn timeouts (status = 'active' with exhausted turn or snake clocks)
--  4. First-move abandonment (status = 'active' AND game_move_number = 0 after 15m)
-- Updates check_forfeits() to delegate to sweep_expired_matches() for backward compatibility.

-- 1. Create partial index for stalled pending terminal resolutions
CREATE INDEX IF NOT EXISTS idx_matches_active_pending_resolution
    ON public.matches (last_move_timestamp)
    WHERE status = 'active' AND resolution_state = 'pending';

-- 2. Create index for active match sweep queries
CREATE INDEX IF NOT EXISTS idx_matches_active_sweep
    ON public.matches (status, resolution_state, last_move_timestamp);

-- 3. Comprehensive sweeper function
CREATE OR REPLACE FUNCTION public.sweep_expired_matches(
    p_batch_limit INT DEFAULT 25
) RETURNS JSONB AS $sweeper_tag$
DECLARE

    v_limit INT;
    v_match RECORD;
    v_winner_id UUID;
    v_reason TEXT;
    v_payload JSONB;
    v_swept_count INT := 0;
    v_disconnect_forfeits INT := 0;
    v_turn_timeouts INT := 0;
    v_terminal_resolutions INT := 0;
    v_first_move_abandonments INT := 0;
    v_swept_match_ids UUID[] := ARRAY[]::UUID[];
    v_res JSONB;
BEGIN
    -- Clamp batch limit to reasonable bounds [1, 100]
    v_limit := GREATEST(1, LEAST(COALESCE(p_batch_limit, 25), 100));

    ----------------------------------------------------------------------------
    -- 1. Expired Disconnect Grace Periods
    ----------------------------------------------------------------------------
    FOR v_match IN
        SELECT id, player1_id, player2_id, disconnected_player_id, stake_amount
        FROM public.matches
        WHERE status = 'reconnecting'
          AND disconnect_deadline IS NOT NULL
          AND disconnect_deadline < NOW()
        ORDER BY disconnect_deadline ASC
        FOR UPDATE SKIP LOCKED
        LIMIT v_limit
    LOOP
        v_winner_id := CASE
            WHEN v_match.disconnected_player_id = v_match.player1_id THEN v_match.player2_id
            WHEN v_match.disconnected_player_id = v_match.player2_id THEN v_match.player1_id
            ELSE NULL
        END;

        v_res := public.finalize_match_outcome(
            v_match.id,
            v_winner_id,
            'disconnect_forfeit',
            jsonb_build_object(
                'disconnected_player_id', v_match.disconnected_player_id,
                'swept_at', NOW()
            )
        );

        IF v_res->>'status' = 'resolved' THEN
            v_swept_count := v_swept_count + 1;
            v_disconnect_forfeits := v_disconnect_forfeits + 1;
            v_swept_match_ids := array_append(v_swept_match_ids, v_match.id);
        END IF;

        IF v_swept_count >= v_limit THEN
            EXIT;
        END IF;
    END LOOP;

    ----------------------------------------------------------------------------
    -- 2. Stalled Pending Terminal Resolutions
    ----------------------------------------------------------------------------
    IF v_swept_count < v_limit THEN
        FOR v_match IN
            SELECT id, player1_id, player2_id, terminal_winner_id, terminal_reason, stake_amount
            FROM public.matches
            WHERE status = 'active'
              AND resolution_state = 'pending'
              AND last_move_timestamp IS NOT NULL
              AND last_move_timestamp < NOW() - INTERVAL '45 seconds'
            ORDER BY last_move_timestamp ASC
            FOR UPDATE SKIP LOCKED
            LIMIT (v_limit - v_swept_count)
        LOOP
            v_res := public.finalize_match_outcome(
                v_match.id,
                v_match.terminal_winner_id,
                v_match.terminal_reason,
                jsonb_build_object(
                    'auto_finalized_from_pending', true,
                    'swept_at', NOW()
                )
            );

            IF v_res->>'status' = 'resolved' THEN
                v_swept_count := v_swept_count + 1;
                v_terminal_resolutions := v_terminal_resolutions + 1;
                v_swept_match_ids := array_append(v_swept_match_ids, v_match.id);
            END IF;

            IF v_swept_count >= v_limit THEN
                EXIT;
            END IF;
        END LOOP;
    END IF;

    ----------------------------------------------------------------------------
    -- 3. Active Turn Timeouts (Clocks Exhausted)
    ----------------------------------------------------------------------------
    IF v_swept_count < v_limit THEN
        FOR v_match IN
            SELECT id, player1_id, player2_id, game_type, current_turn,
                   player1_time_remaining, player2_time_remaining,
                   player1_score, player2_score, last_move_timestamp
            FROM public.matches
            WHERE status = 'active'
              AND resolution_state = 'none'
              AND (game_move_number > 0 OR game_type = 'snake')
              AND last_move_timestamp IS NOT NULL
              AND (
                  (game_type = 'snake' AND NOW() >= last_move_timestamp + (LEAST(COALESCE(player1_time_remaining, 0), COALESCE(player2_time_remaining, 0)) * INTERVAL '1 second'))
                  OR
                  (game_type <> 'snake' AND current_turn = player1_id AND NOW() >= last_move_timestamp + (COALESCE(player1_time_remaining, 0) * INTERVAL '1 second'))
                  OR
                  (game_type <> 'snake' AND current_turn = player2_id AND NOW() >= last_move_timestamp + (COALESCE(player2_time_remaining, 0) * INTERVAL '1 second'))
              )
            ORDER BY last_move_timestamp ASC
            FOR UPDATE SKIP LOCKED
            LIMIT (v_limit - v_swept_count)
        LOOP
            IF v_match.game_type = 'snake' THEN
                v_winner_id := CASE
                    WHEN v_match.player1_score > v_match.player2_score THEN v_match.player1_id
                    WHEN v_match.player2_score > v_match.player1_score THEN v_match.player2_id
                    ELSE NULL
                END;
                v_reason := 'timer_expired';
                v_payload := jsonb_build_object(
                    'p1_score', v_match.player1_score,
                    'p2_score', v_match.player2_score,
                    'swept_at', NOW()
                );
            ELSE
                v_winner_id := CASE
                    WHEN v_match.current_turn = v_match.player1_id THEN v_match.player2_id
                    ELSE v_match.player1_id
                END;
                v_reason := 'timeout';
                v_payload := jsonb_build_object(
                    'timed_out_player_id', v_match.current_turn,
                    'swept_at', NOW()
                );
            END IF;

            -- Update time remaining on match to zero for timed-out participant
            UPDATE public.matches
            SET player1_time_remaining = CASE WHEN v_match.current_turn = v_match.player1_id OR v_match.game_type = 'snake' THEN 0 ELSE player1_time_remaining END,
                player2_time_remaining = CASE WHEN v_match.current_turn = v_match.player2_id OR v_match.game_type = 'snake' THEN 0 ELSE player2_time_remaining END
            WHERE id = v_match.id;

            v_res := public.finalize_match_outcome(
                v_match.id,
                v_winner_id,
                v_reason,
                v_payload
            );

            IF v_res->>'status' = 'resolved' THEN
                v_swept_count := v_swept_count + 1;
                v_turn_timeouts := v_turn_timeouts + 1;
                v_swept_match_ids := array_append(v_swept_match_ids, v_match.id);
            END IF;

            IF v_swept_count >= v_limit THEN
                EXIT;
            END IF;
        END LOOP;
    END IF;

    ----------------------------------------------------------------------------
    -- 4. First-Move Abandonment (No moves played after 15 minutes)
    ----------------------------------------------------------------------------
    IF v_swept_count < v_limit THEN
        FOR v_match IN
            SELECT id, player1_id, player2_id, created_at, stake_amount
            FROM public.matches
            WHERE status = 'active'
              AND resolution_state = 'none'
              AND game_move_number = 0
              AND game_type <> 'snake'
              AND created_at < NOW() - INTERVAL '15 minutes'
            ORDER BY created_at ASC
            FOR UPDATE SKIP LOCKED
            LIMIT (v_limit - v_swept_count)
        LOOP
            -- Settle as refund draw (winner_id = NULL) so both players' locked stakes return
            v_res := public.finalize_match_outcome(
                v_match.id,
                NULL,
                'abandoned_first_move',
                jsonb_build_object(
                    'reason', 'match_abandoned_before_first_move',
                    'created_at', v_match.created_at,
                    'swept_at', NOW()
                )
            );

            IF v_res->>'status' = 'resolved' THEN
                v_swept_count := v_swept_count + 1;
                v_first_move_abandonments := v_first_move_abandonments + 1;
                v_swept_match_ids := array_append(v_swept_match_ids, v_match.id);
            END IF;

            IF v_swept_count >= v_limit THEN
                EXIT;
            END IF;
        END LOOP;
    END IF;

    RETURN jsonb_build_object(
        'status', 'success',
        'swept_count', v_swept_count,
        'disconnect_forfeits', v_disconnect_forfeits,
        'terminal_resolutions', v_terminal_resolutions,
        'turn_timeouts', v_turn_timeouts,
        'first_move_abandonments', v_first_move_abandonments,
        'swept_match_ids', to_jsonb(v_swept_match_ids)
    );
END;
$sweeper_tag$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Backward-compatible check_forfeits delegation
CREATE OR REPLACE FUNCTION public.check_forfeits()
RETURNS VOID AS $forfeit_tag$
BEGIN
    PERFORM public.sweep_expired_matches(50);
END;
$forfeit_tag$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Privileges and search path hardening
REVOKE EXECUTE ON FUNCTION public.sweep_expired_matches(INTEGER) FROM PUBLIC;

DO $revoke_sweeper_anon$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.sweep_expired_matches(INTEGER) FROM anon';
    END IF;
END;
$revoke_sweeper_anon$;

DO $revoke_sweeper_authenticated$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.sweep_expired_matches(INTEGER) FROM authenticated';
    END IF;
END;
$revoke_sweeper_authenticated$;

DO $grant_sweeper_service_role$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.sweep_expired_matches(INTEGER) TO service_role';
    END IF;
END;
$grant_sweeper_service_role$;

ALTER FUNCTION public.sweep_expired_matches(INTEGER) SET search_path = public, pg_temp;
ALTER FUNCTION public.check_forfeits() SET search_path = public, pg_temp;
