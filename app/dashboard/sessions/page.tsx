"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Calendar, Plus, Video, MapPin, Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";

export default function SessionsPage() {
  const { userId } = useCurrentUser();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    starts_at: "",
    ends_at: "",
    capacity: 20,
    is_online: false,
  });

  useEffect(() => {
    if (!userId) return;
    fetch("/api/vendor/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d?.vendorId) setVendorId(d.vendorId);
      })
      .catch(() => {});
  }, [userId]);

  const loadSessions = () => {
    if (!vendorId) return;
    setLoading(true);
    fetch(`/api/class-sessions?vendor_id=${vendorId}&upcoming=1`)
      .then((r) => r.json())
      .then((d) => setSessions(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSessions();
  }, [vendorId]);

  const createSession = async () => {
    if (!vendorId || !form.title || !form.starts_at || !form.ends_at) {
      toast.error("Fill in title and times");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/class-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendor_id: vendorId, ...form }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Session scheduled");
      setShowForm(false);
      setForm({ title: "", description: "", starts_at: "", ends_at: "", capacity: 20, is_online: false });
      loadSessions();
    } else {
      toast.error("Failed to create session");
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-cyan-300/80 font-semibold">Sessions</p>
          <h1 className="text-3xl font-bold text-white mt-1">Class Calendar</h1>
          <p className="text-white/40 text-sm mt-2">Schedule live and in-person classes for subscribers.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-2xl text-sm font-bold"
        >
          <Plus className="w-4 h-4" /> New session
        </button>
      </header>

      {showForm && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-4">
          <input
            placeholder="Session title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm"
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm resize-none"
            rows={2}
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs text-white/40 space-y-1">
              Starts
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
              />
            </label>
            <label className="text-xs text-white/40 space-y-1">
              Ends
              <input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-xs text-white/40 flex items-center gap-2">
              Capacity
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                className="w-20 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white text-sm"
              />
            </label>
            <label className="text-xs text-white/60 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_online}
                onChange={(e) => setForm({ ...form, is_online: e.target.checked })}
              />
              Online / live stream
            </label>
          </div>
          <button
            type="button"
            onClick={createSession}
            disabled={saving}
            className="bg-cyan-500 text-black px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save session"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-white/30" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-dashed border-white/10">
          <Calendar className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No upcoming sessions</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="rounded-3xl border border-white/8 bg-white/[0.02] backdrop-blur-xl p-5 flex items-start justify-between gap-4"
            >
              <div>
                <p className="font-bold text-white">{s.title}</p>
                {s.description && <p className="text-xs text-white/40 mt-1">{s.description}</p>}
                <p className="text-sm text-white/50 mt-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(s.starts_at).toLocaleString("en-KE")}
                </p>
                <p className="text-xs text-white/30 mt-1">
                  {s.is_online ? (
                    <span className="inline-flex items-center gap-1 text-cyan-400"><Video className="w-3 h-3" /> Online</span>
                  ) : (
                    <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> In person</span>
                  )}
                  · Cap {s.capacity}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link href="/dashboard/provider" className="text-sm text-cyan-400 hover:underline">
        ← Back to Provider Hub
      </Link>
    </div>
  );
}
