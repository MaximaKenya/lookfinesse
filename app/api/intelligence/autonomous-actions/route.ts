import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabaseClient";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET() {
  const __adminGate = await requireAdmin();
  if (!__adminGate.ok) return __adminGate.response;
  const { db: __adminDb } = __adminGate.ctx;
  void __adminDb;
  const { data: events, error } = await supabase
    .from("financial_events")
    .select("event_type, description, severity, created_at, status")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.warn("financial_events query:", error.message);
  }

  const { data: auditLogs } = await supabase
    .from("audit_logs")
    .select("action, details, created_at, severity")
    .order("created_at", { ascending: false })
    .limit(20);

  const fromEvents = (events ?? []).map((event) => ({
    action: event.description ?? event.event_type ?? "System event",
    status: String(event.status ?? event.severity ?? "MONITORING").toUpperCase(),
    created_at: event.created_at,
  }));

  const fromAudit = (auditLogs ?? []).map((log) => ({
    action: log.action ?? log.details ?? "Audit event",
    status: String(log.severity ?? "ACTIVE").toUpperCase(),
    created_at: log.created_at,
  }));

  const actions = [...fromEvents, ...fromAudit]
    .sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime()
    )
    .slice(0, 10);

  return NextResponse.json({
    actions,
    empty: actions.length === 0,
  });
}
