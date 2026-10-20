-- ═══════════════════════════════════════════════════════════════════════════
-- LookFinesse GO LIVE — paste this entire file into the Supabase SQL editor.
--
-- Prerequisite (empty project): supabase/migrations/000_fresh_bootstrap.sql
-- Legacy projects that already have the schema can run this file alone.
--
-- Idempotent. Order inside this file:
--   1. migrations/028_signup_nearby_geo.sql
--   2. migrations/029_vendor_create_rls.sql
--   3. storage buckets + RLS (products, product-images, profile-media)
--   4. seed_auth_users.sql   (demo logins in docs/SEED_CREDENTIALS.md)
--   5. seed_auth_roles.sql   (roles, vendor rows, 30-day Pro trial)
--
-- Do not commit real secrets. Demo password is the documented test password.
-- ═══════════════════════════════════════════════════════════════════════════

-- ──── included from supabase/migrations/028_signup_nearby_geo.sql ────
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

-- ──── included from supabase/migrations/029_vendor_create_rls.sql ────
-- Migration 029: Vendor create/manage RLS
-- Products had no RLS (anon API inserts) while services/feed/reels require auth.uid().
-- Create APIs now use the cookie-bound server client; these policies let a vendor
-- insert/update their own catalog and store. Idempotent.

-- ─── products ───────────────────────────────────────────────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_public_read" ON products;
DROP POLICY IF EXISTS "products_vendor_insert" ON products;
DROP POLICY IF EXISTS "products_vendor_update" ON products;
DROP POLICY IF EXISTS "products_vendor_delete" ON products;

CREATE POLICY "products_public_read"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "products_vendor_insert"
  ON products FOR INSERT
  WITH CHECK (
    (
      vendor_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM vendors v
        WHERE v.id = products.vendor_id AND v.user_id = auth.uid()
      )
    )
    OR (
      store_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM stores s
        WHERE s.id = products.store_id AND s.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "products_vendor_update"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = products.vendor_id AND v.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM stores s
      WHERE s.id = products.store_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "products_vendor_delete"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = products.vendor_id AND v.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM stores s
      WHERE s.id = products.store_id AND s.user_id = auth.uid()
    )
  );

-- ─── stores ─────────────────────────────────────────────────────────────────
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stores_public_read" ON stores;
DROP POLICY IF EXISTS "stores_own_insert" ON stores;
DROP POLICY IF EXISTS "stores_own_update" ON stores;
DROP POLICY IF EXISTS "stores_own_delete" ON stores;

CREATE POLICY "stores_public_read"
  ON stores FOR SELECT
  USING (true);

CREATE POLICY "stores_own_insert"
  ON stores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stores_own_update"
  ON stores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "stores_own_delete"
  ON stores FOR DELETE
  USING (auth.uid() = user_id);

-- ─── availability slots (bookable services) ─────────────────────────────────
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "availability_public_read" ON availability_slots;
DROP POLICY IF EXISTS "availability_vendor_write" ON availability_slots;

CREATE POLICY "availability_public_read"
  ON availability_slots FOR SELECT
  USING (true);

CREATE POLICY "availability_vendor_write"
  ON availability_slots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = availability_slots.vendor_id AND v.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = availability_slots.vendor_id AND v.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "products_vendor_insert" ON products IS
  'Vendor may insert products for their vendors/stores row (cookie session).';

-- ──── storage buckets + RLS ────
-- ═══════════════════════════════════════════════════════════════════════════
-- Storage buckets + RLS
-- Buckets: products, product-images, profile-media (public read).
-- Product uploads use paths like {storeId}/{file}, so authenticated users
-- may write those buckets. profile-media stays scoped to {auth.uid()}/*.
-- Hosted Supabase sometimes rejects storage policy SQL ("must be owner of
-- table objects"). Each block notices and continues so the rest of this
-- script (demo users) still applies. If you see that notice, create the
-- same policies in Dashboard → Storage. See docs/STORAGE_SETUP.md.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES
    ('products', 'products', true, 52428800, ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm']::text[]),
    ('product-images', 'product-images', true, 52428800, ARRAY['image/jpeg','image/png','image/webp','image/gif']::text[]),
    (
      'profile-media',
      'profile-media',
      true,
      52428800,
      ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']::text[]
    )
  ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'LookFinesse: storage.buckets insert skipped (insufficient privilege). Create products, product-images, and profile-media in Dashboard → Storage.';
  WHEN OTHERS THEN
    IF SQLERRM ILIKE '%must be owner%' OR SQLERRM ILIKE '%permission denied%' THEN
      RAISE NOTICE 'LookFinesse: storage.buckets insert skipped: %', SQLERRM;
    ELSE
      RAISE;
    END IF;
END $$;

DO $$
BEGIN
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

  -- products
  DROP POLICY IF EXISTS "products_bucket_public_read" ON storage.objects;
  CREATE POLICY "products_bucket_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'products');

  DROP POLICY IF EXISTS "products_bucket_auth_insert" ON storage.objects;
  CREATE POLICY "products_bucket_auth_insert"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'products');

  DROP POLICY IF EXISTS "products_bucket_auth_update" ON storage.objects;
  CREATE POLICY "products_bucket_auth_update"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'products')
    WITH CHECK (bucket_id = 'products');

  DROP POLICY IF EXISTS "products_bucket_auth_delete" ON storage.objects;
  CREATE POLICY "products_bucket_auth_delete"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'products');

  -- product-images
  DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
  CREATE POLICY "product_images_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-images');

  DROP POLICY IF EXISTS "product_images_auth_insert" ON storage.objects;
  CREATE POLICY "product_images_auth_insert"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'product-images');

  DROP POLICY IF EXISTS "product_images_auth_update" ON storage.objects;
  CREATE POLICY "product_images_auth_update"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'product-images')
    WITH CHECK (bucket_id = 'product-images');

  DROP POLICY IF EXISTS "product_images_auth_delete" ON storage.objects;
  CREATE POLICY "product_images_auth_delete"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'product-images');

  -- profile-media (own folder)
  DROP POLICY IF EXISTS "profile_media_public_read" ON storage.objects;
  CREATE POLICY "profile_media_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profile-media');

  DROP POLICY IF EXISTS "profile_media_auth_insert" ON storage.objects;
  CREATE POLICY "profile_media_auth_insert"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'profile-media'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );

  DROP POLICY IF EXISTS "profile_media_auth_update" ON storage.objects;
  CREATE POLICY "profile_media_auth_update"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
      bucket_id = 'profile-media'
      AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
      bucket_id = 'profile-media'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );

  DROP POLICY IF EXISTS "profile_media_auth_delete" ON storage.objects;
  CREATE POLICY "profile_media_auth_delete"
    ON storage.objects FOR DELETE TO authenticated
    USING (
      bucket_id = 'profile-media'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'LookFinesse: storage RLS skipped (insufficient privilege). Add the policies from docs/GO_LIVE_CHECKLIST.md in Dashboard → Storage.';
  WHEN OTHERS THEN
    IF SQLERRM ILIKE '%must be owner%' OR SQLERRM ILIKE '%permission denied%' THEN
      RAISE NOTICE 'LookFinesse: storage RLS skipped: %', SQLERRM;
    ELSE
      RAISE;
    END IF;
END $$;

-- ──── included from supabase/seed_auth_users.sql ────
-- ═══════════════════════════════════════════════════════════════════════════
-- LookFinesse — Seed Supabase Auth test users (SQL Editor / hosted projects)
-- Run AFTER 000_fresh_bootstrap.sql, BEFORE seed_auth_roles.sql
-- Safe to re-run (skips existing emails; resets the documented demo password if it drifted)
--
-- Password for all accounts: Test123456!
--   vendor@test.com  → vendor / fitness gym (EliteFit)
--   admin@test.com   → platform admin
--   user@test.com    → shopper / buyer
--   glow@test.com    → vendor / beauty salon (Glow Salon & Spa)
--   style@test.com   → vendor / fashion boutique (Style Bank)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_instance_id   uuid := '00000000-0000-0000-0000-000000000000';
  v_password      text := 'Test123456!';
  v_encrypted_pw  text;
  v_user_id       uuid;
  v_email         text;
  v_display_name  text;
  v_users         constant jsonb := '[
    {"id":"f1000000-0000-0000-0000-000000000001","email":"vendor@test.com","display_name":"Demo Vendor"},
    {"id":"f1000000-0000-0000-0000-000000000002","email":"admin@test.com","display_name":"Platform Admin"},
    {"id":"f1000000-0000-0000-0000-000000000003","email":"user@test.com","display_name":"Demo User"},
    {"id":"f1000000-0000-0000-0000-000000000004","email":"glow@test.com","display_name":"Glow Salon"},
    {"id":"f1000000-0000-0000-0000-000000000005","email":"style@test.com","display_name":"Style Bank"}
  ]'::jsonb;
  v_row           jsonb;
BEGIN
  v_encrypted_pw := extensions.crypt(v_password, extensions.gen_salt('bf'));

  FOR v_row IN SELECT * FROM jsonb_array_elements(v_users)
  LOOP
    v_user_id      := (v_row->>'id')::uuid;
    v_email        := v_row->>'email';
    v_display_name := v_row->>'display_name';

    -- auth.users (skip if email already exists — e.g. created manually in Dashboard)
    IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.email = v_email) THEN
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      )
      VALUES (
        v_instance_id,
        v_user_id,
        'authenticated',
        'authenticated',
        v_email,
        v_encrypted_pw,
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('display_name', v_display_name),
        now(),
        now(),
        '',
        '',
        '',
        ''
      );
    END IF;

    -- Resolve id (fixed UUID on fresh seed, or existing row if email pre-existed)
    SELECT u.id INTO v_user_id FROM auth.users u WHERE u.email = v_email LIMIT 1;

    IF v_user_id IS NULL THEN
      RAISE EXCEPTION 'Failed to create or resolve auth user for %', v_email;
    END IF;

    -- auth.identities — required for email/password sign-in (GoTrue).
    -- NOT EXISTS (not ON CONFLICT) so a re-run does not depend on constraint column order.
    IF NOT EXISTS (
      SELECT 1 FROM auth.identities i
      WHERE i.user_id = v_user_id AND i.provider = 'email'
    ) THEN
      INSERT INTO auth.identities (
        provider_id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      )
      VALUES (
        v_user_id::text,
        v_user_id,
        jsonb_build_object(
          'sub', v_user_id::text,
          'email', v_email,
          'email_verified', true,
          'phone_verified', false
        ),
        'email',
        now(),
        now(),
        now()
      );
    END IF;
  END LOOP;
END $$;

-- ─── Verify bcrypt hashes (GoTrue-compatible via pgcrypto crypt) ────────────

DO $$
DECLARE
  v_password text := 'Test123456!';
  v_email    text;
  v_ok       boolean;
BEGIN
  FOREACH v_email IN ARRAY ARRAY['vendor@test.com', 'admin@test.com', 'user@test.com', 'glow@test.com', 'style@test.com']
  LOOP
    SELECT extensions.crypt(v_password, u.encrypted_password) = u.encrypted_password
      INTO v_ok
    FROM auth.users u
    WHERE u.email = v_email;

    -- Re-run: keep the documented demo password instead of aborting the script.
    IF v_ok IS DISTINCT FROM true THEN
      UPDATE auth.users
      SET encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
          updated_at = now()
      WHERE email = v_email;
      RAISE NOTICE 'seed_auth_users: reset demo password for %', v_email;
    END IF;
  END LOOP;

  RAISE NOTICE 'seed_auth_users: 5 test accounts ready (vendor, admin, user, glow, style @test.com)';
END $$;

-- ──── included from supabase/seed_auth_roles.sql ────
-- ═══════════════════════════════════════════════════════════════════════════
-- LookFinesse — Link auth test users to roles & vendor profile
-- Run AFTER supabase/seed_auth_users.sql (see docs/SEED_CREDENTIALS.md)
-- Safe to re-run (ON CONFLICT DO NOTHING / idempotent updates)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Demo vendor rows (no-op if seed.sql already inserted these ids) ────────
-- Lets vendor@test.com / glow / style create products without the full catalog seed.

INSERT INTO vendors (
  id, name, business_name, email, category, description, location, address, lat, lng, is_verified, specialty
)
VALUES
  (
    'a1000000-0000-0000-0000-000000000001',
    'EliteFit Gym',
    'EliteFit Gym',
    'elitefit@vyb.co.ke',
    'fitness',
    'Premium fitness studio in Westlands. Strength, cardio & HIIT.',
    'Westlands, Nairobi',
    'Westlands Rd, Nairobi',
    -1.2648,
    36.8067,
    true,
    ARRAY['fitness','hiit','strength']
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'Glow Salon & Spa',
    'Glow Salon & Spa',
    'glow@vyb.co.ke',
    'beauty',
    'Salon and spa in Kilimani — hair, facials, and beauty services.',
    'Kilimani, Nairobi',
    'Dennis Pritt Rd, Nairobi',
    -1.2916,
    36.7836,
    true,
    ARRAY['beauty','hair','facials']
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'Style Bank',
    'Style Bank',
    'style@vyb.co.ke',
    'fashion',
    'African fashion boutique in Lavington.',
    'Lavington, Nairobi',
    'James Gichuru Rd, Nairobi',
    -1.2833,
    36.7736,
    true,
    ARRAY['fashion','style','accessories']
  )
ON CONFLICT (id) DO NOTHING;

-- ─── Roles ──────────────────────────────────────────────────────────────────

INSERT INTO user_roles (user_id, role)
SELECT id, 'vendor' FROM auth.users WHERE email = 'vendor@test.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'admin@test.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'user' FROM auth.users WHERE email = 'user@test.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Admin app_metadata (optional — edge auth also checks user_roles)
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
WHERE email = 'admin@test.com';

-- ─── Link vendor@test.com → EliteFit Gym (seed vendor id) ───────────────────

UPDATE vendors
SET user_id = (SELECT id FROM auth.users WHERE email = 'vendor@test.com')
WHERE id = 'a1000000-0000-0000-0000-000000000001';

-- ─── User profiles for test accounts ────────────────────────────────────────

INSERT INTO user_profiles (user_id, display_name, city, onboarded_at, preferences)
SELECT id, 'Demo Vendor', 'Nairobi', now(), '{"gender":"male","age_group":"25-34","interests":["fitness"],"intended_role":"vendor"}'::jsonb
FROM auth.users WHERE email = 'vendor@test.com'
ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, city = EXCLUDED.city, onboarded_at = COALESCE(user_profiles.onboarded_at, EXCLUDED.onboarded_at);

INSERT INTO user_profiles (user_id, display_name, city, onboarded_at, preferences)
SELECT id, 'Platform Admin', 'Nairobi', now(), '{"intended_role":"shopper"}'::jsonb
FROM auth.users WHERE email = 'admin@test.com'
ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, onboarded_at = COALESCE(user_profiles.onboarded_at, EXCLUDED.onboarded_at);

INSERT INTO user_profiles (user_id, display_name, city, onboarded_at, preferences)
SELECT id, 'Demo User', 'Nairobi', now(), '{"gender":"female","age_group":"25-34","interests":["fashion","beauty"],"intended_role":"shopper"}'::jsonb
FROM auth.users WHERE email = 'user@test.com'
ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, city = EXCLUDED.city, onboarded_at = COALESCE(user_profiles.onboarded_at, EXCLUDED.onboarded_at);

-- ─── Optional: create a store row for vendor@test.com ───────────────────────

INSERT INTO stores (user_id, name, description, city)
SELECT u.id, 'EliteFit Store', 'Demo vendor store for EliteFit Gym', 'Nairobi'
FROM auth.users u
WHERE u.email = 'vendor@test.com'
  AND NOT EXISTS (SELECT 1 FROM stores s WHERE s.user_id = u.id);

-- ─── 30-day Pro trial for vendor@test.com (if no paid/active sub) ────────────

INSERT INTO platform_subscriptions (
  vendor_id, user_id, tier, status, price_kes, payment_method,
  ad_credits_remaining, current_period_start, current_period_end, trial_ends_at
)
SELECT
  'a1000000-0000-0000-0000-000000000001'::uuid,
  u.id,
  'pro',
  'trialing',
  0,
  NULL,
  2500,
  now(),
  now() + interval '30 days',
  now() + interval '30 days'
FROM auth.users u
WHERE u.email = 'vendor@test.com'
  AND EXISTS (SELECT 1 FROM vendors v WHERE v.id = 'a1000000-0000-0000-0000-000000000001')
  AND NOT EXISTS (
    SELECT 1 FROM platform_subscriptions ps
    WHERE ps.vendor_id = 'a1000000-0000-0000-0000-000000000001'
      AND ps.status IN ('active', 'trialing')
  )
ON CONFLICT (vendor_id) DO UPDATE SET
  tier = EXCLUDED.tier,
  status = EXCLUDED.status,
  price_kes = EXCLUDED.price_kes,
  user_id = EXCLUDED.user_id,
  current_period_start = EXCLUDED.current_period_start,
  current_period_end = EXCLUDED.current_period_end,
  trial_ends_at = EXCLUDED.trial_ends_at,
  ad_credits_remaining = EXCLUDED.ad_credits_remaining
WHERE platform_subscriptions.status NOT IN ('active');

-- ─── glow@test.com → Glow Salon & Spa ───────────────────────────────────────

INSERT INTO user_roles (user_id, role)
SELECT id, 'vendor' FROM auth.users WHERE email = 'glow@test.com'
ON CONFLICT (user_id, role) DO NOTHING;

UPDATE vendors
SET user_id = (SELECT id FROM auth.users WHERE email = 'glow@test.com')
WHERE id = 'a1000000-0000-0000-0000-000000000002'
  AND (user_id IS NULL OR user_id = (SELECT id FROM auth.users WHERE email = 'glow@test.com'));

INSERT INTO user_profiles (user_id, display_name, city, onboarded_at, preferences)
SELECT id, 'Glow Salon', 'Nairobi', now(), '{"gender":"female","age_group":"25-34","interests":["beauty"],"intended_role":"vendor"}'::jsonb
FROM auth.users WHERE email = 'glow@test.com'
ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, onboarded_at = COALESCE(user_profiles.onboarded_at, EXCLUDED.onboarded_at);

INSERT INTO stores (user_id, name, description, city, latitude, longitude)
SELECT u.id, 'Glow Salon & Spa', 'Demo beauty vendor storefront', 'Nairobi', -1.2916, 36.7836
FROM auth.users u
WHERE u.email = 'glow@test.com'
  AND NOT EXISTS (SELECT 1 FROM stores s WHERE s.user_id = u.id);

INSERT INTO platform_subscriptions (
  vendor_id, user_id, tier, status, price_kes, payment_method,
  ad_credits_remaining, current_period_start, current_period_end, trial_ends_at
)
SELECT
  'a1000000-0000-0000-0000-000000000002'::uuid,
  u.id,
  'pro',
  'trialing',
  0,
  NULL,
  2500,
  now(),
  now() + interval '30 days',
  now() + interval '30 days'
FROM auth.users u
WHERE u.email = 'glow@test.com'
  AND EXISTS (SELECT 1 FROM vendors v WHERE v.id = 'a1000000-0000-0000-0000-000000000002')
  AND NOT EXISTS (
    SELECT 1 FROM platform_subscriptions ps
    WHERE ps.vendor_id = 'a1000000-0000-0000-0000-000000000002'
      AND ps.status IN ('active', 'trialing')
  )
ON CONFLICT (vendor_id) DO NOTHING;

-- ─── style@test.com → Style Bank ────────────────────────────────────────────

INSERT INTO user_roles (user_id, role)
SELECT id, 'vendor' FROM auth.users WHERE email = 'style@test.com'
ON CONFLICT (user_id, role) DO NOTHING;

UPDATE vendors
SET user_id = (SELECT id FROM auth.users WHERE email = 'style@test.com')
WHERE id = 'a1000000-0000-0000-0000-000000000003'
  AND (user_id IS NULL OR user_id = (SELECT id FROM auth.users WHERE email = 'style@test.com'));

INSERT INTO user_profiles (user_id, display_name, city, onboarded_at, preferences)
SELECT id, 'Style Bank', 'Nairobi', now(), '{"gender":"female","age_group":"25-34","interests":["fashion"],"intended_role":"vendor"}'::jsonb
FROM auth.users WHERE email = 'style@test.com'
ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, onboarded_at = COALESCE(user_profiles.onboarded_at, EXCLUDED.onboarded_at);

INSERT INTO stores (user_id, name, description, city, latitude, longitude)
SELECT u.id, 'Style Bank', 'Demo fashion vendor storefront', 'Nairobi', -1.2789, 36.7689
FROM auth.users u
WHERE u.email = 'style@test.com'
  AND NOT EXISTS (SELECT 1 FROM stores s WHERE s.user_id = u.id);

INSERT INTO platform_subscriptions (
  vendor_id, user_id, tier, status, price_kes, payment_method,
  ad_credits_remaining, current_period_start, current_period_end, trial_ends_at
)
SELECT
  'a1000000-0000-0000-0000-000000000003'::uuid,
  u.id,
  'pro',
  'trialing',
  0,
  NULL,
  2500,
  now(),
  now() + interval '30 days',
  now() + interval '30 days'
FROM auth.users u
WHERE u.email = 'style@test.com'
  AND EXISTS (SELECT 1 FROM vendors v WHERE v.id = 'a1000000-0000-0000-0000-000000000003')
  AND NOT EXISTS (
    SELECT 1 FROM platform_subscriptions ps
    WHERE ps.vendor_id = 'a1000000-0000-0000-0000-000000000003'
      AND ps.status IN ('active', 'trialing')
  )
ON CONFLICT (vendor_id) DO NOTHING;


