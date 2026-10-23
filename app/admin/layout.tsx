import DashboardSidebar from "@/components/layout/DashboardSidebar";
import AccountTrialBanner from "@/components/trial/AccountTrialBanner";
import { requireAdminPage } from "@/lib/auth/requireAdminPage";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage({ returnPath: "/admin" });

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
      <div className="lg:pl-72">
        <div className="min-h-screen">
          <div className="px-4 pt-4 md:px-8">
            <AccountTrialBanner />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
