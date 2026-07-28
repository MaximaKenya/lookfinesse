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
