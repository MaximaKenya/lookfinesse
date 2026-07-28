import { supabase } from "@/lib/supabaseClient";

export async function requireRole(user_id: string, role: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("*")
    .eq("user_id", user_id)
    .eq("role", role)
    .single();

  if (!data) {
    throw new Error("Unauthorized");
  }
}