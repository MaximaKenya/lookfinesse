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
