import { NextResponse } from "next/server";

import { Resend } from "resend";

const resend = new Resend(
  process.env.RESEND_API_KEY
);

export async function GET() {
  try {
    const data =
      await resend.emails.send({
        from: "onboarding@resend.dev",

to: ["lookfinesseke@gmail.com"],
        subject:
          "AI Financial OS Test",

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