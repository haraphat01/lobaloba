import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

/**
 * Fixed-window rate limit backed by Postgres so it works across serverless
 * instances. Returns true when the request is allowed.
 */
export async function rateLimit(bucket: string, limit: number, windowSeconds: number, identifier?: string) {
  const id = identifier ?? (await clientIp());
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("rate_limit_hit", {
    p_key: `${bucket}:${id}`,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("[rate-limit] check failed", error.message);
    return true; // fail open so an outage in the limiter never blocks checkout
  }
  return data === true;
}
