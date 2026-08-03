import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { requireAdminPage } from "@/lib/auth/requireAdminPage";

export default async function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage({ returnPath: "/finance" });

  return (
    <div className="min-h-screen bg-black text-white">
      <DashboardSidebar
        variant="admin"
        brand={{
          title: "Marketplace OS",
          subtitle: "Financial Control",
          badge: "Treasury Live",
          accent: "text-green-300",
        }}
        footer={{
          label: "Mission Control",
          helper: "Return to admin overview",
          href: "/admin",
        }}
      />
      <div className="lg:pl-72">
        <div className="min-h-screen">{children}</div>
      </div>
    </div>
  );
}
