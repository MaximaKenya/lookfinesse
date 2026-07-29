# Local development (Windows)

## Start dev server

```bash
npm run dev
```

Use webpack (not Turbopack). The `dev` script is `next dev --webpack -H 0.0.0.0` so phones on your LAN can reach the app at `http://<your-ip>:3000`.

## Environment setup

1. Copy the template:

   ```bash
   cp .env.example .env.local
   ```

2. Create or open a [Supabase project](https://supabase.com/dashboard) and paste from **Project Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL` → Project URL (`https://<ref>.supabase.co`, no trailing slash)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon public key

3. **Replace dead or placeholder URLs.** If `.env.local` still points at a non-existent project (DNS `ENOTFOUND`, e.g. a deleted ref), the app shows a bottom banner and auth/data calls fail gracefully — but you must update both vars to a **live** project and restart dev.

4. Verify DNS resolves:

   ```bash
   nslookup YOUR_PROJECT_REF.supabase.co
   ```

5. Optional: `OPENAI_API_KEY` for AI tips/copilot (**OpenAI only** — Groq is not used; see `docs/AI_PROVIDERS.md`); payment keys for M-Pesa/Stripe (see `.env.example`).

### Mobile / LAN testing

- Dev binds to `0.0.0.0:3000` — open `http://<PC-LAN-IP>:3000` on your phone (same Wi‑Fi).
- Server-side payment callbacks use `getRequestOrigin()` from the incoming request host, so M-Pesa/STK from a phone should work without hardcoding localhost.
- Avoid mixed content: do not set `NEXT_PUBLIC_BASE_URL` to an `https://` ngrok URL while browsing over `http://192.168.x.x:3000`; use the URL you actually open in the browser, or leave `NEXT_PUBLIC_BASE_URL` unset for local work (`lib/url.ts` falls back to request origin or `http://localhost:3000`).

### Runtime checks

- **`EnvGuard`** (in root layout): validates env format on load and pings Supabase once; shows a dismissible banner if the project is unreachable.
- **`lib/supabase/healthCheck.ts`**: optional HEAD request to `/rest/v1/`; cached per session.
- Misconfigured env disables the browser Supabase client (`isSupabaseConfigured()`); hooks skip auth calls instead of throwing.

## Stale `.next` / ENOENT errors

On Windows you may see:

- `ENOENT` for `page.js` or `routes-manifest.json` under `.next/dev`
- `PackFileCacheStrategy` rename errors under `.next/dev/cache/webpack`
- Slow or 500 responses on first load of `/feed` or `/api/ads/serve`

These come from a corrupted or racing webpack filesystem cache, often after killing the dev server mid-compile or running `next build` while `next dev` is still running.

### Fix (try in order)

1. Stop all Node/Next processes (only one dev server at a time).
2. Clear dev cache and restart:

   ```bash
   npm run dev:clean
   ```

3. If errors persist, full clean then dev:

   ```bash
   npm run clean
   npm run dev
   ```

4. Do **not** run `npm run build` and `npm run dev` in parallel.

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run clean` | Delete entire `.next` folder |
| `npm run clean:dev-cache` | Delete only webpack/dev caches |
| `npm run dev:clean` | Clear dev cache, then start dev |
| `npm run dev:turbo` | Turbopack (optional; not default) |

## Supabase `fetch failed` (console / network)

If you see `Failed to fetch`, `TypeError: fetch failed`, or `@supabase/auth-js` errors during `_refreshAccessToken` / `getUser`:

1. **Check `.env.local`** — valid URL + anon key (see above).
2. **Confirm the project is active** — paused or deleted projects fail DNS (`ENOTFOUND`). Resume in the dashboard or create a new project and update env.
3. **Restart dev** after changing env.
4. **Network** — offline, VPN, or DNS issues block token refresh. Public routes (`/feed`, etc.) return demo/empty data when Supabase is down; protected features need a live project.

Edge auth lives in `proxy.ts` (Next.js 16). It reads `sb-*-auth-token` cookies locally and only hits Supabase for role-gated paths (`/admin`, `/vendor`, etc.).

## Build check

```bash
npm run build
```

Should exit 0 before deploying.
