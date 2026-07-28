-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 012: Unified schema repair (run after partial migration failures)
-- Safe to re-run — all statements use IF NOT EXISTS / conditional DO blocks.
--
-- Fixes:
--   001 — availability_slots.starts_at missing on legacy table
--   005 — categories.slug missing on pre-existing categories table
--   006 — collections (and deps) missing when 001 failed early
--   009/010 — ad_campaigns, platform_subscriptions never created
--   011 — platform_subscriptions.ad_credits_remaining
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 001 repair: social tables that 006 RLS expects ─────────────────────────
CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  cover_url text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid,
  reel_id uuid,
  collection_id uuid REFERENCES collections(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid,
  reel_id uuid,
  reaction_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid,
  reel_id uuid,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, vendor_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  image_url text,
  link_url text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- availability_slots: legacy installs may predate starts_at/ends_at column names
CREATE TABLE IF NOT EXISTS availability_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  service_id uuid,
  staff_member_id uuid,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL DEFAULT now(),
  is_booked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'availability_slots'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'availability_slots' AND column_name = 'starts_at'
    ) THEN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'availability_slots' AND column_name = 'start_at'
      ) THEN
        ALTER TABLE availability_slots RENAME COLUMN start_at TO starts_at;
      ELSE
        ALTER TABLE availability_slots ADD COLUMN starts_at timestamptz DEFAULT now();
      END IF;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'availability_slots' AND column_name = 'ends_at'
    ) THEN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'availability_slots' AND column_name = 'end_at'
      ) THEN
        ALTER TABLE availability_slots RENAME COLUMN end_at TO ends_at;
      ELSE
        ALTER TABLE availability_slots ADD COLUMN ends_at timestamptz DEFAULT now();
      END IF;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_availability_vendor ON availability_slots(vendor_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON saved_posts(user_id);

-- ─── 005 repair: categories with slug/icon/sort_order/is_active ─────────────
CREATE TABLE IF NOT EXISTS categories (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL UNIQUE,
  slug       text        UNIQUE,
  icon       text,
  sort_order int         DEFAULT 0,
  is_active  boolean     DEFAULT true,
  created_at timestamptz DEFAULT now()
);

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

-- Backfill slug from name for legacy rows
UPDATE categories
SET slug = lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL AND name IS NOT NULL;

-- Seed categories (005 + 010 expanded set)
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

-- ─── 003/009/010 repair: ad_campaigns + deps ────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id           uuid NOT NULL,
  product_id          uuid,
  title               text NOT NULL,
  headline            text NOT NULL,
  description         text,
  image_url           text NOT NULL,
  image_urls          text[] DEFAULT '{}',
  cta_text            text NOT NULL DEFAULT 'Shop Now',
  cta_url             text NOT NULL,
  target_categories   text[] DEFAULT '{}',
  target_location     text,
  daily_budget        numeric(12,2) NOT NULL DEFAULT 500,
  total_budget        numeric(12,2),
  bid_amount          numeric(12,2) NOT NULL DEFAULT 10,
  start_at            timestamptz NOT NULL DEFAULT now(),
  end_at              timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  status              text NOT NULL DEFAULT 'pending',
  payment_method      text DEFAULT 'wallet',
  payment_ref         text,
  total_impressions   bigint DEFAULT 0,
  total_clicks        bigint DEFAULT 0,
  total_spent         numeric(12,2) DEFAULT 0,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';
ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS post_id uuid;
ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS service_id uuid;

ALTER TABLE ad_campaigns DROP CONSTRAINT IF EXISTS ad_campaigns_status_check;
ALTER TABLE ad_campaigns ADD CONSTRAINT ad_campaigns_status_check
  CHECK (status IN (
    'draft', 'pending_payment', 'live', 'active',
    'paused', 'completed', 'rejected', 'pending'
  ));

UPDATE ad_campaigns SET status = 'live' WHERE status = 'active';

CREATE TABLE IF NOT EXISTS ad_impressions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  uuid NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  user_id      uuid,
  session_id   text,
  placement    text DEFAULT 'hero_carousel',
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ad_clicks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  impression_id uuid REFERENCES ad_impressions(id) ON DELETE SET NULL,
  user_id       uuid,
  session_id    text,
  created_at    timestamptz DEFAULT now()
);

CREATE OR REPLACE VIEW ad_frequency_caps AS
SELECT
  campaign_id,
  user_id,
  session_id,
  COUNT(*) AS impression_count,
  MAX(created_at) AS last_seen_at
FROM ad_impressions
WHERE created_at > now() - INTERVAL '24 hours'
GROUP BY campaign_id, user_id, session_id;

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status   ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_vendor   ON ad_campaigns(vendor_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_dates    ON ad_campaigns(start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_camp   ON ad_impressions(campaign_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_user   ON ad_impressions(user_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_camp        ON ad_clicks(campaign_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_post     ON ad_campaigns(post_id);

CREATE OR REPLACE FUNCTION update_ad_campaign_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ad_campaigns_updated_at ON ad_campaigns;
CREATE TRIGGER trg_ad_campaigns_updated_at
  BEFORE UPDATE ON ad_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_ad_campaign_timestamp();

-- ─── 009/011 repair: platform_subscriptions ─────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_subscriptions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id              uuid NOT NULL,
  user_id                uuid NOT NULL,
  tier                   text NOT NULL CHECK (tier IN ('starter', 'pro', 'elite')),
  status                 text NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'active', 'cancelled', 'expired', 'past_due')),
  price_kes              numeric(12,2) NOT NULL DEFAULT 0,
  payment_method         text CHECK (payment_method IN ('stripe', 'mpesa', 'wallet')),
  payment_ref            text,
  stripe_subscription_id text,
  stripe_customer_id     text,
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  ad_credits_remaining   numeric(12,2) DEFAULT 0,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now(),
  UNIQUE(vendor_id)
);

ALTER TABLE platform_subscriptions ADD COLUMN IF NOT EXISTS ad_credits_remaining numeric(12,2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_platform_subs_vendor ON platform_subscriptions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_platform_subs_status ON platform_subscriptions(status);

-- ─── 011 repair: feed_posts fan tier gate ───────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'feed_posts'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'feed_posts' AND column_name = 'required_fan_tier'
    ) THEN
      ALTER TABLE feed_posts ADD COLUMN required_fan_tier text;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'feed_posts_required_fan_tier_check'
  ) THEN
    ALTER TABLE feed_posts ADD CONSTRAINT feed_posts_required_fan_tier_check
      CHECK (required_fan_tier IS NULL OR required_fan_tier IN ('supporter', 'insider', 'vip'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── 009 repair: payments metadata (optional base table) ────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payments'
  ) THEN
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
  END IF;
END $$;
