import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";

function missing(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (error.message?.includes("fit_profiles") && error.message.includes("does not exist"))
  );
}

export async function GET(req: Request) {
  try {
    const userId = new URL(req.url).searchParams.get("user_id");
    if (!userId) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });

    const supabase = await createSupabaseServer();

    const { data: fit, error } = await supabase
      .from("fit_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error && !missing(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Fallback: dresser prefs on user_profiles
    if (!fit) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("preferences")
        .eq("user_id", userId)
        .maybeSingle();

      const dresser = (profile?.preferences as { dresser?: Record<string, unknown> } | null)?.dresser;
      if (dresser) {
        return NextResponse.json({
          profile: {
            user_id: userId,
            size_top: dresser.size ?? dresser.size_top ?? null,
            size_bottom: dresser.size_bottom ?? null,
            size_shoe: dresser.size_shoe ?? null,
            skin_tone: dresser.skin_tone ?? null,
            style_tags: dresser.style_tags ?? [],
            preferences: dresser,
            source: "dresser",
          },
        });
      }
    }

    return NextResponse.json({ profile: fit ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fit profile failed";
    return NextResponse.json({ profile: null, error: message });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = body.user_id as string | undefined;
    if (!userId) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });

    const row = {
      user_id: userId,
      size_top: body.size_top ?? null,
      size_bottom: body.size_bottom ?? null,
      size_shoe: body.size_shoe ?? null,
      skin_tone: body.skin_tone ?? null,
      style_tags: body.style_tags ?? [],
      preferences: body.preferences ?? {},
      updated_at: new Date().toISOString(),
    };

    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
      .from("fit_profiles")
      .upsert(row, { onConflict: "user_id" })
      .select("*")
      .single();

    if (error) {
      if (missing(error)) {
        // Persist into user_profiles.preferences.dresser
        const { data: existing } = await supabase
          .from("user_profiles")
          .select("preferences")
          .eq("user_id", userId)
          .maybeSingle();
        const prefs = (existing?.preferences as Record<string, unknown>) ?? {};
        await supabase
          .from("user_profiles")
          .upsert({
            user_id: userId,
            preferences: { ...prefs, dresser: row },
          });
        return NextResponse.json({ ok: true, profile: row, stored: "preferences" });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Keep dresser prefs in sync
    try {
      const { data: existing } = await supabase
        .from("user_profiles")
        .select("preferences")
        .eq("user_id", userId)
        .maybeSingle();
      const prefs = (existing?.preferences as Record<string, unknown>) ?? {};
      await supabase
        .from("user_profiles")
        .update({ preferences: { ...prefs, dresser: { ...row } } })
        .eq("user_id", userId);
    } catch {
      /* optional */
    }

    return NextResponse.json({ ok: true, profile: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
