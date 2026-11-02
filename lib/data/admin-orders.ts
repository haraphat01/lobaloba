import "server-only";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type OrderFilters = { q?: string; status?: string; payment?: string; from?: string; to?: string; source?: string };

export function parseOrderFilters(sp: Record<string, string | string[] | undefined>): OrderFilters {
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).slice(0, 80) : undefined);
  return { q: one("q"), status: one("status"), payment: one("payment"), from: one("from"), to: one("to"), source: one("source") };
}

export async function listOrders(f: OrderFilters, limit = 200) {
  await requireAdmin();
  let query = createAdminClient()
    .from("orders")
    .select("id, order_number, full_name, email, phone, status, payment_status, total, currency, source, shipping_method, tracking_number, created_at, paid_at, shipping_address, order_items(product_name, variant_name, quantity)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (f.q) {
    const term = f.q.replace(/[%,()]/g, " ").trim();
    query = query.or(`order_number.ilike.%${term}%,full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
  }
  if (f.status) query = query.eq("status", f.status);
  if (f.payment) query = query.eq("payment_status", f.payment);
  if (f.source) query = query.eq("source", f.source);
  if (f.from) query = query.gte("created_at", new Date(f.from).toISOString());
  if (f.to) query = query.lte("created_at", new Date(`${f.to}T23:59:59`).toISOString());
  const { data } = await query;
  return data ?? [];
}
