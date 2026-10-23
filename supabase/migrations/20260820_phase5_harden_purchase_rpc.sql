-- =============================================================================
-- Migration: Phase 5 Security Hardening for Marketplace Purchasing RPC
-- Created for: OLOS Gaming Platform
-- =============================================================================

CREATE OR REPLACE FUNCTION public.purchase_marketplace_item(
    p_user_id UUID,
    p_item_id UUID,
    p_quantity INTEGER DEFAULT 1
) RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $purchase_tag$
DECLARE
    v_item RECORD;
    v_wallet RECORD;
    v_total_cost NUMERIC;
    v_new_balance NUMERIC;
    v_transaction_id UUID;
    v_auth_role TEXT;
    v_caller_uid UUID;
BEGIN
    -- 1. Input validation
    IF p_quantity IS NULL OR p_quantity < 1 THEN
        RAISE EXCEPTION 'Quantity must be at least 1';
    END IF;

    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID is required';
    END IF;

    IF p_item_id IS NULL THEN
        RAISE EXCEPTION 'Item ID is required';
    END IF;

    -- 2. Authorization check: prevent cross-user purchases
    v_auth_role := auth.role();
    v_caller_uid := auth.uid();

    IF v_auth_role = 'authenticated' THEN
        IF v_caller_uid IS NULL OR v_caller_uid <> p_user_id THEN
            RAISE EXCEPTION 'Unauthorized: Caller cannot purchase for another user';
        END IF;
    END IF;

    -- 3. Lock and check item
    SELECT * INTO v_item 
    FROM public.marketplace_items 
    WHERE id = p_item_id 
    FOR UPDATE;

    IF v_item.id IS NULL OR v_item.status <> 'active' THEN
        RAISE EXCEPTION 'Item not found or inactive';
    END IF;

    -- 4. Check supply if limited
    IF v_item.supply IS NOT NULL AND v_item.supply < p_quantity THEN
        RAISE EXCEPTION 'Item is out of stock';
    END IF;

    v_total_cost := v_item.price_gvt * p_quantity;

    -- 5. Lock and check wallet balance
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

    -- 6. Debit wallet atomically
    UPDATE public.wallets 
    SET balance = balance - v_total_cost,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING balance INTO v_new_balance;

    -- 7. Decrement supply if tracked
    IF v_item.supply IS NOT NULL THEN
        UPDATE public.marketplace_items 
        SET supply = supply - p_quantity 
        WHERE id = p_item_id;
    END IF;

    -- 8. Insert transaction record
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

    -- 9. Upsert user inventory
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
$purchase_tag$;

-- REVOKE / GRANT PERMISSIONS
REVOKE ALL ON FUNCTION public.purchase_marketplace_item(UUID, UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purchase_marketplace_item(UUID, UUID, INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.purchase_marketplace_item(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_marketplace_item(UUID, UUID, INTEGER) TO service_role;
