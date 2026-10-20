# Payments production checklist — LookFinesse

Checkout, bookings, subscriptions, payouts, escrow, and treasury run on **Paystack only**. Stay on test keys (`sk_test_` / `pk_test_`) until you are told to go live.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_BASE_URL` | Public app URL. No trailing slash. |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only writes (webhooks, fulfillment, cron). Never expose to the browser. |
| `PAYSTACK_SECRET_KEY` | Initialize, verify, transfers, webhook HMAC |
| `PAYSTACK_PUBLIC_KEY` | Client key if a Paystack inline script is used |
| `CRON_SECRET` | Bearer token for the daily reconcile job |

Do not set `STRIPE_*` or `MPESA_*`. Those providers are not in the app.

## Paystack rules

1. Currency is **KES**. Amounts sent to Paystack are subunits (shillings × 100).
2. Every reference is `LF-<uuid>`.
3. `metadata.app` is always `lookfinesse`.
4. Each transaction sets `callback_url` to `{BASE_URL}/payments/paystack/callback`.
5. Channels: `card`, `mobile_money`, `bank_transfer`, `bank`, `ussd`.
6. Value is granted only after `GET https://api.paystack.co/transaction/verify/:reference` returns `success`.
7. Webhook: `{BASE_URL}/api/paystack/webhook`. The route checks `x-paystack-signature` (HMAC-SHA512 of the raw body with `PAYSTACK_SECRET_KEY`), ignores events whose metadata is not `lookfinesse`, and is idempotent by reference.
8. The daily cron `GET /api/payments/reconcile` (Bearer `CRON_SECRET`) verifies pending Paystack payments the same way.

## Payouts

Vendor payouts use Paystack Transfers. Mobile money uses recipient type `mobile_money`, bank code `MPESA`, and a local `0XXXXXXXXX` number. Bank payouts use recipient type `kepss`.

## Smoke tests

| Flow | Route |
|------|--------|
| Cart checkout | `/checkout` → Paystack → callback → verify |
| Service subscription | `/checkout/subscribe` |
| Fan membership | Creator page → Paystack |
| Ad campaign | `/dashboard/ads` wallet or Paystack |
| Vendor payout | `/dashboard/vendor/wallet` and `/dashboard/vendor/payout-settings` |
| Admin reconcile | `/api/payments/reconcile` |

## Security

- Never commit `.env.local` or live secret keys.
- Webhook signature failures return 401 and do not update orders.
- Duplicate callbacks do not double-credit escrow or points.
