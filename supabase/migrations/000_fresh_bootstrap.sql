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
