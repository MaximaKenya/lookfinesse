import DashboardSidebar from "@/components/layout/DashboardSidebar";
import AccountTrialBanner from "@/components/trial/AccountTrialBanner";
import PlatformSubscriptionGate from "@/components/vendor/PlatformSubscriptionGate";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          helper: "Subscription & tiers",
          href: "/dashboard/subscription",
        }}
      />
      <div className="dashboard-content">
        <div className="px-4 pt-4 sm:px-6">
          <AccountTrialBanner />
        </div>
        <PlatformSubscriptionGate>{children}</PlatformSubscriptionGate>
      </div>
    </div>
  );
}
