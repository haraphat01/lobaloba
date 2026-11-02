"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BagLineItem, BagSkeleton, SummaryRow, useBagDetails } from "@/components/store/bag-contents";
import { formatMoney } from "@/lib/format";

export function BagPage() {
  const { details, loading, lines } = useBagDetails();
  const hasIssues = details?.lines.some((l) => l.issue === "out_of_stock" || l.issue === "unavailable");

  if (!loading && lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <ShoppingBag className="size-12 text-gold" strokeWidth={1.2} />
        <p className="font-serif text-3xl">Your bag is empty</p>
        <Button asChild className="mt-4 h-12 rounded-sm px-8 text-xs tracking-[0.14em] uppercase">
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
      <div>{loading && !details ? <BagSkeleton /> : <ul className="divide-y divide-border border-y border-border">{details?.lines.map((l) => <BagLineItem key={l.variantId} line={l} />)}</ul>}</div>
      {details && (
      <aside className="h-fit space-y-3 rounded-sm border border-border border-t-2 border-t-wine bg-card p-5 sm:p-6 lg:sticky lg:top-36">
        <h2 className="font-serif text-2xl text-wine">Your summary</h2>
          <SummaryRow label="Subtotal" value={formatMoney(details.subtotal, details.currency)} />
          <SummaryRow label="Shipping estimate" value={details.shippingFrom !== null ? `from ${formatMoney(details.shippingFrom, details.currency)}` : "At checkout"} />
          <SummaryRow label="Estimated total" value={formatMoney(details.subtotal + (details.shippingFrom ?? 0), details.currency)} strong className="border-t border-border pt-3" />
          <p className="text-xs text-muted-foreground">Delivery fee depends on your location and is confirmed at checkout. Discount codes can be applied at checkout.</p>
          {hasIssues && <p className="text-sm text-destructive">Please remove unavailable items before checking out.</p>}
          <Button asChild={!hasIssues} disabled={hasIssues} size="lg" className="h-12 w-full rounded-sm text-xs tracking-[0.14em] uppercase">
            {hasIssues ? <span>Proceed to checkout</span> : <Link href="/checkout">Proceed to checkout</Link>}
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11 w-full rounded-sm text-xs tracking-[0.14em] uppercase">
            <Link href="/shop">Continue shopping</Link>
          </Button>
        </aside>
      )}
    </div>
  );
}
