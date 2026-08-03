"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  XCircle,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  AdminEmptyState,
  AdminKpiTile,
  AdminPanel,
} from "@/components/admin/finance/AdminGlass";

type KycItem = {
  id: string;
  subject_id: string;
  subject_type: "user" | "vendor";
  status: string;
  label: string;
  document_url?: string | null;
  country?: string | null;
  document_type?: string | null;
  created_at?: string;
  source: string;
};

type Overview = {
  empty: boolean;
  kpis: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    vendorCount: number;
    userCount: number;
  };
  items: KycItem[];
  pending: KycItem[];
  statusBreakdown: { status: string; count: number }[];
  seedHint?: string;
};

const PIE_COLORS = ["#fbbf24", "#34d399", "#f87171", "#a78bfa"];

export default function AdminKYCPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/kyc/overview", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(
          res.status === 401 || res.status === 403
            ? "Admin access required."
            : `KYC overview failed (${res.status})`
        );
      }
      setData((await res.json()) as Overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load KYC");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function approve(id: string) {
    setActing(id);
    try {
      const res = await fetch("/api/admin/kyc/approve", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kycId: id }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Approve failed");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setActing(null);
    }
  }

  const list = (data?.items ?? []).filter((i) => {
    if (filter === "all") return true;
    if (filter === "pending")
      return ["pending", "PENDING", "submitted", "SUBMITTED"].includes(i.status);
    return ["approved", "APPROVED", "verified", "VERIFIED"].includes(i.status);
  });

  const kpis = data?.kpis;

  return (
    <main className="min-h-screen bg-black text-white px-3 sm:px-4 md:px-6 py-6 sm:py-8 overflow-x-hidden">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-green-300">
              <UserCheck className="h-3.5 w-3.5" />
              Identity Compliance
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
              KYC Approvals
            </h1>
            <p className="max-w-2xl text-sm md:text-base text-zinc-400 leading-relaxed">
              Review user and vendor identity submissions. Approvals write through
              the admin service-role API.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/10"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              href="/admin/compliance"
              className="inline-flex items-center gap-2 rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-2.5 text-sm font-semibold text-orange-200 hover:bg-orange-500/20"
            >
              <ShieldAlert className="h-4 w-4" />
              Compliance
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <AdminKpiTile
            label="Pending"
            value={String(kpis?.pending ?? 0)}
            helper="Awaiting review"
            href="#queue"
            tone="border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10"
            icon={UserCheck}
          />
          <AdminKpiTile
            label="Approved"
            value={String(kpis?.approved ?? 0)}
            helper="Verified identities"
            href="#queue"
            tone="border-green-500/20 bg-green-500/5 hover:bg-green-500/10"
            icon={CheckCircle2}
          />
          <AdminKpiTile
            label="Rejected"
            value={String(kpis?.rejected ?? 0)}
            helper="Denied"
            href="#queue"
            tone="border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
            icon={XCircle}
          />
          <AdminKpiTile
            label="Total"
            value={String(kpis?.total ?? 0)}
            helper={`${kpis?.vendorCount ?? 0} vendors / ${kpis?.userCount ?? 0} users`}
            href="/admin/compliance"
            tone="border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10"
            icon={ShieldAlert}
          />
        </section>

        {data?.empty && (
          <AdminEmptyState title="No KYC records yet" hint={data.seedHint} />
        )}

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {(data?.statusBreakdown ?? []).length > 0 && (
            <AdminPanel>
              <h2 className="text-lg font-bold mb-4">Status mix</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.statusBreakdown ?? []}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {(data?.statusBreakdown ?? []).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#09090b",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </AdminPanel>
          )}

          <AdminPanel className="xl:col-span-2" id="queue">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold">Review queue</h2>
              <div className="flex gap-2">
                {(["pending", "approved", "all"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold capitalize ${
                      filter === f
                        ? "border-green-500/40 bg-green-500/15 text-green-200"
                        : "border-white/10 bg-white/5 text-zinc-400"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2 max-h-[520px] overflow-y-auto">
              {list.map((k) => (
                <div
                  key={`${k.source}-${k.id}`}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-white/8 bg-black/40 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{k.label}</div>
                    <div className="text-[11px] text-zinc-500">
                      {k.subject_type} · {k.status}
                      {k.country ? ` · ${k.country}` : ""}
                      {k.document_type ? ` · ${k.document_type}` : ""}
                    </div>
                  </div>
                  {["pending", "PENDING", "submitted", "SUBMITTED"].includes(
                    k.status
                  ) && (
                    <button
                      type="button"
                      disabled={acting === k.id}
                      onClick={() => void approve(k.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-200 hover:bg-green-500/20 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve
                    </button>
                  )}
                </div>
              ))}
              {list.length === 0 && (
                <p className="text-sm text-zinc-500">No items in this filter.</p>
              )}
            </div>
          </AdminPanel>
        </section>
      </div>
    </main>
  );
}
