# Roadmap — next product ideas

Short list of improvements to make LookFinesse more competitive for Kenyan / East African fashion & beauty commerce.

## Product recommendations

1. **Push notifications** — DONE. Web Push opt-in on `/notifications` (`PushOptIn` + `/sw.js`), subscriptions API `POST /api/push/subscribe`, migration `027` `push_subscriptions`. Works without VAPID/FCM via local notifications; set `NEXT_PUBLIC_VAPID_PUBLIC_KEY` for full Web Push.
2. **WhatsApp commerce** — DONE. `wa.me` share on product PDP, EngagementBar more-menu, and checkout deep links (`lib/whatsapp/share`, `WhatsAppShareButton` / `WhatsAppCommerce`).
3. **Inventory barcode / SKU scan** — DONE. `/vendor/scan` with camera `BarcodeDetector` + manual SKU; `GET/POST /api/vendor/inventory/scan` for receive / count / pick.
4. **Multi-currency checkout** — DONE. Checkout display currencies KES/USD/UGX/TZS via `CheckoutCurrencyPicker` + `lib/fx/currencies`; settlement remains KES with FX notes.
5. **Vendor KYC / trust badges** — DONE. Trust tiers (`none|basic|business|elite`) on vendors + `GET/POST /api/vendor/trust-badge`; KYC page shows unlocks; feed Verified badge continues via `is_verified`.
6. **Live shopping / scheduled drops** — DONE. `/drops` countdown + waitlist + 15‑min holds; `/dashboard/create-drop`; `GET/POST /api/drops`; tables `flash_drops`, `drop_waitlist`, `inventory_holds`.
7. **Buyer size & fit profile sync** — DONE. `/fit-profile` + `GET/POST /api/fit-profile` synced with Virtual Dresser prefs (`fit_profiles` + `user_profiles.preferences.dresser`).
8. **Affiliate / creator payouts wallet** — DONE. `/dashboard/creator-wallet` unifies tips + affiliate + brand deals; CSV export `?format=csv`; `GET/POST /api/creator-wallet` + `creator_wallet_ledger`.
9. **Offline-friendly vendor POS** — DONE. `/vendor/pos` PWA-oriented queue in `localStorage` + SW sync message; `GET/POST /api/vendor/pos/sale` → `pos_sales` with stock decrement.
10. **Smart restock & demand signals** — DONE. Heuristics in `lib/intelligence/demandSignals`; `GET /api/vendor/demand-signals`; panel on `/vendor/intelligence`.

## Also shipped with this pass

- Reels list engagement batching (mirrors feed N+1 fix) via `attachReelEngagement` / `getReelEngagementBatch`.
- Nav links: Drops, Fit Profile, POS, SKU Scan, Flash Drops, Creator Wallet.
- Migration: `supabase/migrations/027_roadmap_mvp.sql`.

## Related

- Live integrations: `docs/LIVE_INTEGRATIONS.md`
- Payments go-live: `docs/PAYMENTS_PRODUCTION.md`
- Seed / trial accounts: `docs/SEED_CREDENTIALS.md`
