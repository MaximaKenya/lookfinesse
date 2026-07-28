# Deploy LookFinesse to Heroku

## Prerequisites

- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed and logged in (`heroku login`)
- GitHub repo pushed (this project)
- Supabase project with migrations + seed applied

## 1. Create the app

```bash
heroku create lookfinesse
```

Or attach to an existing app:

```bash
heroku git:remote -a lookfinesse
```

## 2. Set environment variables

```bash
heroku config:set \
  NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key" \
  SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
  NEXT_PUBLIC_APP_URL="https://lookfinesse.herokuapp.com" \
  NODE_ENV=production
```

Optional (payments, AI, email):

```bash
heroku config:set \
  STRIPE_SECRET_KEY="sk_..." \
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..." \
  OPENAI_API_KEY="sk-..." \
  RESEND_API_KEY="re_..." \
  MPESA_CONSUMER_KEY="..." \
  MPESA_CONSUMER_SECRET="..." \
  MPESA_SHORTCODE="..." \
  MPESA_PASSKEY="..."
```

### Memory / build tuning

Large Next.js webpack builds may need extra heap on Heroku:

```bash
heroku config:set NODE_OPTIONS="--max-old-space-size=460"
```

The `Procfile` runs `npm run start`, which binds to `$PORT` on `0.0.0.0` (required by Heroku).

## 3. Deploy

Heroku uses the `main` branch by default:

```bash
# From repo root (after git remote add heroku …)
git push heroku HEAD:main
```

If the app still expects `master`:

```bash
git push heroku HEAD:master
```

### If `heroku` remote is missing

```bash
# Install CLI: https://devcenter.heroku.com/articles/heroku-cli
heroku login
heroku git:remote -a lookfinesse
git push heroku HEAD:main
```

Or create a new app:

```bash
heroku create lookfinesse
git push heroku HEAD:main
```

Do **not** force-push.
## 4. Verify

```bash
heroku open
heroku logs --tail
```

## 5. GitHub integration (optional)

Connect the repo in Heroku Dashboard → **Deploy** → **GitHub** for automatic deploys on push to `main`.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `R10 Boot timeout` | Ensure `package.json` `"start"` uses `-H 0.0.0.0 -p $PORT` |
| Build OOM | Set `NODE_OPTIONS=--max-old-space-size=460` |
| Auth redirect loops | Set `NEXT_PUBLIC_APP_URL` to your Heroku URL |
| Missing data | Run Supabase migrations + seed (see `docs/SEED_CREDENTIALS.md`) |
