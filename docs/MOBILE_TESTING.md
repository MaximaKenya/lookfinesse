# Mobile Testing Guide (Windows)

Step-by-step instructions to test **LookFinesse** on your phone from a Windows PC.

---

## 1. Start the dev server (LAN-accessible)

Open PowerShell in the project folder:

```powershell
cd c:\Users\MAXIMILLIAN\marketplace
npm run dev
```

The dev script binds to **all interfaces** (`0.0.0.0:3000`), not just localhost.

Wait until you see:

```
▲ Next.js 16.x
- Local:    http://localhost:3000
- Network:  http://192.168.x.x:3000
```

Use the **Network** URL on your phone. Leave this terminal open while testing.

---

## 2. Find your PC’s LAN IP address

In a **new** PowerShell window:

```powershell
ipconfig
```

Look for your active Wi‑Fi adapter (**Wireless LAN adapter Wi-Fi**). Note the **IPv4 Address**, for example:

```
IPv4 Address. . . . . . . . . . . : 192.168.0.101
```

That is the address your phone will use.

---

## 3. Connect your phone on the same Wi‑Fi

1. Connect your phone to the **same Wi‑Fi network** as your PC (not guest Wi‑Fi).
2. On the phone browser (Chrome or Safari), open:

   ```
   http://YOUR_IP:3000
   ```

   Example: `http://192.168.0.101:3000`

3. If the page does not load:
   - Confirm the dev server shows a **Network** URL (step 1).
   - Allow Node.js through **Windows Defender Firewall** for **Private** networks.
   - Verify `http://localhost:3000` works on the PC first.

4. If you see **“Application error: a client-side exception”**:
   - Hard-refresh the page (clear site data for that IP if needed).
   - Ensure you are **not** using `NEXT_PUBLIC_BASE_URL=http://localhost:3000` for client testing — the app uses **relative `/api/*` fetches** and `window.location.origin` for OAuth.
   - Payment callbacks use the **request Host header** (your LAN IP), so M-Pesa/Stripe redirects work from mobile without editing `.env.local`.

---

## 4. Add to Home Screen (PWA-style install)

### Android (Chrome)

1. Open `http://YOUR_IP:3000`.
2. Tap **⋮** → **Add to Home screen** (or **Install app**).
3. Confirm **LookFinesse** and tap **Add**.

### iOS (Safari)

1. Open the site in **Safari**.
2. Tap **Share** → **Add to Home Screen** → **Add**.

---

## 5. HTTPS, camera, and payments

| Feature | Works on `http://LAN:3000`? | Notes |
|--------|-----------------------------|--------|
| Browse feed, shop, nav | ✅ Usually yes | Use Network URL |
| AI Copilot FAB | ✅ Yes | FAB sits above bottom nav (safe-area) |
| Camera / mic (try-on, reels) | ❌ Often blocked | Requires HTTPS |
| Stripe / some payment flows | ⚠️ Mixed | Stripe Checkout may need HTTPS in production |
| M-Pesa STK (sandbox) | ⚠️ Callback needs reachable URL | Use ngrok for real callbacks, or poll status |

### Options for HTTPS during dev

**Option A — ngrok**

```powershell
npx ngrok http 3000
```

Use the `https://….ngrok-free.app` URL on your phone.

**Option B — Vercel deploy**

```powershell
npm run build
npm run start -H 0.0.0.0
```

Or deploy to Vercel for production QA.

---

## Verify production build (Windows)

```powershell
cd c:\Users\MAXIMILLIAN\marketplace
npm run build
npm run start
```

Test at `http://<PC-IP>:3000` on your phone (same Wi‑Fi).

---

## Quick checklist

- [ ] `npm run dev` running (shows Network URL)
- [ ] Phone and PC on same Wi‑Fi
- [ ] Open `http://<PC-IP>:3000` (not localhost)
- [ ] Feed, shop, bottom nav **Me** tab clear of Copilot FAB
- [ ] Add to Home Screen
- [ ] Use ngrok HTTPS if testing camera or live payment callbacks
- [ ] Run `npm run build` before deploy
