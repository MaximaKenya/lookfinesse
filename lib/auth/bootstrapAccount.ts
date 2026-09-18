import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { IntendedAccountKind } from "@/lib/auth/signupErrors";

function displayNameFrom(user: User, username?: string | null): string {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fromMeta =
    (typeof meta.display_name === "string" && meta.display_name) ||
    (typeof meta.username === "string" && meta.username) ||
    (typeof meta.full_name === "string" && meta.full_name) ||
    "";
  const fallback = username?.trim() || fromMeta || user.email?.split("@")[0] || "Member";
  return fallback;
}

/**
 * Idempotent post-signup provisioning: profile row + shopper role.
 * Vendor role is granted later via create-store / ensureVendorTrial.
 */
export async function bootstrapAccount(
  supabase: SupabaseClient,
  user: User,
  opts?: { intendedRole?: IntendedAccountKind; username?: string | null }
): Promise<{ ok: boolean; error?: string }> {
  const displayName = displayNameFrom(user, opts?.username);
  const intended = opts?.intendedRole === "vendor" ? "vendor" : "shopper";

  const { data: existing } = await supabase
    .from("user_profiles")
    .select("user_id, preferences, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const prevPrefs = (existing?.preferences ?? {}) as Record<string, unknown>;
  const preferences = {
    ...prevPrefs,
    intended_role: intended,
  };

  const { error: profileError } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      display_name: existing?.display_name || displayName,
      preferences,
    },
    { onConflict: "user_id" }
  );

  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  const { error: roleError } = await supabase
    .from("user_roles")
    .upsert({ user_id: user.id, role: "user" }, { onConflict: "user_id,role" });

  if (roleError && !/duplicate|unique/i.test(roleError.message)) {
    console.warn("[bootstrapAccount] user_roles:", roleError.message);
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  if (meta.intended_role !== intended || (!meta.username && opts?.username)) {
    await supabase.auth
      .updateUser({
        data: {
          ...meta,
          intended_role: intended,
          username: opts?.username || meta.username,
          display_name: displayName,
        },
      })
      .catch(() => {});
  }

  return { ok: true };
}
