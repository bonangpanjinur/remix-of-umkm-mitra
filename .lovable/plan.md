

# Rencana Perbaikan: Desa Wisata, Verifikator Iuran, Merchant Group, dan Build Errors

## Ringkasan

Ada 3 permintaan utama + perbaikan build errors yang harus diselesaikan terlebih dahulu agar aplikasi bisa berjalan.

---

## Fase 0: Perbaikan Build Errors (Wajib Pertama)

Saat ini aplikasi tidak bisa di-build karena banyak error TypeScript. Berikut semua yang perlu diperbaiki:

### 0.1 Kolom dan tabel yang belum ada di database

| Masalah | Solusi |
|---------|--------|
| `has_review` tidak ada di tabel `orders` | Tambah kolom `has_review BOOLEAN DEFAULT false` |
| `halal_status`, `halal_certificate_url`, `ktp_url` tidak ada di tabel `merchants` | Tambah 3 kolom ini |
| Tabel `halal_regulations` tidak ada | Buat tabel sederhana dengan kolom `id`, `content`, `updated_at` |
| Fungsi `increment_product_view` tidak ada | Buat fungsi RPC ini |

### 0.2 Perbaikan kode TypeScript

| File | Masalah | Solusi |
|------|---------|--------|
| `OrdersPage.tsx` | Query `has_review` yang belum ada | Akan fix setelah migration menambah kolom |
| `ProductDetail.tsx` | Query `halal_status` + RPC `increment_product_view` | Akan fix setelah migration |
| `AdminHalalManagementPage.tsx` | Query kolom `halal_status` yang belum ada | Akan fix setelah migration |
| `AdminHalalRegulationPage.tsx` | Tabel `halal_regulations` belum ada | Akan fix setelah migration |
| `AdminOrdersPage.tsx` | Prop `onVerifyPayment` tidak ada di `OrderDetailsDialog` | Hapus prop yang tidak diperlukan |
| `MerchantOrdersPage.tsx` | Tipe `OrderRow` lokal punya `payment_proof_url` tapi `useRealtimeOrders.OrderRow` tidak | Tambah `payment_proof_url` ke hook, atau selaraskan tipe |
| `HalalRegistrationInfo.tsx` | Akses tabel `halal_regulations` | Akan fix setelah migration |

### SQL Migration untuk Fase 0

```text
-- 1. Tambah kolom di orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS has_review BOOLEAN DEFAULT false;

-- 2. Tambah kolom di merchants
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS halal_status TEXT DEFAULT 'NONE';
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS halal_certificate_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS ktp_url TEXT;

-- 3. Buat tabel halal_regulations
CREATE TABLE IF NOT EXISTS halal_regulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE halal_regulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read" ON halal_regulations FOR SELECT USING (true);
CREATE POLICY "Admin can manage" ON halal_regulations FOR ALL USING (public.is_admin());

-- 4. Fungsi increment_product_view
CREATE OR REPLACE FUNCTION increment_product_view(product_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE products SET view_count = COALESCE(view_count, 0) + 1 WHERE id = product_id;
END;
$$;

-- 5. Tambah payment_proof_url jika belum (sudah ada, skip)
```

### Perbaikan Kode (Fase 0)

- **`AdminOrdersPage.tsx`** - Hapus prop `onVerifyPayment` dari `OrderDetailsDialog`
- **`useRealtimeOrders.ts`** - Tambah `payment_proof_url` ke interface `OrderRow`
- **`MerchantOrdersPage.tsx`** - Selaraskan tipe dengan hook (hapus duplikat interface, gunakan dari hook)

---

## Fase 1: Perbaikan User Desa Wisata

### Mekanisme koneksi desa ke user:

**Jalur 1 - Pendaftaran mandiri (sudah ada, perlu diperkuat):**
1. User daftar akun biasa (role: buyer)
2. User buka halaman `/register/village` dan isi form
3. Sistem insert ke `villages` (status PENDING) + `user_villages` + otomatis set `user_id`
4. Admin approve dari dashboard -> sistem tambahkan role `admin_desa` ke user tersebut

**Jalur 2 - Admin menautkan user ke desa:**
1. Admin buka detail desa di dashboard admin
2. Admin pilih user dari dropdown (cari by nama/email)
3. Sistem insert ke `user_villages` + tambah role `admin_desa`

### Perubahan yang diperlukan:

**Database:**
- Trigger/logic saat admin approve village -> otomatis tambah role `admin_desa` ke `user_id` village

**File yang diubah:**
- `src/components/admin/VillageEditDialog.tsx` - Perbaiki pencarian user (gunakan `full_name` bukan `email`), tambah assign user
- `src/pages/admin/AdminVillagesPage.tsx` - Saat approve, otomatis tambah role `admin_desa` via insert ke `user_roles`
- `src/pages/desa/DesaDashboardPage.tsx` - Tambah fallback: jika tidak ada di `user_villages`, cek `villages.user_id`

---

## Fase 2: Perbaikan Dashboard Verifikator - Catatan Iuran

### Saat ini sudah ada:
- Tabel `kas_payments` dengan kolom lengkap
- Generate tagihan bulanan via RPC `generate_monthly_kas`
- Mark as paid/unpaid di dashboard verifikator

### Yang perlu ditambahkan:

**Di sisi Verifikator:**
1. **Ringkasan iuran per merchant** - Tabel yang menampilkan: nama merchant, total bulan terbayar, total bulan belum bayar, total nominal terbayar
2. **Pengingat pembayaran** - Tombol "Kirim Pengingat" per merchant yang belum bayar (via notifikasi in-app menggunakan tabel `notifications`)
3. **Riwayat lengkap** - Filter by merchant tertentu untuk lihat semua bulan

**Di sisi Merchant:**
1. **Kartu iuran di MerchantSettingsPage atau MerchantDashboardPage** - Menampilkan:
   - Total iuran terbayar (berapa kali)
   - Iuran bulan ini: LUNAS / BELUM BAYAR
   - Riwayat pembayaran (daftar bulan)
2. Query dari `kas_payments` dimana `merchant_id` = merchant si user

### File yang diubah/dibuat:
- `src/pages/verifikator/VerifikatorDashboardPage.tsx` - Tambah section ringkasan per-merchant + tombol pengingat
- `src/components/merchant/MerchantKasCard.tsx` (baru) - Kartu iuran kas untuk merchant
- `src/pages/merchant/MerchantDashboardPage.tsx` - Tampilkan `MerchantKasCard` jika merchant punya group

---

## Fase 3: Merchant Otomatis Terhubung Jika Didaftarkan Admin

### Masalah:
Jika admin mendaftarkan merchant dengan kode verifikator dari dashboard admin, di sisi merchant masih muncul tampilan "Gabung dengan Kode" padahal seharusnya sudah terhubung.

### Akar masalah:
`MerchantGroupCard.tsx` sudah mengecek `verifikator_id`, `group_id`, dan `verifikator_code`. Jika admin sudah set salah satu dari ini, seharusnya sudah tampil "terhubung". Yang perlu dipastikan:

1. **Admin panel saat approve/edit merchant** harus mengisi field `verifikator_code` dan/atau `verifikator_id` ke tabel `merchants`
2. **Trigger `auto_assign_merchant_to_group`** sudah ada di database - pastikan aktif saat UPDATE (bukan hanya INSERT)

### Perbaikan:
- Pastikan trigger `auto_assign_merchant_to_group` berjalan pada UPDATE juga (saat admin edit merchant)
- Di `MerchantGroupCard` tidak perlu perubahan - logic deteksi sudah benar

### File yang diubah:
- SQL migration: pastikan trigger `auto_assign_merchant_to_group` attach ke BEFORE INSERT OR UPDATE
- `src/pages/admin/AdminMerchantDetailPage.tsx` - Pastikan saat admin assign kode verifikator, field `verifikator_id` juga terisi

---

## Urutan Implementasi

1. **SQL Migration** - Tambah kolom, tabel, fungsi yang missing (Fase 0)
2. **Fix build errors** - Perbaiki semua file TypeScript yang error (Fase 0)
3. **Desa wisata user linking** - Auto role assignment + admin UI (Fase 1)
4. **Catatan iuran verifikator + merchant** - UI baru (Fase 2)
5. **Auto-connect merchant** - Trigger fix + admin panel (Fase 3)

---

## Detail Teknis - File yang Diubah

**Dibuat baru:**
- `src/components/merchant/MerchantKasCard.tsx`

**Diubah:**
- SQL Migration (1 file baru)
- `src/integrations/supabase/types.ts` (auto-update setelah migration)
- `src/pages/OrdersPage.tsx`
- `src/pages/ProductDetail.tsx`
- `src/pages/admin/AdminOrdersPage.tsx`
- `src/pages/admin/AdminHalalManagementPage.tsx`
- `src/pages/admin/AdminHalalRegulationPage.tsx`
- `src/components/merchant/HalalRegistrationInfo.tsx`
- `src/hooks/useRealtimeOrders.ts`
- `src/pages/merchant/MerchantOrdersPage.tsx`
- `src/components/admin/VillageEditDialog.tsx`
- `src/pages/desa/DesaDashboardPage.tsx`
- `src/pages/verifikator/VerifikatorDashboardPage.tsx`
- `src/pages/merchant/MerchantDashboardPage.tsx`

