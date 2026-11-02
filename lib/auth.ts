import "server-only";
import { redirect, forbidden } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: "customer" | "staff" | "admin";
};

/** Returns the signed-in user (verified with Supabase Auth) or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, phone, is_active, roles(name)")
    .eq("id", user.id)
    .maybeSingle();

  if (profile && !profile.is_active) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name || (user.user_metadata?.full_name as string) || "",
    phone: profile?.phone ?? null,
    role: ((profile?.roles as { name: string } | null)?.name as SessionUser["role"]) ?? "customer",
  };
}

export async function requireUser(next = "/account") {
  const user = await getCurrentUser();
  if (!user) redirect(`/account/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Server-side admin authorisation. Use in every admin page, action and route. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/account/login?next=/admin");
  if (user.role !== "admin" && user.role !== "staff") forbidden();
  return user;
}

export function isAdminRole(role: SessionUser["role"]) {
  return role === "admin" || role === "staff";
}
