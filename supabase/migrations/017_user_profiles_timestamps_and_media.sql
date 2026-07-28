-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 017: user_profiles timestamps + media columns + profile-media bucket
-- Safe to re-run — skips columns/policies that already exist.
-- Fixes: "Could not find updated_at column of user_profiles"
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── user_profiles: timestamps + core media columns ─────────────────────────
DO $$
BEGIN
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
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'preferences'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN preferences jsonb DEFAULT '{}'::jsonb;
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
END
$$;

UPDATE user_profiles
SET created_at = COALESCE(created_at, updated_at, now())
WHERE created_at IS NULL;

UPDATE user_profiles
SET updated_at = COALESCE(updated_at, created_at, now())
WHERE updated_at IS NULL;

-- ─── Auto-set updated_at on UPDATE ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_user_profiles_updated_at();

-- ─── Storage: profile-media bucket (public read) ─────────────────────────────
-- Note: Supabase hosted projects may require creating the bucket in Dashboard → Storage
-- if INSERT into storage.buckets is restricted. See docs/SEED_CREDENTIALS.md.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-media',
  'profile-media',
  true,
  52428800,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Fallback bucket used by product/vendor uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- ─── Storage RLS: authenticated users upload to {user_id}/* ──────────────────
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_media_public_read" ON storage.objects;
CREATE POLICY "profile_media_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-media');

DROP POLICY IF EXISTS "profile_media_auth_insert" ON storage.objects;
CREATE POLICY "profile_media_auth_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "profile_media_auth_update" ON storage.objects;
CREATE POLICY "profile_media_auth_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "profile_media_auth_delete" ON storage.objects;
CREATE POLICY "profile_media_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
