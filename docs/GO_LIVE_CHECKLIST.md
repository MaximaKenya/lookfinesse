# LookFinesse — Vercel production checklist (Hobby)

Kenya-first fashion, beauty, and fitness marketplace. Deploy on the **Vercel Hobby** plan. Hobby cron jobs may run **once per day**; `vercel.json` stays on `0 3 * * *` (03:00 UTC) and calls `GET /api/payments/reconcile`.

Never commit secrets. Copy names from `.env.example` into the Vercel project (**Settings → Environment Variables**) and into `.env.local` for local dev. `NEXT_PUBLIC_*` values are inlined at **build** time — set them before the production build, then redeploy if you change them.

`npm run build` succeeds with **no** env vars. Missing Supabase, Groq, Paystack, Resend, Google Maps, or `CRON_SECRET` degrades at runtime (empty data, local AI copy, 503 on payment routes, 401 on cron). Nothing throws at import time.

## 1. Database (once per Supabase project)

Run in the **Supabase SQL editor**, in this order. Each step is idempotent (safe to re-run).

Paste **`supabase/GO_LIVE.sql` once**. It is the full idempotent script:

1. `000_fresh_bootstrap.sql` (this supersedes migrations `001`–`020`; do not run those after it)
2. Migrations `021` through `030` (bookings, categories, Paystack reference, indexes, RLS where a policy already exists)
3. Storage buckets `products`, `product-images`, `profile-media` and their RLS policies
4. Demo auth users and roles from `docs/SEED_CREDENTIALS.md`
5. The Nairobi catalog seed (vendors, products, services, posts, reels, live sessions)

Do not run `001` first on an empty database. Do not paste `seed_demo_metrics.sql` — dashboards read real rows, and empty finance is an empty state.

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
| `PAYSTACK_SECRET_KEY` | For checkout, payouts, and webhooks | [Paystack Dashboard → Settings → API Keys & Webhooks](https://dashboard.paystack.com/#/settings/developers). Use the **test** secret (`sk_test_...`) until you are told to switch. |
| `PAYSTACK_PUBLIC_KEY` | For any client Paystack.js use | Same page → **test** public key (`pk_test_...`). Checkout itself redirects server-side, but keep the key set. |
| `GROQ_API_KEY` | For live AI | [console.groq.com/keys](https://console.groq.com/keys). Stylist, beauty, fitness, copilot, and weather outfit tips fall back to local copy when this is empty. |
| `GROQ_MODEL` | No | Overrides the model. Default `llama-3.3-70b-versatile`. |
| `RESEND_API_KEY` | No | [resend.com/api-keys](https://resend.com/api-keys). Alerts are skipped when unset. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No | Google Cloud Console → APIs → enable **Maps JavaScript API** → create an API key. Nearby lists still work without a map. |
| `CRON_SECRET` | Yes, before relying on cron | Generate a long random string (for example `openssl rand -hex 32`). Vercel sends it as `Authorization: Bearer <CRON_SECRET>` on the daily cron. Routes reject every caller when this is unset. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | No | Web Push public key if you enable full push. Notifications still work locally without it. |

Vercel sets `VERCEL_URL` and `NODE_ENV` itself. Do not commit them.

After the first production deploy, confirm flags (booleans only, no secret values):

```bash
curl -sS https://YOUR_DOMAIN/api/health
```

Expect `"ok": true` and `integrations.supabase`, `integrations.groq`, `integrations.paystack`, `integrations.cron`, and the rest as `true` or `false`.

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

## 4. Paystack (test mode)

Stay on **test** keys until you are told otherwise. Card, M-Pesa (mobile money), bank transfer, bank, and USSD are requested on each charge. Currency is KES.

Paystack Dashboard → **Settings → API Keys & Webhooks**.

- **Webhook URL:** `{BASE_URL}/api/paystack/webhook`
- The route checks `x-paystack-signature` (HMAC-SHA512 of the raw body with `PAYSTACK_SECRET_KEY`), ignores events whose metadata `app` is not `lookfinesse`, and grants value only after `GET /transaction/verify/:reference`.
- Each charge sets `reference` to `LF-<uuid>`, `metadata.app` to `lookfinesse`, and `callback_url` to `{BASE_URL}/payments/paystack/callback`.
- The daily cron re-verifies pending Paystack payments the same way.

## 5. Payments no longer include Stripe or Daraja

Stripe and Safaricom Daraja are not part of this app. Do not set `STRIPE_*`, `OPENAI_*`, or `MPESA_*`. M-Pesa checkout is the Paystack `mobile_money` channel.

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
