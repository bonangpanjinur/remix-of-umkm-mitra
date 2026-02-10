
# Rencana Perbaikan & Pengembangan Komprehensif

## Status: ✅ SEMUA FASE SELESAI

---

## A. ✅ Kuota Gratis Merchant Baru (Configurable)
- Dynamic free tier dari `app_settings` (key: `free_tier_quota`)
- Updated: `quotaHelpers.ts`, `api.ts`, `useMerchantQuota.ts`
- Admin UI di tab "Fitur & Registrasi"

## B. ✅ Fallback Pembayaran ke Rekening Admin
- `PaymentConfirmationPage.tsx` sudah ada fallback ✓
- `CheckoutPage.tsx` sudah ada fallback ✓

## C. ✅ Gap Analysis Implemented

### C1. KURIR ✅
- Penarikan saldo: `CourierWithdrawalPage.tsx` + tabel `courier_withdrawal_requests`
- Komisi dynamic dari `app_settings` (key: `courier_commission`)
- Real-time notifikasi pesanan baru + suara
- Sidebar + dashboard link withdrawal

### C2. PEDAGANG ✅
- Free tier configurable ✓
- POS sudah validasi langganan ✓

### C3. PEMBELI ✅
- Tab filter pesanan (Semua/Aktif/Selesai/Batal) di `OrdersPage.tsx`
