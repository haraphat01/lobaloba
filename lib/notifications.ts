import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { emailTemplates } from "@/lib/email/templates";
import { env } from "@/lib/env";
import { getSettings } from "@/lib/data/settings";

type OrderEmailKind = "order_confirmation" | "payment_confirmation" | "status";

async function loadOrder(orderId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(product_name, variant_name, unit_label, quantity, line_total)")
    .eq("id", orderId)
    .single();
  return data;
}

function trackUrl(order: { order_number: string; access_token: string }) {
  return `${env.siteUrl()}/track?order=${encodeURIComponent(order.order_number)}&token=${order.access_token}`;
}

export async function sendOrderEmail(
  orderId: string,
  kind: OrderEmailKind,
  extra: { reference?: string; channel?: string | null; note?: string | null } = {},
) {
  const order = await loadOrder(orderId);
  if (!order) return;
  const settings = await getSettings();
  const site = env.siteUrl();
  const payload = {
    ...order,
    subtotal: Number(order.subtotal),
    discount_total: Number(order.discount_total),
    shipping_total: Number(order.shipping_total),
    total: Number(order.total),
    shipping_address: order.shipping_address as Record<string, string>,
    items: order.order_items.map((i) => ({ ...i, line_total: Number(i.line_total) })),
  };
  const links = { site, track: trackUrl(order) };

  const email =
    kind === "order_confirmation"
      ? emailTemplates.orderConfirmation(payload, links)
      : kind === "payment_confirmation"
        ? emailTemplates.paymentConfirmation({ ...payload, reference: extra.reference ?? "", channel: extra.channel }, links)
        : emailTemplates.orderStatus({ ...payload, status: order.status, note: extra.note }, links);

  await sendEmail({ to: order.email, subject: email.subject, html: email.html, replyTo: settings.email.reply_to || undefined });

  if (kind === "order_confirmation") {
    await notifyAdminByEmail(`New order ${order.order_number}`, [
      `${order.full_name} (${order.email}, ${order.phone}) placed an order.`,
      `Total: ${order.currency} ${Number(order.total).toLocaleString("en-NG")}`,
    ], `/admin/orders/${order.id}`);
  }
}

export async function notifyAdminByEmail(title: string, lines: string[], path: string) {
  const settings = await getSettings();
  const to = settings.store.admin_notification_email || env.adminNotificationEmail();
  if (!to) return;
  const email = emailTemplates.adminNotice({ title, lines, link: `${env.siteUrl()}${path}`, site: env.siteUrl() });
  await sendEmail({ to, subject: email.subject, html: email.html });
}

/** In-dashboard notification for admins (and optionally an email). */
export async function notifyAdmin(input: { type: string; title: string; body?: string; link?: string; email?: boolean }) {
  const supabase = createAdminClient();
  await supabase.from("notifications").insert({
    audience: "admin",
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
  });
  if (input.email && input.link) await notifyAdminByEmail(input.title, input.body ? [input.body] : [], input.link);
}

export async function notifyCustomer(userId: string | null, input: { type: string; title: string; body?: string; link?: string }) {
  if (!userId) return;
  const supabase = createAdminClient();
  await supabase.from("notifications").insert({ user_id: userId, audience: "customer", ...input });
}
