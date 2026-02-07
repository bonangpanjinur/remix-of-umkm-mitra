-- =====================================================
-- DESA DIGITAL - COMPLETE IDEMPOTENT MIGRATION
-- Version: 4.0 - Full Features (Safe to run multiple times)
-- Generated: 2026-02-07
-- 
-- IMPORTANT: This SQL is safe to run on any Supabase project.
-- - Tables: CREATE TABLE IF NOT EXISTS (won't fail if exists)
-- - Columns: ALTER TABLE ADD COLUMN IF NOT EXISTS (won't fail if exists)
-- - Functions: CREATE OR REPLACE (will update if exists)
-- - Triggers: DROP IF EXISTS + CREATE (will recreate)
-- - Policies: DROP IF EXISTS + CREATE (will recreate)
-- - Storage: ON CONFLICT DO NOTHING (won't fail if exists)
-- - Data: ON CONFLICT DO NOTHING/UPDATE (won't fail if exists)
-- - Constraints: wrapped in DO $$ EXCEPTION blocks
-- =====================================================

-- =====================================================
-- PART 1: EXTENSIONS & CUSTOM TYPES
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'buyer', 'verifikator', 'merchant', 'courier', 'admin_desa');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- PART 2: CORE TABLES
-- =====================================================

-- User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL DEFAULT 'buyer',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL DEFAULT '',
  phone text,
  address text,
  address_detail text,
  village text,
  province_id text,
  province_name text,
  city_id text,
  city_name text,
  district_id text,
  district_name text,
  village_id text,
  village_name text,
  avatar_url text,
  is_blocked boolean DEFAULT false,
  block_reason text,
  blocked_by uuid,
  blocked_at timestamptz,
  is_verified_buyer boolean DEFAULT false,
  cod_enabled boolean DEFAULT true,
  cod_fail_count integer DEFAULT 0,
  trust_score integer DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Villages (Desa)
CREATE TABLE IF NOT EXISTS public.villages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  district text,
  regency text,
  subdistrict text,
  description text,
  image_url text,
  is_active boolean DEFAULT true,
  registration_status text DEFAULT 'PENDING',
  registered_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  approved_by uuid,
  rejection_reason text,
  contact_name text,
  contact_phone text,
  contact_email text,
  location_lat numeric,
  location_lng numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User Villages (Admin Desa assignment)
CREATE TABLE IF NOT EXISTS public.user_villages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  village_id uuid NOT NULL REFERENCES public.villages(id),
  role text DEFAULT 'admin_desa',
  created_at timestamptz DEFAULT now()
);

-- Trade Groups (Kelompok Dagang)
CREATE TABLE IF NOT EXISTS public.trade_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  village_id uuid REFERENCES public.villages(id),
  verifikator_id uuid,
  description text,
  kas_amount integer DEFAULT 10000,
  monthly_fee integer DEFAULT 10000,
  total_kas_collected integer DEFAULT 0,
  member_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Transaction Packages
CREATE TABLE IF NOT EXISTS public.transaction_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  classification_price text DEFAULT 'medium',
  price_per_transaction integer NOT NULL DEFAULT 0,
  group_commission_percent numeric DEFAULT 10,
  transaction_quota integer NOT NULL DEFAULT 0,
  total_credits integer DEFAULT 100,
  validity_days integer DEFAULT 30,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Safe add column if not exists
ALTER TABLE public.transaction_packages ADD COLUMN IF NOT EXISTS total_credits integer DEFAULT 100;

-- Merchants (Pedagang)
CREATE TABLE IF NOT EXISTS public.merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  village_id uuid REFERENCES public.villages(id),
  group_id uuid,
  current_subscription_id uuid,
  verifikator_id uuid,
  name text NOT NULL,
  phone text,
  address text,
  province text,
  city text,
  district text,
  subdistrict text,
  image_url text,
  cover_image_url text,
  business_category text DEFAULT 'kuliner',
  business_description text,
  classification_price text,
  trade_group text,
  verifikator_code text,
  open_time time,
  close_time time,
  is_open boolean DEFAULT true,
  status text DEFAULT 'ACTIVE',
  registration_status text DEFAULT 'PENDING',
  registered_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  approved_by uuid,
  rejection_reason text,
  order_mode text DEFAULT 'ADMIN_ASSISTED',
  badge text,
  rating_avg numeric DEFAULT 0,
  rating_count integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  verified_at timestamptz,
  verified_by uuid,
  location_lat numeric,
  location_lng numeric,
  available_balance integer DEFAULT 0,
  pending_balance integer DEFAULT 0,
  total_withdrawn integer DEFAULT 0,
  cod_max_amount integer DEFAULT 75000,
  cod_max_distance_km numeric DEFAULT 3,
  payment_cod_enabled boolean DEFAULT true,
  payment_transfer_enabled boolean DEFAULT true,
  bank_name text,
  bank_account_number text,
  bank_account_name text,
  qris_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Safe add newer columns
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS qris_image_url text;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS cod_max_amount integer DEFAULT 75000;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS cod_max_distance_km numeric DEFAULT 3;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS payment_cod_enabled boolean DEFAULT true;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS payment_transfer_enabled boolean DEFAULT true;

-- Merchant Subscriptions
CREATE TABLE IF NOT EXISTS public.merchant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id),
  package_id uuid NOT NULL REFERENCES public.transaction_packages(id),
  transaction_quota integer NOT NULL DEFAULT 0,
  used_quota integer NOT NULL DEFAULT 0,
  payment_amount integer NOT NULL DEFAULT 0,
  payment_status text DEFAULT 'UNPAID',
  paid_at timestamptz,
  status text DEFAULT 'ACTIVE',
  started_at timestamptz DEFAULT now(),
  expired_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add FK for current_subscription_id (safe)
ALTER TABLE public.merchants 
  DROP CONSTRAINT IF EXISTS merchants_current_subscription_id_fkey;
ALTER TABLE public.merchants 
  ADD CONSTRAINT merchants_current_subscription_id_fkey 
  FOREIGN KEY (current_subscription_id) REFERENCES public.merchant_subscriptions(id);

-- Add FK for group_id (safe)
DO $$ BEGIN
  ALTER TABLE public.merchants 
    ADD CONSTRAINT merchants_group_id_fkey 
    FOREIGN KEY (group_id) REFERENCES public.trade_groups(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Group Members
CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.trade_groups(id),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id),
  status text DEFAULT 'ACTIVE',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, merchant_id)
);

-- Kas Payments
CREATE TABLE IF NOT EXISTS public.kas_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.trade_groups(id),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id),
  amount integer NOT NULL,
  payment_month integer NOT NULL,
  payment_year integer NOT NULL,
  status text DEFAULT 'UNPAID',
  payment_date timestamptz,
  collected_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, merchant_id, payment_month, payment_year)
);

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id),
  name text NOT NULL,
  description text,
  price integer NOT NULL,
  stock integer DEFAULT 0,
  image_url text,
  category text NOT NULL,
  is_active boolean DEFAULT true,
  is_promo boolean DEFAULT false,
  discount_percent integer DEFAULT 0,
  discount_end_date timestamptz,
  min_stock_alert integer DEFAULT 5,
  view_count integer DEFAULT 0,
  order_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Product Images
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  is_primary boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Product Variants
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  price_adjustment integer DEFAULT 0,
  stock integer DEFAULT 0,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Quota Tiers
CREATE TABLE IF NOT EXISTS public.quota_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_price integer NOT NULL DEFAULT 0,
  max_price integer,
  credit_cost integer NOT NULL DEFAULT 1,
  description text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tourism (Wisata)
CREATE TABLE IF NOT EXISTS public.tourism (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id uuid REFERENCES public.villages(id),
  name text NOT NULL,
  description text,
  image_url text,
  location_lat numeric,
  location_lng numeric,
  wa_link text,
  sosmed_link text,
  facilities text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  view_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Couriers
CREATE TABLE IF NOT EXISTS public.couriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  village_id uuid REFERENCES public.villages(id),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  province text NOT NULL,
  city text NOT NULL,
  district text NOT NULL,
  subdistrict text NOT NULL,
  address text NOT NULL,
  ktp_number text NOT NULL,
  ktp_image_url text NOT NULL,
  photo_url text NOT NULL,
  vehicle_type text DEFAULT 'motor',
  vehicle_plate text,
  vehicle_image_url text NOT NULL,
  registration_status text DEFAULT 'PENDING',
  status text DEFAULT 'INACTIVE',
  is_available boolean DEFAULT false,
  current_lat numeric,
  current_lng numeric,
  last_location_update timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  rejection_reason text,
  registered_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  merchant_id uuid REFERENCES public.merchants(id),
  courier_id uuid REFERENCES public.couriers(id),
  status text DEFAULT 'NEW',
  handled_by text DEFAULT 'ADMIN',
  delivery_type text DEFAULT 'PICKUP',
  delivery_name text,
  delivery_phone text,
  delivery_address text,
  delivery_lat numeric,
  delivery_lng numeric,
  buyer_distance_km numeric,
  subtotal integer DEFAULT 0,
  shipping_cost integer DEFAULT 0,
  flash_sale_discount integer DEFAULT 0,
  cod_service_fee integer DEFAULT 0,
  total integer DEFAULT 0,
  notes text,
  payment_method text,
  payment_channel text,
  payment_status text DEFAULT 'UNPAID',
  payment_invoice_id text,
  payment_invoice_url text,
  payment_paid_at timestamptz,
  payment_proof_url text,
  is_flash_sale boolean DEFAULT false,
  rejection_reason text,
  assigned_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  confirmed_at timestamptz,
  confirmation_deadline timestamptz,
  auto_complete_at timestamptz,
  pod_image_url text,
  pod_notes text,
  pod_uploaded_at timestamptz,
  cod_confirmed_at timestamptz,
  cod_rejected_at timestamptz,
  cod_rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Safe add newer columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS auto_complete_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_proof_url text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cod_service_fee integer DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS buyer_distance_km numeric;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS flash_sale_discount integer DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_flash_sale boolean DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmation_deadline timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pod_image_url text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pod_notes text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pod_uploaded_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cod_confirmed_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cod_rejected_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cod_rejection_reason text;

-- Update orders status constraint to include all statuses (drop old, add new)
DO $$ BEGIN
  ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
  ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status = ANY (ARRAY[
    'NEW', 'PENDING_CONFIRMATION', 'PENDING_PAYMENT', 'PROCESSED', 'READY',
    'ASSIGNED', 'PICKED_UP', 'SENT', 'DELIVERED', 'DONE', 
    'CANCELED', 'REJECTED', 'REJECTED_BY_BUYER', 'REFUNDED'
  ]));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  product_name text NOT NULL,
  product_price integer NOT NULL,
  quantity integer NOT NULL,
  subtotal integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Flash Sales
CREATE TABLE IF NOT EXISTS public.flash_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  original_price integer NOT NULL,
  flash_price integer NOT NULL,
  stock_available integer DEFAULT 1,
  stock_sold integer DEFAULT 0,
  start_time timestamptz DEFAULT now(),
  end_time timestamptz NOT NULL,
  status text DEFAULT 'ACTIVE',
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id),
  buyer_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  image_urls text[] DEFAULT '{}',
  is_visible boolean DEFAULT true,
  merchant_reply text,
  merchant_replied_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS merchant_replied_at timestamptz;

-- Refund Requests
CREATE TABLE IF NOT EXISTS public.refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  buyer_id uuid NOT NULL,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id),
  amount integer NOT NULL,
  reason text NOT NULL,
  evidence_urls text[] DEFAULT '{}',
  status text DEFAULT 'PENDING',
  admin_notes text,
  processed_by uuid,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Withdrawal Requests (Merchant)
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id),
  amount integer NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_holder text NOT NULL,
  status text DEFAULT 'PENDING',
  admin_notes text,
  processed_by uuid,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Verifikator Earnings
CREATE TABLE IF NOT EXISTS public.verifikator_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verifikator_id uuid NOT NULL,
  merchant_id uuid REFERENCES public.merchants(id),
  subscription_id uuid REFERENCES public.merchant_subscriptions(id),
  package_id uuid REFERENCES public.transaction_packages(id),
  package_amount integer DEFAULT 0,
  commission_percent numeric DEFAULT 0,
  commission_amount integer DEFAULT 0,
  status text DEFAULT 'PENDING',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Verifikator Withdrawals
CREATE TABLE IF NOT EXISTS public.verifikator_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verifikator_id uuid NOT NULL,
  amount integer NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_holder text NOT NULL,
  status text DEFAULT 'PENDING',
  admin_notes text,
  proof_image_url text,
  processed_by uuid,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.verifikator_withdrawals ADD COLUMN IF NOT EXISTS proof_image_url text;
ALTER TABLE public.verifikator_withdrawals ADD COLUMN IF NOT EXISTS account_holder text DEFAULT '';

-- Verifikator Codes
CREATE TABLE IF NOT EXISTS public.verifikator_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verifikator_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  trade_group text DEFAULT '',
  description text,
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  max_usage integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.verifikator_codes ADD COLUMN IF NOT EXISTS trade_group text DEFAULT '';

-- Courier Earnings
CREATE TABLE IF NOT EXISTS public.courier_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id uuid NOT NULL REFERENCES public.couriers(id),
  order_id uuid REFERENCES public.orders(id),
  amount integer DEFAULT 0,
  type text DEFAULT 'DELIVERY',
  status text DEFAULT 'PENDING',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Platform Fees
CREATE TABLE IF NOT EXISTS public.platform_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id),
  merchant_id uuid REFERENCES public.merchants(id),
  order_total integer DEFAULT 0,
  shipping_cost integer DEFAULT 0,
  platform_fee integer DEFAULT 0,
  platform_fee_percent numeric DEFAULT 0,
  courier_fee integer DEFAULT 0,
  merchant_revenue integer DEFAULT 0,
  fee_type text DEFAULT 'ORDER',
  status text DEFAULT 'PENDING',
  collected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Insurance Fund
CREATE TABLE IF NOT EXISTS public.insurance_fund (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id),
  order_id uuid REFERENCES public.orders(id),
  type text NOT NULL,
  amount integer NOT NULL,
  claim_reason text,
  evidence_urls text[] DEFAULT '{}',
  status text DEFAULT 'PENDING',
  processed_by uuid,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Vouchers
CREATE TABLE IF NOT EXISTS public.vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid REFERENCES public.merchants(id),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  discount_type text DEFAULT 'percentage',
  discount_value integer NOT NULL DEFAULT 0,
  min_order_amount integer DEFAULT 0,
  max_discount integer,
  usage_limit integer,
  used_count integer DEFAULT 0,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS created_by uuid;

-- Voucher Usages
CREATE TABLE IF NOT EXISTS public.voucher_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id uuid NOT NULL REFERENCES public.vouchers(id),
  user_id uuid NOT NULL,
  order_id uuid REFERENCES public.orders(id),
  discount_amount integer NOT NULL DEFAULT 0,
  used_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(voucher_id, user_id)
);

-- Promotions/Banners
CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text,
  type text NOT NULL,
  link_type text,
  link_url text,
  link_id uuid,
  advertiser_type text,
  advertiser_id uuid,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  is_active boolean DEFAULT true,
  is_approved boolean DEFAULT false,
  is_paid boolean DEFAULT false,
  price integer DEFAULT 0,
  sort_order integer DEFAULT 0,
  view_count integer DEFAULT 0,
  click_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  link text,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Broadcast Notifications
CREATE TABLE IF NOT EXISTS public.broadcast_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  target_audience text DEFAULT 'ALL',
  target_roles text[] DEFAULT '{}',
  status text DEFAULT 'DRAFT',
  scheduled_at timestamptz,
  sent_at timestamptz,
  sent_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Push Subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Saved Addresses
CREATE TABLE IF NOT EXISTS public.saved_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL DEFAULT 'Rumah',
  recipient_name text NOT NULL,
  phone text NOT NULL,
  full_address text,
  address_detail text,
  province_id text,
  province_name text,
  city_id text,
  city_name text,
  district_id text,
  district_name text,
  village_id text,
  village_name text,
  lat numeric,
  lng numeric,
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.saved_addresses ADD COLUMN IF NOT EXISTS full_address text;
ALTER TABLE public.saved_addresses ADD COLUMN IF NOT EXISTS address_detail text;
ALTER TABLE public.saved_addresses ADD COLUMN IF NOT EXISTS lat numeric;
ALTER TABLE public.saved_addresses ADD COLUMN IF NOT EXISTS lng numeric;

-- Wishlists
CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- App Settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}',
  description text,
  category text DEFAULT 'general',
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Admin Audit Logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Backup Logs
CREATE TABLE IF NOT EXISTS public.backup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type text DEFAULT 'manual',
  status text DEFAULT 'pending',
  file_url text,
  file_size integer,
  tables_included text[],
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_by uuid
);

-- Backup Schedules
CREATE TABLE IF NOT EXISTS public.backup_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  schedule_type text DEFAULT 'daily',
  schedule_time time DEFAULT '02:00:00',
  schedule_day integer,
  tables_included text[] DEFAULT ARRAY['merchants', 'products', 'orders', 'villages', 'tourism', 'couriers'],
  is_active boolean DEFAULT true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Rate Limits
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  action text NOT NULL,
  count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(identifier, action, window_start)
);

-- SEO Settings
CREATE TABLE IF NOT EXISTS public.seo_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path text NOT NULL,
  title text,
  description text,
  keywords text,
  og_title text,
  og_description text,
  og_image text,
  canonical_url text,
  robots text DEFAULT 'index, follow',
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);


-- =====================================================
-- PART 3: HELPER FUNCTIONS (CREATE OR REPLACE = safe)
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role); $$;

CREATE OR REPLACE FUNCTION public.is_verifikator()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'verifikator'::app_role); $$;

CREATE OR REPLACE FUNCTION public.is_admin_desa()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin_desa'::app_role); $$;

CREATE OR REPLACE FUNCTION public.is_merchant()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'merchant'::app_role); $$;

CREATE OR REPLACE FUNCTION public.is_courier()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'courier'::app_role); $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role); $$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles)); $$;

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT COALESCE(array_agg(role::text), ARRAY[]::text[]) FROM public.user_roles WHERE user_id = _user_id; $$;

CREATE OR REPLACE FUNCTION public.get_user_merchant_id(_user_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM public.merchants WHERE user_id = COALESCE(_user_id, auth.uid()) LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.get_user_courier_id(_user_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM public.couriers WHERE user_id = COALESCE(_user_id, auth.uid()) LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.is_order_merchant(_user_id uuid, _merchant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.merchants WHERE id = _merchant_id AND user_id = _user_id); $$;

-- Overload: is_order_merchant(order_id)
CREATE OR REPLACE FUNCTION public.is_order_merchant(check_order_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.orders o JOIN public.merchants m ON o.merchant_id = m.id WHERE o.id = check_order_id AND m.user_id = auth.uid()); $$;

CREATE OR REPLACE FUNCTION public.is_courier_owner(check_user_id uuid, check_courier_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.couriers WHERE id = check_courier_id AND user_id = check_user_id); $$;

CREATE OR REPLACE FUNCTION public.is_order_courier(check_order_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.orders o JOIN public.couriers c ON o.courier_id = c.id WHERE o.id = check_order_id AND c.user_id = auth.uid()); $$;

CREATE OR REPLACE FUNCTION public.get_quota_cost(product_price integer)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT COALESCE((SELECT credit_cost FROM public.quota_tiers WHERE is_active = true AND product_price >= min_price AND (max_price IS NULL OR product_price <= max_price) ORDER BY min_price DESC LIMIT 1), 1); $$;

CREATE OR REPLACE FUNCTION public.use_merchant_quota(p_merchant_id uuid, p_credits integer DEFAULT 1)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_subscription_id uuid; v_remaining integer;
BEGIN
  SELECT id, (transaction_quota - used_quota) INTO v_subscription_id, v_remaining
  FROM public.merchant_subscriptions WHERE merchant_id = p_merchant_id AND status = 'ACTIVE' AND expired_at > now()
  ORDER BY expired_at DESC LIMIT 1;
  IF v_subscription_id IS NULL THEN RETURN false; END IF;
  IF v_remaining < p_credits THEN RETURN false; END IF;
  UPDATE public.merchant_subscriptions SET used_quota = used_quota + p_credits, updated_at = now() WHERE id = v_subscription_id;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.deduct_merchant_quota(p_merchant_id uuid, p_credits integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_sub_id UUID; v_remaining INTEGER;
BEGIN
  SELECT id, (transaction_quota - used_quota) INTO v_sub_id, v_remaining
  FROM public.merchant_subscriptions WHERE merchant_id = p_merchant_id AND status = 'ACTIVE' AND expired_at > now() AND (transaction_quota - used_quota) >= p_credits
  ORDER BY expired_at ASC LIMIT 1;
  IF v_sub_id IS NULL THEN RETURN FALSE; END IF;
  UPDATE public.merchant_subscriptions SET used_quota = used_quota + p_credits, updated_at = now() WHERE id = v_sub_id;
  RETURN TRUE;
END; $$;

CREATE OR REPLACE FUNCTION public.check_merchant_quota(p_merchant_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_subscription RECORD;
BEGIN
  SELECT * INTO v_subscription FROM merchant_subscriptions WHERE merchant_id = p_merchant_id AND status = 'ACTIVE' AND expired_at > now() AND used_quota < transaction_quota ORDER BY expired_at DESC LIMIT 1;
  IF v_subscription IS NULL THEN RETURN jsonb_build_object('can_transact', false, 'reason', 'Tidak ada kuota transaksi aktif.', 'remaining_quota', 0); END IF;
  RETURN jsonb_build_object('can_transact', true, 'remaining_quota', v_subscription.transaction_quota - v_subscription.used_quota, 'subscription_id', v_subscription.id);
END; $$;

CREATE OR REPLACE FUNCTION public.send_notification(p_user_id uuid, p_title text, p_message text, p_type text DEFAULT 'info', p_link text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link) VALUES (p_user_id, p_title, p_message, p_type, p_link) RETURNING id INTO notification_id;
  RETURN notification_id;
END; $$;

CREATE OR REPLACE FUNCTION public.apply_voucher(p_code text, p_user_id uuid, p_order_total integer, p_merchant_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_voucher RECORD; v_usage_count INTEGER; v_discount INTEGER;
BEGIN
  SELECT * INTO v_voucher FROM vouchers WHERE UPPER(code) = UPPER(p_code) AND is_active = true AND start_date <= now() AND (end_date IS NULL OR end_date >= now());
  IF v_voucher IS NULL THEN RETURN jsonb_build_object('valid', false, 'error', 'Kode voucher tidak ditemukan'); END IF;
  IF v_voucher.merchant_id IS NOT NULL AND v_voucher.merchant_id != p_merchant_id THEN RETURN jsonb_build_object('valid', false, 'error', 'Voucher tidak berlaku untuk toko ini'); END IF;
  IF p_order_total < v_voucher.min_order_amount THEN RETURN jsonb_build_object('valid', false, 'error', 'Minimum belanja Rp ' || v_voucher.min_order_amount); END IF;
  IF v_voucher.usage_limit IS NOT NULL AND v_voucher.used_count >= v_voucher.usage_limit THEN RETURN jsonb_build_object('valid', false, 'error', 'Voucher sudah habis'); END IF;
  SELECT COUNT(*) INTO v_usage_count FROM voucher_usages WHERE voucher_id = v_voucher.id AND user_id = p_user_id;
  IF v_usage_count > 0 THEN RETURN jsonb_build_object('valid', false, 'error', 'Anda sudah menggunakan voucher ini'); END IF;
  IF v_voucher.discount_type = 'percentage' THEN v_discount := FLOOR(p_order_total * v_voucher.discount_value / 100); IF v_voucher.max_discount IS NOT NULL AND v_discount > v_voucher.max_discount THEN v_discount := v_voucher.max_discount; END IF;
  ELSE v_discount := v_voucher.discount_value; END IF;
  RETURN jsonb_build_object('valid', true, 'voucher_id', v_voucher.id, 'discount', v_discount, 'voucher_name', v_voucher.name);
END; $$;

CREATE OR REPLACE FUNCTION public.check_cod_eligibility(p_buyer_id uuid, p_merchant_id uuid, p_total_amount integer, p_distance_km numeric DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cod_settings JSONB; v_max_amount INTEGER; v_max_distance NUMERIC; v_min_trust_score INTEGER; v_buyer_trust_score INTEGER; v_buyer_cod_enabled BOOLEAN;
BEGIN
  SELECT value INTO v_cod_settings FROM app_settings WHERE key = 'cod_settings';
  v_max_amount := COALESCE((v_cod_settings->>'max_amount')::INTEGER, 75000);
  v_max_distance := COALESCE((v_cod_settings->>'max_distance_km')::NUMERIC, 3);
  v_min_trust_score := COALESCE((v_cod_settings->>'min_trust_score')::INTEGER, 50);
  SELECT trust_score, cod_enabled INTO v_buyer_trust_score, v_buyer_cod_enabled FROM profiles WHERE user_id = p_buyer_id;
  IF v_buyer_cod_enabled = false THEN RETURN jsonb_build_object('eligible', false, 'reason', 'Akun Anda tidak dapat menggunakan COD'); END IF;
  IF COALESCE(v_buyer_trust_score, 100) < v_min_trust_score THEN RETURN jsonb_build_object('eligible', false, 'reason', 'Trust score tidak mencukupi'); END IF;
  IF p_total_amount > v_max_amount THEN RETURN jsonb_build_object('eligible', false, 'reason', 'Nominal terlalu besar untuk COD'); END IF;
  IF p_distance_km IS NOT NULL AND p_distance_km > v_max_distance THEN RETURN jsonb_build_object('eligible', false, 'reason', 'Jarak terlalu jauh untuk COD'); END IF;
  RETURN jsonb_build_object('eligible', true, 'reason', NULL);
END; $$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(p_identifier text, p_action text, p_max_requests integer DEFAULT 10, p_window_seconds integer DEFAULT 60)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_window_start TIMESTAMP WITH TIME ZONE; v_current_count INTEGER;
BEGIN
  v_window_start := date_trunc('minute', now());
  SELECT count INTO v_current_count FROM rate_limits WHERE identifier = p_identifier AND action = p_action AND window_start = v_window_start;
  IF v_current_count IS NULL THEN
    INSERT INTO rate_limits (identifier, action, count, window_start) VALUES (p_identifier, p_action, 1, v_window_start) ON CONFLICT (identifier, action, window_start) DO UPDATE SET count = rate_limits.count + 1;
    RETURN jsonb_build_object('allowed', true, 'remaining', p_max_requests - 1);
  END IF;
  IF v_current_count >= p_max_requests THEN RETURN jsonb_build_object('allowed', false, 'remaining', 0, 'retry_after', p_window_seconds); END IF;
  UPDATE rate_limits SET count = count + 1 WHERE identifier = p_identifier AND action = p_action AND window_start = v_window_start;
  RETURN jsonb_build_object('allowed', true, 'remaining', p_max_requests - v_current_count - 1);
END; $$;

CREATE OR REPLACE FUNCTION public.update_cod_trust_score(p_buyer_id uuid, p_success boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cod_settings JSONB; v_penalty_points INTEGER; v_bonus_points INTEGER; v_min_trust_score INTEGER; v_current_score INTEGER; v_current_fail_count INTEGER; v_new_score INTEGER;
BEGIN
  SELECT value INTO v_cod_settings FROM app_settings WHERE key = 'cod_settings';
  v_penalty_points := COALESCE((v_cod_settings->>'penalty_points')::INTEGER, 50);
  v_bonus_points := COALESCE((v_cod_settings->>'success_bonus_points')::INTEGER, 1);
  v_min_trust_score := COALESCE((v_cod_settings->>'min_trust_score')::INTEGER, 50);
  SELECT trust_score, cod_fail_count INTO v_current_score, v_current_fail_count FROM profiles WHERE user_id = p_buyer_id;
  v_current_score := COALESCE(v_current_score, 100); v_current_fail_count := COALESCE(v_current_fail_count, 0);
  IF p_success THEN v_new_score := LEAST(100, v_current_score + v_bonus_points); UPDATE profiles SET trust_score = v_new_score WHERE user_id = p_buyer_id;
  ELSE v_new_score := GREATEST(0, v_current_score - v_penalty_points); UPDATE profiles SET trust_score = v_new_score, cod_fail_count = v_current_fail_count + 1, cod_enabled = CASE WHEN v_new_score < v_min_trust_score THEN false ELSE cod_enabled END WHERE user_id = p_buyer_id;
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'buyer');
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.generate_monthly_kas(p_group_id uuid, p_month integer, p_year integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_group RECORD; v_member RECORD; v_count INTEGER := 0;
BEGIN
  SELECT * INTO v_group FROM trade_groups WHERE id = p_group_id;
  IF v_group IS NULL THEN RETURN 0; END IF;
  FOR v_member IN SELECT * FROM group_members WHERE group_id = p_group_id AND status = 'ACTIVE'
  LOOP INSERT INTO kas_payments (group_id, merchant_id, amount, payment_month, payment_year, status) VALUES (p_group_id, v_member.merchant_id, v_group.monthly_fee, p_month, p_year, 'UNPAID') ON CONFLICT (group_id, merchant_id, payment_month, payment_year) DO NOTHING;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END; $$;

CREATE OR REPLACE FUNCTION public.auto_cancel_pending_orders()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE orders SET status = 'CANCELED', notes = COALESCE(notes, '') || ' [Auto-canceled: Tidak dikonfirmasi dalam 15 menit]', updated_at = now()
  WHERE status = 'PENDING_CONFIRMATION' AND confirmation_deadline < now();
END; $$;

-- Auto-complete delivered orders after 24h
CREATE OR REPLACE FUNCTION public.set_auto_complete_deadline()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'DELIVERED' AND (OLD.status IS NULL OR OLD.status <> 'DELIVERED') THEN
    NEW.auto_complete_at := NOW() + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.auto_complete_delivered_orders()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE completed_count INTEGER;
BEGIN
  UPDATE public.orders SET status = 'DONE', updated_at = NOW() WHERE status = 'DELIVERED' AND auto_complete_at IS NOT NULL AND auto_complete_at <= NOW();
  GET DIAGNOSTICS completed_count = ROW_COUNT;
  RETURN completed_count;
END; $$;

-- Trust score update trigger
CREATE OR REPLACE FUNCTION public.update_trust_score()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'REJECTED_BY_BUYER' AND OLD.status != 'REJECTED_BY_BUYER' THEN
    UPDATE profiles SET trust_score = GREATEST(0, trust_score - 50), cod_fail_count = cod_fail_count + 1, cod_enabled = CASE WHEN trust_score - 50 < 50 THEN false ELSE cod_enabled END WHERE user_id = NEW.buyer_id;
  END IF;
  IF NEW.status = 'DONE' AND OLD.status != 'DONE' AND NEW.payment_method = 'COD' THEN
    UPDATE profiles SET trust_score = LEAST(100, trust_score + 1) WHERE user_id = NEW.buyer_id;
  END IF;
  RETURN NEW;
END; $$;

-- Order change notification
CREATE OR REPLACE FUNCTION public.notify_order_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE merchant_user_id UUID; order_status_text TEXT;
BEGIN
  SELECT user_id INTO merchant_user_id FROM merchants WHERE id = NEW.merchant_id;
  CASE NEW.status WHEN 'NEW' THEN order_status_text := 'Pesanan Baru'; WHEN 'PENDING_CONFIRMATION' THEN order_status_text := 'Menunggu Konfirmasi'; WHEN 'PROCESSED' THEN order_status_text := 'Sedang Diproses'; WHEN 'SENT' THEN order_status_text := 'Sedang Dikirim'; WHEN 'DELIVERED' THEN order_status_text := 'Sampai Tujuan'; WHEN 'DONE' THEN order_status_text := 'Selesai'; WHEN 'CANCELED' THEN order_status_text := 'Dibatalkan'; ELSE order_status_text := NEW.status; END CASE;
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM send_notification(NEW.buyer_id, 'Status Pesanan Diperbarui', 'Pesanan #' || LEFT(NEW.id::TEXT, 8) || ' ' || order_status_text, 'order', '/orders/' || NEW.id);
  END IF;
  IF TG_OP = 'INSERT' AND merchant_user_id IS NOT NULL THEN
    PERFORM send_notification(merchant_user_id, 'Pesanan Baru', 'Anda menerima pesanan baru senilai Rp ' || NEW.total::TEXT, 'order', '/merchant/orders');
  END IF;
  RETURN NEW;
END; $$;

-- Merchant verification notification
CREATE OR REPLACE FUNCTION public.notify_merchant_verification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND TG_OP = 'UPDATE' AND OLD.registration_status IS DISTINCT FROM NEW.registration_status THEN
    IF NEW.registration_status = 'APPROVED' THEN
      PERFORM send_notification(NEW.user_id, 'Pendaftaran Merchant Disetujui', 'Selamat! Toko ' || NEW.name || ' telah diverifikasi.', 'success', '/merchant');
    ELSIF NEW.registration_status = 'REJECTED' THEN
      PERFORM send_notification(NEW.user_id, 'Pendaftaran Merchant Ditolak', 'Pendaftaran toko ' || NEW.name || ' ditolak. Alasan: ' || COALESCE(NEW.rejection_reason, 'Tidak memenuhi syarat'), 'error', '/register/merchant');
    END IF;
  END IF;
  RETURN NEW;
END; $$;

-- Auto assign merchant to group
CREATE OR REPLACE FUNCTION public.auto_assign_merchant_to_group()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_code RECORD; v_group RECORD;
BEGIN
  IF NEW.verifikator_code IS NOT NULL AND NEW.group_id IS NULL THEN
    SELECT * INTO v_code FROM verifikator_codes WHERE code = NEW.verifikator_code AND is_active = true LIMIT 1;
    IF v_code IS NOT NULL THEN
      SELECT * INTO v_group FROM trade_groups WHERE verifikator_id = v_code.verifikator_id AND is_active = true LIMIT 1;
      IF v_group IS NOT NULL THEN
        NEW.group_id := v_group.id;
        INSERT INTO group_members (group_id, merchant_id, status) VALUES (v_group.id, NEW.id, 'ACTIVE') ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

-- Verifikator commission
CREATE OR REPLACE FUNCTION public.record_verifikator_commission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_merchant RECORD; v_package RECORD; v_commission INTEGER;
BEGIN
  IF NEW.payment_status = 'PAID' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'PAID') THEN
    SELECT * INTO v_merchant FROM merchants WHERE id = NEW.merchant_id;
    IF v_merchant.verifikator_id IS NOT NULL THEN
      SELECT * INTO v_package FROM transaction_packages WHERE id = NEW.package_id;
      v_commission := FLOOR(NEW.payment_amount * v_package.group_commission_percent / 100);
      IF v_commission > 0 THEN
        INSERT INTO verifikator_earnings (verifikator_id, merchant_id, subscription_id, package_id, package_amount, commission_percent, commission_amount, status)
        VALUES (v_merchant.verifikator_id, NEW.merchant_id, NEW.id, NEW.package_id, NEW.payment_amount, v_package.group_commission_percent, v_commission, 'PENDING');
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

-- Process verifikator withdrawal
CREATE OR REPLACE FUNCTION public.process_verifikator_withdrawal(p_withdrawal_id uuid, p_status text, p_admin_notes text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_withdrawal RECORD; v_total_pending INTEGER;
BEGIN
  SELECT * INTO v_withdrawal FROM verifikator_withdrawals WHERE id = p_withdrawal_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal not found'; END IF;
  IF v_withdrawal.status != 'PENDING' THEN RAISE EXCEPTION 'Withdrawal already processed'; END IF;
  IF p_status = 'APPROVED' THEN
    SELECT COALESCE(SUM(commission_amount), 0) INTO v_total_pending FROM verifikator_earnings WHERE verifikator_id = v_withdrawal.verifikator_id AND status = 'PENDING';
    IF v_total_pending < v_withdrawal.amount THEN RAISE EXCEPTION 'Insufficient pending balance'; END IF;
    WITH earnings_to_pay AS (SELECT id, commission_amount, SUM(commission_amount) OVER (ORDER BY created_at) as running_total FROM verifikator_earnings WHERE verifikator_id = v_withdrawal.verifikator_id AND status = 'PENDING' ORDER BY created_at)
    UPDATE verifikator_earnings SET status = 'PAID', paid_at = now() WHERE id IN (SELECT id FROM earnings_to_pay WHERE running_total <= v_withdrawal.amount);
  END IF;
  UPDATE verifikator_withdrawals SET status = p_status, admin_notes = p_admin_notes, processed_by = auth.uid(), processed_at = now(), updated_at = now() WHERE id = p_withdrawal_id;
  RETURN TRUE;
END; $$;

-- Withdrawal notification
CREATE OR REPLACE FUNCTION public.notify_admin_new_withdrawal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE admin_id UUID; merchant_name TEXT;
BEGIN
  SELECT name INTO merchant_name FROM merchants WHERE id = NEW.merchant_id;
  FOR admin_id IN SELECT user_id FROM user_roles WHERE role = 'admin'
  LOOP PERFORM send_notification(admin_id, 'Permintaan Penarikan Baru', merchant_name || ' mengajukan penarikan Rp ' || NEW.amount::TEXT, 'withdrawal', '/admin/withdrawals');
  END LOOP;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_withdrawal_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE merchant_user_id UUID; status_text TEXT;
BEGIN
  SELECT user_id INTO merchant_user_id FROM merchants WHERE id = NEW.merchant_id;
  IF merchant_user_id IS NULL THEN RETURN NEW; END IF;
  CASE NEW.status WHEN 'APPROVED' THEN status_text := 'disetujui'; WHEN 'REJECTED' THEN status_text := 'ditolak'; WHEN 'COMPLETED' THEN status_text := 'telah ditransfer'; ELSE status_text := NEW.status; END CASE;
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status != 'PENDING' THEN
    PERFORM send_notification(merchant_user_id, 'Penarikan Saldo ' || INITCAP(status_text), 'Permintaan penarikan Rp ' || NEW.amount::TEXT || ' telah ' || status_text, 'withdrawal', '/merchant/withdrawal');
  END IF;
  RETURN NEW;
END; $$;


-- =====================================================
-- PART 4: VIEWS
-- =====================================================

DROP VIEW IF EXISTS public.public_merchants CASCADE;
CREATE OR REPLACE VIEW public.public_merchants AS
SELECT id, village_id, name, image_url, business_category, business_description, province, city, district, open_time, close_time, is_open, order_mode, badge, rating_avg, rating_count, is_verified, location_lat, location_lng,
  CASE WHEN phone IS NOT NULL THEN CONCAT(LEFT(phone, 4), '****', RIGHT(phone, 3)) ELSE NULL END as phone_masked
FROM public.merchants WHERE status = 'ACTIVE' AND registration_status = 'APPROVED';

DROP VIEW IF EXISTS public.public_couriers CASCADE;
CREATE OR REPLACE VIEW public.public_couriers AS
SELECT id, name, photo_url, vehicle_type, village_id, is_available, status, current_lat, current_lng,
  CASE WHEN phone IS NOT NULL THEN CONCAT(LEFT(phone, 4), '****', RIGHT(phone, 3)) ELSE NULL END as phone_masked
FROM public.couriers WHERE registration_status = 'APPROVED' AND status = 'ACTIVE';


-- =====================================================
-- PART 5: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kas_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourism ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifikator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifikator_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifikator_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_fund ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies first (safe cleanup)
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- USER_ROLES
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL USING (is_admin());
CREATE POLICY "user_roles_own_read" ON public.user_roles FOR SELECT USING (user_id = auth.uid());

-- PROFILES
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL USING (is_admin());
CREATE POLICY "profiles_service_role" ON public.profiles FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY "profiles_own_read" ON public.profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "profiles_own_insert" ON public.profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "profiles_own_update" ON public.profiles FOR UPDATE USING (user_id = auth.uid() AND is_blocked = false);

-- VILLAGES
CREATE POLICY "villages_admin_all" ON public.villages FOR ALL USING (is_admin());
CREATE POLICY "villages_public_read" ON public.villages FOR SELECT USING (is_active = true);
CREATE POLICY "villages_register" ON public.villages FOR INSERT WITH CHECK (registration_status = 'PENDING' AND is_active = false);

-- USER_VILLAGES
CREATE POLICY "user_villages_admin_all" ON public.user_villages FOR ALL USING (is_admin());
CREATE POLICY "user_villages_own_read" ON public.user_villages FOR SELECT USING (user_id = auth.uid() OR is_admin());

-- TRADE_GROUPS
CREATE POLICY "trade_groups_admin_all" ON public.trade_groups FOR ALL USING (is_admin());
CREATE POLICY "trade_groups_verifikator_all" ON public.trade_groups FOR ALL USING (verifikator_id = auth.uid() OR is_admin());
CREATE POLICY "trade_groups_public_read" ON public.trade_groups FOR SELECT USING (is_active = true);

-- TRANSACTION_PACKAGES
CREATE POLICY "transaction_packages_admin_all" ON public.transaction_packages FOR ALL USING (is_admin());
CREATE POLICY "transaction_packages_public_read" ON public.transaction_packages FOR SELECT USING (is_active = true);

-- MERCHANTS
CREATE POLICY "merchants_admin_all" ON public.merchants FOR ALL USING (is_admin());
CREATE POLICY "merchants_verifikator_all" ON public.merchants FOR ALL USING (is_verifikator());
CREATE POLICY "merchants_own_manage" ON public.merchants FOR ALL USING (user_id = auth.uid());
CREATE POLICY "merchants_public_read" ON public.merchants FOR SELECT USING (status = 'ACTIVE' AND registration_status = 'APPROVED');
CREATE POLICY "merchants_register" ON public.merchants FOR INSERT WITH CHECK (registration_status = 'PENDING');

-- MERCHANT_SUBSCRIPTIONS
CREATE POLICY "merchant_subscriptions_admin_all" ON public.merchant_subscriptions FOR ALL USING (is_admin());
CREATE POLICY "merchant_subscriptions_own_read" ON public.merchant_subscriptions FOR SELECT USING (EXISTS (SELECT 1 FROM merchants WHERE id = merchant_id AND user_id = auth.uid()));
CREATE POLICY "merchant_subscriptions_own_insert" ON public.merchant_subscriptions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM merchants WHERE id = merchant_id AND user_id = auth.uid()));

-- GROUP_MEMBERS
CREATE POLICY "group_members_admin_all" ON public.group_members FOR ALL USING (is_admin());
CREATE POLICY "group_members_verifikator_manage" ON public.group_members FOR ALL USING (EXISTS (SELECT 1 FROM trade_groups WHERE id = group_id AND (verifikator_id = auth.uid() OR is_admin())));
CREATE POLICY "group_members_own_read" ON public.group_members FOR SELECT USING (EXISTS (SELECT 1 FROM merchants WHERE id = merchant_id AND user_id = auth.uid()));

-- KAS_PAYMENTS
CREATE POLICY "kas_payments_admin_all" ON public.kas_payments FOR ALL USING (is_admin());
CREATE POLICY "kas_payments_verifikator_manage" ON public.kas_payments FOR ALL USING (EXISTS (SELECT 1 FROM trade_groups WHERE id = group_id AND (verifikator_id = auth.uid() OR is_admin())));
CREATE POLICY "kas_payments_own_read" ON public.kas_payments FOR SELECT USING (EXISTS (SELECT 1 FROM merchants WHERE id = merchant_id AND user_id = auth.uid()));

-- CATEGORIES
CREATE POLICY "categories_admin_all" ON public.categories FOR ALL USING (is_admin());
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (is_active = true);

-- PRODUCTS
CREATE POLICY "products_admin_all" ON public.products FOR ALL USING (is_admin());
CREATE POLICY "products_merchant_manage" ON public.products FOR ALL USING (EXISTS (SELECT 1 FROM merchants WHERE id = merchant_id AND user_id = auth.uid()));
CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (is_active = true);

-- PRODUCT_IMAGES
CREATE POLICY "product_images_admin_all" ON public.product_images FOR ALL USING (is_admin());
CREATE POLICY "product_images_merchant_manage" ON public.product_images FOR ALL USING (EXISTS (SELECT 1 FROM products p JOIN merchants m ON p.merchant_id = m.id WHERE p.id = product_id AND m.user_id = auth.uid()));
CREATE POLICY "product_images_public_read" ON public.product_images FOR SELECT USING (true);

-- PRODUCT_VARIANTS
CREATE POLICY "product_variants_admin_all" ON public.product_variants FOR ALL USING (is_admin());
CREATE POLICY "product_variants_merchant_manage" ON public.product_variants FOR ALL USING (EXISTS (SELECT 1 FROM products p JOIN merchants m ON p.merchant_id = m.id WHERE p.id = product_id AND m.user_id = auth.uid()));
CREATE POLICY "product_variants_public_read" ON public.product_variants FOR SELECT USING (is_active = true);

-- QUOTA_TIERS
CREATE POLICY "quota_tiers_admin_all" ON public.quota_tiers FOR ALL USING (is_admin());
CREATE POLICY "quota_tiers_public_read" ON public.quota_tiers FOR SELECT USING (true);

-- TOURISM
CREATE POLICY "tourism_admin_all" ON public.tourism FOR ALL USING (is_admin());
CREATE POLICY "tourism_admin_desa_manage" ON public.tourism FOR ALL USING (EXISTS (SELECT 1 FROM villages WHERE id = village_id AND registration_status = 'APPROVED') AND is_admin_desa());
CREATE POLICY "tourism_public_read" ON public.tourism FOR SELECT USING (is_active = true);

-- COURIERS
CREATE POLICY "couriers_admin_all" ON public.couriers FOR ALL USING (is_admin());
CREATE POLICY "couriers_verifikator_all" ON public.couriers FOR ALL USING (is_verifikator());
CREATE POLICY "couriers_own_manage" ON public.couriers FOR ALL USING (user_id = auth.uid());
CREATE POLICY "couriers_public_read" ON public.couriers FOR SELECT USING (registration_status = 'APPROVED' AND status = 'ACTIVE');
CREATE POLICY "couriers_register" ON public.couriers FOR INSERT WITH CHECK (registration_status = 'PENDING' AND status = 'INACTIVE');

-- ORDERS
CREATE POLICY "orders_admin_all" ON public.orders FOR ALL USING (is_admin());
CREATE POLICY "orders_buyer_access" ON public.orders FOR ALL USING (buyer_id = auth.uid());
CREATE POLICY "orders_merchant_access" ON public.orders FOR ALL USING (is_order_merchant(id));
CREATE POLICY "orders_courier_access" ON public.orders FOR ALL USING (is_order_courier(id));

-- ORDER_ITEMS
CREATE POLICY "order_items_admin_all" ON public.order_items FOR ALL USING (is_admin());
CREATE POLICY "order_items_buyer_insert" ON public.order_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE id = order_id AND buyer_id = auth.uid()));
CREATE POLICY "order_items_read" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE id = order_id AND (buyer_id = auth.uid() OR is_order_merchant(order_id) OR is_admin())));

-- FLASH_SALES
CREATE POLICY "flash_sales_admin_all" ON public.flash_sales FOR ALL USING (is_admin());
CREATE POLICY "flash_sales_merchant_manage" ON public.flash_sales FOR ALL USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));
CREATE POLICY "flash_sales_public_read" ON public.flash_sales FOR SELECT USING (status = 'ACTIVE' AND end_time > now());

-- REVIEWS
CREATE POLICY "reviews_admin_all" ON public.reviews FOR ALL USING (is_admin());
CREATE POLICY "reviews_buyer_create" ON public.reviews FOR INSERT WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "reviews_merchant_reply" ON public.reviews FOR UPDATE USING (EXISTS (SELECT 1 FROM merchants WHERE id = merchant_id AND user_id = auth.uid()));
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (is_visible = true);

-- REFUND_REQUESTS
CREATE POLICY "refund_requests_admin_all" ON public.refund_requests FOR ALL USING (is_admin());
CREATE POLICY "refund_requests_buyer_create" ON public.refund_requests FOR INSERT WITH CHECK (buyer_id = auth.uid() AND status = 'PENDING');
CREATE POLICY "refund_requests_buyer_read" ON public.refund_requests FOR SELECT USING (buyer_id = auth.uid());

-- WITHDRAWAL_REQUESTS
CREATE POLICY "withdrawal_requests_admin_all" ON public.withdrawal_requests FOR ALL USING (is_admin());
CREATE POLICY "withdrawal_requests_merchant_manage" ON public.withdrawal_requests FOR ALL USING (EXISTS (SELECT 1 FROM merchants WHERE id = merchant_id AND user_id = auth.uid()));

-- VERIFIKATOR_EARNINGS
CREATE POLICY "verifikator_earnings_admin_all" ON public.verifikator_earnings FOR ALL USING (is_admin());
CREATE POLICY "verifikator_earnings_own_read" ON public.verifikator_earnings FOR SELECT USING (verifikator_id = auth.uid());

-- VERIFIKATOR_WITHDRAWALS
CREATE POLICY "verifikator_withdrawals_admin_all" ON public.verifikator_withdrawals FOR ALL USING (is_admin());
CREATE POLICY "verifikator_withdrawals_own_manage" ON public.verifikator_withdrawals FOR ALL USING (verifikator_id = auth.uid());

-- VERIFIKATOR_CODES
CREATE POLICY "verifikator_codes_admin_all" ON public.verifikator_codes FOR ALL USING (is_admin());
CREATE POLICY "verifikator_codes_own_manage" ON public.verifikator_codes FOR ALL USING (verifikator_id = auth.uid() OR is_admin());
CREATE POLICY "verifikator_codes_public_read" ON public.verifikator_codes FOR SELECT USING (is_active = true);

-- COURIER_EARNINGS
CREATE POLICY "courier_earnings_admin_all" ON public.courier_earnings FOR ALL USING (is_admin());
CREATE POLICY "courier_earnings_own_read" ON public.courier_earnings FOR SELECT USING (EXISTS (SELECT 1 FROM couriers WHERE id = courier_id AND user_id = auth.uid()));

-- PLATFORM_FEES
CREATE POLICY "platform_fees_admin_all" ON public.platform_fees FOR ALL USING (is_admin());
CREATE POLICY "platform_fees_merchant_read" ON public.platform_fees FOR SELECT USING (EXISTS (SELECT 1 FROM merchants WHERE id = merchant_id AND user_id = auth.uid()));

-- INSURANCE_FUND
CREATE POLICY "insurance_fund_admin_all" ON public.insurance_fund FOR ALL USING (is_admin());
CREATE POLICY "insurance_fund_merchant_manage" ON public.insurance_fund FOR ALL USING (EXISTS (SELECT 1 FROM merchants WHERE id = merchant_id AND user_id = auth.uid()));

-- VOUCHERS
CREATE POLICY "vouchers_admin_all" ON public.vouchers FOR ALL USING (is_admin());
CREATE POLICY "vouchers_merchant_manage" ON public.vouchers FOR ALL USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()) OR is_admin());
CREATE POLICY "vouchers_public_read" ON public.vouchers FOR SELECT USING (is_active = true AND start_date <= now() AND (end_date IS NULL OR end_date >= now()));

-- VOUCHER_USAGES
CREATE POLICY "voucher_usages_admin_all" ON public.voucher_usages FOR ALL USING (is_admin());
CREATE POLICY "voucher_usages_own" ON public.voucher_usages FOR ALL USING (user_id = auth.uid());

-- PROMOTIONS
CREATE POLICY "promotions_admin_all" ON public.promotions FOR ALL USING (is_admin());
CREATE POLICY "promotions_public_read" ON public.promotions FOR SELECT USING (is_active = true AND is_approved = true AND start_date <= now() AND (end_date IS NULL OR end_date >= now()));
CREATE POLICY "promotions_merchant_create" ON public.promotions FOR INSERT WITH CHECK (advertiser_type = 'merchant' AND is_approved = false);
CREATE POLICY "promotions_village_create" ON public.promotions FOR INSERT WITH CHECK (advertiser_type = 'village' AND is_approved = false);

-- NOTIFICATIONS
CREATE POLICY "notifications_admin_all" ON public.notifications FOR ALL USING (is_admin());
CREATE POLICY "notifications_own_read" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_own_update" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin());

-- BROADCAST_NOTIFICATIONS
CREATE POLICY "broadcast_notifications_admin_all" ON public.broadcast_notifications FOR ALL USING (is_admin());

-- PUSH_SUBSCRIPTIONS
CREATE POLICY "push_subscriptions_own_manage" ON public.push_subscriptions FOR ALL USING (user_id = auth.uid());

-- SAVED_ADDRESSES
CREATE POLICY "saved_addresses_service_role" ON public.saved_addresses FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY "saved_addresses_own_manage" ON public.saved_addresses FOR ALL USING (user_id = auth.uid());

-- WISHLISTS
CREATE POLICY "wishlists_own_manage" ON public.wishlists FOR ALL USING (user_id = auth.uid());

-- APP_SETTINGS
CREATE POLICY "app_settings_admin_all" ON public.app_settings FOR ALL USING (is_admin());
CREATE POLICY "app_settings_public_read" ON public.app_settings FOR SELECT USING (true);

-- ADMIN_AUDIT_LOGS
CREATE POLICY "admin_audit_logs_admin_read" ON public.admin_audit_logs FOR SELECT USING (is_admin());
CREATE POLICY "admin_audit_logs_admin_insert" ON public.admin_audit_logs FOR INSERT WITH CHECK (is_admin());

-- BACKUP_LOGS
CREATE POLICY "backup_logs_admin_read" ON public.backup_logs FOR SELECT USING (is_admin());
CREATE POLICY "backup_logs_admin_insert" ON public.backup_logs FOR INSERT WITH CHECK (is_admin());

-- BACKUP_SCHEDULES
CREATE POLICY "backup_schedules_admin_all" ON public.backup_schedules FOR ALL USING (is_admin());

-- PASSWORD_RESET_TOKENS
CREATE POLICY "password_reset_tokens_insert" ON public.password_reset_tokens FOR INSERT WITH CHECK (email IS NOT NULL AND token IS NOT NULL AND expires_at > now());
CREATE POLICY "password_reset_tokens_read" ON public.password_reset_tokens FOR SELECT USING (true);
CREATE POLICY "password_reset_tokens_update" ON public.password_reset_tokens FOR UPDATE USING (used_at IS NULL AND expires_at > now());

-- RATE_LIMITS
CREATE POLICY "rate_limits_read" ON public.rate_limits FOR SELECT USING (identifier = auth.uid()::text OR is_admin());
CREATE POLICY "rate_limits_insert" ON public.rate_limits FOR INSERT WITH CHECK (identifier = auth.uid()::text);
CREATE POLICY "rate_limits_update" ON public.rate_limits FOR UPDATE USING (identifier = auth.uid()::text);

-- SEO_SETTINGS
CREATE POLICY "seo_settings_admin_all" ON public.seo_settings FOR ALL USING (is_admin());
CREATE POLICY "seo_settings_public_read" ON public.seo_settings FOR SELECT USING (true);


-- =====================================================
-- PART 6: TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_villages_updated_at ON public.villages;
CREATE TRIGGER update_villages_updated_at BEFORE UPDATE ON public.villages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_merchants_updated_at ON public.merchants;
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON public.merchants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_couriers_updated_at ON public.couriers;
CREATE TRIGGER update_couriers_updated_at BEFORE UPDATE ON public.couriers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trade_groups_updated_at ON public.trade_groups;
CREATE TRIGGER update_trade_groups_updated_at BEFORE UPDATE ON public.trade_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tourism_updated_at ON public.tourism;
CREATE TRIGGER update_tourism_updated_at BEFORE UPDATE ON public.tourism FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-complete deadline trigger
DROP TRIGGER IF EXISTS trigger_set_auto_complete_deadline ON public.orders;
CREATE TRIGGER trigger_set_auto_complete_deadline BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_auto_complete_deadline();

-- Trust score trigger
DROP TRIGGER IF EXISTS trigger_update_trust_score ON public.orders;
CREATE TRIGGER trigger_update_trust_score AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_trust_score();

-- Order notification trigger
DROP TRIGGER IF EXISTS trigger_notify_order_change ON public.orders;
CREATE TRIGGER trigger_notify_order_change AFTER INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.notify_order_change();

-- Merchant verification notification
DROP TRIGGER IF EXISTS trigger_notify_merchant_verification ON public.merchants;
CREATE TRIGGER trigger_notify_merchant_verification AFTER UPDATE ON public.merchants FOR EACH ROW EXECUTE FUNCTION public.notify_merchant_verification();

-- Auto assign merchant to group
DROP TRIGGER IF EXISTS trigger_auto_assign_merchant_group ON public.merchants;
CREATE TRIGGER trigger_auto_assign_merchant_group BEFORE INSERT OR UPDATE ON public.merchants FOR EACH ROW EXECUTE FUNCTION public.auto_assign_merchant_to_group();

-- Record verifikator commission
DROP TRIGGER IF EXISTS trigger_record_verifikator_commission ON public.merchant_subscriptions;
CREATE TRIGGER trigger_record_verifikator_commission AFTER UPDATE ON public.merchant_subscriptions FOR EACH ROW EXECUTE FUNCTION public.record_verifikator_commission();


-- =====================================================
-- PART 7: STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('tourism-images', 'tourism-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('merchant-images', 'merchant-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('pod-images', 'pod-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('review-images', 'review-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('village-images', 'village-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('courier-documents', 'courier-documents', false) ON CONFLICT (id) DO NOTHING;

-- Storage policies (drop existing first to avoid conflicts)
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

-- Public read for all public buckets
CREATE POLICY "Public buckets are viewable" ON storage.objects FOR SELECT USING (bucket_id IN ('product-images','tourism-images','profile-images','merchant-images','pod-images','review-images','village-images','payment-proofs'));
-- Authenticated upload
CREATE POLICY "Authenticated users can upload to public buckets" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('product-images','tourism-images','profile-images','merchant-images','pod-images','review-images','village-images','payment-proofs') AND auth.role() = 'authenticated');
-- Authenticated update
CREATE POLICY "Authenticated users can update public bucket files" ON storage.objects FOR UPDATE USING (bucket_id IN ('product-images','tourism-images','profile-images','merchant-images','pod-images','review-images','village-images','payment-proofs') AND auth.role() = 'authenticated');
-- Authenticated delete
CREATE POLICY "Authenticated users can delete public bucket files" ON storage.objects FOR DELETE USING (bucket_id IN ('product-images','tourism-images','profile-images','merchant-images','pod-images','review-images','village-images','payment-proofs') AND auth.role() = 'authenticated');
-- Courier documents (private)
CREATE POLICY "Courier documents viewable by admins" ON storage.objects FOR SELECT USING (bucket_id = 'courier-documents' AND (auth.role() = 'authenticated'));
CREATE POLICY "Courier documents uploadable" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'courier-documents' AND auth.role() = 'authenticated');


-- =====================================================
-- PART 8: REALTIME
-- =====================================================

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.orders; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.couriers; EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- =====================================================
-- PART 9: INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_products_merchant_id ON public.products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_merchant_id ON public.orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_orders_courier_id ON public.orders(courier_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_merchants_village_id ON public.merchants(village_id);
CREATE INDEX IF NOT EXISTS idx_merchants_status ON public.merchants(status);
CREATE INDEX IF NOT EXISTS idx_merchants_registration_status ON public.merchants(registration_status);
CREATE INDEX IF NOT EXISTS idx_couriers_village_id ON public.couriers(village_id);
CREATE INDEX IF NOT EXISTS idx_couriers_status ON public.couriers(status);
CREATE INDEX IF NOT EXISTS idx_tourism_village_id ON public.tourism(village_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_flash_sales_status ON public.flash_sales(status);
CREATE INDEX IF NOT EXISTS idx_flash_sales_end_time ON public.flash_sales(end_time);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_addresses_user_id ON public.saved_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_merchant_id ON public.reviews(merchant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);


-- =====================================================
-- PART 10: DEFAULT DATA (ON CONFLICT = safe)
-- =====================================================

-- Categories
INSERT INTO public.categories (name, slug, icon, sort_order, is_active) VALUES
  ('Kuliner', 'kuliner', 'UtensilsCrossed', 1, true),
  ('Fashion', 'fashion', 'Shirt', 2, true),
  ('Kerajinan', 'kriya', 'Palette', 3, true),
  ('Wisata', 'wisata', 'MapPin', 4, true)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

-- Quota Tiers
INSERT INTO public.quota_tiers (min_price, max_price, credit_cost, description, sort_order) VALUES
  (0, 3000, 1, 'Harga Rp 0 - Rp 3.000', 1),
  (3001, 5000, 2, 'Harga Rp 3.001 - Rp 5.000', 2),
  (5001, 8000, 3, 'Harga Rp 5.001 - Rp 8.000', 3),
  (8001, 15000, 4, 'Harga Rp 8.001 - Rp 15.000', 4),
  (15001, NULL, 5, 'Harga > Rp 15.000', 5)
ON CONFLICT DO NOTHING;

-- Transaction Packages
INSERT INTO public.transaction_packages (id, name, price_per_transaction, transaction_quota, group_commission_percent, validity_days, description, is_active) VALUES
  ('pkg11111-1111-1111-1111-111111111111', 'Paket Pemula', 25000, 50, 10, 30, 'Cocok untuk pedagang baru', true),
  ('pkg22222-2222-2222-2222-222222222222', 'Paket Standar', 50000, 120, 10, 30, 'Pilihan terpopuler', true),
  ('pkg33333-3333-3333-3333-333333333333', 'Paket Bisnis', 100000, 300, 12, 30, 'Untuk pedagang aktif', true),
  ('pkg44444-4444-4444-4444-444444444444', 'Paket Premium', 200000, 700, 15, 60, 'Untuk pedagang besar', true),
  ('pkg55555-5555-5555-5555-555555555555', 'Paket Unlimited', 500000, 2000, 20, 90, 'Tanpa batas transaksi', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price_per_transaction = EXCLUDED.price_per_transaction;

-- App Settings
INSERT INTO public.app_settings (key, value, category, description) VALUES
  ('registration_merchant', '{"enabled": true}', 'registration', 'Pengaturan pendaftaran pedagang'),
  ('registration_courier', '{"enabled": true}', 'registration', 'Pengaturan pendaftaran kurir'),
  ('registration_village', '{"enabled": true}', 'registration', 'Pengaturan pendaftaran desa'),
  ('shipping_fee', '{"base_fee": 5000, "per_km_fee": 2000, "min_fee": 5000, "max_fee": 50000, "free_shipping_min_order": 100000}', 'shipping', 'Pengaturan biaya pengiriman'),
  ('platform_fee', '{"percentage": 5, "min_fee": 500, "max_fee": 10000, "enabled": true}', 'finance', 'Pengaturan fee platform'),
  ('cod_settings', '{"enabled": true, "max_amount": 500000, "max_distance_km": 10, "service_fee": 2000, "min_trust_score": 50, "penalty_points": 50, "success_bonus_points": 1, "confirmation_timeout_minutes": 15}', 'payment', 'Pengaturan COD'),
  ('address_api', '{"provider": "emsifa", "base_url": "https://www.emsifa.com/api-wilayah-indonesia/api"}', 'integration', 'API wilayah Indonesia'),
  ('payment_xendit', '{"enabled": false}', 'payment', 'Pengaturan Xendit Payment Gateway')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();


-- =====================================================
-- END OF COMPLETE MIGRATION
-- =====================================================
-- 
-- NOTES:
-- 1. Run this SQL via Supabase SQL Editor
-- 2. All commands are idempotent (safe to run multiple times)
-- 3. Existing data is NOT deleted
-- 4. RLS policies are dropped and recreated (clean slate)
-- 5. Storage buckets will be created if not exist
-- 6. Cron job for auto_complete_delivered_orders needs 
--    pg_cron extension (run separately if available):
--    SELECT cron.schedule('auto-complete-orders', '0 * * * *', 
--      $$SELECT public.auto_complete_delivered_orders()$$);
-- =====================================================
