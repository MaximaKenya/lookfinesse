"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function PointsChip() {
  const { userId } = useCurrentUser();
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/gamification?user_id=${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.streak) return;
        const points = Number(data.streak.points ?? 0);
        const streak = Number(data.streak.current_streak ?? 0);
        setLabel(`${streak} day streak · ${points} pts`);
      })
      .catch(() => {});
  }, [userId]);

  if (!label) return null;
  return (
    <Link
      href="/profile"
      className="hidden sm:inline-flex items-center rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100"
    >
      {label}
    </Link>
  );
}
