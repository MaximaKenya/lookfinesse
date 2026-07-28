import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    // Try categories table first (migration 005)
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, icon, slug")
      .eq("is_active", true)
      .order("sort_order");

    if (!error && data && data.length > 0) {
      return NextResponse.json({ categories: data });
    }

    // Fallback: try legacy product_categories table
    const { data: legacy, error: legacyErr } = await supabase
      .from("product_categories")
      .select("id, name")
      .order("name");

    if (!legacyErr && legacy && legacy.length > 0) {
      return NextResponse.json({ categories: legacy });
    }

    // Final fallback: static predefined categories
    const STATIC_CATEGORIES = [
      { id: "cat-fashion",       name: "Fashion",       icon: "👗", slug: "fashion" },
      { id: "cat-beauty",        name: "Beauty",        icon: "💄", slug: "beauty" },
      { id: "cat-fitness",       name: "Fitness",       icon: "💪", slug: "fitness" },
      { id: "cat-wellness",      name: "Wellness",      icon: "🧘", slug: "wellness" },
      { id: "cat-footwear",      name: "Footwear",      icon: "👟", slug: "footwear" },
      { id: "cat-accessories",   name: "Accessories",   icon: "👜", slug: "accessories" },
      { id: "cat-skincare",      name: "Skincare",      icon: "✨", slug: "skincare" },
      { id: "cat-hair",          name: "Hair",          icon: "💇", slug: "hair" },
      { id: "cat-nutrition",     name: "Nutrition",     icon: "🥗", slug: "nutrition" },
      { id: "cat-gym-equipment", name: "Gym Equipment", icon: "🏋️", slug: "gym-equipment" },
      { id: "cat-grooming",      name: "Grooming",      icon: "💈", slug: "grooming" },
      { id: "cat-activewear",    name: "Activewear",    icon: "🏃", slug: "activewear" },
    ];

    return NextResponse.json({ categories: STATIC_CATEGORIES });
  } catch (err) {
    console.error("product-categories:", err);
    return NextResponse.json({ categories: [] }, { status: 500 });
  }
}
