"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { TRIAL_DAYS, daysRemainingLabel } from "@/lib/config/trial";

type Account = {
  userId: string;
  email: string | null;
  displayName: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  roles: string | null;
  daysRemaining: number | null;
  active: boolean;
};

export default function AdminTrialsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/trials", { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Could not load trials");
      setAccounts([]);
    } else {
      setAccounts(data.accounts ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return accounts;
    return accounts.filter((account) =>
      [account.email, account.displayName, account.roles, account.userId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [accounts, query]);

  async function act(userId: string, action: "extend" | "end") {
    setBusyId(userId);
    const res = await fetch("/api/admin/trials", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        action,
        days: action === "extend" ? TRIAL_DAYS : undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) {
      toast.error(data.error ?? "Could not update the trial");
      return;
    }
    toast.success(action === "end" ? "Trial ended" : `Trial extended by ${TRIAL_DAYS} days`);
    await load();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-100">
            <Sparkles className="h-3.5 w-3.5" />
            Trials
          </div>
          <h1 className="text-3xl font-bold">Free trials</h1>
          <p className="mt-1 text-sm text-white/50">
            Extend or end an account trial. Changes are written to the audit log. Content is never deleted.
          </p>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search accounts"
          placeholder="Search email or name"
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 sm:w-64"
        />
      </div>

      {error && (
        <p className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-3xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/40">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Account</th>
              <th scope="col" className="px-4 py-3 font-medium">Roles</th>
              <th scope="col" className="px-4 py-3 font-medium">Remaining</th>
              <th scope="col" className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-white/40">
                  Loading accounts…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-white/40">
                  No accounts match.
                </td>
              </tr>
            ) : (
              visible.map((account) => (
                <tr key={account.userId} className="border-t border-white/8">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{account.displayName || "Member"}</p>
                    <p className="text-xs text-white/40">{account.email}</p>
                  </td>
                  <td className="px-4 py-3 text-white/60">{account.roles}</td>
                  <td className="px-4 py-3 text-white/80">
                    {account.daysRemaining == null
                      ? "Not set"
                      : account.daysRemaining === 0
                        ? "Ended"
                        : daysRemainingLabel(account.daysRemaining)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busyId === account.userId}
                        onClick={() => void act(account.userId, "extend")}
                        className="rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
                      >
                        Extend {TRIAL_DAYS} days
                      </button>
                      <button
                        type="button"
                        disabled={busyId === account.userId || account.daysRemaining === 0}
                        onClick={() => void act(account.userId, "end")}
                        className="rounded-xl border border-rose-400/40 px-3 py-1.5 text-xs font-semibold text-rose-100 disabled:opacity-40"
                      >
                        End trial
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
