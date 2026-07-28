-- ⚠️ Do NOT run on an empty DB — run 000_fresh_bootstrap.sql first.
-- Social Commerce Layer — Phase 2-5 tables
-- Run in Supabase SQL editor ONLY on legacy projects that already have feed_posts, vendors, etc.

-- Feed post types expansion
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS feed_category text DEFAULT 'discover';
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS hashtags text[] DEFAULT '{}';
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS service_id uuid;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS engagement_score numeric DEFAULT 0;

-- Reactions (multi-type, not just likes)
CREATE TABLE IF NOT EXISTS post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid REFERENCES feed_posts(id) ON DELETE CASCADE,
  reel_id uuid REFERENCES reels(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN (
    'fire', 'motivating', 'love', 'inspiring', 'want_this', 'need_this'
  )),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id, reaction_type),
  UNIQUE(user_id, reel_id, reaction_type)
);

-- Comments
CREATE TABLE IF NOT EXISTS post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid REFERENCES feed_posts(id) ON DELETE CASCADE,
  reel_id uuid REFERENCES reels(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Saved posts + collections (Pinterest-style)
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
  post_id uuid REFERENCES feed_posts(id) ON DELETE CASCADE,
  reel_id uuid REFERENCES reels(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES collections(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, reel_id)
);

-- Follow graph
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, vendor_id)
);

-- Notifications
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

-- Creator profiles
CREATE TABLE IF NOT EXISTS creator_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL UNIQUE,
  bio text,
  specialty text[] DEFAULT '{}',
  verified boolean DEFAULT false,
  subscriber_count integer DEFAULT 0,
  total_posts integer DEFAULT 0,
  rating numeric DEFAULT 0,
  cover_image text,
  social_links jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Availability & staff
CREATE TABLE IF NOT EXISTS staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  name text NOT NULL,
  role text,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS availability_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  service_id uuid,
  staff_member_id uuid REFERENCES staff_members(id),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  is_booked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Legacy installs may have availability_slots without starts_at/ends_at
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

-- Hashtags & trending
CREATE TABLE IF NOT EXISTS hashtags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag text NOT NULL UNIQUE,
  post_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trending_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  score numeric DEFAULT 0,
  cover_url text,
  created_at timestamptz DEFAULT now()
);

-- Gamification
CREATE TABLE IF NOT EXISTS user_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_active_date date,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_type text NOT NULL,
  title text NOT NULL,
  description text,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  start_date timestamptz,
  end_date timestamptz,
  cover_url text,
  participant_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  progress numeric DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Interest graph (if not exists)
CREATE TABLE IF NOT EXISTS user_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  score numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category)
);

CREATE TABLE IF NOT EXISTS user_behavior_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  event_type text NOT NULL,
  watch_time integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feed_posts_category ON feed_posts(feed_category);
CREATE INDEX IF NOT EXISTS idx_feed_posts_vendor ON feed_posts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_vendor ON follows(vendor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_availability_vendor ON availability_slots(vendor_id, starts_at);
