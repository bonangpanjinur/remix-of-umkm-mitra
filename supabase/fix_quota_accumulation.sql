-- FIX QUOTA ACCUMULATION AND DEDUCTION LOGIC

-- 1. Improve approve_quota_subscription to support quota accumulation
CREATE OR REPLACE FUNCTION public.approve_quota_subscription(p_subscription_id UUID, p_admin_notes TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
    v_sub RECORD;
    v_active_sub RECORD;
BEGIN
    SELECT * INTO v_sub FROM public.merchant_subscriptions WHERE id = p_subscription_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Subscription tidak ditemukan');
    END IF;

    -- Find if there's already an active subscription for this merchant
    SELECT * INTO v_active_sub 
    FROM public.merchant_subscriptions 
    WHERE merchant_id = v_sub.merchant_id 
      AND status = 'ACTIVE' 
      AND expired_at > now()
    ORDER BY expired_at DESC
    LIMIT 1;

    IF FOUND THEN
        -- If active subscription exists, we accumulate the quota into the new one
        -- and mark the old one as COMPLETED or ARCHIVED (optional, but better to keep only one ACTIVE)
        -- Or we can just add the remaining quota to the new subscription
        UPDATE public.merchant_subscriptions 
        SET 
            status = 'ACTIVE', 
            payment_status = 'PAID', 
            paid_at = now(),
            admin_notes = p_admin_notes,
            transaction_quota = transaction_quota + (v_active_sub.transaction_quota - v_active_sub.used_quota),
            updated_at = now()
        WHERE id = p_subscription_id;

        -- Mark the previous one as COMPLETED/EXPIRED so it's no longer used
        UPDATE public.merchant_subscriptions
        SET status = 'COMPLETED', updated_at = now()
        WHERE id = v_active_sub.id;
    ELSE
        -- No active subscription, just activate the new one
        UPDATE public.merchant_subscriptions 
        SET 
            status = 'ACTIVE', 
            payment_status = 'PAID', 
            paid_at = now(),
            admin_notes = p_admin_notes,
            updated_at = now()
        WHERE id = p_subscription_id;
    END IF;

    -- Update current_subscription_id di tabel merchants
    UPDATE public.merchants
    SET 
        current_subscription_id = p_subscription_id,
        updated_at = now()
    WHERE id = v_sub.merchant_id;

    RETURN json_build_object('success', true, 'message', 'Subscription berhasil disetujui dan diaktifkan dengan akumulasi kuota');
END;
$$;

-- 2. Improve use_merchant_quota to use the oldest active subscription first (FIFO)
-- and handle cases where quota might be spread across multiple subscriptions (if accumulation failed)
CREATE OR REPLACE FUNCTION public.use_merchant_quota(p_merchant_id uuid, p_credits integer DEFAULT 1)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription_id uuid;
  v_remaining integer;
BEGIN
  -- Get active subscription that expires soonest (FIFO for quota)
  SELECT id, (transaction_quota - used_quota) INTO v_subscription_id, v_remaining
  FROM public.merchant_subscriptions
  WHERE merchant_id = p_merchant_id
    AND status = 'ACTIVE'
    AND expired_at > now()
    AND (transaction_quota - used_quota) >= p_credits
  ORDER BY expired_at ASC
  LIMIT 1;
  
  IF v_subscription_id IS NULL THEN
    -- Try to find any active subscription if the soonest one doesn't have enough (unlikely with accumulation)
    SELECT id, (transaction_quota - used_quota) INTO v_subscription_id, v_remaining
    FROM public.merchant_subscriptions
    WHERE merchant_id = p_merchant_id
      AND status = 'ACTIVE'
      AND expired_at > now()
    ORDER BY expired_at ASC
    LIMIT 1;
    
    IF v_subscription_id IS NULL OR v_remaining < p_credits THEN
        RETURN false;
    END IF;
  END IF;
  
  -- Deduct credits
  UPDATE public.merchant_subscriptions
  SET used_quota = used_quota + p_credits,
      updated_at = now()
  WHERE id = v_subscription_id;
  
  RETURN true;
END;
$$;
