import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabaseKey, supabaseUrl } from "./env";

/** Supabase client acting as the signed-in team member (RLS applies). */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl(), supabaseKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component: the proxy refreshes the session instead.
        }
      },
    },
  });
}

/** Anonymous client for client links and published reports. */
export function createAnonClient() {
  return createPlainClient(supabaseUrl(), supabaseKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
