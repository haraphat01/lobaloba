"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Panel, adminInput } from "@/components/admin/ui";
import { useAdminAction } from "@/components/admin/use-action";
import { deleteShippingZone, saveShippingZone } from "@/app/actions/admin-content";

type Rate = { id?: string; name: string; description: string; fee: string; freeOver: string; minDays: string; maxDays: string; isActive: boolean };
type Zone = { id?: string; name: string; description: string; zoneType: "domestic" | "international" | "pickup"; countries: string; states: string; requiresQuote: boolean; sortOrder: number; isActive: boolean; rates: Rate[] };

function ZoneCard({ zone }: { zone: Zone }) {
  const [z, setZ] = useState(zone);
  const { pending, run } = useAdminAction();
  const updRate = (i: number, patch: Partial<Rate>) => setZ({ ...z, rates: z.rates.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

  return (
    <Panel title={z.name || "New zone"}>
      <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1">Zone name<input className={adminInput} value={z.name} onChange={(e) => setZ({ ...z, name: e.target.value })} /></label>
        <label className="grid gap-1">Type
          <select className={adminInput} value={z.zoneType} onChange={(e) => setZ({ ...z, zoneType: e.target.value as Zone["zoneType"] })}>
            <option value="domestic">Domestic delivery</option>
            <option value="international">International</option>
            <option value="pickup">Store pickup</option>
          </select>
        </label>
        <label className="grid gap-1">Countries (comma separated, blank = any)<input className={adminInput} value={z.countries} onChange={(e) => setZ({ ...z, countries: e.target.value })} /></label>
        <label className="grid gap-1">States (comma separated, blank = all)<input className={adminInput} value={z.states} onChange={(e) => setZ({ ...z, states: e.target.value })} /></label>
        <label className="grid gap-1 sm:col-span-2">Description<input className={adminInput} value={z.description} onChange={(e) => setZ({ ...z, description: e.target.value })} /></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={z.requiresQuote} onChange={(e) => setZ({ ...z, requiresQuote: e.target.checked })} /> Manual shipping quote (fee charged later)</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={z.isActive} onChange={(e) => setZ({ ...z, isActive: e.target.checked })} /> Active</label>
      </div>
      <p className="mt-4 mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">Rates</p>
      <div className="space-y-2">
        {z.rates.map((r, i) => (
          <div key={r.id ?? i} className="grid gap-2 rounded-sm border border-border p-2 text-sm sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto_auto]">
            <input className={adminInput} placeholder="Rate name" value={r.name} onChange={(e) => updRate(i, { name: e.target.value })} aria-label="Rate name" />
            <input className={adminInput} placeholder="Fee ₦" inputMode="decimal" value={r.fee} onChange={(e) => updRate(i, { fee: e.target.value })} aria-label="Fee" />
            <input className={adminInput} placeholder="Free over ₦" inputMode="decimal" value={r.freeOver} onChange={(e) => updRate(i, { freeOver: e.target.value })} aria-label="Free over" />
            <input className={adminInput} placeholder="Min days" inputMode="numeric" value={r.minDays} onChange={(e) => updRate(i, { minDays: e.target.value })} aria-label="Minimum days" />
            <input className={adminInput} placeholder="Max days" inputMode="numeric" value={r.maxDays} onChange={(e) => updRate(i, { maxDays: e.target.value })} aria-label="Maximum days" />
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={r.isActive} onChange={(e) => updRate(i, { isActive: e.target.checked })} /> On</label>
            <button type="button" aria-label="Remove rate" onClick={() => setZ({ ...z, rates: z.rates.filter((_, j) => j !== i) })} className="p-1 text-destructive"><Trash2 className="size-4" /></button>
            <input className={`${adminInput} sm:col-span-7`} placeholder="Description shown at checkout" value={r.description} onChange={(e) => updRate(i, { description: e.target.value })} aria-label="Rate description" />
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        <button type="button" onClick={() => setZ({ ...z, rates: [...z.rates, { name: "", description: "", fee: "0", freeOver: "", minDays: "", maxDays: "", isActive: true }] })} className="text-wine underline">Add rate</button>
        <button type="button" disabled={pending} onClick={() => run(() => saveShippingZone({ ...z, countries: list(z.countries), states: list(z.states) }))} className="h-8 rounded-sm bg-wine px-4 text-ivory uppercase tracking-wider">Save zone</button>
        {z.id && <button type="button" disabled={pending} onClick={() => run(() => deleteShippingZone(z.id!))} className="text-destructive underline">Delete zone</button>}
      </div>
    </Panel>
  );
}

export function ShippingManager({ zones }: { zones: Zone[] }) {
  const [extra, setExtra] = useState(0);
  return (
    <div className="space-y-6">
      {zones.map((z) => <ZoneCard key={z.id} zone={z} />)}
      {Array.from({ length: extra }, (_, i) => (
        <ZoneCard key={`new-${i}`} zone={{ name: "", description: "", zoneType: "domestic", countries: "Nigeria", states: "", requiresQuote: false, sortOrder: zones.length + i + 1, isActive: true, rates: [] }} />
      ))}
      <button type="button" onClick={() => setExtra((n) => n + 1)} className="inline-flex h-9 items-center gap-2 rounded-sm border border-border bg-card px-4 text-xs tracking-wider uppercase">
        <Plus className="size-4" /> Add zone
      </button>
    </div>
  );
}
