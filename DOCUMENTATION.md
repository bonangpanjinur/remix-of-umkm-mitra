# 📖 Dokumentasi Lengkap Platform Desa Wisata & UMKM

## 📋 Daftar Isi

1. [Gambaran Umum](#gambaran-umum)
2. [Tech Stack](#tech-stack)
3. [Struktur Project](#struktur-project)
4. [Roles & Hak Akses](#roles--hak-akses)
5. [Fitur Berdasarkan Role](#fitur-berdasarkan-role)
6. [Alur Sistem](#alur-sistem)
7. [Database Schema](#database-schema)
8. [API & Edge Functions](#api--edge-functions)
9. [Komponen Utama](#komponen-utama)
10. [Konfigurasi](#konfigurasi)

---

## 🎯 Gambaran Umum

**Platform Desa Wisata & UMKM** adalah aplikasi web Progressive Web App (PWA) yang menghubungkan:
- **Desa Wisata** - Menampilkan destinasi wisata lokal
- **UMKM/Merchant** - Pedagang lokal yang menjual produk khas desa
- **Pembeli** - Konsumen yang dapat membeli produk dan menjelajahi wisata
- **Kurir** - Pengantar pesanan lokal

### Fitur Utama:
- 🛒 **E-Commerce** - Sistem jual-beli produk lokal
- 🏘️ **Desa Wisata** - Informasi dan promosi wisata desa
- 📦 **Manajemen Pesanan** - Tracking pesanan real-time
- 💳 **Pembayaran** - Integrasi Xendit (QRIS, VA, dll)
- 🚚 **Pengiriman** - Kurir internal dengan tracking lokasi
- 📱 **PWA** - Instalasi di perangkat mobile
- 🔔 **Push Notification** - Notifikasi real-time

---

## 🛠️ Tech Stack

### Frontend
| Teknologi | Kegunaan |
|-----------|----------|
| **React 18** | Framework UI |
| **TypeScript** | Type safety |
| **Vite** | Build tool |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | Komponen UI |
| **React Router v6** | Routing |
| **TanStack Query** | Data fetching & caching |
| **Framer Motion** | Animasi |
| **Recharts** | Charts & analytics |
| **Leaflet** | Peta interaktif |

### Backend (Lovable Cloud / Supabase)
| Teknologi | Kegunaan |
|-----------|----------|
| **PostgreSQL** | Database |
| **Row Level Security** | Keamanan data |
| **Edge Functions** | Serverless functions |
| **Realtime** | Subscriptions real-time |
| **Storage** | File storage |
| **Authentication** | Auth system |

### Integrasi
| Layanan | Kegunaan |
|---------|----------|
| **Xendit** | Payment gateway |
| **Wilayah API** | Data wilayah Indonesia |

---

## 📁 Struktur Project

```
src/
├── assets/              # Gambar & aset statis
├── components/          # Komponen React
│   ├── admin/           # Komponen untuk Admin
│   ├── auth/            # Komponen autentikasi
│   ├── checkout/        # Komponen checkout
│   ├── courier/         # Komponen kurir
│   ├── desa/            # Komponen admin desa
│   ├── explore/         # Komponen eksplorasi
│   ├── home/            # Komponen homepage
│   ├── layout/          # Layout (Header, BottomNav)
│   ├── merchant/        # Komponen merchant
│   ├── notifications/   # Notifikasi
│   ├── order/           # Komponen pesanan
│   ├── product/         # Komponen produk
│   ├── pwa/             # PWA components
│   ├── settings/        # Pengaturan
│   ├── ui/              # shadcn/ui components
│   ├── verifikator/     # Komponen verifikator
│   └── village/         # Komponen desa
├── contexts/            # React contexts
│   ├── AuthContext.tsx  # Auth state management
│   ├── CartContext.tsx  # Keranjang belanja
│   └── WhitelabelContext.tsx # Pengaturan whitelabel
├── data/                # Data statis
├── hooks/               # Custom hooks
├── integrations/        # Integrasi Supabase
├── lib/                 # Utility functions & API
├── pages/               # Halaman aplikasi
│   ├── admin/           # Halaman admin
│   ├── buyer/           # Halaman pembeli
│   ├── courier/         # Halaman kurir
│   ├── desa/            # Halaman admin desa
│   ├── merchant/        # Halaman merchant
│   └── verifikator/     # Halaman verifikator
└── types/               # TypeScript types
```

---

## 👥 Roles & Hak Akses

Platform ini menggunakan **Role-Based Access Control (RBAC)** dengan 6 role:

### 1. 👑 Admin Pusat (`admin`)
**Dashboard:** `/admin`
**Hak Akses Penuh:**
- Mengelola semua data platform
- Approval merchant, desa, kurir
- Manajemen pesanan & refund
- Keuangan & withdrawal
- Pengaturan sistem
- Broadcast notifikasi
- Whitelabel & branding

### 2. 🏘️ Admin Desa (`admin_desa`)
**Dashboard:** `/desa`
**Hak Akses:**
- Mengelola data desa sendiri
- Mengelola wisata desa
- Melihat statistik desa

### 3. ✅ Verifikator (`verifikator`)
**Dashboard:** `/verifikator`
**Hak Akses:**
- Verifikasi merchant dengan kode referral
- Melihat komisi dari merchant
- Request withdrawal komisi

### 4. 🏪 Merchant (`merchant`)
**Dashboard:** `/merchant`
**Hak Akses:**
- Mengelola produk (CRUD)
- Mengelola pesanan
- Flash sale & promo
- Voucher management
- Statistik & analytics
- Request withdrawal

### 5. 🚚 Kurir (`courier`)
**Dashboard:** `/courier`
**Hak Akses:**
- Melihat pesanan yang ditugaskan
- Update status pengiriman
- Upload bukti pengiriman (POD)
- Tracking lokasi real-time
- Melihat pendapatan

### 6. 🛒 Pembeli (`buyer`)
**Dashboard:** `/` (Homepage)
**Hak Akses:**
- Menjelajahi produk & wisata
- Menambah ke keranjang
- Checkout & pembayaran
- Tracking pesanan
- Review & rating
- Wishlist

### Prioritas Role (Login Redirect)
```
admin > admin_desa > verifikator > merchant > courier > buyer
```

---

## ⚙️ Fitur Berdasarkan Role

### 👑 Admin Pusat

| Halaman | Deskripsi |
|---------|-----------|
| `/admin` | Dashboard statistik |
| `/admin/merchants` | Kelola & approval merchant |
| `/admin/villages` | Kelola & approval desa |
| `/admin/couriers` | Kelola & approval kurir |
| `/admin/orders` | Semua pesanan platform |
| `/admin/products` | Semua produk |
| `/admin/users` | Manajemen user |
| `/admin/roles` | Manajemen role |
| `/admin/finance` | Keuangan platform |
| `/admin/withdrawals` | Approval withdrawal merchant |
| `/admin/verifikator-withdrawals` | Approval withdrawal verifikator |
| `/admin/verifikator-commissions` | Komisi verifikator |
| `/admin/refunds` | Request refund |
| `/admin/promotions` | Banner & promosi |
| `/admin/banners` | Kelola banner |
| `/admin/categories` | Kelola kategori |
| `/admin/packages` | Paket langganan merchant |
| `/admin/codes` | Kode verifikator |
| `/admin/broadcast` | Broadcast notifikasi |
| `/admin/reports` | Laporan & export |
| `/admin/logs` | Audit logs |
| `/admin/settings` | Pengaturan umum |
| `/admin/homepage-layout` | Pengaturan tampilan homepage |
| `/admin/whitelabel` | Branding & whitelabel |
| `/admin/seo` | SEO settings |
| `/admin/pwa-settings` | PWA settings |
| `/admin/backup` | Manual backup |
| `/admin/scheduled-backup` | Scheduled backup |

### 🏘️ Admin Desa

| Halaman | Deskripsi |
|---------|-----------|
| `/desa` | Dashboard desa |
| `/desa/tourism` | Kelola wisata desa |

### ✅ Verifikator

| Halaman | Deskripsi |
|---------|-----------|
| `/verifikator` | Dashboard |
| `/verifikator/merchants` | Merchant terverifikasi |
| `/verifikator/earnings` | Pendapatan & withdrawal |

### 🏪 Merchant

| Halaman | Deskripsi |
|---------|-----------|
| `/merchant` | Dashboard & statistik |
| `/merchant/products` | Kelola produk |
| `/merchant/orders` | Pesanan masuk |
| `/merchant/analytics` | Analytics detail |
| `/merchant/reviews` | Review pelanggan |
| `/merchant/flash-sale` | Flash sale |
| `/merchant/promo` | Promo produk |
| `/merchant/scheduled-promo` | Promo terjadwal |
| `/merchant/vouchers` | Kelola voucher |
| `/merchant/subscription` | Paket langganan |
| `/merchant/withdrawal` | Request withdrawal |
| `/merchant/visitor-stats` | Statistik pengunjung |
| `/merchant/settings` | Pengaturan toko |

### 🚚 Kurir

| Halaman | Deskripsi |
|---------|-----------|
| `/courier` | Dashboard & pesanan aktif |
| `/courier/history` | Riwayat pengiriman |
| `/courier/earnings` | Pendapatan |

### 🛒 Pembeli (Public)

| Halaman | Deskripsi |
|---------|-----------|
| `/` | Homepage |
| `/explore` | Eksplorasi |
| `/products` | Daftar produk |
| `/product/:id` | Detail produk |
| `/shops` | Daftar toko |
| `/shop/:id` | Profil toko |
| `/tourism` | Daftar wisata |
| `/tourism/:id` | Detail wisata |
| `/search` | Hasil pencarian |
| `/cart` | Keranjang |
| `/checkout` | Checkout |
| `/orders` | Riwayat pesanan |
| `/orders/:id` | Tracking pesanan |
| `/account` | Profil akun |
| `/settings` | Pengaturan |
| `/wishlist` | Wishlist |
| `/reviews` | Review saya |
| `/saved-addresses` | Alamat tersimpan |
| `/notifications` | Notifikasi |

---

## 🔄 Alur Sistem

### Alur Registrasi Merchant

```
┌─────────────────┐
│ Merchant Daftar │
│ /register/      │
│ merchant        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Status: PENDING │
│ (Menunggu       │
│  approval)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Admin Review    │
│ /admin/merchants│
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌──────────┐
│APPROVE│ │ REJECT   │
└───┬───┘ └────┬─────┘
    │          │
    ▼          ▼
┌───────────┐ ┌────────────┐
│ ACTIVE    │ │ Ditolak    │
│ + Beli    │ │ (dengan    │
│ Paket     │ │ alasan)    │
└───────────┘ └────────────┘
```

### Alur Pemesanan

```
┌──────────────┐
│ Pembeli      │
│ tambah ke    │
│ keranjang    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Checkout     │
│ - Alamat     │
│ - Metode     │
│   pembayaran │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Pembayaran   │
│ via Xendit   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Order Status │
│ = NEW        │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Merchant     │
│ proses       │
│ pesanan      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Status =     │
│ PROCESSED    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Admin assign │
│ kurir        │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Kurir        │
│ mengantarkan │
│ Status=SENT  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Bukti        │
│ pengiriman   │
│ (POD)        │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Status =     │
│ DONE         │
└──────────────┘
```

### Alur Pembayaran

```
┌──────────────┐
│ Checkout     │
│ Pilih metode │
│ pembayaran   │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────┐
│         Metode Pembayaran        │
├────────────────┬─────────────────┤
│ ONLINE         │ COD             │
│ (QRIS, VA)     │ (Cash on Deliv) │
└───────┬────────┴────────┬────────┘
        │                 │
        ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Xendit       │  │ Konfirmasi   │
│ Payment      │  │ dari pembeli │
│ Gateway      │  │ (deadline)   │
└──────┬───────┘  └──────┬───────┘
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Webhook      │  │ Bayar saat   │
│ konfirmasi   │  │ terima       │
└──────┬───────┘  └──────────────┘
       │
       ▼
┌──────────────┐
│ Order        │
│ diproses     │
└──────────────┘
```

---

## 🗄️ Database Schema

### Tabel Utama

| Tabel | Deskripsi |
|-------|-----------|
| `profiles` | Data profil user |
| `user_roles` | Role-role user |
| `villages` | Data desa |
| `merchants` | Data merchant/toko |
| `products` | Produk |
| `product_images` | Gambar produk |
| `product_variants` | Varian produk |
| `categories` | Kategori produk |
| `orders` | Pesanan |
| `order_items` | Item dalam pesanan |
| `couriers` | Data kurir |
| `courier_earnings` | Pendapatan kurir |
| `tourism` | Destinasi wisata |
| `reviews` | Review produk |
| `notifications` | Notifikasi |
| `promotions` | Banner promosi |
| `flash_sales` | Flash sale |
| `vouchers` | Voucher diskon |
| `merchant_subscriptions` | Langganan merchant |
| `transaction_packages` | Paket transaksi |
| `withdrawal_requests` | Request withdrawal merchant |
| `verifikator_withdrawals` | Withdrawal verifikator |
| `refund_requests` | Request refund |
| `platform_fees` | Fee platform |
| `insurance_fund` | Dana asuransi |
| `app_settings` | Pengaturan aplikasi |
| `admin_audit_logs` | Log aktivitas admin |
| `backup_logs` | Log backup |
| `backup_schedules` | Jadwal backup |
| `broadcast_notifications` | Broadcast message |
| `push_subscriptions` | Push notification subs |
| `rate_limits` | Rate limiting |
| `password_reset_tokens` | Token reset password |
| `trade_groups` | Kelompok dagang |
| `group_members` | Anggota kelompok |
| `kas_payments` | Pembayaran kas |
| `saved_addresses` | Alamat tersimpan |
| `wishlists` | Wishlist user |

### Relasi Penting

```
users (auth.users)
    │
    ├─── profiles (1:1)
    │
    ├─── user_roles (1:n)
    │
    ├─── merchants (1:1)
    │       │
    │       ├─── products (1:n)
    │       │       │
    │       │       ├─── product_images (1:n)
    │       │       ├─── product_variants (1:n)
    │       │       └─── flash_sales (1:n)
    │       │
    │       ├─── orders (1:n)
    │       │       └─── order_items (1:n)
    │       │
    │       ├─── merchant_subscriptions (1:n)
    │       └─── reviews (1:n)
    │
    ├─── couriers (1:1)
    │       └─── courier_earnings (1:n)
    │
    └─── orders (as buyer) (1:n)

villages
    │
    ├─── merchants (1:n)
    │
    ├─── tourism (1:n)
    │
    └─── couriers (1:n)
```

---

## 🔌 API & Edge Functions

### Edge Functions

| Function | Deskripsi |
|----------|-----------|
| `assign-courier` | Auto-assign kurir ke order |
| `send-push-notification` | Kirim push notification |
| `wilayah-proxy` | Proxy API wilayah Indonesia |
| `xendit-payment` | Buat invoice Xendit |
| `xendit-webhook` | Handle webhook Xendit |

### API Modules (`src/lib/`)

| Module | Deskripsi |
|--------|-----------|
| `api.ts` | API utama (products, villages, tourism) |
| `adminApi.ts` | API admin |
| `addressApi.ts` | API alamat & wilayah |
| `courierApi.ts` | API kurir |
| `paymentApi.ts` | API pembayaran |
| `searchApi.ts` | API pencarian |
| `promotions.ts` | API promosi |
| `storage.ts` | Upload file storage |
| `auditLog.ts` | Logging aktivitas |
| `codSecurity.ts` | Keamanan COD |
| `etaCalculation.ts` | Estimasi pengiriman |
| `merchantOperatingHours.ts` | Jam operasi toko |
| `phoneValidation.ts` | Validasi nomor HP |
| `pushNotification.ts` | Push notifications |
| `rateLimit.ts` | Rate limiting |
| `validationSchemas.ts` | Schema validasi (Zod) |

---

## 🧩 Komponen Utama

### Layout Components

| Komponen | Deskripsi |
|----------|-----------|
| `Header` | Header dengan logo & notifikasi |
| `BottomNav` | Navigasi bawah mobile |
| `FloatingCartButton` | Tombol keranjang melayang |
| `AdminLayout` | Layout dashboard admin |
| `MerchantLayout` | Layout dashboard merchant |
| `CourierLayout` | Layout dashboard kurir |
| `DesaLayout` | Layout dashboard admin desa |
| `VerifikatorLayout` | Layout dashboard verifikator |

### Home Components

| Komponen | Deskripsi |
|----------|-----------|
| `HeroCarousel` | Carousel banner utama |
| `TourismCarousel` | Carousel wisata populer |
| `CategoryIcon` | Icon kategori |
| `ProductCard` | Card produk |
| `VillageCard` | Card desa |
| `TourismCard` | Card wisata |

### Auth Components

| Komponen | Deskripsi |
|----------|-----------|
| `ProtectedRoute` | Route yang butuh auth |
| `RoleBasedRedirect` | Redirect berdasar role |

### Checkout Components

| Komponen | Deskripsi |
|----------|-----------|
| `CheckoutAddressForm` | Form alamat |
| `LocationPicker` | Pilih lokasi peta |
| `VoucherInput` | Input kode voucher |
| `QuotaBlockedAlert` | Alert quota habis |

---

## ⚙️ Konfigurasi

### Environment Variables

```env
VITE_SUPABASE_URL=<supabase_url>
VITE_SUPABASE_PUBLISHABLE_KEY=<anon_key>
VITE_SUPABASE_PROJECT_ID=<project_id>
```

### App Settings (Database)

| Key | Deskripsi |
|-----|-----------|
| `registration` | Aktif/non-aktif registrasi |
| `address_api` | Konfigurasi API wilayah |
| `xendit_payment` | Konfigurasi Xendit |
| `shipping_fee` | Pengaturan ongkir |
| `platform_fee` | Fee platform |
| `shipping_zones` | Zona pengiriman |
| `cod_settings` | Pengaturan COD |
| `whitelabel` | Branding & nama situs |
| `homepage_layout` | Urutan & visibility section homepage |

### PWA Configuration

PWA dikonfigurasi melalui:
- `vite.config.ts` - VitePWA plugin
- `public/sw.js` - Service worker
- `public/pwa-*.png` - Icon PWA

---

## 🔐 Keamanan

### Row Level Security (RLS)

Semua tabel menggunakan RLS untuk memastikan:
- User hanya bisa akses data miliknya
- Admin punya akses penuh
- Role-specific access control

### Security Functions

```sql
-- Cek apakah user punya role tertentu
public.has_role(user_id, role)

-- Digunakan di RLS policies
```

### Best Practices

1. ✅ Role disimpan di tabel terpisah (`user_roles`)
2. ✅ Tidak ada hardcoded credentials
3. ✅ Server-side validation dengan RLS
4. ✅ API keys disimpan di secrets
5. ✅ Rate limiting untuk prevent abuse
6. ✅ Audit logging untuk tracking

---

## 📱 PWA Features

- **Installable** - Bisa diinstall di device
- **Offline Support** - Service worker caching
- **Push Notifications** - Notifikasi real-time
- **Update Prompt** - Prompt update saat ada versi baru
- **Install Banner** - Banner install di homepage

---

## 🚀 Deployment

Platform ini di-deploy melalui **Lovable Cloud** dengan:
- **Preview URL:** Untuk testing
- **Published URL:** Untuk production

### Update Deployment

- **Frontend:** Klik "Update" di publish dialog
- **Backend:** Edge functions deploy otomatis

---

## 📞 Support

Untuk bantuan lebih lanjut:
- Lihat dokumentasi Lovable: https://docs.lovable.dev
- Buka issue di GitHub repository

---

## 🗃️ Complete SQL Schema

Salin dan jalankan SQL berikut di **Supabase SQL Editor** untuk setup database lengkap:

```sql
-- =====================================================
-- PLATFORM DESA WISATA & UMKM - COMPLETE DATABASE SCHEMA
-- =====================================================
-- Version: 2.0.0
-- Date: 2026-02-04
-- =====================================================

-- =====================================================
-- PART 1: EXTENSIONS & TYPES
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'admin_desa', 'merchant', 'buyer', 'verifikator', 'courier');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- PART 2: TABLES
-- =====================================================

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT '',
    phone TEXT,
    address TEXT,
    village TEXT,
    avatar_url TEXT,
    province_id TEXT,
    province_name TEXT,
    city_id TEXT,
    city_name TEXT,
    district_id TEXT,
    district_name TEXT,
    village_id TEXT,
    village_name TEXT,
    address_detail TEXT,
    trust_score INTEGER DEFAULT 100,
    cod_enabled BOOLEAN DEFAULT true,
    cod_fail_count INTEGER DEFAULT 0,
    is_verified_buyer BOOLEAN DEFAULT false,
    is_blocked BOOLEAN DEFAULT false,
    blocked_by UUID,
    blocked_at TIMESTAMP WITH TIME ZONE,
    block_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role app_role NOT NULL DEFAULT 'buyer',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Villages table
CREATE TABLE IF NOT EXISTS public.villages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    district TEXT NOT NULL,
    regency TEXT NOT NULL,
    subdistrict TEXT,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    registration_status TEXT DEFAULT 'PENDING',
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID,
    rejection_reason TEXT,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    user_id UUID,
    location_lat NUMERIC,
    location_lng NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trade groups table
CREATE TABLE IF NOT EXISTS public.trade_groups (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    village_id UUID REFERENCES public.villages(id),
    verifikator_id UUID,
    monthly_fee INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Verifikator codes table
CREATE TABLE IF NOT EXISTS public.verifikator_codes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    verifikator_id UUID NOT NULL,
    trade_group TEXT NOT NULL DEFAULT '',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    max_usage INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transaction packages table
CREATE TABLE IF NOT EXISTS public.transaction_packages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    total_credits INTEGER NOT NULL DEFAULT 0,
    price_per_transaction INTEGER NOT NULL DEFAULT 0,
    transaction_quota INTEGER NOT NULL DEFAULT 0,
    validity_days INTEGER NOT NULL DEFAULT 30,
    group_commission_percent NUMERIC DEFAULT 0,
    classification_price TEXT NOT NULL DEFAULT 'semua',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Quota tiers table
CREATE TABLE IF NOT EXISTS public.quota_tiers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    min_price INTEGER NOT NULL DEFAULT 0,
    max_price INTEGER,
    credit_cost INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Merchants table
CREATE TABLE IF NOT EXISTS public.merchants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    village_id UUID REFERENCES public.villages(id),
    group_id UUID,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    image_url TEXT,
    open_time TIME,
    close_time TIME,
    classification_price TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    order_mode TEXT NOT NULL DEFAULT 'ADMIN_ASSISTED',
    badge TEXT,
    rating_avg NUMERIC DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    is_open BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    registration_status TEXT NOT NULL DEFAULT 'PENDING',
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID,
    rejection_reason TEXT,
    province TEXT,
    city TEXT,
    district TEXT,
    subdistrict TEXT,
    business_category TEXT DEFAULT 'kuliner',
    business_description TEXT,
    trade_group TEXT,
    verifikator_code TEXT,
    verifikator_id UUID,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID,
    location_lat NUMERIC,
    location_lng NUMERIC,
    available_balance INTEGER DEFAULT 0,
    pending_balance INTEGER DEFAULT 0,
    total_withdrawn INTEGER DEFAULT 0,
    cod_max_amount INTEGER DEFAULT 75000,
    cod_max_distance_km NUMERIC DEFAULT 3,
    current_subscription_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Merchant subscriptions table
CREATE TABLE IF NOT EXISTS public.merchant_subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id),
    package_id UUID NOT NULL REFERENCES public.transaction_packages(id),
    transaction_quota INTEGER NOT NULL DEFAULT 0,
    used_quota INTEGER NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'UNPAID',
    payment_amount INTEGER NOT NULL DEFAULT 0,
    paid_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expired_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add FK for current_subscription_id
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'merchants_current_subscription_id_fkey') THEN
        ALTER TABLE public.merchants ADD CONSTRAINT merchants_current_subscription_id_fkey 
        FOREIGN KEY (current_subscription_id) REFERENCES public.merchant_subscriptions(id);
    END IF;
END $$;

-- Add FK for group_id
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'merchants_group_id_fkey') THEN
        ALTER TABLE public.merchants ADD CONSTRAINT merchants_group_id_fkey 
        FOREIGN KEY (group_id) REFERENCES public.trade_groups(id);
    END IF;
END $$;

-- Group members table
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.trade_groups(id),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id),
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    UNIQUE(group_id, merchant_id)
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id),
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    category TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_promo BOOLEAN NOT NULL DEFAULT false,
    discount_percent INTEGER DEFAULT 0,
    discount_end_date TIMESTAMP WITH TIME ZONE,
    min_stock_alert INTEGER DEFAULT 5,
    view_count INTEGER DEFAULT 0,
    order_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Product images table
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Product variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT,
    price_adjustment INTEGER DEFAULT 0,
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Couriers table
CREATE TABLE IF NOT EXISTS public.couriers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    village_id UUID REFERENCES public.villages(id),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    province TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    subdistrict TEXT NOT NULL,
    address TEXT NOT NULL,
    ktp_number TEXT NOT NULL,
    ktp_image_url TEXT NOT NULL,
    photo_url TEXT NOT NULL,
    vehicle_type TEXT NOT NULL DEFAULT 'motor',
    vehicle_plate TEXT,
    vehicle_image_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'INACTIVE',
    registration_status TEXT NOT NULL DEFAULT 'PENDING',
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID,
    rejection_reason TEXT,
    is_available BOOLEAN NOT NULL DEFAULT false,
    current_lat NUMERIC,
    current_lng NUMERIC,
    last_location_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    buyer_id UUID NOT NULL,
    merchant_id UUID REFERENCES public.merchants(id),
    courier_id UUID REFERENCES public.couriers(id),
    status TEXT NOT NULL DEFAULT 'NEW',
    handled_by TEXT NOT NULL DEFAULT 'ADMIN',
    delivery_type TEXT NOT NULL DEFAULT 'PICKUP',
    delivery_name TEXT,
    delivery_phone TEXT,
    delivery_address TEXT,
    delivery_lat NUMERIC,
    delivery_lng NUMERIC,
    notes TEXT,
    subtotal INTEGER NOT NULL DEFAULT 0,
    shipping_cost INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    payment_method TEXT,
    payment_channel TEXT,
    payment_status TEXT DEFAULT 'UNPAID',
    payment_invoice_id TEXT,
    payment_invoice_url TEXT,
    payment_paid_at TIMESTAMP WITH TIME ZONE,
    is_flash_sale BOOLEAN DEFAULT false,
    flash_sale_discount INTEGER DEFAULT 0,
    cod_service_fee INTEGER DEFAULT 0,
    buyer_distance_km NUMERIC,
    confirmation_deadline TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    assigned_at TIMESTAMP WITH TIME ZONE,
    picked_up_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    pod_image_url TEXT,
    pod_notes TEXT,
    pod_uploaded_at TIMESTAMP WITH TIME ZONE,
    cod_confirmed_at TIMESTAMP WITH TIME ZONE,
    cod_rejected_at TIMESTAMP WITH TIME ZONE,
    cod_rejection_reason TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    product_name TEXT NOT NULL,
    product_price INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Courier earnings table
CREATE TABLE IF NOT EXISTS public.courier_earnings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    courier_id UUID NOT NULL REFERENCES public.couriers(id),
    order_id UUID REFERENCES public.orders(id),
    amount INTEGER NOT NULL DEFAULT 0,
    type TEXT NOT NULL DEFAULT 'DELIVERY',
    status TEXT NOT NULL DEFAULT 'PENDING',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tourism table
CREATE TABLE IF NOT EXISTS public.tourism (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    village_id UUID NOT NULL REFERENCES public.villages(id),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    location_lat NUMERIC,
    location_lng NUMERIC,
    wa_link TEXT,
    sosmed_link TEXT,
    facilities TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    buyer_id UUID NOT NULL,
    product_id UUID NOT NULL REFERENCES public.products(id),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id),
    order_id UUID REFERENCES public.orders(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    image_urls TEXT[],
    is_visible BOOLEAN DEFAULT true,
    merchant_reply TEXT,
    merchant_replied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Flash sales table
CREATE TABLE IF NOT EXISTS public.flash_sales (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id),
    product_id UUID NOT NULL REFERENCES public.products(id),
    original_price INTEGER NOT NULL,
    flash_price INTEGER NOT NULL,
    stock_available INTEGER NOT NULL DEFAULT 1,
    stock_sold INTEGER NOT NULL DEFAULT 0,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vouchers table
CREATE TABLE IF NOT EXISTS public.vouchers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID REFERENCES public.merchants(id),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL DEFAULT 'percentage',
    discount_value INTEGER NOT NULL,
    max_discount INTEGER,
    min_order_amount INTEGER DEFAULT 0,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Voucher usages table
CREATE TABLE IF NOT EXISTS public.voucher_usages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    voucher_id UUID NOT NULL REFERENCES public.vouchers(id),
    user_id UUID NOT NULL,
    order_id UUID REFERENCES public.orders(id),
    discount_amount INTEGER NOT NULL DEFAULT 0,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Promotions table
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT,
    type TEXT NOT NULL,
    link_type TEXT,
    link_url TEXT,
    link_id UUID,
    advertiser_id UUID,
    advertiser_type TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    is_approved BOOLEAN DEFAULT false,
    is_paid BOOLEAN DEFAULT false,
    price INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Saved addresses table
CREATE TABLE IF NOT EXISTS public.saved_addresses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    label TEXT NOT NULL DEFAULT 'Rumah',
    recipient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    province_id TEXT,
    province_name TEXT,
    city_id TEXT,
    city_name TEXT,
    district_id TEXT,
    district_name TEXT,
    village_id TEXT,
    village_name TEXT,
    address_detail TEXT,
    full_address TEXT,
    lat NUMERIC,
    lng NUMERIC,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Refund requests table
CREATE TABLE IF NOT EXISTS public.refund_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id),
    buyer_id UUID NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    admin_notes TEXT,
    processed_by UUID,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Platform fees table
CREATE TABLE IF NOT EXISTS public.platform_fees (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id),
    merchant_id UUID REFERENCES public.merchants(id),
    order_total INTEGER NOT NULL DEFAULT 0,
    shipping_cost INTEGER NOT NULL DEFAULT 0,
    platform_fee INTEGER NOT NULL DEFAULT 0,
    platform_fee_percent NUMERIC NOT NULL DEFAULT 0,
    courier_fee INTEGER NOT NULL DEFAULT 0,
    merchant_revenue INTEGER NOT NULL DEFAULT 0,
    fee_type TEXT NOT NULL DEFAULT 'ORDER',
    status TEXT NOT NULL DEFAULT 'PENDING',
    collected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insurance fund table
CREATE TABLE IF NOT EXISTS public.insurance_fund (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id),
    order_id UUID REFERENCES public.orders(id),
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    claim_reason TEXT,
    evidence_urls TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'PENDING',
    processed_by UUID,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Kas payments table
CREATE TABLE IF NOT EXISTS public.kas_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.trade_groups(id),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id),
    amount INTEGER NOT NULL,
    payment_month INTEGER NOT NULL,
    payment_year INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'UNPAID',
    notes TEXT,
    payment_date TIMESTAMP WITH TIME ZONE,
    collected_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Verifikator earnings table
CREATE TABLE IF NOT EXISTS public.verifikator_earnings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    verifikator_id UUID NOT NULL,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id),
    subscription_id UUID NOT NULL REFERENCES public.merchant_subscriptions(id),
    package_id UUID NOT NULL REFERENCES public.transaction_packages(id),
    package_amount INTEGER NOT NULL,
    commission_percent NUMERIC NOT NULL,
    commission_amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Verifikator withdrawals table
CREATE TABLE IF NOT EXISTS public.verifikator_withdrawals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    verifikator_id UUID NOT NULL,
    amount INTEGER NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_holder TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    admin_notes TEXT,
    proof_image_url TEXT,
    processed_by UUID,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- App settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}',
    category TEXT NOT NULL DEFAULT 'general',
    description TEXT,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Admin audit logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    action TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Broadcast notifications table
CREATE TABLE IF NOT EXISTS public.broadcast_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_audience TEXT NOT NULL DEFAULT 'ALL',
    target_roles TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'DRAFT',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    sent_count INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Backup logs table
CREATE TABLE IF NOT EXISTS public.backup_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    backup_type TEXT NOT NULL DEFAULT 'manual',
    status TEXT NOT NULL DEFAULT 'pending',
    tables_included TEXT[],
    file_url TEXT,
    file_size INTEGER,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID
);

-- Backup schedules table
CREATE TABLE IF NOT EXISTS public.backup_schedules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    schedule_type TEXT NOT NULL DEFAULT 'daily',
    schedule_time TIME NOT NULL DEFAULT '02:00:00',
    schedule_day INTEGER,
    tables_included TEXT[] DEFAULT ARRAY['merchants', 'products', 'orders'],
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Push subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Rate limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL,
    action TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- SEO settings table
CREATE TABLE IF NOT EXISTS public.seo_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    page_path TEXT NOT NULL UNIQUE,
    title TEXT,
    description TEXT,
    keywords TEXT,
    og_title TEXT,
    og_description TEXT,
    og_image TEXT,
    canonical_url TEXT,
    robots TEXT,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User villages table
CREATE TABLE IF NOT EXISTS public.user_villages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    village_id UUID NOT NULL REFERENCES public.villages(id),
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, village_id)
);

-- =====================================================
-- PART 3: SECURITY DEFINER FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
$$;

CREATE OR REPLACE FUNCTION public.is_verifikator()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'verifikator')
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_merchant_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.merchants WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_user_courier_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.couriers WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_order_merchant(_order_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o JOIN public.merchants m ON o.merchant_id = m.id
    WHERE o.id = _order_id AND m.user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.is_order_merchant(_user_id UUID, _merchant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.merchants WHERE id = _merchant_id AND user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_order_courier(_order_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o JOIN public.couriers c ON o.courier_id = c.id
    WHERE o.id = _order_id AND c.user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.is_courier_owner(_user_id UUID, _courier_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.couriers WHERE id = _courier_id AND user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.get_quota_cost(product_price INTEGER)
RETURNS INTEGER LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT credit_cost FROM public.quota_tiers 
     WHERE is_active = true AND product_price >= min_price 
     AND (max_price IS NULL OR product_price <= max_price)
     ORDER BY min_price DESC LIMIT 1), 1)
$$;

CREATE OR REPLACE FUNCTION public.use_merchant_quota(_merchant_id UUID, _product_price INTEGER)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _subscription_id UUID;
  _remaining_quota INTEGER;
  _cost INTEGER;
BEGIN
  _cost := public.get_quota_cost(_product_price);
  SELECT id, (transaction_quota - used_quota) INTO _subscription_id, _remaining_quota
  FROM public.merchant_subscriptions
  WHERE merchant_id = _merchant_id AND status = 'ACTIVE' AND expired_at > now()
  ORDER BY created_at DESC LIMIT 1;
  IF _subscription_id IS NULL OR _remaining_quota < _cost THEN RETURN FALSE; END IF;
  UPDATE public.merchant_subscriptions SET used_quota = used_quota + _cost, updated_at = now()
  WHERE id = _subscription_id;
  RETURN TRUE;
END;
$$;

-- =====================================================
-- PART 4: VIEWS
-- =====================================================

DROP VIEW IF EXISTS public.public_merchants CASCADE;
DROP VIEW IF EXISTS public.public_couriers CASCADE;

CREATE OR REPLACE VIEW public.public_merchants AS
SELECT id, name, image_url, business_category, business_description, province, city, district,
    open_time, close_time, order_mode, badge, rating_avg, rating_count, is_open, is_verified, village_id,
    ROUND(COALESCE(location_lat, 0), 2) as location_lat_approx,
    ROUND(COALESCE(location_lng, 0), 2) as location_lng_approx,
    CASE WHEN phone IS NOT NULL THEN CONCAT(LEFT(phone, 4), '****', RIGHT(phone, 3)) ELSE NULL END as phone_masked
FROM public.merchants WHERE status = 'ACTIVE' AND registration_status = 'APPROVED';

CREATE OR REPLACE VIEW public.public_couriers AS
SELECT id, name, photo_url, vehicle_type, status, is_available, village_id,
    ROUND(COALESCE(current_lat, 0), 2) as current_lat_approx,
    ROUND(COALESCE(current_lng, 0), 2) as current_lng_approx,
    CASE WHEN phone IS NOT NULL THEN CONCAT(LEFT(phone, 4), '****', RIGHT(phone, 3)) ELSE NULL END as phone_masked
FROM public.couriers WHERE status = 'ACTIVE' AND registration_status = 'APPROVED';

-- =====================================================
-- PART 5: ENABLE RLS
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifikator_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourism ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_fund ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kas_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifikator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifikator_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_villages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 6: RLS POLICIES (KEY TABLES)
-- =====================================================

-- Profiles
DROP POLICY IF EXISTS "profiles_view_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin" ON public.profiles;
CREATE POLICY "profiles_view_own" ON public.profiles FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profiles_admin" ON public.profiles FOR ALL USING (is_admin());

-- User roles
DROP POLICY IF EXISTS "user_roles_view_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin" ON public.user_roles;
CREATE POLICY "user_roles_view_own" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_roles_admin" ON public.user_roles FOR ALL USING (is_admin());

-- Quota tiers
DROP POLICY IF EXISTS "quota_tiers_read" ON public.quota_tiers;
DROP POLICY IF EXISTS "quota_tiers_admin" ON public.quota_tiers;
CREATE POLICY "quota_tiers_read" ON public.quota_tiers FOR SELECT USING (true);
CREATE POLICY "quota_tiers_admin" ON public.quota_tiers FOR ALL USING (is_admin());

-- Categories  
DROP POLICY IF EXISTS "categories_read" ON public.categories;
DROP POLICY IF EXISTS "categories_admin" ON public.categories;
CREATE POLICY "categories_read" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "categories_admin" ON public.categories FOR ALL USING (is_admin());

-- Merchants
DROP POLICY IF EXISTS "merchants_view_active" ON public.merchants;
DROP POLICY IF EXISTS "merchants_view_own" ON public.merchants;
DROP POLICY IF EXISTS "merchants_update_own" ON public.merchants;
DROP POLICY IF EXISTS "merchants_register" ON public.merchants;
DROP POLICY IF EXISTS "merchants_admin" ON public.merchants;
DROP POLICY IF EXISTS "merchants_verifikator" ON public.merchants;
CREATE POLICY "merchants_view_active" ON public.merchants FOR SELECT USING (status = 'ACTIVE' AND registration_status = 'APPROVED');
CREATE POLICY "merchants_view_own" ON public.merchants FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "merchants_update_own" ON public.merchants FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "merchants_register" ON public.merchants FOR INSERT WITH CHECK (registration_status = 'PENDING');
CREATE POLICY "merchants_admin" ON public.merchants FOR ALL USING (is_admin());
CREATE POLICY "merchants_verifikator" ON public.merchants FOR ALL USING (is_verifikator());

-- Products
DROP POLICY IF EXISTS "products_view_active" ON public.products;
DROP POLICY IF EXISTS "products_merchant" ON public.products;
DROP POLICY IF EXISTS "products_admin" ON public.products;
CREATE POLICY "products_view_active" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "products_merchant" ON public.products FOR ALL USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = products.merchant_id AND merchants.user_id = auth.uid()));
CREATE POLICY "products_admin" ON public.products FOR ALL USING (is_admin());

-- Couriers
DROP POLICY IF EXISTS "couriers_view_approved" ON public.couriers;
DROP POLICY IF EXISTS "couriers_own" ON public.couriers;
DROP POLICY IF EXISTS "couriers_register" ON public.couriers;
DROP POLICY IF EXISTS "couriers_admin" ON public.couriers;
CREATE POLICY "couriers_view_approved" ON public.couriers FOR SELECT USING (registration_status = 'APPROVED' AND status = 'ACTIVE');
CREATE POLICY "couriers_own" ON public.couriers FOR ALL USING (user_id = auth.uid());
CREATE POLICY "couriers_register" ON public.couriers FOR INSERT WITH CHECK (registration_status = 'PENDING');
CREATE POLICY "couriers_admin" ON public.couriers FOR ALL USING (is_admin());

-- Orders
DROP POLICY IF EXISTS "orders_buyer" ON public.orders;
DROP POLICY IF EXISTS "orders_merchant" ON public.orders;
DROP POLICY IF EXISTS "orders_courier" ON public.orders;
DROP POLICY IF EXISTS "orders_admin" ON public.orders;
CREATE POLICY "orders_buyer" ON public.orders FOR ALL USING (buyer_id = auth.uid());
CREATE POLICY "orders_merchant" ON public.orders FOR ALL USING (is_order_merchant(id));
CREATE POLICY "orders_courier" ON public.orders FOR ALL USING (is_order_courier(id));
CREATE POLICY "orders_admin" ON public.orders FOR ALL USING (is_admin());

-- Notifications
DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_admin" ON public.notifications;
CREATE POLICY "notifications_own" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "notifications_admin" ON public.notifications FOR ALL USING (is_admin());

-- Saved addresses
DROP POLICY IF EXISTS "saved_addresses_own" ON public.saved_addresses;
CREATE POLICY "saved_addresses_own" ON public.saved_addresses FOR ALL USING (auth.uid() = user_id);

-- App settings
DROP POLICY IF EXISTS "app_settings_read" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_admin" ON public.app_settings;
CREATE POLICY "app_settings_read" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "app_settings_admin" ON public.app_settings FOR ALL USING (is_admin());

-- =====================================================
-- PART 7: DEFAULT DATA
-- =====================================================

INSERT INTO public.quota_tiers (min_price, max_price, credit_cost, description, sort_order)
SELECT * FROM (VALUES
    (0, 3000, 1, 'Rp 0 - Rp 3.000', 1),
    (3001, 5000, 2, 'Rp 3.001 - Rp 5.000', 2),
    (5001, 8000, 3, 'Rp 5.001 - Rp 8.000', 3),
    (8001, 15000, 4, 'Rp 8.001 - Rp 15.000', 4),
    (15001, 25000, 5, 'Rp 15.001 - Rp 25.000', 5),
    (25001, 50000, 7, 'Rp 25.001 - Rp 50.000', 6),
    (50001, 100000, 10, 'Rp 50.001 - Rp 100.000', 7),
    (100001, NULL, 15, 'Di atas Rp 100.000', 8)
) AS v(min_price, max_price, credit_cost, description, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.quota_tiers LIMIT 1);

INSERT INTO public.categories (name, slug, icon, sort_order)
SELECT * FROM (VALUES
    ('Kuliner', 'kuliner', 'utensils', 1),
    ('Kerajinan', 'kerajinan', 'palette', 2),
    ('Fashion', 'fashion', 'shirt', 3),
    ('Pertanian', 'pertanian', 'leaf', 4),
    ('Minuman', 'minuman', 'coffee', 5),
    ('Oleh-oleh', 'oleh-oleh', 'gift', 6)
) AS v(name, slug, icon, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.categories LIMIT 1);

-- =====================================================
-- COMPLETE!
-- =====================================================
```

---

**© 2024 Platform Desa Wisata & UMKM**
