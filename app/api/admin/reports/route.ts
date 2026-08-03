import { supabase } from "@/lib/supabaseClient";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET() {
  const __adminGate = await requireAdmin();
  if (!__adminGate.ok) return __adminGate.response;
  const { db: __adminDb } = __adminGate.ctx;
  void __adminDb;
  const { data } = await supabase
    .from("payments")
    .select("*");

  const csv = [
    ["ID", "Amount", "Status", "Date"],
    ...(data || []).map((p) => [
      p.id,
      p.amount,
      p.status,
      p.created_at,
    ]),
  ]
    .map((row) => row.join(","))
    .join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=report.csv",
    },
  });
}