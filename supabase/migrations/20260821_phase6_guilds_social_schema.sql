-- =============================================================================
-- Migration: Phase 6 Guilds & Social System Schema
-- Created for: OLOS Gaming Platform
-- =============================================================================

-- TABLE: guilds
CREATE TABLE IF NOT EXISTS public.guilds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    short_name TEXT NOT NULL UNIQUE,
    description TEXT,
    tagline TEXT,
    icon_url TEXT NOT NULL DEFAULT '/guilds/cyberSerpentImage.png',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_private BOOLEAN NOT NULL DEFAULT true,
    max_members INTEGER NOT NULL DEFAULT 30 CHECK (max_members BETWEEN 5 AND 50),
    min_rank TEXT DEFAULT 'Silver Bracket (Tier II)',
    entry_fee NUMERIC NOT NULL DEFAULT 0 CHECK (entry_fee >= 0),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    tier TEXT DEFAULT 'Tier 1 Elite',
    tier_bracket TEXT DEFAULT 'Elite I',
    tier_note TEXT,
    total_staked NUMERIC NOT NULL DEFAULT 0 CHECK (total_staked >= 0),
    currency TEXT NOT NULL DEFAULT 'GVT',
    total_wins INTEGER NOT NULL DEFAULT 0 CHECK (total_wins >= 0),
    total_matches INTEGER NOT NULL DEFAULT 0 CHECK (total_matches >= 0),
    total_earned NUMERIC NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
    win_rate NUMERIC NOT NULL DEFAULT 0.0 CHECK (win_rate >= 0.0 AND win_rate <= 100.0),
    tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    win_rate_min_percent NUMERIC DEFAULT 0.0 CHECK (win_rate_min_percent >= 0.0),
    staking_dues_per_month NUMERIC DEFAULT 0.0 CHECK (staking_dues_per_month >= 0.0),
    win_rate_percentile_label TEXT,
    staked_usd_estimate NUMERIC CHECK (staked_usd_estimate >= 0),
    recruitment_rules_summary TEXT,
    staking_tax_percent NUMERIC DEFAULT 10 CHECK (staking_tax_percent >= 0 AND staking_tax_percent <= 100),
    draft_announcement TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for public.guilds
CREATE INDEX IF NOT EXISTS idx_guilds_name ON public.guilds (name);
CREATE INDEX IF NOT EXISTS idx_guilds_short_name ON public.guilds (short_name);
CREATE INDEX IF NOT EXISTS idx_guilds_is_featured ON public.guilds (is_featured);
CREATE INDEX IF NOT EXISTS idx_guilds_total_wins ON public.guilds (total_wins DESC);
CREATE INDEX IF NOT EXISTS idx_guilds_created_at ON public.guilds (created_at DESC);

-- TABLE: guild_members
CREATE TABLE IF NOT EXISTS public.guild_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID REFERENCES public.guilds(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'Member' CHECK (role IN ('Leader', 'Officer', 'Member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_guild_member UNIQUE (guild_id, user_id)
);

-- Indexes for public.guild_members
CREATE INDEX IF NOT EXISTS idx_guild_members_guild_id ON public.guild_members (guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_user_id ON public.guild_members (user_id);

-- TABLE: guild_applications
CREATE TABLE IF NOT EXISTS public.guild_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID REFERENCES public.guilds(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    motivation TEXT NOT NULL,
    guild_history TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for public.guild_applications
CREATE INDEX IF NOT EXISTS idx_guild_applications_guild_status ON public.guild_applications (guild_id, status);
CREATE INDEX IF NOT EXISTS idx_guild_applications_user_status ON public.guild_applications (user_id, status);

-- Partial unique index: strictly enforce at database level that a user can have at most one pending application per guild
CREATE UNIQUE INDEX IF NOT EXISTS idx_uq_guild_pending_app
    ON public.guild_applications (guild_id, user_id)
    WHERE (status = 'pending');

-- ROW LEVEL SECURITY
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_applications ENABLE ROW LEVEL SECURITY;

-- Guilds RLS: Anyone can view guilds
DROP POLICY IF EXISTS "Guilds are viewable by everyone" ON public.guilds;
CREATE POLICY "Guilds are viewable by everyone"
    ON public.guilds FOR SELECT
    USING (true);

-- Guild Members RLS: Anyone can view guild member rosters
DROP POLICY IF EXISTS "Guild members are viewable by everyone" ON public.guild_members;
CREATE POLICY "Guild members are viewable by everyone"
    ON public.guild_members FOR SELECT
    USING (true);

-- Guild Applications RLS: Applicants can view their own, and Guild Leaders/Officers can view for their guild
DROP POLICY IF EXISTS "Users can view their own applications" ON public.guild_applications;
CREATE POLICY "Users can view their own applications"
    ON public.guild_applications FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.guild_members
            WHERE guild_members.guild_id = guild_applications.guild_id
              AND guild_members.user_id = auth.uid()
              AND guild_members.role IN ('Leader', 'Officer')
        )
    );

DROP POLICY IF EXISTS "Users can insert their own applications" ON public.guild_applications;
CREATE POLICY "Users can insert their own applications"
    ON public.guild_applications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- FUNCTION: create_guild_with_leader
-- Atomically validates unique name/tag, debits contract creation fee (5 GVT) if present,
-- inserts guild, and registers creator as 'Leader'.
CREATE OR REPLACE FUNCTION public.create_guild_with_leader(
    p_user_id UUID,
    p_name TEXT,
    p_short_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_tagline TEXT DEFAULT NULL,
    p_icon_url TEXT DEFAULT '/guilds/cyberSerpentImage.png',
    p_is_private BOOLEAN DEFAULT true,
    p_max_members INTEGER DEFAULT 30,
    p_min_rank TEXT DEFAULT 'Silver Bracket (Tier II)',
    p_entry_fee NUMERIC DEFAULT 0,
    p_tags TEXT[] DEFAULT ARRAY[]::TEXT[]
) RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $create_guild_tag$
DECLARE
    v_wallet RECORD;
    v_guild_id UUID;
    v_fee NUMERIC := 5.00;
    v_clean_name TEXT;
    v_clean_tag TEXT;
    v_auth_role TEXT;
    v_caller_uid UUID;
BEGIN
    -- 0. Authorization check: prevent cross-user fee debiting when called by authenticated client
    v_auth_role := auth.role();
    v_caller_uid := auth.uid();

    IF v_auth_role = 'authenticated' THEN
        IF v_caller_uid IS NULL OR v_caller_uid <> p_user_id THEN
            RAISE EXCEPTION 'Unauthorized: Caller cannot create guild for another user';
        END IF;
    END IF;

    v_clean_name := trim(p_name);
    v_clean_tag := upper(trim(p_short_name));

    IF v_clean_name IS NULL OR length(v_clean_name) < 3 THEN
        RAISE EXCEPTION 'Guild name must be at least 3 characters';
    END IF;

    IF v_clean_tag IS NULL OR length(v_clean_tag) < 2 OR length(v_clean_tag) > 5 THEN
        RAISE EXCEPTION 'Guild tag must be between 2 and 5 characters';
    END IF;

    IF p_max_members < 5 OR p_max_members > 50 THEN
        RAISE EXCEPTION 'Max members must be between 5 and 50';
    END IF;

    -- Check for duplicate guild name
    IF EXISTS (SELECT 1 FROM public.guilds WHERE lower(name) = lower(v_clean_name)) THEN
        RAISE EXCEPTION 'A guild with this name already exists';
    END IF;

    -- Check for duplicate guild short_name (tag)
    IF EXISTS (SELECT 1 FROM public.guilds WHERE upper(short_name) = v_clean_tag) THEN
        RAISE EXCEPTION 'A guild with this tag already exists';
    END IF;

    -- Lock and check wallet balance for creation fee
    SELECT balance INTO v_wallet
    FROM public.wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User wallet not found';
    END IF;

    IF v_wallet.balance < v_fee THEN
        RAISE EXCEPTION 'Insufficient GVT balance for guild contract creation (5 GVT required)';
    END IF;

    -- Debit fee from wallet
    UPDATE public.wallets
    SET
        balance = balance - v_fee,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Insert guild
    INSERT INTO public.guilds (
        name,
        short_name,
        description,
        tagline,
        icon_url,
        created_by,
        is_private,
        max_members,
        min_rank,
        entry_fee,
        tags,
        total_staked,
        currency,
        total_wins,
        total_matches,
        total_earned,
        win_rate
    ) VALUES (
        v_clean_name,
        v_clean_tag,
        p_description,
        p_tagline,
        COALESCE(p_icon_url, '/guilds/cyberSerpentImage.png'),
        p_user_id,
        p_is_private,
        p_max_members,
        p_min_rank,
        COALESCE(p_entry_fee, 0),
        COALESCE(p_tags, ARRAY[]::TEXT[]),
        0,
        'GVT',
        0,
        0,
        0,
        0.0
    ) RETURNING id INTO v_guild_id;

    -- Insert creator as Leader
    INSERT INTO public.guild_members (
        guild_id,
        user_id,
        role
    ) VALUES (
        v_guild_id,
        p_user_id,
        'Leader'
    );

    RETURN jsonb_build_object(
        'success', true,
        'guildId', v_guild_id,
        'name', v_clean_name,
        'shortName', v_clean_tag,
        'deductedFee', v_fee,
        'role', 'Leader'
    );
END;
$create_guild_tag$;

-- PERMISSIONS / GRANTS
GRANT SELECT ON TABLE public.guilds TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.guild_members TO anon, authenticated, service_role;
GRANT SELECT, INSERT ON TABLE public.guild_applications TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_guild_with_leader TO authenticated, service_role;
