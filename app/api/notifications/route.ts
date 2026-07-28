import { NextResponse } from "next/server";
import { getNotifications, markNotificationsRead } from "@/lib/social/engagement";

export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get("user_id");
  if (!userId) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  const notifications = await getNotifications(userId);
  return NextResponse.json(notifications);
}

export async function PATCH(req: Request) {
  const { user_id, ids } = await req.json();
  if (!user_id) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  await markNotificationsRead(user_id, ids);
  return NextResponse.json({ success: true });
}
