import { NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      { success: false, error: "RESEND_API_KEY is not configured" },
      { status: 503 }
    );
  }

  const resend = new Resend(key);

  try {
    const data = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: ["lookfinesseke@gmail.com"],
      subject: "AI Financial OS Test",
      html: `
          <h1>System Online 🚀</h1>
          <p>Email alerts operational.</p>
        `,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      {
        status: 500,
      }
    );
  }
}
