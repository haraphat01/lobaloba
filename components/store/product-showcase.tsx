"use client";

import { useEffect, useState } from "react";
import { FabricImage } from "@/components/shared/fabric-image";
import { PurchasePanel } from "@/components/store/purchase-panel";
import type { ProductDetail } from "@/lib/data/catalog";
import { cn } from "@/lib/utils";

const RECENT_KEY = "lobaloba.recently-viewed";

/** Gallery with hover zoom, linked to the colour chosen in the purchase panel. */
export function ProductShowcase({ product, children }: { product: ProductDetail; children?: React.ReactNode }) {
  const initialColour = product.variants.find((v) => v.stock > 0)?.colourId ?? product.variants[0]?.colourId ?? null;
  const [active, setActive] = useState(() => Math.max(0, product.images.findIndex((i) => i.colourId === initialColour)));
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const image = product.images[active] ?? product.images[0];

  useEffect(() => {
    try {
      const prev = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
      localStorage.setItem(RECENT_KEY, JSON.stringify([product.id, ...prev.filter((id) => id !== product.id)].slice(0, 12)));
    } catch {
      /* ignore */
    }
  }, [product.id]);

  return (
    <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
      <div className="flex flex-col-reverse gap-4 sm:flex-row">
        {product.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto py-1 sm:w-[4.5rem] sm:flex-col sm:overflow-visible">
            {product.images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1}: ${img.alt}`}
                aria-current={i === active}
                className={cn("relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-sm border sm:w-full", i === active ? "border-wine ring-1 ring-wine" : "border-border opacity-65 hover:opacity-100")}
              >
                <FabricImage src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
        <div
          className="relative aspect-[4/5] flex-1 cursor-zoom-in overflow-hidden rounded-sm bg-[#f0e9df]"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onMouseLeave={() => setZoom(null)}
        >
          <FabricImage
            src={image?.url}
            alt={image?.alt ?? product.name}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover transition-transform duration-200"
            style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          />
        </div>
      </div>

      <div className="lg:sticky lg:top-36 lg:self-start">
        {children}
        <PurchasePanel
          product={product}
          onColourChange={(colourId) => {
            const idx = product.images.findIndex((i) => i.colourId === colourId);
            if (idx >= 0) setActive(idx);
          }}
        />
      </div>
    </div>
  );
}
