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
