import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/account/status-badge";
import { FabricImage } from "@/components/shared/fabric-image";
import { getAccountOverview } from "@/lib/data/account";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default function AccountPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-none" />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  const { user, orders, notifications } = await getAccountOverview();
  const paid = orders.filter((o) => o.payment_status === "paid");
  const pending = paid.filter((o) => !["delivered", "cancelled", "refunded"].includes(o.status));
  const completed = orders.filter((o) => o.status === "delivered");
  const inTransit = orders.filter((o) => ["shipped", "out_for_delivery"].includes(o.status));

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-5xl">Hello, {user.fullName.split(" ")[0] || "there"}</h1>
        <p className="mt-2 text-muted-foreground">{user.email}</p>
      </div>

      <dl className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
        {[
          ["Total orders", orders.length],
          ["In progress", pending.length],
          ["In transit", inTransit.length],
          ["Completed", completed.length],
        ].map(([label, value]) => (
          <div key={label} className="bg-card p-6">
            <dt className="text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase">{label}</dt>
            <dd className="mt-2 font-serif text-4xl">{value}</dd>
          </div>
        ))}
      </dl>

      <section>
        <div className="flex items-end justify-between">
          <h2 className="text-3xl">Recent purchases</h2>
          <Link href="/account/orders" className="text-xs tracking-[0.18em] text-wine uppercase hover:underline">
            All orders
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="mt-6 text-muted-foreground">
            You haven&apos;t placed an order yet.{" "}
            <Link href="/shop" className="text-wine underline">
              Start shopping
            </Link>
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-border border-y border-border">
            {orders.slice(0, 5).map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.id}`} className="flex items-center gap-4 py-4 hover:bg-card">
                  <div className="relative h-16 w-13 shrink-0 bg-cream">
                    <FabricImage src={o.order_items[0]?.image_url} alt={o.order_items[0]?.product_name ?? ""} fill sizes="52px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{o.order_number}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {o.order_items.map((i) => i.product_name).join(", ")} · {formatDate(o.created_at)}
                    </p>
                    {o.tracking_number && <p className="text-xs text-wine">Tracking: {o.tracking_number}</p>}
                  </div>
                  <div className="text-right">
                    <StatusBadge status={o.status} />
                    <p className="mt-1 text-sm">{formatMoney(o.total, o.currency)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {notifications.length > 0 && (
        <section>
          <h2 className="text-3xl">Notifications</h2>
          <ul className="mt-6 space-y-3">
            {notifications.map((n) => (
              <li key={n.id} className="flex gap-3 border border-border bg-card p-4 text-sm">
                <Bell className="mt-0.5 size-4 shrink-0 text-gold" />
                <div className="flex-1">
                  <p className="font-medium">{n.title}</p>
                  {n.body && <p className="text-muted-foreground">{n.body}</p>}
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(n.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
