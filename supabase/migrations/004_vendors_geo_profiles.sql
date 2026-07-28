-- ═══════════════════════════════════════════════════════════════════════════
-- VYB MARKETPLACE — Vendors: business_name, lat/lng, user_profiles
-- Run in Supabase SQL Editor after migrations 001-003
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Ensure vendors table has business_name ────────────────────────────────
-- (Original vendors table may use 'name' — add business_name as primary,
--  copy from name if it exists, or just ensure column is present.)
DO $$
BEGIN
  -- Add business_name if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE vendors ADD COLUMN business_name text;
    -- If there's a 'name' column, copy values over
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'vendors' AND column_name = 'name'
    ) THEN
      UPDATE vendors SET business_name = name WHERE business_name IS NULL;
    END IF;
  END IF;

  -- Add geolocation columns if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'lat'
  ) THEN
    ALTER TABLE vendors ADD COLUMN lat double precision;
    ALTER TABLE vendors ADD COLUMN lng double precision;
    ALTER TABLE vendors ADD COLUMN address text;
  END IF;

  -- Add specialty column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'specialty'
  ) THEN
    ALTER TABLE vendors ADD COLUMN specialty text[] DEFAULT '{}';
  END IF;

  -- Add avatar_url column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE vendors ADD COLUMN avatar_url text;
  END IF;

  -- Add location column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'location'
  ) THEN
    ALTER TABLE vendors ADD COLUMN location text;
  END IF;

  -- Add description column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'description'
  ) THEN
    ALTER TABLE vendors ADD COLUMN description text;
  END IF;

  -- Add category column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'category'
  ) THEN
    ALTER TABLE vendors ADD COLUMN category text;
  END IF;

  -- Add is_verified column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE vendors ADD COLUMN is_verified boolean DEFAULT false;
  END IF;
END
$$;

-- ─── User profiles table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL UNIQUE,
  display_name text,
  bio          text,
  avatar_url   text,
  lat          double precision,
  lng          double precision,
  city         text,
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);

-- ─── Feed posts: ensure vendor_id column exists ────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'feed_posts' AND column_name = 'vendor_id'
  ) THEN
    ALTER TABLE feed_posts ADD COLUMN vendor_id uuid;
  END IF;
END
$$;

-- ─── Live sessions: ensure needed columns exist ───────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_sessions' AND column_name = 'cover_url'
  ) THEN
    ALTER TABLE live_sessions ADD COLUMN cover_url text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_sessions' AND column_name = 'stream_url'
  ) THEN
    ALTER TABLE live_sessions ADD COLUMN stream_url text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_sessions' AND column_name = 'viewer_count'
  ) THEN
    ALTER TABLE live_sessions ADD COLUMN viewer_count integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_sessions' AND column_name = 'tip_total'
  ) THEN
    ALTER TABLE live_sessions ADD COLUMN tip_total numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_sessions' AND column_name = 'ended_at'
  ) THEN
    ALTER TABLE live_sessions ADD COLUMN ended_at timestamptz;
  END IF;
END
$$;

-- ─── Reels: ensure needed columns exist ──────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reels' AND column_name = 'engagement_score'
  ) THEN
    ALTER TABLE reels ADD COLUMN engagement_score numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reels' AND column_name = 'product_id'
  ) THEN
    ALTER TABLE reels ADD COLUMN product_id uuid;
  END IF;
END
$$;

-- ─── Products: ensure category column is text ────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category'
  ) THEN
    ALTER TABLE products ADD COLUMN category text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE products ADD COLUMN is_active boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'stock_quantity'
  ) THEN
    ALTER TABLE products ADD COLUMN stock_quantity integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'vendor_id'
  ) THEN
    ALTER TABLE products ADD COLUMN vendor_id uuid;
  END IF;
END
$$;

-- ─── Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_geo ON vendors(lat, lng);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);
