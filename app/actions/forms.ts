"use server";

import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email/send";
import { emailTemplates } from "@/lib/email/templates";
import { notifyAdmin } from "@/lib/notifications";
import {
  contactSchema,
  fieldErrors,
  newsletterSchema,
  quotationRequestSchema,
  restockSchema,
  reviewSchema,
  sampleRequestSchema,
  type ActionResult,
} from "@/lib/validation";

const TOO_MANY = { ok: false as const, error: "Too many requests. Please wait a moment and try again." };
const FAILED = { ok: false as const, error: "Something went wrong. Please try again or contact us on WhatsApp." };

export async function subscribeNewsletter(input: { email: string; source?: string }): Promise<ActionResult> {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a valid email address.", fieldErrors: fieldErrors(parsed.error) };
  if (!(await rateLimit("newsletter", 5, 600))) return TOO_MANY;

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("newsletter_subscribers")
    .select("id, status, confirm_token")
    .ilike("email", parsed.data.email)
    .maybeSingle();

  if (existing?.status === "subscribed") return { ok: true, message: "You're already subscribed — thank you!" };

  let token = existing?.confirm_token;
  if (!existing) {
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: parsed.data.email, source: parsed.data.source ?? "website" })
      .select("confirm_token")
      .single();
    if (error) return FAILED;
    token = data.confirm_token;
  } else if (existing.status === "unsubscribed") {
    await supabase.from("newsletter_subscribers").update({ status: "pending" }).eq("id", existing.id);
  }

  const email = emailTemplates.newsletterConfirmation({
    site: env.siteUrl(),
    confirm: `${env.siteUrl()}/newsletter/confirm?token=${token}`,
  });
  await sendEmail({ to: parsed.data.email, subject: email.subject, html: email.html });
  return { ok: true, message: "Almost there — please check your inbox to confirm your subscription." };
}

export async function submitContact(input: unknown): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  if (!(await rateLimit("contact", 5, 600))) return TOO_MANY;

  const supabase = createAdminClient();
  const { error } = await supabase.from("contact_messages").insert({
    full_name: parsed.data.fullName,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });
  if (error) return FAILED;
  await notifyAdmin({
    type: "contact_message",
    title: `New message: ${parsed.data.subject}`,
    body: `${parsed.data.fullName} (${parsed.data.email})`,
    link: "/admin/messages",
    email: true,
  });
  return { ok: true, message: "Thank you — your message has been received. We'll reply within one business day." };
}

export async function requestSample(input: unknown): Promise<ActionResult> {
  const parsed = sampleRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  if (!(await rateLimit("sample", 5, 600))) return TOO_MANY;

  const supabase = createAdminClient();
  const { error } = await supabase.from("sample_requests").insert({
    product_id: parsed.data.productId,
    colour: parsed.data.colour,
    full_name: parsed.data.fullName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    address: parsed.data.address,
    notes: parsed.data.notes,
  });
  if (error) return FAILED;
  await notifyAdmin({ type: "sample_request", title: "New sample request", body: `${parsed.data.fullName} requested a sample`, link: "/admin/messages?tab=samples" });
  return { ok: true, message: "Sample request received. Our team will contact you to arrange your swatch." };
}

export async function requestRestockNotification(input: unknown): Promise<ActionResult> {
  const parsed = restockSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a valid email address." };
  if (!(await rateLimit("restock", 10, 600))) return TOO_MANY;

  const supabase = createAdminClient();
  const { error } = await supabase.from("restock_notifications").insert({
    product_id: parsed.data.productId,
    variant_id: parsed.data.variantId || null,
    email: parsed.data.email,
  });
  // A duplicate pending request is fine — the customer is already on the list.
  if (error && error.code !== "23505") return FAILED;
  return { ok: true, message: "We'll email you as soon as it's back in stock." };
}

export async function submitReview(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in to leave a review." };
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  if (!(await rateLimit("review", 5, 3600, user.id))) return TOO_MANY;

  const supabase = createAdminClient();
  const { count } = await supabase
    .from("order_items")
    .select("id, orders!inner(user_id, payment_status)", { count: "exact", head: true })
    .eq("product_id", parsed.data.productId)
    .eq("orders.user_id", user.id)
    .eq("orders.payment_status", "paid");

  const { error } = await supabase.from("reviews").insert({
    product_id: parsed.data.productId,
    user_id: user.id,
    author_name: user.fullName || user.email.split("@")[0],
    rating: parsed.data.rating,
    title: parsed.data.title,
    body: parsed.data.body,
    is_verified_purchase: (count ?? 0) > 0,
  });
  if (error?.code === "23505") return { ok: false, error: "You have already reviewed this product." };
  if (error) return FAILED;
  await notifyAdmin({ type: "review", title: "New review awaiting approval", link: "/admin/products?tab=reviews" });
  return { ok: true, message: "Thank you! Your review will appear once approved." };
}

function quoteReference(type: "asoebi" | "wholesale") {
  return `${type === "asoebi" ? "ASO" : "WHS"}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function submitQuotationRequest(input: unknown): Promise<ActionResult<{ reference: string; token: string }>> {
  const parsed = quotationRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  if (!(await rateLimit("quotation", 5, 3600))) return TOO_MANY;

  const d = parsed.data;
  const user = await getCurrentUser();
  const supabase = createAdminClient();

  // Resolve selected catalogue products server-side for descriptions.
  const productIds = [...new Set(d.items.map((i) => i.productId))];
  const { data: products } = productIds.length
    ? await supabase.from("products").select("id, name, purchase_unit, unit_label").in("id", productIds).eq("status", "active")
    : { data: [] as { id: string; name: string; purchase_unit: string; unit_label: string | null }[] };

  const reference = quoteReference(d.requestType);
  const { data: quote, error } = await supabase
    .from("quotation_requests")
    .insert({
      reference,
      request_type: d.requestType,
      user_id: user?.id ?? null,
      package_id: d.packageId,
      full_name: d.fullName,
      email: d.email,
      phone: d.phone,
      company_name: d.companyName,
      event_type: d.eventType,
      event_date: d.eventDate,
      guest_count: d.guestCount ?? null,
      preferred_category: d.preferredCategory,
      preferred_colours: d.preferredColours,
      budget: d.budget,
      required_quantity: d.requiredQuantity,
      delivery_location: d.deliveryLocation,
      needs_availability_check: d.needsAvailabilityCheck,
      details: d.details,
    })
    .select("id, access_token")
    .single();
  if (error || !quote) {
    console.error("[quotation] insert failed", error?.message);
    return FAILED;
  }

  const items = d.items
    .map((item, i) => {
      const product = products?.find((p) => p.id === item.productId);
      if (!product) return null;
      return {
        quotation_id: quote.id,
        product_id: product.id,
        description: product.name,
        colour: item.colour || null,
        quantity: item.quantity,
        unit_price: 0,
        sort_order: i,
      };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
  if (items.length) await supabase.from("quotation_items").insert(items);

  const view = `${env.siteUrl()}/quotes/${quote.access_token}`;
  const email = emailTemplates.quotationReceived({ reference, full_name: d.fullName, request_type: d.requestType }, { site: env.siteUrl(), view });
  await sendEmail({ to: d.email, subject: email.subject, html: email.html });
  await notifyAdmin({
    type: "quotation_request",
    title: `New ${d.requestType} quotation request ${reference}`,
    body: `${d.fullName} · ${d.phone}${d.eventDate ? ` · event ${d.eventDate}` : ""}`,
    link: `/admin/quotations/${quote.id}`,
    email: true,
  });

  return { ok: true, data: { reference, token: quote.access_token }, message: "Request received" };
}
