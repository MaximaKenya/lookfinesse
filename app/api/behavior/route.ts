import { NextResponse } from "next/server";
import { trackBehavior } from "@/lib/ai/trackBehavior";
import { updateInterestProfile } from "@/lib/ai/updateInterestProfile";
import { recordDailyActivity } from "@/lib/social/engagement";

export async function POST(req: Request) {
  const body = await req.json();
  const { user_id, entity_type, entity_id, event_type, watch_time, metadata, category } = body;

  if (!user_id || !event_type) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await trackBehavior({
    userId: user_id,
    entityType: entity_type ?? "unknown",
    entityId: entity_id,
    eventType: event_type,
    watchTime: watch_time,
    metadata,
  });

  if (category) {
    await updateInterestProfile({ userId: user_id, category, weight: 1 }).catch(() => {});
  }

  if (event_type === "view" || event_type === "purchase") {
  await recordDailyActivity(user_id).catch(() => {});
  }

  return NextResponse.json({ tracked: true });
}
