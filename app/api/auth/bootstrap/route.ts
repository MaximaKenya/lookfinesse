import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/requireUser";
import { bootstrapAccount } from "@/lib/auth/bootstrapAccount";
import type { IntendedAccountKind } from "@/lib/auth/signupErrors";

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  let intendedRole: IntendedAccountKind = "shopper";
  let username: string | null = null;
  try {
    const body = await req.json();
    if (body?.intendedRole === "vendor") intendedRole = "vendor";
    if (typeof body?.username === "string") username = body.username;
  } catch {
    /* empty body is fine */
  }

  const meta = (auth.user.user_metadata ?? {}) as Record<string, unknown>;
  if (meta.intended_role === "vendor") intendedRole = "vendor";

  const result = await bootstrapAccount(auth.supabase, auth.user, {
    intendedRole,
    username: username || (typeof meta.username === "string" ? meta.username : null),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Could not finish account setup" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, intendedRole });
}
