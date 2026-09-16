-- Critical 1v1 security hardening: phases 1-4

-- Add payout ledger for idempotent reward releases
CREATE TABLE IF NOT EXISTS public.match_payouts (
    match_id UUID PRIMARY KEY REFERENCES public.matches(id) ON DELETE CASCADE,
    winner_id UUID NOT NULL REFERENCES auth.users(id),
    stake_amount NUMERIC NOT NULL,
    total_pot NUMERIC NOT NULL,
    fee_amount NUMERIC NOT NULL,
    payout_amount NUMERIC NOT NULL,
    triggered_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.match_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players can view payouts for their matches" ON public.match_payouts;
CREATE POLICY "Players can view payouts for their matches" ON public.match_payouts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.matches m
            WHERE m.id = match_payouts.match_id
              AND (m.player1_id = auth.uid() OR m.player2_id = auth.uid())
        )
    );

-- Guard against negative wallet values from duplicate/unbalanced mutations
ALTER TABLE public.wallets
    ADD CONSTRAINT wallets_balance_nonnegative CHECK (balance >= 0) NOT VALID;

ALTER TABLE public.wallets
    ADD CONSTRAINT wallets_locked_balance_nonnegative CHECK (locked_balance >= 0) NOT VALID;

-- Track authoritative timer tick cadence
ALTER TABLE public.matches
    ADD COLUMN IF NOT EXISTS last_timer_tick_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Note: Function hardening definitions live in
-- 20260809_phase1_security_authority_functions.sql.
-- This file intentionally remains schema-only to avoid overlapping CREATE OR REPLACE FUNCTION definitions.
