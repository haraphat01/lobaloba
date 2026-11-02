"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, Heart } from "lucide-react";
import { FabricImage } from "@/components/shared/fabric-image";
import { QuickView } from "@/components/store/quick-view";
import { useStore } from "@/components/store/store-provider";
import type { ProductCardData } from "@/lib/data/catalog";
import { formatMoney, unitShort } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  const { toggleWishlist, isWishlisted } = useStore();
  const [quickOpen, setQuickOpen] = useState(false);
  const saved = isWishlisted(product.id);
  const outOfStock = product.totalStock <= 0;
  const lowStock = !outOfStock && product.totalStock <= product.lowStockThreshold;
  const [primary, secondary] = product.images;

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[0.8] overflow-hidden rounded-sm bg-[#f0e9df]">
        <Link href={`/products/${product.slug}`} aria-label={product.name} className="absolute inset-0">
          <FabricImage
            src={primary?.url}
            alt={primary?.alt ?? product.name}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 48vw"
            className={cn("object-cover transition duration-700 ease-out group-hover:scale-[1.035]", secondary && "group-hover:opacity-0")}
          />
          {secondary && (
            <FabricImage
              src={secondary.url}
              alt={secondary.alt}
              fill
              sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 48vw"
              className="object-cover opacity-0 transition duration-700 group-hover:opacity-100"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isNewArrival && <Badge>New</Badge>}
          {product.isBestseller && <Badge tone="gold">Bestseller</Badge>}
          {product.compareAtPrice && product.compareAtPrice > product.price && <Badge tone="wine">Sale</Badge>}
          {outOfStock && <Badge tone="muted">Sold out</Badge>}
        </div>

        <button
          type="button"
          onClick={() => toggleWishlist(product.id, product.name)}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={saved}
          className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-[#fffdf9]/95 text-ink shadow-sm transition hover:bg-white hover:text-wine"
        >
          <Heart className={cn("size-4", saved && "fill-wine text-wine")} />
        </button>

        <button
          type="button"
          onClick={() => setQuickOpen(true)}
          className="absolute inset-x-3 bottom-3 flex translate-y-2 items-center justify-center gap-2 rounded-sm bg-[#fffdf9]/95 py-3 text-[0.68rem] font-medium tracking-[0.16em] uppercase opacity-0 shadow-sm transition duration-300 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-wine hover:text-ivory max-lg:translate-y-0 max-lg:opacity-100"
        >
          <Eye className="size-3.5" /> Quick view
        </button>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <p className="text-[0.63rem] tracking-[0.16em] text-muted-foreground uppercase">{product.categoryName}</p>
        <h3 className="mt-1 font-serif text-[1.05rem] leading-snug sm:text-xl">
          <Link href={`/products/${product.slug}`} className="hover:text-wine">
            {product.name}
          </Link>
        </h3>
        <p className="mt-2 text-sm">
          <span className="font-medium text-wine">{formatMoney(product.price, product.currency)}</span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="ml-2 text-muted-foreground line-through">{formatMoney(product.compareAtPrice, product.currency)}</span>
          )}
          <span className="ml-1 text-xs text-muted-foreground">{unitShort(product.purchaseUnit, product.unitLabel)}</span>
        </p>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1" aria-label={`Available colours: ${product.colours.map((c) => c.name).join(", ")}`}>
            {product.colours.slice(0, 5).map((c) => (
              <span key={c.name} title={c.name} className="size-3.5 rounded-full border border-black/15" style={{ background: c.hex }} />
            ))}
            {product.colours.length > 5 && <span className="text-[0.65rem] text-muted-foreground">+{product.colours.length - 5}</span>}
          </div>
          <span className={cn("text-[0.68rem]", outOfStock ? "text-destructive" : lowStock ? "text-gold" : "text-emerald-800")}>
            {outOfStock ? "Out of stock" : lowStock ? "Low stock" : "In stock"}
          </span>
        </div>
      </div>

      <QuickView slug={product.slug} open={quickOpen} onOpenChange={setQuickOpen} />
    </article>
  );
}

function Badge({ children, tone = "ivory" }: { children: React.ReactNode; tone?: "ivory" | "gold" | "wine" | "muted" }) {
  return (
    <span
      className={cn(
        "px-2 py-1 text-[0.6rem] font-medium tracking-[0.18em] uppercase",
        tone === "ivory" && "bg-ivory text-wine",
        tone === "gold" && "bg-gold text-ivory",
        tone === "wine" && "bg-wine text-ivory",
        tone === "muted" && "bg-charcoal/80 text-ivory",
      )}
    >
      {children}
    </span>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: ProductCardData[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
