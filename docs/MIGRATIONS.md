# Database Migrations

Run these in the **Supabase SQL Editor** (Dashboard → SQL → New query).

## Fresh project (empty Supabase — start here)

If you have a **new empty project** (no tables yet), use this path. Do **not** run `001_social_commerce.sql` first — it will fail with `relation "feed_posts" does not exist`.

### Ordered steps

| Step | File / action | Purpose |
|------|----------------|---------|
| **1** | `supabase/migrations/000_fresh_bootstrap.sql` | Creates the **entire** LookFinesse schema (core + social + commerce + finance minimal + RLS + categories seed) |
| **2** | `supabase/seed_auth_users.sql` | Creates login accounts — see **`docs/SEED_CREDENTIALS.md`** |
| **3** | `supabase/seed_auth_roles.sql` | Links auth users → `user_roles`, vendor profile, `user_profiles`, **30-day Pro trial** |
| **4** | `supabase/seed.sql` | Demo vendors, products, feed, bookings, ads |
| **5** | `supabase/seed_demo_metrics.sql` | Orders, wallets, ledger, payouts, Pro trial — **non-zero** `/dashboard` & `/vendor/finance`. **Re-run anytime** if KPIs show zeros. |
| **6** | Dashboard → Storage → New bucket **`profile-media`** (public) | Required for profile avatar/banner uploads — **not** created by `000` (Dashboard-only on many hosted projects) |

After step 5 you can log in and use the app with populated KPIs. **Skip migrations 001–024** unless you are repairing a legacy install (see below). Legacy installs that already ran an older `000` should also run **`025_platform_subscription_trial.sql`** (trialing status) and **`026_platform_subscriptions_rls.sql`** (owner RLS for trial inserts) before seeding trial rows.

### What `000_fresh_bootstrap.sql` includes

- Core: `vendors`, `stores`, `products`, `services`, `orders`, `order_items`, `categories`, `user_profiles`, `user_roles`
- Social: `feed_posts`, `reels`, `post_reactions`, `post_comments`, `collections`, `saved_posts`, `follows`, `notifications`, `creator_profiles`, stories, challenges, etc.
- Commerce: `bookings`, `availability_slots`, `staff_members`, `platform_subscriptions`, `ad_campaigns`, `affiliate_links`
- Finance (minimal): `ledger_entries`, `vendor_wallets`, `wallet_balances`, `payouts`, `payments`, `audit_logs`, etc.
- Analytics: `content_sentiments`, `user_interests`, `user_behavior_events`
- RLS policies (migration 006 equivalent), reaction unique indexes (014), category seed (013)
- Storage buckets: `products`, `product-images` only — **not** `profile-media`

---

## Legacy project (001–020 incremental path)

Use this only if the project **already had** base tables before the social migrations were added.

Run **001 → 020** in order. Each file is idempotent (`IF NOT EXISTS` / conditional guards).

| # | File | Purpose |
|---|------|---------|
| 001 | `001_social_commerce.sql` | Social feed, follows, notifications — **requires existing `feed_posts`** |
| 002 | `002_stories_affiliates_tips.sql` | Stories, affiliates, tips |
| 003 | `003_ad_campaigns.sql` | Ad campaigns, impressions, clicks |
| 004 | `004_vendors_geo_profiles.sql` | Vendors geo & profile columns |
| 005 | `005_categories.sql` | Admin-managed categories |
| 006 | `006_rls_policies.sql` | Row-level security policies |
| 007 | `007_profile_media_preferences.sql` | Profile media & preferences |
| 008 | `008_creator_commerce_columns.sql` | Creator commerce columns |
| 009 | `009_platform_subscriptions_ads_revamp.sql` | Platform subscriptions + ad status revamp |
| 010 | `010_ensure_ad_campaigns_and_deps.sql` | Fix-up if 003/009 were skipped |
| 011 | `011_subscription_enforcement.sql` | Fan tier gates + ad credit wallet |
| 012 | `012_unified_schema_fix.sql` | Optional safety net (safe to run anytime) |
| 013 | `013_categories_unique_and_sentiment.sql` | Category slug/name uniqueness + `content_sentiments` |
| 014 | `014_one_reaction_per_user.sql` | One emoji reaction per user per post/reel |
| 015 | `015_user_profile_fields.sql` | `user_profiles` geo/locale columns |
| 016 | `016_reactions_reel_id_fix.sql` | Repair if 014 failed on missing `reel_id` |
| 017 | `017_user_profiles_timestamps_and_media.sql` | Timestamps + `products` bucket |
| 018 | `018_user_profiles_bio_and_fields.sql` | Bio, display_name, media columns |
| 019 | `019_profile_media_bucket.sql` | Standalone `profile-media` bucket + RLS |
| 020 | `020_bookings_table.sql` | Bookings table |
| 021 | `021_service_subscriptions.sql` | Service plans, customer subs, class sessions |
| 022 | `022_canonical_categories.sql` | Canonical categories |
| 023 | `023_booking_availability_seed.sql` | Booking availability seed |
| 024 | `024_bookings_fk_and_capacity.sql` | Bookings FK + capacity |
| 025 | `025_platform_subscription_trial.sql` | `trialing` status + `trial_ends_at` for free trials |
| 026 | `026_platform_subscriptions_rls.sql` | RLS SELECT/INSERT/UPDATE for own `platform_subscriptions` (+ vendors insert) |

### Virtual Dresser preferences (no new migration)

Virtual Dresser stores user sizing and avatar prefs in **`user_profiles.preferences`** JSONB. Example shape:

```json
{
  "dresser": {
    "size": "M",
    "heightCm": 170,
    "weightKg": 65,
    "gender": "female",
    "skinTone": "medium",
    "avatarUrl": null,
    "avatarMode": "svg"
  }
}
```

Included in `000_fresh_bootstrap.sql` via `user_profiles.preferences`.

### Product limits by subscription tier

Enforced in app code (`platformEntitlements.maxProducts`), not a DB column:

| Tier | Max products |
|------|----------------|
| Starter | 10 |
| Pro | 50 |
| Elite | unlimited |

---

## Broken / partial state (recommended repair)

If migrations **001, 005, 006, 010, or 011** already failed, do **not** re-run the failed files individually on a broken empty DB — run **`000_fresh_bootstrap.sql`** instead.

If you have a **partial legacy** install with some tables:

1. Run **`012_unified_schema_fix.sql`**
2. Run **`013_categories_unique_and_sentiment.sql`**
3. Run any migrations not yet applied (see table above)

Minimal path after partial failure:

```
012_unified_schema_fix.sql  →  013_categories_unique_and_sentiment.sql  →  006_rls_policies.sql (if 006 failed)  →  007  →  008  →  014  →  015
```

---

## Migration 014 / 016 — reactions `reel_id` repair

If **`014_one_reaction_per_user.sql`** fails with:

```
ERROR: column a.reel_id does not exist
```

Run **`016_reactions_reel_id_fix.sql`** (or use `000` on a fresh project — already includes `reel_id` + unique indexes).

---

## What each error meant

| Error | Cause |
|-------|-------|
| `relation "feed_posts" does not exist` (001) | Empty DB — run **`000_fresh_bootstrap.sql`** first, not 001 |
| `column "starts_at" does not exist` (001) | Legacy `availability_slots` without `starts_at` |
| `column "slug" of relation "categories" does not exist` (005) | Legacy categories table |
| `relation "collections" does not exist` (006) | Migration 001 failed before creating social tables |
| `platform_subscriptions does not exist` (011) | Migration 009 never ran |
| `Could not find updated_at column of user_profiles` (017) | Legacy `user_profiles` — included in `000` |
| `Could not find the 'bio' column of 'user_profiles'` (018) | Legacy `user_profiles` — included in `000` |

---

## Seed data

After schema is ready:

1. `supabase/seed_auth_users.sql`
2. `supabase/seed_auth_roles.sql`
3. `supabase/seed.sql`

See **`docs/SEED_CREDENTIALS.md`** for test login accounts.

---

## Sentiment API paths

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/analytics/sentiment/overview` | Positive %, feed health, trending negative topics |
| `POST` | `/api/analytics/sentiment/sync` | Batch backfill from `feed_posts` + `post_comments` |

Sentiment is queued on `POST /api/comments` and `POST /api/feed`.
