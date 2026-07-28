-- Platform vendor subscriptions + ad campaign status revamp
-- Run after migrations 001-008

-- ─── Platform subscriptions (vendors/creators → LookFinesse) ────────────────
CREATE TABLE IF NOT EXISTS platform_subscriptions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id             uuid NOT NULL,
  user_id               uuid NOT NULL,
  tier                  text NOT NULL CHECK (tier IN ('starter', 'pro', 'elite')),
  status                text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'active', 'cancelled', 'expired', 'past_due')),
  price_kes             numeric(12,2) NOT NULL,
  payment_method        text CHECK (payment_method IN ('stripe', 'mpesa', 'wallet')),
  payment_ref           text,
  stripe_subscription_id text,
  stripe_customer_id    text,
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  UNIQUE(vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_platform_subs_vendor ON platform_subscriptions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_platform_subs_status ON platform_subscriptions(status);

-- ─── Ad campaigns: expanded status lifecycle ────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ad_campaigns'
  ) THEN
    ALTER TABLE ad_campaigns DROP CONSTRAINT IF EXISTS ad_campaigns_status_check;
    ALTER TABLE ad_campaigns ADD CONSTRAINT ad_campaigns_status_check
      CHECK (status IN (
        'draft', 'pending_payment', 'live', 'active',
        'paused', 'completed', 'rejected', 'pending'
      ));
    ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';
    UPDATE ad_campaigns SET status = 'live' WHERE status = 'active';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payments'
  ) THEN
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
  END IF;
END $$;
