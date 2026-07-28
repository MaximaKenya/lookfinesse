import { NextResponse } from "next/server";
import { toggleFollow, isFollowing } from "@/lib/social/engagement";

export async function POST(req: Request) {
  const { follower_id, vendor_id } = await req.json();
  if (!follower_id || !vendor_id) {
    return NextResponse.json({ error: "Missing ids" }, { status: 400 });
  }
  const result = await toggleFollow(follower_id, vendor_id);
  return NextResponse.json(result);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const followerId = searchParams.get("follower_id");
  const vendorId = searchParams.get("vendor_id");

  if (!followerId || !vendorId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const following = await isFollowing(followerId, vendorId);
  return NextResponse.json({ following });
}
