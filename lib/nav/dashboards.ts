import {
  Activity,
  AlertTriangle,
  BarChart3,
  Boxes,
  BrainCircuit,
  Calendar,
  Coins,
  CreditCard,
  Clapperboard,
  Crown,
  Database,
  FileImage,
  Film,
  Gauge,
  Megaphone,
  Globe,
  LayoutDashboard,
  LineChart,
  Network,
  Radar,
  Receipt,
  ScrollText,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  UserCircle,
  Users,
  Video,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  accent?: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const VENDOR_NAV: NavGroup[] = [
  {
    title: "Home",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard Home",
        description: "Vendor hub & KPIs",
        icon: LayoutDashboard,
        accent: "text-white",
      },
      {
        href: "/dashboard/vendor",
        label: "Vendor Hub",
        description: "Wallet, payouts & settings",
        icon: UserCircle,
        accent: "text-cyan-300",
      },
      {
        href: "/dashboard/provider",
        label: "Provider Hub",
        description: "Memberships, subs & sessions",
        icon: Crown,
        accent: "text-purple-300",
      },
    ],
  },
  {
    title: "Services",
    items: [
      {
        href: "/dashboard/sessions",
        label: "Sessions",
        description: "Schedule live & in-person classes",
        icon: Video,
        accent: "text-cyan-300",
      },
      {
        href: "/vendor/customers",
        label: "Subscribers",
        description: "Membership roster & renewals",
        icon: Users,
        accent: "text-pink-300",
      },
      {
        href: "/dashboard/calendar",
        label: "Calendar",
        description: "Bookings, sessions & reminders",
        icon: Calendar,
        accent: "text-pink-300",
      },
    ],
  },
  {
    title: "Create",
    items: [
      {
        href: "/dashboard/creator-studio",
        label: "Creator Studio",
        description: "Reels, posts, products & ads",
        icon: Clapperboard,
        accent: "text-pink-300",
      },
      {
        href: "/dashboard/create-product",
        label: "Create Product",
        description: "List items in your shop",
        icon: ShoppingBag,
        accent: "text-cyan-300",
      },
      {
        href: "/dashboard/create-service",
        label: "Create Service",
        description: "Bookable sessions & slots",
        icon: Calendar,
        accent: "text-teal-300",
      },
      {
        href: "/dashboard/create-post",
        label: "Create Post",
        description: "Feed content & stories",
        icon: FileImage,
        accent: "text-purple-300",
      },
      {
        href: "/dashboard/create-reel",
        label: "Create Reel",
        description: "Short-form video",
        icon: Film,
        accent: "text-rose-300",
      },
      {
        href: "/dashboard/ads",
        label: "Ads & Campaigns",
        description: "Promote listings & campaigns",
        icon: Megaphone,
        accent: "text-amber-300",
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        href: "/vendor",
        label: "Overview",
        description: "Vendor command center",
        icon: LayoutDashboard,
        accent: "text-cyan-300",
      },
      {
        href: "/vendor/products",
        label: "Product Studio",
        description: "Inventory, listings, media",
        icon: ShoppingBag,
        accent: "text-purple-300",
      },
      {
        href: "/vendor/orders",
        label: "Orders",
        description: "Fulfillment & disputes",
        icon: Truck,
        accent: "text-amber-300",
      },
    ],
  },
  {
    title: "Growth",
    items: [
      {
        href: "/dashboard/subscription",
        label: "Platform Plan",
        description: "Starter, Pro & Elite tiers",
        icon: Sparkles,
        accent: "text-amber-300",
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        href: "/vendor/finance",
        label: "Financial Center",
        description: "Revenue, FX, payouts, KYC",
        icon: Wallet,
        accent: "text-green-300",
      },
      {
        href: "/dashboard/finance",
        label: "Live Ledger",
        description: "Realtime balance & analytics",
        icon: LineChart,
        accent: "text-emerald-300",
      },
      {
        href: "/dashboard/vendor/wallet",
        label: "Payouts",
        description: "Withdraw to mobile / bank",
        icon: CreditCard,
        accent: "text-cyan-300",
      },
      {
        href: "/dashboard/vendor/payout-settings",
        label: "Payout Settings",
        description: "M-Pesa, Stripe & bank rails",
        icon: Settings,
        accent: "text-amber-300",
      },
    ],
  },
  {
    title: "Intelligence",
    items: [
      {
        href: "/vendor/intelligence",
        label: "Vendor Intelligence",
        description: "Trust, risk, growth signals",
        icon: BrainCircuit,
        accent: "text-fuchsia-300",
      },
      {
        href: "/intelligence",
        label: "Marketplace Intel",
        description: "Network-wide AI signals",
        icon: Sparkles,
        accent: "text-yellow-300",
      },
    ],
  },
  {
    title: "Profile",
    items: [
      {
        href: "/dashboard/vendor/kyc",
        label: "KYC",
        description: "Identity & compliance",
        icon: ShieldCheck,
        accent: "text-cyan-300",
      },
      {
        href: "/dashboard/vendor/staff",
        label: "Staff",
        description: "Team & permissions",
        icon: UserCircle,
        accent: "text-pink-300",
      },
      {
        href: "/profile",
        label: "Public Profile",
        description: "How buyers see you",
        icon: Settings,
        accent: "text-zinc-300",
      },
    ],
  },
];

export const ADMIN_NAV: NavGroup[] = [
  {
    title: "Command",
    items: [
      {
        href: "/dashboard/admin",
        label: "Admin Hub",
        description: "Platform ops dashboard",
        icon: LayoutDashboard,
        accent: "text-cyan-300",
      },
      {
        href: "/admin",
        label: "Mission Control",
        description: "Executive overview",
        icon: Activity,
        accent: "text-white",
      },
      {
        href: "/admin/live",
        label: "Live Ops",
        description: "Realtime streams & rails",
        icon: Activity,
        accent: "text-purple-300",
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        href: "/finance",
        label: "Financial Control",
        description: "Treasury, escrow, settlements",
        icon: Wallet,
        accent: "text-green-300",
      },
      {
        href: "/admin/finance",
        label: "Admin Finance",
        description: "Platform revenue & payouts",
        icon: Coins,
        accent: "text-emerald-300",
      },
      {
        href: "/admin/payouts",
        label: "Payouts Queue",
        description: "Approve & schedule",
        icon: CreditCard,
        accent: "text-cyan-300",
      },
      {
        href: "/admin/treasury",
        label: "Treasury",
        description: "Liquidity & exposure",
        icon: Gauge,
        accent: "text-amber-300",
      },
      {
        href: "/admin/fx",
        label: "FX Engine",
        description: "Rates & hedging",
        icon: Globe,
        accent: "text-cyan-200",
      },
    ],
  },
  {
    title: "Intelligence",
    items: [
      {
        href: "/intelligence",
        label: "AI Intelligence",
        description: "Marketplace-wide signals",
        icon: BrainCircuit,
        accent: "text-fuchsia-300",
      },
      {
        href: "/admin/intelligence",
        label: "Ops Intelligence",
        description: "Decisions & agents",
        icon: Sparkles,
        accent: "text-yellow-300",
      },
      {
        href: "/admin/risk-dashboard",
        label: "Risk Dashboard",
        description: "Vendor risk scoring",
        icon: Radar,
        accent: "text-red-300",
      },
      {
        href: "/admin/network",
        label: "Network",
        description: "Graph & connections",
        icon: Network,
        accent: "text-indigo-300",
      },
    ],
  },
  {
    title: "Trust",
    items: [
      {
        href: "/admin/compliance",
        label: "Compliance",
        description: "AML / sanctions",
        icon: ShieldAlert,
        accent: "text-orange-300",
      },
      {
        href: "/dashboard/admin/kyc",
        label: "KYC Reviews",
        description: "Approve identities",
        icon: ShieldCheck,
        accent: "text-emerald-300",
      },
      {
        href: "/dashboard/admin/transactions",
        label: "Transactions",
        description: "Ledger explorer",
        icon: Receipt,
        accent: "text-cyan-300",
      },
      {
        href: "/dashboard/admin/ledger",
        label: "Ledger",
        description: "Journal entries",
        icon: ScrollText,
        accent: "text-zinc-200",
      },
      {
        href: "/dashboard/admin/categories",
        label: "Categories",
        description: "Catalog taxonomy",
        icon: Boxes,
        accent: "text-purple-300",
      },
      {
        href: "/dashboard/admin/analytics",
        label: "Analytics",
        description: "Growth & engagement",
        icon: BarChart3,
        accent: "text-cyan-300",
      },
    ],
  },
];

export const VENDOR_KPI_LINKS = {
  revenue: "/vendor/finance",
  payouts: "/dashboard/vendor/wallet",
  orders: "/vendor/orders",
  lowStock: "/vendor/products",
  products: "/vendor/products",
  intelligence: "/vendor/intelligence",
  newProduct: "/dashboard/create-product",
} as const;

export const ADMIN_KPI_LINKS = {
  treasury: "/admin/treasury",
  fraud: "/admin/risk-dashboard",
  vendors: "/admin/risk-dashboard",
  compliance: "/admin/compliance",
  payouts: "/admin/payouts",
  finance: "/finance",
  intelligence: "/intelligence",
  live: "/admin/live",
  fx: "/admin/fx",
} as const;

// Re-exports so consumers don't need to import from lucide-react directly.
export {
  AlertTriangle,
  Database,
  ShoppingBag,
  Sparkles,
  Wallet,
};
