"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  FileWarning,
  RefreshCw,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AdminEmptyState,
  AdminKpiTile,
  AdminPanel,
} from "@/components/admin/finance/AdminGlass";

type Overview = {
  empty: boolean;
  kpis: {
    alertCount: number;
    openAlerts: number;
    criticalCount: number;
    auditCount: number;
    pendingKyc: number;
    fraudEventCount: number;
  };
  alerts: {
    id: string;
    vendor_id?: string;
    alert_type: string;
    severity: number;
    description?: string;
    status?: string;
    created_at?: string;
  }[];
  auditLogs: {
    id: string;
    action: string;
    entity_type?: string;
    created_at?: string;
  }[];
  severitySeries: { label: string; count: number }[];
  seedHint?: string;
};

export default function ComplianceDashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/compliance/overview", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(
          res.status === 401 || res.status === 403
            ? "Admin access required."
            : `Compliance overview failed (${res.status})`
        );
      }
      setData((await res.json()) as Overview);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load compliance"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 25000);
    return () => clearInterval(id);
  }, [load]);

  const kpis = data?.kpis;

  return (
    <main className="min-h-screen bg-black text-white px-3 sm:px-4 md:px-6 py-6 sm:py-8 overflow-x-hidden">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-300">
              <ShieldAlert className="h-3.5 w-3.5" />
              Compliance Operations
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
              AML & Compliance
            </h1>
            <p className="max-w-2xl text-sm md:text-base text-zinc-400 leading-relaxed">
              AML alerts, audit trail, and KYC backlog from live admin-scoped
              queries.
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
              href="/dashboard/admin/kyc"
              className="inline-flex items-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm font-semibold text-green-300 hover:bg-green-500/20"
            >
              <UserCheck className="h-4 w-4" />
              KYC Queue
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
            label="Open Alerts"
            value={String(kpis?.openAlerts ?? 0)}
            helper={`${kpis?.alertCount ?? 0} total`}
            href="#alerts"
            tone="border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10"
            icon={FileWarning}
          />
          <AdminKpiTile
            label="Critical"
            value={String(kpis?.criticalCount ?? 0)}
            helper="Severity ≥ 7"
            href="#alerts"
            tone="border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
            icon={ShieldAlert}
          />
          <AdminKpiTile
            label="Pending KYC"
            value={String(kpis?.pendingKyc ?? 0)}
            helper="Identity review"
            href="/dashboard/admin/kyc"
            tone="border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10"
            icon={UserCheck}
          />
          <AdminKpiTile
            label="Audit Events"
            value={String(kpis?.auditCount ?? 0)}
            helper="Compliance trail"
            href="#audit"
            tone="border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10"
            icon={RefreshCw}
          />
        </section>

        {data?.empty && (
          <AdminEmptyState
            title="No compliance alerts yet"
            hint={data.seedHint}
          />
        )}

        {(data?.severitySeries ?? []).some((s) => s.count > 0) && (
          <AdminPanel>
            <h2 className="text-lg font-bold mb-4">Severity mix</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.severitySeries ?? []}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="label" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#09090b",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                    }}
                  />
                  <Bar dataKey="count" fill="#fb923c" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AdminPanel>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AdminPanel id="alerts">
            <h2 className="text-lg font-bold mb-4">AML alerts</h2>
            <div className="space-y-2 max-h-[480px] overflow-y-auto">
              {(data?.alerts ?? []).map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-red-100">
                        {a.alert_type}
                      </div>
                      <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                        {a.description ?? "—"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-[11px] font-semibold text-yellow-300">
                      Sev {a.severity}
                    </span>
                  </div>
                </div>
              ))}
              {(data?.alerts ?? []).length === 0 && (
                <p className="text-sm text-zinc-500">No AML alerts.</p>
              )}
            </div>
          </AdminPanel>

          <AdminPanel id="audit">
            <h2 className="text-lg font-bold mb-4">Audit trail</h2>
            <div className="space-y-2 max-h-[480px] overflow-y-auto">
              {(data?.auditLogs ?? []).map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-white/8 bg-black/40 px-4 py-3"
                >
                  <div className="text-sm font-semibold">{log.action}</div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    {log.entity_type ?? "entity"} ·{" "}
                    {log.created_at
                      ? new Date(log.created_at).toLocaleString()
                      : "—"}
                  </div>
                </div>
              ))}
              {(data?.auditLogs ?? []).length === 0 && (
                <p className="text-sm text-zinc-500">No audit events.</p>
              )}
            </div>
          </AdminPanel>
        </section>
      </div>
    </main>
  );
}
