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
