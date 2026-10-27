import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { supabaseUrl } from "./env";

/** Full-access client for creating accounts and setting passwords. Server only. */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY is not set. See .env.example.");
  return createClient<Database>(supabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}
