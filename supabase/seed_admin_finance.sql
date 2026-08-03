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

-- ─── FX / COMPLIANCE / NETWORK / KYC TABLES (idempotent) ────────────────────
CREATE TABLE IF NOT EXISTS fx_rates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair            text NOT NULL UNIQUE,
  rate            numeric NOT NULL,
  base_currency   text NOT NULL,
  quote_currency  text NOT NULL,
  updated_at      timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fx_conversions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount            numeric NOT NULL,
  from_currency     text NOT NULL,
  to_currency       text NOT NULL,
  rate              numeric NOT NULL,
  converted_amount  numeric NOT NULL,
  actor_id          uuid,
  metadata          jsonb DEFAULT '{}'::jsonb,
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS aml_alerts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id    uuid,
  alert_type   text NOT NULL,
  severity     numeric NOT NULL DEFAULT 5,
  description  text,
  status       text DEFAULT 'open',
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compliance_audit_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action       text NOT NULL,
  actor_id     uuid,
  entity_type  text,
  entity_id    uuid,
  metadata     jsonb DEFAULT '{}'::jsonb,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settlement_batches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_amount  numeric NOT NULL DEFAULT 0,
  payout_count  integer NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'PENDING',
  rail          text DEFAULT 'mpesa',
  currency      text DEFAULT 'KES',
  metadata      jsonb DEFAULT '{}'::jsonb,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kyc_verifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid,
  document_url  text,
  status        text DEFAULT 'pending',
  tier          text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
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
  fe2 uuid := '20100000-0000-4000-8000-000000000002';

  fx1 uuid := '21000000-0000-4000-8000-000000000001';
  fx2 uuid := '21000000-0000-4000-8000-000000000002';
  fx3 uuid := '21000000-0000-4000-8000-000000000003';
  fx4 uuid := '21000000-0000-4000-8000-000000000004';
  fx5 uuid := '21000000-0000-4000-8000-000000000005';

  fxc1 uuid := '21100000-0000-4000-8000-000000000001';
  fxc2 uuid := '21100000-0000-4000-8000-000000000002';
  fxc3 uuid := '21100000-0000-4000-8000-000000000003';

  aml1 uuid := '22000000-0000-4000-8000-000000000001';
  aml2 uuid := '22000000-0000-4000-8000-000000000002';
  aml3 uuid := '22000000-0000-4000-8000-000000000003';

  cal1 uuid := '22100000-0000-4000-8000-000000000001';
  cal2 uuid := '22100000-0000-4000-8000-000000000002';

  sb1 uuid := '23000000-0000-4000-8000-000000000001';
  sb2 uuid := '23000000-0000-4000-8000-000000000002';
  sb3 uuid := '23000000-0000-4000-8000-000000000003';

  kyc1 uuid := '24000000-0000-4000-8000-000000000001';
  kyc2 uuid := '24000000-0000-4000-8000-000000000002';

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
   '{"reason":"AML threshold review","amount":9200}'::jsonb, now() - interval '1 day'),
  (fe2, v_elitefit, 'velocity_spike', 'HIGH',
   '{"reason":"Repeated high-value payout attempts","amount":15000}'::jsonb, now() - interval '4 hours')
ON CONFLICT (id) DO UPDATE SET
  event_type = EXCLUDED.event_type,
  severity = EXCLUDED.severity,
  metadata = EXCLUDED.metadata;

-- ─── VENDOR RISK (Glow + EliteFit for risk dashboard) ───────────────────────
INSERT INTO vendor_risk_scores (vendor_id, risk_score, trust_tier, is_frozen, last_updated)
VALUES
  (v_elitefit, 18, 'TRUSTED', false, now()),
  (v_glow, 62, 'WATCH', false, now())
ON CONFLICT (vendor_id) DO UPDATE SET
  risk_score = EXCLUDED.risk_score,
  trust_tier = EXCLUDED.trust_tier,
  is_frozen = EXCLUDED.is_frozen,
  last_updated = now();

-- ─── FX RATES + CONVERSION HISTORY ──────────────────────────────────────────
INSERT INTO fx_rates (id, pair, rate, base_currency, quote_currency, updated_at)
VALUES
  (fx1, 'USD_KES', 129.5, 'USD', 'KES', now()),
  (fx2, 'EUR_KES', 142.1, 'EUR', 'KES', now()),
  (fx3, 'GBP_KES', 166.3, 'GBP', 'KES', now()),
  (fx4, 'KES_USD', round((1/129.5)::numeric, 6), 'KES', 'USD', now()),
  (fx5, 'UGX_KES', 0.035, 'UGX', 'KES', now())
ON CONFLICT (id) DO UPDATE SET
  rate = EXCLUDED.rate,
  pair = EXCLUDED.pair,
  base_currency = EXCLUDED.base_currency,
  quote_currency = EXCLUDED.quote_currency,
  updated_at = now();

-- Ensure pair uniqueness updates even if IDs differ on older installs
UPDATE fx_rates SET rate = 129.5, updated_at = now() WHERE pair = 'USD_KES';
UPDATE fx_rates SET rate = 142.1, updated_at = now() WHERE pair = 'EUR_KES';
UPDATE fx_rates SET rate = 166.3, updated_at = now() WHERE pair = 'GBP_KES';

INSERT INTO fx_conversions (id, amount, from_currency, to_currency, rate, converted_amount, metadata, created_at)
VALUES
  (fxc1, 500, 'USD', 'KES', 129.5, 64750, '{"source":"seed_admin_finance"}'::jsonb, now() - interval '2 days'),
  (fxc2, 200, 'EUR', 'KES', 142.1, 28420, '{"source":"seed_admin_finance"}'::jsonb, now() - interval '1 day'),
  (fxc3, 1000, 'USD', 'KES', 129.5, 129500, '{"source":"seed_admin_finance"}'::jsonb, now() - interval '6 hours')
ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount,
  converted_amount = EXCLUDED.converted_amount,
  rate = EXCLUDED.rate;

-- ─── AML / COMPLIANCE ───────────────────────────────────────────────────────
INSERT INTO aml_alerts (id, vendor_id, alert_type, severity, description, status, created_at)
VALUES
  (aml1, v_glow, 'LARGE_TRANSACTION', 8,
   'Glow salon payout KES 9200 exceeded soft AML review threshold', 'open', now() - interval '18 hours'),
  (aml2, v_elitefit, 'VELOCITY', 6,
   'EliteFit disbursement velocity above 7-day baseline', 'open', now() - interval '2 days'),
  (aml3, v_glow, 'GEO_ANOMALY', 5,
   'Beneficiary device geo shifted Nairobi → Mombasa within 2h', 'open', now() - interval '5 hours')
ON CONFLICT (id) DO UPDATE SET
  severity = EXCLUDED.severity,
  description = EXCLUDED.description,
  status = EXCLUDED.status;

INSERT INTO compliance_audit_logs (id, action, entity_type, entity_id, metadata, created_at)
VALUES
  (cal1, 'aml_alert_opened', 'aml_alert', aml1,
   '{"source":"seed_admin_finance"}'::jsonb, now() - interval '18 hours'),
  (cal2, 'kyc_submitted', 'vendor_kyc', v_glow,
   '{"source":"seed_admin_finance"}'::jsonb, now() - interval '3 days')
ON CONFLICT (id) DO UPDATE SET
  action = EXCLUDED.action,
  metadata = EXCLUDED.metadata;

-- ─── SETTLEMENT BATCHES (network ops) ───────────────────────────────────────
INSERT INTO settlement_batches (id, total_amount, payout_count, status, rail, currency, metadata, created_at)
VALUES
  (sb1, 24500, 3, 'SETTLED', 'mpesa', 'KES', '{"source":"seed_admin_finance"}'::jsonb, now() - interval '4 days'),
  (sb2, 18200, 2, 'SETTLED', 'mpesa', 'KES', '{"source":"seed_admin_finance"}'::jsonb, now() - interval '1 day'),
  (sb3, 9200, 1, 'PENDING', 'mpesa', 'KES', '{"source":"seed_admin_finance"}'::jsonb, now() - interval '3 hours')
ON CONFLICT (id) DO UPDATE SET
  total_amount = EXCLUDED.total_amount,
  payout_count = EXCLUDED.payout_count,
  status = EXCLUDED.status;

-- ─── KYC (user verifications + Glow vendor pending) ─────────────────────────
INSERT INTO kyc_verifications (id, user_id, document_url, status, tier, created_at)
VALUES
  (kyc1, NULL, 'https://example.com/docs/seed-id-front.jpg', 'pending', 'standard', now() - interval '1 day'),
  (kyc2, NULL, 'https://example.com/docs/seed-id-approved.jpg', 'approved', 'enhanced', now() - interval '5 days')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  document_url = EXCLUDED.document_url;

INSERT INTO vendor_kyc (vendor_id, full_name, country, document_type, document_number, verification_status, created_at)
SELECT v_glow, 'Glow Beauty Demo', 'KE', 'national_id', 'SEED-GLOW-001', 'PENDING', now() - interval '2 days'
WHERE NOT EXISTS (SELECT 1 FROM vendor_kyc WHERE vendor_id = v_glow AND document_number = 'SEED-GLOW-001');

UPDATE vendor_kyc
SET verification_status = 'PENDING',
    full_name = COALESCE(full_name, 'Glow Beauty Demo'),
    country = COALESCE(country, 'KE')
WHERE vendor_id = v_glow
  AND verification_status IS DISTINCT FROM 'APPROVED';

-- Financial events stream (admin control center)
INSERT INTO financial_events (event_type, entity_type, entity_id, amount, metadata, created_at)
SELECT 'platform_fee', 'ledger', fee1, 480, '{"source":"seed_admin_finance"}'::jsonb, now() - interval '1 day'
WHERE NOT EXISTS (
  SELECT 1 FROM financial_events
  WHERE event_type = 'platform_fee' AND entity_id = fee1
);

RAISE NOTICE 'seed_admin_finance: fees + treasury + fx + aml + settlements + kyc seeded';

END $$;
