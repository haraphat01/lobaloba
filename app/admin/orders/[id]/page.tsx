import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { OrderAdminControls, ReturnControls } from "@/components/admin/order-controls";
import { StatusBadge } from "@/components/account/status-badge";
import { FabricImage } from "@/components/shared/fabric-image";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime, formatMoney, orderStatusLabel } from "@/lib/format";

export default function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: Pick<PageProps<"/admin/orders/[id]">, "params">) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = createAdminClient();
  const { data: o } = await db
    .from("orders")
    .select("*, order_items(*), order_status_history(*), payments(*), return_requests(*), asoebi_events(title, slug), quotation_requests:quotation_id(reference, id)")
    .eq("id", id)
    .maybeSingle();
  if (!o) notFound();
  const a = o.shipping_address as { address_line?: string; city?: string; state?: string; country?: string };
  const history = [...o.order_status_history].sort((x, y) => x.created_at.localeCompare(y.created_at));
  const event = o.asoebi_events as unknown as { title: string; slug: string } | null;
  const quote = o.quotation_requests as unknown as { reference: string; id: string } | null;

  return (
    <>
      <AdminHeader
        title={o.order_number}
        description={`Placed ${formatDateTime(o.created_at)}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={o.status} />
            <StatusBadge status={o.payment_status} kind="other" />
          </div>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Panel title="Items">
            <ul className="divide-y divide-border/70">
              {o.order_items.map((i) => (
                <li key={i.id} className="flex gap-3 py-3 text-sm">
                  <div className="relative h-16 w-13 shrink-0 bg-cream">
                    <FabricImage src={i.image_url} alt="" fill sizes="52px" className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{i.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.variant_name} · {i.unit_label} · {formatMoney(i.unit_price, o.currency)} × {i.quantity}
                    </p>
                  </div>
                  <p>{formatMoney(i.line_total, o.currency)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-3 ml-auto max-w-xs space-y-1 text-sm">
              <Row k="Subtotal" v={formatMoney(o.subtotal, o.currency)} />
              {Number(o.discount_total) > 0 && <Row k={`Discount ${o.coupon_code ?? ""}`} v={`−${formatMoney(o.discount_total, o.currency)}`} />}
              <Row k={`Shipping (${o.shipping_method ?? "—"})`} v={o.shipping_requires_quote ? "To be quoted" : formatMoney(o.shipping_total, o.currency)} />
              <Row k="Total" v={formatMoney(o.total, o.currency)} strong />
            </dl>
          </Panel>

          <Panel title="Update status & tracking">
            <OrderAdminControls
              order={{ id: o.id, status: o.status, paymentStatus: o.payment_status, carrier: o.carrier ?? "", trackingNumber: o.tracking_number ?? "", trackingUrl: o.tracking_url ?? "", adminNotes: o.admin_notes ?? "" }}
              canRefund={admin.role === "admin"}
            />
          </Panel>

          {o.return_requests.length > 0 && (
            <Panel title="Return requests">
              <ReturnControls requests={o.return_requests.map((r) => ({ id: r.id, reason: r.reason, details: r.details, status: r.status, adminResponse: r.admin_response, createdAt: r.created_at }))} />
            </Panel>
          )}

          <Panel title="Timeline">
            <ol className="space-y-2 text-sm">
              {history.map((h) => (
                <li key={h.id} className="flex gap-3">
                  <span className="w-40 shrink-0 text-xs text-muted-foreground">{formatDateTime(h.created_at)}</span>
                  <span>
                    <strong>{orderStatusLabel(h.status)}</strong>
                    {h.note && <span className="text-muted-foreground"> — {h.note}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Customer">
            <p className="text-sm font-medium">{o.full_name}</p>
            <p className="text-sm">
              <a href={`mailto:${o.email}`} className="text-wine underline">{o.email}</a>
            </p>
            <p className="text-sm">{o.phone}</p>
            {o.user_id && (
              <Link href={`/admin/customers/${o.user_id}`} className="mt-2 inline-block text-xs text-wine underline">
                View customer
              </Link>
            )}
            <p className="mt-4 text-xs font-medium text-muted-foreground uppercase">Delivery</p>
            <p className="text-sm">{[a.address_line, a.city, a.state, a.country].filter(Boolean).join(", ") || "—"}</p>
            {o.delivery_instructions && <p className="mt-1 text-xs text-muted-foreground">“{o.delivery_instructions}”</p>}
            {event && (
              <p className="mt-3 text-xs">
                Asoebi event: <Link href={`/asoebi/events/${event.slug}`} className="text-wine underline">{event.title}</Link>
              </p>
            )}
            {quote && (
              <p className="mt-1 text-xs">
                From quotation <Link href={`/admin/quotations/${quote.id}`} className="text-wine underline">{quote.reference}</Link>
              </p>
            )}
          </Panel>
          <Panel title="Payment verification">
            {o.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payment attempts.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {o.payments.map((p) => (
                  <li key={p.id} className="rounded-sm border border-border p-3">
                    <p className="font-mono text-xs">{p.reference}</p>
                    <p className="mt-1">
                      <StatusBadge status={p.status === "success" ? "paid" : p.status} kind="other" /> {formatMoney(p.amount, p.currency)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.channel ?? "—"}
                      {p.card_brand ? ` · ${p.card_brand} ••${p.card_last4}` : ""} · verified via {p.verified_via ?? "—"}
                    </p>
                    {p.paid_at && <p className="text-xs text-muted-foreground">Paid {formatDateTime(p.paid_at)}</p>}
                    {p.gateway_response && <p className="text-xs text-muted-foreground">Gateway: {p.gateway_response}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "border-t border-border pt-1 font-semibold" : ""}`}>
      <dt className={strong ? "" : "text-muted-foreground"}>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
