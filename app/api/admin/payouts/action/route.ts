import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireAdmin";

type Action = "approve" | "reject" | "retry" | "block";

/**
 * Admin payout actions against `payouts` and/or `payout_queue`.
 * approve → processing | reject → rejected | retry/block → queue control.
 */
export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const { db, user } = gate.ctx;

  let body: { action?: Action; payout_id?: string; source?: "payouts" | "queue" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action;
  const payoutId = body.payout_id;
  const source = body.source ?? "payouts";

  if (!action || !payoutId) {
    return NextResponse.json(
      { error: "Missing action or payout_id" },
      { status: 400 }
    );
  }

  const allowed: Action[] = ["approve", "reject", "retry", "block"];
  if (!allowed.includes(action)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  try {
    if (source === "queue" || action === "retry" || action === "block") {
      const queueUpdate =
        action === "retry"
          ? { status: "RETRY_SCHEDULED" }
          : action === "block" || action === "reject"
            ? { status: "FAILED" }
            : action === "approve"
              ? { status: "PROCESSING" }
              : null;

      if (!queueUpdate) {
        return NextResponse.json({ error: "Invalid queue action" }, { status: 400 });
      }

      const { error } = await db
        .from("payout_queue")
        .update(queueUpdate)
        .eq("id", payoutId);

      if (error) {
        // Fall through to payouts table if queue row missing
        if (source === "queue") {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      } else if (source === "queue") {
        await db.from("audit_logs").insert({
          action: `payout_queue_${action}`,
          table_name: "payout_queue",
          record_id: payoutId,
          actor_id: user.id,
          metadata: { action },
        });
        return NextResponse.json({ success: true, source: "queue", action });
      }
    }

    const statusMap: Record<Action, string> = {
      approve: "processing",
      reject: "rejected",
      retry: "pending",
      block: "failed",
    };

    const { data, error } = await db
      .from("payouts")
      .update({
        status: statusMap[action],
        updated_at: new Date().toISOString(),
      })
      .eq("id", payoutId)
      .select("id, status")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    }

    await db.from("audit_logs").insert({
      action: `payout_${action}`,
      table_name: "payouts",
      record_id: payoutId,
      actor_id: user.id,
      metadata: { action, status: data.status },
    });

    return NextResponse.json({
      success: true,
      source: "payouts",
      action,
      payout: data,
    });
  } catch (err) {
    console.error("[admin/payouts/action]", err);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
