import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Cookie-less anonymous client for public catalogue and content reads.
 * Safe to call inside `'use cache'` functions because it never touches the request.
 */
export function createPublicClient() {
  return createClient<Database>(env.supabaseUrl(), env.supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
