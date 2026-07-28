-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 016: post_reactions reel_id repair + one-reaction-per-user finish
-- Safe to re-run — use when 014 failed with "column a.reel_id does not exist".
--
-- Cause: legacy post_reactions existed without reel_id; CREATE TABLE IF NOT EXISTS
--        in 001/006/012 skipped adding the column, then 014 referenced reel_id.
-- App expects: post_id + reel_id on post_reactions (see lib/social/engagement.ts).
-- ═══════════════════════════════════════════════════════════════════════════

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
