# LookFinesse — Vercel production checklist (Hobby)

Kenya-first fashion, beauty, and fitness marketplace. Deploy on the **Vercel Hobby** plan. Hobby cron jobs may run **once per day**; `vercel.json` stays on `0 3 * * *` (03:00 UTC) and calls `GET /api/payments/reconcile`.

Never commit secrets. Copy names from `.env.example` into the Vercel project (**Settings → Environment Variables**) and into `.env.local` for local dev. `NEXT_PUBLIC_*` values are inlined at **build** time — set them before the production build, then redeploy if you change them.

`npm run build` succeeds with **no** env vars. Missing Supabase, OpenAI, Stripe, M-Pesa, Resend, Google Maps, or `CRON_SECRET` degrades at runtime (empty data, demo AI, 503 on payment routes, 401 on cron). Nothing throws at import time.

## 1. Database (once per Supabase project)

Run in the **Supabase SQL editor**, in this order. Each step is idempotent (safe to re-run).

| Order | What | File |
|------:|------|------|
| 1 | Full schema on an empty project | `supabase/migrations/000_fresh_bootstrap.sql` |
| 2 | Signup/nearby + vendor create RLS + buckets + demo logins | `supabase/GO_LIVE.sql` |

`GO_LIVE.sql` is one paste. It applies, in order:

1. `supabase/migrations/028_signup_nearby_geo.sql`
2. `supabase/migrations/029_vendor_create_rls.sql`
3. Storage buckets `products`, `product-images`, `profile-media` (public) and RLS policies
4. Demo auth users + roles from `docs/SEED_CREDENTIALS.md` (and the three vendor rows those logins attach to)

Legacy databases that already ran `000` can paste **only** `GO_LIVE.sql`. Do not run `001` first on an empty database.

Optional catalog and finance KPIs (also idempotent, after `GO_LIVE.sql`): `supabase/seed.sql`, then `supabase/seed_demo_metrics.sql`, then `supabase/seed_admin_finance.sql`.

If the SQL editor prints `must be owner of table objects` for storage, the script continues and the buckets/policies need the Dashboard instead:

1. **Storage → New bucket** for `products`, `product-images`, and `profile-media`. Public **on**. File size limit `52428800`.
2. Policies (Storage → bucket → Policies → New policy → full customization):

| Bucket | Policy name | Op | Roles | Expression |
|--------|-------------|----|-------|------------|
| `products` | `products_bucket_public_read` | SELECT | public | `bucket_id = 'products'` |
| `products` | `products_bucket_auth_insert` | INSERT | authenticated | `bucket_id = 'products'` |
| `products` | `products_bucket_auth_update` | UPDATE | authenticated | `bucket_id = 'products'` |
| `products` | `products_bucket_auth_delete` | DELETE | authenticated | `bucket_id = 'products'` |
| `product-images` | `product_images_public_read` | SELECT | public | `bucket_id = 'product-images'` |
| `product-images` | `product_images_auth_insert` | INSERT | authenticated | `bucket_id = 'product-images'` |
| `product-images` | `product_images_auth_update` | UPDATE | authenticated | `bucket_id = 'product-images'` |
| `product-images` | `product_images_auth_delete` | DELETE | authenticated | `bucket_id = 'product-images'` |
| `profile-media` | `profile_media_public_read` | SELECT | public | `bucket_id = 'profile-media'` |
| `profile-media` | `profile_media_auth_insert` | INSERT | authenticated | `bucket_id = 'profile-media' AND (storage.foldername(name))[1] = auth.uid()::text` |
| `profile-media` | `profile_media_auth_update` | UPDATE | authenticated | same as insert |
| `profile-media` | `profile_media_auth_delete` | DELETE | authenticated | same as insert |

Demo logins (password `Test123456!` for all):

| Email | Role |
|-------|------|
| `vendor@test.com` | Vendor — EliteFit Gym (fitness) |
| `glow@test.com` | Vendor — Glow Salon & Spa (beauty) |
| `style@test.com` | Vendor — Style Bank (fashion) |
| `admin@test.com` | Platform admin |
| `user@test.com` | Shopper |

## 2. Environment variables

Set these on Vercel for **Production** (and Preview if you want preview auth). Leave a value blank to keep that integration off.

| Name | Required | Where to get it |
|------|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes, for a live app | Supabase Dashboard → **Project Settings → API** → Project URL. Form `https://<project-ref>.supabase.co` (no trailing slash). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes, for a live app | Same page → **anon public** key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes, for webhooks and admin reads past RLS | Same page → **service_role** secret. Server only. Never expose to the browser. |
| `NEXT_PUBLIC_BASE_URL` | Yes | Your production origin, no trailing slash. Example: `https://your-app.vercel.app`. Used when a request has no `Host` (cron, scripts). |
| `NEXT_PUBLIC_APP_URL` | No | Optional alias of the same origin. `getEnvBaseUrl()` falls back to it when `NEXT_PUBLIC_BASE_URL` is unset. |
| `MPESA_CONSUMER_KEY` | For M-Pesa | [Safaricom Daraja](https://developer.safaricom.co.ke/) → your app → Consumer Key. Sandbox first, then production keys. |
| `MPESA_CONSUMER_SECRET` | For M-Pesa | Same Daraja app → Consumer Secret. |
| `MPESA_SHORTCODE` | For M-Pesa | Daraja Lipa Na M-Pesa Online shortcode (Paybill / Till). |
| `MPESA_PASSKEY` | For M-Pesa | Daraja → Lipa Na M-Pesa Online → Passkey. |
| `MPESA_INITIATOR` | For B2C payouts | Daraja B2C initiator username. |
| `MPESA_SECURITY_CREDENTIAL` | For B2C payouts | Daraja encrypted security credential for that initiator. |
| `NEXT_PUBLIC_MPESA_ENABLED` | For checkout UI | Set to `1` to show M-Pesa on `/checkout`. Omit to hide it. Still needs the Daraja keys above for a live STK push. |
| `STRIPE_SECRET_KEY` | For card checkout | Stripe Dashboard → **Developers → API keys** → Secret key (`sk_live_...` in production). |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | For card checkout UI | Same page → Publishable key (`pk_live_...`). |
| `STRIPE_WEBHOOK_SECRET` | For Stripe webhooks | Stripe → **Developers → Webhooks** → your endpoint → Signing secret (`whsec_...`). |
| `STRIPE_CONNECT_CLIENT_ID` | No | Stripe Connect → settings, client id (`ca_...`). Reserved; vendor Connect onboarding currently uses `STRIPE_SECRET_KEY` only. |
| `OPENAI_API_KEY` | No | [platform.openai.com/api-keys](https://platform.openai.com/api-keys). Stylist, beauty, fitness, and copilot fall back to demo copy when this is empty. |
| `OPENAI_MODEL_FAST` | No | Overrides the fast model. Default `gpt-4o-mini`. |
| `OPENAI_MODEL_DEEP` | No | Overrides the deep model. Default `gpt-4o`. |
| `RESEND_API_KEY` | No | [resend.com/api-keys](https://resend.com/api-keys). Alerts are skipped when unset. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No | Google Cloud Console → APIs → enable **Maps JavaScript API** → create an API key. Nearby lists still work without a map. |
| `CRON_SECRET` | Yes, before relying on cron | Generate a long random string (for example `openssl rand -hex 32`). Vercel sends it as `Authorization: Bearer <CRON_SECRET>` on the daily cron. Routes reject every caller when this is unset. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | No | Web Push public key if you enable full push. Notifications still work locally without it. |

Vercel sets `VERCEL_URL` and `NODE_ENV` itself. Do not commit them.

After the first production deploy, confirm flags (booleans only, no secret values):

```bash
curl -sS https://YOUR_DOMAIN/api/health
```

Expect `"ok": true` and `integrations.supabase`, `integrations.stripe`, `integrations.mpesa`, `integrations.cron`, and the rest as `true` or `false`.

## 3. Supabase Auth redirect URLs (Google OAuth)

Google is configured **in Supabase**, not as a LookFinesse env var.

1. Google Cloud Console → **APIs & Services → Credentials** → OAuth 2.0 Client. Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
2. Supabase Dashboard → **Authentication → Providers → Google**: enable, paste the Google client id and secret.
3. Supabase Dashboard → **Authentication → URL Configuration**:
   - **Site URL:** `{BASE_URL}` (the same origin as `NEXT_PUBLIC_BASE_URL`, no trailing slash).
   - **Redirect URLs** (add each):
     - `{BASE_URL}/auth/callback`
     - `http://localhost:3000/auth/callback` (local only)
4. Password reset emails should also allow `{BASE_URL}/auth/reset-password`.

`{BASE_URL}` is your production origin, for example `https://your-app.vercel.app`.

## 4. Stripe webhook

Stripe Dashboard → **Developers → Webhooks → Add endpoint**.

- **URL:** `{BASE_URL}/api/stripe/webhook`
- **Events:** `checkout.session.completed`, `customer.subscription.updated`, `invoice.paid`
- Copy the signing secret into `STRIPE_WEBHOOK_SECRET` and redeploy.

## 5. M-Pesa callback URLs

Daraja callbacks must be public **HTTPS**. The app builds them from the request origin (`getRequestOrigin`). Register the same paths on the Daraja app / shortcode:

| Use | URL |
|-----|-----|
| STK Push `CallBackURL` | `{BASE_URL}/api/mpesa/callback` |
| B2C payout `ResultURL` | `{BASE_URL}/api/mpesa/payout-result` |
| B2C payout `QueueTimeOutURL` | `{BASE_URL}/api/mpesa/payout-timeout` |

There is also `POST /api/mpesa/payout-callback` for an alternate payout payload. The execute route registers the two URLs in the table above.

## 6. Cron

`vercel.json`:

```json
{ "path": "/api/payments/reconcile", "schedule": "0 3 * * *" }
```

Hobby allows this daily schedule. Every `/api/cron/*` route, plus this reconcile job and `POST /api/subscriptions/reminders`, requires `Authorization: Bearer <CRON_SECRET>`. With the env var set, Vercel attaches that header automatically. A manual check:

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" https://YOUR_DOMAIN/api/payments/reconcile
```

Without the header the response is `401`.

## 7. Smoke test

1. Open `{BASE_URL}/api/health` and confirm `integrations.supabase` is `true`.
2. Log in as `vendor@test.com` / `Test123456!`. You should land on `/dashboard`.
3. On `/dashboard`, the summary cards render, and the sidebar / drawer links navigate when clicked (they are not dead controls).
4. Open **Create product** (`/dashboard/create-product` or the dashboard create action). Submit a product with a name and price. It saves (image upload needs the `product-images` bucket).
5. Optional: log out, then log in as `admin@test.com` and confirm `/admin` opens; `vendor@test.com` must not.
6. Optional: Google sign-in returns to `{BASE_URL}/auth/callback` and then the app, not a Supabase error page.
