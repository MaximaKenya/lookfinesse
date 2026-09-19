-- ═══════════════════════════════════════════════════════════════════════════
-- LookFinesse — Link auth test users to roles & vendor profile
-- Run AFTER supabase/seed_auth_users.sql (see docs/SEED_CREDENTIALS.md)
-- Safe to re-run (ON CONFLICT DO NOTHING / idempotent updates)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Roles ──────────────────────────────────────────────────────────────────

INSERT INTO user_roles (user_id, role)
SELECT id, 'vendor' FROM auth.users WHERE email = 'vendor@test.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'admin@test.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'user' FROM auth.users WHERE email = 'user@test.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Admin app_metadata (optional — edge auth also checks user_roles)
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
WHERE email = 'admin@test.com';

-- ─── Link vendor@test.com → EliteFit Gym (seed vendor id) ───────────────────

UPDATE vendors
SET user_id = (SELECT id FROM auth.users WHERE email = 'vendor@test.com')
WHERE id = 'a1000000-0000-0000-0000-000000000001';

-- ─── User profiles for test accounts ────────────────────────────────────────

INSERT INTO user_profiles (user_id, display_name, city, onboarded_at, preferences)
SELECT id, 'Demo Vendor', 'Nairobi', now(), '{"gender":"male","age_group":"25-34","interests":["fitness"],"intended_role":"vendor"}'::jsonb
FROM auth.users WHERE email = 'vendor@test.com'
ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, city = EXCLUDED.city, onboarded_at = COALESCE(user_profiles.onboarded_at, EXCLUDED.onboarded_at);

INSERT INTO user_profiles (user_id, display_name, city, onboarded_at, preferences)
SELECT id, 'Platform Admin', 'Nairobi', now(), '{"intended_role":"shopper"}'::jsonb
FROM auth.users WHERE email = 'admin@test.com'
ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, onboarded_at = COALESCE(user_profiles.onboarded_at, EXCLUDED.onboarded_at);

INSERT INTO user_profiles (user_id, display_name, city, onboarded_at, preferences)
SELECT id, 'Demo User', 'Nairobi', now(), '{"gender":"female","age_group":"25-34","interests":["fashion","beauty"],"intended_role":"shopper"}'::jsonb
FROM auth.users WHERE email = 'user@test.com'
ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, city = EXCLUDED.city, onboarded_at = COALESCE(user_profiles.onboarded_at, EXCLUDED.onboarded_at);

-- ─── Optional: create a store row for vendor@test.com ───────────────────────

INSERT INTO stores (user_id, name, description, city)
SELECT u.id, 'EliteFit Store', 'Demo vendor store for EliteFit Gym', 'Nairobi'
FROM auth.users u
WHERE u.email = 'vendor@test.com'
  AND NOT EXISTS (SELECT 1 FROM stores s WHERE s.user_id = u.id);

-- ─── 30-day Pro trial for vendor@test.com (if no paid/active sub) ────────────

INSERT INTO platform_subscriptions (
  vendor_id, user_id, tier, status, price_kes, payment_method,
  ad_credits_remaining, current_period_start, current_period_end, trial_ends_at
)
SELECT
  'a1000000-0000-0000-0000-000000000001'::uuid,
  u.id,
  'pro',
  'trialing',
  0,
  NULL,
  2500,
  now(),
  now() + interval '30 days',
  now() + interval '30 days'
FROM auth.users u
WHERE u.email = 'vendor@test.com'
  AND EXISTS (SELECT 1 FROM vendors v WHERE v.id = 'a1000000-0000-0000-0000-000000000001')
  AND NOT EXISTS (
    SELECT 1 FROM platform_subscriptions ps
    WHERE ps.vendor_id = 'a1000000-0000-0000-0000-000000000001'
      AND ps.status IN ('active', 'trialing')
  )
ON CONFLICT (vendor_id) DO UPDATE SET
  tier = EXCLUDED.tier,
  status = EXCLUDED.status,
  price_kes = EXCLUDED.price_kes,
  user_id = EXCLUDED.user_id,
  current_period_start = EXCLUDED.current_period_start,
  current_period_end = EXCLUDED.current_period_end,
  trial_ends_at = EXCLUDED.trial_ends_at,
  ad_credits_remaining = EXCLUDED.ad_credits_remaining
WHERE platform_subscriptions.status NOT IN ('active');

-- ─── glow@test.com → Glow Salon & Spa ───────────────────────────────────────

INSERT INTO user_roles (user_id, role)
SELECT id, 'vendor' FROM auth.users WHERE email = 'glow@test.com'
ON CONFLICT (user_id, role) DO NOTHING;

UPDATE vendors
SET user_id = (SELECT id FROM auth.users WHERE email = 'glow@test.com')
WHERE id = 'a1000000-0000-0000-0000-000000000002'
  AND (user_id IS NULL OR user_id = (SELECT id FROM auth.users WHERE email = 'glow@test.com'));

INSERT INTO user_profiles (user_id, display_name, city, onboarded_at, preferences)
SELECT id, 'Glow Salon', 'Nairobi', now(), '{"gender":"female","age_group":"25-34","interests":["beauty"],"intended_role":"vendor"}'::jsonb
FROM auth.users WHERE email = 'glow@test.com'
ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, onboarded_at = COALESCE(user_profiles.onboarded_at, EXCLUDED.onboarded_at);

INSERT INTO stores (user_id, name, description, city, latitude, longitude)
SELECT u.id, 'Glow Salon & Spa', 'Demo beauty vendor storefront', 'Nairobi', -1.2916, 36.7836
FROM auth.users u
WHERE u.email = 'glow@test.com'
  AND NOT EXISTS (SELECT 1 FROM stores s WHERE s.user_id = u.id);

INSERT INTO platform_subscriptions (
  vendor_id, user_id, tier, status, price_kes, payment_method,
  ad_credits_remaining, current_period_start, current_period_end, trial_ends_at
)
SELECT
  'a1000000-0000-0000-0000-000000000002'::uuid,
  u.id,
  'pro',
  'trialing',
  0,
  NULL,
  2500,
  now(),
  now() + interval '30 days',
  now() + interval '30 days'
FROM auth.users u
WHERE u.email = 'glow@test.com'
  AND EXISTS (SELECT 1 FROM vendors v WHERE v.id = 'a1000000-0000-0000-0000-000000000002')
  AND NOT EXISTS (
    SELECT 1 FROM platform_subscriptions ps
    WHERE ps.vendor_id = 'a1000000-0000-0000-0000-000000000002'
      AND ps.status IN ('active', 'trialing')
  )
ON CONFLICT (vendor_id) DO NOTHING;

-- ─── style@test.com → Style Bank ────────────────────────────────────────────

INSERT INTO user_roles (user_id, role)
SELECT id, 'vendor' FROM auth.users WHERE email = 'style@test.com'
ON CONFLICT (user_id, role) DO NOTHING;

UPDATE vendors
SET user_id = (SELECT id FROM auth.users WHERE email = 'style@test.com')
WHERE id = 'a1000000-0000-0000-0000-000000000003'
  AND (user_id IS NULL OR user_id = (SELECT id FROM auth.users WHERE email = 'style@test.com'));

INSERT INTO user_profiles (user_id, display_name, city, onboarded_at, preferences)
SELECT id, 'Style Bank', 'Nairobi', now(), '{"gender":"female","age_group":"25-34","interests":["fashion"],"intended_role":"vendor"}'::jsonb
FROM auth.users WHERE email = 'style@test.com'
ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, onboarded_at = COALESCE(user_profiles.onboarded_at, EXCLUDED.onboarded_at);

INSERT INTO stores (user_id, name, description, city, latitude, longitude)
SELECT u.id, 'Style Bank', 'Demo fashion vendor storefront', 'Nairobi', -1.2789, 36.7689
FROM auth.users u
WHERE u.email = 'style@test.com'
  AND NOT EXISTS (SELECT 1 FROM stores s WHERE s.user_id = u.id);

INSERT INTO platform_subscriptions (
  vendor_id, user_id, tier, status, price_kes, payment_method,
  ad_credits_remaining, current_period_start, current_period_end, trial_ends_at
)
SELECT
  'a1000000-0000-0000-0000-000000000003'::uuid,
  u.id,
  'pro',
  'trialing',
  0,
  NULL,
  2500,
  now(),
  now() + interval '30 days',
  now() + interval '30 days'
FROM auth.users u
WHERE u.email = 'style@test.com'
  AND EXISTS (SELECT 1 FROM vendors v WHERE v.id = 'a1000000-0000-0000-0000-000000000003')
  AND NOT EXISTS (
    SELECT 1 FROM platform_subscriptions ps
    WHERE ps.vendor_id = 'a1000000-0000-0000-0000-000000000003'
      AND ps.status IN ('active', 'trialing')
  )
ON CONFLICT (vendor_id) DO NOTHING;


