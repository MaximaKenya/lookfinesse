-- ═══════════════════════════════════════════════════════════════════════════
-- 032 — Account-level 30-day free trial
-- Safe to re-run.
-- Trial length matches TRIAL_DAYS in lib/config/trial.ts (30).
-- Existing accounts are backfilled from this migration's transaction time.
-- Nothing is deleted when a trial ends.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS trial_start timestamptz,
  ADD COLUMN IF NOT EXISTS trial_end timestamptz;

COMMENT ON COLUMN public.user_profiles.trial_start IS
  'When the LookFinesse free trial started. Length is TRIAL_DAYS (30) in lib/config/trial.ts.';
COMMENT ON COLUMN public.user_profiles.trial_end IS
  'When the free trial ends. Account and content stay; the app asks the user to choose a plan.';

CREATE INDEX IF NOT EXISTS idx_user_profiles_trial_end
  ON public.user_profiles (trial_end);

-- ─── Keep users from moving their own window ────────────────────────────────
CREATE OR REPLACE FUNCTION public.protect_trial_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  jwt_role text := COALESCE(auth.role(), '');
BEGIN
  IF jwt_role = 'service_role'
     OR current_user IN ('service_role', 'supabase_admin', 'postgres', 'supabase_auth_admin') THEN
    RETURN NEW;
  END IF;
  NEW.trial_start := OLD.trial_start;
  NEW.trial_end := OLD.trial_end;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_profiles_protect_trial ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_protect_trial
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_trial_columns();

-- ─── Set the window on insert when the app did not ─────────────────────────
CREATE OR REPLACE FUNCTION public.set_profile_trial_window()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.trial_start IS NULL THEN
    NEW.trial_start := now();
  END IF;
  IF NEW.trial_end IS NULL THEN
    NEW.trial_end := NEW.trial_start + interval '30 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_profiles_trial ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_trial
  BEFORE INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_profile_trial_window();

-- ─── Signup hook: profile row includes the trial ───────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_intended text;
  v_start timestamptz := now();
BEGIN
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'Member'
  );
  v_intended := COALESCE(NEW.raw_user_meta_data->>'intended_role', 'shopper');

  INSERT INTO public.user_profiles (
    user_id, display_name, preferences, trial_start, trial_end
  )
  VALUES (
    NEW.id,
    v_name,
    jsonb_build_object('intended_role', v_intended),
    v_start,
    v_start + interval '30 days'
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin, service_role;

-- ─── Backfill: 30 days from the moment this migration runs ─────────────────
INSERT INTO public.user_profiles (user_id, display_name, preferences, trial_start, trial_end)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'display_name',
    u.raw_user_meta_data->>'username',
    split_part(COALESCE(u.email, 'member'), '@', 1),
    'Member'
  ),
  jsonb_build_object('intended_role', COALESCE(u.raw_user_meta_data->>'intended_role', 'shopper')),
  now(),
  now() + interval '30 days'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles p WHERE p.user_id = u.id
);

UPDATE public.user_profiles
SET
  trial_start = COALESCE(trial_start, now()),
  trial_end = COALESCE(trial_end, COALESCE(trial_start, now()) + interval '30 days')
WHERE trial_start IS NULL OR trial_end IS NULL;

-- ─── Idempotent reminder ledger ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trial_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  days_before integer NOT NULL CHECK (days_before IN (7, 3, 1)),
  trial_end timestamptz NOT NULL,
  email_sent_at timestamptz,
  in_app_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, days_before, trial_end)
);

CREATE INDEX IF NOT EXISTS idx_trial_reminders_user
  ON public.trial_reminders (user_id, trial_end);

ALTER TABLE public.trial_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trial_reminders_own_select ON public.trial_reminders;
CREATE POLICY trial_reminders_own_select
  ON public.trial_reminders
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ─── Cron candidate list (service role only) ────────────────────────────────
CREATE OR REPLACE FUNCTION public.trial_accounts_in_reminder_window(p_now timestamptz DEFAULT now())
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  trial_start timestamptz,
  trial_end timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    u.email::text,
    p.display_name,
    p.trial_start,
    p.trial_end
  FROM public.user_profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE p.trial_end IS NOT NULL
    AND p.trial_end > p_now
    AND p.trial_end <= p_now + interval '7 days';
$$;

REVOKE ALL ON FUNCTION public.trial_accounts_in_reminder_window(timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trial_accounts_in_reminder_window(timestamptz) TO service_role;

CREATE OR REPLACE FUNCTION public.trial_admin_roster()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  trial_start timestamptz,
  trial_end timestamptz,
  roles text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    u.email::text,
    p.display_name,
    p.trial_start,
    p.trial_end,
    COALESCE((
      SELECT string_agg(role, ',' ORDER BY role)
      FROM (
        SELECT DISTINCT r.role
        FROM public.user_roles r
        WHERE r.user_id = p.user_id
      ) roles
    ), 'user') AS roles
  FROM public.user_profiles p
  JOIN auth.users u ON u.id = p.user_id
  ORDER BY p.trial_end ASC NULLS LAST;
$$;

REVOKE ALL ON FUNCTION public.trial_admin_roster() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trial_admin_roster() TO service_role;

-- ─── New commercial writes stop when the trial has ended ───────────────────
-- Updates and deletes stay open so people can still change their own content.
-- A missing trial_end stays writable. Admins stay writable.
CREATE OR REPLACE FUNCTION public.account_trial_allows_write()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NULL
    OR EXISTS (
      SELECT 1 FROM public.user_roles r
      WHERE r.user_id = auth.uid() AND r.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
        AND (
          lower(u.email) = 'admin@test.com'
          OR COALESCE(u.raw_app_meta_data->>'role', '') = 'admin'
        )
    )
    OR NOT EXISTS (
      SELECT 1 FROM public.user_profiles p
      WHERE p.user_id = auth.uid()
        AND p.trial_end IS NOT NULL
        AND p.trial_end <= now()
    );
$$;

REVOKE ALL ON FUNCTION public.account_trial_allows_write() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.account_trial_allows_write() TO authenticated, service_role;

DO $$
DECLARE
  target text;
BEGIN
  FOREACH target IN ARRAY ARRAY[
    'products',
    'services',
    'ad_campaigns',
    'reels',
    'stories',
    'feed_posts',
    'flash_drops',
    'live_sessions',
    'payout_queue',
    'payouts'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = target
    ) THEN
      EXECUTE format('DROP POLICY IF EXISTS trial_active_for_insert ON public.%I', target);
      EXECUTE format(
        'CREATE POLICY trial_active_for_insert ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.account_trial_allows_write())',
        target
      );
    END IF;
  END LOOP;
END
$$;
