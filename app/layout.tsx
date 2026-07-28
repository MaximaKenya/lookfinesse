import type { Metadata, Viewport } from "next";

import "./globals.css";

import { CartProvider }
  from "@/context/CartContext";

import CartDrawer
  from "@/components/CartDrawer";

import CopilotPanel
  from "@/components/ai/CopilotPanel";

import EnvGuard from "@/components/EnvGuard";

import { Toaster }
  from "sonner";

export const metadata: Metadata = {
  title: {
    default: "LookFinesse — Fashion, Beauty & Fitness Marketplace",
    template: "%s · LookFinesse",
  },
  description:
    "AI-powered fashion, beauty, fitness & wellness social commerce — shop, book services, follow creators. Kenya & beyond.",
  keywords: ["fashion", "beauty", "fitness", "marketplace", "Kenya", "M-Pesa", "creators"],
  openGraph: {
    title: "LookFinesse — Fashion, Beauty & Fitness Marketplace",
    description:
      "AI-powered social commerce for fashion, beauty, fitness & wellness.",
    siteName: "LookFinesse",
    type: "website",
    locale: "en_KE",
  },
  twitter: {
    card: "summary_large_image",
    title: "LookFinesse",
    description: "Fashion, beauty & fitness social commerce",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/logo-icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/logo-icon.svg", type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LookFinesse",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body
        className="antialiased bg-black font-sans min-h-full overflow-x-hidden"
      >
        <CartProvider>

          {children}

          <CartDrawer />

          <CopilotPanel />

          <EnvGuard />

          <Toaster
            richColors
            position="top-right"
          />

        </CartProvider>
      </body>
    </html>
  );
}