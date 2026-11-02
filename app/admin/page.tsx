import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { AlertTriangle, Bell } from "lucide-react";
import { AdminHeader, Panel, Stat } from "@/components/admin/ui";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { RangeFilter } from "@/components/admin/range-filter";
import { StatusBadge } from "@/components/account/status-badge";
import { getDashboard, resolveRange } from "@/lib/data/admin";
import { formatDateTime, formatMoney } from "@/lib/format";

export default function AdminDashboard({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading dashboard…</p>}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  const sp = await searchParams;
  await connection(); // date ranges are relative to "now"
  const range = resolveRange(sp);
  const d = await getDashboard(range);

  return (
    <>
      <AdminHeader title="Dashboard" description={range.label} actions={<RangeFilter />} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <Stat label="Total sales" value={formatMoney(d.summary.revenue)} />
        <Stat label="Paid orders" value={d.summary.orders} />
        <Stat label="Customers" value={d.summary.customers} hint="All time" />
        <Stat label="To fulfil" value={d.summary.pending} hint="Paid, not yet shipped" />
        <Stat label="Completed" value={d.summary.completed} hint="Delivered" />
        <Stat label="Low stock" value={d.lowStock.length} hint="At or below threshold" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Panel title="Revenue">
          <RevenueChart data={d.series} unit={range.bucket} />
        </Panel>
        <Panel title="Bestselling products">
          {d.bestsellers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales in this period.</p>
          ) : (
            <ol className="space-y-3 text-sm">
              {d.bestsellers.map((b, i) => (
                <li key={b.name} className="flex items-center justify-between gap-3">
                  <span className="truncate">
                    <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                    {b.name}
                  </span>
                  <span className="text-right whitespace-nowrap">
                    {formatMoney(b.revenue)} <span className="text-xs text-muted-foreground">· {b.quantity} sold</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Recent transactions" className="xl:col-span-2">
          {d.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <ul className="divide-y divide-border/70 text-sm">
              {d.recent.map((p) => {
                const o = p.orders as unknown as { id: string; order_number: string; full_name: string } | null;
                return (
                  <li key={p.reference} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <span>
                      {o ? (
                        <Link href={`/admin/orders/${o.id}`} className="font-medium text-wine hover:underline">
                          {o.order_number}
                        </Link>
                      ) : (
                        p.reference
                      )}{" "}
                      <span className="text-muted-foreground">· {o?.full_name}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{formatDateTime(p.paid_at ?? p.created_at)}</span>
                      <StatusBadge status={p.status === "success" ? "paid" : p.status} kind="other" />
                      <span className="w-28 text-right">{formatMoney(p.amount, p.currency)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
        <div className="space-y-6">
          <Panel title="Low-stock products">
            {d.lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">All products are well stocked.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {d.lowStock.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-2 truncate hover:text-wine">
                      <AlertTriangle className="size-3.5 shrink-0 text-amber-600" aria-hidden /> {p.name}
                    </Link>
                    <span className={p.total_stock === 0 ? "text-destructive" : "text-amber-700"}>{p.total_stock === 0 ? "Out of stock" : `${p.total_stock} left`}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Notifications">
            {d.notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notifications.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {d.notifications.map((n) => (
                  <li key={n.id} className="flex gap-2">
                    <Bell className={`mt-0.5 size-3.5 shrink-0 ${n.read_at ? "text-muted-foreground" : "text-wine"}`} aria-hidden />
                    {n.link ? (
                      <Link href={n.link} className="hover:text-wine">
                        {n.title}
                      </Link>
                    ) : (
                      n.title
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
      {d.summary.awaitingPayment > 0 && (
        <p className="mt-6 text-xs text-muted-foreground">{d.summary.awaitingPayment} order(s) in this period were created but are still awaiting payment.</p>
      )}
    </>
  );
}
