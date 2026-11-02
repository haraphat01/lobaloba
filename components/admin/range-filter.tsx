"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const PRESETS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "12m", label: "12 months" },
];

export function RangeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("range") ?? "30d";
  const [from, setFrom] = useState(params.get("from") ?? "");
  const [to, setTo] = useState(params.get("to") ?? "");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-sm border border-border bg-card p-0.5">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => router.push(`${pathname}?range=${p.key}`)}
            className={cn("rounded-sm px-3 py-1.5 text-xs", current === p.key ? "bg-wine text-ivory" : "hover:bg-cream")}
          >
            {p.label}
          </button>
        ))}
      </div>
      <form
        className="flex items-center gap-1 text-xs"
        onSubmit={(e) => {
          e.preventDefault();
          if (from && to) router.push(`${pathname}?range=custom&from=${from}&to=${to}`);
        }}
      >
        <input type="date" aria-label="From" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-sm border border-border bg-card px-2 py-1.5" />
        <span>–</span>
        <input type="date" aria-label="To" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-sm border border-border bg-card px-2 py-1.5" />
        <button type="submit" className={cn("rounded-sm border px-3 py-1.5", current === "custom" ? "border-wine bg-wine text-ivory" : "border-border bg-card")}>
          Apply
        </button>
      </form>
    </div>
  );
}
