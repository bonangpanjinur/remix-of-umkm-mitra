# Summary of Quota System Fixes

## 1. Quota Accumulation (Fix for Issue #2)
The issue where purchasing multiple packages did not accumulate quota has been fixed in both the database and the frontend:

- **Database (PostgreSQL):** Updated the `approve_quota_subscription` function in `supabase/fix_quota_accumulation.sql`. When an admin approves a new subscription, it now checks for an existing active subscription and adds its remaining quota to the new one before marking the old one as `COMPLETED`.
- **Frontend (Admin):** Updated `AssignPackageDialog.tsx` to handle manual package assignments by the admin. It now calculates the remaining quota from the current subscription and adds it to the new one.
- **Frontend (Display):** Updated `useMerchantQuota` hook, `QuotaStatusCard.tsx`, and `QuotaAlertBanner.tsx` to aggregate quota from all active subscriptions. This ensures that if a merchant has multiple active packages, the total remaining quota is correctly displayed.

## 2. Quota Deduction by Price Range (Fix for Issue #1)
The quota deduction logic has been refined to correctly follow the admin's price range rules:

- **Logic Correction:** In `CheckoutPage.tsx` and `quotaApi.ts`, the credit cost calculation was updated to multiply the tier cost by the item quantity. Previously, it only counted once per product type regardless of quantity.
- **Database Function:** The `use_merchant_quota` function was improved to use the oldest active subscription first (FIFO) to ensure quota is deducted from the package expiring soonest.

## Files Modified:
1. `supabase/fix_quota_accumulation.sql` (New migration file)
2. `src/components/admin/AssignPackageDialog.tsx`
3. `src/hooks/useMerchantQuota.ts`
4. `src/components/merchant/QuotaStatusCard.tsx`
5. `src/components/merchant/QuotaAlertBanner.tsx`
6. `src/pages/CheckoutPage.tsx`
7. `src/lib/quotaApi.ts`
