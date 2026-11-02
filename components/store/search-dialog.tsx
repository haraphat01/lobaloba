"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Clock, Loader2, Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FabricImage } from "@/components/shared/fabric-image";
import { formatMoney, unitShort } from "@/lib/format";

type Suggestion = {
  products: { name: string; slug: string; category: string | null; price: number; currency: string; purchaseUnit: string; unitLabel: string | null; image: string | null }[];
  categories: { name: string; slug: string }[];
};

const RECENT_KEY = "lobaloba.recent-searches";
const POPULAR = ["Bridal lace", "Crystal", "Aso-oke", "Gold", "Beaded", "Clutch"];

export function rememberSearch(q: string) {
  try {
    const prev = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
    localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev.filter((p) => p.toLowerCase() !== q.toLowerCase())].slice(0, 6)));
  } catch {
    /* ignore storage errors */
  }
}

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Suggestion | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const loadRecent = () => {
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"));
    } catch {
      setRecent([]);
    }
  };

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const controller = new AbortController();
    const t = setTimeout(() => {
      startTransition(async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
          if (res.ok) setResults(await res.json());
        } catch {
          /* aborted */
        }
      });
    }, 200);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [q]);

  const shown = q.trim().length >= 2 ? results : null;

  function go(term: string) {
    const t = term.trim();
    if (!t) return;
    rememberSearch(t);
    onOpenChange(false);
    router.push(`/search?q=${encodeURIComponent(t)}`);
  }

  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[12vh] max-w-2xl translate-y-0 gap-0 overflow-hidden rounded-none border-border bg-ivory p-0 sm:max-w-2xl" showCloseButton={false}>
        <DialogTitle className="sr-only">Search the catalogue</DialogTitle>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            go(q);
          }}
          className="flex items-center gap-3 border-b border-border px-5"
        >
          <Search className="size-5 text-gold" />
          <input
            autoFocus
            onFocus={loadRecent}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by fabric, colour, category…"
            className="h-16 flex-1 bg-transparent font-serif text-xl outline-none placeholder:text-muted-foreground/70"
            aria-label="Search"
          />
          {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          <button type="button" onClick={close} aria-label="Close search" className="rounded-full p-1.5 hover:bg-cream">
            <X className="size-4" />
          </button>
        </form>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          {!shown && (
            <div className="grid gap-6 sm:grid-cols-2">
              {recent.length > 0 && (
                <div>
                  <p className="eyebrow mb-3">Recent searches</p>
                  <ul className="space-y-2">
                    {recent.map((r) => (
                      <li key={r}>
                        <button type="button" onClick={() => go(r)} className="flex items-center gap-2 text-sm hover:text-wine">
                          <Clock className="size-3.5 text-muted-foreground" /> {r}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="eyebrow mb-3">Popular</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR.map((p) => (
                    <button key={p} type="button" onClick={() => go(p)} className="rounded-full border border-border px-3 py-1.5 text-xs hover:border-wine hover:text-wine">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {shown && shown.products.length === 0 && shown.categories.length === 0 && !pending && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No matches for “{q}”. Try a colour, fabric type or category.
            </p>
          )}

          {shown && shown.categories.length > 0 && (
            <div className="mb-5">
              <p className="eyebrow mb-2">Categories</p>
              <div className="flex flex-wrap gap-2">
                {shown.categories.map((c) => (
                  <Link key={c.slug} href={`/shop/${c.slug}`} onClick={close} className="rounded-full bg-cream px-3 py-1.5 text-xs hover:text-wine">
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {shown && shown.products.length > 0 && (
            <div>
              <p className="eyebrow mb-2">Products</p>
              <ul className="divide-y divide-border/70">
                {shown.products.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/products/${p.slug}`} onClick={() => { rememberSearch(q.trim()); close(); }} className="flex items-center gap-4 py-3 hover:bg-cream/60">
                      <div className="relative h-16 w-12 shrink-0 overflow-hidden bg-cream">
                        <FabricImage src={p.image} alt={p.name} fill sizes="48px" className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-serif text-lg">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.category}</p>
                      </div>
                      <p className="text-sm whitespace-nowrap">
                        {formatMoney(p.price, p.currency)} <span className="text-xs text-muted-foreground">{unitShort(p.purchaseUnit, p.unitLabel)}</span>
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => go(q)} className="mt-4 text-xs font-medium tracking-[0.18em] text-wine uppercase hover:underline">
                See all results for “{q}”
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
