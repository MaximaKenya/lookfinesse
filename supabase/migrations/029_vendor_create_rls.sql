-- Migration 029: Vendor create/manage RLS
-- Products had no RLS (anon API inserts) while services/feed/reels require auth.uid().
-- Create APIs now use the cookie-bound server client; these policies let a vendor
-- insert/update their own catalog and store. Idempotent.

-- ─── products ───────────────────────────────────────────────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_public_read" ON products;
DROP POLICY IF EXISTS "products_vendor_insert" ON products;
DROP POLICY IF EXISTS "products_vendor_update" ON products;
DROP POLICY IF EXISTS "products_vendor_delete" ON products;

CREATE POLICY "products_public_read"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "products_vendor_insert"
  ON products FOR INSERT
  WITH CHECK (
    (
      vendor_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM vendors v
        WHERE v.id = products.vendor_id AND v.user_id = auth.uid()
      )
    )
    OR (
      store_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM stores s
        WHERE s.id = products.store_id AND s.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "products_vendor_update"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = products.vendor_id AND v.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM stores s
      WHERE s.id = products.store_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "products_vendor_delete"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = products.vendor_id AND v.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM stores s
      WHERE s.id = products.store_id AND s.user_id = auth.uid()
    )
  );

-- ─── stores ─────────────────────────────────────────────────────────────────
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stores_public_read" ON stores;
DROP POLICY IF EXISTS "stores_own_insert" ON stores;
DROP POLICY IF EXISTS "stores_own_update" ON stores;
DROP POLICY IF EXISTS "stores_own_delete" ON stores;

CREATE POLICY "stores_public_read"
  ON stores FOR SELECT
  USING (true);

CREATE POLICY "stores_own_insert"
  ON stores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stores_own_update"
  ON stores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "stores_own_delete"
  ON stores FOR DELETE
  USING (auth.uid() = user_id);

-- ─── availability slots (bookable services) ─────────────────────────────────
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "availability_public_read" ON availability_slots;
DROP POLICY IF EXISTS "availability_vendor_write" ON availability_slots;

CREATE POLICY "availability_public_read"
  ON availability_slots FOR SELECT
  USING (true);

CREATE POLICY "availability_vendor_write"
  ON availability_slots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = availability_slots.vendor_id AND v.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = availability_slots.vendor_id AND v.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "products_vendor_insert" ON products IS
  'Vendor may insert products for their vendors/stores row (cookie session).';
