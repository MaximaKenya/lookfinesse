"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import Pagination, { getPageSlice } from "@/components/ui/Pagination";
import PushOptIn from "@/components/notifications/PushOptIn";

const NOTIF_ICONS: Record<string, string> = {
  follow: "👤",
  like: "❤️",
  comment: "💬",
  booking: "📅",
  live: "🔴",
  challenge: "🏆",
  promo: "🎁",
  system: "⚡",
};

export default function NotificationsPage() {
  const { userId } = useCurrentUser();
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/notifications?user_id=${userId}`)
      .then((r) => r.json())
      .then(setItems);
  }, [userId]);

  const markAllRead = async () => {
    if (!userId) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const filtered = filter === "unread" ? items.filter((n) => !n.is_read) : items;
  const unreadCount = items.filter((n) => !n.is_read).length;
  const { slice: pagedItems, totalPages, safePage } = getPageSlice(filtered, page, PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-white/40 text-sm mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        <button
          onClick={markAllRead}
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors"
        >
          <CheckCheck className="w-4 h-4" />
          Mark all read
        </button>
      </header>

      <div className="mb-6">
        <PushOptIn />
        <p className="text-xs text-white/35 mt-2">
          Push covers order status, booking reminders, new followers, and low-stock (vendors). Works without
          FCM keys via local notifications; set NEXT_PUBLIC_VAPID_PUBLIC_KEY for Web Push.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {["all", "unread"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as "all" | "unread")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all capitalize ${
              filter === f ? "bg-white text-black" : "bg-white/5 text-white/50 border border-white/8"
            }`}
          >
            {f}
            {f === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 bg-purple-500/20 text-purple-400 text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {!userId && (
        <div className="text-center py-16 space-y-4">
          <Bell className="w-12 h-12 text-white/20 mx-auto" />
          <p className="text-white/40">Sign in to see notifications</p>
          <Link href="/login" className="inline-block bg-white text-black px-6 py-2.5 rounded-2xl font-semibold text-sm">
            Sign In
          </Link>
        </div>
      )}

      {userId && (
        <div className="space-y-2">
          {pagedItems.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl p-4 border transition-all ${
                n.is_read
                  ? "bg-[#0f0f0f] border-white/5"
                  : "bg-purple-500/5 border-purple-500/15"
              }`}
            >
              {n.link_url ? (
                <Link href={n.link_url} className="flex items-start gap-3">
                  <span className="text-xl shrink-0 mt-0.5">{NOTIF_ICONS[n.type] || "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{n.title}</p>
                    {n.message && <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{n.message}</p>}
                    <p className="text-[11px] text-white/25 mt-1.5">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0 mt-1.5" />}
                </Link>
              ) : (
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0 mt-0.5">{NOTIF_ICONS[n.type] || "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{n.title}</p>
                    {n.message && <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{n.message}</p>}
                    <p className="text-[11px] text-white/25 mt-1.5">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0 mt-1.5" />}
                </div>
              )}
            </div>
          ))}

          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} className="pt-4" />

          {filtered.length === 0 && (
            <div className="text-center py-16 space-y-3">
              <Bell className="w-10 h-10 text-white/15 mx-auto" />
              <p className="text-white/30 text-sm">
                {filter === "unread" ? "All caught up!" : "No notifications yet"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
