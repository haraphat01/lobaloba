import "server-only";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** All reads use the user's own session, so RLS limits results to their data. */
export async function getAccountOverview() {
  const user = await requireUser("/account");
  const supabase = await createClient();
  const [{ data: orders }, { data: notifications }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, status, payment_status, total, currency, created_at, tracking_number, order_items(product_name, image_url)")
      .order("created_at", { ascending: false }),
    supabase.from("notifications").select("id, title, body, link, read_at, created_at").order("created_at", { ascending: false }).limit(8),
  ]);
  return { user, orders: orders ?? [], notifications: notifications ?? [] };
}

export async function getMyOrder(id: string) {
  const user = await requireUser(`/account/orders/${id}`);
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      `id, order_number, access_token, user_id, email, phone, full_name, shipping_address, delivery_instructions, status, payment_status,
       currency, subtotal, discount_total, shipping_total, total, coupon_code, shipping_method, shipping_requires_quote, carrier, tracking_number,
       tracking_url, created_at, paid_at, source, asoebi_event_id,
       order_items(id, product_id, product_name, product_slug, variant_name, colour, unit_label, image_url, unit_price, quantity, line_total),
       order_status_history(status, note, created_at), return_requests(id, reason, status, admin_response, created_at)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return { user, order: null };
  return {
    user,
    order: { ...data, order_status_history: [...data.order_status_history].sort((a, b) => a.created_at.localeCompare(b.created_at)) },
  };
}
