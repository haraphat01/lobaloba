"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { quoteOrder, type CartLineInput } from "@/lib/pricing";
import { initializeTransaction, isPaystackConfigured, newPaymentReference } from "@/lib/paystack";
import { rateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { getSettings } from "@/lib/data/settings";
import { checkoutSchema, eventOrderSchema, fieldErrors, trackSchema, type ActionResult } from "@/lib/validation";

type OrderInsert = {
  userId: string | null;
  email: string;
  phone: string;
  fullName: string;
  address: { country: string; state: string; city: string; address_line: string };
  instructions: string | null;
  lines: CartLineInput[];
  couponCode?: string | null;
  shippingRateId?: string | null;
  priceOverrides?: Map<string, number>;
  source: "storefront" | "asoebi_event";
  asoebiEventId?: string | null;
};

type CreatedOrder = { id: string; order_number: string; access_token: string; total: number; currency: string; email: string };

/** Prices everything server-side and creates a pending order with its items. */
async function createPendingOrder(input: OrderInsert): Promise<{ ok: true; order: CreatedOrder } | { ok: false; error: string; fieldErrors?: Record<string, string> }> {
  const quote = await quoteOrder({
    lines: input.lines,
    couponCode: input.couponCode,
    email: input.email,
    shippingRateId: input.shippingRateId,
    destination: { country: input.address.country, state: input.address.state, city: input.address.city },
    priceOverrides: input.priceOverrides,
  });

  if (quote.lines.length === 0) return { ok: false, error: "Your bag is empty." };
  const problem = quote.lines.find((l) => l.issue);
  if (problem) {
    return {
      ok: false,
      error:
        problem.issue === "insufficient_stock"
          ? `Only ${problem.available} of ${problem.productName} (${problem.variantName}) is available. Please update your bag.`
          : `${problem.productName} (${problem.variantName}) is no longer available. Please remove it from your bag.`,
    };
  }
  const belowMin = quote.lines.find((l) => l.quantity < l.minQuantity);
  if (belowMin) return { ok: false, error: `${belowMin.productName} requires a minimum of ${belowMin.minQuantity}.` };
  if (input.couponCode && quote.couponError) return { ok: false, error: quote.couponError, fieldErrors: { couponCode: quote.couponError } };
  if (input.shippingRateId && !quote.shipping) return { ok: false, error: "Please choose a delivery option for your location." };
  if (quote.total <= 0) return { ok: false, error: "Order total must be greater than zero." };

  const supabase = createAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      user_id: input.userId,
      email: input.email,
      phone: input.phone,
      full_name: input.fullName,
      shipping_address: input.address,
      delivery_instructions: input.instructions,
      currency: quote.currency,
      subtotal: quote.subtotal,
      discount_total: quote.discount,
      shipping_total: quote.shippingTotal,
      total: quote.total,
      coupon_id: quote.coupon?.couponId ?? null,
      coupon_code: quote.coupon?.code ?? null,
      shipping_rate_id: quote.shipping?.rateId ?? null,
      shipping_method: quote.shipping ? `${quote.shipping.name}` : input.source === "asoebi_event" ? "Collective event delivery" : null,
      shipping_requires_quote: quote.shipping?.requiresQuote ?? false,
      source: input.source,
      asoebi_event_id: input.asoebiEventId ?? null,
    })
    .select("id, order_number, access_token, total, currency, email")
    .single();
  if (error || !order) {
    console.error("[checkout] order insert failed", error?.message);
    return { ok: false, error: "We couldn't create your order. Please try again." };
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    quote.lines.map((l) => ({
      order_id: order.id,
      product_id: l.productId,
      variant_id: l.variantId,
      product_name: l.productName,
      product_slug: l.productSlug,
      variant_name: l.variantName,
      colour: l.colour,
      unit_label: l.unitLabel,
      image_url: l.imageUrl,
      unit_price: l.unitPrice,
      quantity: l.quantity,
      line_total: l.lineTotal,
    })),
  );
  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    console.error("[checkout] items insert failed", itemsError.message);
    return { ok: false, error: "We couldn't create your order. Please try again." };
  }
  await supabase.from("order_status_history").insert({ order_id: order.id, status: "pending_payment", note: "Order created" });

  return { ok: true, order: { ...order, total: Number(order.total) } };
}

/** Creates a Paystack transaction for a pending order and returns the hosted payment URL. */
async function startPayment(order: CreatedOrder): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!isPaystackConfigured()) {
    return { ok: false, error: "Online payment is not yet configured. Please contact us on WhatsApp to complete your order." };
  }
  const settings = await getSettings();
  const reference = newPaymentReference(order.order_number);
  const supabase = createAdminClient();
  const { error } = await supabase.from("payments").insert({
    order_id: order.id,
    reference,
    amount: order.total,
    currency: order.currency,
    status: "initialized",
  });
  if (error) return { ok: false, error: "Could not start payment. Please try again." };

  try {
    const tx = await initializeTransaction({
      email: order.email,
      amount: order.total,
      currency: order.currency,
      reference,
      callbackUrl: `${env.siteUrl()}/checkout/complete`,
      channels: settings.payment.channels,
      metadata: { order_id: order.id, order_number: order.order_number },
    });
    return { ok: true, url: tx.authorization_url };
  } catch (e) {
    console.error("[checkout] paystack init failed", e);
    await supabase.from("payments").update({ status: "failed", gateway_response: "Initialization failed" }).eq("reference", reference);
    return { ok: false, error: "We couldn't reach our payment provider. Please try again in a moment." };
  }
}

export async function placeOrder(input: unknown): Promise<ActionResult<{ paymentUrl: string; orderNumber: string }>> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  if (!(await rateLimit("checkout", 10, 600))) return { ok: false, error: "Too many attempts. Please wait a few minutes and try again." };

  const d = parsed.data;
  const user = await getCurrentUser();
  const result = await createPendingOrder({
    userId: user?.id ?? null,
    email: d.email,
    phone: d.phone,
    fullName: d.fullName,
    address: { country: d.country, state: d.state, city: d.city, address_line: d.addressLine },
    instructions: d.instructions,
    lines: d.lines,
    couponCode: d.couponCode || null,
    shippingRateId: d.shippingRateId,
    source: "storefront",
  });
  if (!result.ok) return result;

  if (user && d.saveAddress && d.addressLine) {
    const supabase = createAdminClient();
    const { count } = await supabase.from("addresses").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    await supabase.from("addresses").insert({
      user_id: user.id,
      full_name: d.fullName,
      phone: d.phone,
      country: d.country,
      state: d.state,
      city: d.city,
      address_line: d.addressLine,
      is_default: (count ?? 0) === 0,
    });
  }

  const payment = await startPayment(result.order);
  if (!payment.ok) return payment;
  return { ok: true, data: { paymentUrl: payment.url, orderNumber: result.order.order_number } };
}

/** Starts (or restarts) payment for an existing unpaid order, e.g. one created from a quotation. */
export async function payExistingOrder(orderNumber: string, token: string): Promise<ActionResult<{ paymentUrl: string }>> {
  const ok = z.object({ n: z.string().max(40), t: z.string().uuid() }).safeParse({ n: orderNumber, t: token });
  if (!ok.success) return { ok: false, error: "Invalid order link." };
  if (!(await rateLimit("pay-order", 10, 600))) return { ok: false, error: "Too many attempts. Please wait a few minutes." };

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, access_token, total, currency, email, payment_status, status")
    .eq("order_number", ok.data.n)
    .eq("access_token", ok.data.t)
    .maybeSingle();
  if (!order) return { ok: false, error: "Order not found." };
  if (order.payment_status === "paid") return { ok: false, error: "This order has already been paid." };
  if (order.status === "cancelled") return { ok: false, error: "This order has been cancelled." };

  const payment = await startPayment({ ...order, total: Number(order.total) });
  if (!payment.ok) return payment;
  return { ok: true, data: { paymentUrl: payment.url } };
}

/** Guest checkout for an Asoebi event page: each guest pays for their own selection. */
export async function placeEventOrder(input: unknown): Promise<ActionResult<{ paymentUrl: string }>> {
  const parsed = eventOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  if (!(await rateLimit("event-checkout", 10, 600))) return { ok: false, error: "Too many attempts. Please wait a few minutes and try again." };
  const d = parsed.data;

  const supabase = createAdminClient();
  const { data: event } = await supabase
    .from("asoebi_events")
    .select("id, title, order_deadline, delivery_mode, is_published, asoebi_event_products(product_id, price_override)")
    .eq("slug", d.eventSlug)
    .maybeSingle();
  if (!event || !event.is_published) return { ok: false, error: "This event page is not available." };
  if (event.order_deadline && new Date(event.order_deadline).getTime() < Date.now()) return { ok: false, error: "Orders for this event have closed." };

  const individual = d.deliveryPreference === "individual";
  if (individual && event.delivery_mode === "collective") return { ok: false, error: "This event uses collective delivery." };
  if (!individual && event.delivery_mode === "individual") return { ok: false, error: "Please enter your delivery address." };
  if (individual && (!d.state || !d.city || !d.addressLine || !d.shippingRateId)) {
    return { ok: false, error: "Please enter your delivery address and choose a delivery option.", fieldErrors: { addressLine: "Required for individual delivery" } };
  }

  // Only products attached to the event may be ordered, at the event price.
  const allowed = new Map(event.asoebi_event_products.map((p) => [p.product_id, p.price_override]));
  const { data: variants } = await supabase.from("product_variants").select("id, product_id").in("id", d.lines.map((l) => l.variantId));
  if (!variants || variants.some((v) => !allowed.has(v.product_id))) return { ok: false, error: "One of your selections is not part of this event." };
  const overrides = new Map<string, number>();
  for (const [productId, price] of allowed) if (price !== null) overrides.set(productId, Number(price));

  const user = await getCurrentUser();
  const result = await createPendingOrder({
    userId: user?.id ?? null,
    email: d.guestEmail,
    phone: d.guestPhone,
    fullName: d.guestName,
    address: individual
      ? { country: d.country || "Nigeria", state: d.state, city: d.city, address_line: d.addressLine }
      : { country: "Nigeria", state: "", city: "", address_line: `Collective delivery — ${event.title}` },
    instructions: null,
    lines: d.lines,
    shippingRateId: individual ? d.shippingRateId : null,
    priceOverrides: overrides,
    source: "asoebi_event",
    asoebiEventId: event.id,
  });
  if (!result.ok) return result;

  await supabase.from("asoebi_guest_orders").insert({
    event_id: event.id,
    order_id: result.order.id,
    guest_name: d.guestName,
    guest_email: d.guestEmail,
    guest_phone: d.guestPhone,
    delivery_preference: d.deliveryPreference,
  });

  const payment = await startPayment(result.order);
  if (!payment.ok) return payment;
  return { ok: true, data: { paymentUrl: payment.url } };
}

/** Order tracking: order number plus matching email or phone. */
export async function trackOrder(_: unknown, formData: FormData): Promise<{ error?: string }> {
  const parsed = trackSchema.safeParse({ orderNumber: formData.get("orderNumber"), contact: formData.get("contact") });
  if (!parsed.success) return { error: "Enter your order number and the email or phone used at checkout." };
  if (!(await rateLimit("track", 10, 600))) return { error: "Too many attempts. Please wait a few minutes." };

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("order_number, access_token, email, phone")
    .eq("order_number", parsed.data.orderNumber)
    .maybeSingle();

  const contact = parsed.data.contact.trim().toLowerCase();
  const digits = (v: string) => v.replace(/\D/g, "").slice(-10);
  const matches =
    order && (order.email.toLowerCase() === contact || (digits(contact).length >= 7 && digits(order.phone) === digits(contact)));
  if (!order || !matches) return { error: "We couldn't find an order matching those details." };

  redirect(`/orders/${encodeURIComponent(order.order_number)}?token=${order.access_token}`);
}
