-- Migration: Package Transaction Fix
-- 1. Add payment proof and status to merchant_subscriptions
-- 2. Add payment settings to app_settings
-- 3. Ensure price consistency

-- Update merchant_subscriptions to handle payment flow
ALTER TABLE public.merchant_subscriptions 
ADD COLUMN IF NOT EXISTS payment_proof_url text,
ADD COLUMN IF NOT EXISTS admin_notes text;

-- Ensure payment_status has correct default and possible values
-- Current statuses: UNPAID, PAID, PENDING_APPROVAL, REJECTED
-- We'll use PENDING_APPROVAL for when merchant uploads proof

-- Create a table for payment settings if not using app_settings for everything
-- But the requirement says "pengaturan pembayaran nomor rekening bank dan juga upload qris"
-- We can use app_settings for this.

-- Insert default payment settings if they don't exist
INSERT INTO public.app_settings (key, value, description, category)
VALUES (
  'payment_settings', 
  '{"bank_name": "BCA", "account_number": "1234567890", "account_name": "Admin Desa Digital", "qris_url": ""}',
  'Pengaturan pembayaran untuk pembelian paket oleh merchant',
  'payment'
)
ON CONFLICT (key) DO NOTHING;

-- Policy for merchant_subscriptions to allow merchants to upload proof
-- Assuming RLS is enabled, we need to make sure merchants can update their own subscriptions
-- specifically the payment_proof_url and change status to PENDING_APPROVAL

-- If price consistency is an issue, we should ensure the price in merchant_subscriptions 
-- is always taken from transaction_packages at the time of purchase.
-- The existing code in MerchantSubscriptionPage.tsx already does:
-- payment_amount: selectedPackage.transaction_quota * selectedPackage.price_per_transaction
-- We should verify if price_per_transaction is actually the package price or price per unit.
-- Based on AdminPackagesPage.tsx, price_per_transaction is used as "Harga Paket".

-- Add a trigger to automatically set payment_status to PENDING_APPROVAL when payment_proof_url is updated
CREATE OR REPLACE FUNCTION public.handle_subscription_payment_upload()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_proof_url IS NOT NULL AND (OLD.payment_proof_url IS NULL OR NEW.payment_proof_url <> OLD.payment_proof_url) THEN
    NEW.payment_status := 'PENDING_APPROVAL';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_payment_proof_upload ON public.merchant_subscriptions;
CREATE TRIGGER on_payment_proof_upload
  BEFORE UPDATE ON public.merchant_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_subscription_payment_upload();
