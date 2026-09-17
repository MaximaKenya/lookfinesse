# LookFinesse

AI-powered fashion, beauty, fitness & wellness **social commerce** marketplace — Kenya-first (M-Pesa + card), creators & vendors.

**Live app (Heroku):** https://lookfinesseke.herokuapp.com  
**Repo:** https://github.com/MaximaKenya/lookfinesse

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript** · **Tailwind** · **shadcn/ui**
- **Supabase** — auth, Postgres, Storage
- **Stripe** + **M-Pesa (Daraja)** — checkout & payouts
- **Resend** — transactional email
- **OpenAI** — stylist / beauty / fitness copilots (optional; degrades without key)

## Buyer journey

| Path | Purpose |
|------|---------|
| `/` | Marketing home — shop / feed CTAs |
| `/shop` | Browse, search, filter, sort products |
| `/product/[id]` | Product detail, variants, add to cart, buy now |
| `/store/[id]` | Vendor storefront |
| `/checkout` | M-Pesa / Stripe checkout (cart or `?product=` / `?booking_id=`) |
| `/feed`, `/reels`, `/explore` | Social discovery |

Cart drawer is global (header cart button). Empty / loading / error states are handled on shop, product, store, and checkout.

## Vendor & ops

| Path | Purpose |
|------|---------|
| `/vendor` | Vendor command center |
| `/dashboard`, `/creator-studio` | Creator tools |
| `/admin`, `/finance`, `/intelligence` | Platform admin |

## Local setup

```bash
cp .env.example .env.local
# Fill Supabase + BASE_URL at minimum — see comments in .env.example
npm install
npm run dev
```

Open http://localhost:3000

### Required env (P0)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `NEXT_PUBLIC_BASE_URL` (e.g. `http://localhost:3000`)

Optional: Stripe, M-Pesa, OpenAI, Resend, Google Maps, `CRON_SECRET` — documented in `.env.example` and `docs/LIVE_INTEGRATIONS.md`.

**Never commit `.env.local` or secrets.**

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (webpack, `0.0.0.0`) |
| `npm run build` | Production build |
| `npm start` | Production server — binds `PORT` (Heroku) |
| `npm run lint` | ESLint |

## Heroku

- App name: `lookfinesseke`
- `Procfile`: `web: npm run start`
- `engines.node`: `20.x`
- Start script: `next start -H 0.0.0.0 -p ${PORT:-3000}`

Deploy from `main`:

```bash
git push heroku main
```

Config checklist: `docs/HEROKU.md`, `docs/LIVE_INTEGRATIONS.md`, `docs/PAYMENTS_PRODUCTION.md`.

## Docs

| Doc | Topic |
|-----|--------|
| `docs/DEV.md` | Local development |
| `docs/HEROKU.md` | Heroku deploy & config |
| `docs/LIVE_INTEGRATIONS.md` | Production integrations |
| `docs/PAYMENTS_PRODUCTION.md` | Stripe / M-Pesa |
| `docs/MIGRATIONS.md` | Supabase migrations |
| `docs/STORAGE_SETUP.md` | Storage buckets |
| `docs/NAVIGATION.md` | App navigation map |
| `docs/AI_PROVIDERS.md` | OpenAI models |

## Safety notes

- Do not change auth, Stripe webhooks, or Supabase schemas without a documented migration.
- Prefer real metrics only in trust UI (no fake “Verified” / fake counts).
- Keep TypeScript clean; `npm run build` must pass before shipping.
