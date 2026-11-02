"use client";

import { useEffect, useState } from "react";
import { getRecentlyViewed } from "@/app/actions/catalog";
import { ProductGrid } from "@/components/store/product-card";
import type { ProductCardData } from "@/lib/data/catalog";

export function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  useEffect(() => {
    let ids: string[] = [];
    try {
      ids = (JSON.parse(localStorage.getItem("lobaloba.recently-viewed") ?? "[]") as string[]).filter((id) => id !== excludeId).slice(0, 4);
    } catch {
      ids = [];
    }
    if (ids.length) getRecentlyViewed(ids).then(setProducts);
  }, [excludeId]);

  if (!products.length) return null;
  return (
    <section className="container-x border-t border-border py-16">
      <h2 className="mb-10 text-4xl">Recently viewed</h2>
      <ProductGrid products={products} />
    </section>
  );
}
