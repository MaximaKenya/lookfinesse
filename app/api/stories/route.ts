import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabaseClient";

import { guardSupabaseEnv, isNetworkError } from "@/lib/api/supabaseRoute";



const VENDOR_SELECTS = [

  `*, vendors ( id, business_name, name, avatar_url )`,

  `*, vendors ( id, business_name, name )`,

  `*`,

];



export async function GET(req: Request) {

  if (guardSupabaseEnv()) {

    return NextResponse.json([]);

  }



  const { searchParams } = new URL(req.url);

  const vendorId = searchParams.get("vendor_id");



  try {

    for (const sel of VENDOR_SELECTS) {

      let q = supabase

        .from("stories")

        .select(sel)

        .gt("expires_at", new Date().toISOString())

        .order("created_at", { ascending: false });

      if (vendorId) q = q.eq("vendor_id", vendorId);

      const { data, error } = await q;

      if (!error) return NextResponse.json(data ?? []);

    }

  } catch (err) {

    if (!isNetworkError(err)) {

      console.error("[stories GET]", err);

    }

  }



  return NextResponse.json([]);

}



export async function POST(req: Request) {

  if (guardSupabaseEnv()) {

    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  }



  try {

    const body = await req.json();

    const { vendor_id, media_url, media_type, caption, duration_seconds } = body;



    if (!vendor_id || !media_url) {

      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    }



    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();



    const { data, error } = await supabase

      .from("stories")

      .insert({ vendor_id, media_url, media_type: media_type ?? "image", caption, duration_seconds: duration_seconds ?? 5, expires_at })

      .select()

      .single();



    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data, { status: 201 });

  } catch (err) {

    if (isNetworkError(err)) {

      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

    }

    throw err;

  }

}


