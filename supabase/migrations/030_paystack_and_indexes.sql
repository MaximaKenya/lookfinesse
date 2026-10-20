-- 030 — Paystack references, ledger indexes, streak points, RLS where policies exist.
-- Idempotent. Does not enable RLS on tables that have no policies.

ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_ref text;

CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_ref_unique
  ON payments (provider_ref)
  WHERE provider_ref IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_status_created
  ON payments (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_provider
  ON payments (provider);

ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ledger_entries' AND column_name = 'payment_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_ledger_payment_category
      ON ledger_entries (payment_id, category);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders (user_id, created_at DESC);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'feed_posts' AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON feed_posts (created_at DESC);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_products_created ON products (created_at DESC);
  END IF;
END $$;

-- Turn RLS on only for public tables that already have at least one policy.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname AS tbl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity = false
      AND EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.schemaname = 'public' AND p.tablename = c.relname
      )
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tbl);
  END LOOP;
END $$;
