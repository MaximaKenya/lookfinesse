-- ══════════════════════════════════════════════════════════
-- Migration 005: Admin-managed product categories
-- Run in Supabase SQL Editor after migrations 001-004
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS categories (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL UNIQUE,
  slug       text        UNIQUE,
  icon       text,
  sort_order int         DEFAULT 0,
  is_active  boolean     DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Pre-existing categories table may lack slug/icon (legacy product_categories shape)
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
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE categories ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

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

UPDATE categories
SET slug = lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL AND name IS NOT NULL;

-- Seed admin-managed categories (safe to re-run; only when slug column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'slug'
  ) THEN
    INSERT INTO categories (name, slug, icon, sort_order) VALUES
      ('Fashion',        'fashion',        '👗', 1),
      ('Beauty',         'beauty',         '💄', 2),
      ('Fitness',        'fitness',        '💪', 3),
      ('Wellness',       'wellness',       '🧘', 4),
      ('Footwear',       'footwear',       '👟', 5),
      ('Accessories',    'accessories',    '👜', 6),
      ('Skincare',       'skincare',       '✨', 7),
      ('Hair',           'hair',           '💇', 8),
      ('Nutrition',      'nutrition',      '🥗', 9),
      ('Gym Equipment',  'gym-equipment',  '🏋️', 10),
      ('Grooming',       'grooming',       '💈', 11),
      ('Activewear',     'activewear',     '🏃', 12),
      ('Supplements',    'supplements',    '💊', 13),
      ('Yoga',           'yoga',           '🧘', 14),
      ('Jewellery',      'jewellery',      '💍', 15)
    ON CONFLICT (slug) DO UPDATE SET
      icon = EXCLUDED.icon,
      sort_order = EXCLUDED.sort_order;
  END IF;
END $$;
