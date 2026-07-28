-- ═══════════════════════════════════════════════════════════════════════════
-- VYB MARKETPLACE — Row Level Security Policies (Migration 006)
-- Run AFTER migrations 001-005 and seed.sql
-- NOTE: Uses anon key for public reads; service_role for admin writes
-- ═══════════════════════════════════════════════════════════════════════════

-- Ensure 001 social tables exist (001 may have failed before collections)
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

-- ─── Enable RLS on core tables ───────────────────────────────────────────────
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

-- ─── VENDORS ─────────────────────────────────────────────────────────────────
-- Public read; only the owning user can write their vendor row
DROP POLICY IF EXISTS "vendors_public_read"  ON vendors;
DROP POLICY IF EXISTS "vendors_owner_update" ON vendors;

CREATE POLICY "vendors_public_read"
  ON vendors FOR SELECT USING (true);

CREATE POLICY "vendors_owner_update"
  ON vendors FOR UPDATE
  USING (auth.uid() = user_id);

-- ─── FEED POSTS ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "feed_posts_public_read"   ON feed_posts;
DROP POLICY IF EXISTS "feed_posts_vendor_insert" ON feed_posts;
DROP POLICY IF EXISTS "feed_posts_vendor_update" ON feed_posts;

CREATE POLICY "feed_posts_public_read"
  ON feed_posts FOR SELECT USING (true);

CREATE POLICY "feed_posts_vendor_insert"
  ON feed_posts FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM vendors WHERE vendors.id = feed_posts.vendor_id AND vendors.user_id = auth.uid())
  );

CREATE POLICY "feed_posts_vendor_update"
  ON feed_posts FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM vendors WHERE vendors.id = feed_posts.vendor_id AND vendors.user_id = auth.uid())
  );

-- ─── REELS ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "reels_public_read"   ON reels;
DROP POLICY IF EXISTS "reels_vendor_write"  ON reels;

CREATE POLICY "reels_public_read"  ON reels FOR SELECT USING (true);
CREATE POLICY "reels_vendor_write" ON reels FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM vendors WHERE vendors.id = reels.vendor_id AND vendors.user_id = auth.uid())
  );

-- ─── SERVICES ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "services_public_read"   ON services;
DROP POLICY IF EXISTS "services_vendor_write"  ON services;

CREATE POLICY "services_public_read"  ON services FOR SELECT USING (status = 'active');
CREATE POLICY "services_vendor_write" ON services FOR ALL
  USING (
    EXISTS (SELECT 1 FROM vendors WHERE vendors.id = services.vendor_id AND vendors.user_id = auth.uid())
  );

-- ─── SAVED POSTS ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "saved_own_read"   ON saved_posts;
DROP POLICY IF EXISTS "saved_own_write"  ON saved_posts;

CREATE POLICY "saved_own_read"  ON saved_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_own_write" ON saved_posts FOR ALL   USING (auth.uid() = user_id);

-- ─── FOLLOWS ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "follows_public_read"  ON follows;
DROP POLICY IF EXISTS "follows_own_write"    ON follows;

CREATE POLICY "follows_public_read" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_own_write"   ON follows FOR ALL   USING (auth.uid() = follower_id);

-- ─── REACTIONS ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "reactions_public_read" ON post_reactions;
DROP POLICY IF EXISTS "reactions_own_write"   ON post_reactions;

CREATE POLICY "reactions_public_read" ON post_reactions FOR SELECT USING (true);
CREATE POLICY "reactions_own_write"   ON post_reactions FOR ALL   USING (auth.uid() = user_id);

-- ─── COMMENTS ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "comments_public_read" ON post_comments;
DROP POLICY IF EXISTS "comments_own_write"   ON post_comments;

CREATE POLICY "comments_public_read" ON post_comments FOR SELECT USING (true);
CREATE POLICY "comments_own_write"   ON post_comments FOR ALL   USING (auth.uid() = user_id);

-- ─── BOOKINGS ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "bookings_own_read"   ON bookings;
DROP POLICY IF EXISTS "bookings_vendor_read"ON bookings;
DROP POLICY IF EXISTS "bookings_user_insert"ON bookings;

CREATE POLICY "bookings_own_read"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "bookings_vendor_read"
  ON bookings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM vendors WHERE vendors.id = bookings.vendor_id AND vendors.user_id = auth.uid())
  );

CREATE POLICY "bookings_user_insert"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─── COLLECTIONS ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "collections_own_read"  ON collections;
DROP POLICY IF EXISTS "collections_own_write" ON collections;

CREATE POLICY "collections_own_read"  ON collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "collections_own_write" ON collections FOR ALL   USING (auth.uid() = user_id);

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "notifications_own_read"   ON notifications;
DROP POLICY IF EXISTS "notifications_own_update" ON notifications;

CREATE POLICY "notifications_own_read"   ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_own_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);
