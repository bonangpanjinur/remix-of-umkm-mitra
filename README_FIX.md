# Perbaikan Logika & Alur Kuota Transaksi

Dokumen ini menjelaskan perbaikan yang dilakukan untuk mengatasi masalah bukti pembayaran yang tidak muncul di sisi admin setelah diunggah oleh merchant.

## Masalah yang Diidentifikasi
1.  **Struktur Data Tidak Sinkron**: Kolom `payment_proof_url` dan `admin_notes` belum terdaftar secara resmi di `types.ts` Supabase, menyebabkan potensi masalah pada penanganan data di frontend.
2.  **Kesalahan Destructuring URL**: Kode frontend mencoba melakukan destructuring `{ data: { publicUrl } }` dari `getPublicUrl()`, padahal Supabase SDK v2 mengembalikan `{ data: { publicUrl: string } }`. Kesalahan ini menyebabkan variabel `publicUrl` menjadi `undefined`.
3.  **Masalah Izin & Path SQL**: Fungsi RPC (`approve_quota_subscription` & `reject_quota_subscription`) tidak memiliki `search_path` yang mencakup schema `storage`, yang dapat menyebabkan masalah saat berinteraksi dengan objek storage jika diperlukan di masa depan.
4.  **Konfigurasi Storage**: Adanya potensi bucket `merchants` belum terinisialisasi dengan benar atau kebijakan (policy) yang terlalu ketat.

## Perbaikan yang Dilakukan

### 1. Database & SQL (`fixed_migration.sql`)
*   Menambahkan `SET search_path = public, storage` pada fungsi RPC untuk memastikan akses schema yang tepat.
*   Memperbaiki logika pembuatan bucket dengan `ON CONFLICT (id) DO NOTHING` untuk mencegah error jika dijalankan ulang.
*   Memastikan kolom `payment_proof_url` dan `admin_notes` ditambahkan jika belum ada.

### 2. Frontend Merchant (`MerchantSubscriptionPage.tsx`)
*   Memperbaiki cara pengambilan `publicUrl` setelah upload bukti bayar:
    ```typescript
    const { data } = supabase.storage.from('merchants').getPublicUrl(filePath);
    const publicUrl = data.publicUrl;
    ```
*   Memastikan status diupdate ke `PENDING_APPROVAL` segera setelah upload berhasil.

### 3. Frontend Admin (`AdminTransactionQuotaPage.tsx`)
*   Memperbaiki pengambilan `publicUrl` pada bagian upload QRIS di pengaturan pembayaran.
*   Memastikan komponen UI membaca `payment_proof_url` dari data subscription yang diambil dari database.

## Instruksi Implementasi

1.  **Jalankan SQL**: Salin dan jalankan isi file `fixed_migration.sql` di SQL Editor Supabase Anda. Ini akan memperbarui fungsi database dan memastikan tabel memiliki kolom yang diperlukan.
2.  **Update Kode**: Terapkan perubahan pada file `src/pages/merchant/MerchantSubscriptionPage.tsx` dan `src/pages/admin/AdminTransactionQuotaPage.tsx` sesuai dengan perubahan yang telah saya buat di repositori.
3.  **Generate Types**: Jalankan perintah berikut di terminal lokal Anda untuk menyinkronkan tipe data Supabase:
    ```bash
    npx supabase gen types typescript --project-id your-project-id > src/integrations/supabase/types.ts
    ```

Setelah langkah-langkah di atas dilakukan, bukti pembayaran yang diunggah oleh merchant akan tersimpan dengan URL yang benar di database, dan admin akan dapat melihatnya di halaman Detail Permintaan.
