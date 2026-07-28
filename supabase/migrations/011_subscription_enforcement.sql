-- Subscription enforcement columns (no orders.vendor_id — use order_items join)

ALTER TABLE feed_posts
  ADD COLUMN IF NOT EXISTS required_fan_tier text;

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

ALTER TABLE platform_subscriptions
  ADD COLUMN IF NOT EXISTS ad_credits_remaining numeric(12,2) DEFAULT 0;

COMMENT ON COLUMN feed_posts.required_fan_tier IS 'Enforced: minimum fan tier to view post (supporter|insider|vip)';
COMMENT ON COLUMN platform_subscriptions.ad_credits_remaining IS 'Enforced: monthly ad credit wallet balance (KES)';
