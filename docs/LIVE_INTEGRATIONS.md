# Live environment integrations

Everything required for production end-to-end (auth → browse → checkout → payouts → AI → email). Set these on your host (Heroku config vars / Vercel env / etc.). Never commit secrets.

Priority: **P0** = app will not run or auth fails · **P1** = core commerce broken · **P2** = optional / degraded features.

| Priority | Integration | Env vars | Notes |
|----------|-------------|----------|-------|
| **P0** | **Supabase (Auth + DB)** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Project must be live (not paused). Run migrations + seed (`docs/SEED_CREDENTIALS.md`). Service role for webhooks / server writes only. |
| **P0** | **App base URL** | `NEXT_PUBLIC_BASE_URL` (also `NEXT_PUBLIC_APP_URL` if set on Heroku) | Public HTTPS origin. Used for OAuth redirects, M-Pesa callbacks, Stripe return URLs. No trailing slash. |
| **P0** | **Hosting** | `NODE_ENV=production`, `PORT` (Heroku), `NODE_OPTIONS` if OOM | Heroku: `docs/HEROKU.md`. Bind `0.0.0.0`. |
| **P1** | **Supabase Storage** | (same Supabase keys) | Buckets: `products`, `product-images`, `profile-media` (public). See `docs/STORAGE_SETUP.md`. |
| **P1** | **Google OAuth** | Configured in **Supabase Dashboard** → Auth → Providers (not app env) | Add redirect URLs: `{BASE_URL}/auth/callback` (and local). Enable Google provider + client ID/secret in Supabase. |
| **P1** | **M-Pesa (Daraja)** | `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`; payouts: `MPESA_INITIATOR`, `MPESA_SECURITY_CREDENTIAL` | Callbacks at `{ORIGIN}/api/mpesa/*`. Details: `docs/PAYMENTS_PRODUCTION.md`. |
| **P1** | **Stripe** | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`; optional `STRIPE_CONNECT_CLIENT_ID` | Webhook: `{ORIGIN}/api/stripe/webhook`. Live mode keys for prod. |
| **P2** | **OpenAI** | `OPENAI_API_KEY` | Stylist, beauty, fitness, intelligence / copilot. App degrades without it. |
| **P2** | **Resend** | `RESEND_API_KEY` | Transactional / alert email. |
| **P2** | **Maps** | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Nearby / map widgets (`@react-google-maps/api`). |
| **P2** | **Cron / jobs** | `CRON_SECRET` | Protect `/api/cron/*` (or scheduled workers) with `Authorization: Bearer $CRON_SECRET`. |

## Quick production checklist

1. Supabase project live + migrations + `seed_auth_users.sql` / roles / `seed.sql`
2. Storage buckets + RLS policies
3. `NEXT_PUBLIC_BASE_URL` = production HTTPS URL
4. Google OAuth redirect allow-list in Supabase
5. M-Pesa + Stripe live keys + HTTPS callbacks/webhooks
6. Optional: OpenAI, Resend, Maps, `CRON_SECRET`
7. Smoke: login → logout (session cleared) → login as `admin@test.com` (full access) → vendor checkout path

## Related docs

- `docs/SEED_CREDENTIALS.md` — test accounts (`admin@test.com` = full access)
- `docs/HEROKU.md` — deploy + `heroku config:set`
- `docs/PAYMENTS_PRODUCTION.md` — M-Pesa / Stripe go-live
- `docs/STORAGE_SETUP.md` — buckets
- `.env.example` — local template
