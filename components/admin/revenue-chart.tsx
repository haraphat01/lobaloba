"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";

type Point = { bucket: string; revenue: number; orders: number };

const BAR = "#b08a3e"; // validated against the dark card surface (lightness band + 3:1 contrast)

function label(bucket: string, unit: string) {
  const d = new Date(bucket);
  const opts: Intl.DateTimeFormatOptions =
    unit === "hour" ? { hour: "numeric" } : unit === "month" ? { month: "short", year: "2-digit" } : { day: "numeric", month: "short" };
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", ...opts }).format(d);
}

/** Single-series revenue bars with per-bar hover/focus tooltips and a table view. */
export function RevenueChart({ data, unit, currency = "NGN" }: { data: Point[]; unit: string; currency?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const nice = Math.pow(10, Math.floor(Math.log10(max)));
  const top = Math.ceil(max / nice) * nice;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * top);
  const H = 220;

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button type="button" onClick={() => setTable((t) => !t)} className="text-xs text-wine underline underline-offset-2">
          {table ? "Show chart" : "Show table"}
        </button>
      </div>
      {data.length === 0 ? (
        <p className="grid h-56 place-items-center text-sm text-muted-foreground">No paid orders in this period.</p>
      ) : table ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2">Period</th>
              <th className="text-right">Orders</th>
              <th className="text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.bucket} className="border-b border-border/60">
                <td className="py-1.5">{label(d.bucket, unit)}</td>
                <td className="text-right">{d.orders}</td>
                <td className="text-right">{formatMoney(d.revenue, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative flex gap-3">
          <div className="relative w-16 shrink-0 text-right text-[0.65rem] text-muted-foreground" style={{ height: H }}>
            {ticks.map((t) => (
              <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: H - (t / top) * H }}>
                {t >= 1_000_000 ? `₦${(t / 1_000_000).toFixed(1)}m` : t >= 1000 ? `₦${Math.round(t / 1000)}k` : `₦${t}`}
              </span>
            ))}
          </div>
          <div className="relative flex-1">
            <div className="absolute inset-x-0 top-0" style={{ height: H }}>
              {ticks.map((t) => (
                <div key={t} className="absolute inset-x-0 border-t border-border/60" style={{ top: H - (t / top) * H }} />
              ))}
            </div>
            <div className="relative flex items-end gap-[2px]" style={{ height: H }} role="list" aria-label="Revenue by period">
              {data.map((d, i) => (
                <button
                  key={d.bucket}
                  type="button"
                  role="listitem"
                  aria-label={`${label(d.bucket, unit)}: ${formatMoney(d.revenue, currency)} from ${d.orders} orders`}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="group relative flex h-full flex-1 items-end outline-none"
                >
                  <span
                    className="w-full rounded-t-[4px] transition-opacity group-hover:opacity-80 group-focus-visible:outline-2 group-focus-visible:outline-gold"
                    style={{ height: `${Math.max(2, (d.revenue / top) * H)}px`, background: BAR }}
                  />
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-[2px] text-[0.6rem] text-muted-foreground">
              {data.map((d, i) => (
                <span key={d.bucket} className="flex-1 truncate text-center">
                  {data.length <= 14 || i % Math.ceil(data.length / 10) === 0 ? label(d.bucket, unit) : ""}
                </span>
              ))}
            </div>
            {hover !== null && data[hover] && (
              <div
                className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-sm border border-border bg-background px-3 py-2 text-xs shadow-lg"
                style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}
              >
                <p className="font-semibold text-ink">{formatMoney(data[hover].revenue, currency)}</p>
                <p className="text-muted-foreground">
                  {label(data[hover].bucket, unit)} · {data[hover].orders} order{data[hover].orders === 1 ? "" : "s"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
