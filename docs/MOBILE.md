# Mobile Strategy

## Current State — PWA (Done)

The app is configured as a Progressive Web App:

- `app/manifest.ts` — Next.js 15+ typed manifest with icons, shortcuts, and display: standalone
- `app/layout.tsx` — `viewport` export with `themeColor: #a855f7`, `userScalable: false`
- `appleWebApp` metadata for iOS home-screen installs
- Bottom nav (`AppNav`) already exists for mobile UX
- Hero ad carousel is touch-enabled (pause-on-touch, aspect-ratio responsive)

### PWA Install Prompt

Add a lightweight install-prompt component:

```tsx
// components/PWAInstallPrompt.tsx
"use client";
import { useEffect, useState } from "react";

export default function PWAInstallPrompt() {
  const [prompt, setPrompt] = useState<any>(null);
  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setPrompt(e);
    });
  }, []);
  if (!prompt) return null;
  return (
    <button onClick={() => prompt.prompt()} className="...">
      Install LookFinesse App
    </button>
  );
}
```

Add `<PWAInstallPrompt />` to `app/(main)/layout.tsx`.

---

## Phase 2 — React Native / Expo (Recommended Path)

### Why Expo?

- Shared business logic with the existing Next.js app
- Expo Router mirrors the Next.js App Router mental model
- Over-the-air (OTA) updates via Expo EAS
- Native M-Pesa deeplinks, camera, biometrics, push notifications

### Setup (doesn't break Next.js)

Create a sibling `mobile/` directory — **not** inside the Next.js root:

```bash
# From workspace root
npx create-expo-app mobile --template tabs
cd mobile
npx expo install expo-router expo-linking expo-constants expo-status-bar
```

### Shared API layer

Both Next.js and Expo hit the same Supabase backend and `/api/*` routes.
Create `shared/` at the monorepo root or publish an npm workspace:

```
marketplace/          ← Next.js 16 web app
mobile/               ← Expo React Native app
shared/
  lib/                ← shared types, API helpers, constants
```

### Key native features to unlock

| Feature | Expo Module |
|---------|-------------|
| Push notifications | `expo-notifications` + Supabase Realtime |
| Camera (try-on, profile) | `expo-camera` |
| M-Pesa deeplink callback | `expo-linking` + custom scheme `vyb://` |
| Biometric auth | `expo-local-authentication` |
| Haptics on cart add | `expo-haptics` |
| AR try-on (Phase 3) | `expo-gl` + Three.js |

### EAS Build & Submit

```bash
# Install EAS CLI
npm install -g eas-cli
eas login
eas build:configure

# Build for Android (Play Store)
eas build --platform android

# Build for iOS (App Store)
eas build --platform ios

# Submit
eas submit --platform android
eas submit --platform ios
```

---

## Phase 3 — Native Features Roadmap

| Quarter | Feature |
|---------|---------|
| Q3 2026 | Expo app MVP: feed, shop, cart, M-Pesa checkout |
| Q3 2026 | Push notifications for order updates, live alerts |
| Q4 2026 | AR beauty try-on (lipstick, eyeshadow) via TensorFlow.js |
| Q4 2026 | Barcode scanner for in-store product lookup |
| Q1 2027 | Apple Pay / Google Pay via Stripe native SDK |
| Q1 2027 | Offline-first feed with SQLite cache |
| Q2 2027 | Live shopping co-watching (multi-user Reels) |

---

## Mobile-First Checklist (Web)

- [x] `display: standalone` manifest
- [x] `themeColor` in viewport
- [x] Bottom nav with safe-area padding
- [x] Touch targets ≥ 44px in hero carousel
- [x] `userScalable: false` to prevent double-tap zoom
- [ ] Add service worker for offline shell caching
- [ ] Add `<PWAInstallPrompt />` banner
- [ ] Generate 192×192 and 512×512 app icons (place in `public/`)
- [ ] Add splash screen image (`public/splash.png`)
