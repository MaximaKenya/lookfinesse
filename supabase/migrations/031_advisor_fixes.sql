-- Advisor cleanup for the production Supabase project.
-- Idempotent. Safe to re-run after GO_LIVE.sql.
--
-- Does not drop unused indexes: those warnings appear because the project
-- was just loaded and the planner has not used them yet.
-- Does not revoke service_slot_capacity(): booking pages call it, and it
-- must stay SECURITY DEFINER so a shopper can read remaining capacity
-- without reading every booking row.
-- Leaked-password protection is an Auth dashboard setting, not SQL.

-- ── 1. Signup trigger is not an RPC ────────────────────────────────────────
-- PUBLIC still grants EXECUTE to anon and authenticated, so revoke that too.
-- The auth.users trigger runs as supabase_auth_admin and keeps EXECUTE.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin, service_role;

-- ── 2. Pin search_path on the three flagged functions ──────────────────────
ALTER FUNCTION public.set_user_profiles_updated_at() SET search_path = public;
ALTER FUNCTION public.update_ad_campaign_timestamp() SET search_path = public;
ALTER FUNCTION public.nearby_vendors(double precision, double precision, double precision) SET search_path = public;

-- ── 3. Merge overlapping permissive policies ───────────────────────────────
-- A FOR ALL policy also counts as SELECT. Where the public SELECT already
-- covers every row the writer could read, the write policy is split into
-- INSERT / UPDATE / DELETE. Where the two SELECTs differ, they become one
-- OR policy. Access does not get wider.

DROP POLICY IF EXISTS availability_vendor_write ON public.availability_slots;
DROP POLICY IF EXISTS availability_vendor_insert ON public.availability_slots;
DROP POLICY IF EXISTS availability_vendor_update ON public.availability_slots;
DROP POLICY IF EXISTS availability_vendor_delete ON public.availability_slots;
CREATE POLICY availability_vendor_insert ON public.availability_slots
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = (select auth.uid()))
  );
CREATE POLICY availability_vendor_update ON public.availability_slots
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = (select auth.uid()))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = (select auth.uid()))
  );
CREATE POLICY availability_vendor_delete ON public.availability_slots
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS bookings_own_read ON public.bookings;
DROP POLICY IF EXISTS bookings_vendor_read ON public.bookings;
DROP POLICY IF EXISTS bookings_select ON public.bookings;
CREATE POLICY bookings_select ON public.bookings
  FOR SELECT USING (
    user_id = (select auth.uid())
    OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS class_sessions_vendor_manage ON public.class_sessions;
DROP POLICY IF EXISTS class_sessions_vendor_insert ON public.class_sessions;
DROP POLICY IF EXISTS class_sessions_vendor_update ON public.class_sessions;
DROP POLICY IF EXISTS class_sessions_vendor_delete ON public.class_sessions;
CREATE POLICY class_sessions_vendor_insert ON public.class_sessions
  FOR INSERT WITH CHECK (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = (select auth.uid()))
  );
CREATE POLICY class_sessions_vendor_update ON public.class_sessions
  FOR UPDATE USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = (select auth.uid()))
  ) WITH CHECK (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = (select auth.uid()))
  );
CREATE POLICY class_sessions_vendor_delete ON public.class_sessions
  FOR DELETE USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS collections_own_read ON public.collections;

DROP POLICY IF EXISTS customer_subs_own ON public.customer_subscriptions;
DROP POLICY IF EXISTS customer_subs_vendor_read ON public.customer_subscriptions;
DROP POLICY IF EXISTS customer_subs_select ON public.customer_subscriptions;
CREATE POLICY customer_subs_select ON public.customer_subscriptions
  FOR SELECT USING (
    user_id = (select auth.uid())
    OR vendor_id IN (SELECT id FROM public.vendors WHERE user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS flash_drops_vendor_write ON public.flash_drops;
DROP POLICY IF EXISTS flash_drops_vendor_insert ON public.flash_drops;
DROP POLICY IF EXISTS flash_drops_vendor_update ON public.flash_drops;
DROP POLICY IF EXISTS flash_drops_vendor_delete ON public.flash_drops;
CREATE POLICY flash_drops_vendor_insert ON public.flash_drops
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = (select auth.uid()))
  );
CREATE POLICY flash_drops_vendor_update ON public.flash_drops
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = (select auth.uid()))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = (select auth.uid()))
  );
CREATE POLICY flash_drops_vendor_delete ON public.flash_drops
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS follows_own_write ON public.follows;
DROP POLICY IF EXISTS follows_own_insert ON public.follows;
DROP POLICY IF EXISTS follows_own_update ON public.follows;
DROP POLICY IF EXISTS follows_own_delete ON public.follows;
CREATE POLICY follows_own_insert ON public.follows
  FOR INSERT WITH CHECK (follower_id = (select auth.uid()));
CREATE POLICY follows_own_update ON public.follows
  FOR UPDATE USING (follower_id = (select auth.uid()))
  WITH CHECK (follower_id = (select auth.uid()));
CREATE POLICY follows_own_delete ON public.follows
  FOR DELETE USING (follower_id = (select auth.uid()));

DROP POLICY IF EXISTS comments_own_write ON public.post_comments;
DROP POLICY IF EXISTS comments_own_insert ON public.post_comments;
DROP POLICY IF EXISTS comments_own_update ON public.post_comments;
DROP POLICY IF EXISTS comments_own_delete ON public.post_comments;
CREATE POLICY comments_own_insert ON public.post_comments
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY comments_own_update ON public.post_comments
  FOR UPDATE USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY comments_own_delete ON public.post_comments
  FOR DELETE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS reactions_own_write ON public.post_reactions;
DROP POLICY IF EXISTS reactions_own_insert ON public.post_reactions;
DROP POLICY IF EXISTS reactions_own_update ON public.post_reactions;
DROP POLICY IF EXISTS reactions_own_delete ON public.post_reactions;
CREATE POLICY reactions_own_insert ON public.post_reactions
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY reactions_own_update ON public.post_reactions
  FOR UPDATE USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY reactions_own_delete ON public.post_reactions
  FOR DELETE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS saved_own_read ON public.saved_posts;

DROP POLICY IF EXISTS service_plans_public_read ON public.service_plans;
DROP POLICY IF EXISTS service_plans_vendor_manage ON public.service_plans;
DROP POLICY IF EXISTS service_plans_select ON public.service_plans;
DROP POLICY IF EXISTS service_plans_vendor_insert ON public.service_plans;
DROP POLICY IF EXISTS service_plans_vendor_update ON public.service_plans;
DROP POLICY IF EXISTS service_plans_vendor_delete ON public.service_plans;
CREATE POLICY service_plans_select ON public.service_plans
  FOR SELECT USING (
    is_active = true
    OR vendor_id IN (SELECT id FROM public.vendors WHERE user_id = (select auth.uid()))
  );
CREATE POLICY service_plans_vendor_insert ON public.service_plans
  FOR INSERT WITH CHECK (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = (select auth.uid()))
  );
CREATE POLICY service_plans_vendor_update ON public.service_plans
  FOR UPDATE USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = (select auth.uid()))
  ) WITH CHECK (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = (select auth.uid()))
  );
CREATE POLICY service_plans_vendor_delete ON public.service_plans
  FOR DELETE USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS services_public_read ON public.services;
DROP POLICY IF EXISTS services_vendor_write ON public.services;
DROP POLICY IF EXISTS services_select ON public.services;
DROP POLICY IF EXISTS services_vendor_insert ON public.services;
DROP POLICY IF EXISTS services_vendor_update ON public.services;
DROP POLICY IF EXISTS services_vendor_delete ON public.services;
CREATE POLICY services_select ON public.services
  FOR SELECT USING (
    status = 'active'
    OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = (select auth.uid()))
  );
CREATE POLICY services_vendor_insert ON public.services
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = (select auth.uid()))
  );
CREATE POLICY services_vendor_update ON public.services
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = (select auth.uid()))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = (select auth.uid()))
  );
CREATE POLICY services_vendor_delete ON public.services
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS user_profiles_own_read ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_own_write ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_own_delete ON public.user_profiles;
CREATE POLICY user_profiles_own_delete ON public.user_profiles
  FOR DELETE USING (user_id = (select auth.uid()));

-- ── 4. Wrap remaining auth.uid() calls so the planner inits them once ─────
DO $wrap$
DECLARE
  r record;
  using_expr text;
  check_expr text;
  bare text;
  cmd text;
  sql text;
BEGIN
  FOR r IN
    SELECT
      pol.polname,
      c.relname,
      pol.polcmd,
      pol.polpermissive,
      pg_get_expr(pol.polqual, pol.polrelid) AS using_expr,
      pg_get_expr(pol.polwithcheck, pol.polrelid) AS check_expr,
      COALESCE((
        SELECT string_agg(quote_ident(pr.rolname), ', ' ORDER BY pr.rolname)
        FROM pg_roles pr
        WHERE pr.oid = ANY (pol.polroles)
      ), '') AS roles
    FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND (
        COALESCE(pg_get_expr(pol.polqual, pol.polrelid), '') LIKE '%auth.uid()%'
        OR COALESCE(pg_get_expr(pol.polwithcheck, pol.polrelid), '') LIKE '%auth.uid()%'
      )
  LOOP
    using_expr := r.using_expr;
    check_expr := r.check_expr;
    bare := COALESCE(using_expr, '') || ' ' || COALESCE(check_expr, '');
    bare := regexp_replace(bare, '\(\s*select\s+auth\.uid\(\)\s*(as\s+uid)?\s*\)', '', 'gi');
    IF bare NOT LIKE '%auth.uid()%' THEN
      CONTINUE;
    END IF;

    IF using_expr IS NOT NULL THEN
      using_expr := regexp_replace(using_expr, '\(\s*select\s+auth\.uid\(\)\s*(as\s+uid)?\s*\)', '___AUTH_UID___', 'gi');
      using_expr := replace(using_expr, 'auth.uid()', '(select auth.uid())');
      using_expr := replace(using_expr, '___AUTH_UID___', '(select auth.uid())');
    END IF;
    IF check_expr IS NOT NULL THEN
      check_expr := regexp_replace(check_expr, '\(\s*select\s+auth\.uid\(\)\s*(as\s+uid)?\s*\)', '___AUTH_UID___', 'gi');
      check_expr := replace(check_expr, 'auth.uid()', '(select auth.uid())');
      check_expr := replace(check_expr, '___AUTH_UID___', '(select auth.uid())');
    END IF;

    cmd := CASE r.polcmd
      WHEN 'r' THEN 'SELECT'
      WHEN 'a' THEN 'INSERT'
      WHEN 'w' THEN 'UPDATE'
      WHEN 'd' THEN 'DELETE'
      ELSE 'ALL'
    END;

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.polname, r.relname);
    sql := format(
      'CREATE POLICY %I ON public.%I AS %s FOR %s',
      r.polname,
      r.relname,
      CASE WHEN r.polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
      cmd
    );
    IF r.roles <> '' THEN
      sql := sql || ' TO ' || r.roles;
    END IF;
    IF using_expr IS NOT NULL AND cmd <> 'INSERT' THEN
      sql := sql || ' USING (' || using_expr || ')';
    END IF;
    IF check_expr IS NOT NULL AND cmd IN ('INSERT', 'UPDATE', 'ALL') THEN
      sql := sql || ' WITH CHECK (' || check_expr || ')';
    END IF;
    EXECUTE sql;
  END LOOP;
END
$wrap$;

-- ── 5. ad_frequency_caps runs as the caller, and can read impressions ──────
CREATE OR REPLACE VIEW public.ad_frequency_caps
WITH (security_invoker = true) AS
SELECT
  campaign_id,
  user_id,
  session_id,
  count(*) AS impression_count,
  max(created_at) AS last_seen_at
FROM public.ad_impressions
WHERE created_at > (now() - interval '24 hours')
GROUP BY campaign_id, user_id, session_id;

GRANT SELECT ON public.ad_frequency_caps TO anon, authenticated, service_role;

-- Shoppers read their own impressions. Vendors read impressions on their
-- campaigns. Joining vendors directly avoids treating "can see a live
-- campaign" as permission to read every impression on it.
DROP POLICY IF EXISTS ad_impressions_read ON public.ad_impressions;
CREATE POLICY ad_impressions_read ON public.ad_impressions
  FOR SELECT USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.ad_campaigns c
      JOIN public.vendors v ON v.id = c.vendor_id
      WHERE c.id = ad_impressions.campaign_id
        AND v.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS ad_clicks_read ON public.ad_clicks;
CREATE POLICY ad_clicks_read ON public.ad_clicks
  FOR SELECT USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.ad_campaigns c
      JOIN public.vendors v ON v.id = c.vendor_id
      WHERE c.id = ad_clicks.campaign_id
        AND v.user_id = (select auth.uid())
    )
  );

-- Live campaigns are public. Vendors can read every campaign they own,
-- including drafts. One policy, so SELECT is not permissive twice.
DROP POLICY IF EXISTS ad_campaigns_read ON public.ad_campaigns;
CREATE POLICY ad_campaigns_read ON public.ad_campaigns
  FOR SELECT USING (
    status IN ('live', 'active')
    OR EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = ad_campaigns.vendor_id
        AND v.user_id = (select auth.uid())
    )
  );

-- ── 6. Read policies for RLS tables the app actually selects ───────────────
-- hashtags and story_views are not queried. They stay locked.
-- Admin dashboards that use the service role bypass these policies.

DROP POLICY IF EXISTS achievements_own_read ON public.achievements;
CREATE POLICY achievements_own_read ON public.achievements
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS ai_memory_own_read ON public.ai_memory;
CREATE POLICY ai_memory_own_read ON public.ai_memory
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS user_streaks_own_read ON public.user_streaks;
CREATE POLICY user_streaks_own_read ON public.user_streaks
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS user_interests_own_read ON public.user_interests;
CREATE POLICY user_interests_own_read ON public.user_interests
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS user_behavior_own_read ON public.user_behavior_events;
CREATE POLICY user_behavior_own_read ON public.user_behavior_events
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS cart_own_read ON public.cart;
CREATE POLICY cart_own_read ON public.cart
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS cart_items_own_read ON public.cart_items;
CREATE POLICY cart_items_own_read ON public.cart_items
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS categories_public_read ON public.categories;
CREATE POLICY categories_public_read ON public.categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS product_categories_public_read ON public.product_categories;
CREATE POLICY product_categories_public_read ON public.product_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS challenges_public_read ON public.challenges;
CREATE POLICY challenges_public_read ON public.challenges
  FOR SELECT USING (true);

DROP POLICY IF EXISTS challenge_participants_public_read ON public.challenge_participants;
CREATE POLICY challenge_participants_public_read ON public.challenge_participants
  FOR SELECT USING (true);

DROP POLICY IF EXISTS trending_topics_public_read ON public.trending_topics;
CREATE POLICY trending_topics_public_read ON public.trending_topics
  FOR SELECT USING (true);

DROP POLICY IF EXISTS live_sessions_public_read ON public.live_sessions;
CREATE POLICY live_sessions_public_read ON public.live_sessions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS live_tips_read ON public.live_tips;
CREATE POLICY live_tips_read ON public.live_tips
  FOR SELECT USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = live_tips.vendor_id AND v.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS stories_public_read ON public.stories;
CREATE POLICY stories_public_read ON public.stories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS creator_profiles_public_read ON public.creator_profiles;
CREATE POLICY creator_profiles_public_read ON public.creator_profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS membership_tiers_public_read ON public.membership_tiers;
CREATE POLICY membership_tiers_public_read ON public.membership_tiers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS memberships_read ON public.memberships;
CREATE POLICY memberships_read ON public.memberships
  FOR SELECT USING (
    status = 'active'
    OR user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = memberships.vendor_id AND v.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS affiliate_links_public_read ON public.affiliate_links;
CREATE POLICY affiliate_links_public_read ON public.affiliate_links
  FOR SELECT USING (true);

DROP POLICY IF EXISTS affiliate_referrals_read ON public.affiliate_referrals;
CREATE POLICY affiliate_referrals_read ON public.affiliate_referrals
  FOR SELECT USING (
    referred_user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.affiliate_links l
      JOIN public.vendors v ON v.id = l.vendor_id
      WHERE l.id = affiliate_referrals.affiliate_link_id
        AND v.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS staff_members_vendor_read ON public.staff_members;
CREATE POLICY staff_members_vendor_read ON public.staff_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = staff_members.vendor_id AND v.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS orders_read ON public.orders;
CREATE POLICY orders_read ON public.orders
  FOR SELECT USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = orders.vendor_id AND v.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS order_items_read ON public.order_items;
CREATE POLICY order_items_read ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id)
  );

DROP POLICY IF EXISTS payments_read ON public.payments;
CREATE POLICY payments_read ON public.payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = payments.order_id)
    OR EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = payments.vendor_id AND v.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS ledger_entries_read ON public.ledger_entries;
CREATE POLICY ledger_entries_read ON public.ledger_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = ledger_entries.vendor_id AND v.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = ledger_entries.order_id AND o.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS invoices_read ON public.invoices;
CREATE POLICY invoices_read ON public.invoices
  FOR SELECT USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = invoices.vendor_id AND v.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS payouts_vendor_read ON public.payouts;
CREATE POLICY payouts_vendor_read ON public.payouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = payouts.vendor_id AND v.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS payout_queue_vendor_read ON public.payout_queue;
CREATE POLICY payout_queue_vendor_read ON public.payout_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = payout_queue.vendor_id AND v.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS vendor_balances_read ON public.vendor_balances;
CREATE POLICY vendor_balances_read ON public.vendor_balances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_balances.vendor_id AND v.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS vendor_wallets_read ON public.vendor_wallets;
CREATE POLICY vendor_wallets_read ON public.vendor_wallets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_wallets.vendor_id AND v.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS wallet_balances_read ON public.wallet_balances;
CREATE POLICY wallet_balances_read ON public.wallet_balances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = wallet_balances.vendor_id AND v.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS vendor_kyc_read ON public.vendor_kyc;
CREATE POLICY vendor_kyc_read ON public.vendor_kyc
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_kyc.vendor_id AND v.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS vendor_risk_scores_read ON public.vendor_risk_scores;
CREATE POLICY vendor_risk_scores_read ON public.vendor_risk_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_risk_scores.vendor_id AND v.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS fraud_events_vendor_read ON public.fraud_events;
CREATE POLICY fraud_events_vendor_read ON public.fraud_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = fraud_events.vendor_id AND v.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS fraud_logs_read ON public.fraud_logs;
CREATE POLICY fraud_logs_read ON public.fraud_logs
  FOR SELECT USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = fraud_logs.vendor_id AND v.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS audit_logs_actor_read ON public.audit_logs;
CREATE POLICY audit_logs_actor_read ON public.audit_logs
  FOR SELECT USING (actor_id = (select auth.uid()));

DROP POLICY IF EXISTS content_sentiments_read ON public.content_sentiments;
CREATE POLICY content_sentiments_read ON public.content_sentiments
  FOR SELECT USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.user_roles r
      WHERE r.user_id = (select auth.uid()) AND r.role = 'admin'
    )
  );

DROP POLICY IF EXISTS financial_events_admin_read ON public.financial_events;
CREATE POLICY financial_events_admin_read ON public.financial_events
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles r
      WHERE r.user_id = (select auth.uid()) AND r.role = 'admin'
    )
  );

-- ── 7. Cover unindexed foreign keys ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_fk_ad_campaigns_product_id ON public.ad_campaigns (product_id);
CREATE INDEX IF NOT EXISTS idx_fk_ad_campaigns_service_id ON public.ad_campaigns (service_id);
CREATE INDEX IF NOT EXISTS idx_fk_ad_clicks_campaign_id ON public.ad_clicks (campaign_id);
CREATE INDEX IF NOT EXISTS idx_fk_ad_clicks_impression_id ON public.ad_clicks (impression_id);
CREATE INDEX IF NOT EXISTS idx_fk_ad_clicks_user_id ON public.ad_clicks (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_ad_impressions_campaign_id ON public.ad_impressions (campaign_id);
CREATE INDEX IF NOT EXISTS idx_fk_ad_impressions_user_id ON public.ad_impressions (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_affiliate_referrals_affiliate_link_id ON public.affiliate_referrals (affiliate_link_id);
CREATE INDEX IF NOT EXISTS idx_fk_affiliate_referrals_referred_user_id ON public.affiliate_referrals (referred_user_id);
CREATE INDEX IF NOT EXISTS idx_fk_audit_logs_actor_id ON public.audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_fk_availability_slots_service_id ON public.availability_slots (service_id);
CREATE INDEX IF NOT EXISTS idx_fk_availability_slots_staff_member_id ON public.availability_slots (staff_member_id);
CREATE INDEX IF NOT EXISTS idx_fk_bookings_availability_slot_id ON public.bookings (availability_slot_id);
CREATE INDEX IF NOT EXISTS idx_fk_bookings_staff_member_id ON public.bookings (staff_member_id);
CREATE INDEX IF NOT EXISTS idx_fk_cart_product_id ON public.cart (product_id);
CREATE INDEX IF NOT EXISTS idx_fk_cart_user_id ON public.cart (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_cart_items_product_id ON public.cart_items (product_id);
CREATE INDEX IF NOT EXISTS idx_fk_challenge_participants_user_id ON public.challenge_participants (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_collections_user_id ON public.collections (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_content_sentiments_user_id ON public.content_sentiments (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_copilot_messages_user_id ON public.copilot_messages (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_creator_wallet_ledger_vendor_id ON public.creator_wallet_ledger (vendor_id);
CREATE INDEX IF NOT EXISTS idx_fk_customer_subscriptions_plan_id ON public.customer_subscriptions (plan_id);
CREATE INDEX IF NOT EXISTS idx_fk_demand_signals_product_id ON public.demand_signals (product_id);
CREATE INDEX IF NOT EXISTS idx_fk_drop_waitlist_user_id ON public.drop_waitlist (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_feed_posts_product_id ON public.feed_posts (product_id);
CREATE INDEX IF NOT EXISTS idx_fk_feed_posts_service_id ON public.feed_posts (service_id);
CREATE INDEX IF NOT EXISTS idx_fk_flash_drops_product_id ON public.flash_drops (product_id);
CREATE INDEX IF NOT EXISTS idx_fk_fraud_events_vendor_id ON public.fraud_events (vendor_id);
CREATE INDEX IF NOT EXISTS idx_fk_fraud_logs_user_id ON public.fraud_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_fraud_logs_vendor_id ON public.fraud_logs (vendor_id);
CREATE INDEX IF NOT EXISTS idx_fk_inventory_holds_drop_id ON public.inventory_holds (drop_id);
CREATE INDEX IF NOT EXISTS idx_fk_inventory_holds_product_id ON public.inventory_holds (product_id);
CREATE INDEX IF NOT EXISTS idx_fk_inventory_holds_user_id ON public.inventory_holds (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_invoices_user_id ON public.invoices (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_invoices_vendor_id ON public.invoices (vendor_id);
CREATE INDEX IF NOT EXISTS idx_fk_ledger_entries_order_id ON public.ledger_entries (order_id);
CREATE INDEX IF NOT EXISTS idx_fk_live_tips_session_id ON public.live_tips (session_id);
CREATE INDEX IF NOT EXISTS idx_fk_live_tips_user_id ON public.live_tips (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_live_tips_vendor_id ON public.live_tips (vendor_id);
CREATE INDEX IF NOT EXISTS idx_fk_membership_tiers_vendor_id ON public.membership_tiers (vendor_id);
CREATE INDEX IF NOT EXISTS idx_fk_memberships_tier_id ON public.memberships (tier_id);
CREATE INDEX IF NOT EXISTS idx_fk_memberships_vendor_id ON public.memberships (vendor_id);
CREATE INDEX IF NOT EXISTS idx_fk_order_items_product_id ON public.order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_fk_orders_vendor_id ON public.orders (vendor_id);
CREATE INDEX IF NOT EXISTS idx_fk_payments_vendor_id ON public.payments (vendor_id);
CREATE INDEX IF NOT EXISTS idx_fk_payout_queue_vendor_id ON public.payout_queue (vendor_id);
CREATE INDEX IF NOT EXISTS idx_fk_payouts_vendor_id ON public.payouts (vendor_id);
CREATE INDEX IF NOT EXISTS idx_fk_platform_subscriptions_user_id ON public.platform_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_pos_sales_product_id ON public.pos_sales (product_id);
CREATE INDEX IF NOT EXISTS idx_fk_post_comments_post_id ON public.post_comments (post_id);
CREATE INDEX IF NOT EXISTS idx_fk_post_comments_reel_id ON public.post_comments (reel_id);
CREATE INDEX IF NOT EXISTS idx_fk_post_comments_user_id ON public.post_comments (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_post_reactions_post_id ON public.post_reactions (post_id);
CREATE INDEX IF NOT EXISTS idx_fk_post_reactions_reel_id ON public.post_reactions (reel_id);
CREATE INDEX IF NOT EXISTS idx_fk_products_category_id ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_fk_reels_product_id ON public.reels (product_id);
CREATE INDEX IF NOT EXISTS idx_fk_saved_posts_collection_id ON public.saved_posts (collection_id);
CREATE INDEX IF NOT EXISTS idx_fk_saved_posts_post_id ON public.saved_posts (post_id);
CREATE INDEX IF NOT EXISTS idx_fk_saved_posts_reel_id ON public.saved_posts (reel_id);
CREATE INDEX IF NOT EXISTS idx_fk_service_plans_service_id ON public.service_plans (service_id);
CREATE INDEX IF NOT EXISTS idx_fk_session_enrollments_subscription_id ON public.session_enrollments (subscription_id);
CREATE INDEX IF NOT EXISTS idx_fk_staff_members_vendor_id ON public.staff_members (vendor_id);
CREATE INDEX IF NOT EXISTS idx_fk_story_views_user_id ON public.story_views (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_user_behavior_events_user_id ON public.user_behavior_events (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_vendor_kyc_vendor_id ON public.vendor_kyc (vendor_id);
