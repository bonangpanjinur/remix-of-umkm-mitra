-- Fix RLS for trade_groups to allow merchants to create their own groups
-- This allows merchants to create a group and automatically become the verifikator of that group

-- 1. Drop existing policies that might conflict
DROP POLICY IF EXISTS "trade_groups_verifikator_all" ON public.trade_groups;
DROP POLICY IF EXISTS "Verifikators can manage own groups" ON public.trade_groups;

-- 2. Create a new policy that allows:
--    - Verifikators to manage their own groups
--    - Merchants to create new groups (INSERT)
--    - Merchants to manage groups they created (where verifikator_id = auth.uid())
CREATE POLICY "Users can manage own trade groups" ON public.trade_groups
FOR ALL
USING (
  verifikator_id = auth.uid() 
  OR is_admin() 
  OR is_verifikator()
)
WITH CHECK (
  verifikator_id = auth.uid() 
  OR is_admin() 
  OR is_verifikator()
);

-- 3. Ensure anyone can view active groups (already exists but good to confirm)
DROP POLICY IF EXISTS "trade_groups_public_read" ON public.trade_groups;
DROP POLICY IF EXISTS "Anyone can view active groups" ON public.trade_groups;
CREATE POLICY "Anyone can view active groups" ON public.trade_groups
FOR SELECT
USING (is_active = true);

-- 4. Ensure admins can do everything
DROP POLICY IF EXISTS "trade_groups_admin_all" ON public.trade_groups;
DROP POLICY IF EXISTS "Admins can manage all groups" ON public.trade_groups;
CREATE POLICY "Admins can manage all groups" ON public.trade_groups
FOR ALL
USING (is_admin());
