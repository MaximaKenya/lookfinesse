-- Extended Social Commerce Migration — Stories, Affiliates, Tips, Memberships
-- Run in Supabase SQL editor after 001_social_commerce.sql

-- ─── STORIES (Instagram-style, expires in 24h) ─────────────────────────────
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  caption text,
  duration_seconds integer DEFAULT 5,
  views integer DEFAULT 0,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  viewed_at timestamptz DEFAULT now(),
  UNIQUE(story_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_stories_vendor ON stories(vendor_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON stories(expires_at);

-- ─── AFFILIATE SYSTEM ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  commission_pct numeric DEFAULT 10,
  description text,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id uuid REFERENCES affiliate_links(id) ON DELETE CASCADE,
  referred_user_id uuid,
  order_id uuid,
  status text DEFAULT 'clicked' CHECK (status IN ('clicked', 'converted', 'paid')),
  commission_amount numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_links_vendor ON affiliate_links(vendor_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_link ON affiliate_referrals(affiliate_link_id);

-- ─── TIPS (live stream tipping) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS live_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'KES',
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_tips_session ON live_tips(session_id);
CREATE INDEX IF NOT EXISTS idx_live_tips_vendor ON live_tips(vendor_id);

-- ─── MEMBERSHIP TIERS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS membership_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  name text NOT NULL,
  price numeric NOT NULL,
  currency text DEFAULT 'KES',
  billing_period text DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
  perks text[] DEFAULT '{}',
  stripe_price_id text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  tier_id uuid REFERENCES membership_tiers(id),
  tier_name text DEFAULT 'fan',
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_membership_tiers_vendor ON membership_tiers(vendor_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_vendor ON memberships(vendor_id);
