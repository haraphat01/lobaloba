import { Check, Circle, Package, X } from "lucide-react";
import { FabricImage } from "@/components/shared/fabric-image";
import type { OrderView } from "@/lib/data/orders";
import { formatDate, formatDateTime, formatMoney, ORDER_PROGRESS, orderStatusLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

export function OrderTimeline({ order }: { order: Pick<OrderView, "status" | "order_status_history"> }) {
  const terminal = ["cancelled", "refunded", "return_requested"].includes(order.status);
  const reachedAt = new Map(order.order_status_history.map((h) => [h.status, h.created_at]));
  const currentIndex = ORDER_PROGRESS.indexOf(order.status as (typeof ORDER_PROGRESS)[number]);
  const lastProgress = terminal
    ? Math.max(...ORDER_PROGRESS.map((s, i) => (reachedAt.has(s) ? i : -1)))
    : currentIndex;

  return (
    <div>
      <ol className="relative grid gap-0 sm:grid-cols-7">
        {ORDER_PROGRESS.map((s, i) => {
          const done = i <= lastProgress;
          const current = !terminal && i === currentIndex;
          return (
            <li key={s} className="relative flex gap-3 pb-6 sm:flex-col sm:items-center sm:pb-0 sm:text-center">
              {i < ORDER_PROGRESS.length - 1 && (
                <span aria-hidden className={cn("absolute top-7 left-3.5 h-full w-px sm:top-3.5 sm:left-1/2 sm:h-px sm:w-full", i < lastProgress ? "bg-wine" : "bg-border")} />
              )}
              <span className={cn("relative z-10 grid size-7 shrink-0 place-items-center rounded-full border-2", done ? "border-wine bg-wine text-ivory" : "border-border bg-ivory text-border", current && "ring-4 ring-gold/30")}>
                {done ? <Check className="size-3.5" /> : <Circle className="size-2" />}
              </span>
              <div className="sm:mt-3">
                <p className={cn("text-xs font-medium tracking-[0.12em] uppercase", done ? "text-ink" : "text-muted-foreground")}>{orderStatusLabel(s)}</p>
                {reachedAt.get(s) && <p className="mt-0.5 text-[0.7rem] text-muted-foreground">{formatDate(reachedAt.get(s))}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      {terminal && (
        <p className="mt-6 flex items-center gap-2 border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <X className="size-4 text-destructive" /> This order is <strong>{orderStatusLabel(order.status)}</strong>.
        </p>
      )}
    </div>
  );
}

export function OrderSummary({ order }: { order: OrderView }) {
  const address = order.shipping_address as { address_line?: string; city?: string; state?: string; country?: string };
  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <h2 className="flex items-center gap-2 font-serif text-2xl">
          <Package className="size-5 text-gold" /> Items
        </h2>
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {order.order_items.map((i) => (
            <li key={i.id} className="flex gap-4 py-4">
              <div className="relative h-20 w-16 shrink-0 bg-cream">
                <FabricImage src={i.image_url} alt={i.product_name} fill sizes="64px" className="object-cover" />
              </div>
              <div className="flex-1 text-sm">
                <p className="font-serif text-lg">{i.product_name}</p>
                <p className="text-muted-foreground">
                  {i.variant_name} · {i.unit_label} × {i.quantity}
                </p>
                <p className="text-muted-foreground">{formatMoney(i.unit_price, order.currency)} each</p>
              </div>
              <p className="text-sm font-medium">{formatMoney(i.line_total, order.currency)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
          <Row label="Subtotal" value={formatMoney(order.subtotal, order.currency)} />
          {Number(order.discount_total) > 0 && <Row label={`Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}`} value={`−${formatMoney(order.discount_total, order.currency)}`} />}
          <Row label={`Delivery${order.shipping_method ? ` · ${order.shipping_method}` : ""}`} value={order.shipping_requires_quote ? "To be quoted" : formatMoney(order.shipping_total, order.currency)} />
          <Row label="Total" value={formatMoney(order.total, order.currency)} strong />
        </div>
      </div>
      <dl className="h-fit space-y-5 border border-border bg-card p-6 text-sm">
        <Info label="Order">
          {order.order_number}
          <br />
          Placed {formatDateTime(order.created_at)}
        </Info>
        <Info label="Payment">{order.payment_status === "paid" ? `Paid ${formatDateTime(order.paid_at)}` : order.payment_status === "refunded" ? "Refunded" : "Awaiting payment"}</Info>
        <Info label="Delivery to">
          {order.full_name}
          <br />
          {[address.address_line, address.city, address.state, address.country].filter(Boolean).join(", ")}
        </Info>
        {order.tracking_number && (
          <Info label="Tracking">
            {order.carrier} {order.tracking_number}
            {order.tracking_url && (
              <>
                <br />
                <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-wine underline">
                  Track shipment
                </a>
              </>
            )}
          </Info>
        )}
      </dl>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-4", strong && "border-t border-border pt-2 font-serif text-xl")}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[0.68rem] font-medium tracking-[0.18em] text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 leading-6">{children}</dd>
    </div>
  );
}
