-- Phase 1: Security and Authority Hardening (schema + RLS)

-- Track which player disconnected so forfeits can award the correct winner.
ALTER TABLE public.matches
	ADD COLUMN IF NOT EXISTS disconnected_player_id UUID REFERENCES auth.users(id);

ALTER TABLE public.matches
	DROP CONSTRAINT IF EXISTS matches_disconnected_player_is_participant;

ALTER TABLE public.matches
	ADD CONSTRAINT matches_disconnected_player_is_participant
	CHECK (
		disconnected_player_id IS NULL
		OR disconnected_player_id = player1_id
		OR disconnected_player_id = player2_id
	);

-- Tighten event identity: inserted event row must belong to auth.uid().
DROP POLICY IF EXISTS "Players can insert events for their matches" ON public.match_events;
CREATE POLICY "Players can insert events for their matches" ON public.match_events
	FOR INSERT WITH CHECK (
		player_id = auth.uid()
		AND EXISTS (
			SELECT 1 FROM public.matches
			WHERE matches.id = match_events.match_id
			  AND (matches.player1_id = auth.uid() OR matches.player2_id = auth.uid())
		)
	);

-- Support hardened lookups in rematch/queue/forfeit flows.
CREATE INDEX IF NOT EXISTS idx_matches_reconnecting_deadline
	ON public.matches (disconnect_deadline)
	WHERE status = 'reconnecting';

CREATE INDEX IF NOT EXISTS idx_match_events_match_event_player
	ON public.match_events (match_id, event_type, player_id);

CREATE INDEX IF NOT EXISTS idx_match_queue_user_status
	ON public.match_queue (user_id, status);
