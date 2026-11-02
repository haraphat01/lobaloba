import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/account/status-badge";
import { QuoteResponse } from "@/components/store/quote-response";
import { PayOrderButton } from "@/components/store/pay-order-button";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Your quotation", robots: { index: false } };

export default function QuotePage({ params }: PageProps<"/quotes/[token]">) {
  return (
    <div className="container-x max-w-4xl py-14">
      <Suspense fallback={<Skeleton className="h-96 rounded-none" />}>
        <Quote params={params} />
      </Suspense>
    </div>
  );
}

async function Quote({ params }: Pick<PageProps<"/quotes/[token]">, "params">) {
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();
  const supabase = createAdminClient();
  const { data: q } = await supabase
    .from("quotation_requests")
    .select("*, quotation_items(id, description, colour, quantity, unit_price, line_total, sort_order), orders:order_id(order_number, access_token, payment_status)")
    .eq("access_token", token)
    .maybeSingle();
  if (!q) notFound();
  const items = [...q.quotation_items].sort((a, b) => a.sort_order - b.sort_order);
  const issued = ["quoted", "accepted", "declined", "expired", "converted"].includes(q.status);
  const order = q.orders as unknown as { order_number: string; access_token: string; payment_status: string } | null;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{q.request_type === "asoebi" ? "Asoebi quotation" : "Wholesale quotation"}</p>
          <h1 className="mt-3 text-5xl">{q.reference}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Requested {formatDate(q.created_at)} by {q.full_name}</p>
        </div>
        <StatusBadge status={q.status} kind="other" />
      </div>

      {!issued && <p className="bg-cream p-5 text-sm">Thank you — our team is preparing your quotation. You&apos;ll receive an email as soon as it&apos;s ready.</p>}

      <dl className="grid gap-4 text-sm sm:grid-cols-3">
        {[
          ["Event", [q.event_type, q.event_date && formatDate(q.event_date)].filter(Boolean).join(" · ")],
          ["Guests", q.guest_count],
          ["Preferred colours", q.preferred_colours],
          ["Category", q.preferred_category],
          ["Quantity", q.required_quantity],
          ["Delivery", q.delivery_location],
        ]
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k as string} className="border border-border bg-card p-4">
              <dt className="text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase">{k}</dt>
              <dd className="mt-1">{v}</dd>
            </div>
          ))}
      </dl>

      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase">
                <th className="py-3">Item</th>
                <th>Colour</th>
                <th className="text-right">Qty</th>
                {issued && <th className="text-right">Unit price</th>}
                {issued && <th className="text-right">Total</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-b border-border/70">
                  <td className="py-3">{i.description}</td>
                  <td>{i.colour}</td>
                  <td className="text-right">{i.quantity}</td>
                  {issued && <td className="text-right">{formatMoney(i.unit_price, q.currency)}</td>}
                  {issued && <td className="text-right">{formatMoney(i.line_total ?? 0, q.currency)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {issued && (
        <div className="ml-auto max-w-xs space-y-1.5 text-sm">
          <Row label="Subtotal" value={formatMoney(q.subtotal, q.currency)} />
          {Number(q.discount_amount) > 0 && <Row label="Discount" value={`−${formatMoney(q.discount_amount, q.currency)}`} />}
          <Row label="Delivery" value={formatMoney(q.delivery_fee, q.currency)} />
          <div className="flex justify-between border-t border-border pt-2 font-serif text-2xl">
            <span>Total</span>
            <span>{formatMoney(q.total, q.currency)}</span>
          </div>
          {q.valid_until && <p className="pt-2 text-xs text-muted-foreground">Valid until {formatDate(q.valid_until)}</p>}
        </div>
      )}

      {q.quote_message && issued && <p className="border-l-2 border-gold pl-4 leading-7 text-charcoal">{q.quote_message}</p>}

      {q.status === "quoted" && <QuoteResponse token={token} />}
      {q.status === "accepted" && !order && <p className="bg-cream p-5 text-sm">Thank you for accepting. We&apos;re preparing your order and will email you a secure payment link shortly.</p>}
      {order && (
        <div className="flex flex-wrap items-center justify-between gap-4 border border-border bg-card p-6">
          <p className="text-sm">
            Order <strong>{order.order_number}</strong> {order.payment_status === "paid" ? "has been paid. Thank you!" : "is ready for payment."}
          </p>
          {order.payment_status !== "paid" && <PayOrderButton orderNumber={order.order_number} token={order.access_token} label="Pay securely" />}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
