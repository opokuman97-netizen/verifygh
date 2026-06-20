-- ═══════════════════════════════════════════════════════════════
-- VerifyGH: Manufacturer auth, profiles, role-based access
-- ═══════════════════════════════════════════════════════════════

-- 1. Profiles table (one row per auth.users row)
CREATE TABLE IF NOT EXISTS profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text NOT NULL,
  full_name    text,
  company_name text,
  role         text NOT NULL DEFAULT 'manufacturer'
                   CHECK (role IN ('admin', 'manufacturer', 'user')),
  created_at   timestamptz DEFAULT now()
);

-- 2. Trigger: auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, company_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'company_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'role', 'manufacturer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. Add manufacturer_id FK to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS manufacturer_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_manufacturer_id ON products(manufacturer_id);

-- 4. RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_authenticated"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- 5. Tighten product write policies
--    Keep public_select_products (anyone can look up products for verification)
--    Replace overly-permissive insert/update with role-based policies

DROP POLICY IF EXISTS "public_insert_products" ON products;
DROP POLICY IF EXISTS "public_update_products" ON products;

-- Manufacturers insert only their own products
CREATE POLICY "manufacturer_insert_products"
  ON products FOR INSERT TO authenticated
  WITH CHECK (
    manufacturer_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manufacturer', 'admin'))
  );

-- Manufacturers update their own; admins update any
CREATE POLICY "manufacturer_update_own_products"
  ON products FOR UPDATE TO authenticated
  USING (
    manufacturer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    manufacturer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can delete any product
CREATE POLICY "admin_delete_products"
  ON products FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 6. Scans: authenticated users can read (for analytics)
CREATE POLICY "authenticated_select_scans"
  ON scans FOR SELECT TO authenticated USING (true);

-- 7. Reports: keep anon insert (public reporting), ensure authenticated can read
DROP POLICY IF EXISTS "public_select_reports" ON reports;

CREATE POLICY "public_select_reports"
  ON reports FOR SELECT TO anon, authenticated USING (true);
