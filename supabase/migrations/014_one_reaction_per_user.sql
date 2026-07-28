-- One reaction per user per post/reel (latest emoji wins).
-- Replaces per-emoji uniqueness from 001_social_commerce.sql.
-- Safe to re-run — repairs legacy post_reactions missing reel_id/post_id first.

-- Legacy installs: CREATE TABLE IF NOT EXISTS skipped, so reel_id may be missing.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'post_reactions'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'post_reactions'
        AND column_name = 'post_id'
    ) THEN
      ALTER TABLE post_reactions ADD COLUMN post_id uuid;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'post_reactions'
        AND column_name = 'reel_id'
    ) THEN
      ALTER TABLE post_reactions ADD COLUMN reel_id uuid;
    END IF;
  END IF;
END $$;

ALTER TABLE post_reactions DROP CONSTRAINT IF EXISTS post_reactions_user_id_post_id_reaction_type_key;
ALTER TABLE post_reactions DROP CONSTRAINT IF EXISTS post_reactions_user_id_reel_id_reaction_type_key;

-- Keep the newest row when duplicates exist.
DELETE FROM post_reactions a
USING post_reactions b
WHERE a.id < b.id
  AND a.user_id = b.user_id
  AND a.post_id IS NOT NULL
  AND a.post_id = b.post_id;

DELETE FROM post_reactions a
USING post_reactions b
WHERE a.id < b.id
  AND a.user_id = b.user_id
  AND a.reel_id IS NOT NULL
  AND a.reel_id = b.reel_id;

CREATE UNIQUE INDEX IF NOT EXISTS post_reactions_one_per_post_user
  ON post_reactions (user_id, post_id)
  WHERE post_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS post_reactions_one_per_reel_user
  ON post_reactions (user_id, reel_id)
  WHERE reel_id IS NOT NULL;
