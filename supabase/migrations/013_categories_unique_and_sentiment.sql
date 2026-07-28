-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 013: Category unique constraints + content sentiment analytics
-- Run in Supabase SQL Editor after 001–012
-- Safe to re-run (IF NOT EXISTS / conditional guards throughout)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Categories: enforce slug/name uniqueness for ON CONFLICT ───────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'slug'
  ) THEN
    ALTER TABLE categories ADD COLUMN slug text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'icon'
  ) THEN
    ALTER TABLE categories ADD COLUMN icon text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE categories ADD COLUMN sort_order int DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE categories ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

UPDATE categories
SET slug = lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL AND name IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_key ON categories (slug);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_name_key'
  ) THEN
    ALTER TABLE categories ADD CONSTRAINT categories_name_key UNIQUE (name);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Re-seed full category set (005 + 010)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'slug'
  ) THEN
    INSERT INTO categories (name, slug, icon, sort_order, is_active) VALUES
      ('Fashion',        'fashion',        '👗', 1,  true),
      ('Beauty',         'beauty',         '💄', 2,  true),
      ('Fitness',        'fitness',        '💪', 3,  true),
      ('Wellness',       'wellness',       '🧘', 4,  true),
      ('Footwear',       'footwear',       '👟', 5,  true),
      ('Accessories',    'accessories',    '👜', 6,  true),
      ('Skincare',       'skincare',       '✨', 7,  true),
      ('Hair',           'hair',           '💇', 8,  true),
      ('Nutrition',      'nutrition',      '🥗', 9,  true),
      ('Gym Equipment',  'gym-equipment',  '🏋️', 10, true),
      ('Grooming',       'grooming',       '💈', 11, true),
      ('Activewear',     'activewear',     '🏃', 12, true),
      ('Supplements',    'supplements',    '💊', 13, true),
      ('Yoga',           'yoga',           '🧘', 14, true),
      ('Jewellery',      'jewellery',      '💍', 15, true),
      ('Kids',           'kids',           '👶', 16, true),
      ('Men',            'men',            '👔', 17, true),
      ('Women',          'women',          '👩', 18, true),
      ('Teens',          'teens',          '🧑', 19, true),
      ('Age 20-35',      'age-20-35',      '🎯', 20, true),
      ('Age 35+',        'age-35-plus',    '✨', 21, true),
      ('Makeup',         'makeup',         '💋', 22, true),
      ('Fragrance',      'fragrance',      '🌸', 23, true),
      ('Nails',          'nails',          '💅', 24, true),
      ('Hair Care',      'hair-care',      '🪮', 25, true),
      ('Cotton',         'cotton',         '🧵', 26, true),
      ('Silk & Linen',   'silk-linen',     '🪡', 27, true),
      ('Leather',        'leather',        '👜', 28, true),
      ('Yoga & Pilates', 'yoga-pilates',   '🧘‍♀️', 29, true),
      ('Mental Wellness','mental-wellness','🧠', 30, true),
      ('Strength',       'strength',       '🏋️', 31, true),
      ('Cardio',         'cardio',         '🏃', 32, true)
    ON CONFLICT (slug) DO UPDATE SET
      icon = EXCLUDED.icon,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active;
  END IF;
END $$;

-- ─── Content sentiment analytics (ML / platform intelligence) ───────────────
CREATE TABLE IF NOT EXISTS content_sentiments (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type   text        NOT NULL CHECK (source_type IN ('feed_post', 'comment', 'review', 'booking_note')),
  source_id     uuid        NOT NULL,
  user_id       uuid,
  text_snippet  text        NOT NULL,
  sentiment     text        NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  score         numeric(4,3) NOT NULL CHECK (score >= -1 AND score <= 1),
  topics        jsonb       DEFAULT '[]'::jsonb,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (source_type, source_id)
);

CREATE INDEX IF NOT EXISTS idx_content_sentiments_sentiment ON content_sentiments(sentiment, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_sentiments_source ON content_sentiments(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_content_sentiments_user ON content_sentiments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_sentiments_topics ON content_sentiments USING gin (topics);
