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

INSERT INTO user_profiles (user_id, display_name, city)
SELECT id, 'Demo Vendor', 'Nairobi' FROM auth.users WHERE email = 'vendor@test.com'
ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, city = EXCLUDED.city;

INSERT INTO user_profiles (user_id, display_name, city)
SELECT id, 'Platform Admin', 'Nairobi' FROM auth.users WHERE email = 'admin@test.com'
ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name;

INSERT INTO user_profiles (user_id, display_name, city)
SELECT id, 'Demo User', 'Nairobi' FROM auth.users WHERE email = 'user@test.com'
ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, city = EXCLUDED.city;

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

