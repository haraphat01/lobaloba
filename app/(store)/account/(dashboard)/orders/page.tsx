import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/account/status-badge";
import { getAccountOverview } from "@/lib/data/account";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Order history", robots: { index: false } };

export default function OrdersPage() {
  return (
    <>
      <h1 className="text-5xl">Order history</h1>
      <Suspense fallback={<Skeleton className="mt-8 h-64 rounded-none" />}>
        <OrderList />
      </Suspense>
    </>
  );
}

async function OrderList() {
  const { orders } = await getAccountOverview();
  if (!orders.length) return <p className="mt-8 text-muted-foreground">No orders yet.</p>;
  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase">
            <th className="py-3">Order</th>
            <th>Date</th>
            <th>Status</th>
            <th>Payment</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-border/70">
              <td className="py-4">
                <Link href={`/account/orders/${o.id}`} className="font-medium text-wine hover:underline">
                  {o.order_number}
                </Link>
              </td>
              <td>{formatDate(o.created_at)}</td>
              <td>
                <StatusBadge status={o.status} />
              </td>
              <td>
                <StatusBadge status={o.payment_status} kind="other" />
              </td>
              <td className="text-right">{formatMoney(o.total, o.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
