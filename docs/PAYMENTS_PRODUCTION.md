# Payments production checklist — LookFinesse

Use this before going live with M-Pesa (Daraja) and Stripe.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_BASE_URL` | Public app URL (fallback when no request host) |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Webhooks / server-only writes (if used) |
| `MPESA_CONSUMER_KEY` / `MPESA_CONSUMER_SECRET` | Daraja OAuth |
| `MPESA_SHORTCODE` / `MPESA_PASSKEY` | STK Push |
| `MPESA_INITIATOR` / `MPESA_SECURITY_CREDENTIAL` | B2C payouts (prod) |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Card checkout + webhooks |
| `STRIPE_CONNECT_CLIENT_ID` | Vendor Connect (if enabled) |

Server routes use `getRequestOrigin(req)` for callback URLs — do not hardcode `localhost` in production.

## M-Pesa (Daraja)

1. **Sandbox → Production**: Swap keys in Safaricom Daraja portal; update `.env` on Vercel/host.
2. **Callback URLs** (must be HTTPS, publicly reachable):
   - STK: `{ORIGIN}/api/mpesa/callback`
   - Payout result: `{ORIGIN}/api/mpesa/payout-result`
   - Payout timeout: `{ORIGIN}/api/mpesa/payout-timeout`
3. **Local testing**: Run `ngrok http 3000` (or Cloudflare tunnel) and set `NEXT_PUBLIC_BASE_URL` to the tunnel URL.
4. **Test path**: Checkout → pay with test MSISDN → confirm `payments` row updates via callback → order `paid`.
5. **Platform subscription STK**: `/dashboard/subscription` → M-Pesa → verify `platform_subscriptions.status`.
6. **Fan membership**: Creator membership checkout → STK metadata `kind` → webhook/callback reconciles tier.

## Stripe

1. **Live mode**: Replace test keys; create live webhook endpoint `{ORIGIN}/api/stripe/webhook`.
2. **Events to enable**: `checkout.session.completed`, `customer.subscription.updated`, `invoice.paid` (as implemented in route).
3. **Connect**: Vendor onboarding `{ORIGIN}/api/stripe/connect/onboard` return URLs must match Dashboard settings.
4. **Test path**: Product checkout (card) → success page → `payments.status = paid` → ledger journal posted.

## Reconciliation

- [ ] STK callback idempotent (duplicate callbacks do not double-credit)
- [ ] Stripe webhook returns 200 only after DB update
- [ ] Failed payments surface `/checkout/failed` or order failed page
- [ ] Platform sub renewal cron / manual reconcile documented for ops

## Security

- [ ] Never commit `.env.local`
- [ ] Webhook secrets rotated if leaked
- [ ] RLS enabled on `payments`, `orders`, `platform_subscriptions`

## Smoke tests (staging)

| Flow | Route |
|------|--------|
| Cart M-Pesa | `/checkout` → STK |
| Cart Stripe | `/checkout` → Stripe session |
| Vendor platform plan | `/dashboard/subscription` |
| Fan tier | Creator page → membership |
| Payout request | `/dashboard/vendor/wallet` |

## Monitoring

- Log Daraja `ResultCode` failures in callback handler
- Alert on Stripe webhook 4xx/5xx
- Dashboard: unpaid orders older than 24h
