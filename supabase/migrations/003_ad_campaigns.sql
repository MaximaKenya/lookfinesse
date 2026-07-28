-- ═══════════════════════════════════════════════════════════════════════════
-- AD CAMPAIGNS — Vendor Advertising System
-- Run AFTER migrations 001 and 002
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Ad Campaigns ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       uuid NOT NULL,
  product_id      uuid,                          -- optional: target a specific product
  title           text NOT NULL,
  headline        text NOT NULL,                 -- short punchy text for carousel
  description     text,
  image_url       text NOT NULL,
  cta_text        text NOT NULL DEFAULT 'Shop Now',
  cta_url         text NOT NULL,                 -- e.g. /shop?product=xxx

  -- Targeting
  target_categories  text[] DEFAULT '{}',        -- e.g. ['fashion','beauty']
  target_location    text,                       -- e.g. 'Nairobi' for geo targeting

  -- Budget & scheduling
  daily_budget    numeric(12,2) NOT NULL DEFAULT 500,   -- KES per day
  total_budget    numeric(12,2),                        -- optional cap
  bid_amount      numeric(12,2) NOT NULL DEFAULT 10,    -- auction bid per impression (KES)
  start_at        timestamptz NOT NULL DEFAULT now(),
  end_at          timestamptz NOT NULL,

  -- Status
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','active','paused','completed','rejected')),
  payment_method  text DEFAULT 'wallet'
                  CHECK (payment_method IN ('wallet','stripe','mpesa')),
  payment_ref     text,                          -- stripe/mpesa reference

  -- Stats (denormalized for speed — updated via triggers or cron)
  total_impressions  bigint DEFAULT 0,
  total_clicks       bigint DEFAULT 0,
  total_spent        numeric(12,2) DEFAULT 0,

  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ─── Ad Impressions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_impressions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  uuid NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  user_id      uuid,                             -- null for anonymous
  session_id   text,                             -- client-side session token for anon freq-cap
  placement    text DEFAULT 'hero_carousel'      -- future: 'feed_inline','story'
               CHECK (placement IN ('hero_carousel','feed_inline','story')),
  created_at   timestamptz DEFAULT now()
);

-- ─── Ad Clicks ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_clicks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  uuid NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  impression_id uuid REFERENCES ad_impressions(id) ON DELETE SET NULL,
  user_id      uuid,
  session_id   text,
  created_at   timestamptz DEFAULT now()
);

-- ─── Frequency Cap View ──────────────────────────────────────────────────────
-- Used by serve API: count impressions per campaign per user in last 24h
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

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status   ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_vendor   ON ad_campaigns(vendor_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_dates    ON ad_campaigns(start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_camp   ON ad_impressions(campaign_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_user   ON ad_impressions(user_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_camp        ON ad_clicks(campaign_id, created_at);

-- ─── Auto-update updated_at ──────────────────────────────────────────────────
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
