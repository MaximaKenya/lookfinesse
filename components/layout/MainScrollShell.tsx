"use client";

import { usePathname } from "next/navigation";

export default function MainScrollShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const isReels = pathname === "/reels" || pathname.startsWith("/reels/");

  return (
    <main
      className={`app-main bg-black text-white ${
        isReels ? "app-main--reels" : ""
      }`}
    >
      <div className="relative min-h-full">
        <div className="pointer-events-none fixed top-0 left-64 w-[500px] h-[500px] bg-purple-500/5 blur-[140px] rounded-full hidden md:block" />
        <div className="pointer-events-none fixed bottom-0 right-0 w-[400px] h-[400px] bg-pink-500/5 blur-[120px] rounded-full" />
        {children}
      </div>
    </main>
  );
}
