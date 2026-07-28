import { NextResponse } from "next/server";
import { getCollections, createCollection } from "@/lib/social/engagement";

export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get("user_id");
  if (!userId) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  const collections = await getCollections(userId);
  return NextResponse.json(collections);
}

export async function POST(req: Request) {
  const { user_id, name, description } = await req.json();
  if (!user_id || !name) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const collection = await createCollection(user_id, name, description);
  return NextResponse.json(collection);
}
