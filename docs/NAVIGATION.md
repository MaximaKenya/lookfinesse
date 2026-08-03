# Navigation map

Where each experience lives and which shell provides persistent sidebar navigation.

## Shells

| Shell | Layout | Sidebar | Routes |
|-------|--------|---------|--------|
| Shopper | `app/(main)/layout.tsx` | `AppNav` | Feed, shop, profile, bookings, saved, AI tools |
| Vendor dashboard | `app/dashboard/layout.tsx` | `DashboardSidebar` (vendor) | `/dashboard/*` except `/dashboard/admin/*` |
| Admin dashboard hub | `app/dashboard/layout.tsx` | `DashboardSidebar` (admin) | `/dashboard/admin/*` |
| Vendor command center | `app/vendor/layout.tsx` | `DashboardSidebar` (vendor) | `/vendor/*` |
| Admin mission control | `app/admin/layout.tsx` | `DashboardSidebar` (admin) | `/admin/*` |
| Platform finance | `app/finance/layout.tsx` | `DashboardSidebar` (admin) | `/finance` |
| Platform intelligence | `app/intelligence/layout.tsx` | `DashboardSidebar` (admin) | `/intelligence` |

## Shopper (AppNav)

| Path | Label | Notes |
|------|-------|-------|
| `/feed` | Feed | Home timeline |
| `/reels` | Reels | Short video |
| `/for-you` | For You | Personalized |
| `/explore` | Explore | Discovery |
| `/shop` | Shop | Commerce browse |
| `/services` | Services | Bookable offerings |
| `/live` | Live | Live sessions |
| `/drops` | Drops | Flash sales & holds |
| `/trending` | Trending | Social |
| `/challenges` | Challenges | Social |
| `/nearby` | Nearby | Geo |
| `/search` | Search | Global search |
| `/profile` | Profile | My Space |
| `/bookings` | Bookings | My Space |
| `/saved` | Saved | My Space |
| `/notifications` | Notifications | My Space |
| `/fit-profile` | Fit Profile | My Space |
| `/ai/stylist` | AI Stylist | AI group |
| `/ai/fitness` | AI Fitness | AI group |
| `/ai/beauty` | AI Beauty | AI group |
| `/dashboard` | Dashboard | Footer (non-vendor) |

### Vendor extras in AppNav

| Path | Label | Location |
|------|-------|----------|
| `/dashboard/creator-studio` | Creator Studio | My Space + footer |
| `/dashboard` | Dashboard Hub | Footer |
| `/vendor` | Command Center | Footer |

### Admin extras in AppNav

| Path | Label | Location |
|------|-------|----------|
| `/admin` | Mission Control | Admin group |
| `/finance` | Financial Control | Admin group |
| `/intelligence` | AI Intelligence | Admin group |

## Vendor — dashboard sidebar (`VENDOR_NAV`)

| Path | Label | Group |
|------|-------|-------|
| `/dashboard` | Dashboard Home | Home |
| `/dashboard/vendor` | Vendor Hub | Home |
| `/dashboard/creator-studio` | Creator Studio | Create |
| `/dashboard/create-product` | Create Product | Create |
| `/dashboard/create-service` | Create Service | Create |
| `/dashboard/create-post` | Create Post | Create |
| `/dashboard/create-reel` | Create Reel | Create |
| `/dashboard/ads` | Ads Manager | Create |
| `/vendor` | Overview | Operations |
| `/vendor/products` | Product Studio | Operations |
| `/vendor/orders` | Orders | Operations |
| `/vendor/pos` | In-store POS | Operations |
| `/vendor/scan` | SKU Scan | Operations |
| `/dashboard/calendar` | Calendar | Operations |
| `/dashboard/create-drop` | Flash Drops | Growth |
| `/vendor/finance` | Financial Center | Finance |
| `/dashboard/finance` | Live Ledger | Finance |
| `/dashboard/vendor/wallet` | Payouts | Finance |
| `/dashboard/creator-wallet` | Creator Wallet | Finance |
| `/vendor/intelligence` | Vendor Intelligence | Intelligence |
| `/intelligence` | Marketplace Intel | Intelligence |
| `/dashboard/vendor/kyc` | KYC | Profile |
| `/dashboard/vendor/staff` | Staff | Profile |
| `/profile` | Public Profile | Profile |

## Vendor — command center (`/vendor/*`)

Same vendor sidebar via `app/vendor/layout.tsx`. Key paths:

| Path | Purpose |
|------|---------|
| `/vendor` | Command center overview |
| `/vendor/products` | Inventory & listings |
| `/vendor/orders` | Fulfillment |
| `/vendor/finance` | Revenue, FX, payouts, KYC |
| `/vendor/intelligence` | Trust & growth signals |

## Admin — sidebar (`ADMIN_NAV`)

| Path | Label | Group |
|------|-------|-------|
| `/dashboard/admin` | Admin Hub | Command |
| `/admin` | Mission Control | Command |
| `/admin/live` | Live Ops | Command |
| `/finance` | Financial Control | Finance |
| `/admin/finance` | Admin Finance | Finance |
| `/admin/payouts` | Payouts Queue | Finance |
| `/admin/treasury` | Treasury | Finance |
| `/admin/fx` | FX Engine | Finance |
| `/intelligence` | AI Intelligence | Intelligence |
| `/admin/intelligence` | Ops Intelligence | Intelligence |
| `/admin/risk-dashboard` | Risk Dashboard | Intelligence |
| `/admin/network` | Network | Intelligence |
| `/admin/compliance` | Compliance | Trust |
| `/dashboard/admin/kyc` | KYC Reviews | Trust |
| `/dashboard/admin/transactions` | Transactions | Trust |
| `/dashboard/admin/ledger` | Ledger | Trust |
| `/dashboard/admin/categories` | Categories | Trust |
| `/dashboard/admin/analytics` | Analytics | Trust |

## Quick lookup (audit targets)

| You want | Go to | Persistent nav |
|----------|-------|----------------|
| Vendor financial center | `/vendor/finance` | Vendor sidebar (`/vendor` or `/dashboard`) |
| Create a product | `/dashboard/create-product` | Dashboard vendor sidebar |
| Creator studio | `/dashboard/creator-studio` | Dashboard vendor sidebar |
| Vendor calendar | `/dashboard/calendar` | Dashboard vendor sidebar |
| Admin live operations | `/admin/live` | Admin sidebar (`/admin` layout) |
| Platform finance control | `/finance` | Finance layout (admin sidebar) |
| Platform AI intelligence | `/intelligence` | Intelligence layout (admin sidebar) |
| Admin hub (dashboard) | `/dashboard/admin` | Dashboard admin section sidebar |
| Mission control | `/admin` | Admin layout sidebar |

Source of truth for sidebar items: `lib/nav/dashboards.ts` (`VENDOR_NAV`, `ADMIN_NAV`).
