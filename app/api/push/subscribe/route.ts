import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";

function missingTable(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (error.message?.includes("push_subscriptions") && error.message.includes("does not exist"))
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = body.user_id as string | undefined;
    const endpoint = (body.endpoint as string | undefined) ?? "";
    if (!userId || !endpoint) {
      return NextResponse.json({ error: "Missing user_id or endpoint" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const keys = body.keys ?? {};
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint,
        p256dh: keys.p256dh ?? null,
        auth: keys.auth ?? null,
        fcm_token: body.fcm_token ?? null,
        user_agent: body.user_agent ?? null,
        topics: body.topics ?? ["orders", "bookings", "social", "stock"],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,endpoint" }
    );

    if (error) {
      if (missingTable(error)) {
        return NextResponse.json({
          ok: true,
          stored: false,
          note: "push_subscriptions table missing — run migration 027. Local notifications still work.",
        });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, stored: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Push subscribe failed";
    if (message.includes("SUPABASE_MISCONFIGURED")) {
      return NextResponse.json({ ok: true, stored: false, note: "Supabase not configured" });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const endpoint = searchParams.get("endpoint");
    if (!userId) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });

    const supabase = await createSupabaseServer();
    let q = supabase.from("push_subscriptions").delete().eq("user_id", userId);
    if (endpoint) q = q.eq("endpoint", endpoint);
    const { error } = await q;
    if (error && !missingTable(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
