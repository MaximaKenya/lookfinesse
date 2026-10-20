# Live environment integrations

Everything required for production end-to-end (auth → browse → checkout → payouts → AI → email). Set these on your host (Heroku config vars / Vercel env / etc.). Never commit secrets.

Priority: **P0** = app will not run or auth fails · **P1** = core commerce broken · **P2** = optional / degraded features.

| Priority | Integration | Env vars | Notes |
|----------|-------------|----------|-------|
| **P0** | **Supabase (Auth + DB)** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Project must be live (not paused). Run migrations + seed (`docs/SEED_CREDENTIALS.md`). Service role for webhooks / server writes only. New vendors get a **30-day Pro trial** (`platform_subscriptions.status=trialing`) via `ensureVendorTrial` / seed — treat as full Pro until `current_period_end`. |
| **P0** | **App base URL** | `NEXT_PUBLIC_BASE_URL` (also `NEXT_PUBLIC_APP_URL` if set) | Public HTTPS origin. OAuth callback `{BASE_URL}/auth/callback`. Paystack callback `{BASE_URL}/payments/paystack/callback`. No trailing slash. |
| **P0** | **Hosting** | `NODE_ENV=production`, `PORT` (Heroku), `NODE_OPTIONS` if OOM | Heroku: `docs/HEROKU.md`. Bind `0.0.0.0`. |
| **P1** | **Supabase Storage** | (same Supabase keys) | Buckets: `products`, `product-images`, `profile-media` (public). See `docs/STORAGE_SETUP.md`. |
| **P1** | **Google OAuth** | Configured in **Supabase Dashboard** → Auth → Providers (not app env) | Add redirect URLs: `{BASE_URL}/auth/callback` (and local). Enable Google provider + client ID/secret in Supabase. |
| **P1** | **Paystack (test)** | `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` | Sole payment provider. Webhook `{ORIGIN}/api/paystack/webhook`. Callback `{ORIGIN}/payments/paystack/callback`. Stay on test keys until told otherwise. Details: `docs/PAYMENTS_PRODUCTION.md`. |
| **P2** | **Groq** | `GROQ_API_KEY`, optional `GROQ_MODEL` | Stylist, beauty, fitness, copilot, weather tips. Local copy when unset. See `docs/AI_PROVIDERS.md`. |
| **P2** | **Resend** | `RESEND_API_KEY` | Transactional / alert email. |
| **P2** | **Maps** | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Nearby / map widgets (`@react-google-maps/api`). |
| **P2** | **Cron / jobs** | `CRON_SECRET` | Protect `/api/cron/*` (or scheduled workers) with `Authorization: Bearer $CRON_SECRET`. |

## Quick production checklist

1. Paste `supabase/GO_LIVE.sql` once (schema, buckets, auth seeds, Nairobi catalog). Do not paste `seed_demo_metrics.sql`.
2. Storage buckets and RLS are included in that script.
3. `NEXT_PUBLIC_BASE_URL` = production HTTPS URL
4. Google OAuth redirect allow-list in Supabase: `{BASE_URL}/auth/callback`
5. Paystack test keys, webhook, and callback URL
6. Optional: Groq, Resend, Maps, `CRON_SECRET`
7. Smoke: login → shop and feed show seed or an empty state → checkout opens Paystack → admin finance pages load without dummy KPIs

## Related docs

- `docs/SEED_CREDENTIALS.md` — test accounts (`admin@test.com` = full access)
- `docs/HEROKU.md` — deploy + `heroku config:set`
- `docs/PAYMENTS_PRODUCTION.md` — Paystack go-live
- `docs/STORAGE_SETUP.md` — buckets
- `.env.example` — local template
