-- =============================================================================
-- Migration: Phase 7 Tournaments System Schema
-- Created for: OLOS Gaming Platform
-- Purpose: Provision tournaments and tournament participants schema, RLS policies,
--          indexes, and the atomic register_tournament_participant stored procedure.
-- =============================================================================

-- TABLE: tournaments
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    game_type TEXT NOT NULL CHECK (char_length(game_type) >= 2),
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'registration_open', 'active', 'completed', 'cancelled')),
    format TEXT NOT NULL DEFAULT 'single_elimination',
    entry_fee_gvt NUMERIC NOT NULL DEFAULT 0 CHECK (entry_fee_gvt >= 0),
    prize_pool_gvt NUMERIC NOT NULL DEFAULT 0 CHECK (prize_pool_gvt >= 0),
    currency TEXT NOT NULL DEFAULT 'GVT',
    max_participants INTEGER NOT NULL DEFAULT 8 CHECK (max_participants >= 2),
    current_participants INTEGER NOT NULL DEFAULT 0 CHECK (current_participants >= 0),
    round_number INTEGER NOT NULL DEFAULT 1 CHECK (round_number >= 1),
    total_rounds INTEGER NOT NULL DEFAULT 3 CHECK (total_rounds >= 1),
    bracket_data JSONB NOT NULL DEFAULT '{"quarters": [], "semis": [], "finals": null}'::jsonb,
    rules JSONB NOT NULL DEFAULT '["Single Elimination Knockout", "10 mins max per round", "Disconnection results in automatic forfeit"]'::jsonb,
    prize_distribution JSONB NOT NULL DEFAULT '[{"place": "1st Place", "pct": "50%", "highlight": true}, {"place": "2nd Place", "pct": "25%", "highlight": false}, {"place": "3rd - 4th Place", "pct": "12.5% each", "highlight": false}]'::jsonb,
    starts_at TIMESTAMP WITH TIME ZONE,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_tournaments_capacity CHECK (current_participants <= max_participants)
);

-- Indexes for public.tournaments
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments (status);
CREATE INDEX IF NOT EXISTS idx_tournaments_game_type ON public.tournaments (game_type);
CREATE INDEX IF NOT EXISTS idx_tournaments_starts_at ON public.tournaments (starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_tournaments_created_at ON public.tournaments (created_at DESC);

-- TABLE: tournament_participants
CREATE TABLE IF NOT EXISTS public.tournament_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    seed INTEGER,
    status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'active', 'eliminated', 'winner', 'withdrawn')),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_tournament_participant UNIQUE (tournament_id, user_id)
);

-- Indexes for public.tournament_participants
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON public.tournament_participants (tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user ON public.tournament_participants (user_id);

-- ROW LEVEL SECURITY
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;

-- Tournaments RLS: Publicly viewable by everyone
DROP POLICY IF EXISTS "Tournaments are viewable by everyone" ON public.tournaments;
CREATE POLICY "Tournaments are viewable by everyone"
    ON public.tournaments FOR SELECT
    USING (true);

-- Tournament Participants RLS: Publicly viewable by everyone
DROP POLICY IF EXISTS "Tournament participants are viewable by everyone" ON public.tournament_participants;
CREATE POLICY "Tournament participants are viewable by everyone"
    ON public.tournament_participants FOR SELECT
    USING (true);

-- Direct client INSERT on tournament_participants is intentionally disabled.
-- All participant registrations must execute atomically through the SECURITY DEFINER RPC
-- public.register_tournament_participant(UUID, UUID) to ensure wallet balance debit,
-- capacity limits, and deadline enforcement.
DROP POLICY IF EXISTS "Users can insert their own tournament participant entry" ON public.tournament_participants;

-- FUNCTION: register_tournament_participant
-- Atomically checks tournament capacity and registration status, verifies wallet balance,
-- debits entry fee (if > 0), increments participant count, and registers the user.
CREATE OR REPLACE FUNCTION public.register_tournament_participant(
    p_user_id UUID,
    p_tournament_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $register_tournament_tag$
DECLARE
    v_tournament RECORD;
    v_wallet RECORD;
    v_auth_role TEXT;
    v_caller_uid UUID;
    v_participant_id UUID;
    v_new_balance NUMERIC;
BEGIN
    -- 1. Input validation
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID is required';
    END IF;

    IF p_tournament_id IS NULL THEN
        RAISE EXCEPTION 'Tournament ID is required';
    END IF;

    -- 2. Authorization check: prevent cross-user registrations when called by authenticated client
    v_auth_role := auth.role();
    v_caller_uid := auth.uid();

    IF v_auth_role = 'authenticated' THEN
        IF v_caller_uid IS NULL OR v_caller_uid <> p_user_id THEN
            RAISE EXCEPTION 'Unauthorized: Caller cannot register for another user';
        END IF;
    END IF;

    -- 3. Lock and verify tournament row
    SELECT * INTO v_tournament
    FROM public.tournaments
    WHERE id = p_tournament_id
    FOR UPDATE;

    IF v_tournament.id IS NULL THEN
        RAISE EXCEPTION 'Tournament not found';
    END IF;

    IF v_tournament.status <> 'registration_open' THEN
        RAISE EXCEPTION 'Tournament registration is closed';
    END IF;

    IF (v_tournament.registration_deadline IS NOT NULL AND v_tournament.registration_deadline < NOW())
       OR (v_tournament.starts_at IS NOT NULL AND v_tournament.starts_at < NOW()) THEN
        RAISE EXCEPTION 'Tournament registration deadline has passed';
    END IF;

    IF v_tournament.current_participants >= v_tournament.max_participants THEN
        RAISE EXCEPTION 'Tournament is at maximum capacity';
    END IF;

    -- 4. Check for existing participant entry (idempotency / duplicate check)
    IF EXISTS (
        SELECT 1 FROM public.tournament_participants
        WHERE tournament_id = p_tournament_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'User is already registered for this tournament';
    END IF;

    -- 5. Debit wallet balance if entry fee > 0
    IF v_tournament.entry_fee_gvt > 0 THEN
        SELECT * INTO v_wallet
        FROM public.wallets
        WHERE user_id = p_user_id
        FOR UPDATE;

        IF v_wallet.user_id IS NULL THEN
            RAISE EXCEPTION 'User wallet not found';
        END IF;

        IF v_wallet.balance < v_tournament.entry_fee_gvt THEN
            RAISE EXCEPTION 'Insufficient GVT balance for tournament entry';
        END IF;

        UPDATE public.wallets
        SET balance = balance - v_tournament.entry_fee_gvt,
            updated_at = NOW()
        WHERE user_id = p_user_id
        RETURNING balance INTO v_new_balance;
    ELSE
        SELECT balance INTO v_new_balance
        FROM public.wallets
        WHERE user_id = p_user_id;
    END IF;

    -- 6. Insert tournament participant row
    INSERT INTO public.tournament_participants (
        tournament_id,
        user_id,
        status,
        registered_at
    ) VALUES (
        p_tournament_id,
        p_user_id,
        'registered',
        NOW()
    ) RETURNING id INTO v_participant_id;

    -- 7. Increment current participants count
    UPDATE public.tournaments
    SET current_participants = current_participants + 1,
        updated_at = NOW()
    WHERE id = p_tournament_id;

    RETURN jsonb_build_object(
        'success', true,
        'participantId', v_participant_id,
        'tournamentId', v_tournament.id,
        'tournamentTitle', v_tournament.title,
        'entryFeeDeducted', v_tournament.entry_fee_gvt,
        'remainingBalance', COALESCE(v_new_balance, 0),
        'currentParticipants', v_tournament.current_participants + 1,
        'maxParticipants', v_tournament.max_participants,
        'status', 'registered'
    );
END;
$register_tournament_tag$;

-- PERMISSIONS / GRANTS
GRANT SELECT ON TABLE public.tournaments TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.tournament_participants TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.tournaments TO service_role;
GRANT ALL ON TABLE public.tournament_participants TO service_role;

REVOKE ALL ON FUNCTION public.register_tournament_participant(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.register_tournament_participant(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.register_tournament_participant(UUID, UUID) TO authenticated, service_role;
