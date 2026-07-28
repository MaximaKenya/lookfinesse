import DashboardSidebar from "@/components/layout/DashboardSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        <div className="min-h-screen">{children}</div>
      </div>
    </div>
  );
}
