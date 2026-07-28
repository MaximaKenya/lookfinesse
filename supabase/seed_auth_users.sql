-- ═══════════════════════════════════════════════════════════════════════════
-- LookFinesse — Seed Supabase Auth test users (SQL Editor / hosted projects)
-- Run AFTER 000_fresh_bootstrap.sql, BEFORE seed_auth_roles.sql
-- Safe to re-run (skips existing emails; ON CONFLICT on identities)
--
-- Password for all accounts: Test123456!
--   vendor@test.com  → vendor / creator (role applied in seed_auth_roles.sql)
--   admin@test.com   → platform admin
--   user@test.com    → buyer / fan
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_instance_id   uuid := '00000000-0000-0000-0000-000000000000';
  v_password      text := 'Test123456!';
  v_encrypted_pw  text;
  v_user_id       uuid;
  v_email         text;
  v_display_name  text;
  v_users         constant jsonb := '[
    {"id":"f1000000-0000-0000-0000-000000000001","email":"vendor@test.com","display_name":"Demo Vendor"},
    {"id":"f1000000-0000-0000-0000-000000000002","email":"admin@test.com","display_name":"Platform Admin"},
    {"id":"f1000000-0000-0000-0000-000000000003","email":"user@test.com","display_name":"Demo User"}
  ]'::jsonb;
  v_row           jsonb;
BEGIN
  v_encrypted_pw := extensions.crypt(v_password, extensions.gen_salt('bf'));

  FOR v_row IN SELECT * FROM jsonb_array_elements(v_users)
  LOOP
    v_user_id      := (v_row->>'id')::uuid;
    v_email        := v_row->>'email';
    v_display_name := v_row->>'display_name';

    -- auth.users (skip if email already exists — e.g. created manually in Dashboard)
    IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.email = v_email) THEN
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      )
      VALUES (
        v_instance_id,
        v_user_id,
        'authenticated',
        'authenticated',
        v_email,
        v_encrypted_pw,
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('display_name', v_display_name),
        now(),
        now(),
        '',
        '',
        '',
        ''
      );
    END IF;

    -- Resolve id (fixed UUID on fresh seed, or existing row if email pre-existed)
    SELECT u.id INTO v_user_id FROM auth.users u WHERE u.email = v_email LIMIT 1;

    IF v_user_id IS NULL THEN
      RAISE EXCEPTION 'Failed to create or resolve auth user for %', v_email;
    END IF;

    -- auth.identities — required for email/password sign-in (GoTrue)
    INSERT INTO auth.identities (
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      v_user_id::text,
      v_user_id,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', v_email,
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      now(),
      now(),
      now()
    )
    ON CONFLICT (provider_id, provider) DO NOTHING;
  END LOOP;
END $$;

-- ─── Verify bcrypt hashes (GoTrue-compatible via pgcrypto crypt) ────────────

DO $$
DECLARE
  v_password text := 'Test123456!';
  v_email    text;
  v_ok       boolean;
BEGIN
  FOREACH v_email IN ARRAY ARRAY['vendor@test.com', 'admin@test.com', 'user@test.com']
  LOOP
    SELECT extensions.crypt(v_password, u.encrypted_password) = u.encrypted_password
      INTO v_ok
    FROM auth.users u
    WHERE u.email = v_email;

    IF v_ok IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'Password verification failed for % — bcrypt hash does not match Test123456!', v_email;
    END IF;
  END LOOP;

  RAISE NOTICE 'seed_auth_users: 3 test accounts ready (vendor@test.com, admin@test.com, user@test.com)';
END $$;
