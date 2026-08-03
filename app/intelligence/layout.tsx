import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { requireAdminPage } from "@/lib/auth/requireAdminPage";

export default async function IntelligenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage({ returnPath: "/intelligence" });

  return (
    <div className="min-h-screen bg-black text-white">
      <DashboardSidebar
        variant="admin"
        brand={{
          title: "Marketplace OS",
          subtitle: "AI Intelligence",
          badge: "Signals Active",
          accent: "text-fuchsia-300",
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
