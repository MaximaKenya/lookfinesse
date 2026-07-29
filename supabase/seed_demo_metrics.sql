-- ═══════════════════════════════════════════════════════════════════════════
-- LookFinesse — Demo metrics for /dashboard & /vendor/finance
-- Run AFTER: 000_fresh_bootstrap → seed_auth_users → seed_auth_roles → seed.sql
-- Optional: migrations 021 (service_plans) + 025 (trialing) if not in bootstrap
-- Safe to re-run (ON CONFLICT / existence guards)
-- Uses auth.users emails only — never fake UUID users
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_elitefit uuid := 'a1000000-0000-0000-0000-000000000001';
  v_glow     uuid := 'a1000000-0000-0000-0000-000000000002';

  p5  uuid := 'b1000000-0000-0000-0000-000000000005';
  p15 uuid := 'b1000000-0000-0000-0000-000000000015';
  p16 uuid := 'b1000000-0000-0000-0000-000000000016';
  p17 uuid := 'b1000000-0000-0000-0000-000000000017';

  s1 uuid := 'c1000000-0000-0000-0000-000000000001';

  o1 uuid := '18000000-0000-4000-8000-000000000001';
  o2 uuid := '18000000-0000-4000-8000-000000000002';
  o3 uuid := '18000000-0000-4000-8000-000000000003';
  o4 uuid := '18000000-0000-4000-8000-000000000004';
  o5 uuid := '18000000-0000-4000-8000-000000000005';
  o6 uuid := '18000000-0000-4000-8000-000000000006';

  oi1 uuid := '19000000-0000-4000-8000-000000000001';
  oi2 uuid := '19000000-0000-4000-8000-000000000002';
  oi3 uuid := '19000000-0000-4000-8000-000000000003';
  oi4 uuid := '19000000-0000-4000-8000-000000000004';
  oi5 uuid := '19000000-0000-4000-8000-000000000005';
  oi6 uuid := '19000000-0000-4000-8000-000000000006';
  oi7 uuid := '19000000-0000-4000-8000-000000000007';

  le1 uuid := '1a000000-0000-4000-8000-000000000001';
  le2 uuid := '1a000000-0000-4000-8000-000000000002';
  le3 uuid := '1a000000-0000-4000-8000-000000000003';
  le4 uuid := '1a000000-0000-4000-8000-000000000004';
  le5 uuid := '1a000000-0000-4000-8000-000000000005';
  le6 uuid := '1a000000-0000-4000-8000-000000000006';

  po1 uuid := '1b000000-0000-4000-8000-000000000001';
  po2 uuid := '1b000000-0000-4000-8000-000000000002';
  po3 uuid := '1b000000-0000-4000-8000-000000000003';

  plan1 uuid := '21000000-0000-4000-8000-000000000001';
  plan2 uuid := '21000000-0000-4000-8000-000000000002';
  cs1   uuid := '22000000-0000-4000-8000-000000000001';
  sess1 uuid := '23000000-0000-4000-8000-000000000001';
  sess2 uuid := '23000000-0000-4000-8000-000000000002';

  n1 uuid := '24000000-0000-4000-8000-000000000001';
  n2 uuid := '24000000-0000-4000-8000-000000000002';

  vendor_user uuid;
  buyer_user  uuid;
  v_store_id  uuid;
BEGIN

SELECT id INTO vendor_user FROM auth.users WHERE email = 'vendor@test.com' LIMIT 1;
SELECT id INTO buyer_user  FROM auth.users WHERE email = 'user@test.com' LIMIT 1;
IF buyer_user IS NULL THEN
  buyer_user := vendor_user;
END IF;

IF vendor_user IS NULL THEN
  RAISE NOTICE 'seed_demo_metrics: vendor@test.com missing — run seed_auth_users.sql first';
  RETURN;
END IF;

-- Link vendor auth → EliteFit
UPDATE vendors SET user_id = vendor_user WHERE id = v_elitefit;

-- Ensure store exists and capture id
INSERT INTO stores (user_id, name, description, city)
SELECT vendor_user, 'EliteFit Store', 'Demo vendor store for EliteFit Gym', 'Nairobi'
WHERE NOT EXISTS (SELECT 1 FROM stores s WHERE s.user_id = vendor_user);

SELECT id INTO v_store_id FROM stores WHERE user_id = vendor_user ORDER BY created_at NULLS LAST LIMIT 1;

-- Link EliteFit products to the vendor store (fixes /dashboard product KPIs)
IF v_store_id IS NOT NULL THEN
  UPDATE products
  SET store_id = v_store_id
  WHERE vendor_id = v_elitefit
    AND (products.store_id IS NULL OR products.store_id <> v_store_id);
END IF;

-- ─── ORDERS (paid + pending — non-zero dashboard revenue) ───────────────────
IF buyer_user IS NOT NULL THEN
  INSERT INTO orders (id, user_id, vendor_id, total, phone, status, created_at)
  VALUES
    (o1, buyer_user, v_elitefit, 4800,  '254712000001', 'paid',      now() - interval '1 day'),
    (o2, buyer_user, v_elitefit, 3200,  '254712000001', 'paid',      now() - interval '2 days'),
    (o3, buyer_user, v_elitefit, 5600,  '254712000002', 'paid',      now() - interval '3 days'),
    (o4, buyer_user, v_elitefit, 1600,  '254712000003', 'paid',      now() - interval '5 days'),
    (o5, buyer_user, v_elitefit, 2400,  '254712000001', 'pending',   now() - interval '6 hours'),
    (o6, buyer_user, v_elitefit, 2800,  '254712000004', 'completed', now() - interval '8 days')
  ON CONFLICT (id) DO UPDATE SET
    total = EXCLUDED.total,
    status = EXCLUDED.status,
    vendor_id = EXCLUDED.vendor_id;

  INSERT INTO order_items (id, order_id, product_id, quantity, price)
  VALUES
    (oi1, o1, p5,  1, 3200),
    (oi2, o1, p15, 1, 1600),
    (oi3, o2, p5,  1, 3200),
    (oi4, o3, p17, 2, 2800),
    (oi5, o4, p15, 1, 1600),
    (oi6, o5, p16, 1, 2400),
    (oi7, o6, p17, 1, 2800)
  ON CONFLICT (id) DO NOTHING;
END IF;

-- ─── WALLETS (non-zero balances for /vendor/finance) ────────────────────────
INSERT INTO vendor_wallets (vendor_id, balance, currency, updated_at)
VALUES (v_elitefit, 187500, 'KES', now())
ON CONFLICT (vendor_id) DO UPDATE SET
  balance = EXCLUDED.balance,
  currency = EXCLUDED.currency,
  updated_at = now();

INSERT INTO wallet_balances (vendor_id, balance, updated_at)
VALUES (v_elitefit, 187500, now())
ON CONFLICT (vendor_id) DO UPDATE SET
  balance = EXCLUDED.balance,
  updated_at = now();

INSERT INTO vendor_balances (vendor_id, available_balance, updated_at)
VALUES (v_elitefit, 162000, now())
ON CONFLICT (vendor_id) DO UPDATE SET
  available_balance = EXCLUDED.available_balance,
  updated_at = now();

-- Glow salon wallet (secondary vendor with balance)
INSERT INTO vendor_wallets (vendor_id, balance, currency, updated_at)
VALUES (v_glow, 45200, 'KES', now())
ON CONFLICT (vendor_id) DO UPDATE SET
  balance = GREATEST(vendor_wallets.balance, EXCLUDED.balance),
  updated_at = now();

-- ─── LEDGER ENTRIES (revenue timeline) ──────────────────────────────────────
INSERT INTO ledger_entries (id, vendor_id, order_id, type, amount, category, description, status, balance_after, created_at)
VALUES
  (le1, v_elitefit, o1, 'credit', 4800,  'sale',    'Order paid — gym bag + bands',     'completed', 4800,   now() - interval '1 day'),
  (le2, v_elitefit, o2, 'credit', 3200,  'sale',    'Order paid — Performance Gym Bag', 'completed', 8000,   now() - interval '2 days'),
  (le3, v_elitefit, o3, 'credit', 5600,  'sale',    'Order paid — Foam rollers x2',     'completed', 13600,  now() - interval '3 days'),
  (le4, v_elitefit, o4, 'credit', 1600,  'sale',    'Order paid — Resistance bands',    'completed', 15200,  now() - interval '5 days'),
  (le5, v_elitefit, o6, 'credit', 2800,  'sale',    'Order completed — Foam roller',    'completed', 18000,  now() - interval '8 days'),
  (le6, v_elitefit, NULL,'debit', 12500, 'payout',  'M-Pesa payout to vendor',          'completed', 5500,   now() - interval '4 days')
ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount,
  type = EXCLUDED.type,
  status = EXCLUDED.status;

-- ─── PAYOUTS ───────────────────────────────────────────────────────────────
INSERT INTO payouts (id, vendor_id, amount, status, method, phone, reference, created_at)
VALUES
  (po1, v_elitefit, 12500, 'completed', 'mpesa', '254712345678', 'LF-PO-SEED-001', now() - interval '4 days'),
  (po2, v_elitefit, 8000,  'pending',   'mpesa', '254712345678', 'LF-PO-SEED-002', now() - interval '1 day'),
  (po3, v_elitefit, 15000, 'queued',    'mpesa', '254712345678', 'LF-PO-SEED-003', now() - interval '2 hours')
ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount,
  status = EXCLUDED.status;

INSERT INTO payout_queue (vendor_id, amount, status, priority, created_at)
SELECT v_elitefit, 15000, 'queued', 1, now() - interval '2 hours'
WHERE NOT EXISTS (
  SELECT 1 FROM payout_queue
  WHERE vendor_id = v_elitefit AND amount = 15000 AND status = 'queued'
);

-- ─── KYC + RISK (finance cards) ────────────────────────────────────────────
INSERT INTO vendor_kyc (vendor_id, full_name, country, verification_status)
SELECT v_elitefit, 'Demo Vendor', 'KE', 'APPROVED'
WHERE NOT EXISTS (SELECT 1 FROM vendor_kyc WHERE vendor_id = v_elitefit);

UPDATE vendor_kyc
SET verification_status = 'APPROVED', full_name = COALESCE(full_name, 'Demo Vendor')
WHERE vendor_id = v_elitefit;

INSERT INTO vendor_risk_scores (vendor_id, risk_score, trust_tier, is_frozen)
VALUES (v_elitefit, 12, 'TRUSTED', false)
ON CONFLICT (vendor_id) DO UPDATE SET
  risk_score = EXCLUDED.risk_score,
  trust_tier = EXCLUDED.trust_tier,
  is_frozen = EXCLUDED.is_frozen;

-- ─── PLATFORM SUB: Pro trial if no paid active ─────────────────────────────
INSERT INTO platform_subscriptions (
  vendor_id, user_id, tier, status, price_kes, payment_method,
  ad_credits_remaining, current_period_start, current_period_end, trial_ends_at
)
VALUES (
  v_elitefit, vendor_user, 'pro', 'trialing', 0, NULL, 2500,
  now(), now() + interval '30 days', now() + interval '30 days'
)
ON CONFLICT (vendor_id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  tier = CASE
    WHEN platform_subscriptions.status = 'active' AND platform_subscriptions.payment_method IS NOT NULL
    THEN platform_subscriptions.tier ELSE EXCLUDED.tier END,
  status = CASE
    WHEN platform_subscriptions.status = 'active' AND platform_subscriptions.payment_method IS NOT NULL
    THEN platform_subscriptions.status ELSE EXCLUDED.status END,
  current_period_end = CASE
    WHEN platform_subscriptions.status = 'active' AND platform_subscriptions.payment_method IS NOT NULL
    THEN platform_subscriptions.current_period_end ELSE EXCLUDED.current_period_end END,
  trial_ends_at = CASE
    WHEN platform_subscriptions.status = 'active' AND platform_subscriptions.payment_method IS NOT NULL
    THEN platform_subscriptions.trial_ends_at ELSE EXCLUDED.trial_ends_at END,
  ad_credits_remaining = GREATEST(
    COALESCE(platform_subscriptions.ad_credits_remaining, 0),
    EXCLUDED.ad_credits_remaining
  );

-- ─── SERVICE PLANS / CLASS SESSIONS / CUSTOMER SUBS (if tables exist) ──────
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_plans') THEN
  INSERT INTO service_plans (id, vendor_id, service_id, name, description, price_kes, interval, benefits, includes_live_classes, is_active)
  VALUES
    (plan1, v_elitefit, s1, 'EliteFit Monthly Unlimited',
     'Unlimited gym access, group classes & live HIIT.', 4500, 'monthly',
     '["Unlimited in-gym access","All HIIT classes","Live online sessions"]'::jsonb, true, true),
    (plan2, v_glow, NULL, 'Glow Club Monthly',
     'Priority bookings + 10% off treatments.', 800, 'monthly',
     '["10% off treatments","Priority booking"]'::jsonb, false, true)
  ON CONFLICT (id) DO UPDATE SET
    price_kes = EXCLUDED.price_kes,
    is_active = true;

  IF buyer_user IS NOT NULL AND EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_subscriptions'
  ) THEN
    INSERT INTO customer_subscriptions (
      id, user_id, vendor_id, plan_id, status,
      current_period_start, current_period_end, payment_method, next_billing_at
    )
    VALUES (
      cs1, buyer_user, v_elitefit, plan1, 'active',
      now() - interval '5 days', now() + interval '25 days', 'mpesa', now() + interval '25 days'
    )
    ON CONFLICT (id) DO UPDATE SET status = 'active';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'class_sessions') THEN
    INSERT INTO class_sessions (id, vendor_id, title, description, starts_at, ends_at, capacity, is_online)
    VALUES
      (sess1, v_elitefit, 'Morning HIIT — Studio A', 'High-intensity bootcamp.',
       now() + interval '1 day 7 hours', now() + interval '1 day 8 hours', 15, false),
      (sess2, v_elitefit, 'Live Full Body Burn', 'Join from home.',
       now() + interval '2 days 18 hours', now() + interval '2 days 19 hours', 50, true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END IF;

-- ─── EXTRA NOTIFICATIONS for vendor + buyer ───────────────────────────────
IF buyer_user IS NOT NULL THEN
  INSERT INTO notifications (id, user_id, type, title, message, link_url, is_read)
  VALUES
    (n1, buyer_user, 'order', 'Order shipped', 'Your EliteFit gym bag is on the way.', '/bookings', false),
    (n2, vendor_user, 'payout', 'Payout queued', 'KES 15,000 payout is in the queue.', '/vendor/finance', false)
  ON CONFLICT (id) DO NOTHING;
END IF;

RAISE NOTICE 'seed_demo_metrics: wallets, orders, ledger, trial wired for vendor@test.com / EliteFit';

END $$;
