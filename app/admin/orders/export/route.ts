import { type NextRequest } from "next/server";
import { getCurrentUser, isAdminRole } from "@/lib/auth";
import { listOrders, parseOrderFilters } from "@/lib/data/admin-orders";

function csv(value: unknown) {
  let s = String(value ?? "");
  if (/^[=+\-@]/.test(s)) s = `'${s}`; // guard against spreadsheet formula injection
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) return new Response("Forbidden", { status: 403 });

  const filters = parseOrderFilters(Object.fromEntries(request.nextUrl.searchParams));
  const orders = await listOrders(filters, 5000);
  const header = ["Order number", "Placed", "Paid", "Customer", "Email", "Phone", "Status", "Payment", "Source", "Items", "Shipping method", "Tracking", "Address", "Currency", "Total"];
  const rows = orders.map((o) => {
    const a = o.shipping_address as { address_line?: string; city?: string; state?: string; country?: string };
    return [
      o.order_number,
      o.created_at,
      o.paid_at ?? "",
      o.full_name,
      o.email,
      o.phone,
      o.status,
      o.payment_status,
      o.source,
      o.order_items.map((i) => `${i.product_name} (${i.variant_name ?? ""}) x${i.quantity}`).join("; "),
      o.shipping_method ?? "",
      o.tracking_number ?? "",
      [a.address_line, a.city, a.state, a.country].filter(Boolean).join(", "),
      o.currency,
      o.total,
    ].map(csv).join(",");
  });
  return new Response([header.join(","), ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lobaloba-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
