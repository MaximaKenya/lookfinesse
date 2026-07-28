-- Creator commerce columns for attach flows
-- Run after migrations 001-007

ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS audio_url text;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS video_url text;

ALTER TABLE reels ADD COLUMN IF NOT EXISTS service_id uuid;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS hashtags text[] DEFAULT '{}';
ALTER TABLE reels ADD COLUMN IF NOT EXISTS category text;

ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS product_ids uuid[] DEFAULT '{}';

ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS post_id uuid;
ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS service_id uuid;

CREATE INDEX IF NOT EXISTS idx_reels_service ON reels(service_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_post ON ad_campaigns(post_id);
