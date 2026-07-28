-- ═══════════════════════════════════════════════════════════════════════════
-- LookFinesse — Profile media (banner/carousel/video) + AI preferences
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── user_profiles: media + preferences ────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'banner_url') THEN
    ALTER TABLE user_profiles ADD COLUMN banner_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'avatar_media_type') THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_media_type text DEFAULT 'image';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'banner_media_type') THEN
    ALTER TABLE user_profiles ADD COLUMN banner_media_type text DEFAULT 'image';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'avatar_carousel') THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_carousel jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'banner_carousel') THEN
    ALTER TABLE user_profiles ADD COLUMN banner_carousel jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'preferences') THEN
    ALTER TABLE user_profiles ADD COLUMN preferences jsonb DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'onboarded_at') THEN
    ALTER TABLE user_profiles ADD COLUMN onboarded_at timestamptz;
  END IF;
END
$$;

-- ─── vendors: banner + media ──────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'banner_url') THEN
    ALTER TABLE vendors ADD COLUMN banner_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'avatar_media_type') THEN
    ALTER TABLE vendors ADD COLUMN avatar_media_type text DEFAULT 'image';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'banner_media_type') THEN
    ALTER TABLE vendors ADD COLUMN banner_media_type text DEFAULT 'image';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'avatar_carousel') THEN
    ALTER TABLE vendors ADD COLUMN avatar_carousel jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'banner_carousel') THEN
    ALTER TABLE vendors ADD COLUMN banner_carousel jsonb DEFAULT '[]'::jsonb;
  END IF;
END
$$;

-- ─── feed_posts: rich media columns ───────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feed_posts' AND column_name = 'media_urls') THEN
    ALTER TABLE feed_posts ADD COLUMN media_urls jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feed_posts' AND column_name = 'video_url') THEN
    ALTER TABLE feed_posts ADD COLUMN video_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feed_posts' AND column_name = 'audio_url') THEN
    ALTER TABLE feed_posts ADD COLUMN audio_url text;
  END IF;
END
$$;
