import { createServerClient } from "@supabase/ssr";

import { cookies } from "next/headers";

import { getSupabaseEnv } from "@/lib/supabase/env";



export async function createSupabaseServer() {

  const env = getSupabaseEnv();

  if (!env.ok) {

    throw new Error(`SUPABASE_MISCONFIGURED: ${env.issues.join("; ")}`);

  }



  const cookieStore = await cookies();



  return createServerClient(env.url, env.anonKey, {

    cookies: {

      getAll() {

        return cookieStore.getAll();

      },

      setAll(cookiesToSet) {

        try {

          cookiesToSet.forEach(({ name, value, options }) =>

            cookieStore.set(name, value, options)

          );

        } catch {

          // Route handlers / RSC may run in a read-only cookie context.

        }

      },

    },

  });

}


