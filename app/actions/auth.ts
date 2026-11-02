"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { email, fieldErrors, phone, requiredText } from "@/lib/validation";

// redirectTo is followed with a full page load so the browser-side session (and the
// bag/wishlist tied to it) is re-initialised for the new account.
export type AuthState = { error?: string; message?: string; fieldErrors?: Record<string, string>; redirectTo?: string };

const password = z.string().min(8, "Use at least 8 characters").max(72);

function safeNext(value: FormDataEntryValue | null, fallback = "/account") {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z.object({ email, password: z.string().min(1, "Enter your password") }).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter your email and password.", fieldErrors: fieldErrors(parsed.error) };
  if (!(await rateLimit("login", 10, 600, parsed.data.email))) return { error: "Too many sign-in attempts. Please wait a few minutes." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") return { error: "Please verify your email address first — check your inbox for the confirmation link." };
    return { error: "Incorrect email or password." };
  }
  return { redirectTo: safeNext(formData.get("next")) };
}

export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z
    .object({ fullName: requiredText("Full name", 120), email, phone, password, confirm: z.string() })
    .refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  if (!(await rateLimit("signup", 5, 3600))) return { error: "Too many sign-up attempts. Please try again later." };

  const supabase = await createClient();
  const next = safeNext(formData.get("next"));
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName, phone: parsed.data.phone },
      emailRedirectTo: `${env.siteUrl()}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: error.code === "user_already_exists" ? "An account with this email already exists." : error.message };

  if (data.session) return { redirectTo: next }; // email confirmation disabled (e.g. local development)
  return { message: "Account created. We've sent a verification link to your email — please confirm your address to sign in." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function requestPasswordReset(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z.object({ email }).safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "Enter a valid email address." };
  if (!(await rateLimit("reset", 5, 3600))) return { error: "Too many requests. Please try again later." };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.siteUrl()}/auth/confirm?next=/account/reset-password`,
  });
  // Same response whether or not the account exists.
  return { message: "If an account exists for that email, we've sent a link to reset your password." };
}

export async function updatePassword(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z
    .object({ password, confirm: z.string() })
    .refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Your reset link has expired. Please request a new one." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };
  return { message: "Your password has been updated." };
}

export async function updateProfile(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z
    .object({ fullName: requiredText("Full name", 120), phone, marketing: z.string().optional() })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Please sign in again." };
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName, phone: parsed.data.phone, marketing_opt_in: parsed.data.marketing === "on" })
    .eq("id", data.user.id);
  if (error) return { error: "Could not save your profile." };
  await supabase.auth.updateUser({ data: { full_name: parsed.data.fullName, phone: parsed.data.phone } });
  return { message: "Profile saved." };
}

const addressInput = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  label: requiredText("Label", 40),
  fullName: requiredText("Full name", 120),
  phone,
  country: requiredText("Country", 80),
  state: requiredText("State", 80),
  city: requiredText("City", 80),
  addressLine: requiredText("Address", 300),
  isDefault: z.string().optional(),
});

export async function saveAddress(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = addressInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Please sign in again." };
  const d = parsed.data;
  const row = {
    user_id: data.user.id,
    label: d.label,
    full_name: d.fullName,
    phone: d.phone,
    country: d.country,
    state: d.state,
    city: d.city,
    address_line: d.addressLine,
    is_default: d.isDefault === "on",
  };
  if (row.is_default) await supabase.from("addresses").update({ is_default: false }).eq("user_id", data.user.id);
  const { error } = d.id ? await supabase.from("addresses").update(row).eq("id", d.id) : await supabase.from("addresses").insert(row);
  if (error) return { error: "Could not save the address." };
  return { message: "Address saved." };
}

export async function deleteAddress(id: string) {
  if (!z.string().uuid().safeParse(id).success) return;
  const supabase = await createClient();
  await supabase.from("addresses").delete().eq("id", id); // RLS restricts to the owner
}

export async function requestReturn(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z
    .object({ orderId: z.string().uuid(), reason: requiredText("Reason", 120), details: z.string().trim().max(2000).optional() })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please choose a reason for your return." };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Please sign in again." };

  // RLS ensures the user can only read their own order.
  const { data: order } = await supabase.from("orders").select("id, order_number, status, payment_status").eq("id", parsed.data.orderId).maybeSingle();
  if (!order) return { error: "Order not found." };
  if (order.payment_status !== "paid" || !["delivered", "shipped", "out_for_delivery"].includes(order.status))
    return { error: "Returns can be requested once your order has been dispatched or delivered." };

  const admin = createAdminClient();
  const { count } = await admin.from("return_requests").select("id", { count: "exact", head: true }).eq("order_id", order.id).in("status", ["requested", "approved"]);
  if ((count ?? 0) > 0) return { error: "A return request is already open for this order." };

  await admin.from("return_requests").insert({ order_id: order.id, user_id: auth.user.id, reason: parsed.data.reason, details: parsed.data.details || null });
  await admin.from("orders").update({ status: "return_requested" }).eq("id", order.id);
  await admin.from("order_status_history").insert({ order_id: order.id, status: "return_requested", note: parsed.data.reason, created_by: auth.user.id });
  await admin.from("notifications").insert({ audience: "admin", type: "return_request", title: `Return requested for ${order.order_number}`, body: parsed.data.reason, link: `/admin/orders/${order.id}` });
  return { message: "Your return request has been submitted. Our team will be in touch shortly." };
}

export async function markNotificationsRead() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", data.user.id).is("read_at", null);
}
