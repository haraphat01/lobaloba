import "server-only";
import { siteUrl } from "@/lib/site-url";

// Server-side environment access. Secret values are only ever read here and
// never passed to Client Components.

function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : undefined;
}

function required(name: string): string {
  const value = optional(name);
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

export const env = {
  siteUrl: () => siteUrl,
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  paystackSecretKey: () => optional("PAYSTACK_SECRET_KEY"),
  resendApiKey: () => optional("RESEND_API_KEY"),
  emailFrom: () => optional("EMAIL_FROM") ?? "Lobaloba Deluxe <onboarding@resend.dev>",
  adminNotificationEmail: () => optional("ADMIN_NOTIFICATION_EMAIL"),
  isSupabaseConfigured: () => !!optional("NEXT_PUBLIC_SUPABASE_URL") && !!optional("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
};
