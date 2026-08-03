"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  CreditCard,
  RefreshCw,
  RotateCcw,
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

type Payment = {
  id: string;
  order_id?: string;
  provider?: string;
  status: string;
  amount: number;
  phone?: string | null;
  created_at?: string;
};

type Overview = {
  empty: boolean;
  kpis: {
    total: number;
    paidCount: number;
    paidVolume: number;
    pendingCount: number;
    failedCount: number;
  };
  payments: Payment[];
  statusBreakdown: { status: string; count: number; amount: number }[];
  seedHint?: string;
};

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (["paid", "completed", "success"].includes(s))
    return "border-green-500/30 bg-green-500/10 text-green-300";
  if (["pending", "processing", "initiated"].includes(s))
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
  return "border-red-500/30 bg-red-500/10 text-red-300";
}

export default function TransactionsPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/transactions/overview", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(
          res.status === 401 || res.status === 403
            ? "Admin access required."
            : `Transactions overview failed (${res.status})`
        );
      }
      setData((await res.json()) as Overview);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load transactions"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function retryPayment(id: string) {
    setRetrying(id);
    try {
      const res = await fetch("/api/payments/retry", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: id }),
      });
      const json = await res.json().catch(() => ({}));
      if (json.url) window.open(json.url, "_blank");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setRetrying(null);
    }
  }

  const kpis = data?.kpis;

  return (
    <main className="min-h-screen bg-black text-white px-3 sm:px-4 md:px-6 py-6 sm:py-8 overflow-x-hidden">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
              <CreditCard className="h-3.5 w-3.5" />
              Payment Transactions
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
              Transactions
            </h1>
            <p className="max-w-2xl text-sm md:text-base text-zinc-400 leading-relaxed">
              Live payments rail — paid, pending, and failed — via admin API.
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
              href="/dashboard/admin/analytics"
              className="inline-flex items-center gap-2 rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-2.5 text-sm font-semibold text-fuchsia-200 hover:bg-fuchsia-500/20"
            >
              Analytics
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
            label="Paid Volume"
            value={`KES ${(kpis?.paidVolume ?? 0).toLocaleString()}`}
            helper={`${kpis?.paidCount ?? 0} paid`}
            href="/dashboard/admin/analytics"
            tone="border-green-500/20 bg-green-500/5 hover:bg-green-500/10"
            icon={CreditCard}
          />
          <AdminKpiTile
            label="Pending"
            value={String(kpis?.pendingCount ?? 0)}
            helper="Awaiting confirm"
            href="#list"
            tone="border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10"
            icon={RefreshCw}
          />
          <AdminKpiTile
            label="Failed"
            value={String(kpis?.failedCount ?? 0)}
            helper="Retry candidates"
            href="#list"
            tone="border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
            icon={RotateCcw}
          />
          <AdminKpiTile
            label="Total"
            value={String(kpis?.total ?? 0)}
            helper="All payments"
            href="/admin/finance"
            tone="border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10"
            icon={ArrowUpRight}
          />
        </section>

        {data?.empty && (
          <AdminEmptyState title="No transactions yet" hint={data.seedHint} />
        )}

        {(data?.statusBreakdown ?? []).length > 0 && (
          <AdminPanel>
            <h2 className="text-lg font-bold mb-4">Status volume</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.statusBreakdown ?? []}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="status" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "#09090b",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                    }}
                  />
                  <Bar dataKey="amount" fill="#22d3ee" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AdminPanel>
        )}

        <AdminPanel id="list">
          <h2 className="text-lg font-bold mb-4">Payment list</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-zinc-500 border-b border-white/10">
                  <th className="pb-3 pr-3">Order</th>
                  <th className="pb-3 pr-3">Provider</th>
                  <th className="pb-3 pr-3">Amount</th>
                  <th className="pb-3 pr-3">Status</th>
                  <th className="pb-3 pr-3">Phone</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {(data?.payments ?? []).map((p) => (
                  <tr key={p.id} className="border-b border-white/5">
                    <td className="py-3 pr-3 text-zinc-400">
                      {p.order_id?.slice(0, 8) ?? "—"}
                    </td>
                    <td className="py-3 pr-3">{p.provider ?? "—"}</td>
                    <td className="py-3 pr-3 font-semibold">
                      KES {Number(p.amount).toLocaleString()}
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase ${statusTone(p.status)}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-zinc-500">{p.phone || "—"}</td>
                    <td className="py-3">
                      {!["paid", "completed", "success"].includes(
                        String(p.status).toLowerCase()
                      ) && (
                        <button
                          type="button"
                          disabled={retrying === p.id}
                          onClick={() => void retryPayment(p.id)}
                          className="inline-flex items-center gap-1 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(data?.payments ?? []).length === 0 && (
              <p className="text-sm text-zinc-500 py-4">No payments.</p>
            )}
          </div>
        </AdminPanel>
      </div>
    </main>
  );
}
