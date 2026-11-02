import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderSummary, OrderTimeline } from "@/components/store/order-details";
import { PayOrderButton } from "@/components/store/pay-order-button";
import { getOrderWithAccess } from "@/lib/data/orders";
import { getCurrentUser } from "@/lib/auth";
import { orderStatusLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Order status", robots: { index: false } };

export default function OrderPage({ params, searchParams }: PageProps<"/orders/[number]">) {
  return (
    <div className="container-x py-14">
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-none" />}>
        <OrderContent params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function OrderContent({ params, searchParams }: Pick<PageProps<"/orders/[number]">, "params" | "searchParams">) {
  const [{ number }, sp] = await Promise.all([params, searchParams]);
  const token = typeof sp.token === "string" ? sp.token : null;
  const user = await getCurrentUser();
  const order = await getOrderWithAccess(decodeURIComponent(number), { token, userId: user?.id });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Order tracking</p>
          <h1 className="mt-3 text-5xl">{order.order_number}</h1>
          <p className="mt-2 text-muted-foreground">Status: {orderStatusLabel(order.status)}</p>
        </div>
        {order.payment_status !== "paid" && order.status === "pending_payment" && <PayOrderButton orderNumber={order.order_number} token={order.access_token} />}
      </div>
      <OrderTimeline order={order} />
      <OrderSummary order={order} />
    </div>
  );
}
