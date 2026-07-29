# Seed Test Credentials

```
vendor@test.com / Test123456!
admin@test.com  / Test123456!
user@test.com   / Test123456!
```

Demo data lives in `supabase/seed.sql` plus `supabase/seed_demo_metrics.sql` (orders, wallets, ledger — non-zero `/dashboard` and `/vendor/finance` KPIs). Auth login accounts are created by **`supabase/seed_auth_users.sql`** (not the Dashboard). User-dependent rows resolve `user_id` from `auth.users` by email — never fake UUID users.

## Free trial (new vendors)

New vendors get a **30-day Pro trial** (`platform_subscriptions.status = trialing`, `tier = pro`, `current_period_end` / `trial_ends_at` = now + 30 days):

| Trigger | Where |
|---------|--------|
| Vendor signup / create store | `POST` store → `GET /api/platform-subscriptions` calls `ensureVendorTrial` |
| First vendor dashboard access | `GET /api/platform-subscriptions` (idempotent) |
| Seed roles | `supabase/seed_auth_roles.sql` inserts trial for `vendor@test.com` if no paid sub |
| Seed demo | `supabase/seed.sql` + `seed_demo_metrics.sql` keep trial unless already `active` + paid |

`trialing` is treated as **full Pro access** (same entitlements as paid Pro) until the period ends — see `lib/subscriptions/vendorSubscription.ts`, `apiGate.ts`, and `proxy.ts`. Dashboard shows **"Free trial — X days left"** with a CTA to `/dashboard/subscription`.

Legacy DBs: run **`supabase/migrations/025_platform_subscription_trial.sql`** before seeding trial rows (adds `trialing` to the status check + `trial_ends_at`). Fresh `000_fresh_bootstrap.sql` already includes these.

## RBAC test accounts

| Email | Password | Role | What you can access |
|-------|----------|------|---------------------|
| `admin@test.com` | `Test123456!` | **Platform admin** | **Full exclusive access** — bypasses every `PlatformSubscriptionGate`, nav entitlement lock, and proxy vendor tier check. Sees **all** nav (consumer + vendor + admin). Allowed on `/dashboard`, `/vendor/*`, `/admin/*`, `/finance`, `/intelligence`, and all create flows. `useUserRole().isAdmin === true` unlocks everything. Also: KYC reviews, ledger, treasury, risk, categories. |
| `vendor@test.com` | `Test123456!` | **Vendor / creator** | Creator Studio, `/dashboard`, `/vendor/*`, shop & feed publishing — **Pro trial** by default after seed; gated by Starter/Pro/Elite after trial ends |
| `user@test.com` | `Test123456!` | **Buyer / fan** | Feed, shop, checkout, bookings, fan memberships, profile — no vendor or admin routes |

Optional second vendor: `glow@test.com` — **Glow Salon & Spa** service provider store (not a seeded login account).

---

## Fresh project — exact setup order

### Step 1: Bootstrap schema

1. Open **Supabase Dashboard** → your project
2. Click **SQL** in the left sidebar
3. Click **New query**
4. Open `supabase/migrations/000_fresh_bootstrap.sql` in your repo, copy **all** contents, paste into the editor
5. Click **Run** (or Ctrl+Enter)
6. Confirm success — no errors in the results panel

### Step 2: Create auth users (SQL)

1. **SQL** → **New query**
2. Paste and run **`supabase/seed_auth_users.sql`**
3. Creates `vendor@test.com`, `admin@test.com`, and `user@test.com` with password `Test123456!`
4. Inserts into `auth.users` + `auth.identities` (bcrypt via `pgcrypto` — works with GoTrue sign-in)
5. Safe to re-run; skips accounts that already exist by email

### Step 3: Link roles & vendor (+ trial)

1. **SQL** → **New query**
2. Paste and run **`supabase/seed_auth_roles.sql`**
3. This inserts `user_roles`, links `vendor@test.com` → EliteFit Gym (`a1000000-…0001`), creates `user_profiles`, and starts a **30-day Pro trial** when no paid subscription exists

### Step 4: Demo catalog

1. **SQL** → **New query**
2. Paste and run **`supabase/seed.sql`**
3. Safe to re-run (`ON CONFLICT DO NOTHING`)

**Required before `seed.sql`:** at least `user@test.com` or `vendor@test.com` must exist (Step 2). Demo notifications and bookings attach to `user@test.com` (fallback: `vendor@test.com`). Platform subscription rows attach to `vendor@test.com`. If no matching auth user exists, `seed.sql` skips those rows and prints a `NOTICE` instead of failing.

### Step 5: Demo metrics (dashboard / finance KPIs)

1. **SQL** → **New query**
2. Paste and run **`supabase/seed_demo_metrics.sql`**
3. Seeds paid orders, order_items, non-zero wallets, ledger_entries, payouts, KYC/risk, Pro **trialing** sub, and links EliteFit products to the vendor store
4. After this, `/dashboard` and `/vendor/finance` show real figures for `vendor@test.com`

**If dashboards show all zeros or finance wallets are empty:** re-run **`supabase/seed_demo_metrics.sql`** in the SQL editor (safe / idempotent). Also re-run **`supabase/seed_auth_roles.sql`** if `vendor@test.com` has no Pro trial (`platform_subscriptions.status = trialing`). Legacy DBs need **`025_platform_subscription_trial.sql`** first so `trialing` is allowed.

### Step 6: Profile media bucket (Dashboard only)

`000_fresh_bootstrap.sql` does **not** create `profile-media` (hosted Supabase often blocks storage bucket SQL).

1. **Storage** → **New bucket**
2. Name: **`profile-media`**
3. **Public bucket:** ON
4. Create

For upload policies, run the storage RLS section of `017_user_profiles_timestamps_and_media.sql` or `019_profile_media_bucket.sql` (policies only — skip bucket INSERT if it fails).

Product/feed uploads use the **`products`** and **`product-images`** buckets (created by `000`).

---

## Manual SQL (if you skip seed_auth_roles.sql)

```sql
-- Roles
INSERT INTO user_roles (user_id, role)
SELECT id, 'vendor' FROM auth.users WHERE email = 'vendor@test.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'admin@test.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'user' FROM auth.users WHERE email = 'user@test.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Link vendor account (EliteFit Gym)
UPDATE vendors
SET user_id = (SELECT id FROM auth.users WHERE email = 'vendor@test.com')
WHERE id = 'a1000000-0000-0000-0000-000000000001';

-- Admin app_metadata
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
WHERE email = 'admin@test.com';

-- User profile
INSERT INTO user_profiles (user_id, display_name, city)
SELECT id, 'Demo User', 'Nairobi' FROM auth.users WHERE email = 'user@test.com'
ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name;
```

---

## Password reset (Supabase Auth)

Forgot-password flow: `/forgot-password` → email link → `/auth/reset-password`.

**Supabase Dashboard → Authentication → Email templates**

1. Configure **Reset password** template with redirect to your app origin.
2. Add site URL / redirect URLs: `http://localhost:3000/auth/reset-password` (dev) and production URL.
3. Ensure SMTP (or Supabase mail) is enabled so reset emails deliver in staging/prod.

---

## Notes

- **`admin@test.com` has full exclusive access** — `isAdmin` bypasses `PlatformSubscriptionGate`, `filterNavByEntitlements` / `vendorCanAccessPath`, and `proxy.ts` vendor tier checks. Admin sidebars merge vendor + admin nav (Finance groups renamed to avoid duplicate React keys).
- Seed emails like `elitefit@vyb.co.ke` are **vendor business contacts**, not login accounts.
- Re-running `seed_auth_users.sql`, `seed.sql`, and `seed_demo_metrics.sql` is safe.
- If Dashboard user creation fails, use `seed_auth_users.sql` instead — it does not require the Auth UI.
- Platform subscription enforcement: see `lib/subscriptions/platformEntitlements.ts`.
- Fan tier enforcement: see `lib/subscriptions/fanEntitlements.ts`.
- Payments go-live: see `docs/PAYMENTS_PRODUCTION.md`.
- Live integrations checklist: see `docs/LIVE_INTEGRATIONS.md`.
- Full migration reference: see `docs/MIGRATIONS.md`.
