import { NextResponse } from "next/server";
import { Resend } from "resend";
import { emailLockupHtml } from "@/lib/brand/emailLockup";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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
          <div style="background:#FAF7F4;padding:24px;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;color:#1C1016">
            ${emailLockupHtml(new URL(request.url).origin)}
            <h1 style="margin:0 0 8px;font-size:22px">System online</h1>
            <p style="margin:0">Email alerts operational.</p>
          </div>
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
