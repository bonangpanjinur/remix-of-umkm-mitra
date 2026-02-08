-- ============================================================
-- FIX: Villages Table Schema + RLS Policies
-- Tanggal: 2026-02-08
-- Masalah yang diperbaiki:
--   1. Kolom 'province' dan 'updated_at' belum ada di tabel villages
--   2. RLS INSERT policy terlalu ketat untuk registrasi user
--   3. user_villages tidak punya INSERT policy untuk user biasa
--   4. Admin CRUD tidak bekerja karena policy ALL kurang tepat
-- ============================================================

-- ============================================================
-- BAGIAN 1: Tambah kolom yang kurang
-- ============================================================

-- Tambah kolom province (untuk menyimpan nama provinsi)
ALTER TABLE public.villages ADD COLUMN IF NOT EXISTS province text;

-- Tambah kolom updated_at (untuk tracking perubahan)
ALTER TABLE public.villages ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- ============================================================
-- BAGIAN 2: Perbaiki RLS policies tabel VILLAGES
-- ============================================================

-- Hapus policy INSERT lama yang terlalu ketat
DROP POLICY IF EXISTS "Anyone can register village" ON public.villages;
DROP POLICY IF EXISTS "villages_register" ON public.villages;

-- Policy: User terautentikasi bisa mendaftar desa (status PENDING, nonaktif)
CREATE POLICY "Authenticated users can register village"
ON public.villages
FOR INSERT
TO authenticated
WITH CHECK (
  registration_status = 'PENDING' AND is_active = false
);

-- Hapus dan buat ulang policy admin agar cover semua operasi CRUD
DROP POLICY IF EXISTS "Admins can manage villages" ON public.villages;
CREATE POLICY "Admins can manage villages"
ON public.villages
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Policy: Admin desa bisa update desa yang dia kelola
CREATE POLICY "Admin desa can update own village"
ON public.villages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_villages uv
    WHERE uv.village_id = id AND uv.user_id = auth.uid()
  )
);

-- ============================================================
-- BAGIAN 3: Perbaiki RLS policies tabel USER_VILLAGES
-- ============================================================

-- Hapus policy lama
DROP POLICY IF EXISTS "Admins manage village assignments" ON public.user_villages;
DROP POLICY IF EXISTS "Users view own village assignments" ON public.user_villages;

-- Admin bisa melakukan semua operasi (CRUD)
CREATE POLICY "Admins manage village assignments"
ON public.user_villages
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- User bisa melihat assignment miliknya sendiri
CREATE POLICY "Users view own village assignments"
ON public.user_villages
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- User bisa insert assignment miliknya sendiri (saat registrasi desa)
CREATE POLICY "Users can register own village assignment"
ON public.user_villages
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ============================================================
-- BAGIAN 4: Trigger updated_at otomatis
-- ============================================================

CREATE TRIGGER update_villages_updated_at
BEFORE UPDATE ON public.villages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
