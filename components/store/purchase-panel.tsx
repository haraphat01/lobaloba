"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Heart, Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/components/store/store-provider";
import { requestRestockNotification } from "@/app/actions/forms";
import type { ProductDetail } from "@/lib/data/catalog";
import { formatMoney, priceExplanation, quantityNoun, unitLabel, unitShort } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PurchasePanel({
  product,
  onColourChange,
  compact = false,
  onAdded,
}: {
  product: ProductDetail;
  onColourChange?: (colourId: string | null) => void;
  compact?: boolean;
  onAdded?: () => void;
}) {
  const router = useRouter();
  const { addToBag, toggleWishlist, isWishlisted } = useStore();
  const firstInStock = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const [variantId, setVariantId] = useState(firstInStock?.id ?? "");
  const variant = product.variants.find((v) => v.id === variantId) ?? firstInStock;
  const maxQty = Math.min(variant?.stock ?? 0, product.maxQuantity ?? Infinity);
  const minQty = Math.min(product.minQuantity, Math.max(maxQty, 1));
  const [qty, setQty] = useState(minQty);
  const quantity = Math.max(Math.min(qty, maxQty || minQty), minQty);
  const price = variant?.price ?? product.price;
  const outOfStock = !variant || variant.stock <= 0;
  const lowStock = !outOfStock && variant.stock <= product.lowStockThreshold;

  // Variants usually map 1:1 to colours; show them as swatches when they do.
  const swatches = useMemo(
    () =>
      product.variants.map((v) => ({
        variant: v,
        colour: product.colours.find((c) => c.id === v.colourId) ?? null,
      })),
    [product.variants, product.colours],
  );
  const allHaveColours = swatches.every((s) => s.colour);

  function select(id: string) {
    setVariantId(id);
    setQty(product.minQuantity);
    onColourChange?.(product.variants.find((v) => v.id === id)?.colourId ?? null);
  }

  function add(buyNow = false) {
    if (!variant || outOfStock) return;
    addToBag(variant.id, quantity, buyNow ? undefined : product.name);
    onAdded?.();
    if (buyNow) router.push("/checkout");
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="font-serif text-3xl text-ink">{formatMoney(price, product.currency)}</span>
          {product.compareAtPrice && product.compareAtPrice > price && (
            <span className="text-lg text-muted-foreground line-through">{formatMoney(product.compareAtPrice, product.currency)}</span>
          )}
          <span className="text-sm text-muted-foreground">{unitShort(product.purchaseUnit, product.unitLabel)}</span>
        </div>
        <p className="mt-2 inline-flex items-center gap-2 bg-cream px-3 py-1.5 text-xs text-charcoal">
          <strong className="font-medium">{unitLabel(product.purchaseUnit, product.unitLabel)}.</strong>
          {priceExplanation(product.purchaseUnit, product.unitLabel)}
        </p>
      </div>

      {product.variants.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-xs font-medium tracking-[0.18em] uppercase">
            {allHaveColours ? "Colour" : "Option"}: <span className="font-normal tracking-normal text-muted-foreground normal-case">{variant?.name}</span>
          </legend>
          {allHaveColours ? (
            <div className="flex flex-wrap gap-3">
              {swatches.map(({ variant: v, colour }) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => select(v.id)}
                  aria-label={`${v.name}${v.stock <= 0 ? " (out of stock)" : ""}`}
                  aria-pressed={v.id === variantId}
                  title={v.name}
                  className={cn(
                    "relative size-10 rounded-full border-2 p-0.5 transition",
                    v.id === variantId ? "border-wine" : "border-transparent hover:border-gold",
                  )}
                >
                  <span className="block size-full rounded-full border border-black/10" style={{ background: colour!.hex }} />
                  {v.stock <= 0 && <span className="absolute inset-0 m-auto h-px w-9 rotate-45 bg-charcoal/70" />}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => select(v.id)}
                  aria-pressed={v.id === variantId}
                  className={cn(
                    "border px-4 py-2 text-sm transition",
                    v.id === variantId ? "border-wine bg-wine text-onyx" : "border-border hover:border-wine",
                    v.stock <= 0 && "text-muted-foreground line-through",
                  )}
                >
                  {v.name}
                </button>
              ))}
            </div>
          )}
        </fieldset>
      )}

      <p className={cn("text-sm", outOfStock ? "text-destructive" : lowStock ? "text-gold" : "text-emerald-300")}>
        {outOfStock ? "Out of stock" : lowStock ? `Only ${variant.stock} left — order soon` : "In stock, ready to ship"}
      </p>

      {outOfStock ? (
        <NotifyMe productId={product.id} variantId={variant?.id} />
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center border border-border">
              <button type="button" aria-label="Decrease quantity" className="p-3 hover:bg-cream disabled:opacity-40" disabled={quantity <= minQty} onClick={() => setQty(quantity - 1)}>
                <Minus className="size-3.5" />
              </button>
              <input
                type="number"
                inputMode="numeric"
                aria-label="Quantity"
                min={minQty}
                max={maxQty}
                value={quantity}
                onChange={(e) => setQty(Number(e.target.value) || minQty)}
                className="w-14 [appearance:textfield] bg-transparent text-center text-sm tabular-nums outline-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button type="button" aria-label="Increase quantity" className="p-3 hover:bg-cream disabled:opacity-40" disabled={quantity >= maxQty} onClick={() => setQty(quantity + 1)}>
                <Plus className="size-3.5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {quantity} {quantity === 1 ? quantityNoun(product.purchaseUnit).replace(/s$/, "") : quantityNoun(product.purchaseUnit)} ·{" "}
              <span className="text-ink">{formatMoney(price * quantity, product.currency)}</span>
            </p>
          </div>

          <div className={cn("grid gap-3", compact ? "grid-cols-1" : "sm:grid-cols-2")}>
            <Button size="lg" className="h-13 rounded-none text-xs tracking-[0.22em] uppercase" onClick={() => add(false)}>
              Add to bag
            </Button>
            {!compact && (
              <Button size="lg" variant="outline" className="h-13 rounded-none border-ink text-xs tracking-[0.22em] uppercase hover:bg-ink hover:text-onyx" onClick={() => add(true)}>
                Buy now
              </Button>
            )}
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => toggleWishlist(product.id, product.name)}
        className="inline-flex items-center gap-2 text-xs tracking-[0.18em] uppercase hover:text-wine"
      >
        <Heart className={cn("size-4", isWishlisted(product.id) && "fill-wine text-wine")} />
        {isWishlisted(product.id) ? "Saved to wishlist" : "Add to wishlist"}
      </button>
    </div>
  );
}

function NotifyMe({ productId, variantId }: { productId: string; variantId?: string }) {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-3 border border-border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await requestRestockNotification({ productId, variantId: variantId ?? "", email });
          setMsg({ ok: res.ok, text: res.ok ? (res.message ?? "") : res.error });
        });
      }}
    >
      <p className="flex items-center gap-2 font-serif text-xl">
        <Bell className="size-4 text-gold" /> Notify me when available
      </p>
      <p className="text-xs text-muted-foreground">Leave your email and we&apos;ll let you know the moment this option is restocked.</p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          aria-label="Email address"
          className="h-11 flex-1 border border-input bg-transparent px-3 text-sm outline-none focus:border-wine"
        />
        <Button type="submit" disabled={pending} className="h-11 rounded-none px-5 text-xs tracking-[0.18em] uppercase">
          {pending ? <Loader2 className="size-4 animate-spin" /> : "Notify me"}
        </Button>
      </div>
      {msg && <p className={cn("text-xs", msg.ok ? "text-wine" : "text-destructive")}>{msg.text}</p>}
    </form>
  );
}
