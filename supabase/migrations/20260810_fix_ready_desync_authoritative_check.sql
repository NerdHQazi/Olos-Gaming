CREATE OR REPLACE FUNCTION public.are_both_players_ready(
    p_match_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $are_both_players_ready$
DECLARE
    v_authenticated_user_id UUID;
    v_is_participant BOOLEAN;
    v_ready_count INTEGER;
BEGIN
    v_authenticated_user_id := auth.uid();

    IF v_authenticated_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM public.matches m
        WHERE m.id = p_match_id
          AND (m.player1_id = v_authenticated_user_id OR m.player2_id = v_authenticated_user_id)
    ) INTO v_is_participant;

    IF NOT v_is_participant THEN
        RETURN FALSE;
    END IF;

    SELECT COUNT(DISTINCT me.player_id)
    INTO v_ready_count
    FROM public.match_events me
    WHERE me.match_id = p_match_id
      AND me.event_type = 'ready';

    RETURN v_ready_count >= 2;
END;
$are_both_players_ready$;
