"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Calendar, ChevronLeft, ChevronRight, Plus, Radio, Bell } from "lucide-react";
import { toast } from "sonner";

type EventKind = "booking" | "live" | "slot";
interface CalEvent {
  id: string;
  kind: EventKind;
  title: string;
  when: string; // ISO
  meta?: string;
  href?: string;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function buildMonthGrid(cursor: Date): Date[] {
  const first = startOfMonth(cursor);
  const start = new Date(first);
  start.setDate(start.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

const KIND_COLOR: Record<EventKind, string> = {
  booking: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  live: "bg-red-500/20 text-red-300 border-red-500/30",
  slot: "bg-purple-500/15 text-purple-300 border-purple-500/25",
};

export default function VendorCalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (!uid) {
        setLoading(false);
        return;
      }
      // Vendor for this user
      const { data: vendor } = await supabase
        .from("vendors")
        .select("id")
        .eq("user_id", uid)
        .maybeSingle()
        .catch(() => ({ data: null } as any));

      const real: CalEvent[] = [];
      if (vendor?.id) {
        const [bookingsRes, liveRes, slotsRes] = await Promise.allSettled([
          supabase.from("bookings").select("id, service_id, status, created_at, availability_slots(starts_at)").eq("vendor_id", vendor.id).limit(50),
          supabase.from("live_sessions").select("id, title, scheduled_for, viewer_count").eq("vendor_id", vendor.id).gte("scheduled_for", new Date().toISOString()).limit(20),
          supabase.from("availability_slots").select("id, starts_at, ends_at, is_booked").eq("vendor_id", vendor.id).gte("starts_at", new Date().toISOString()).limit(40),
        ]);
        if (bookingsRes.status === "fulfilled") {
          for (const b of bookingsRes.value.data ?? []) {
            const ts = (b as any).availability_slots?.starts_at ?? b.created_at;
            real.push({ id: `b-${b.id}`, kind: "booking", title: `Booking · ${b.status}`, when: ts, href: `/bookings` });
          }
        }
        if (liveRes.status === "fulfilled") {
          for (const l of liveRes.value.data ?? []) {
            real.push({ id: `l-${l.id}`, kind: "live", title: l.title || "Live session", when: l.scheduled_for, meta: `${l.viewer_count ?? 0} RSVPs`, href: `/live/${l.id}` });
          }
        }
        if (slotsRes.status === "fulfilled") {
          for (const s of slotsRes.value.data ?? []) {
            if ((s as any).is_booked) continue;
            real.push({ id: `s-${s.id}`, kind: "slot", title: "Open slot", when: s.starts_at, meta: "Available" });
          }
        }
      }

      setEvents(real);
      setLoading(false);
    })();
  }, []);

  const monthDays = useMemo(() => buildMonthGrid(cursor), [cursor]);
  const eventsByDay = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    for (const e of events) {
      const key = new Date(e.when).toDateString();
      (map[key] ??= []).push(e);
    }
    return map;
  }, [events]);

  const upcoming = useMemo(
    () => [...events].filter((e) => new Date(e.when) >= new Date()).sort((a, b) => +new Date(a.when) - +new Date(b.when)).slice(0, 8),
    [events]
  );

  const sendReminder = (ev: CalEvent) => {
    toast.success(`Reminder queued for ${ev.title}`);
  };

  const monthLabel = cursor.toLocaleDateString("en-KE", { month: "long", year: "numeric" });
  const today = new Date().toDateString();

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Calendar className="w-6 h-6 text-purple-400" /> Calendar</h1>
            <p className="text-sm text-white/40">Appointments & scheduled live sessions</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/create-live" className="flex items-center gap-1.5 bg-red-500/15 text-red-300 border border-red-500/25 px-3 py-2 rounded-xl text-sm font-medium hover:bg-red-500/25">
              <Radio className="w-4 h-4" /> Schedule Live
            </Link>
            <Link href="/dashboard" className="flex items-center gap-1.5 bg-white text-black px-3 py-2 rounded-xl text-sm font-semibold hover:bg-white/90">
              <Plus className="w-4 h-4" /> Add Slot
            </Link>
          </div>
        </header>

        {!userId && (
          <div className="bg-yellow-500/8 border border-yellow-500/20 text-yellow-300 text-sm rounded-2xl px-4 py-3">
            You're seeing demo events. <Link href="/login" className="underline">Sign in</Link> as a vendor to view your real calendar.
          </div>
        )}

        {/* Month grid */}
        <div className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-semibold">{monthLabel}</h2>
            <button
              onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[10px] text-white/40 uppercase tracking-widest font-semibold mb-2">
            {"Sun Mon Tue Wed Thu Fri Sat".split(" ").map((d) => (
              <div key={d} className="text-center">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((d, i) => {
              const inMonth = d.getMonth() === cursor.getMonth();
              const key = d.toDateString();
              const dayEvents = eventsByDay[key] ?? [];
              const isToday = key === today;
              return (
                <div
                  key={i}
                  className={`min-h-[78px] rounded-xl p-1.5 border text-[11px] flex flex-col gap-1 ${
                    inMonth ? "bg-white/3 border-white/8" : "bg-transparent border-transparent text-white/20"
                  } ${isToday ? "ring-1 ring-purple-500/40" : ""}`}
                >
                  <span className={`text-[11px] font-semibold ${isToday ? "text-purple-300" : ""}`}>{d.getDate()}</span>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded-md border truncate ${KIND_COLOR[ev.kind]}`}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-white/40">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming list with reminders */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Upcoming</h2>
            <span className="text-xs text-white/40">{loading ? "Loading…" : `${upcoming.length} scheduled`}</span>
          </div>
          <div className="space-y-2">
            {upcoming.map((ev) => (
              <div key={ev.id} className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-4 flex items-center gap-3">
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${KIND_COLOR[ev.kind]}`}>{ev.kind}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{ev.title}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {new Date(ev.when).toLocaleString("en-KE", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {ev.meta ? ` · ${ev.meta}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => sendReminder(ev)}
                  className="flex items-center gap-1 bg-white/8 hover:bg-white/15 text-white/80 px-3 py-1.5 rounded-lg text-xs font-semibold"
                >
                  <Bell className="w-3.5 h-3.5" /> Remind
                </button>
                {ev.href && (
                  <Link href={ev.href} className="text-xs text-purple-300 hover:text-purple-200">View →</Link>
                )}
              </div>
            ))}
            {upcoming.length === 0 && !loading && (
              <div className="text-center py-12 text-white/30 text-sm">Nothing scheduled yet.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
