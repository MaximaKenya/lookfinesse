-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 018: user_profiles bio + PATCH /api/profile columns (repair)
-- Safe to re-run — skips columns that already exist.
-- Fixes: "Could not find the 'bio' column of 'user_profiles' in the schema cache"
--        when legacy user_profiles existed without text/media fields.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) THEN
    CREATE TABLE user_profiles (
      id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id            uuid NOT NULL UNIQUE,
      display_name       text,
      bio                text,
      avatar_url         text,
      banner_url         text,
      avatar_media_type  text DEFAULT 'image',
      banner_media_type  text DEFAULT 'image',
      avatar_carousel    jsonb DEFAULT '[]'::jsonb,
      banner_carousel    jsonb DEFAULT '[]'::jsonb,
      lat                double precision,
      lng                double precision,
      city               text,
      preferences        jsonb DEFAULT '{}'::jsonb,
      onboarded_at       timestamptz,
      created_at         timestamptz DEFAULT now(),
      updated_at         timestamptz DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN display_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN bio text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'banner_url'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN banner_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'avatar_media_type'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_media_type text DEFAULT 'image';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'banner_media_type'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN banner_media_type text DEFAULT 'image';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'avatar_carousel'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_carousel jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'banner_carousel'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN banner_carousel jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'city'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'lat'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN lat double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'lng'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN lng double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'preferences'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN preferences jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'onboarded_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN onboarded_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END
$$;
