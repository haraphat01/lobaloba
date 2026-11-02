import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/account/status-badge";
import { ReturnRequestForm } from "@/components/account/account-forms";
import { OrderSummary, OrderTimeline } from "@/components/store/order-details";
import { PayOrderButton } from "@/components/store/pay-order-button";
import { getMyOrder } from "@/lib/data/account";
import { formatDate, titleCase } from "@/lib/format";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

export default function AccountOrderPage({ params }: PageProps<"/account/orders/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-none" />}>
      <OrderDetail params={params} />
    </Suspense>
  );
}

async function OrderDetail({ params }: Pick<PageProps<"/account/orders/[id]">, "params">) {
  const { id } = await params;
  const { order } = await getMyOrder(id);
  if (!order) notFound();
  const returnable = order.payment_status === "paid" && ["delivered", "shipped", "out_for_delivery"].includes(order.status);
  const openReturn = order.return_requests.find((r) => ["requested", "approved"].includes(r.status));

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/account/orders" className="text-xs tracking-[0.18em] text-muted-foreground uppercase hover:text-wine">
            ← All orders
          </Link>
          <h1 className="mt-3 text-5xl">{order.order_number}</h1>
          <div className="mt-3">
            <StatusBadge status={order.status} />
          </div>
        </div>
        {order.payment_status !== "paid" && order.status === "pending_payment" && <PayOrderButton orderNumber={order.order_number} token={order.access_token} />}
      </div>
      <OrderTimeline order={order} />
      <OrderSummary order={order} />

      <section className="border-t border-border pt-10">
        <h2 className="text-3xl">Returns</h2>
        {order.return_requests.length > 0 && (
          <ul className="mt-4 space-y-3">
            {order.return_requests.map((r) => (
              <li key={r.id} className="border border-border bg-card p-4 text-sm">
                <p>
                  <strong>{r.reason}</strong> · {titleCase(r.status)} · {formatDate(r.created_at)}
                </p>
                {r.admin_response && <p className="mt-1 text-muted-foreground">{r.admin_response}</p>}
              </li>
            ))}
          </ul>
        )}
        {returnable && !openReturn ? (
          <div className="mt-6 max-w-xl">
            <ReturnRequestForm orderId={order.id} />
          </div>
        ) : (
          !openReturn && <p className="mt-4 text-sm text-muted-foreground">Returns can be requested once your order has been dispatched. See our <Link href="/returns" className="text-wine underline">returns policy</Link>.</p>
        )}
      </section>
    </div>
  );
}
