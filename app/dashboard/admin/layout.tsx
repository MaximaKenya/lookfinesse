import { requireAdminPage } from "@/lib/auth/requireAdminPage";

export default async function DashboardAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage({ returnPath: "/dashboard/admin" });
  return <>{children}</>;
}
