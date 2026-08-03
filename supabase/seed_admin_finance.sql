-- ═══════════════════════════════════════════════════════════════════════════
-- LookFinesse — Platform admin finance seed (non-zero /admin/finance KPIs)
-- Run AFTER: seed_demo_metrics.sql on the SAME Supabase project as Heroku env
-- Safe to re-run (ON CONFLICT / existence guards)
-- Creates treasury tables if missing (not in 000_fresh_bootstrap)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── TREASURY TABLES (idempotent) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS treasury_accounts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  currency   text NOT NULL DEFAULT 'KES',
  balance    numeric NOT NULL DEFAULT 0,
  account_type text DEFAULT 'operating',
  metadata   jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS liquidity_pools (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  currency   text NOT NULL DEFAULT 'KES',
  balance    numeric NOT NULL DEFAULT 0,
  target_balance numeric DEFAULT 0,
  status     text DEFAULT 'active',
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payout_forecasts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency   text NOT NULL DEFAULT 'KES',
  forecast_amount numeric NOT NULL DEFAULT 0,
  horizon_days integer DEFAULT 7,
  confidence numeric DEFAULT 0.8,
  metadata   jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

DO $$
DECLARE
  v_elitefit uuid := 'a1000000-0000-0000-0000-000000000001';
  v_glow     uuid := 'a1000000-0000-0000-0000-000000000002';

  o1 uuid := '18000000-0000-4000-8000-000000000001';
  o2 uuid := '18000000-0000-4000-8000-000000000002';
  o3 uuid := '18000000-0000-4000-8000-000000000003';
  o4 uuid := '18000000-0000-4000-8000-000000000004';
  o6 uuid := '18000000-0000-4000-8000-000000000006';

  fee1 uuid := '1c000000-0000-4000-8000-000000000001';
  fee2 uuid := '1c000000-0000-4000-8000-000000000002';
  fee3 uuid := '1c000000-0000-4000-8000-000000000003';
  fee4 uuid := '1c000000-0000-4000-8000-000000000004';
  fee5 uuid := '1c000000-0000-4000-8000-000000000005';
  fee6 uuid := '1c000000-0000-4000-8000-000000000006';

  po4 uuid := '1b000000-0000-4000-8000-000000000004';
  po5 uuid := '1b000000-0000-4000-8000-000000000005';

  ta_kes uuid := '1d000000-0000-4000-8000-000000000001';
  ta_usd uuid := '1d000000-0000-4000-8000-000000000002';
  ta_esc uuid := '1d000000-0000-4000-8000-000000000003';

  lp1 uuid := '1e000000-0000-4000-8000-000000000001';
  lp2 uuid := '1e000000-0000-4000-8000-000000000002';

  pf1 uuid := '1f000000-0000-4000-8000-000000000001';
  pf2 uuid := '1f000000-0000-4000-8000-000000000002';

  fl1 uuid := '20000000-0000-4000-8000-000000000001';
  fl2 uuid := '20000000-0000-4000-8000-000000000002';
  fl3 uuid := '20000000-0000-4000-8000-000000000003';

  fe1 uuid := '20100000-0000-4000-8000-000000000001';

  vendor_exists boolean;
BEGIN

SELECT EXISTS(SELECT 1 FROM vendors WHERE id = v_elitefit) INTO vendor_exists;
IF NOT vendor_exists THEN
  RAISE NOTICE 'seed_admin_finance: EliteFit vendor missing — run seed.sql + seed_demo_metrics.sql first';
  RETURN;
END IF;

-- ─── PLATFORM FEE LEDGER (category=fee — /admin/finance revenue KPI) ───────
-- ~10% platform take on demo sales
INSERT INTO ledger_entries (id, vendor_id, order_id, type, amount, category, description, status, balance_after, created_at)
VALUES
  (fee1, v_elitefit, o1, 'credit', 480,  'fee', 'Platform fee 10% — order o1', 'completed', NULL, now() - interval '1 day'),
  (fee2, v_elitefit, o2, 'credit', 320,  'fee', 'Platform fee 10% — order o2', 'completed', NULL, now() - interval '2 days'),
  (fee3, v_elitefit, o3, 'credit', 560,  'fee', 'Platform fee 10% — order o3', 'completed', NULL, now() - interval '3 days'),
  (fee4, v_elitefit, o4, 'credit', 160,  'fee', 'Platform fee 10% — order o4', 'completed', NULL, now() - interval '5 days'),
  (fee5, v_elitefit, o6, 'credit', 280,  'fee', 'Platform fee 10% — order o6', 'completed', NULL, now() - interval '8 days'),
  (fee6, v_glow,     NULL,'credit', 1250, 'fee', 'Platform fee — Glow salon bookings', 'completed', NULL, now() - interval '12 hours')
ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount,
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  description = EXCLUDED.description;

-- ─── EXTRA PAYOUTS (pending + completed for admin queue) ────────────────────
INSERT INTO payouts (id, vendor_id, amount, status, method, phone, reference, created_at)
VALUES
  (po4, v_glow, 9200,  'pending',   'mpesa', '254700111222', 'LF-PO-ADMIN-004', now() - interval '6 hours'),
  (po5, v_glow, 4500,  'completed', 'mpesa', '254700111222', 'LF-PO-ADMIN-005', now() - interval '3 days')
ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount,
  status = EXCLUDED.status;

INSERT INTO payout_queue (vendor_id, amount, status, priority, created_at)
SELECT v_glow, 9200, 'queued', 2, now() - interval '6 hours'
WHERE NOT EXISTS (
  SELECT 1 FROM payout_queue
  WHERE vendor_id = v_glow AND amount = 9200 AND status = 'queued'
);

-- ─── TREASURY ACCOUNTS (non-zero balances) ──────────────────────────────────
INSERT INTO treasury_accounts (id, name, currency, balance, account_type, updated_at)
VALUES
  (ta_kes, 'KES Operating', 'KES', 2450000, 'operating', now()),
  (ta_usd, 'USD Settlement', 'USD', 18500,   'settlement', now()),
  (ta_esc, 'KES Escrow Pool', 'KES', 412000, 'escrow', now())
ON CONFLICT (id) DO UPDATE SET
  balance = EXCLUDED.balance,
  name = EXCLUDED.name,
  updated_at = now();

INSERT INTO liquidity_pools (id, name, currency, balance, target_balance, status, updated_at)
VALUES
  (lp1, 'M-Pesa Float', 'KES', 890000, 1000000, 'active', now()),
  (lp2, 'Card Settlement Buffer', 'KES', 320000, 500000, 'active', now())
ON CONFLICT (id) DO UPDATE SET
  balance = EXCLUDED.balance,
  target_balance = EXCLUDED.target_balance,
  updated_at = now();

INSERT INTO payout_forecasts (id, currency, forecast_amount, horizon_days, confidence, metadata, created_at)
VALUES
  (pf1, 'KES', 185000, 7, 0.86, '{"source":"seed_admin_finance"}'::jsonb, now()),
  (pf2, 'KES', 420000, 30, 0.72, '{"source":"seed_admin_finance"}'::jsonb, now() - interval '1 hour')
ON CONFLICT (id) DO UPDATE SET
  forecast_amount = EXCLUDED.forecast_amount,
  confidence = EXCLUDED.confidence;

-- ─── FRAUD TELEMETRY ────────────────────────────────────────────────────────
INSERT INTO fraud_logs (id, vendor_id, event_type, metadata, created_at)
VALUES
  (fl1, v_elitefit, 'velocity_spike',
   '{"reason":"High payout velocity","amount":15000}'::jsonb, now() - interval '2 days'),
  (fl2, v_glow, 'geo_anomaly',
   '{"reason":"Geo velocity flag — Nairobi→Mombasa","amount":9200}'::jsonb, now() - interval '18 hours'),
  (fl3, v_elitefit, 'device_switch',
   '{"reason":"New device on high-value order","amount":5600}'::jsonb, now() - interval '5 hours')
ON CONFLICT (id) DO UPDATE SET
  event_type = EXCLUDED.event_type,
  metadata = EXCLUDED.metadata;

INSERT INTO fraud_events (id, vendor_id, event_type, severity, metadata, created_at)
VALUES
  (fe1, v_glow, 'aml_review', 'MEDIUM',
   '{"reason":"AML threshold review","amount":9200}'::jsonb, now() - interval '1 day')
ON CONFLICT (id) DO UPDATE SET
  event_type = EXCLUDED.event_type,
  severity = EXCLUDED.severity,
  metadata = EXCLUDED.metadata;

-- Financial events stream (admin control center)
INSERT INTO financial_events (event_type, entity_type, entity_id, amount, metadata, created_at)
SELECT 'platform_fee', 'ledger', fee1, 480, '{"source":"seed_admin_finance"}'::jsonb, now() - interval '1 day'
WHERE NOT EXISTS (
  SELECT 1 FROM financial_events
  WHERE event_type = 'platform_fee' AND entity_id = fee1
);

RAISE NOTICE 'seed_admin_finance: fees=% fees total expected ~3050 KES, treasury + payouts + fraud seeded',
  (SELECT count(*) FROM ledger_entries WHERE category = 'fee' AND id IN (fee1,fee2,fee3,fee4,fee5,fee6));

END $$;
