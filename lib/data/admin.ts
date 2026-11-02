import "server-only";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type DateRange = { from: Date; to: Date; bucket: "hour" | "day" | "week" | "month"; label: string; key: string };

/** Resolves dashboard range presets (today, 7d, 30d, 12m) or a custom from/to. */
export function resolveRange(sp: Record<string, string | string[] | undefined>): DateRange {
  const key = typeof sp.range === "string" ? sp.range : "30d";
  const now = new Date();
  const to = new Date(now.getTime() + 60_000);
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);
  switch (key) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { from: start, to, bucket: "hour", label: "Today", key };
    }
    case "7d":
      return { from: daysAgo(7), to, bucket: "day", label: "Last 7 days", key };
    case "12m":
      return { from: daysAgo(365), to, bucket: "month", label: "Last 12 months", key };
    case "custom": {
      const f = typeof sp.from === "string" ? new Date(sp.from) : daysAgo(30);
      const t = typeof sp.to === "string" ? new Date(`${sp.to}T23:59:59`) : to;
      const from = Number.isNaN(f.getTime()) ? daysAgo(30) : f;
      const end = Number.isNaN(t.getTime()) ? to : t;
      const days = (end.getTime() - from.getTime()) / 86_400_000;
      return { from, to: end, bucket: days > 120 ? "month" : days > 2 ? "day" : "hour", label: "Custom range", key };
    }
    default:
      return { from: daysAgo(30), to, bucket: "day", label: "Last 30 days", key: "30d" };
  }
}

export async function getDashboard(range: DateRange) {
  await requireAdmin();
  const db = createAdminClient();
  const from = range.from.toISOString();
  const to = range.to.toISOString();

  const [summary, series, customers, lowStock, recent, topItems, notifications] = await Promise.all([
    db.rpc("admin_sales_summary", { p_from: from, p_to: to }),
    db.rpc("admin_revenue_series", { p_from: from, p_to: to, p_bucket: range.bucket }),
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("product_listing").select("id, name, slug, total_stock, low_stock_threshold").eq("status", "active").order("total_stock").limit(40),
    db.from("payments").select("reference, amount, currency, status, channel, paid_at, created_at, orders(id, order_number, full_name)").order("created_at", { ascending: false }).limit(8),
    db.from("order_items").select("product_id, product_name, quantity, line_total, orders!inner(payment_status, paid_at)").eq("orders.payment_status", "paid").gte("orders.paid_at", from).lt("orders.paid_at", to),
    db.from("notifications").select("id, title, body, link, read_at, created_at").eq("audience", "admin").order("created_at", { ascending: false }).limit(8),
  ]);

  const best = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const i of topItems.data ?? []) {
    const k = i.product_id ?? i.product_name;
    const cur = best.get(k) ?? { name: i.product_name, quantity: 0, revenue: 0 };
    cur.quantity += i.quantity;
    cur.revenue += Number(i.line_total);
    best.set(k, cur);
  }

  const s = (summary.data ?? {}) as Record<string, number>;
  return {
    summary: {
      revenue: Number(s.revenue ?? 0),
      orders: Number(s.orders ?? 0),
      pending: Number(s.pending ?? 0),
      completed: Number(s.completed ?? 0),
      awaitingPayment: Number(s.awaiting_payment ?? 0),
      customers: customers.count ?? 0,
    },
    series: (series.data ?? []).map((r) => ({ bucket: r.bucket, revenue: Number(r.revenue), orders: Number(r.orders) })),
    lowStock: (lowStock.data ?? []).filter((p) => (p.total_stock ?? 0) <= (p.low_stock_threshold ?? 5)).slice(0, 10),
    recent: recent.data ?? [],
    bestsellers: [...best.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6),
    notifications: notifications.data ?? [],
  };
}
