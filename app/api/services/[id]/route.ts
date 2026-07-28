import { NextResponse } from "next/server";
import { getServiceById } from "@/lib/social/queries";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const service = await getServiceById(id);
  if (!service) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(service);
}
