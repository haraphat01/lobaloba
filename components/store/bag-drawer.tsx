"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useStore } from "@/components/store/store-provider";
import { BagLineItem, BagSkeleton, SummaryRow, useBagDetails } from "@/components/store/bag-contents";
import { formatMoney } from "@/lib/format";

export function BagDrawer() {
  const { bagOpen, setBagOpen, bagCount } = useStore();
  const { details, loading, lines } = useBagDetails();
  const close = () => setBagOpen(false);
  const hasIssues = details?.lines.some((l) => l.issue === "out_of_stock" || l.issue === "unavailable");

  return (
    <Sheet open={bagOpen} onOpenChange={setBagOpen}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 bg-background p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle className="font-serif text-2xl font-normal text-wine">
            Your bag <span className="text-base text-muted-foreground">({bagCount})</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
              <ShoppingBag className="size-10 text-gold" strokeWidth={1.2} />
              <p className="font-serif text-2xl">Your bag is empty</p>
              <p className="max-w-xs text-sm text-muted-foreground">Discover luxury laces, crystal fabrics and accessories for your next celebration.</p>
              <Button asChild className="mt-2 rounded-none px-8 tracking-widest uppercase" size="lg" onClick={close}>
                <Link href="/shop">Continue shopping</Link>
              </Button>
            </div>
          ) : loading && !details ? (
            <BagSkeleton />
          ) : (
            <ul className="divide-y divide-border">
              {details?.lines.map((line) => <BagLineItem key={line.variantId} line={line} compact onNavigate={close} />)}
            </ul>
          )}
        </div>

        {lines.length > 0 && details && (
          <SheetFooter className="gap-3 border-t border-border bg-card px-6 py-5">
            <SummaryRow label="Subtotal" value={formatMoney(details.subtotal, details.currency)} />
            <SummaryRow
              label="Shipping"
              value={details.shippingFrom !== null ? `from ${formatMoney(details.shippingFrom, details.currency)}` : "Calculated at checkout"}
            />
            <p className="text-xs text-muted-foreground">Final delivery fee is calculated at checkout based on your location.</p>
            <Button asChild size="lg" className="h-12 rounded-none tracking-[0.2em] uppercase" disabled={hasIssues}>
              <Link href={hasIssues ? "/bag" : "/checkout"} onClick={close}>
                {hasIssues ? "Review bag" : "Checkout"}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 rounded-none tracking-[0.2em] uppercase">
              <Link href="/bag" onClick={close}>
                View bag
              </Link>
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
