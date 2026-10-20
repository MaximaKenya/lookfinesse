import AppNav from "@/components/layout/AppNav";
import MainScrollShell from "@/components/layout/MainScrollShell";
import { FadeIn } from "@/components/motion/FadeIn";
import PointsChip from "@/components/gamification/PointsChip";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNav />
      <div className="mx-auto max-w-6xl px-4 pt-3 flex justify-end">
        <PointsChip />
      </div>
      <MainScrollShell>
        <FadeIn>{children}</FadeIn>
      </MainScrollShell>
    </>
  );
}
