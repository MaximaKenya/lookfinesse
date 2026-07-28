import AppNav from "@/components/layout/AppNav";
import MainScrollShell from "@/components/layout/MainScrollShell";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNav />
      <MainScrollShell>{children}</MainScrollShell>
    </>
  );
}
