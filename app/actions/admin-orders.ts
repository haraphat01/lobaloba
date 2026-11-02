"use server";

import crypto from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email/send";
import { emailTemplates } from "@/lib/email/templates";
import { notifyCustomer, sendOrderEmail } from "@/lib/notifications";
import { isPaystackConfigured, refundTransaction } from "@/lib/paystack";
import { ORDER_STATUSES, orderStatusLabel, slugify } from "@/lib/format";
import type { ActionResult } from "@/lib/validation";

const statusValues = ORDER_STATUSES.map((s) => s.value) as [string, ...string[]];
const EMAIL_STATUSES = new Set(["processing", "preparing_dispatch", "shipped", "out_for_delivery", "delivered", "cancelled", "refunded"]);
const text = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : null));

/** Puts stock back for an order whose stock was deducted (cancellation / refund). */
async function restock(orderId: string) {
  const supabase = createAdminClient();
  const { data: order } = await supabase.from("orders").select("stock_deducted").eq("id", orderId).single();
  if (!order?.stock_deducted) return;
  const { data: items } = await supabase.from("order_items").select("variant_id, product_id, quantity").eq("order_id", orderId);
  for (const item of items ?? []) {
    if (!item.variant_id) continue;
    const { data: inv } = await supabase.from("inventory").select("quantity").eq("variant_id", item.variant_id).maybeSingle();
    if (inv) await supabase.from("inventory").update({ quantity: inv.quantity + item.quantity }).eq("variant_id", item.variant_id);
  }
  await supabase.from("orders").update({ stock_deducted: false }).eq("id", orderId);
  updateTag("products");
}

const statusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(statusValues),
  note: text(1000),
  carrier: text(80),
  trackingNumber: text(120),
  trackingUrl: z.union([z.literal(""), z.string().trim().url().max(500)]).optional().transform((v) => (v ? v : null)),
  notifyCustomer: z.boolean().default(true),
});

export async function updateOrderStatus(input: z.input<typeof statusSchema>): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid update" };
  const d = parsed.data;
  const supabase = createAdminClient();
  const { data: order } = await supabase.from("orders").select("id, status, payment_status, user_id, order_number").eq("id", d.orderId).single();
  if (!order) return { ok: false, error: "Order not found." };

  const fulfilment = ["processing", "preparing_dispatch", "shipped", "out_for_delivery", "delivered"];
  if (fulfilment.includes(d.status) && order.payment_status !== "paid") {
    return { ok: false, error: "Payment must be confirmed before the order can move to fulfilment." };
  }
  if (d.status === "refunded" && order.payment_status !== "refunded") {
    return { ok: false, error: "Use “Issue refund” to refund this order so the payment is reversed." };
  }

  await supabase
    .from("orders")
    .update({
      status: d.status,
      carrier: d.carrier,
      tracking_number: d.trackingNumber,
      tracking_url: d.trackingUrl,
      cancelled_at: d.status === "cancelled" ? new Date().toISOString() : null,
    })
    .eq("id", d.orderId);
  if (d.status !== order.status) {
    await supabase.from("order_status_history").insert({ order_id: d.orderId, status: d.status, note: d.note, created_by: admin.id });
  }
  if (d.status === "cancelled") await restock(d.orderId);

  if (d.status !== order.status && d.notifyCustomer && EMAIL_STATUSES.has(d.status)) {
    await sendOrderEmail(d.orderId, "status", { note: d.note });
    await notifyCustomer(order.user_id, {
      type: "order_status",
      title: `Order ${order.order_number}: ${orderStatusLabel(d.status)}`,
      body: d.note ?? undefined,
      link: `/account/orders/${d.orderId}`,
    });
  }
  revalidatePath(`/admin/orders/${d.orderId}`);
  return { ok: true, message: "Order updated." };
}

export async function saveOrderNotes(orderId: string, notes: string): Promise<ActionResult> {
  await requireAdmin();
  if (!z.string().uuid().safeParse(orderId).success) return { ok: false, error: "Invalid order" };
  const supabase = createAdminClient();
  await supabase.from("orders").update({ admin_notes: String(notes).slice(0, 5000) }).eq("id", orderId);
  return { ok: true, message: "Notes saved." };
}

/** Full refund through Paystack, then marks the order refunded and restocks. */
export async function refundOrder(orderId: string, reason: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (admin.role !== "admin") return { ok: false, error: "Only administrators can issue refunds." };
  if (!z.string().uuid().safeParse(orderId).success) return { ok: false, error: "Invalid order" };
  const supabase = createAdminClient();
  const { data: order } = await supabase.from("orders").select("id, payment_status, user_id, order_number").eq("id", orderId).single();
  if (!order || order.payment_status !== "paid") return { ok: false, error: "Only paid orders can be refunded." };
  const { data: payment } = await supabase.from("payments").select("reference").eq("order_id", orderId).eq("status", "success").maybeSingle();
  if (!payment) return { ok: false, error: "No successful payment found for this order." };

  if (isPaystackConfigured()) {
    try {
      await refundTransaction(payment.reference);
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Refund failed at Paystack." };
    }
  } else {
    return { ok: false, error: "Paystack is not configured, so the refund cannot be issued automatically." };
  }

  await supabase.from("payments").update({ status: "refunded" }).eq("reference", payment.reference);
  await supabase.from("orders").update({ payment_status: "refunded", status: "refunded" }).eq("id", orderId);
  await supabase.from("order_status_history").insert({ order_id: orderId, status: "refunded", note: reason.slice(0, 500) || "Refund issued", created_by: admin.id });
  await supabase.from("return_requests").update({ status: "refunded" }).eq("order_id", orderId).in("status", ["requested", "approved", "received"]);
  await restock(orderId);
  await sendOrderEmail(orderId, "status", { note: reason || null });
  await notifyCustomer(order.user_id, { type: "refund", title: `Refund issued for ${order.order_number}`, link: `/account/orders/${orderId}` });
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, message: "Refund issued." };
}

export async function updateReturnRequest(id: string, status: "approved" | "rejected" | "received", response: string): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().uuid(), status: z.enum(["approved", "rejected", "received"]) }).safeParse({ id, status });
  if (!parsed.success) return { ok: false, error: "Invalid request" };
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("return_requests")
    .update({ status, admin_response: response.slice(0, 1000) || null })
    .eq("id", id)
    .select("order_id, user_id, orders(order_number)")
    .single();
  if (data) {
    const num = (data.orders as unknown as { order_number: string }).order_number;
    await notifyCustomer(data.user_id, { type: "return_update", title: `Return for ${num}: ${status}`, body: response || undefined, link: `/account/orders/${data.order_id}` });
    if (status === "rejected") {
      // Return the order to delivered so it no longer shows as an open return.
      await supabase.from("orders").update({ status: "delivered" }).eq("id", data.order_id).eq("status", "return_requested");
    }
    revalidatePath(`/admin/orders/${data.order_id}`);
  }
  return { ok: true, message: "Return updated." };
}

// ---------------------------------------------------------------------------
// Quotations
// ---------------------------------------------------------------------------
const quoteSchema = z.object({
  id: z.string().uuid(),
  items: z
    .array(
      z.object({
        productId: z.union([z.literal(""), z.null(), z.string().uuid()]).optional().transform((v) => (v ? v : null)),
        description: z.string().trim().min(1).max(200),
        colour: text(80),
        quantity: z.coerce.number().int().min(1).max(100000),
        unitPrice: z.coerce.number().min(0).max(1_000_000_000),
      }),
    )
    .max(100),
  discount: z.coerce.number().min(0),
  deliveryFee: z.coerce.number().min(0),
  validUntil: z.string().optional().transform((v) => (v ? v : null)),
  message: text(3000),
  adminNotes: text(5000),
  status: z.enum(["new", "reviewing", "quoted", "accepted", "declined", "expired", "converted"]).optional(),
});

export async function saveQuotation(input: z.input<typeof quoteSchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid quotation" };
  const d = parsed.data;
  const subtotal = d.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const discount = Math.min(d.discount, subtotal);
  const supabase = createAdminClient();

  await supabase.from("quotation_items").delete().eq("quotation_id", d.id);
  if (d.items.length) {
    await supabase.from("quotation_items").insert(
      d.items.map((i, idx) => ({ quotation_id: d.id, product_id: i.productId, description: i.description, colour: i.colour, quantity: i.quantity, unit_price: i.unitPrice, sort_order: idx })),
    );
  }
  await supabase
    .from("quotation_requests")
    .update({
      subtotal,
      discount_amount: discount,
      delivery_fee: d.deliveryFee,
      total: Math.max(0, subtotal - discount) + d.deliveryFee,
      valid_until: d.validUntil,
      quote_message: d.message,
      admin_notes: d.adminNotes,
      ...(d.status ? { status: d.status } : {}),
    })
    .eq("id", d.id);
  revalidatePath(`/admin/quotations/${d.id}`);
  return { ok: true, message: "Quotation saved." };
}

export async function sendQuotation(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data: q } = await supabase.from("quotation_requests").select("*, quotation_items(id)").eq("id", id).single();
  if (!q) return { ok: false, error: "Quotation not found." };
  if (!q.quotation_items.length || Number(q.total) <= 0) return { ok: false, error: "Add priced items before sending the quotation." };
  if (["converted"].includes(q.status)) return { ok: false, error: "This quotation has already been converted to an order." };

  await supabase.from("quotation_requests").update({ status: "quoted", quoted_at: new Date().toISOString() }).eq("id", id);
  const email = emailTemplates.quotationIssued(
    { reference: q.reference, full_name: q.full_name, currency: q.currency, total: Number(q.total), valid_until: q.valid_until, quote_message: q.quote_message },
    { site: env.siteUrl(), view: `${env.siteUrl()}/quotes/${q.access_token}` },
  );
  await sendEmail({ to: q.email, subject: email.subject, html: email.html });
  await notifyCustomer(q.user_id, { type: "quotation", title: `Quotation ${q.reference} is ready`, link: `/quotes/${q.access_token}` });
  revalidatePath(`/admin/quotations/${id}`);
  return { ok: true, message: "Quotation sent to the customer." };
}

export async function setQuotationStatus(id: string, status: "reviewing" | "accepted" | "declined" | "expired"): Promise<ActionResult> {
  await requireAdmin();
  if (!z.enum(["reviewing", "accepted", "declined", "expired"]).safeParse(status).success) return { ok: false, error: "Invalid status" };
  const supabase = createAdminClient();
  await supabase.from("quotation_requests").update({ status, responded_at: ["accepted", "declined"].includes(status) ? new Date().toISOString() : null }).eq("id", id);
  revalidatePath(`/admin/quotations/${id}`);
  return { ok: true };
}

/** Creates a pending-payment order from an accepted quotation and emails a payment link. */
export async function convertQuotationToOrder(id: string): Promise<ActionResult<{ orderId: string }>> {
  const admin = await requireAdmin();
  const supabase = createAdminClient();
  const { data: q } = await supabase.from("quotation_requests").select("*, quotation_items(*)").eq("id", id).single();
  if (!q) return { ok: false, error: "Quotation not found." };
  if (q.status !== "accepted") return { ok: false, error: "Only accepted quotations can be converted." };
  if (q.order_id) return { ok: false, error: "This quotation already has an order." };

  // Resolve a variant per item (matching the requested colour) so stock is deducted on payment.
  const productIds = q.quotation_items.map((i) => i.product_id).filter((x): x is string => !!x);
  const { data: products } = productIds.length
    ? await supabase.from("products").select("id, slug, purchase_unit, unit_label, product_images(url, sort_order), product_variants(id, name, product_colours(name))").in("id", productIds)
    : { data: [] };

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      user_id: q.user_id,
      email: q.email,
      phone: q.phone,
      full_name: q.full_name,
      shipping_address: { country: "", state: "", city: "", address_line: q.delivery_location ?? "" },
      currency: q.currency,
      subtotal: q.subtotal,
      discount_total: q.discount_amount,
      shipping_total: q.delivery_fee,
      total: q.total,
      shipping_method: "As quoted",
      source: "quotation",
      quotation_id: q.id,
    })
    .select("id, order_number, access_token")
    .single();
  if (error || !order) return { ok: false, error: error?.message ?? "Could not create order." };

  await supabase.from("order_items").insert(
    q.quotation_items.map((i) => {
      const p = products?.find((x) => x.id === i.product_id);
      const variant =
        p?.product_variants.find((v) => (v.product_colours as { name: string } | null)?.name?.toLowerCase() === (i.colour ?? "").toLowerCase()) ?? p?.product_variants[0];
      const unit = p ? (p.purchase_unit === "custom" ? (p.unit_label ?? "Per unit") : orderUnit(p.purchase_unit)) : "As quoted";
      return {
        order_id: order.id,
        product_id: i.product_id,
        variant_id: variant?.id ?? null,
        product_name: i.description,
        product_slug: p?.slug ?? null,
        variant_name: i.colour ?? variant?.name ?? null,
        colour: i.colour,
        unit_label: unit,
        image_url: p?.product_images.sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null,
        unit_price: i.unit_price,
        quantity: i.quantity,
        line_total: Number(i.unit_price) * i.quantity,
      };
    }),
  );
  await supabase.from("order_status_history").insert({ order_id: order.id, status: "pending_payment", note: `Created from quotation ${q.reference}`, created_by: admin.id });
  await supabase.from("quotation_requests").update({ status: "converted", order_id: order.id }).eq("id", id);

  const email = emailTemplates.orderPaymentLink(
    { order_number: order.order_number, full_name: q.full_name, total: Number(q.total), currency: q.currency },
    { site: env.siteUrl(), pay: `${env.siteUrl()}/orders/${order.order_number}?token=${order.access_token}` },
  );
  await sendEmail({ to: q.email, subject: email.subject, html: email.html });
  await notifyCustomer(q.user_id, { type: "order_created", title: `Order ${order.order_number} is ready for payment`, link: `/quotes/${q.access_token}` });
  revalidatePath(`/admin/quotations/${id}`);
  return { ok: true, data: { orderId: order.id }, message: `Order ${order.order_number} created and payment link sent.` };
}

function orderUnit(unit: string) {
  return { per_yard: "Per yard", bundle_4_yard: "Four-yard bundle", bundle_5_yard: "Five-yard bundle", per_item: "Per item", per_set: "Per set" }[unit] ?? "Per unit";
}

// ---------------------------------------------------------------------------
// Asoebi events and packages
// ---------------------------------------------------------------------------
const eventSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(160),
  slug: z.string().trim().max(120).optional(),
  eventType: text(80),
  eventDate: z.string().optional().transform((v) => (v ? v : null)),
  orderDeadline: z.string().optional().transform((v) => (v ? new Date(v).toISOString() : null)),
  description: text(5000),
  guestInstructions: text(3000),
  coverImageUrl: text(1000),
  coordinatorName: text(120),
  coordinatorEmail: z.union([z.literal(""), z.string().email()]).optional().transform((v) => (v ? v : null)),
  coordinatorPhone: text(30),
  expectedGuests: z.union([z.literal(""), z.coerce.number().int().min(0)]).optional().transform((v) => (v === "" || v === undefined ? null : Number(v))),
  deliveryMode: z.enum(["individual", "collective", "both"]),
  collectiveDeliveryNote: text(500),
  isPublished: z.boolean(),
  quotationId: z.union([z.literal(""), z.null(), z.string().uuid()]).optional().transform((v) => (v ? v : null)),
  products: z
    .array(
      z.object({
        productId: z.string().uuid(),
        packageLabel: text(120),
        priceOverride: z.union([z.literal(""), z.null(), z.coerce.number().min(0)]).optional().transform((v) => (v === "" || v == null ? null : Number(v))),
        notes: text(300),
      }),
    )
    .max(30),
});

export async function saveAsoebiEvent(input: z.input<typeof eventSchema>): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid event" };
  const d = parsed.data;
  const supabase = createAdminClient();
  const eventSlug = d.slug ? slugify(d.slug) : `${slugify(d.title)}-${crypto.randomBytes(2).toString("hex")}`;
  const row = {
    title: d.title,
    slug: eventSlug,
    event_type: d.eventType,
    event_date: d.eventDate,
    order_deadline: d.orderDeadline,
    description: d.description,
    guest_instructions: d.guestInstructions,
    cover_image_url: d.coverImageUrl,
    coordinator_name: d.coordinatorName,
    coordinator_email: d.coordinatorEmail,
    coordinator_phone: d.coordinatorPhone,
    expected_guests: d.expectedGuests,
    delivery_mode: d.deliveryMode,
    collective_delivery_note: d.collectiveDeliveryNote,
    is_published: d.isPublished,
    quotation_id: d.quotationId,
  };
  const { data, error } = d.id
    ? await supabase.from("asoebi_events").update(row).eq("id", d.id).select("id").single()
    : await supabase.from("asoebi_events").insert(row).select("id").single();
  if (error || !data) return { ok: false, error: error?.code === "23505" ? "That URL slug is already in use." : (error?.message ?? "Could not save") };

  await supabase.from("asoebi_event_products").delete().eq("event_id", data.id);
  if (d.products.length) {
    await supabase.from("asoebi_event_products").insert(
      d.products.map((p, i) => ({ event_id: data.id, product_id: p.productId, package_label: p.packageLabel, price_override: p.priceOverride, notes: p.notes, sort_order: i })),
    );
  }
  updateTag("asoebi");
  updateTag(`event:${eventSlug}`);
  return { ok: true, data: { id: data.id }, message: "Event saved." };
}

export async function deleteAsoebiEvent(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { count } = await supabase.from("asoebi_guest_orders").select("id", { count: "exact", head: true }).eq("event_id", id);
  if ((count ?? 0) > 0) return { ok: false, error: "This event has guest orders. Unpublish it instead." };
  await supabase.from("asoebi_events").delete().eq("id", id);
  updateTag("asoebi");
  return { ok: true };
}

const packageSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  tagline: text(200),
  description: text(2000),
  includedServices: z.array(z.string().trim().min(1).max(200)).max(20),
  price: z.union([z.literal(""), z.null(), z.coerce.number().min(0)]).optional().transform((v) => (v === "" || v == null ? null : Number(v))),
  priceNote: text(200),
  isQuoteBased: z.boolean(),
  isActive: z.boolean(),
});

export async function saveAsoebiPackage(input: z.input<typeof packageSchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = packageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid package" };
  const d = parsed.data;
  const supabase = createAdminClient();
  await supabase
    .from("asoebi_packages")
    .update({ name: d.name, tagline: d.tagline, description: d.description, included_services: d.includedServices, price: d.price, price_note: d.priceNote, is_quote_based: d.isQuoteBased, is_active: d.isActive })
    .eq("id", d.id);
  updateTag("asoebi");
  return { ok: true, message: "Package saved." };
}
