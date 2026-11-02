import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type OrderView = NonNullable<Awaited<ReturnType<typeof getOrderWithAccess>>>;

const ORDER_SELECT = `id, order_number, access_token, user_id, email, phone, full_name, shipping_address, delivery_instructions, status, payment_status,
  currency, subtotal, discount_total, shipping_total, total, coupon_code, shipping_method, shipping_requires_quote, carrier, tracking_number,
  tracking_url, created_at, paid_at, source, asoebi_event_id,
  order_items(id, product_name, product_slug, variant_name, colour, unit_label, image_url, unit_price, quantity, line_total),
  order_status_history(status, note, created_at)`;

/** Loads an order if the caller presents its access token or owns it. */
export async function getOrderWithAccess(orderNumber: string, opts: { token?: string | null; userId?: string | null }) {
  const supabase = createAdminClient();
  const { data } = await supabase.from("orders").select(ORDER_SELECT).eq("order_number", orderNumber).maybeSingle();
  if (!data) return null;
  const allowed = (opts.token && opts.token === data.access_token) || (opts.userId && opts.userId === data.user_id);
  if (!allowed) return null;
  return {
    ...data,
    order_status_history: [...data.order_status_history].sort((a, b) => a.created_at.localeCompare(b.created_at)),
  };
}

export async function getOrderById(orderId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.from("orders").select(ORDER_SELECT).eq("id", orderId).maybeSingle();
  return data;
}
