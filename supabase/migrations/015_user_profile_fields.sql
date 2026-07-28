-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 015: user_profiles geo + locale columns (repair partial installs)
-- Safe to re-run — skips columns that already exist.
-- Fixes: "could not find city in user schema" when 004 CREATE TABLE IF NOT EXISTS
--        skipped because user_profiles already existed without geo columns.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) THEN
    CREATE TABLE user_profiles (
      id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id      uuid NOT NULL UNIQUE,
      display_name text,
      bio          text,
      avatar_url   text,
      lat          double precision,
      lng          double precision,
      city         text,
      preferences  jsonb DEFAULT '{}'::jsonb,
      onboarded_at timestamptz,
      updated_at   timestamptz DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'city'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'lat'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN lat double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'lng'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN lng double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'preferences'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN preferences jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'onboarded_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN onboarded_at timestamptz;
  END IF;
END
$$;
