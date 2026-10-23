-- =============================================================================
-- Migration: Phase 5 Marketplace Purchasing & Player Inventory Schema
-- Created for: OLOS Gaming Platform
-- =============================================================================

-- TABLE: marketplace_transactions
CREATE TABLE IF NOT EXISTS public.marketplace_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    item_id UUID REFERENCES public.marketplace_items(id) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 1),
    amount_gvt NUMERIC NOT NULL CHECK (amount_gvt >= 0),
    currency TEXT NOT NULL DEFAULT 'GVT',
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_user 
    ON public.marketplace_transactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_item 
    ON public.marketplace_transactions (item_id, created_at DESC);

-- TABLE: user_inventory
CREATE TABLE IF NOT EXISTS public.user_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    item_id UUID REFERENCES public.marketplace_items(id) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_user_inventory_user_item UNIQUE (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_user_inventory_user 
    ON public.user_inventory (user_id, acquired_at DESC);

-- ROW LEVEL SECURITY
ALTER TABLE public.marketplace_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own marketplace transactions" ON public.marketplace_transactions;
CREATE POLICY "Users can view their own marketplace transactions" 
    ON public.marketplace_transactions 
    FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own inventory" ON public.user_inventory;
CREATE POLICY "Users can view their own inventory" 
    ON public.user_inventory 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- FUNCTION: purchase_marketplace_item
-- Atomically checks stock, checks balance, debits wallet, creates transaction, and credits inventory
CREATE OR REPLACE FUNCTION public.purchase_marketplace_item(
    p_user_id UUID,
    p_item_id UUID,
    p_quantity INTEGER DEFAULT 1
) RETURNS JSONB AS $purchase_tag$
DECLARE
    v_item RECORD;
    v_wallet RECORD;
    v_total_cost NUMERIC;
    v_new_balance NUMERIC;
    v_transaction_id UUID;
BEGIN
    IF p_quantity IS NULL OR p_quantity < 1 THEN
        RAISE EXCEPTION 'Quantity must be at least 1';
    END IF;

    -- 1. Lock and check item
    SELECT * INTO v_item 
    FROM public.marketplace_items 
    WHERE id = p_item_id 
    FOR UPDATE;

    IF v_item.id IS NULL OR v_item.status <> 'active' THEN
        RAISE EXCEPTION 'Item not found or inactive';
    END IF;

    -- 2. Check supply if limited
    IF v_item.supply IS NOT NULL AND v_item.supply < p_quantity THEN
        RAISE EXCEPTION 'Item is out of stock';
    END IF;

    v_total_cost := v_item.price_gvt * p_quantity;

    -- 3. Lock and check wallet balance
    SELECT * INTO v_wallet 
    FROM public.wallets 
    WHERE user_id = p_user_id 
    FOR UPDATE;

    IF v_wallet.user_id IS NULL THEN
        RAISE EXCEPTION 'Wallet not found';
    END IF;

    IF v_wallet.balance < v_total_cost THEN
        RAISE EXCEPTION 'Insufficient GVT balance';
    END IF;

    -- 4. Debit wallet
    UPDATE public.wallets 
    SET balance = balance - v_total_cost,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING balance INTO v_new_balance;

    -- 5. Decrement supply if tracked
    IF v_item.supply IS NOT NULL THEN
        UPDATE public.marketplace_items 
        SET supply = supply - p_quantity 
        WHERE id = p_item_id;
    END IF;

    -- 6. Insert transaction record
    INSERT INTO public.marketplace_transactions (
        user_id,
        item_id,
        quantity,
        amount_gvt,
        currency,
        status
    ) VALUES (
        p_user_id,
        p_item_id,
        p_quantity,
        v_total_cost,
        'GVT',
        'completed'
    ) RETURNING id INTO v_transaction_id;

    -- 7. Upsert user inventory
    INSERT INTO public.user_inventory (
        user_id,
        item_id,
        quantity,
        acquired_at
    ) VALUES (
        p_user_id,
        p_item_id,
        p_quantity,
        NOW()
    ) ON CONFLICT (user_id, item_id) 
    DO UPDATE SET 
        quantity = user_inventory.quantity + EXCLUDED.quantity,
        acquired_at = NOW();

    RETURN jsonb_build_object(
        'success', true,
        'transactionId', v_transaction_id,
        'deductedAmount', v_total_cost,
        'remainingBalance', v_new_balance,
        'purchasedItem', jsonb_build_object(
            'id', v_item.id,
            'name', v_item.name,
            'badge', v_item.badge,
            'category', v_item.category,
            'priceGvt', v_item.price_gvt,
            'imageUrl', v_item.image_url
        )
    );
END;
$purchase_tag$ LANGUAGE plpgsql SECURITY DEFINER;

-- PERMISSIONS / GRANTS
GRANT SELECT, INSERT ON TABLE public.marketplace_transactions TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_inventory TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.purchase_marketplace_item TO authenticated, service_role;

