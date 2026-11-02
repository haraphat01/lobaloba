import Link from "next/link";
import { Suspense } from "react";
import { Download } from "lucide-react";
import { AdminHeader, Table, Td } from "@/components/admin/ui";
import { StatusBadge } from "@/components/account/status-badge";
import { listOrders, parseOrderFilters } from "@/lib/data/admin-orders";
import { formatDateTime, formatMoney, ORDER_STATUSES } from "@/lib/format";

export default function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <Orders searchParams={searchParams} />
    </Suspense>
  );
}

async function Orders({ searchParams }: Pick<PageProps<"/admin/orders">, "searchParams">) {
  const sp = await searchParams;
  const f = parseOrderFilters(sp);
  const orders = await listOrders(f);
  const exportQs = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <>
      <AdminHeader
        title="Orders"
        description={`${orders.length} order(s)`}
        actions={
          <a href={`/admin/orders/export${exportQs ? `?${exportQs}` : ""}`} className="inline-flex h-9 items-center gap-2 rounded-sm border border-border bg-card px-4 text-xs tracking-wider uppercase hover:border-wine">
            <Download className="size-4" /> Export CSV
          </a>
        }
      />
      <form className="mb-4 flex flex-wrap gap-2 text-sm">
        <input name="q" defaultValue={f.q} placeholder="Order #, name, email, phone" className="min-w-56 rounded-sm border border-border bg-card px-3 py-2" />
        <select name="status" defaultValue={f.status ?? ""} className="rounded-sm border border-border bg-card px-3 py-2">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select name="payment" defaultValue={f.payment ?? ""} className="rounded-sm border border-border bg-card px-3 py-2">
          <option value="">All payments</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
        </select>
        <select name="source" defaultValue={f.source ?? ""} className="rounded-sm border border-border bg-card px-3 py-2">
          <option value="">All sources</option>
          <option value="storefront">Storefront</option>
          <option value="asoebi_event">Asoebi event</option>
          <option value="quotation">Quotation</option>
        </select>
        <input type="date" name="from" defaultValue={f.from} aria-label="From" className="rounded-sm border border-border bg-card px-3 py-2" />
        <input type="date" name="to" defaultValue={f.to} aria-label="To" className="rounded-sm border border-border bg-card px-3 py-2" />
        <button type="submit" className="rounded-sm bg-ink px-4 text-ivory">Filter</button>
        <Link href="/admin/orders" className="self-center text-xs underline">Reset</Link>
      </form>
      <Table head={["Order", "Customer", "Items", "Status", "Payment", "Total", "Placed"]} empty={orders.length === 0}>
        {orders.map((o) => (
          <tr key={o.id} className="hover:bg-cream/40">
            <Td>
              <Link href={`/admin/orders/${o.id}`} className="font-medium text-wine hover:underline">
                {o.order_number}
              </Link>
              {o.source !== "storefront" && <span className="block text-[0.65rem] text-muted-foreground uppercase">{o.source.replace("_", " ")}</span>}
            </Td>
            <Td>
              {o.full_name}
              <span className="block text-xs text-muted-foreground">{o.email}</span>
            </Td>
            <Td className="max-w-56 truncate text-xs">{o.order_items.map((i) => `${i.product_name} ×${i.quantity}`).join(", ")}</Td>
            <Td>
              <StatusBadge status={o.status} />
            </Td>
            <Td>
              <StatusBadge status={o.payment_status} kind="other" />
            </Td>
            <Td>{formatMoney(o.total, o.currency)}</Td>
            <Td className="text-xs whitespace-nowrap">{formatDateTime(o.created_at)}</Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
