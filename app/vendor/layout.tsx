import DashboardSidebar from "@/components/layout/DashboardSidebar";
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
        <PlatformSubscriptionGate>{children}</PlatformSubscriptionGate>
      </div>
    </div>
  );
}
