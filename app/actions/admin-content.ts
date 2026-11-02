"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { readingMinutes, slugify } from "@/lib/format";
import type { ActionResult } from "@/lib/validation";

const text = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : null));
const str = (max: number) => z.string().trim().max(max).default("");
const cta = z.object({ label: str(40), href: str(300) });

// Per-key schemas for editable site settings. Secrets never live here.
const settingSchemas = {
  announcement: z.object({ enabled: z.boolean(), messages: z.array(z.string().trim().min(1).max(160)).max(6), link: str(300) }),
  hero: z.object({ eyebrow: str(80), heading: z.string().trim().min(3).max(120), subheading: str(400), image_url: str(1000), image_alt: str(200), primary_cta: cta, secondary_cta: cta }),
  business: z.object({ name: z.string().trim().min(2).max(120), tagline: str(200), email: z.string().trim().email().max(254), phone: str(40), whatsapp: z.string().trim().regex(/^\d{7,15}$/, "WhatsApp number must be digits only, including country code (e.g. 2348012345678)"), address: str(300), hours: str(120), currency: z.string().trim().length(3).toUpperCase() }),
  social: z.object({ instagram: str(300), facebook: str(300), tiktok: str(300), pinterest: str(300), youtube: str(300), x: str(300) }),
  homepage: z.object({
    show_new_arrivals: z.boolean(),
    show_collections: z.boolean(),
    show_bestsellers: z.boolean(),
    show_asoebi: z.boolean(),
    show_journal: z.boolean(),
    asoebi_heading: str(160),
    asoebi_text: str(600),
    newsletter_heading: str(120),
    newsletter_text: str(300),
  }),
  store: z.object({ currency: z.string().trim().length(3).toUpperCase(), low_stock_threshold: z.coerce.number().int().min(0).max(1000), order_email_bcc: str(254), admin_notification_email: z.union([z.literal(""), z.string().trim().email()]) }),
  payment: z.object({ paystack_enabled: z.boolean(), channels: z.array(z.enum(["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer", "eft", "apple_pay"])).max(8), instructions: str(400) }),
  email: z.object({ from_name: str(80), reply_to: z.union([z.literal(""), z.string().trim().email()]), footer_note: str(300) }),
  policies: z.object({ shipping: str(20000), returns: str(20000), privacy: str(20000), terms: str(20000), fabric_care: str(20000), yardage_guide: str(20000) }),
} as const;

export type SettingKey = keyof typeof settingSchemas;

export async function saveSetting(key: SettingKey, value: unknown): Promise<ActionResult> {
  const user = await requireAdmin();
  const schema = settingSchemas[key];
  if (!schema) return { ok: false, error: "Unknown setting" };
  if ((key === "payment" || key === "business") && user.role !== "admin") return { ok: false, error: "Only administrators can change this setting." };
  const parsed = schema.safeParse(value);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid value" };
  const supabase = createAdminClient();
  const { error } = await supabase.from("site_settings").upsert({ key, value: parsed.data as never }, { onConflict: "key" });
  if (error) return { ok: false, error: error.message };
  updateTag("settings");
  return { ok: true, message: "Saved." };
}

// ---------------------------------------------------------------------------
// Journal
// ---------------------------------------------------------------------------
const postSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(200),
  slug: z.string().trim().max(160).optional(),
  excerpt: text(500),
  content: z.string().max(100000),
  coverImageUrl: text(1000),
  categoryId: z.union([z.literal(""), z.null(), z.string().uuid()]).optional().transform((v) => (v ? v : null)),
  authorName: z.string().trim().min(1).max(120),
  authorBio: text(500),
  status: z.enum(["draft", "published"]),
  publishedAt: z.string().optional().transform((v) => (v ? new Date(v).toISOString() : null)),
  seoTitle: text(160),
  seoDescription: text(320),
});

export async function saveBlogPost(input: z.input<typeof postSchema>): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid article" };
  const d = parsed.data;
  const supabase = createAdminClient();
  const row = {
    title: d.title,
    slug: slugify(d.slug || d.title),
    excerpt: d.excerpt,
    content: d.content,
    cover_image_url: d.coverImageUrl,
    category_id: d.categoryId,
    author_name: d.authorName,
    author_bio: d.authorBio,
    status: d.status,
    published_at: d.status === "published" ? (d.publishedAt ?? new Date().toISOString()) : d.publishedAt,
    reading_minutes: readingMinutes(d.content),
    seo_title: d.seoTitle,
    seo_description: d.seoDescription,
  };
  const { data, error } = d.id
    ? await supabase.from("blog_posts").update(row).eq("id", d.id).select("id, slug").single()
    : await supabase.from("blog_posts").insert(row).select("id, slug").single();
  if (error || !data) return { ok: false, error: error?.code === "23505" ? "That slug is already in use." : (error?.message ?? "Could not save") };
  updateTag("blog");
  updateTag(`post:${data.slug}`);
  return { ok: true, data: { id: data.id }, message: d.status === "published" ? "Article published." : "Draft saved." };
}

export async function setBlogPostStatus(id: string, status: "draft" | "published"): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data: post } = await supabase.from("blog_posts").select("published_at").eq("id", id).single();
  await supabase.from("blog_posts").update({ status, published_at: status === "published" ? (post?.published_at ?? new Date().toISOString()) : post?.published_at }).eq("id", id);
  updateTag("blog");
  return { ok: true };
}

export async function deleteBlogPost(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createAdminClient();
  await supabase.from("blog_posts").delete().eq("id", id);
  updateTag("blog");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------
const faqSchema = z.object({
  id: z.string().uuid().optional(),
  question: z.string().trim().min(3).max(300),
  answer: z.string().trim().min(3).max(3000),
  category: z.string().trim().min(1).max(60),
  sortOrder: z.coerce.number().int().min(0).max(1000),
  isActive: z.boolean(),
});

export async function saveFaq(input: z.input<typeof faqSchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = faqSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid FAQ" };
  const d = parsed.data;
  const supabase = createAdminClient();
  const row = { question: d.question, answer: d.answer, category: d.category, sort_order: d.sortOrder, is_active: d.isActive };
  const { error } = d.id ? await supabase.from("faqs").update(row).eq("id", d.id) : await supabase.from("faqs").insert(row);
  if (error) return { ok: false, error: error.message };
  updateTag("faqs");
  return { ok: true, message: "FAQ saved." };
}

export async function deleteFaq(id: string): Promise<ActionResult> {
  await requireAdmin();
  await createAdminClient().from("faqs").delete().eq("id", id);
  updateTag("faqs");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------
const couponSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,32}$/, "Use 3–32 letters, numbers, - or _"),
  description: text(300),
  discountType: z.enum(["percentage", "fixed"]),
  value: z.coerce.number().positive(),
  minOrderAmount: z.coerce.number().min(0),
  maxDiscount: z.union([z.literal(""), z.null(), z.coerce.number().positive()]).optional().transform((v) => (v === "" || v == null ? null : Number(v))),
  productIds: z.array(z.string().uuid()).max(200),
  categoryIds: z.array(z.string().uuid()).max(50),
  startsAt: z.string().optional().transform((v) => (v ? new Date(v).toISOString() : null)),
  expiresAt: z.string().optional().transform((v) => (v ? new Date(v).toISOString() : null)),
  usageLimit: z.union([z.literal(""), z.null(), z.coerce.number().int().positive()]).optional().transform((v) => (v === "" || v == null ? null : Number(v))),
  perCustomerLimit: z.union([z.literal(""), z.null(), z.coerce.number().int().positive()]).optional().transform((v) => (v === "" || v == null ? null : Number(v))),
  isActive: z.boolean(),
});

export async function saveCoupon(input: z.input<typeof couponSchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid coupon" };
  const d = parsed.data;
  if (d.discountType === "percentage" && d.value > 100) return { ok: false, error: "Percentage discounts cannot exceed 100%." };
  const row = {
    code: d.code,
    description: d.description,
    discount_type: d.discountType,
    value: d.value,
    min_order_amount: d.minOrderAmount,
    max_discount: d.maxDiscount,
    product_ids: d.productIds,
    category_ids: d.categoryIds,
    starts_at: d.startsAt,
    expires_at: d.expiresAt,
    usage_limit: d.usageLimit,
    per_customer_limit: d.perCustomerLimit,
    is_active: d.isActive,
  };
  const supabase = createAdminClient();
  const { error } = d.id ? await supabase.from("coupons").update(row).eq("id", d.id) : await supabase.from("coupons").insert(row);
  if (error) return { ok: false, error: error.code === "23505" ? "That code already exists." : error.message };
  revalidatePath("/admin/promotions");
  return { ok: true, message: "Discount code saved." };
}

export async function deleteCoupon(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { count } = await supabase.from("coupon_redemptions").select("id", { count: "exact", head: true }).eq("coupon_id", id);
  if ((count ?? 0) > 0) await supabase.from("coupons").update({ is_active: false }).eq("id", id);
  else await supabase.from("coupons").delete().eq("id", id);
  revalidatePath("/admin/promotions");
  return { ok: true, message: (count ?? 0) > 0 ? "Code has been used, so it was deactivated." : "Code deleted." };
}

// ---------------------------------------------------------------------------
// Shipping
// ---------------------------------------------------------------------------
const zoneSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  description: text(300),
  zoneType: z.enum(["domestic", "international", "pickup"]),
  countries: z.array(z.string().trim().min(1).max(80)).max(250),
  states: z.array(z.string().trim().min(1).max(80)).max(100),
  requiresQuote: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(1000),
  isActive: z.boolean(),
  rates: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(2).max(120),
        description: text(300),
        fee: z.coerce.number().min(0),
        freeOver: z.union([z.literal(""), z.null(), z.coerce.number().min(0)]).optional().transform((v) => (v === "" || v == null ? null : Number(v))),
        minDays: z.union([z.literal(""), z.null(), z.coerce.number().int().min(0)]).optional().transform((v) => (v === "" || v == null ? null : Number(v))),
        maxDays: z.union([z.literal(""), z.null(), z.coerce.number().int().min(0)]).optional().transform((v) => (v === "" || v == null ? null : Number(v))),
        isActive: z.boolean(),
      }),
    )
    .max(20),
});

export async function saveShippingZone(input: z.input<typeof zoneSchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = zoneSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid zone" };
  const d = parsed.data;
  const supabase = createAdminClient();
  const row = { name: d.name, description: d.description, zone_type: d.zoneType, countries: d.countries, states: d.states, requires_quote: d.requiresQuote, sort_order: d.sortOrder, is_active: d.isActive };
  const { data, error } = d.id
    ? await supabase.from("shipping_zones").update(row).eq("id", d.id).select("id").single()
    : await supabase.from("shipping_zones").insert(row).select("id").single();
  if (error || !data) return { ok: false, error: error?.message ?? "Could not save zone" };

  const { data: existing } = await supabase.from("shipping_rates").select("id").eq("zone_id", data.id);
  const keep = d.rates.filter((r) => r.id).map((r) => r.id!);
  const remove = (existing ?? []).map((r) => r.id).filter((id) => !keep.includes(id));
  // Rates referenced by orders keep their snapshot (orders.shipping_rate_id is ON DELETE SET NULL).
  if (remove.length) await supabase.from("shipping_rates").delete().in("id", remove);
  for (const [i, r] of d.rates.entries()) {
    const payload = { zone_id: data.id, name: r.name, description: r.description, fee: r.fee, free_over: r.freeOver, min_days: r.minDays, max_days: r.maxDays, is_active: r.isActive, sort_order: i };
    if (r.id) await supabase.from("shipping_rates").update(payload).eq("id", r.id);
    else await supabase.from("shipping_rates").insert(payload);
  }
  updateTag("shipping");
  revalidatePath("/admin/shipping");
  return { ok: true, message: "Shipping zone saved." };
}

export async function deleteShippingZone(id: string): Promise<ActionResult> {
  await requireAdmin();
  await createAdminClient().from("shipping_zones").delete().eq("id", id);
  updateTag("shipping");
  revalidatePath("/admin/shipping");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Messages, customers, notifications
// ---------------------------------------------------------------------------
export async function setMessageStatus(table: "contact_messages" | "sample_requests", id: string, status: string): Promise<ActionResult> {
  await requireAdmin();
  const allowed = table === "contact_messages" ? ["new", "read", "replied", "archived"] : ["new", "contacted", "sent", "closed"];
  if (!allowed.includes(status) || !z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid status" };
  const supabase = createAdminClient();
  if (table === "contact_messages") await supabase.from("contact_messages").update({ status: status as "new" }).eq("id", id);
  else await supabase.from("sample_requests").update({ status: status as "new" }).eq("id", id);
  revalidatePath("/admin/messages");
  return { ok: true };
}

export async function setCustomerAccess(userId: string, input: { isActive?: boolean; role?: "customer" | "staff" | "admin" }): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (admin.role !== "admin") return { ok: false, error: "Only administrators can manage accounts." };
  if (!z.string().uuid().safeParse(userId).success) return { ok: false, error: "Invalid user" };
  if (userId === admin.id) return { ok: false, error: "You cannot change your own access." };
  const supabase = createAdminClient();
  const update: { is_active?: boolean; role_id?: string } = {};
  if (typeof input.isActive === "boolean") update.is_active = input.isActive;
  if (input.role) {
    const { data: role } = await supabase.from("roles").select("id").eq("name", input.role).single();
    if (!role) return { ok: false, error: "Unknown role" };
    update.role_id = role.id;
  }
  await supabase.from("profiles").update(update).eq("id", userId);
  revalidatePath(`/admin/customers/${userId}`);
  return { ok: true, message: "Account updated." };
}

export async function markAdminNotificationsRead(): Promise<ActionResult> {
  await requireAdmin();
  await createAdminClient().from("notifications").update({ read_at: new Date().toISOString() }).eq("audience", "admin").is("read_at", null);
  revalidatePath("/admin");
  return { ok: true };
}
