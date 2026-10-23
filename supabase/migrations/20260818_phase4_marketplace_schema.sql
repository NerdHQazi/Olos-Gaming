-- =============================================================================
-- Migration: Phase 4 Marketplace Catalog Schema
-- Created for: OLOS Gaming Platform
-- =============================================================================

-- TABLE: marketplace_items
CREATE TABLE IF NOT EXISTS public.marketplace_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('skins', 'power-ups', 'boosts', 'bundles', 'limited-edition')),
    badge TEXT NOT NULL DEFAULT 'COMMON' CHECK (badge IN ('COMMON', 'RARE', 'EPIC', 'LEGENDARY')),
    collection TEXT DEFAULT 'Genesis',
    price_gvt NUMERIC NOT NULL CHECK (price_gvt >= 0),
    image_url TEXT NOT NULL,
    created_by TEXT DEFAULT 'CyberStrike Studios',
    is_limited_edition BOOLEAN DEFAULT false,
    supply INTEGER,
    asset_metadata JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_items_category_status 
    ON public.marketplace_items (category, status);

CREATE INDEX IF NOT EXISTS idx_marketplace_items_created_at 
    ON public.marketplace_items (created_at DESC);

-- TABLE: marketplace_promos
CREATE TABLE IF NOT EXISTS public.marketplace_promos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES public.marketplace_items(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    badge TEXT DEFAULT 'LEGENDARY',
    collection TEXT DEFAULT 'Genesis',
    image_url TEXT NOT NULL,
    price_gvt NUMERIC NOT NULL CHECK (price_gvt >= 0),
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    cta_label TEXT DEFAULT 'Grab the Pack',
    bundle_item_ids JSONB DEFAULT '[]'::jsonb,
    created_by TEXT DEFAULT 'CyberStrike Studios',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_promos_active 
    ON public.marketplace_promos (is_active, ends_at);

-- ROW LEVEL SECURITY
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_promos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active marketplace items" ON public.marketplace_items;
CREATE POLICY "Public can view active marketplace items" 
    ON public.marketplace_items 
    FOR SELECT 
    USING (status = 'active');

DROP POLICY IF EXISTS "Public can view active marketplace promos" ON public.marketplace_promos;
CREATE POLICY "Public can view active marketplace promos" 
    ON public.marketplace_promos 
    FOR SELECT 
    USING (is_active = true);

-- PERMISSIONS / GRANTS
GRANT SELECT ON TABLE public.marketplace_items TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.marketplace_promos TO anon, authenticated, service_role;

