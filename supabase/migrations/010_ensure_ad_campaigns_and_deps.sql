-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 010: Ensure ad_campaigns + platform_subscriptions exist
-- Run in Supabase SQL Editor if 009 failed with "ad_campaigns does not exist"
-- Safe to re-run (IF NOT EXISTS / IF EXISTS guards throughout)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Ad campaigns (full schema: 003 + 009 revamp) ───────────────────────────
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
  end_at              timestamptz NOT NULL,
  status              text NOT NULL DEFAULT 'pending',
  payment_method      text DEFAULT 'wallet',
  payment_ref         text,
  total_impressions   bigint DEFAULT 0,
  total_clicks        bigint DEFAULT 0,
  total_spent         numeric(12,2) DEFAULT 0,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- Status constraint (009 expanded lifecycle)
ALTER TABLE ad_campaigns DROP CONSTRAINT IF EXISTS ad_campaigns_status_check;
ALTER TABLE ad_campaigns ADD CONSTRAINT ad_campaigns_status_check
  CHECK (status IN (
    'draft', 'pending_payment', 'live', 'active',
    'paused', 'completed', 'rejected', 'pending'
  ));

ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';

-- Migrate legacy active → live
UPDATE ad_campaigns SET status = 'live' WHERE status = 'active';

-- ─── Ad impressions & clicks (depend on ad_campaigns) ───────────────────────
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

-- ─── Platform subscriptions (009) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_subscriptions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id              uuid NOT NULL,
  user_id                uuid NOT NULL,
  tier                   text NOT NULL CHECK (tier IN ('starter', 'pro', 'elite')),
  status                 text NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'active', 'cancelled', 'expired', 'past_due')),
  price_kes              numeric(12,2) NOT NULL,
  payment_method         text CHECK (payment_method IN ('stripe', 'mpesa', 'wallet')),
  payment_ref            text,
  stripe_subscription_id text,
  stripe_customer_id     text,
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now(),
  UNIQUE(vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_platform_subs_vendor ON platform_subscriptions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_platform_subs_status ON platform_subscriptions(status);

-- ─── Payments metadata (009) ────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payments'
  ) THEN
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
  END IF;
END $$;

-- ─── Expanded categories (ensure slug column exists first) ───────────────────
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

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'slug'
  ) THEN
    INSERT INTO categories (name, slug, icon, sort_order, is_active) VALUES
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
