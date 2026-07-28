"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";
import { getSupabaseEnvIssues, isSupabaseConfigured } from "@/lib/supabase/env";
import { checkSupabaseHealth } from "@/lib/supabase/healthCheck";

type BannerState = {
  title: string;
  message: string;
  dismissible: boolean;
  variant: "missing" | "unreachable";
};

export default function EnvGuard() {
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      const issues = getSupabaseEnvIssues();
      setBanner({
        title: "Supabase not configured",
        message:
          issues.join(" · ") ||
          "Add your Supabase URL and anon key to .env.local, then restart the dev server.",
        dismissible: false,
        variant: "missing",
      });
      return;
    }

    let cancelled = false;

    checkSupabaseHealth().then((health) => {
      if (cancelled || health.ok) return;

      setBanner({
        title: "Cannot reach Supabase",
        message:
          health.error ??
          "Your project may be paused, deleted, or the URL/key in .env.local is wrong.",
        dismissible: true,
        variant: "unreachable",
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!banner || dismissed) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-0 inset-x-0 z-[100] border-t border-amber-500/30 bg-amber-950/95 backdrop-blur-sm px-4 py-3 text-amber-50 shadow-lg"
    >
      <div className="mx-auto max-w-3xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-300" />
        <div className="flex-1 min-w-0 text-sm leading-relaxed">
          <p className="font-semibold text-amber-100">{banner.title}</p>
          <p className="text-amber-100/85 mt-0.5">{banner.message}</p>

          <ol className="mt-2.5 space-y-1 text-xs text-amber-100/80 list-decimal list-inside">
            <li>
              Open{" "}
              <Link
                href="https://supabase.com/dashboard"
                className="underline hover:text-amber-50"
                target="_blank"
                rel="noopener noreferrer"
              >
                Supabase Dashboard
              </Link>{" "}
              → your project
            </li>
            <li>
              Go to <strong className="font-semibold">Settings → API</strong>
            </li>
            <li>
              Copy <strong className="font-semibold">Project URL</strong> and{" "}
              <strong className="font-semibold">anon public</strong> key
            </li>
            <li>
              Paste into <code className="rounded bg-black/30 px-1">.env.local</code>:
              <pre className="mt-1 rounded-lg bg-black/35 border border-amber-500/20 p-2 text-[10px] leading-relaxed overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...`}
              </pre>
            </li>
            <li>Restart with <code className="rounded bg-black/30 px-1">npm run dev</code></li>
          </ol>

          <p className="text-xs text-amber-200/70 mt-2">
            Full setup guide: see <span className="font-mono text-amber-100/90">docs/DEV.md</span> in the project root.
          </p>
        </div>
        {banner.dismissible && (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded-lg p-1.5 text-amber-200/80 hover:bg-amber-500/20 hover:text-amber-50"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
