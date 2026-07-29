# Deploy LookFinesse to Heroku

## Prerequisites

- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed and logged in (`heroku login`)
- This repo cloned locally
- Supabase project with migrations + seed applied

## Beginner: create app → remote → env → push

The app **does not exist** until you create it. `heroku git:remote -a lookfinesse` fails with “Couldn't find that app” if nobody has run `heroku create` yet (or the name is owned by another account).

```bash
cd C:\Users\MAXIMILLIAN\marketplace

# 1) Create the Heroku app (pick a free name)
heroku create lookfinesse

# If name is taken, try one of these instead:
# heroku create lookfinesse-app
# heroku create lookfinesse-ke

# 2) Point git at the app you just created (use the exact name from step 1)
heroku git:remote -a lookfinesse
# or: heroku git:remote -a lookfinesse-app

# 3) Set env vars — full list in docs/LIVE_INTEGRATIONS.md
heroku config:set \
  NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key" \
  SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
  NEXT_PUBLIC_APP_URL="https://lookfinesse.herokuapp.com" \
  NEXT_PUBLIC_BASE_URL="https://lookfinesse.herokuapp.com" \
  NODE_ENV=production

# Optional (payments, AI, email) — see docs/LIVE_INTEGRATIONS.md
# heroku config:set STRIPE_SECRET_KEY=... OPENAI_API_KEY=... RESEND_API_KEY=...

# Large Next.js builds may need extra heap:
heroku config:set NODE_OPTIONS="--max-old-space-size=460"

# 4) Deploy (Heroku expects main)
git push heroku HEAD:main
```

`heroku create` both creates the app and usually adds a `heroku` git remote. If you only created the app in the dashboard, use `heroku git:remote -a <created-name>` with that exact name.

Do **not** invent that `lookfinesse` already exists — create it, or use `lookfinesse-app` / `lookfinesse-ke` if the name is taken.

## Optional env vars

```bash
heroku config:set \
  STRIPE_SECRET_KEY="sk_..." \
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..." \
  OPENAI_API_KEY="sk_..." \
  RESEND_API_KEY="re_..." \
  MPESA_CONSUMER_KEY="..." \
  MPESA_CONSUMER_SECRET="..." \
  MPESA_SHORTCODE="..." \
  MPESA_PASSKEY="..."
```

The `Procfile` runs `npm run start`, which binds to `$PORT` on `0.0.0.0` (required by Heroku).

## Verify

```bash
heroku open
heroku logs --tail
```

If the app still expects `master`:

```bash
git push heroku HEAD:master
```

Do **not** force-push.

## GitHub integration (optional)

Connect the repo in Heroku Dashboard → **Deploy** → **GitHub** for automatic deploys on push to `main`.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Couldn't find that app` | App was never created under your login. Run `heroku create lookfinesse` (or `lookfinesse-app`), then `heroku git:remote -a <name>`. |
| `Name is already taken` | `heroku create lookfinesse-app` or `heroku create lookfinesse-ke`, then remote + push with that name. |
| CLI not found | Install: https://devcenter.heroku.com/articles/heroku-cli then `heroku login` |
| `R10 Boot timeout` | Ensure `package.json` `"start"` uses `-H 0.0.0.0 -p $PORT` |
| Build OOM | Set `NODE_OPTIONS=--max-old-space-size=460` |
| Auth redirect loops | Set `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_BASE_URL` to your Heroku URL |
| Missing data | Run Supabase migrations + seed (see `docs/SEED_CREDENTIALS.md`) |
| Env checklist | `docs/LIVE_INTEGRATIONS.md` |
| Git Credential Manager asks username/password | See **Windows: Git Credential Manager (GCM)** below — use `heroku auth:token`, not your Gmail password |

## Windows: Git Credential Manager (GCM)

Heroku Git uses HTTPS. On Windows, **Git Credential Manager** often pops up asking for a username/password. **Do not use your Gmail password** — even if you are logged into Heroku as `lookfinesseke@gmail.com` and the app `lookfinesseapp` exists.

### Option A — Paste the Heroku API token into GCM

```powershell
# Get token (requires heroku login first)
heroku auth:token

# In Git Credential Manager popup when pushing:
# Username:  (leave blank OR type anything like "heroku")
# Password:  paste the FULL token from heroku auth:token
# Then Continue
```

Then:

```powershell
heroku git:remote -a lookfinesseapp
git push heroku HEAD:main
```

### Option B — Bypass GCM once (embed token in remote URL)

```powershell
$token = heroku auth:token
git remote set-url heroku "https://heroku:$token@git.heroku.com/lookfinesseapp.git"
git push heroku HEAD:main
# Then reset remote without token for safety:
heroku git:remote -a lookfinesseapp
```

### Clear a bad saved credential (Windows)

If GCM keeps rejecting or looping:

1. Open **Windows Credential Manager** → **Windows Credentials**
2. Find any entry for `git.heroku.com` (or `heroku.com`)
3. **Remove** it
4. Push again and use Option A (token as password) or Option B

Confirm you are on the right Heroku account before pushing:

```powershell
heroku auth:whoami
heroku apps
heroku git:remote -a lookfinesseapp
```
