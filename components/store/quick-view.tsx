"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { FabricImage } from "@/components/shared/fabric-image";
import { PurchasePanel } from "@/components/store/purchase-panel";
import { getQuickView } from "@/app/actions/catalog";
import type { ProductDetail } from "@/lib/data/catalog";

export function QuickView({ slug, open, onOpenChange }: { slug: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [colourId, setColourId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || product) return;
    let cancelled = false;
    getQuickView(slug).then((p) => {
      if (cancelled) return;
      setProduct(p);
      setColourId(p?.variants.find((v) => v.stock > 0)?.colourId ?? p?.variants[0]?.colourId ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [open, slug, product]);

  const image = product ? (product.images.find((i) => i.colourId === colourId) ?? product.images[0]) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl gap-0 overflow-y-auto rounded-none bg-background p-0 sm:max-w-4xl">
        {!product ? (
          <div className="grid h-80 place-items-center">
            <DialogTitle className="sr-only">Loading product</DialogTitle>
            <Loader2 className="size-6 animate-spin text-gold" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2">
            <div className="relative aspect-[4/5] bg-cream">
              <FabricImage src={image?.url} alt={image?.alt ?? product.name} fill sizes="(min-width: 768px) 448px, 100vw" className="object-cover" />
            </div>
            <div className="flex flex-col gap-5 p-6 sm:p-8">
              <div>
                <p className="eyebrow">{product.category?.name}</p>
                <DialogTitle className="mt-2 font-serif text-3xl font-normal">{product.name}</DialogTitle>
                <DialogDescription className="mt-2 text-sm leading-6">{product.shortDescription}</DialogDescription>
              </div>
              <PurchasePanel product={product} compact onColourChange={setColourId} onAdded={() => onOpenChange(false)} />
              <Link href={`/products/${product.slug}`} onClick={() => onOpenChange(false)} className="mt-auto inline-flex items-center gap-2 text-xs tracking-[0.18em] text-wine uppercase hover:underline">
                View full details <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
