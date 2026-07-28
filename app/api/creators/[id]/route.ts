import { NextResponse } from "next/server";
import { getCreatorProfile } from "@/lib/social/queries";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const profile = await getCreatorProfile(id);
  if (!profile.vendor) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }
  return NextResponse.json(profile);
}
