-- ═══════════════════════════════════════════════════════════════════════════
-- 028 — Signup bootstrap, profile RLS, nearby geo RPC, delivery fields
-- Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Vendors: service radius for nearby deliveries ──────────────────────────
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS delivery_radius_km numeric DEFAULT 20;

-- ─── Orders: fulfilment / delivery address ──────────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS fulfillment text DEFAULT 'delivery';
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_address text;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_city text;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_lat double precision;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_lng double precision;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_notes text;

-- ─── user_profiles RLS (own write, public read of display fields) ───────────
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles_public_read" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_own_insert" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_own_update" ON user_profiles;

CREATE POLICY "user_profiles_public_read"
  ON user_profiles FOR SELECT USING (true);

CREATE POLICY "user_profiles_own_insert"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_own_update"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── user_roles: users may insert their own shopper role ────────────────────
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_own_read" ON user_roles;
DROP POLICY IF EXISTS "user_roles_own_insert_user" ON user_roles;

CREATE POLICY "user_roles_own_read"
  ON user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_roles_own_insert_user"
  ON user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id AND role IN ('user', 'buyer', 'vendor'));

-- ─── Auto-provision profile + shopper role on auth.users insert ─────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_intended text;
BEGIN
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'Member'
  );
  v_intended := COALESCE(NEW.raw_user_meta_data->>'intended_role', 'shopper');

  INSERT INTO public.user_profiles (user_id, display_name, preferences)
  VALUES (
    NEW.id,
    v_name,
    jsonb_build_object('intended_role', v_intended)
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- ─── Nearby vendors RPC (haversine, metres-free) ────────────────────────────
CREATE OR REPLACE FUNCTION public.nearby_vendors(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision DEFAULT 25
)
RETURNS TABLE (
  id uuid,
  name text,
  business_name text,
  category text,
  location text,
  address text,
  lat double precision,
  lng double precision,
  is_verified boolean,
  delivery_radius_km numeric,
  distance_km double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    v.id,
    v.name,
    v.business_name,
    v.category,
    v.location,
    v.address,
    v.lat,
    v.lng,
    v.is_verified,
    COALESCE(v.delivery_radius_km, 20),
    (
      6371 * 2 * asin(sqrt(
        power(sin(radians(v.lat - p_lat) / 2), 2) +
        cos(radians(p_lat)) * cos(radians(v.lat)) *
        power(sin(radians(v.lng - p_lng) / 2), 2)
      ))
    ) AS distance_km
  FROM vendors v
  WHERE v.lat IS NOT NULL
    AND v.lng IS NOT NULL
    AND (
      6371 * 2 * asin(sqrt(
        power(sin(radians(v.lat - p_lat) / 2), 2) +
        cos(radians(p_lat)) * cos(radians(v.lat)) *
        power(sin(radians(v.lng - p_lng) / 2), 2)
      ))
    ) <= COALESCE(p_radius_km, 25)
  ORDER BY distance_km ASC;
$$;

GRANT EXECUTE ON FUNCTION public.nearby_vendors(double precision, double precision, double precision) TO anon, authenticated;

-- Copilot messages: owner insert
ALTER TABLE copilot_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "copilot_own_read" ON copilot_messages;
DROP POLICY IF EXISTS "copilot_own_insert" ON copilot_messages;
CREATE POLICY "copilot_own_read"
  ON copilot_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "copilot_own_insert"
  ON copilot_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
