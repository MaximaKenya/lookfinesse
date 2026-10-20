-- ═══════════════════════════════════════════════════════════════════════════
-- LookFinesse GO LIVE — paste this entire file into the Supabase SQL editor.
--
-- Idempotent. Safe to re-run. One script:
--   1. 000_fresh_bootstrap.sql          (full schema; supersedes 001–020)
--   2. migrations 021 through 030       (bookings, categories, Paystack, indexes)
--   3. storage buckets + RLS
--   4. seed_auth_users.sql + seed_auth_roles.sql
--   5. seed.sql                         (Nairobi catalog, verified media URLs)
--
-- Do not run migrations 001–020 after this file. Do not commit secrets.
-- Demo password is the documented test password (docs/SEED_CREDENTIALS.md).
-- ═══════════════════════════════════════════════════════════════════════════


-- ──── included from supabase/migrations/000_fresh_bootstrap.sql ────
-- ═══════════════════════════════════════════════════════════════════════════
-- LookFinesse — FRESH PROJECT BOOTSTRAP (run this FIRST on an empty Supabase DB)
-- ═══════════════════════════════════════════════════════════════════════════
-- Paste this entire file into Supabase Dashboard → SQL Editor → Run.
--
-- After this succeeds you only need:
--   1. Run supabase/seed_auth_users.sql (see docs/SEED_CREDENTIALS.md)
--   2. Run supabase/seed_auth_roles.sql  (roles + 30-day Pro trial)
--   3. Run supabase/seed.sql
--   4. Run supabase/seed_demo_metrics.sql  (orders, wallets, ledger — non-zero KPIs)
--   5. Create Storage bucket "profile-media" in Dashboard (see docs/SEED_CREDENTIALS.md)
--
-- Legacy DBs: also run 025_platform_subscription_trial.sql for `trialing` status.
--
-- Do NOT run migrations 001–011 on a fresh project — they ALTER tables this file creates.
-- Safe to re-run: uses CREATE TABLE IF NOT EXISTS and ADD COLUMN IF NOT EXISTS throughout.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Extensions ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. AUTH & PROFILES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('admin', 'vendor', 'user', 'buyer')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name       text,
  bio                text,
  avatar_url         text,
  banner_url         text,
  avatar_media_type  text DEFAULT 'image',
  banner_media_type  text DEFAULT 'image',
  avatar_carousel    jsonb DEFAULT '[]'::jsonb,
  banner_carousel    jsonb DEFAULT '[]'::jsonb,
  lat                double precision,
  lng                double precision,
  city               text,
  preferences        jsonb DEFAULT '{}'::jsonb,
  onboarded_at       timestamptz,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. COMMERCE CORE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS stores (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  ownerName   text,
  phone       text,
  city        text,
  address     text,
  latitude    double precision,
  longitude   double precision,
  location    text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stores_user ON stores(user_id);

CREATE TABLE IF NOT EXISTS vendors (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name               text,
  business_name      text,
  email              text,
  phone              text,
  avatar_url         text,
  logo_url           text,
  banner_url         text,
  avatar_media_type  text DEFAULT 'image',
  banner_media_type  text DEFAULT 'image',
  avatar_carousel    jsonb DEFAULT '[]'::jsonb,
  banner_carousel    jsonb DEFAULT '[]'::jsonb,
  category           text,
  description        text,
  location           text,
  address            text,
  lat                double precision,
  lng                double precision,
  specialty          text[] DEFAULT '{}',
  is_verified        boolean DEFAULT false,
  stripe_account_id  text,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendors_user ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_geo ON vendors(lat, lng);

CREATE TABLE IF NOT EXISTS categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text UNIQUE,
  icon       text,
  sort_order int DEFAULT 0,
  is_active  boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS categories_name_key ON categories(name);
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_key ON categories(slug);

CREATE TABLE IF NOT EXISTS product_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id         uuid REFERENCES vendors(id) ON DELETE SET NULL,
  store_id          uuid REFERENCES stores(id) ON DELETE SET NULL,
  category_id       uuid REFERENCES categories(id) ON DELETE SET NULL,
  name              text NOT NULL,
  short_description text,
  description       text,
  price             numeric NOT NULL DEFAULT 0,
  category          text,
  image_url         text,
  image_gallery       jsonb DEFAULT '[]'::jsonb,
  images            jsonb DEFAULT '[]'::jsonb,
  stock             integer DEFAULT 0,
  stock_quantity    integer DEFAULT 0,
  inventory         integer DEFAULT 0,
  sku               text,
  shipping_fee      numeric DEFAULT 0,
  status            text DEFAULT 'active',
  is_active         boolean DEFAULT true,
  is_public         boolean DEFAULT true,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

CREATE TABLE IF NOT EXISTS services (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id          uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  title              text NOT NULL,
  short_description  text,
  description        text,
  price              numeric NOT NULL DEFAULT 0,
  category           text,
  cover_image        text,
  duration_minutes   integer,
  is_virtual         boolean DEFAULT false,
  is_in_person       boolean DEFAULT true,
  max_participants   integer DEFAULT 1,
  status             text DEFAULT 'active',
  bookings_count     integer DEFAULT 0,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_vendor ON services(vendor_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. SOCIAL CONTENT (feed_posts BEFORE post_reactions)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS feed_posts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id           uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  product_id          uuid REFERENCES products(id) ON DELETE SET NULL,
  service_id          uuid REFERENCES services(id) ON DELETE SET NULL,
  type                text NOT NULL DEFAULT 'product',
  feed_category       text DEFAULT 'discover',
  caption             text,
  thumbnail_url       text,
  media_urls          jsonb DEFAULT '[]'::jsonb,
  video_url           text,
  audio_url           text,
  hashtags            text[] DEFAULT '{}',
  location            text,
  engagement_score    numeric DEFAULT 0,
  required_fan_tier   text CHECK (required_fan_tier IS NULL OR required_fan_tier IN ('supporter', 'insider', 'vip')),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_posts_category ON feed_posts(feed_category);
CREATE INDEX IF NOT EXISTS idx_feed_posts_vendor ON feed_posts(vendor_id);

CREATE TABLE IF NOT EXISTS reels (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id          uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  product_id         uuid REFERENCES products(id) ON DELETE SET NULL,
  service_id         uuid REFERENCES services(id) ON DELETE SET NULL,
  caption            text,
  video_url          text NOT NULL DEFAULT '',
  thumbnail_url      text,
  hashtags           text[] DEFAULT '{}',
  category           text,
  engagement_score   numeric DEFAULT 0,
  created_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reels_vendor ON reels(vendor_id);
CREATE INDEX IF NOT EXISTS idx_reels_service ON reels(service_id);

CREATE TABLE IF NOT EXISTS live_sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id      uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  title          text NOT NULL,
  description    text,
  scheduled_for  timestamptz NOT NULL DEFAULT now(),
  is_live        boolean DEFAULT false,
  cover_url      text,
  stream_url     text,
  viewer_count   integer DEFAULT 0,
  tip_total      numeric DEFAULT 0,
  product_ids    uuid[] DEFAULT '{}',
  ended_at       timestamptz,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_sessions_vendor ON live_sessions(vendor_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. SOCIAL ENGAGEMENT
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS post_reactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id       uuid REFERENCES feed_posts(id) ON DELETE CASCADE,
  reel_id       uuid REFERENCES reels(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN (
    'fire', 'motivating', 'love', 'inspiring', 'want_this', 'need_this'
  )),
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id    uuid REFERENCES feed_posts(id) ON DELETE CASCADE,
  reel_id    uuid REFERENCES reels(id) ON DELETE CASCADE,
  content    text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  cover_url   text,
  is_public   boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id       uuid REFERENCES feed_posts(id) ON DELETE CASCADE,
  reel_id       uuid REFERENCES reels(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES collections(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (user_id, post_id),
  UNIQUE (user_id, reel_id)
);

CREATE TABLE IF NOT EXISTS follows (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id   uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (follower_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_vendor ON follows(vendor_id);

CREATE TABLE IF NOT EXISTS notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text NOT NULL,
  title      text NOT NULL,
  message    text,
  image_url  text,
  link_url   text,
  is_read    boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON saved_posts(user_id);

-- One reaction per user per post/reel (migration 014)
CREATE UNIQUE INDEX IF NOT EXISTS post_reactions_one_per_post_user
  ON post_reactions (user_id, post_id)
  WHERE post_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS post_reactions_one_per_reel_user
  ON post_reactions (user_id, reel_id)
  WHERE reel_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. CREATOR, STAFF, BOOKINGS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS creator_profiles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id         uuid NOT NULL UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,
  bio               text,
  specialty         text[] DEFAULT '{}',
  verified          boolean DEFAULT false,
  subscriber_count  integer DEFAULT 0,
  total_posts       integer DEFAULT 0,
  rating            numeric DEFAULT 0,
  cover_image       text,
  social_links      jsonb DEFAULT '{}',
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id  uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name       text NOT NULL,
  role       text,
  avatar_url text,
  is_active  boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS availability_slots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  service_id      uuid REFERENCES services(id) ON DELETE SET NULL,
  staff_member_id uuid REFERENCES staff_members(id) ON DELETE SET NULL,
  starts_at       timestamptz NOT NULL DEFAULT now(),
  ends_at         timestamptz NOT NULL DEFAULT now(),
  is_booked       boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_availability_vendor ON availability_slots(vendor_id, starts_at);

CREATE TABLE IF NOT EXISTS bookings (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id            uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id           uuid REFERENCES services(id) ON DELETE SET NULL,
  staff_member_id      uuid REFERENCES staff_members(id) ON DELETE SET NULL,
  availability_slot_id uuid REFERENCES availability_slots(id) ON DELETE SET NULL,
  booking_type         text,
  participants         integer NOT NULL DEFAULT 1 CHECK (participants >= 1),
  notes                text,
  total_amount         numeric NOT NULL DEFAULT 0,
  payment_status       text NOT NULL DEFAULT 'pending',
  status               text NOT NULL DEFAULT 'pending',
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_vendor ON bookings(vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_service ON bookings(service_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. STORIES, AFFILIATES, MEMBERSHIPS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS stories (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id        uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  media_url        text NOT NULL,
  media_type       text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  caption          text,
  duration_seconds integer DEFAULT 5,
  views            integer DEFAULT 0,
  expires_at       timestamptz NOT NULL,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stories_vendor ON stories(vendor_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON stories(expires_at);

CREATE TABLE IF NOT EXISTS story_views (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id   uuid REFERENCES stories(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at  timestamptz DEFAULT now(),
  UNIQUE (story_id, user_id)
);

CREATE TABLE IF NOT EXISTS affiliate_links (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  code            text NOT NULL UNIQUE,
  commission_pct  numeric DEFAULT 10,
  description     text,
  clicks          integer DEFAULT 0,
  conversions     integer DEFAULT 0,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_links_vendor ON affiliate_links(vendor_id);

CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id uuid REFERENCES affiliate_links(id) ON DELETE CASCADE,
  referred_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id          uuid,
  status            text DEFAULT 'clicked' CHECK (status IN ('clicked', 'converted', 'paid')),
  commission_amount numeric DEFAULT 0,
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS live_tips (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id  uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  amount     numeric NOT NULL,
  currency   text DEFAULT 'KES',
  message    text,
  status     text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS membership_tiers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id        uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name             text NOT NULL,
  price            numeric NOT NULL,
  currency         text DEFAULT 'KES',
  billing_period   text DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
  perks            text[] DEFAULT '{}',
  stripe_price_id  text,
  is_active        boolean DEFAULT true,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memberships (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id              uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  tier_id                uuid REFERENCES membership_tiers(id) ON DELETE SET NULL,
  tier_name              text DEFAULT 'fan',
  status                 text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  stripe_subscription_id text,
  current_period_end     timestamptz,
  created_at             timestamptz DEFAULT now(),
  UNIQUE (user_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. ADS & PLATFORM SUBSCRIPTIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ad_campaigns (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id           uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  product_id          uuid REFERENCES products(id) ON DELETE SET NULL,
  post_id             uuid REFERENCES feed_posts(id) ON DELETE SET NULL,
  service_id          uuid REFERENCES services(id) ON DELETE SET NULL,
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

ALTER TABLE ad_campaigns DROP CONSTRAINT IF EXISTS ad_campaigns_status_check;
ALTER TABLE ad_campaigns ADD CONSTRAINT ad_campaigns_status_check
  CHECK (status IN (
    'draft', 'pending_payment', 'live', 'active',
    'paused', 'completed', 'rejected', 'pending'
  ));

CREATE TABLE IF NOT EXISTS ad_impressions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  uuid NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id   text,
  placement    text DEFAULT 'hero_carousel',
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ad_clicks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  impression_id uuid REFERENCES ad_impressions(id) ON DELETE SET NULL,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_vendor ON ad_campaigns(vendor_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_post ON ad_campaigns(post_id);

CREATE TABLE IF NOT EXISTS platform_subscriptions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id              uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier                   text NOT NULL CHECK (tier IN ('starter', 'pro', 'elite')),
  status                 text NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'active', 'trialing', 'cancelled', 'expired', 'past_due')),
  price_kes              numeric(12,2) NOT NULL DEFAULT 0,
  payment_method         text CHECK (payment_method IS NULL OR payment_method IN ('stripe', 'mpesa', 'wallet')),
  payment_ref            text,
  stripe_subscription_id text,
  stripe_customer_id     text,
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  trial_ends_at          timestamptz,
  ad_credits_remaining   numeric(12,2) DEFAULT 0,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now(),
  UNIQUE (vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_platform_subs_vendor ON platform_subscriptions(vendor_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. ORDERS, CART, PAYMENTS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS orders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  vendor_id  uuid REFERENCES vendors(id) ON DELETE SET NULL,
  total      numeric NOT NULL DEFAULT 0,
  phone      text,
  status     text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  quantity   integer NOT NULL DEFAULT 1,
  price      numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS cart_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS cart (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             uuid REFERENCES orders(id) ON DELETE SET NULL,
  vendor_id            uuid REFERENCES vendors(id) ON DELETE SET NULL,
  provider             text NOT NULL DEFAULT 'mpesa',
  status               text NOT NULL DEFAULT 'pending',
  amount               numeric NOT NULL DEFAULT 0,
  phone                text,
  checkout_request_id  text,
  merchant_request_id  text,
  stripe_session_id    text,
  metadata             jsonb DEFAULT '{}'::jsonb,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

CREATE TABLE IF NOT EXISTS invoices (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id  uuid REFERENCES vendors(id) ON DELETE SET NULL,
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount     numeric NOT NULL DEFAULT 0,
  status     text DEFAULT 'pending',
  metadata   jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. GAMIFICATION, AI, SENTIMENT
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hashtags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag        text NOT NULL UNIQUE,
  post_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trending_topics (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL,
  category   text NOT NULL,
  score      numeric DEFAULT 0,
  cover_url  text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_streaks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak   integer DEFAULT 0,
  longest_streak   integer DEFAULT 0,
  last_active_date date,
  updated_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS achievements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type  text NOT NULL,
  title       text NOT NULL,
  description text,
  earned_at   timestamptz DEFAULT now(),
  UNIQUE (user_id, badge_type)
);

CREATE TABLE IF NOT EXISTS challenges (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title             text NOT NULL,
  description       text,
  category          text NOT NULL,
  start_date        timestamptz,
  end_date          timestamptz,
  cover_url         text,
  participant_count integer DEFAULT 0,
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS challenge_participants (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  progress     numeric DEFAULT 0,
  joined_at    timestamptz DEFAULT now(),
  UNIQUE (challenge_id, user_id)
);

CREATE TABLE IF NOT EXISTS user_interests (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category   text NOT NULL,
  score      numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, category)
);

CREATE TABLE IF NOT EXISTS user_behavior_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id   uuid,
  event_type  text NOT NULL,
  watch_time  integer DEFAULT 0,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_sentiments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type  text NOT NULL CHECK (source_type IN ('feed_post', 'comment', 'review', 'booking_note')),
  source_id    uuid NOT NULL,
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  text_snippet text NOT NULL,
  sentiment    text NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  score        numeric(4,3) NOT NULL CHECK (score >= -1 AND score <= 1),
  topics       jsonb DEFAULT '[]'::jsonb,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (source_type, source_id)
);

CREATE INDEX IF NOT EXISTS idx_content_sentiments_sentiment ON content_sentiments(sentiment, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_memory (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key        text NOT NULL,
  value      jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, key)
);

CREATE TABLE IF NOT EXISTS copilot_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  role       text NOT NULL,
  content    text NOT NULL,
  metadata   jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. FINANCE (minimal — vendor dashboard + checkout paths)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ledger_entries (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id                 uuid REFERENCES vendors(id) ON DELETE SET NULL,
  payment_id                uuid REFERENCES payments(id) ON DELETE SET NULL,
  order_id                  uuid REFERENCES orders(id) ON DELETE SET NULL,
  payout_id                 uuid,
  type                      text NOT NULL,
  amount                    numeric NOT NULL,
  category                  text,
  description               text,
  reference                 text,
  status                    text DEFAULT 'completed',
  idempotency_key           text UNIQUE,
  balance_before            numeric,
  balance_after             numeric,
  geo_location              text,
  device_id                 text,
  behavioral_risk_score     numeric DEFAULT 0,
  behavioral_risk_severity  text DEFAULT 'LOW',
  behavioral_risk_reasons   jsonb DEFAULT '[]'::jsonb,
  created_at                timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_vendor ON ledger_entries(vendor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS vendor_wallets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id  uuid NOT NULL UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,
  balance    numeric NOT NULL DEFAULT 0,
  currency   text DEFAULT 'KES',
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_balances (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id  uuid NOT NULL UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,
  balance    numeric NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_balances (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id         uuid NOT NULL UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,
  available_balance numeric NOT NULL DEFAULT 0,
  updated_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payouts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id  uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  amount     numeric NOT NULL,
  status     text NOT NULL DEFAULT 'pending',
  method     text,
  phone      text,
  reference  text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payout_queue (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id  uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  amount     numeric NOT NULL,
  status     text NOT NULL DEFAULT 'queued',
  priority   integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS financial_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  text NOT NULL,
  entity_type text NOT NULL,
  entity_id   uuid,
  amount      numeric,
  metadata    jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action     text NOT NULL,
  table_name text,
  record_id  uuid,
  actor_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata   jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_kyc (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id           uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  full_name           text,
  country             text,
  document_type       text,
  document_number     text,
  verification_status text DEFAULT 'PENDING',
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_risk_scores (
  vendor_id    uuid PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  risk_score   numeric DEFAULT 0,
  is_frozen    boolean DEFAULT false,
  trust_tier   text,
  last_updated timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fraud_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  vendor_id  uuid REFERENCES vendors(id) ON DELETE SET NULL,
  event_type text,
  metadata   jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fraud_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id  uuid REFERENCES vendors(id) ON DELETE SET NULL,
  event_type text,
  severity   text,
  metadata   jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 11. TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════════════
-- 12. ROW LEVEL SECURITY (public read + owner write)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE vendors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE reels            ENABLE ROW LEVEL SECURITY;
ALTER TABLE services         ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_posts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows          ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vendors_public_read"  ON vendors;
DROP POLICY IF EXISTS "vendors_owner_update" ON vendors;
CREATE POLICY "vendors_public_read"  ON vendors FOR SELECT USING (true);
CREATE POLICY "vendors_owner_update" ON vendors FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "feed_posts_public_read"   ON feed_posts;
DROP POLICY IF EXISTS "feed_posts_vendor_insert" ON feed_posts;
DROP POLICY IF EXISTS "feed_posts_vendor_update" ON feed_posts;
CREATE POLICY "feed_posts_public_read" ON feed_posts FOR SELECT USING (true);
CREATE POLICY "feed_posts_vendor_insert" ON feed_posts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM vendors v WHERE v.id = feed_posts.vendor_id AND v.user_id = auth.uid()));
CREATE POLICY "feed_posts_vendor_update" ON feed_posts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM vendors v WHERE v.id = feed_posts.vendor_id AND v.user_id = auth.uid()));

DROP POLICY IF EXISTS "reels_public_read"  ON reels;
DROP POLICY IF EXISTS "reels_vendor_write" ON reels;
CREATE POLICY "reels_public_read"  ON reels FOR SELECT USING (true);
CREATE POLICY "reels_vendor_write" ON reels FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM vendors v WHERE v.id = reels.vendor_id AND v.user_id = auth.uid()));

DROP POLICY IF EXISTS "services_public_read"  ON services;
DROP POLICY IF EXISTS "services_vendor_write" ON services;
CREATE POLICY "services_public_read"  ON services FOR SELECT USING (status = 'active');
CREATE POLICY "services_vendor_write" ON services FOR ALL
  USING (EXISTS (SELECT 1 FROM vendors v WHERE v.id = services.vendor_id AND v.user_id = auth.uid()));

DROP POLICY IF EXISTS "saved_own_read"  ON saved_posts;
DROP POLICY IF EXISTS "saved_own_write" ON saved_posts;
CREATE POLICY "saved_own_read"  ON saved_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_own_write" ON saved_posts FOR ALL   USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "follows_public_read" ON follows;
DROP POLICY IF EXISTS "follows_own_write"   ON follows;
CREATE POLICY "follows_public_read" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_own_write"   ON follows FOR ALL   USING (auth.uid() = follower_id);

DROP POLICY IF EXISTS "reactions_public_read" ON post_reactions;
DROP POLICY IF EXISTS "reactions_own_write"   ON post_reactions;
CREATE POLICY "reactions_public_read" ON post_reactions FOR SELECT USING (true);
CREATE POLICY "reactions_own_write"   ON post_reactions FOR ALL   USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_public_read" ON post_comments;
DROP POLICY IF EXISTS "comments_own_write"   ON post_comments;
CREATE POLICY "comments_public_read" ON post_comments FOR SELECT USING (true);
CREATE POLICY "comments_own_write"   ON post_comments FOR ALL   USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookings_own_read"    ON bookings;
DROP POLICY IF EXISTS "bookings_vendor_read" ON bookings;
DROP POLICY IF EXISTS "bookings_user_insert" ON bookings;
CREATE POLICY "bookings_own_read" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookings_vendor_read" ON bookings FOR SELECT
  USING (EXISTS (SELECT 1 FROM vendors v WHERE v.id = bookings.vendor_id AND v.user_id = auth.uid()));
CREATE POLICY "bookings_user_insert" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "collections_own_read"  ON collections;
DROP POLICY IF EXISTS "collections_own_write" ON collections;
CREATE POLICY "collections_own_read"  ON collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "collections_own_write" ON collections FOR ALL   USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_own_read"   ON notifications;
DROP POLICY IF EXISTS "notifications_own_update" ON notifications;
CREATE POLICY "notifications_own_read"   ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_own_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_profiles_own_read"  ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_own_write" ON user_profiles;
CREATE POLICY "user_profiles_own_read"  ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_profiles_own_write" ON user_profiles FOR ALL   USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 13. SEED CATEGORIES
-- ═══════════════════════════════════════════════════════════════════════════

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
  ('Cardio',         'cardio',         '🏃', 32, true),
  ('Denim & Jeans',  'jeans',          '👖', 33, true)
ON CONFLICT (slug) DO UPDATE SET
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- ═══════════════════════════════════════════════════════════════════════════
-- 14. STORAGE — products bucket only
-- profile-media must be created manually in Dashboard → Storage (see docs)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Done. Next: auth users → seed_auth_roles.sql → seed.sql → profile-media bucket.

-- ──── included from supabase/migrations/021_service_subscriptions.sql ────
-- Booking payment columns + service subscription model

-- ─── Bookings payment tracking ───────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'payment_method') THEN
    ALTER TABLE bookings ADD COLUMN payment_method text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'paid_at') THEN
    ALTER TABLE bookings ADD COLUMN paid_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'cancelled_at') THEN
    ALTER TABLE bookings ADD COLUMN cancelled_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'booking_id') THEN
    ALTER TABLE payments ADD COLUMN booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
  END IF;
END $$;

-- ─── Service plans (monthly memberships) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS service_plans (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id             uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  service_id            uuid REFERENCES services(id) ON DELETE SET NULL,
  name                  text NOT NULL,
  description           text,
  price_kes             numeric NOT NULL CHECK (price_kes >= 0),
  interval              text NOT NULL DEFAULT 'monthly' CHECK (interval IN ('monthly', 'yearly')),
  benefits              jsonb NOT NULL DEFAULT '[]'::jsonb,
  includes_live_classes boolean NOT NULL DEFAULT false,
  is_active             boolean NOT NULL DEFAULT true,
  stripe_price_id       text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_plans_vendor ON service_plans(vendor_id, is_active);

-- ─── Customer subscriptions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_subscriptions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id              uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  plan_id                uuid NOT NULL REFERENCES service_plans(id) ON DELETE RESTRICT,
  status                 text NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'active', 'past_due', 'cancelled', 'expired')),
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  payment_method         text CHECK (payment_method IN ('mpesa', 'stripe')),
  stripe_subscription_id text,
  next_billing_at        timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_subs_user ON customer_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_customer_subs_vendor ON customer_subscriptions(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_customer_subs_billing ON customer_subscriptions(next_billing_at)
  WHERE status IN ('active', 'past_due');

-- ─── Class sessions (live / in-person) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS class_sessions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id        uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  title            text NOT NULL,
  description      text,
  starts_at        timestamptz NOT NULL,
  ends_at          timestamptz NOT NULL,
  capacity         integer NOT NULL DEFAULT 20 CHECK (capacity >= 1),
  live_session_id  uuid,
  is_online        boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_class_sessions_vendor ON class_sessions(vendor_id, starts_at);

-- ─── Session enrollments ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_enrollments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES customer_subscriptions(id) ON DELETE SET NULL,
  status          text NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'cancelled', 'attended')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_session_enrollments_user ON session_enrollments(user_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE service_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_plans_public_read" ON service_plans;
CREATE POLICY "service_plans_public_read" ON service_plans
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "service_plans_vendor_manage" ON service_plans;
CREATE POLICY "service_plans_vendor_manage" ON service_plans
  FOR ALL USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "customer_subs_own" ON customer_subscriptions;
CREATE POLICY "customer_subs_own" ON customer_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "customer_subs_vendor_read" ON customer_subscriptions;
CREATE POLICY "customer_subs_vendor_read" ON customer_subscriptions
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "class_sessions_public_read" ON class_sessions;
CREATE POLICY "class_sessions_public_read" ON class_sessions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "class_sessions_vendor_manage" ON class_sessions;
CREATE POLICY "class_sessions_vendor_manage" ON class_sessions
  FOR ALL USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "session_enrollments_own" ON session_enrollments;
CREATE POLICY "session_enrollments_own" ON session_enrollments
  FOR ALL USING (auth.uid() = user_id);

-- ─── Seed: EliteFit monthly plan + sample sessions ───────────────────────────
DO $$
DECLARE
  v_elitefit uuid := 'a1000000-0000-0000-0000-000000000001';
  plan_id    uuid := 'c1000000-0000-0000-0000-000000000001';
  linked_service uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM vendors WHERE id = v_elitefit) THEN
    SELECT id INTO linked_service
    FROM services
    WHERE vendor_id = v_elitefit
    ORDER BY created_at NULLS LAST
    LIMIT 1;

    INSERT INTO service_plans (id, vendor_id, service_id, name, description, price_kes, interval, benefits, includes_live_classes, is_active)
    VALUES (
      plan_id,
      v_elitefit,
      linked_service,
      'EliteFit Monthly Unlimited',
      'Unlimited gym access, all group classes, and live online HIIT sessions.',
      4500,
      'monthly',
      '["Unlimited in-gym access","All HIIT & strength classes","Live online sessions","20% merch discount"]'::jsonb,
      true,
      true
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO class_sessions (vendor_id, title, description, starts_at, ends_at, capacity, is_online)
    VALUES
      (v_elitefit, 'Morning HIIT — Studio A', 'High-intensity bootcamp. All levels.', now() + interval '1 day 7 hours', now() + interval '1 day 8 hours', 15, false),
      (v_elitefit, 'Live Full Body Burn', 'Join from home — no equipment needed.', now() + interval '2 days 18 hours', now() + interval '2 days 19 hours', 50, true),
      (v_elitefit, 'Strength & Conditioning', 'Barbell focus. Spots limited.', now() + interval '4 days 7 hours', now() + interval '4 days 8 hours 30 minutes', 12, false)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ──── included from supabase/migrations/022_canonical_categories.sql ────
-- Canonical marketplace categories (streamlined — no standalone jeans slug)

ALTER TABLE categories ADD COLUMN IF NOT EXISTS description text;

INSERT INTO categories (slug, name, description, icon, sort_order, is_active)
VALUES
  ('fashion', 'Fashion', 'Ready-to-wear & statement pieces', '👗', 1, true),
  ('beauty', 'Beauty', 'Makeup, glow & self-care', '💄', 2, true),
  ('fitness', 'Fitness', 'Training gear & active lifestyle', '💪', 3, true),
  ('wellness', 'Wellness', 'Mind, body & calm', '🧘', 4, true),
  ('skincare', 'Skincare', 'Serums, routines & treatments', '✨', 5, true),
  ('photography', 'Photography', 'Portraits & content creation', '📸', 6, true),
  ('nutrition', 'Nutrition', 'Supplements & meal plans', '🥗', 7, true),
  ('footwear', 'Footwear', 'Sneakers, heels & everyday steps', '👟', 8, true),
  ('accessories', 'Accessories', 'Bags, jewelry & extras', '👜', 9, true),
  ('hair', 'Hair', 'Styling & care', '💇', 10, true),
  ('grooming', 'Grooming', 'Barber & beard care', '🪒', 11, true),
  ('kids', 'Kids', 'Styles for little trendsetters', '🧒', 12, true),
  ('men', 'Men', 'Tailored & everyday menswear', '👔', 13, true),
  ('women', 'Women', 'Curated womenswear', '👠', 14, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_active = true;

-- Re-map legacy jeans products to fashion
UPDATE products SET category = 'fashion' WHERE category = 'jeans';
UPDATE services SET category = 'fashion' WHERE category = 'jeans';

-- ──── included from supabase/migrations/023_booking_availability_seed.sql ────
-- Seed bookable vendors, services, and availability slots (real UUIDs for booking flow)

DO $$
DECLARE
  v_elitefit uuid := 'a1000000-0000-0000-0000-000000000001';
  v_glow     uuid := 'a1000000-0000-0000-0000-000000000002';
  s_hiit     uuid := 'b1000000-0000-0000-0000-000000000001';
  s_facial   uuid := 'b1000000-0000-0000-0000-000000000002';
BEGIN
  INSERT INTO vendors (id, business_name, name, category, location, is_verified)
  VALUES
    (v_elitefit, 'EliteFit Gym', 'EliteFit Gym', 'fitness', 'Nairobi, Kenya', true),
    (v_glow, 'Glow Salon & Spa', 'Glow Salon', 'beauty', 'Nairobi, Kenya', true)
  ON CONFLICT (id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    location = EXCLUDED.location,
    is_verified = true;

  INSERT INTO services (
    id, vendor_id, title, short_description, description, price, category,
    cover_image, duration_minutes, is_virtual, is_in_person, max_participants, status
  )
  VALUES
    (
      s_hiit,
      v_elitefit,
      'HIIT Bootcamp — 60 mins',
      'High-intensity training for all levels.',
      'Group HIIT session with certified coach. All fitness levels welcome.',
      1500,
      'fitness',
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
      60,
      false,
      true,
      12,
      'active'
    ),
    (
      s_facial,
      v_glow,
      'Signature Facial Treatment',
      'Deep cleanse, exfoliation & hydration.',
      'Relaxing facial with premium skincare products.',
      3500,
      'beauty',
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800',
      75,
      false,
      true,
      4,
      'active'
    )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    short_description = EXCLUDED.short_description,
    price = EXCLUDED.price,
    max_participants = EXCLUDED.max_participants,
    status = 'active';

  INSERT INTO availability_slots (vendor_id, service_id, starts_at, ends_at, is_booked)
  SELECT
    v_elitefit,
    s_hiit,
    ts,
    ts + interval '1 hour',
    false
  FROM generate_series(
    date_trunc('day', now()) + interval '1 day 9 hours',
    date_trunc('day', now()) + interval '6 days 9 hours',
    interval '1 day'
  ) AS ts
  WHERE NOT EXISTS (
    SELECT 1 FROM availability_slots WHERE service_id = s_hiit AND starts_at = ts
  );

  INSERT INTO availability_slots (vendor_id, service_id, starts_at, ends_at, is_booked)
  SELECT
    v_glow,
    s_facial,
    ts,
    ts + interval '75 minutes',
    false
  FROM generate_series(
    date_trunc('day', now()) + interval '1 day 11 hours',
    date_trunc('day', now()) + interval '5 days 11 hours',
    interval '1 day'
  ) AS ts
  WHERE NOT EXISTS (
    SELECT 1 FROM availability_slots WHERE service_id = s_facial AND starts_at = ts
  );
END $$;

-- ──── included from supabase/migrations/024_bookings_fk_and_capacity.sql ────
-- Fix booking checkout ("Booking not found") + power the live capacity meter.
--
-- Root cause of "Booking not found": on installs bootstrapped from 020, the
-- bookings table was created WITHOUT foreign keys to vendors/services, so
-- PostgREST embedded selects (services(...), vendors(...)) failed and the
-- booking GET returned an error instead of the row. Add the missing FKs so
-- embeds work, and expose a SECURITY DEFINER capacity function for overbooking
-- protection and the "X of Y spots filled" meter.

-- ── Foreign keys (idempotent) ────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'bookings_service_id_fkey' AND table_name = 'bookings'
  ) THEN
    -- Drop orphan references first so the constraint can be added safely.
    UPDATE bookings b
      SET service_id = NULL
      WHERE service_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM services s WHERE s.id = b.service_id);
    ALTER TABLE bookings
      ADD CONSTRAINT bookings_service_id_fkey
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'bookings_vendor_id_fkey' AND table_name = 'bookings'
  ) THEN
    DELETE FROM bookings b
      WHERE b.vendor_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM vendors v WHERE v.id = b.vendor_id);
    ALTER TABLE bookings
      ADD CONSTRAINT bookings_vendor_id_fkey
      FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ── Live capacity function ───────────────────────────────────────────────────
-- Aggregate counts only (no row exposure), so it is safe to grant broadly.
CREATE OR REPLACE FUNCTION public.service_slot_capacity(
  p_service_id uuid,
  p_slot_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'service_id', p_service_id,
    'slot_id', p_slot_id,
    'service_max', COALESCE(
      (SELECT max_participants FROM services WHERE id = p_service_id), 0
    ),
    'service_booked', COALESCE(
      (SELECT SUM(participants) FROM bookings
       WHERE service_id = p_service_id
         AND COALESCE(status, '') <> 'cancelled'), 0
    ),
    'slot_max', COALESCE(
      (SELECT max_participants FROM services WHERE id = p_service_id), 0
    ),
    'slot_booked', COALESCE(
      (SELECT SUM(participants) FROM bookings
       WHERE p_slot_id IS NOT NULL
         AND availability_slot_id = p_slot_id
         AND COALESCE(status, '') <> 'cancelled'), 0
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.service_slot_capacity(uuid, uuid) TO anon, authenticated;

-- ──── included from supabase/migrations/025_platform_subscription_trial.sql ────
-- Migration 025: One-month free trial for platform subscriptions
-- Adds `trialing` status + optional trial_ends_at (mirrors current_period_end for clarity)

DO $$
BEGIN
  -- Drop old status check constraint(s) if present, then re-add with trialing
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'platform_subscriptions'
  ) THEN
    ALTER TABLE platform_subscriptions DROP CONSTRAINT IF EXISTS platform_subscriptions_status_check;

    -- Postgres auto-names CHECK constraints; drop any remaining status checks
    BEGIN
      ALTER TABLE platform_subscriptions
        DROP CONSTRAINT IF EXISTS platform_subscriptions_status_check1;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;

    ALTER TABLE platform_subscriptions
      ADD CONSTRAINT platform_subscriptions_status_check
      CHECK (status IN ('pending', 'active', 'trialing', 'cancelled', 'expired', 'past_due'));
  END IF;
END $$;

ALTER TABLE platform_subscriptions
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

COMMENT ON COLUMN platform_subscriptions.trial_ends_at IS
  'End of free trial window; for status=trialing this should match current_period_end';

-- Allow payment_method null during trial (no charge yet)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'platform_subscriptions'
  ) THEN
    ALTER TABLE platform_subscriptions DROP CONSTRAINT IF EXISTS platform_subscriptions_payment_method_check;
    ALTER TABLE platform_subscriptions
      ADD CONSTRAINT platform_subscriptions_payment_method_check
      CHECK (payment_method IS NULL OR payment_method IN ('stripe', 'mpesa', 'wallet'));
  END IF;
END $$;

-- ──── included from supabase/migrations/026_platform_subscriptions_rls.sql ────
-- Migration 026: RLS for platform_subscriptions
-- Fixes: ensureVendorTrial insert → "new row violates row-level security policy"
-- Schema: vendor_id + user_id (both required). Own rows = user_id = auth.uid()
--          OR vendor_id belongs to a vendors row owned by auth.uid().

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'platform_subscriptions'
  ) THEN
    ALTER TABLE platform_subscriptions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop prior policy names so this migration is idempotent
DROP POLICY IF EXISTS "platform_subs_own_select" ON platform_subscriptions;
DROP POLICY IF EXISTS "platform_subs_own_insert" ON platform_subscriptions;
DROP POLICY IF EXISTS "platform_subs_own_update" ON platform_subscriptions;
DROP POLICY IF EXISTS "platform_subscriptions_select_own" ON platform_subscriptions;
DROP POLICY IF EXISTS "platform_subscriptions_insert_own" ON platform_subscriptions;
DROP POLICY IF EXISTS "platform_subscriptions_update_own" ON platform_subscriptions;

-- SELECT: owner via user_id or via vendors.user_id
CREATE POLICY "platform_subs_own_select"
  ON platform_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = platform_subscriptions.vendor_id
        AND v.user_id = auth.uid()
    )
  );

-- INSERT: must claim own user_id and own vendor (or matching user_id only if vendor link exists)
CREATE POLICY "platform_subs_own_insert"
  ON platform_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = vendor_id
        AND v.user_id = auth.uid()
    )
  );

-- UPDATE: same ownership as SELECT
CREATE POLICY "platform_subs_own_update"
  ON platform_subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = platform_subscriptions.vendor_id
        AND v.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = vendor_id
        AND v.user_id = auth.uid()
    )
  );

-- Allow vendors to create their own vendor row (needed by ensureVendorRow before trial insert)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'vendors'
  ) THEN
    ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DROP POLICY IF EXISTS "vendors_owner_insert" ON vendors;
CREATE POLICY "vendors_owner_insert"
  ON vendors
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE platform_subscriptions IS
  'Vendor platform billing. RLS: authenticated users manage own rows; service_role bypasses for webhooks/trials.';

-- ──── included from supabase/migrations/027_roadmap_mvp.sql ────
-- Migration 027: Roadmap MVP tables
-- Push subscriptions, flash drops, inventory holds, creator wallet ledger,
-- POS sales, fit profiles, demand signals, vendor trust tiers.

-- ── Push subscriptions (Web Push / FCM token storage) ───────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text,
  auth text,
  fcm_token text,
  user_agent text,
  topics text[] DEFAULT ARRAY['orders','bookings','social','stock']::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON push_subscriptions (user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_subs_own_select ON push_subscriptions;
DROP POLICY IF EXISTS push_subs_own_insert ON push_subscriptions;
DROP POLICY IF EXISTS push_subs_own_update ON push_subscriptions;
DROP POLICY IF EXISTS push_subs_own_delete ON push_subscriptions;

CREATE POLICY push_subs_own_select ON push_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY push_subs_own_insert ON push_subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY push_subs_own_update ON push_subscriptions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY push_subs_own_delete ON push_subscriptions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── Vendor trust tiers (KYC unlocks) ────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'vendors'
  ) THEN
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS trust_tier text DEFAULT 'none';
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS trust_badge text;
    -- none | basic | business | elite
  END IF;
END $$;

-- ── Flash drops / live shopping holds ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS flash_drops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  sale_price numeric(12,2),
  currency text DEFAULT 'KES',
  hold_qty integer DEFAULT 0,
  max_holds integer DEFAULT 50,
  live_session_id uuid,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','live','ended','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS flash_drops_vendor_idx ON flash_drops (vendor_id);
CREATE INDEX IF NOT EXISTS flash_drops_window_idx ON flash_drops (starts_at, ends_at);

CREATE TABLE IF NOT EXISTS drop_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id uuid NOT NULL REFERENCES flash_drops(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notified boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (drop_id, user_id)
);

CREATE TABLE IF NOT EXISTS inventory_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id uuid REFERENCES flash_drops(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  qty integer NOT NULL DEFAULT 1,
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'held'
    CHECK (status IN ('held','converted','released','expired')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE flash_drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE drop_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_holds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS flash_drops_public_read ON flash_drops;
CREATE POLICY flash_drops_public_read ON flash_drops
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS flash_drops_vendor_write ON flash_drops;
CREATE POLICY flash_drops_vendor_write ON flash_drops
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
  );

DROP POLICY IF EXISTS drop_waitlist_own ON drop_waitlist;
CREATE POLICY drop_waitlist_own ON drop_waitlist
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS inventory_holds_own ON inventory_holds;
CREATE POLICY inventory_holds_own ON inventory_holds
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- ── Creator wallet ledger (tips + affiliate + brand deals) ──────────────────
CREATE TABLE IF NOT EXISTS creator_wallet_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  source text NOT NULL CHECK (source IN ('tip','affiliate','brand_deal','adjustment','payout')),
  amount_kes numeric(12,2) NOT NULL,
  currency text DEFAULT 'KES',
  description text,
  reference_id text,
  tax_category text DEFAULT 'commission',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS creator_wallet_ledger_user_idx
  ON creator_wallet_ledger (user_id, created_at DESC);

ALTER TABLE creator_wallet_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS creator_wallet_own_select ON creator_wallet_ledger;
CREATE POLICY creator_wallet_own_select ON creator_wallet_ledger
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = creator_wallet_ledger.vendor_id AND v.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS creator_wallet_own_insert ON creator_wallet_ledger;
CREATE POLICY creator_wallet_own_insert ON creator_wallet_ledger
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = vendor_id AND v.user_id = auth.uid()
    )
  );

-- ── Offline POS sales ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  client_sale_id text,
  sku text,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  qty integer NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  total_kes numeric(12,2) NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'cash',
  synced_at timestamptz,
  created_offline_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vendor_id, client_sale_id)
);

CREATE INDEX IF NOT EXISTS pos_sales_vendor_idx ON pos_sales (vendor_id, created_at DESC);

ALTER TABLE pos_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pos_sales_vendor_all ON pos_sales;
CREATE POLICY pos_sales_vendor_all ON pos_sales
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
  );

-- ── Buyer fit profiles (Virtual Dresser sync) ───────────────────────────────
CREATE TABLE IF NOT EXISTS fit_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  size_top text,
  size_bottom text,
  size_shoe text,
  skin_tone text,
  style_tags text[] DEFAULT '{}',
  preferences jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE fit_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fit_profiles_own ON fit_profiles;
CREATE POLICY fit_profiles_own ON fit_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public read of style tags only for recs — keep private; vendors use API with service role

-- ── Demand signals cache (optional persistence) ─────────────────────────────
CREATE TABLE IF NOT EXISTS demand_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  signal_type text NOT NULL CHECK (signal_type IN ('restock','promote','drop','hold')),
  title text NOT NULL,
  rationale text,
  score numeric(6,2) DEFAULT 0,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS demand_signals_vendor_idx ON demand_signals (vendor_id, created_at DESC);

ALTER TABLE demand_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS demand_signals_vendor_read ON demand_signals;
CREATE POLICY demand_signals_vendor_read ON demand_signals
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
  );

COMMENT ON TABLE push_subscriptions IS 'Web Push / FCM endpoints for order, booking, social, stock alerts';
COMMENT ON TABLE flash_drops IS 'Timed flash sales with waitlist and inventory holds';
COMMENT ON TABLE creator_wallet_ledger IS 'Unified tips + affiliate + brand deal ledger';
COMMENT ON TABLE pos_sales IS 'In-store POS sales including offline-synced rows';
COMMENT ON TABLE fit_profiles IS 'Buyer size/fit prefs synced from Virtual Dresser';
COMMENT ON TABLE demand_signals IS 'AI/heuristic restock-promote-drop signals';

-- ──── included from supabase/migrations/028_signup_nearby_geo.sql ────
-- ═══════════════════════════════════════════════════════════════════════════
-- 028 — Signup bootstrap, profile RLS, nearby geo RPC, delivery fields
-- Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Vendors: service radius for nearby deliveries ──────────────────────────
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS delivery_radius_km numeric DEFAULT 20;

-- ─── Orders: fulfilment / delivery address ──────────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS fulfillment text DEFAULT 'delivery';
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_address text;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_city text;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_lat double precision;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_lng double precision;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_notes text;

-- ─── user_profiles RLS (own write, public read of display fields) ───────────
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles_public_read" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_own_insert" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_own_update" ON user_profiles;

CREATE POLICY "user_profiles_public_read"
  ON user_profiles FOR SELECT USING (true);

CREATE POLICY "user_profiles_own_insert"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_own_update"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── user_roles: users may insert their own shopper role ────────────────────
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_own_read" ON user_roles;
DROP POLICY IF EXISTS "user_roles_own_insert_user" ON user_roles;

CREATE POLICY "user_roles_own_read"
  ON user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_roles_own_insert_user"
  ON user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id AND role IN ('user', 'buyer', 'vendor'));

-- ─── Auto-provision profile + shopper role on auth.users insert ─────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_intended text;
BEGIN
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'Member'
  );
  v_intended := COALESCE(NEW.raw_user_meta_data->>'intended_role', 'shopper');

  INSERT INTO public.user_profiles (user_id, display_name, preferences)
  VALUES (
    NEW.id,
    v_name,
    jsonb_build_object('intended_role', v_intended)
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- ─── Nearby vendors RPC (haversine, metres-free) ────────────────────────────
CREATE OR REPLACE FUNCTION public.nearby_vendors(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision DEFAULT 25
)
RETURNS TABLE (
  id uuid,
  name text,
  business_name text,
  category text,
  location text,
  address text,
  lat double precision,
  lng double precision,
  is_verified boolean,
  delivery_radius_km numeric,
  distance_km double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    v.id,
    v.name,
    v.business_name,
    v.category,
    v.location,
    v.address,
    v.lat,
    v.lng,
    v.is_verified,
    COALESCE(v.delivery_radius_km, 20),
    (
      6371 * 2 * asin(sqrt(
        power(sin(radians(v.lat - p_lat) / 2), 2) +
        cos(radians(p_lat)) * cos(radians(v.lat)) *
        power(sin(radians(v.lng - p_lng) / 2), 2)
      ))
    ) AS distance_km
  FROM vendors v
  WHERE v.lat IS NOT NULL
    AND v.lng IS NOT NULL
    AND (
      6371 * 2 * asin(sqrt(
        power(sin(radians(v.lat - p_lat) / 2), 2) +
        cos(radians(p_lat)) * cos(radians(v.lat)) *
        power(sin(radians(v.lng - p_lng) / 2), 2)
      ))
    ) <= COALESCE(p_radius_km, 25)
  ORDER BY distance_km ASC;
$$;

GRANT EXECUTE ON FUNCTION public.nearby_vendors(double precision, double precision, double precision) TO anon, authenticated;

-- Copilot messages: owner insert
ALTER TABLE copilot_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "copilot_own_read" ON copilot_messages;
DROP POLICY IF EXISTS "copilot_own_insert" ON copilot_messages;
CREATE POLICY "copilot_own_read"
  ON copilot_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "copilot_own_insert"
  ON copilot_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ──── included from supabase/migrations/029_vendor_create_rls.sql ────
-- Migration 029: Vendor create/manage RLS
-- Products had no RLS (anon API inserts) while services/feed/reels require auth.uid().
-- Create APIs now use the cookie-bound server client; these policies let a vendor
-- insert/update their own catalog and store. Idempotent.

-- ─── products ───────────────────────────────────────────────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_public_read" ON products;
DROP POLICY IF EXISTS "products_vendor_insert" ON products;
DROP POLICY IF EXISTS "products_vendor_update" ON products;
DROP POLICY IF EXISTS "products_vendor_delete" ON products;

CREATE POLICY "products_public_read"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "products_vendor_insert"
  ON products FOR INSERT
  WITH CHECK (
    (
      vendor_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM vendors v
        WHERE v.id = products.vendor_id AND v.user_id = auth.uid()
      )
    )
    OR (
      store_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM stores s
        WHERE s.id = products.store_id AND s.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "products_vendor_update"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = products.vendor_id AND v.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM stores s
      WHERE s.id = products.store_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "products_vendor_delete"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = products.vendor_id AND v.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM stores s
      WHERE s.id = products.store_id AND s.user_id = auth.uid()
    )
  );

-- ─── stores ─────────────────────────────────────────────────────────────────
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stores_public_read" ON stores;
DROP POLICY IF EXISTS "stores_own_insert" ON stores;
DROP POLICY IF EXISTS "stores_own_update" ON stores;
DROP POLICY IF EXISTS "stores_own_delete" ON stores;

CREATE POLICY "stores_public_read"
  ON stores FOR SELECT
  USING (true);

CREATE POLICY "stores_own_insert"
  ON stores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stores_own_update"
  ON stores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "stores_own_delete"
  ON stores FOR DELETE
  USING (auth.uid() = user_id);

-- ─── availability slots (bookable services) ─────────────────────────────────
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "availability_public_read" ON availability_slots;
DROP POLICY IF EXISTS "availability_vendor_write" ON availability_slots;

CREATE POLICY "availability_public_read"
  ON availability_slots FOR SELECT
  USING (true);

CREATE POLICY "availability_vendor_write"
  ON availability_slots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = availability_slots.vendor_id AND v.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = availability_slots.vendor_id AND v.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "products_vendor_insert" ON products IS
  'Vendor may insert products for their vendors/stores row (cookie session).';

-- ──── included from supabase/migrations/030_paystack_and_indexes.sql ────
-- 030 — Paystack references, ledger indexes, streak points, RLS where policies exist.
-- Idempotent. Does not enable RLS on tables that have no policies.

ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_ref text;

CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_ref_unique
  ON payments (provider_ref)
  WHERE provider_ref IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_status_created
  ON payments (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_provider
  ON payments (provider);

ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ledger_entries' AND column_name = 'payment_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_ledger_payment_category
      ON ledger_entries (payment_id, category);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders (user_id, created_at DESC);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'feed_posts' AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON feed_posts (created_at DESC);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_products_created ON products (created_at DESC);
  END IF;
END $$;

-- Turn RLS on only for public tables that already have at least one policy.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname AS tbl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity = false
      AND EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.schemaname = 'public' AND p.tablename = c.relname
      )
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tbl);
  END LOOP;
END $$;

-- ──── storage buckets + RLS ────
-- ═══════════════════════════════════════════════════════════════════════════
-- Storage buckets + RLS
-- Buckets: products, product-images, profile-media (public read).
-- Product uploads use paths like {storeId}/{file}, so authenticated users
-- may write those buckets. profile-media stays scoped to {auth.uid()}/*.
-- Hosted Supabase sometimes rejects storage policy SQL ("must be owner of
-- table objects"). Each block notices and continues so the rest of this
-- script (demo users) still applies. If you see that notice, create the
-- same policies in Dashboard → Storage. See docs/STORAGE_SETUP.md.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES
    ('products', 'products', true, 52428800, ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm']::text[]),
    ('product-images', 'product-images', true, 52428800, ARRAY['image/jpeg','image/png','image/webp','image/gif']::text[]),
    (
      'profile-media',
      'profile-media',
      true,
      52428800,
      ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']::text[]
    )
  ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'LookFinesse: storage.buckets insert skipped (insufficient privilege). Create products, product-images, and profile-media in Dashboard → Storage.';
  WHEN OTHERS THEN
    IF SQLERRM ILIKE '%must be owner%' OR SQLERRM ILIKE '%permission denied%' THEN
      RAISE NOTICE 'LookFinesse: storage.buckets insert skipped: %', SQLERRM;
    ELSE
      RAISE;
    END IF;
END $$;

DO $$
BEGIN
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

  -- products
  DROP POLICY IF EXISTS "products_bucket_public_read" ON storage.objects;
  CREATE POLICY "products_bucket_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'products');

  DROP POLICY IF EXISTS "products_bucket_auth_insert" ON storage.objects;
  CREATE POLICY "products_bucket_auth_insert"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'products');

  DROP POLICY IF EXISTS "products_bucket_auth_update" ON storage.objects;
  CREATE POLICY "products_bucket_auth_update"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'products')
    WITH CHECK (bucket_id = 'products');

  DROP POLICY IF EXISTS "products_bucket_auth_delete" ON storage.objects;
  CREATE POLICY "products_bucket_auth_delete"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'products');

  -- product-images
  DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
  CREATE POLICY "product_images_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-images');

  DROP POLICY IF EXISTS "product_images_auth_insert" ON storage.objects;
  CREATE POLICY "product_images_auth_insert"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'product-images');

  DROP POLICY IF EXISTS "product_images_auth_update" ON storage.objects;
  CREATE POLICY "product_images_auth_update"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'product-images')
    WITH CHECK (bucket_id = 'product-images');

  DROP POLICY IF EXISTS "product_images_auth_delete" ON storage.objects;
  CREATE POLICY "product_images_auth_delete"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'product-images');

  -- profile-media (own folder)
  DROP POLICY IF EXISTS "profile_media_public_read" ON storage.objects;
  CREATE POLICY "profile_media_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profile-media');

  DROP POLICY IF EXISTS "profile_media_auth_insert" ON storage.objects;
  CREATE POLICY "profile_media_auth_insert"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'profile-media'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );

  DROP POLICY IF EXISTS "profile_media_auth_update" ON storage.objects;
  CREATE POLICY "profile_media_auth_update"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
      bucket_id = 'profile-media'
      AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
      bucket_id = 'profile-media'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );

  DROP POLICY IF EXISTS "profile_media_auth_delete" ON storage.objects;
  CREATE POLICY "profile_media_auth_delete"
    ON storage.objects FOR DELETE TO authenticated
    USING (
      bucket_id = 'profile-media'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'LookFinesse: storage RLS skipped (insufficient privilege). Add the policies from docs/GO_LIVE_CHECKLIST.md in Dashboard → Storage.';
  WHEN OTHERS THEN
    IF SQLERRM ILIKE '%must be owner%' OR SQLERRM ILIKE '%permission denied%' THEN
      RAISE NOTICE 'LookFinesse: storage RLS skipped: %', SQLERRM;
    ELSE
      RAISE;
    END IF;
END $$;


-- ──── included from supabase/seed_auth_users.sql ────
-- ═══════════════════════════════════════════════════════════════════════════
-- LookFinesse — Seed Supabase Auth test users (SQL Editor / hosted projects)
-- Run AFTER 000_fresh_bootstrap.sql, BEFORE seed_auth_roles.sql
-- Safe to re-run (skips existing emails; resets the documented demo password if it drifted)
--
-- Password for all accounts: Test123456!
--   vendor@test.com  → vendor / fitness gym (EliteFit)
--   admin@test.com   → platform admin
--   user@test.com    → shopper / buyer
--   glow@test.com    → vendor / beauty salon (Glow Salon & Spa)
--   style@test.com   → vendor / fashion boutique (Style Bank)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_instance_id   uuid := '00000000-0000-0000-0000-000000000000';
  v_password      text := 'Test123456!';
  v_encrypted_pw  text;
  v_user_id       uuid;
  v_email         text;
  v_display_name  text;
  v_users         constant jsonb := '[
    {"id":"f1000000-0000-0000-0000-000000000001","email":"vendor@test.com","display_name":"Demo Vendor"},
    {"id":"f1000000-0000-0000-0000-000000000002","email":"admin@test.com","display_name":"Platform Admin"},
    {"id":"f1000000-0000-0000-0000-000000000003","email":"user@test.com","display_name":"Demo User"},
    {"id":"f1000000-0000-0000-0000-000000000004","email":"glow@test.com","display_name":"Glow Salon"},
    {"id":"f1000000-0000-0000-0000-000000000005","email":"style@test.com","display_name":"Style Bank"}
  ]'::jsonb;
  v_row           jsonb;
BEGIN
  v_encrypted_pw := extensions.crypt(v_password, extensions.gen_salt('bf'));

  FOR v_row IN SELECT * FROM jsonb_array_elements(v_users)
  LOOP
    v_user_id      := (v_row->>'id')::uuid;
    v_email        := v_row->>'email';
    v_display_name := v_row->>'display_name';

    -- auth.users (skip if email already exists — e.g. created manually in Dashboard)
    IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.email = v_email) THEN
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      )
      VALUES (
        v_instance_id,
        v_user_id,
        'authenticated',
        'authenticated',
        v_email,
        v_encrypted_pw,
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('display_name', v_display_name),
        now(),
        now(),
        '',
        '',
        '',
        ''
      );
    END IF;

    -- Resolve id (fixed UUID on fresh seed, or existing row if email pre-existed)
    SELECT u.id INTO v_user_id FROM auth.users u WHERE u.email = v_email LIMIT 1;

    IF v_user_id IS NULL THEN
      RAISE EXCEPTION 'Failed to create or resolve auth user for %', v_email;
    END IF;

    -- auth.identities — required for email/password sign-in (GoTrue).
    -- NOT EXISTS (not ON CONFLICT) so a re-run does not depend on constraint column order.
    IF NOT EXISTS (
      SELECT 1 FROM auth.identities i
      WHERE i.user_id = v_user_id AND i.provider = 'email'
    ) THEN
      INSERT INTO auth.identities (
        provider_id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      )
      VALUES (
        v_user_id::text,
        v_user_id,
        jsonb_build_object(
          'sub', v_user_id::text,
          'email', v_email,
          'email_verified', true,
          'phone_verified', false
        ),
        'email',
        now(),
        now(),
        now()
      );
    END IF;
  END LOOP;
END $$;

-- ─── Verify bcrypt hashes (GoTrue-compatible via pgcrypto crypt) ────────────

DO $$
DECLARE
  v_password text := 'Test123456!';
  v_email    text;
  v_ok       boolean;
BEGIN
  FOREACH v_email IN ARRAY ARRAY['vendor@test.com', 'admin@test.com', 'user@test.com', 'glow@test.com', 'style@test.com']
  LOOP
    SELECT extensions.crypt(v_password, u.encrypted_password) = u.encrypted_password
      INTO v_ok
    FROM auth.users u
    WHERE u.email = v_email;

    -- Re-run: keep the documented demo password instead of aborting the script.
    IF v_ok IS DISTINCT FROM true THEN
      UPDATE auth.users
      SET encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
          updated_at = now()
      WHERE email = v_email;
      RAISE NOTICE 'seed_auth_users: reset demo password for %', v_email;
    END IF;
  END LOOP;

  RAISE NOTICE 'seed_auth_users: 5 test accounts ready (vendor, admin, user, glow, style @test.com)';
END $$;

-- ──── included from supabase/seed_auth_roles.sql ────
-- ═══════════════════════════════════════════════════════════════════════════
-- LookFinesse — Link auth test users to roles & vendor profile
-- Run AFTER supabase/seed_auth_users.sql (see docs/SEED_CREDENTIALS.md)
-- Safe to re-run (ON CONFLICT DO NOTHING / idempotent updates)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Demo vendor rows (no-op if seed.sql already inserted these ids) ────────
-- Lets vendor@test.com / glow / style create products without the full catalog seed.

INSERT INTO vendors (
  id, name, business_name, email, category, description, location, address, lat, lng, is_verified, specialty
)
VALUES
  (
    'a1000000-0000-0000-0000-000000000001',
    'EliteFit Gym',
    'EliteFit Gym',
    'elitefit@vyb.co.ke',
    'fitness',
    'Premium fitness studio in Westlands. Strength, cardio & HIIT.',
    'Westlands, Nairobi',
    'Westlands Rd, Nairobi',
    -1.2648,
    36.8067,
    true,
    ARRAY['fitness','hiit','strength']
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'Glow Salon & Spa',
    'Glow Salon & Spa',
    'glow@vyb.co.ke',
    'beauty',
    'Salon and spa in Kilimani — hair, facials, and beauty services.',
    'Kilimani, Nairobi',
    'Dennis Pritt Rd, Nairobi',
    -1.2916,
    36.7836,
    true,
    ARRAY['beauty','hair','facials']
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'Style Bank',
    'Style Bank',
    'style@vyb.co.ke',
    'fashion',
    'African fashion boutique in Lavington.',
    'Lavington, Nairobi',
    'James Gichuru Rd, Nairobi',
    -1.2833,
    36.7736,
    true,
    ARRAY['fashion','style','accessories']
  )
ON CONFLICT (id) DO NOTHING;

-- ─── Roles ──────────────────────────────────────────────────────────────────

INSERT INTO user_roles (user_id, role)
SELECT id, 'vendor' FROM auth.users WHERE email = 'vendor@test.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'admin@test.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'user' FROM auth.users WHERE email = 'user@test.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Admin app_metadata (optional — edge auth also checks user_roles)
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
WHERE email = 'admin@test.com';

-- ─── Link vendor@test.com → EliteFit Gym (seed vendor id) ───────────────────

UPDATE vendors
SET user_id = (SELECT id FROM auth.users WHERE email = 'vendor@test.com')
WHERE id = 'a1000000-0000-0000-0000-000000000001';

-- ─── User profiles for test accounts ────────────────────────────────────────

INSERT INTO user_profiles (user_id, display_name, city, onboarded_at, preferences)
SELECT id, 'Demo Vendor', 'Nairobi', now(), '{"gender":"male","age_group":"25-34","interests":["fitness"],"intended_role":"vendor"}'::jsonb
FROM auth.users WHERE email = 'vendor@test.com'
ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, city = EXCLUDED.city, onboarded_at = COALESCE(user_profiles.onboarded_at, EXCLUDED.onboarded_at);

INSERT INTO user_profiles (user_id, display_name, city, onboarded_at, preferences)
SELECT id, 'Platform Admin', 'Nairobi', now(), '{"intended_role":"shopper"}'::jsonb
FROM auth.users WHERE email = 'admin@test.com'
ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, onboarded_at = COALESCE(user_profiles.onboarded_at, EXCLUDED.onboarded_at);

INSERT INTO user_profiles (user_id, display_name, city, onboarded_at, preferences)
SELECT id, 'Demo User', 'Nairobi', now(), '{"gender":"female","age_group":"25-34","interests":["fashion","beauty"],"intended_role":"shopper"}'::jsonb
FROM auth.users WHERE email = 'user@test.com'
ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, city = EXCLUDED.city, onboarded_at = COALESCE(user_profiles.onboarded_at, EXCLUDED.onboarded_at);

-- ─── Optional: create a store row for vendor@test.com ───────────────────────

INSERT INTO stores (user_id, name, description, city)
SELECT u.id, 'EliteFit Store', 'Demo vendor store for EliteFit Gym', 'Nairobi'
FROM auth.users u
WHERE u.email = 'vendor@test.com'
  AND NOT EXISTS (SELECT 1 FROM stores s WHERE s.user_id = u.id);

-- ─── 30-day Pro trial for vendor@test.com (if no paid/active sub) ────────────

INSERT INTO platform_subscriptions (
  vendor_id, user_id, tier, status, price_kes, payment_method,
  ad_credits_remaining, current_period_start, current_period_end, trial_ends_at
)
SELECT
  'a1000000-0000-0000-0000-000000000001'::uuid,
  u.id,
  'pro',
  'trialing',
  0,
  NULL,
  2500,
  now(),
  now() + interval '30 days',
  now() + interval '30 days'
FROM auth.users u
WHERE u.email = 'vendor@test.com'
  AND EXISTS (SELECT 1 FROM vendors v WHERE v.id = 'a1000000-0000-0000-0000-000000000001')
  AND NOT EXISTS (
    SELECT 1 FROM platform_subscriptions ps
    WHERE ps.vendor_id = 'a1000000-0000-0000-0000-000000000001'
      AND ps.status IN ('active', 'trialing')
  )
ON CONFLICT (vendor_id) DO UPDATE SET
  tier = EXCLUDED.tier,
  status = EXCLUDED.status,
  price_kes = EXCLUDED.price_kes,
  user_id = EXCLUDED.user_id,
  current_period_start = EXCLUDED.current_period_start,
  current_period_end = EXCLUDED.current_period_end,
  trial_ends_at = EXCLUDED.trial_ends_at,
  ad_credits_remaining = EXCLUDED.ad_credits_remaining
WHERE platform_subscriptions.status NOT IN ('active');

-- ─── glow@test.com → Glow Salon & Spa ───────────────────────────────────────

INSERT INTO user_roles (user_id, role)
SELECT id, 'vendor' FROM auth.users WHERE email = 'glow@test.com'
ON CONFLICT (user_id, role) DO NOTHING;

UPDATE vendors
SET user_id = (SELECT id FROM auth.users WHERE email = 'glow@test.com')
WHERE id = 'a1000000-0000-0000-0000-000000000002'
  AND (user_id IS NULL OR user_id = (SELECT id FROM auth.users WHERE email = 'glow@test.com'));

INSERT INTO user_profiles (user_id, display_name, city, onboarded_at, preferences)
SELECT id, 'Glow Salon', 'Nairobi', now(), '{"gender":"female","age_group":"25-34","interests":["beauty"],"intended_role":"vendor"}'::jsonb
FROM auth.users WHERE email = 'glow@test.com'
ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, onboarded_at = COALESCE(user_profiles.onboarded_at, EXCLUDED.onboarded_at);

INSERT INTO stores (user_id, name, description, city, latitude, longitude)
SELECT u.id, 'Glow Salon & Spa', 'Demo beauty vendor storefront', 'Nairobi', -1.2916, 36.7836
FROM auth.users u
WHERE u.email = 'glow@test.com'
  AND NOT EXISTS (SELECT 1 FROM stores s WHERE s.user_id = u.id);

INSERT INTO platform_subscriptions (
  vendor_id, user_id, tier, status, price_kes, payment_method,
  ad_credits_remaining, current_period_start, current_period_end, trial_ends_at
)
SELECT
  'a1000000-0000-0000-0000-000000000002'::uuid,
  u.id,
  'pro',
  'trialing',
  0,
  NULL,
  2500,
  now(),
  now() + interval '30 days',
  now() + interval '30 days'
FROM auth.users u
WHERE u.email = 'glow@test.com'
  AND EXISTS (SELECT 1 FROM vendors v WHERE v.id = 'a1000000-0000-0000-0000-000000000002')
  AND NOT EXISTS (
    SELECT 1 FROM platform_subscriptions ps
    WHERE ps.vendor_id = 'a1000000-0000-0000-0000-000000000002'
      AND ps.status IN ('active', 'trialing')
  )
ON CONFLICT (vendor_id) DO NOTHING;

-- ─── style@test.com → Style Bank ────────────────────────────────────────────

INSERT INTO user_roles (user_id, role)
SELECT id, 'vendor' FROM auth.users WHERE email = 'style@test.com'
ON CONFLICT (user_id, role) DO NOTHING;

UPDATE vendors
SET user_id = (SELECT id FROM auth.users WHERE email = 'style@test.com')
WHERE id = 'a1000000-0000-0000-0000-000000000003'
  AND (user_id IS NULL OR user_id = (SELECT id FROM auth.users WHERE email = 'style@test.com'));

INSERT INTO user_profiles (user_id, display_name, city, onboarded_at, preferences)
SELECT id, 'Style Bank', 'Nairobi', now(), '{"gender":"female","age_group":"25-34","interests":["fashion"],"intended_role":"vendor"}'::jsonb
FROM auth.users WHERE email = 'style@test.com'
ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, onboarded_at = COALESCE(user_profiles.onboarded_at, EXCLUDED.onboarded_at);

INSERT INTO stores (user_id, name, description, city, latitude, longitude)
SELECT u.id, 'Style Bank', 'Demo fashion vendor storefront', 'Nairobi', -1.2789, 36.7689
FROM auth.users u
WHERE u.email = 'style@test.com'
  AND NOT EXISTS (SELECT 1 FROM stores s WHERE s.user_id = u.id);

INSERT INTO platform_subscriptions (
  vendor_id, user_id, tier, status, price_kes, payment_method,
  ad_credits_remaining, current_period_start, current_period_end, trial_ends_at
)
SELECT
  'a1000000-0000-0000-0000-000000000003'::uuid,
  u.id,
  'pro',
  'trialing',
  0,
  NULL,
  2500,
  now(),
  now() + interval '30 days',
  now() + interval '30 days'
FROM auth.users u
WHERE u.email = 'style@test.com'
  AND EXISTS (SELECT 1 FROM vendors v WHERE v.id = 'a1000000-0000-0000-0000-000000000003')
  AND NOT EXISTS (
    SELECT 1 FROM platform_subscriptions ps
    WHERE ps.vendor_id = 'a1000000-0000-0000-0000-000000000003'
      AND ps.status IN ('active', 'trialing')
  )
ON CONFLICT (vendor_id) DO NOTHING;



-- ──── included from supabase/seed.sql ────
-- ═══════════════════════════════════════════════════════════════════════════
-- VYB MARKETPLACE — RICH DEMO SEED DATA (Nairobi / Lifestyle)
-- ─────────────────────────────────────────────────────────────────────────
-- HOW TO RUN (fresh project):
--   1. Run supabase/migrations/000_fresh_bootstrap.sql — see docs/MIGRATIONS.md
--   2. Run supabase/seed_auth_users.sql — see docs/SEED_CREDENTIALS.md
--   3. Run supabase/seed_auth_roles.sql
--   4. Paste & run this file
--   5. Run supabase/seed_demo_metrics.sql — orders, wallets, ledger (non-zero KPIs)
--   6. Optional: 021_service_subscriptions.sql, 025_platform_subscription_trial.sql
-- NOTE: Uses ON CONFLICT DO NOTHING — safe to re-run
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  -- Vendors
  v_elitefit    uuid := 'a1000000-0000-0000-0000-000000000001';
  v_glow        uuid := 'a1000000-0000-0000-0000-000000000002';
  v_stylebnk    uuid := 'a1000000-0000-0000-0000-000000000003';
  v_zenwell     uuid := 'a1000000-0000-0000-0000-000000000004';
  v_fitqueen    uuid := 'a1000000-0000-0000-0000-000000000005';
  v_natubeauty  uuid := 'a1000000-0000-0000-0000-000000000006';
  v_afrocuts    uuid := 'a1000000-0000-0000-0000-000000000007';
  v_luxthread   uuid := 'a1000000-0000-0000-0000-000000000008';

  -- Products
  p1  uuid := 'b1000000-0000-0000-0000-000000000001';
  p2  uuid := 'b1000000-0000-0000-0000-000000000002';
  p3  uuid := 'b1000000-0000-0000-0000-000000000003';
  p4  uuid := 'b1000000-0000-0000-0000-000000000004';
  p5  uuid := 'b1000000-0000-0000-0000-000000000005';
  p6  uuid := 'b1000000-0000-0000-0000-000000000006';
  p7  uuid := 'b1000000-0000-0000-0000-000000000007';
  p8  uuid := 'b1000000-0000-0000-0000-000000000008';
  p9  uuid := 'b1000000-0000-0000-0000-000000000009';
  p10 uuid := 'b1000000-0000-0000-0000-000000000010';
  p11 uuid := 'b1000000-0000-0000-0000-000000000011';
  p12 uuid := 'b1000000-0000-0000-0000-000000000012';
  p13 uuid := 'b1000000-0000-0000-0000-000000000013';
  p14 uuid := 'b1000000-0000-0000-0000-000000000014';
  p15 uuid := 'b1000000-0000-0000-0000-000000000015';
  p16 uuid := 'b1000000-0000-0000-0000-000000000016';
  p17 uuid := 'b1000000-0000-0000-0000-000000000017';
  p18 uuid := 'b1000000-0000-0000-0000-000000000018';
  p19 uuid := 'b1000000-0000-0000-0000-000000000019';
  p20 uuid := 'b1000000-0000-0000-0000-000000000020';
  p21 uuid := 'b1000000-0000-0000-0000-000000000021';
  p22 uuid := 'b1000000-0000-0000-0000-000000000022';
  p23 uuid := 'b1000000-0000-0000-0000-000000000023';
  p24 uuid := 'b1000000-0000-0000-0000-000000000024';
  p25 uuid := 'b1000000-0000-0000-0000-000000000025';
  p26 uuid := 'b1000000-0000-0000-0000-000000000026';

  -- Services
  s1 uuid := 'c1000000-0000-0000-0000-000000000001';
  s2 uuid := 'c1000000-0000-0000-0000-000000000002';
  s3 uuid := 'c1000000-0000-0000-0000-000000000003';
  s4 uuid := 'c1000000-0000-0000-0000-000000000004';
  s5 uuid := 'c1000000-0000-0000-0000-000000000005';
  s6 uuid := 'c1000000-0000-0000-0000-000000000006';
  s7 uuid := 'c1000000-0000-0000-0000-000000000007';
  s8 uuid := 'c1000000-0000-0000-0000-000000000008';

  -- Feed posts
  fp1  uuid := 'd1000000-0000-0000-0000-000000000001';
  fp2  uuid := 'd1000000-0000-0000-0000-000000000002';
  fp3  uuid := 'd1000000-0000-0000-0000-000000000003';
  fp4  uuid := 'd1000000-0000-0000-0000-000000000004';
  fp5  uuid := 'd1000000-0000-0000-0000-000000000005';
  fp6  uuid := 'd1000000-0000-0000-0000-000000000006';
  fp7  uuid := 'd1000000-0000-0000-0000-000000000007';
  fp8  uuid := 'd1000000-0000-0000-0000-000000000008';
  fp9  uuid := 'd1000000-0000-0000-0000-000000000009';
  fp10 uuid := 'd1000000-0000-0000-0000-000000000010';
  fp11 uuid := 'd1000000-0000-0000-0000-000000000011';
  fp12 uuid := 'd1000000-0000-0000-0000-000000000012';
  fp13 uuid := 'd1000000-0000-0000-0000-000000000013';
  fp14 uuid := 'd1000000-0000-0000-0000-000000000014';
  fp15 uuid := 'd1000000-0000-0000-0000-000000000015';
  fp16 uuid := 'd1000000-0000-0000-0000-000000000016';
  fp17 uuid := 'd1000000-0000-0000-0000-000000000017';
  fp18 uuid := 'd1000000-0000-0000-0000-000000000018';

  -- Reels
  r1 uuid := 'e1000000-0000-0000-0000-000000000001';
  r2 uuid := 'e1000000-0000-0000-0000-000000000002';
  r3 uuid := 'e1000000-0000-0000-0000-000000000003';
  r4 uuid := 'e1000000-0000-0000-0000-000000000004';
  r5 uuid := 'e1000000-0000-0000-0000-000000000005';
  r6 uuid := 'e1000000-0000-0000-0000-000000000006';
  r7 uuid := 'e1000000-0000-0000-0000-000000000007';
  r8 uuid := 'e1000000-0000-0000-0000-000000000008';

  -- Live sessions
  l1 uuid := 'f1000000-0000-0000-0000-000000000001';
  l2 uuid := 'f1000000-0000-0000-0000-000000000002';
  l3 uuid := 'f1000000-0000-0000-0000-000000000003';
  l4 uuid := 'f1000000-0000-0000-0000-000000000004';
  l5 uuid := 'f1000000-0000-0000-0000-000000000005';

  -- Challenges
  ch1 uuid := '11000000-0000-4000-8000-000000000001';
  ch2 uuid := '11000000-0000-4000-8000-000000000002';
  ch3 uuid := '11000000-0000-4000-8000-000000000003';
  ch4 uuid := '11000000-0000-4000-8000-000000000004';

  -- Trending
  t1 uuid := '12000000-0000-4000-8000-000000000001';
  t2 uuid := '12000000-0000-4000-8000-000000000002';
  t3 uuid := '12000000-0000-4000-8000-000000000003';
  t4 uuid := '12000000-0000-4000-8000-000000000004';
  t5 uuid := '12000000-0000-4000-8000-000000000005';
  t6 uuid := '12000000-0000-4000-8000-000000000006';

  -- Collections
  col1 uuid := '13000000-0000-4000-8000-000000000001';
  col2 uuid := '13000000-0000-4000-8000-000000000002';

  -- Membership tiers
  mt1 uuid := '14000000-0000-4000-8000-000000000001';
  mt2 uuid := '14000000-0000-4000-8000-000000000002';
  mt3 uuid := '14000000-0000-4000-8000-000000000003';

  -- Affiliate links
  aff1 uuid := '15000000-0000-4000-8000-000000000001';
  aff2 uuid := '15000000-0000-4000-8000-000000000002';
  aff3 uuid := '15000000-0000-4000-8000-000000000003';
  aff4 uuid := '15000000-0000-4000-8000-000000000004';

  -- Ad campaigns
  ad1 uuid := '16000000-0000-4000-8000-000000000001';
  ad2 uuid := '16000000-0000-4000-8000-000000000002';
  ad3 uuid := '16000000-0000-4000-8000-000000000003';

  -- Staff
  st1 uuid := '17000000-0000-4000-8000-000000000001';
  st2 uuid := '17000000-0000-4000-8000-000000000002';
  st3 uuid := '17000000-0000-4000-8000-000000000003';
  st4 uuid := '17000000-0000-4000-8000-000000000004';

  -- Demo user (resolved from auth.users at runtime — see docs/SEED_CREDENTIALS.md)
  demo_user uuid;

BEGIN

-- Resolve demo buyer from auth.users (user@test.com, fallback vendor@test.com)
SELECT id INTO demo_user FROM auth.users WHERE email = 'user@test.com' LIMIT 1;
IF demo_user IS NULL THEN
  SELECT id INTO demo_user FROM auth.users WHERE email = 'vendor@test.com' LIMIT 1;
END IF;
IF demo_user IS NULL THEN
  RAISE NOTICE 'Skipping notifications & bookings: no auth user for user@test.com or vendor@test.com. Create auth users before seed.sql (see docs/SEED_CREDENTIALS.md).';
END IF;

-- ─── PRODUCT CATEGORIES (admin-managed) ───────────────────────────────────
INSERT INTO categories (name, slug, icon, sort_order, is_active)
VALUES
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
  ('Jewellery',      'jewellery',      '💍', 14, true),
  ('Kids',           'kids',           '👶', 15, true),
  ('Men',            'men',            '👔', 16, true),
  ('Women',          'women',          '👩', 17, true),
  ('Makeup',         'makeup',         '💋', 18, true),
  ('Fragrance',      'fragrance',      '🌸', 19, true),
  ('Yoga & Pilates', 'yoga-pilates',   '🧘‍♀️', 20, true),
  ('Denim & Jeans',  'jeans',          '👖', 21, true)
ON CONFLICT (name) DO NOTHING;

-- ─── VENDORS (8 Nairobi creators with lat/lng) ────────────────────────────
INSERT INTO vendors (id, business_name, email, avatar_url, category, description, location, address, lat, lng, is_verified, specialty)
VALUES
  (v_elitefit,   'EliteFit Gym',        'elitefit@vyb.co.ke',   'https://api.dicebear.com/7.x/initials/svg?seed=EliteFit',    'fitness',  'Premium fitness studio in Westlands. Strength, cardio & HIIT. Nairobi''s most results-driven gym.',              'Westlands, Nairobi',  'Westlands Rd, Nairobi',  -1.2648, 36.8067, true,  ARRAY['fitness','hiit','strength','cardio']),
  (v_glow,       'Glow Salon & Spa',    'glow@vyb.co.ke',       'https://api.dicebear.com/7.x/initials/svg?seed=GlowSalon',   'beauty',   'Award-winning salon specialising in natural hair, Korean facials & spa treatments.',                            'Kilimani, Nairobi',   'Dennis Pritt Rd, Nairobi',-1.2916, 36.7836, true,  ARRAY['beauty','hair','facials','spa']),
  (v_stylebnk,   'Style Bank',          'style@vyb.co.ke',      'https://api.dicebear.com/7.x/initials/svg?seed=StyleBank',   'fashion',  'Curating the best of African fashion — ready-to-wear, custom pieces & accessories. Proudly Kenyan.',             'Lavington, Nairobi',  'James Gichuru Rd, Nairobi',-1.2833,36.7736, true,  ARRAY['fashion','style','accessories','ankara']),
  (v_zenwell,    'Zen Wellness Centre', 'zen@vyb.co.ke',        'https://api.dicebear.com/7.x/initials/svg?seed=ZenWellness', 'wellness', 'Holistic wellness: yoga, meditation, nutrition coaching & mindfulness. Serene Karen studio.',                    'Karen, Nairobi',      'Karen Rd, Nairobi',       -1.3362, 36.7057, false, ARRAY['wellness','yoga','nutrition','meditation']),
  (v_fitqueen,   'FitQueen Training',   'fitqueen@vyb.co.ke',   'https://api.dicebear.com/7.x/initials/svg?seed=FitQueen',    'fitness',  'Women-focused personal training, bootcamps & online programmes. Real results, real community.',                  'Parklands, Nairobi',  'Mpaka Rd, Nairobi',       -1.2553, 36.8064, true,  ARRAY['fitness','nutrition','womens-fitness']),
  (v_natubeauty, 'NaturalGlow Beauty',  'natuglow@vyb.co.ke',   'https://api.dicebear.com/7.x/initials/svg?seed=NaturalGlow', 'beauty',   'All-natural beauty products & routines for melanin-rich skin. Clean beauty for the modern African woman.',      'Kileleshwa, Nairobi', 'Kileleshwa Rd, Nairobi',  -1.2868, 36.7869, false, ARRAY['beauty','skincare','natural','melanin']),
  (v_afrocuts,   'Afrocuts Barbershop', 'afrocuts@vyb.co.ke',   'https://api.dicebear.com/7.x/initials/svg?seed=Afrocuts',    'grooming', 'Premium men''s grooming. Fades, locs, beards & bespoke cuts. Appointment only.',                               'Westlands, Nairobi',  'Waiyaki Way, Nairobi',    -1.2637, 36.8100, true,  ARRAY['grooming','barbershop','mens']),
  (v_luxthread,  'Lux Thread Studio',   'luxthread@vyb.co.ke',  'https://api.dicebear.com/7.x/initials/svg?seed=LuxThread',   'fashion',  'Bespoke tailoring for the modern Nairobian. Suits, traditional wear & contemporary African prints.',            'CBD, Nairobi',        'Kenyatta Ave, Nairobi',   -1.2864, 36.8173, true,  ARRAY['fashion','tailoring','bespoke','suits'])
ON CONFLICT (id) DO NOTHING;

-- ─── CREATOR PROFILES ──────────────────────────────────────────────────────
INSERT INTO creator_profiles (vendor_id, bio, specialty, verified, subscriber_count, total_posts, rating, cover_image)
VALUES
  (v_elitefit,   'Nairobi''s top fitness brand. Helping you build strength, confidence & community since 2018.',  ARRAY['fitness','hiit','strength'],    true,  3420, 48, 4.9, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200'),
  (v_glow,       'Beauty is self-care. Join us for a radiant glow-up journey. 5-star rated, 8 years strong.',    ARRAY['beauty','hair','facials'],       true,  2180, 36, 4.8, 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1200'),
  (v_stylebnk,   'Defining African luxury fashion. Bold prints, clean cuts, timeless pieces. Global audience.',   ARRAY['fashion','style'],               true,  5100, 72, 4.7, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200'),
  (v_zenwell,    'Breathe. Move. Be. Holistic wellness for the modern Nairobian. Karen''s hidden gem.',            ARRAY['wellness','yoga','nutrition'],   false, 890,  24, 4.6, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200'),
  (v_fitqueen,   'Real results for real women. Fitness coach, nutritionist & your biggest cheerleader.',           ARRAY['fitness','nutrition'],           true,  4250, 60, 4.9, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200'),
  (v_natubeauty, 'Clean beauty for melanin magic. Ingredients your skin actually loves. Dermatologist-approved.', ARRAY['beauty','skincare'],             false, 1340, 30, 4.5, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200'),
  (v_afrocuts,   'Barbershop culture elevated. Precision cuts, masterclass grooming. Appointment only.',           ARRAY['grooming','barbershop'],         true,  980,  18, 4.8, 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200'),
  (v_luxthread,  'Every seam tells a story. Bespoke tailoring rooted in African heritage. Ships worldwide.',       ARRAY['fashion','tailoring'],           true,  2200, 42, 4.9, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200')
ON CONFLICT (vendor_id) DO NOTHING;

-- ─── PRODUCTS (24 across categories) ──────────────────────────────────────
-- Categories: fashion, beauty, fitness, wellness, accessories, grooming
INSERT INTO products (id, vendor_id, name, description, price, category, image_url, stock_quantity, is_active)
VALUES
  -- FASHION (7)
  (p1,  v_stylebnk,   'Ankara Blazer — Desert Gold',          'Hand-tailored Ankara blazer. Structured fit. Premium woven fabric from Kumasi markets.',   4500,  'fashion',     'https://images.unsplash.com/photo-1594938298603-c8148c4b4057?w=800', 20,  true),
  (p2,  v_stylebnk,   'Wrap Skirt — Tribal Bloom',            'Bold floral wrap skirt. Versatile length. Machine washable. Sizes XS-XL.',                  2200,  'fashion',     'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800', 35,  true),
  (p18, v_stylebnk,   'Kente Crop Top — Ivory',               'Woven kente crop. Festival & everyday. Adjustable tie back.',                               1800,  'fashion',     'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=800', 45,  true),
  (p19, v_luxthread,  'Bespoke Nairobi Suit — Charcoal',      'Full bespoke suit. 2-week turnaround. Premium wool-blend. Includes 2 fittings.',            28000, 'fashion',     'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', 5,   true),
  (p20, v_luxthread,  'Kitenge Shirt — Modern Fit',           'Contemporary kitenge print shirt. Slim cut. Moisture-wicking lining.',                      2800,  'fashion',     'https://images.unsplash.com/photo-1594938298603-c8148c4b4057?w=800', 30,  true),
  (p21, v_stylebnk,   'Beaded Necklace — Maasai Gold',        'Handcrafted Maasai beadwork. Gold & red. Fair-trade certified artisans.',                   1500,  'accessories', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800', 60,  true),
  (p22, v_luxthread,  'Ankara Print Sneakers',                 'Custom hand-painted sneakers. Ankara fabric finish. Limited run of 50.',                   5500,  'fashion',     'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', 8,   true),
  (p25, v_stylebnk,   'High-Rise Straight Jeans — Indigo',     'Premium stretch denim. High-rise straight leg. Sizes 24–36.',                               4200,  'jeans',       'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800', 35,  true),
  (p26, v_luxthread,  'Tailored Wide-Leg Jeans — Stone Wash',  'Bespoke-fit wide leg. Stone wash finish. Nairobi atelier.',                                5800,  'jeans',       'https://images.unsplash.com/photo-1475178626629-edd718aabd6?w=800', 22,  true),
  -- BEAUTY (6)
  (p3,  v_glow,       'Vitamin C Brightening Serum',          '15% stabilized Vitamin C. Fades dark spots, boosts radiance. 30ml.',                        1800,  'beauty',      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800', 50,  true),
  (p4,  v_natubeauty, 'Shea & Argan Hair Butter',             'Deep conditioning butter for natural hair. No silicones or sulfates. 250g.',                 1200,  'beauty',      'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800', 80,  true),
  (p13, v_natubeauty, 'Black Seed Facial Oil',                'Cold-pressed Nigella Sativa oil. Calms acne, reduces hyperpigmentation. 30ml.',             2100,  'beauty',      'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800', 40,  true),
  (p14, v_glow,       'Korean Glass Skin Kit',                 '4-piece set: toner, essence, moisturiser, SPF50 sunscreen. All skin types.',               5800,  'beauty',      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800', 25,  true),
  (p23, v_natubeauty, 'Turmeric Brightening Mask',            'Kaolin clay + turmeric + rosewater. Brightens & detoxifies. 100g.',                         900,   'beauty',      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800', 100, true),
  (p24, v_glow,       'Scalp Revival Treatment',              'Salicylic acid + peppermint. Clears scalp buildup, reduces dandruff. 150ml.',               1600,  'beauty',      'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800', 55,  true),
  -- FITNESS (4)
  (p5,  v_elitefit,   'Performance Gym Bag — Black',          'Waterproof ripstop. Shoe compartment. Fits all your gym gear. 40L.',                        3200,  'fitness',     'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', 15,  true),
  (p15, v_elitefit,   'Resistance Band Set (5 levels)',       'Latex-free bands: XS to XXL resistance. Comes with carry bag & guide.',                     1600,  'fitness',     'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', 60,  true),
  (p16, v_fitqueen,   'FitQueen Sports Bra — Midnight',       'High-impact support. Moisture-wicking. 4-way stretch. Sizes XS–3XL.',                       2400,  'fitness',     'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', 40,  true),
  (p17, v_elitefit,   'Foam Roller — Deep Tissue',            'High-density foam. 33cm. Trigger point texture. Reduces DOMS by 40%.',                      2800,  'fitness',     'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800', 30,  true),
  -- WELLNESS (4)
  (p6,  v_zenwell,    'Mindfulness Journal — Vyb Edition',    'Guided prompts for daily reflection. Premium linen cover. 90 days.',                         850,   'wellness',    'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800', 100, true),
  (p7,  v_zenwell,    'Organic Herbal Tea — Calm Blend',      'Chamomile, lavender, passionflower. Reduces cortisol. 30 sachets.',                          650,   'wellness',    'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800', 80,  true),
  (p8,  v_zenwell,    'Yoga Block Set (2 pcs)',               'High-density cork. Non-slip. Ideal for all yoga levels.',                                    1200,  'wellness',    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800', 35,  true),
  -- GROOMING (3)
  (p9,  v_afrocuts,   'Afrocuts Beard Oil — Cedarwood',       'Jojoba + argan + cedarwood essential oil. Softens, conditions & adds shine. 50ml.',          1400,  'grooming',   'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800', 70,  true),
  (p10, v_afrocuts,   'Fade Maintenance Kit',                 'Trimmers guide, edge-up razor + 2 premium clipper guards. Barber-grade.',                   3800,  'grooming',   'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800', 20,  true),
  -- ACCESSORIES (2)
  (p11, v_stylebnk,   'Ankara Tote Bag — Limited',            'Handmade Ankara fabric tote. Reinforced handles. Laptop-ready. 15L.',                       2800,  'accessories', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800', 25,  true),
  (p12, v_stylebnk,   'Kiondo Basket Bag',                    'Hand-woven sisal. Traditional Kenyan craft. Leather handles. Limited.',                     3500,  'accessories', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', 18,  true)
ON CONFLICT (id) DO NOTHING;

-- ─── SERVICES ──────────────────────────────────────────────────────────────
INSERT INTO services (id, vendor_id, title, short_description, description, price, category, duration_minutes, is_virtual, is_in_person, cover_image, max_participants, status, bookings_count)
VALUES
  (s1, v_elitefit,   'HIIT Bootcamp — 60 mins',       'High-intensity interval training for all levels.',             'Power-packed 60-minute HIIT session combining strength and cardio. Equipment provided. Suitable for beginners and advanced athletes. Max 15 participants.',  1500, 'fitness',  60,  false, true,  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800', 15, 'active', 142),
  (s2, v_glow,       'Signature Facial Treatment',     'Deep cleanse, exfoliation & hydration boost.',                 'Award-winning 75-minute facial using Korean skincare technology. Includes double cleanse, enzyme peel, jade roller massage & LED therapy. 1 person.',     3500, 'beauty',   75,  false, true,  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800', 1,  'active', 98),
  (s3, v_fitqueen,   'Online PT Session — 45 mins',   'Personalised virtual workout with certified trainer.',          '1-on-1 virtual personal training. Customised program, real-time coaching & weekly check-ins. Perfect for busy professionals.',                             2500, 'fitness',  45,  true,  false, 'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=800', 1,  'active', 210),
  (s4, v_glow,       'Natural Hair Styling',           'Braids, twists, locs & protective styles.',                    'Full natural hair styling service. Consultation included. Choose from knotless braids, Senegalese twists, butterfly locs & more. Products provided.',       4800, 'beauty',   180, false, true,  'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800', 1,  'active', 76),
  (s5, v_zenwell,    'Yoga & Breathwork — Morning',   'Sunrise flow + pranayama for calm and clarity.',               'Grounding 60-minute morning practice blending Vinyasa flow yoga with guided breathwork. Mats provided. Set in our garden studio in Karen.',                  1200, 'wellness', 60,  false, true,  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800', 12, 'active', 88),
  (s6, v_zenwell,    'Nutrition Coaching — 4 weeks',  '4-week personalised nutrition plan & weekly check-ins.',        'Tailored nutrition guidance for your lifestyle goals — weight management, energy, sports performance or gut health. Weekly 30-min video calls + meal plans.', 8500, 'wellness', 30,  true,  false, 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800', 1,  'active', 45),
  (s7, v_afrocuts,   'Signature Fade + Beard',        'Precision skin fade with beard sculpt & hot towel.',           'Full barbershop experience: skin fade, beard sculpt, hot towel shave & edge-up. Takes about 60 mins. Appointment only.',                                       1800, 'grooming', 60,  false, true,  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800', 1,  'active', 320),
  (s8, v_luxthread,  'Bespoke Suit Consultation',     'Full measurement session + fabric selection for your suit.',    '90-min in-studio consultation. We take 22 body measurements, help you select fabric & lining, and design the perfect suit. Deposit required.',                2000, 'fashion',  90,  false, true,  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', 1,  'active', 54)
ON CONFLICT (id) DO NOTHING;

-- ─── FEED POSTS (18 varied types) ─────────────────────────────────────────
INSERT INTO feed_posts (id, vendor_id, type, feed_category, caption, thumbnail_url, product_id, hashtags, engagement_score)
VALUES
  (fp1,  v_stylebnk,   'style_drop',     'style',   'New season, new you. The Ankara Blazer just dropped 🔥 Shop the link in bio.',                                  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',  p1,  ARRAY['#AnkaraFashion','#NairobiStyle','#AfricanFashion'], 92),
  (fp2,  v_elitefit,   'transformation', 'fitness', '6-week transformation done. No excuses, only results 💪 Tag a friend who needs this.',                           'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', NULL,ARRAY['#FitnessGoals','#NairobiGym','#HIIT'],             88),
  (fp3,  v_glow,       'tutorial',       'beauty',  'Glass skin in 3 steps 🌟 Full routine breakdown — save this post! Products linked below.',                       'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800', p3,  ARRAY['#GlassSkin','#SkincareRoutine','#NairobiBeauty'],   95),
  (fp4,  v_fitqueen,   'workout',        'fitness', '20-min no-equipment morning routine. Do this before your coffee ☕ Save for tomorrow!',                           'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', NULL,ARRAY['#MorningWorkout','#HomeWorkout','#FitQueen'],      78),
  (fp5,  v_zenwell,    'tutorial',       'wellness','5 breathing exercises to reduce cortisol and improve focus. Screenshot this 🧘',                                   'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800', NULL,ARRAY['#Wellness','#Breathwork','#MindfulNairobi'],       70),
  (fp6,  v_natubeauty, 'before_after',   'beauty',  '30 days of consistent skincare 🌿 The black seed oil REALLY works. Before/after inside 👀',                      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800', p13, ARRAY['#NaturalBeauty','#BeforeAfter','#SkincareTok'],     85),
  (fp7,  v_afrocuts,   'product',        'style',   'New drop: Beard Oil just landed in store 🧴 Cedarwood + Jojoba. Smells unreal.',                                 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800', p9,  ARRAY['#BeardCare','#MensGrooming','#NairobiBarber'],     74),
  (fp8,  v_luxthread,  'style_drop',     'style',   'The Nairobi Suit collection is here 🕴️ Bespoke, ready in 14 days. DM to book your consultation.',               'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', p19, ARRAY['#BespokeSuits','#AfricanMensFashion','#LuxThread'], 82),
  (fp9,  v_elitefit,   'workout',        'fitness', 'Saturday 7AM bootcamp is BACK 🌅 45 spots only. Link in bio to reserve.',                                         'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800', NULL,ARRAY['#BootCamp','#Westlands','#SaturdaySweat'],         91),
  (fp10, v_glow,       'product',        'beauty',  'Korean Glass Skin Kit is BACK in stock 🇰🇷 Sold out twice already. Grab yours now!',                              'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800', p14, ARRAY['#KoreanSkincare','#GlowUpNairobi','#GlowSalon'],    88),
  (fp11, v_fitqueen,   'transformation', 'fitness', 'Client Wanjiku lost 14kg in 12 weeks 🏆 Pure dedication + my programme. Her words: "life-changing".',             'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=800', NULL,ARRAY['#WeightLoss','#ClientResults','#FitQueen'],        96),
  (fp12, v_zenwell,    'tutorial',       'wellness','Morning yoga sequence for office workers 🧘 5 poses, 10 minutes. Your back will thank you.',                       'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800', NULL,ARRAY['#OfficYoga','#WellnessNairobi','#Karen'],           67),
  (fp13, v_stylebnk,   'style_drop',     'style',   'Kiondo is the new Birkin 🧺 Limited restock. Each bag hand-woven by artisans in Machakos.',                       'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',  p12, ARRAY['#AfricanFashion','#Kiondo','#SupportLocal'],        79),
  (fp14, v_natubeauty, 'tutorial',       'beauty',  'DIY turmeric mask recipe for glowing skin ✨ Save this for Sunday self-care.',                                    'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800',  NULL,ARRAY['#DIYSkincare','#TurmericGlow','#NaturalGlow'],     72),
  (fp15, v_afrocuts,   'product',        'style',   'Edge-up season is here 💈 Book your spot for the weekend. Limited appointments.',                                  'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800', NULL,ARRAY['#Barbershop','#Nairobi','#FadeGod'],               83),
  (fp16, v_elitefit,   'product',        'fitness', 'Resistance band set is here 💪 No gym? No excuse. 5 levels, one bag.',                                             'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', p15, ARRAY['#ResistanceBands','#HomeGym','#EliteFit'],          76),
  (fp17, v_luxthread,  'tutorial',       'style',   'How to care for your Kitenge shirt 🧵 Thread by thread, a guide to African fabric care.',                          'https://images.unsplash.com/photo-1594938298603-c8148c4b4057?w=800', NULL,ARRAY['#AfricanFabric','#Kitenge','#StyleTips'],           61),
  (fp18, v_zenwell,    'product',        'wellness','Calm tea blend is restocked 🍵 Chamomile + lavender + passionflower. 30 sachets for stressful days.',             'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800',  p7,  ARRAY['#WellnessTea','#SelfCare','#ZenWellness'],           58)
ON CONFLICT (id) DO NOTHING;

-- ─── REELS (8 with sample video URLs) ─────────────────────────────────────
INSERT INTO reels (id, vendor_id, caption, video_url, thumbnail_url, product_id, engagement_score)
VALUES
  (r1, v_elitefit,   'Saturday morning HIIT session 🔥 Spot is limited, DM to book.',     'https://videos.pexels.com/video-files/5319747/5319747-sd_640_360_25fps.mp4', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600', p5,  9420),
  (r2, v_glow,       'GRWM: Full glam in 10 minutes using drugstore products 💄',          'https://videos.pexels.com/video-files/6543523/6543523-sd_360_640_25fps.mp4', 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600', p3,  7800),
  (r3, v_stylebnk,   'Nairobi rooftop photoshoot BTS 📸 Full collection now live!',         'https://videos.pexels.com/video-files/2795750/2795750-sd_640_360_25fps.mp4', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', p1,  12100),
  (r4, v_fitqueen,   '30-day abs challenge day 1 💪 Save this for tomorrow morning.',       'https://videos.pexels.com/video-files/4671979/4671979-sd_640_360_25fps.mp4', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600', NULL, 8650),
  (r5, v_natubeauty, 'My 5-step natural skincare routine 🌿 All products in bio.',         'https://videos.pexels.com/video-files/6543584/6543584-sd_360_640_25fps.mp4', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600', p13, 5600),
  (r6, v_zenwell,    'Karen sunrise yoga 🌅 Join us every weekday 6AM.',                   'https://videos.pexels.com/video-files/8480742/8480742-sd_640_360_25fps.mp4', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600', NULL, 4200),
  (r7, v_afrocuts,   'Skin fade timelapse in 60 seconds 💈 Book: afrocuts.co.ke',          'https://videos.pexels.com/video-files/7697073/7697073-sd_640_360_30fps.mp4', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600', p9, 11300),
  (r8, v_luxthread,  'Watch this custom suit come to life in 14 days 🧵',                  'https://videos.pexels.com/video-files/6424127/6424127-sd_640_360_25fps.mp4', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', p19, 6700)
ON CONFLICT (id) DO UPDATE SET
  caption = EXCLUDED.caption,
  video_url = EXCLUDED.video_url,
  thumbnail_url = EXCLUDED.thumbnail_url;

-- ─── LIVE SESSIONS (5: 2 live, 3 upcoming) ────────────────────────────────
INSERT INTO live_sessions (id, vendor_id, title, description, scheduled_for, is_live, cover_url, stream_url, viewer_count)
VALUES
  (l1, v_elitefit,  'Full Body HIIT — Live Burn',         '45-min live HIIT workout. No equipment needed. All levels welcome!',   now() + interval '1 hour',   true,  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200', 'https://www.youtube.com/embed/ml6cT4AZdqI', 143),
  (l2, v_fitqueen,  'FitQueen Live: Booty & Core',        'Live 45-min glutes & core session. Grab your mat!',                    now() + interval '2 hours',  true,  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200', 'https://www.youtube.com/embed/UBMk30rjy0o', 87),
  (l3, v_glow,      'Skincare Masterclass: Know Your Skin','Live Q&A + product demos. Learn your skin type and build your routine.',now() + interval '1 day',   false, 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200', NULL, 0),
  (l4, v_stylebnk,  'SS2026 Collection Drop — Live',      'Be the first to shop the new season. Exclusive live-only discounts!',  now() + interval '3 days',  false, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200', NULL, 0),
  (l5, v_zenwell,   'Guided Meditation + Q&A',            'Live 30-min breathwork & meditation. Bring a journal.',                 now() + interval '5 days',  false, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200', 'https://www.youtube.com/embed/v7AYKMP6rOE', 0)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  cover_url = EXCLUDED.cover_url,
  stream_url = EXCLUDED.stream_url,
  is_live = EXCLUDED.is_live;

-- ─── AVAILABILITY SLOTS (next 2 weeks) ────────────────────────────────────
INSERT INTO availability_slots (vendor_id, service_id, starts_at, ends_at, is_booked)
VALUES
  -- EliteFit HIIT
  (v_elitefit, s1, now() + interval '1 day 7 hours',   now() + interval '1 day 8 hours',    false),
  (v_elitefit, s1, now() + interval '2 days 7 hours',  now() + interval '2 days 8 hours',   false),
  (v_elitefit, s1, now() + interval '3 days 7 hours',  now() + interval '3 days 8 hours',   true),
  (v_elitefit, s1, now() + interval '4 days 7 hours',  now() + interval '4 days 8 hours',   false),
  (v_elitefit, s1, now() + interval '7 days 7 hours',  now() + interval '7 days 8 hours',   false),
  (v_elitefit, s1, now() + interval '9 days 7 hours',  now() + interval '9 days 8 hours',   false),
  -- Glow facial
  (v_glow, s2, now() + interval '1 day 10 hours',  now() + interval '1 day 11 hours 15 minutes', false),
  (v_glow, s2, now() + interval '2 days 10 hours', now() + interval '2 days 11 hours 15 minutes',false),
  (v_glow, s2, now() + interval '3 days 14 hours', now() + interval '3 days 15 hours 15 minutes',true),
  (v_glow, s2, now() + interval '5 days 10 hours', now() + interval '5 days 11 hours 15 minutes',false),
  (v_glow, s2, now() + interval '8 days 10 hours', now() + interval '8 days 11 hours 15 minutes',false),
  -- Glow hair
  (v_glow, s4, now() + interval '1 day 9 hours',  now() + interval '1 day 12 hours',  false),
  (v_glow, s4, now() + interval '3 days 9 hours',  now() + interval '3 days 12 hours', false),
  (v_glow, s4, now() + interval '6 days 9 hours',  now() + interval '6 days 12 hours', true),
  -- FitQueen online PT
  (v_fitqueen, s3, now() + interval '1 day 8 hours',  now() + interval '1 day 8 hours 45 minutes', false),
  (v_fitqueen, s3, now() + interval '2 days 8 hours', now() + interval '2 days 8 hours 45 minutes',false),
  (v_fitqueen, s3, now() + interval '4 days 16 hours',now() + interval '4 days 16 hours 45 minutes',false),
  (v_fitqueen, s3, now() + interval '8 days 8 hours', now() + interval '8 days 8 hours 45 minutes',false),
  -- Zen yoga
  (v_zenwell, s5, now() + interval '1 day 6 hours',  now() + interval '1 day 7 hours',   false),
  (v_zenwell, s5, now() + interval '2 days 6 hours', now() + interval '2 days 7 hours',  false),
  (v_zenwell, s5, now() + interval '3 days 6 hours', now() + interval '3 days 7 hours',  false),
  (v_zenwell, s5, now() + interval '5 days 6 hours', now() + interval '5 days 7 hours',  true),
  -- Afrocuts barber
  (v_afrocuts, s7, now() + interval '1 day 9 hours',  now() + interval '1 day 10 hours', false),
  (v_afrocuts, s7, now() + interval '1 day 11 hours', now() + interval '1 day 12 hours', true),
  (v_afrocuts, s7, now() + interval '2 days 9 hours', now() + interval '2 days 10 hours',false),
  (v_afrocuts, s7, now() + interval '2 days 11 hours',now() + interval '2 days 12 hours',false),
  (v_afrocuts, s7, now() + interval '3 days 9 hours', now() + interval '3 days 10 hours',false),
  -- Lux Thread
  (v_luxthread, s8, now() + interval '2 days 10 hours',now() + interval '2 days 11 hours 30 minutes',false),
  (v_luxthread, s8, now() + interval '4 days 10 hours',now() + interval '4 days 11 hours 30 minutes',false),
  (v_luxthread, s8, now() + interval '7 days 10 hours',now() + interval '7 days 11 hours 30 minutes',false)
ON CONFLICT DO NOTHING;

-- ─── STORIES ───────────────────────────────────────────────────────────────
INSERT INTO stories (vendor_id, media_url, media_type, caption, expires_at)
VALUES
  (v_elitefit,   'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',  'image', 'Morning session was 🔥 Slots still open today!',          now() + interval '20 hours'),
  (v_elitefit,   'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',  'image', 'New resistance bands now in store 💪',                    now() + interval '18 hours'),
  (v_glow,       'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800',  'image', 'New facial just added 💆 Book via the link!',             now() + interval '22 hours'),
  (v_glow,       'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800',     'image', 'Korean Glass Skin Kit is BACK IN STOCK 🇰🇷',             now() + interval '20 hours'),
  (v_stylebnk,   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',     'image', 'SS2026 launch is 3 days away 🔥',                         now() + interval '22 hours'),
  (v_stylebnk,   'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',     'image', 'Kiondo restock — 18 left! 🧺',                           now() + interval '16 hours'),
  (v_fitqueen,   'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=800',  'image', 'Virtual PT now available 📱 DM to book your first session',now() + interval '19 hours'),
  (v_zenwell,    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',     'image', 'Karen 6AM yoga — start your day right 🌅',                now() + interval '21 hours'),
  (v_natubeauty, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800',  'image', 'New: Turmeric Brightening Mask ✨ Limited launch batch!',  now() + interval '23 hours'),
  (v_afrocuts,   'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800',  'image', 'Appointment slots open for this weekend 💈',              now() + interval '17 hours'),
  (v_luxthread,  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',  'image', 'New bespoke consultation slots — book via profile 🕴️',   now() + interval '20 hours')
ON CONFLICT DO NOTHING;

-- ─── TRENDING TOPICS ───────────────────────────────────────────────────────
INSERT INTO trending_topics (id, title, category, score, cover_url)
VALUES
  (t1, '#GlowUp2026 — Natural beauty is trending',             'beauty',  95, 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800'),
  (t2, 'Morning HIIT Revolution hits Nairobi',                 'fitness', 88, 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800'),
  (t3, 'Ankara Street Style: A Visual Manifesto',              'fashion', 82, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'),
  (t4, 'Gut Health & Wellness: The 2026 Guide',                'wellness',75, 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800'),
  (t5, 'The Fade Culture: Nairobi Barbershop Scene',           'grooming',68, 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800'),
  (t6, 'Bespoke is Back: African Tailoring Renaissance',       'fashion', 71, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800')
ON CONFLICT (id) DO NOTHING;

-- ─── CHALLENGES ────────────────────────────────────────────────────────────
INSERT INTO challenges (id, title, description, category, start_date, end_date, participant_count, cover_url)
VALUES
  (ch1, '30-Day Glow Challenge',    'Daily skincare routine for 30 days. Post your before & after.',    'beauty',  now(),                    now() + interval '30 days', 1240, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800'),
  (ch2, 'Nairobi Fit Week',         '7 days of daily workouts. Complete all 7 to earn your badge.',     'fitness', now(),                    now() + interval '7 days',  3560, 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800'),
  (ch3, 'Style Your Roots',         'Wear African-inspired fashion for 5 days. Share your looks.',      'fashion', now() + interval '3 days',now() + interval '33 days', 890,  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'),
  (ch4, 'Wellness September',       '21-day wellness journey: move, eat well, reflect daily.',          'wellness',now() - interval '5 days',now() + interval '16 days', 2100, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800')
ON CONFLICT (id) DO NOTHING;

-- ─── STAFF MEMBERS ─────────────────────────────────────────────────────────
INSERT INTO staff_members (id, vendor_id, name, role, avatar_url, is_active)
VALUES
  (st1, v_elitefit,  'Brian Kamau',    'Head Trainer',       'https://api.dicebear.com/7.x/initials/svg?seed=BrianKamau',    true),
  (st2, v_elitefit,  'Faith Wanjiku',  'Nutrition Coach',    'https://api.dicebear.com/7.x/initials/svg?seed=FaithWanjiku',  true),
  (st3, v_glow,      'Aisha Mohammed', 'Senior Stylist',     'https://api.dicebear.com/7.x/initials/svg?seed=AishaMohammed', true),
  (st4, v_glow,      'Lilian Otieno',  'Facial Specialist',  'https://api.dicebear.com/7.x/initials/svg?seed=LilianOtieno',  true)
ON CONFLICT (id) DO NOTHING;

-- ─── MEMBERSHIP TIERS ──────────────────────────────────────────────────────
INSERT INTO membership_tiers (id, vendor_id, name, price, currency, billing_period, perks, is_active)
VALUES
  (mt1, v_elitefit, 'Fan',        500,  'KES', 'monthly', ARRAY['Early access to session bookings','Monthly workout plan PDF','Members-only feed updates'],            true),
  (mt2, v_elitefit, 'Pro Member', 1500, 'KES', 'monthly', ARRAY['Unlimited class bookings','1 virtual PT per month','Exclusive live sessions','Merch discounts 20%'],   true),
  (mt3, v_glow,     'Glow Club',  800,  'KES', 'monthly', ARRAY['10% off all treatments','Priority booking','Members-only product launches','Monthly skincare box'],    true)
ON CONFLICT (id) DO NOTHING;

-- ─── AFFILIATE LINKS ───────────────────────────────────────────────────────
INSERT INTO affiliate_links (id, vendor_id, code, commission_pct, description, clicks, conversions, is_active)
VALUES
  (aff1, v_elitefit,   'ELITEFIT20',   15, 'EliteFit referral programme — earn 15% on each booking.',    340, 28, true),
  (aff2, v_glow,       'GLOWSALON10',  10, 'Glow Salon referral — 10% on each treatment booked.',        210, 19, true),
  (aff3, v_stylebnk,   'STYLEBNK15',   15, 'Style Bank — earn 15% on fashion & accessories sales.',       560, 44, true),
  (aff4, v_fitqueen,   'FITQUEEN25',   20, 'FitQueen referral — earn 20% on all online PT bookings.',     180, 15, true)
ON CONFLICT (id) DO NOTHING;

-- ─── AD CAMPAIGNS ──────────────────────────────────────────────────────────
INSERT INTO ad_campaigns (id, vendor_id, product_id, title, headline, description, image_url, cta_text, cta_url, target_categories, target_location, daily_budget, total_budget, bid_amount, start_at, end_at, status, total_impressions, total_clicks)
VALUES
  (ad1, v_stylebnk, p1,  'Ankara Blazer Launch',     'New Season Ankara is HERE',    'Desert Gold blazer — limited stock. Hand-tailored.',         'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 'Shop Now',  '/shop?category=fashion', ARRAY['fashion','style'],          'Nairobi', 2000, 40000,  25, now() - interval '5 days', now() + interval '25 days', 'live', 8420,  312),
  (ad2, v_elitefit, NULL,'HIIT Bootcamp Promo',       'Burn Calories, Build Community','45-min HIIT. All levels. First session FREE.',               'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800','Book Free', '/services',              ARRAY['fitness','wellness'],       'Nairobi', 1500, 30000,  20, now() - interval '3 days', now() + interval '27 days', 'live', 5600,  198),
  (ad3, v_glow,     p14, 'Glass Skin Kit Flash Sale', 'Korean Skincare — 20% Off',    'Limited stock. All 4 steps for glass skin.',                 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800','Shop Sale', '/shop?category=beauty',  ARRAY['beauty'],                   'Nairobi', 1000, 15000,  15, now() - interval '1 day',  now() + interval '7 days',  'live', 3200,  145)
ON CONFLICT (id) DO NOTHING;

-- ─── PLATFORM SUBSCRIPTIONS (vendor@test.com → EliteFit Pro trial) ───────────
-- Prefer trialing so dashboard shows the free-trial banner; skip overwrite if already paid active.
INSERT INTO platform_subscriptions (
  vendor_id, user_id, tier, status, price_kes, payment_method,
  ad_credits_remaining, current_period_start, current_period_end, trial_ends_at
)
SELECT
  v_elitefit,
  u.id,
  'pro',
  'trialing',
  0,
  NULL,
  2500,
  now(),
  now() + interval '30 days',
  now() + interval '30 days'
FROM auth.users u
WHERE u.email = 'vendor@test.com'
ON CONFLICT (vendor_id) DO UPDATE SET
  tier = EXCLUDED.tier,
  status = EXCLUDED.status,
  price_kes = EXCLUDED.price_kes,
  user_id = EXCLUDED.user_id,
  ad_credits_remaining = EXCLUDED.ad_credits_remaining,
  current_period_start = EXCLUDED.current_period_start,
  current_period_end = EXCLUDED.current_period_end,
  trial_ends_at = EXCLUDED.trial_ends_at
WHERE platform_subscriptions.status IS DISTINCT FROM 'active'
   OR platform_subscriptions.payment_method IS NULL;

-- ─── NOTIFICATIONS & BOOKINGS (demo user — requires auth.users) ─────────────
IF demo_user IS NOT NULL THEN
  INSERT INTO notifications (user_id, type, title, message, image_url, link_url, is_read)
  VALUES
    (demo_user, 'new_follower',  'EliteFit is now following you!',        'EliteFit Gym started following your activity.',                      'https://api.dicebear.com/7.x/initials/svg?seed=EliteFit',    '/creator/a1000000-0000-0000-0000-000000000001', false),
    (demo_user, 'booking',       'Booking confirmed: HIIT Bootcamp',       'Your HIIT session is confirmed for tomorrow at 7AM.',               'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800', '/bookings', false),
    (demo_user, 'live_starting', 'EliteFit is going LIVE in 30 minutes',   'Full Body HIIT live session starts at 7PM. Set a reminder!',       'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', '/live',     true),
    (demo_user, 'product_drop',  'New Style Bank drop is here!',            'The Ankara Blazer collection just launched. Shop before it sells out.','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800','/shop',     true)
  ON CONFLICT DO NOTHING;

  INSERT INTO bookings (vendor_id, user_id, service_id, total_amount, status, payment_status, notes, participants)
  VALUES
    (v_elitefit, demo_user, s1, 1500, 'confirmed',  'paid',    'Saturday 7AM bootcamp. Bring water.', 1),
    (v_glow,     demo_user, s2, 3500, 'completed',  'paid',    'Amazing facial, skin is glowing!', 1),
    (v_fitqueen, demo_user, s3, 2500, 'pending',    'pending', 'First virtual PT session.', 1)
  ON CONFLICT DO NOTHING;
END IF;

END $$;
