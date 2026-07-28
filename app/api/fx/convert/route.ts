import { NextResponse } from "next/server";

import { convertCurrency } from "@/lib/fx/fxEngine";

export async function POST(req: Request) {
  const body = await req.json();

  const { amount, from, to } = body;

  const converted = convertCurrency({
    amount,
    from,
    to,
  });

  return NextResponse.json({
    converted,
  });
}