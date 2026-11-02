"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Panel, adminInput } from "@/components/admin/ui";
import { useAdminAction } from "@/components/admin/use-action";
import { convertQuotationToOrder, saveQuotation, sendQuotation, setQuotationStatus } from "@/app/actions/admin-orders";
import { formatMoney } from "@/lib/format";

type Item = { productId: string; description: string; colour: string; quantity: string; unitPrice: string };
type Quote = { id: string; status: string; currency: string; items: Item[]; discount: string; deliveryFee: string; validUntil: string; message: string; adminNotes: string; accessToken: string };

export function QuotationEditor({ quote, products, order }: { quote: Quote; products: { id: string; name: string; price: number }[]; order: { id: string; order_number: string; payment_status: string } | null }) {
  const [q, setQ] = useState(quote);
  const { pending, run } = useAdminAction();
  const subtotal = q.items.reduce((s, i) => s + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 0), 0);
  const discount = Math.min(Number(q.discount) || 0, subtotal);
  const total = subtotal - discount + (Number(q.deliveryFee) || 0);
  const locked = ["converted"].includes(q.status);
  const upd = (i: number, patch: Partial<Item>) => setQ({ ...q, items: q.items.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const payload = () => ({ id: q.id, items: q.items.map((i) => ({ ...i, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })), discount: Number(q.discount) || 0, deliveryFee: Number(q.deliveryFee) || 0, validUntil: q.validUntil, message: q.message, adminNotes: q.adminNotes });

  return (
    <div className="space-y-6">
      <Panel
        title="Quoted items"
        actions={
          !locked && (
            <button type="button" onClick={() => setQ({ ...q, items: [...q.items, { productId: "", description: "", colour: "", quantity: "1", unitPrice: "0" }] })} className="inline-flex items-center gap-1 text-xs text-wine underline">
              <Plus className="size-3" /> Add item
            </button>
          )
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="pb-2">Catalogue product</th>
                <th className="pb-2">Description</th>
                <th className="pb-2">Colour</th>
                <th className="pb-2 w-20">Qty</th>
                <th className="pb-2 w-32">Unit price</th>
                <th className="pb-2 text-right">Line</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {q.items.map((i, idx) => (
                <tr key={idx}>
                  <td className="pr-2 pb-2">
                    <select
                      className={adminInput}
                      value={i.productId}
                      disabled={locked}
                      onChange={(e) => {
                        const p = products.find((x) => x.id === e.target.value);
                        upd(idx, { productId: e.target.value, description: p?.name ?? i.description, unitPrice: p && i.unitPrice === "0" ? String(p.price) : i.unitPrice });
                      }}
                    >
                      <option value="">Custom item</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="pr-2 pb-2"><input className={adminInput} disabled={locked} value={i.description} onChange={(e) => upd(idx, { description: e.target.value })} /></td>
                  <td className="pr-2 pb-2"><input className={adminInput} disabled={locked} value={i.colour} onChange={(e) => upd(idx, { colour: e.target.value })} /></td>
                  <td className="pr-2 pb-2"><input className={adminInput} disabled={locked} inputMode="numeric" value={i.quantity} onChange={(e) => upd(idx, { quantity: e.target.value.replace(/\D/g, "") })} /></td>
                  <td className="pr-2 pb-2"><input className={adminInput} disabled={locked} inputMode="decimal" value={i.unitPrice} onChange={(e) => upd(idx, { unitPrice: e.target.value })} /></td>
                  <td className="pb-2 text-right">{formatMoney((Number(i.unitPrice) || 0) * (Number(i.quantity) || 0), q.currency)}</td>
                  <td className="pb-2">
                    {!locked && (
                      <button type="button" aria-label="Remove item" onClick={() => setQ({ ...q, items: q.items.filter((_, j) => j !== idx) })} className="p-2 text-muted-foreground hover:text-destructive">
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1 text-sm">Discount<input className={adminInput} disabled={locked} inputMode="decimal" value={q.discount} onChange={(e) => setQ({ ...q, discount: e.target.value })} /></label>
          <label className="grid gap-1 text-sm">Delivery charge<input className={adminInput} disabled={locked} inputMode="decimal" value={q.deliveryFee} onChange={(e) => setQ({ ...q, deliveryFee: e.target.value })} /></label>
          <label className="grid gap-1 text-sm">Valid until<input type="date" className={adminInput} disabled={locked} value={q.validUntil} onChange={(e) => setQ({ ...q, validUntil: e.target.value })} /></label>
        </div>
        <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span>{formatMoney(subtotal, q.currency)}</div>
          <div className="flex justify-between"><span className="text-muted-foreground">Discount</span>−{formatMoney(discount, q.currency)}</div>
          <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span>{formatMoney(Number(q.deliveryFee) || 0, q.currency)}</div>
          <div className="flex justify-between border-t border-border pt-1 font-semibold"><span>Total</span>{formatMoney(total, q.currency)}</div>
        </div>
      </Panel>

      <Panel title="Message & notes">
        <label className="grid gap-1 text-sm">Message to customer<textarea className={adminInput} rows={3} disabled={locked} value={q.message} onChange={(e) => setQ({ ...q, message: e.target.value })} /></label>
        <label className="mt-3 grid gap-1 text-sm">Internal notes<textarea className={adminInput} rows={2} value={q.adminNotes} onChange={(e) => setQ({ ...q, adminNotes: e.target.value })} /></label>
      </Panel>

      <Panel title="Actions">
        <div className="flex flex-wrap gap-2 text-xs">
          <button type="button" disabled={pending} onClick={() => run(() => saveQuotation({ ...payload(), status: q.status === "new" ? "reviewing" : undefined }))} className="h-9 rounded-sm border border-border bg-background px-4 uppercase tracking-wider">Save</button>
          {!locked && (
            <button type="button" disabled={pending} onClick={() => run(async () => { const s = await saveQuotation(payload()); return s.ok ? sendQuotation(q.id) : s; }, () => setQ({ ...q, status: "quoted" }))} className="h-9 rounded-sm bg-wine px-4 text-onyx uppercase tracking-wider">
              {q.status === "quoted" ? "Re-send quotation" : "Send quotation"}
            </button>
          )}
          {q.status === "quoted" && (
            <>
              <button type="button" disabled={pending} onClick={() => run(() => setQuotationStatus(q.id, "accepted"), () => setQ({ ...q, status: "accepted" }))} className="h-9 rounded-sm border border-border bg-background px-4 uppercase tracking-wider">Mark accepted</button>
              <button type="button" disabled={pending} onClick={() => run(() => setQuotationStatus(q.id, "declined"), () => setQ({ ...q, status: "declined" }))} className="h-9 rounded-sm border border-border bg-background px-4 uppercase tracking-wider">Mark declined</button>
              <button type="button" disabled={pending} onClick={() => run(() => setQuotationStatus(q.id, "expired"), () => setQ({ ...q, status: "expired" }))} className="h-9 rounded-sm border border-border bg-background px-4 uppercase tracking-wider">Mark expired</button>
            </>
          )}
          {q.status === "accepted" && !order && (
            <button type="button" disabled={pending} onClick={() => run(() => convertQuotationToOrder(q.id), () => setQ({ ...q, status: "converted" }))} className="h-9 rounded-sm bg-emerald-600 px-4 text-white uppercase tracking-wider">
              Convert to order & send payment link
            </button>
          )}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Customer link: <Link href={`/quotes/${q.accessToken}`} target="_blank" className="text-wine underline">/quotes/{q.accessToken.slice(0, 8)}…</Link>
        </p>
        {order && (
          <p className="mt-2 text-sm">
            Order <Link href={`/admin/orders/${order.id}`} className="text-wine underline">{order.order_number}</Link> · payment {order.payment_status}
          </p>
        )}
      </Panel>
    </div>
  );
}
