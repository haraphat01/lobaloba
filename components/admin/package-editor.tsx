"use client";

import { useState } from "react";
import { adminInput } from "@/components/admin/ui";
import { useAdminAction } from "@/components/admin/use-action";
import { saveAsoebiPackage } from "@/app/actions/admin-orders";

type Pkg = { id: string; name: string; tagline: string; description: string; includedServices: string; price: string; priceNote: string; isQuoteBased: boolean; isActive: boolean };

export function PackageEditor({ pkg }: { pkg: Pkg }) {
  const [p, setP] = useState(pkg);
  const { pending, run } = useAdminAction();
  return (
    <div className="grid gap-2 rounded-sm border border-border p-3 text-sm">
      <input className={`${adminInput} font-medium`} value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} aria-label="Name" />
      <input className={adminInput} value={p.tagline} onChange={(e) => setP({ ...p, tagline: e.target.value })} placeholder="Tagline" aria-label="Tagline" />
      <textarea className={adminInput} rows={3} value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })} aria-label="Description" />
      <label className="grid gap-1 text-xs">Included services (one per line)
        <textarea className={adminInput} rows={5} value={p.includedServices} onChange={(e) => setP({ ...p, includedServices: e.target.value })} />
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={p.isQuoteBased} onChange={(e) => setP({ ...p, isQuoteBased: e.target.checked })} /> Quotation-based (no fixed price)
      </label>
      {!p.isQuoteBased && (
        <div className="grid grid-cols-2 gap-2">
          <input className={adminInput} inputMode="decimal" placeholder="Price from" value={p.price} onChange={(e) => setP({ ...p, price: e.target.value })} aria-label="Price" />
          <input className={adminInput} placeholder="Price note" value={p.priceNote} onChange={(e) => setP({ ...p, priceNote: e.target.value })} aria-label="Price note" />
        </div>
      )}
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={p.isActive} onChange={(e) => setP({ ...p, isActive: e.target.checked })} /> Visible on site
      </label>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => saveAsoebiPackage({ ...p, includedServices: p.includedServices.split("\n").map((s) => s.trim()).filter(Boolean) }))}
        className="h-9 rounded-sm bg-wine text-xs tracking-wider text-onyx uppercase"
      >
        Save package
      </button>
    </div>
  );
}
