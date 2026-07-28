"use client";

import { usePathname } from "next/navigation";

import DashboardSidebar from "@/components/layout/DashboardSidebar";
import PlatformSubscriptionGate from "@/components/vendor/PlatformSubscriptionGate";

/**
 * Dashboard shell — no redirects to /feed.
 * Auth/role gates live in proxy.ts + page-level UI (shopper upgrade CTA).
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const isAdminSection = pathname.startsWith("/dashboard/admin");

  if (isAdminSection) {
    return (
      <div className="min-h-screen bg-black text-white">
        <DashboardSidebar
          variant="admin"
          brand={{
            title: "Marketplace OS",
            subtitle: "Admin Infrastructure",
            badge: "System Healthy",
            accent: "text-green-300",
          }}
          footer={{
            label: "Vendor Cockpit",
            helper: "Jump to vendor experience",
            href: "/vendor",
          }}
        />
        <div className="dashboard-content">{children}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <DashboardSidebar
        variant="vendor"
        brand={{
          title: "Vendor Cockpit",
          subtitle: "Commerce Operating System",
          badge: "Live",
          accent: "text-cyan-300",
        }}
        footer={{
          label: "Platform Plan",
          helper: "Subscription tiers & billing",
          href: "/dashboard/subscription",
        }}
      />
      <div className="dashboard-content">
        <PlatformSubscriptionGate>{children}</PlatformSubscriptionGate>
      </div>
    </div>
  );
}
