"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, Minus, Plus, Trash2 } from "lucide-react";
import { getBagDetails } from "@/app/actions/cart";
import { useStore } from "@/components/store/store-provider";
import { FabricImage } from "@/components/shared/fabric-image";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import type { PricedLine } from "@/lib/pricing";
import { cn } from "@/lib/utils";

type Details = Awaited<ReturnType<typeof getBagDetails>>;

/** Fetches server-verified prices and stock for the current bag. */
export function useBagDetails() {
  const { lines, ready } = useStore();
  const [state, setState] = useState<{ key: string; details: Details } | null>(null);
  const key = JSON.stringify(lines);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getBagDetails(JSON.parse(key))
      .catch(() => ({ lines: [], subtotal: 0, currency: "NGN", shippingFrom: null }) as Details)
      .then((details) => !cancelled && setState({ key, details }));
    return () => {
      cancelled = true;
    };
  }, [key, ready]);

  return { details: state?.details ?? null, loading: !ready || state?.key !== key, lines };
}

export function BagLineItem({ line, compact = false, onNavigate }: { line: PricedLine; compact?: boolean; onNavigate?: () => void }) {
  const { setQuantity, removeFromBag, replaceVariant } = useStore();
  const max = Math.min(line.available, line.maxQuantity ?? Infinity);

  return (
    <li className="flex gap-4 py-5">
      <Link href={`/products/${line.productSlug}`} onClick={onNavigate} className="relative h-28 w-22 shrink-0 overflow-hidden bg-cream">
        <FabricImage src={line.imageUrl} alt={`${line.productName} — ${line.variantName}`} fill sizes="88px" className="object-cover" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/products/${line.productSlug}`} onClick={onNavigate} className="font-serif text-lg leading-tight hover:text-wine">
              {line.productName}
            </Link>
            {line.otherVariants.length > 1 && !compact ? (
              <select
                aria-label={`Change option for ${line.productName}`}
                value={line.variantId}
                onChange={(e) => replaceVariant(line.variantId, e.target.value)}
                className="mt-1 block rounded-none border border-border bg-transparent px-2 py-1 text-xs"
              >
                {line.otherVariants.map((v) => (
                  <option key={v.id} value={v.id} disabled={v.available <= 0 && v.id !== line.variantId}>
                    {v.name}
                    {v.available <= 0 ? " — out of stock" : ""}
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-0.5 text-xs text-muted-foreground">{line.variantName}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {formatMoney(line.unitPrice, line.currency)} · {line.unitLabel}
            </p>
          </div>
          <p className="text-sm font-medium whitespace-nowrap">{formatMoney(line.lineTotal, line.currency)}</p>
        </div>

        {line.issue && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="size-3.5" />
            {line.issue === "out_of_stock" && "This option is out of stock — please remove it."}
            {line.issue === "unavailable" && "This item is no longer available."}
            {line.issue === "insufficient_stock" && `Only ${line.available} available — quantity adjusted.`}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="inline-flex items-center border border-border">
            <button
              type="button"
              aria-label="Decrease quantity"
              className="p-2 hover:bg-cream disabled:opacity-40"
              disabled={line.requestedQuantity <= 1}
              onClick={() => setQuantity(line.variantId, line.requestedQuantity - 1)}
            >
              <Minus className="size-3" />
            </button>
            <span className="w-9 text-center text-sm tabular-nums">{line.requestedQuantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              className="p-2 hover:bg-cream disabled:opacity-40"
              disabled={line.requestedQuantity >= max}
              onClick={() => setQuantity(line.variantId, line.requestedQuantity + 1)}
            >
              <Plus className="size-3" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => removeFromBag(line.variantId)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" /> Remove
          </button>
        </div>
      </div>
    </li>
  );
}

export function BagSkeleton() {
  return (
    <ul className="divide-y divide-border">
      {[0, 1].map((i) => (
        <li key={i} className="flex gap-4 py-5">
          <Skeleton className="h-28 w-22 rounded-none" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SummaryRow({ label, value, strong, className }: { label: string; value: string; strong?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between text-sm", strong && "font-serif text-xl", className)}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
