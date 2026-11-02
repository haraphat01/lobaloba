"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getDefaultVariant, getWishlistProducts } from "@/app/actions/cart";
import { useStore } from "@/components/store/store-provider";
import { FabricImage } from "@/components/shared/fabric-image";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductCardData } from "@/lib/data/catalog";
import { formatMoney, unitShort } from "@/lib/format";

export function WishlistView() {
  const { wishlist, ready, toggleWishlist, addToBag, signedIn } = useStore();
  const [products, setProducts] = useState<ProductCardData[] | null>(null);
  const key = wishlist.join(",");

  useEffect(() => {
    if (!ready) return;
    getWishlistProducts(key ? key.split(",") : []).then(setProducts);
  }, [key, ready]);

  async function moveToBag(p: ProductCardData) {
    const variant = await getDefaultVariant(p.id);
    if (!variant) {
      toast.error(`${p.name} is out of stock`);
      return;
    }
    addToBag(variant.id, 1, `${p.name} (${variant.name})`);
    toggleWishlist(p.id, p.name);
  }

  if (!products) {
    return (
      <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-none" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <Heart className="size-12 text-gold" strokeWidth={1.2} />
        <p className="font-serif text-3xl">Your wishlist is empty</p>
        <p className="text-sm text-muted-foreground">Tap the heart on any piece to save it for later.</p>
        <Link href="/shop" className="mt-4 bg-wine px-8 py-4 text-xs tracking-[0.22em] text-onyx uppercase">
          Discover fabrics
        </Link>
      </div>
    );
  }

  return (
    <>
      {!signedIn && (
        <p className="mt-4 text-sm text-muted-foreground">
          <Link href="/account/login?next=/wishlist" className="text-wine underline">
            Sign in
          </Link>{" "}
          to save your wishlist across devices.
        </p>
      )}
      <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => (
          <li key={p.id}>
            <Link href={`/products/${p.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-cream">
              <FabricImage src={p.images[0]?.url} alt={p.name} fill sizes="25vw" className="object-cover" />
            </Link>
            <p className="mt-3 font-serif text-xl">{p.name}</p>
            <p className="text-sm">
              {formatMoney(p.price, p.currency)} <span className="text-xs text-muted-foreground">{unitShort(p.purchaseUnit, p.unitLabel)}</span>
            </p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => moveToBag(p)} disabled={p.totalStock <= 0} className="inline-flex flex-1 items-center justify-center gap-2 bg-wine py-2.5 text-[0.65rem] tracking-[0.18em] text-onyx uppercase disabled:opacity-50">
                <ShoppingBag className="size-3.5" /> {p.totalStock > 0 ? "Move to bag" : "Sold out"}
              </button>
              <button type="button" onClick={() => toggleWishlist(p.id, p.name)} aria-label={`Remove ${p.name}`} className="border border-border px-3 hover:text-destructive">
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
