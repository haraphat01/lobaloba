"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminInput } from "@/components/admin/ui";
import { useAdminAction } from "@/components/admin/use-action";
import { deleteCoupon, saveCoupon } from "@/app/actions/admin-content";
import { formatDate, formatMoney } from "@/lib/format";

type Coupon = {
  id?: string; code: string; description: string; discountType: "percentage" | "fixed"; value: string; minOrderAmount: string; maxDiscount: string;
  productIds: string[]; categoryIds: string[]; startsAt: string; expiresAt: string; usageLimit: string; perCustomerLimit: string; isActive: boolean; usedCount?: number;
};

const blank: Coupon = { code: "", description: "", discountType: "percentage", value: "10", minOrderAmount: "0", maxDiscount: "", productIds: [], categoryIds: [], startsAt: "", expiresAt: "", usageLimit: "", perCustomerLimit: "1", isActive: true };

export function CouponManager({ coupons, products, categories }: { coupons: Coupon[]; products: { id: string; name: string }[]; categories: { id: string; name: string }[] }) {
  const [c, setC] = useState<Coupon | null>(null);
  const { pending, run } = useAdminAction();
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return (
    <>
      <button type="button" onClick={() => setC(blank)} className="mb-4 inline-flex h-9 items-center gap-2 rounded-sm bg-wine px-4 text-xs tracking-wider text-ivory uppercase">
        <Plus className="size-4" /> New discount code
      </button>
      <div className="overflow-x-auto rounded-sm border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
              <th className="px-4 py-3">Code</th><th>Discount</th><th>Applies to</th><th>Minimum</th><th>Used</th><th>Expires</th><th>Status</th><th />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {coupons.map((x) => (
              <tr key={x.id}>
                <td className="px-4 py-3 font-mono font-medium">{x.code}</td>
                <td>{x.discountType === "percentage" ? `${x.value}%` : formatMoney(Number(x.value))}</td>
                <td className="text-xs">{x.productIds.length || x.categoryIds.length ? `${x.productIds.length} products, ${x.categoryIds.length} categories` : "Whole order"}</td>
                <td>{Number(x.minOrderAmount) > 0 ? formatMoney(Number(x.minOrderAmount)) : "—"}</td>
                <td>{x.usedCount}{x.usageLimit ? ` / ${x.usageLimit}` : ""}</td>
                <td>{x.expiresAt ? formatDate(x.expiresAt) : "—"}</td>
                <td>{x.isActive ? "Active" : "Inactive"}</td>
                <td className="space-x-2 pr-3 text-right">
                  <button type="button" aria-label="Edit" onClick={() => setC(x)}><Pencil className="inline size-4 text-wine" /></button>
                  <button type="button" aria-label="Delete" disabled={pending} onClick={() => run(() => deleteCoupon(x.id!))}><Trash2 className="inline size-4 text-destructive" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {coupons.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No discount codes yet.</p>}
      </div>
      <Dialog open={!!c} onOpenChange={(o) => !o && setC(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{c?.id ? "Edit discount code" : "New discount code"}</DialogTitle></DialogHeader>
          {c && (
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <label className="grid gap-1">Code<input className={`${adminInput} font-mono uppercase`} value={c.code} onChange={(e) => setC({ ...c, code: e.target.value.toUpperCase() })} /></label>
              <label className="grid gap-1">Description<input className={adminInput} value={c.description} onChange={(e) => setC({ ...c, description: e.target.value })} /></label>
              <label className="grid gap-1">Type
                <select className={adminInput} value={c.discountType} onChange={(e) => setC({ ...c, discountType: e.target.value as Coupon["discountType"] })}>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount (₦)</option>
                </select>
              </label>
              <label className="grid gap-1">Value<input className={adminInput} inputMode="decimal" value={c.value} onChange={(e) => setC({ ...c, value: e.target.value })} /></label>
              <label className="grid gap-1">Minimum order (₦)<input className={adminInput} inputMode="decimal" value={c.minOrderAmount} onChange={(e) => setC({ ...c, minOrderAmount: e.target.value })} /></label>
              <label className="grid gap-1">Maximum discount (₦, optional)<input className={adminInput} inputMode="decimal" value={c.maxDiscount} onChange={(e) => setC({ ...c, maxDiscount: e.target.value })} /></label>
              <label className="grid gap-1">Starts<input type="datetime-local" className={adminInput} value={c.startsAt} onChange={(e) => setC({ ...c, startsAt: e.target.value })} /></label>
              <label className="grid gap-1">Expires<input type="datetime-local" className={adminInput} value={c.expiresAt} onChange={(e) => setC({ ...c, expiresAt: e.target.value })} /></label>
              <label className="grid gap-1">Total usage limit<input className={adminInput} inputMode="numeric" value={c.usageLimit} onChange={(e) => setC({ ...c, usageLimit: e.target.value })} /></label>
              <label className="grid gap-1">Uses per customer<input className={adminInput} inputMode="numeric" value={c.perCustomerLimit} onChange={(e) => setC({ ...c, perCustomerLimit: e.target.value })} /></label>
              <div className="sm:col-span-2">
                <p className="mb-1 font-medium">Restrict to categories (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((x) => (
                    <label key={x.id} className="flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-xs">
                      <input type="checkbox" checked={c.categoryIds.includes(x.id)} onChange={() => setC({ ...c, categoryIds: toggle(c.categoryIds, x.id) })} /> {x.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <p className="mb-1 font-medium">Restrict to products (optional)</p>
                <div className="max-h-40 overflow-y-auto rounded-sm border border-border p-2">
                  {products.map((x) => (
                    <label key={x.id} className="flex items-center gap-2 py-0.5 text-xs">
                      <input type="checkbox" checked={c.productIds.includes(x.id)} onChange={() => setC({ ...c, productIds: toggle(c.productIds, x.id) })} /> {x.name}
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={c.isActive} onChange={(e) => setC({ ...c, isActive: e.target.checked })} /> Active</label>
              <button type="button" disabled={pending} onClick={() => run(() => saveCoupon(c), () => setC(null))} className="h-10 rounded-sm bg-wine text-xs tracking-wider text-ivory uppercase sm:col-span-2">Save discount code</button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
