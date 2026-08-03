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
