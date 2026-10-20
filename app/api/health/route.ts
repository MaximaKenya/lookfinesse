import { NextResponse } from "next/server";
import { isOpenAiConfigured } from "@/lib/ai/provider";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function present(name: string): boolean {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Liveness + integration flags. Booleans only — never echo secret values.
 */
export async function GET() {
  const integrations = {
    supabase: isSupabaseConfigured(),
    supabaseServiceRole: present("SUPABASE_SERVICE_ROLE_KEY"),
    openai: isOpenAiConfigured(),
    stripe: present("STRIPE_SECRET_KEY"),
    mpesa:
      present("MPESA_CONSUMER_KEY") &&
      present("MPESA_CONSUMER_SECRET") &&
      present("MPESA_SHORTCODE") &&
      present("MPESA_PASSKEY"),
    resend: present("RESEND_API_KEY"),
    googleMaps: present("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
    cron: present("CRON_SECRET"),
  };

  return NextResponse.json({ ok: true, integrations });
}
