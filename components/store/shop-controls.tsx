"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type Facets = { colours: string[]; fabrics: string[]; maxPrice: number };
type Cat = { name: string; slug: string };

function useParamUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const update = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    next.delete("page");
    start(() => router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  };
  return { params, update, pending };
}

function FilterPanel({ facets, categories, showCategories }: { facets: Facets; categories: Cat[]; showCategories: boolean }) {
  const { params, update } = useParamUpdater();
  const pathname = usePathname();
  const colours = (params.get("colour") ?? "").split(",").filter(Boolean);
  const fabrics = (params.get("fabric") ?? "").split(",").filter(Boolean);
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");

  const toggleList = (key: string, value: string) =>
    update((p) => {
      const cur = (p.get(key) ?? "").split(",").filter(Boolean);
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      if (next.length) p.set(key, next.join(","));
      else p.delete(key);
    });
  const toggleFlag = (key: string) => update((p) => (p.get(key) === "1" ? p.delete(key) : p.set(key, "1")));

  return (
    <div className="space-y-8 text-sm">
      {showCategories && (
        <FilterGroup title="Category">
          <ul className="space-y-2">
            <li>
              <Link href="/shop" className={cn("transition-colors hover:text-wine", pathname === "/shop" && "font-medium text-wine")}>
                All fabrics & accessories
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/shop/${c.slug}`} className={cn("transition-colors hover:text-wine", pathname === `/shop/${c.slug}` && "font-medium text-wine")}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </FilterGroup>
      )}

      <FilterGroup title="Availability">
        <CheckRow label="In stock only" checked={params.get("instock") === "1"} onChange={() => toggleFlag("instock")} />
        <CheckRow label="New arrivals" checked={params.get("new") === "1"} onChange={() => toggleFlag("new")} />
        <CheckRow label="Bestsellers" checked={params.get("bestsellers") === "1"} onChange={() => toggleFlag("bestsellers")} />
      </FilterGroup>

      <FilterGroup title="Price (₦)">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            update((p) => {
              if (min) p.set("min", min);
              else p.delete("min");
              if (max) p.set("max", max);
              else p.delete("max");
            });
          }}
        >
          <input value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Min" aria-label="Minimum price" className="h-10 w-full rounded-sm border border-input bg-card px-2.5 text-xs" />
          <span>–</span>
          <input value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder={facets.maxPrice ? String(facets.maxPrice) : "Max"} aria-label="Maximum price" className="h-10 w-full rounded-sm border border-input bg-card px-2.5 text-xs" />
          <button type="submit" className="h-10 rounded-sm bg-wine px-3 text-xs text-ivory transition hover:bg-wine-deep">Go</button>
        </form>
        {facets.maxPrice > 0 && <p className="mt-2 text-xs text-muted-foreground">Up to {formatMoney(facets.maxPrice)}</p>}
      </FilterGroup>

      {facets.colours.length > 0 && (
        <FilterGroup title="Colour">
          <div className="flex flex-wrap gap-2">
            {facets.colours.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleList("colour", c)}
                aria-pressed={colours.includes(c)}
                className={cn("rounded-full border px-3 py-1.5 text-xs transition", colours.includes(c) ? "border-wine bg-wine text-ivory" : "border-border bg-card hover:border-wine")}
              >
                {c}
              </button>
            ))}
          </div>
        </FilterGroup>
      )}

      {facets.fabrics.length > 0 && (
        <FilterGroup title="Fabric type">
          {facets.fabrics.map((f) => (
            <CheckRow key={f} label={f} checked={fabrics.includes(f)} onChange={() => toggleList("fabric", f)} />
          ))}
        </FilterGroup>
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-[0.68rem] font-medium tracking-[0.22em] uppercase">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <Checkbox checked={checked} onCheckedChange={onChange} className="rounded-none" />
      {label}
    </label>
  );
}

export function ShopSidebar(props: { facets: Facets; categories: Cat[]; showCategories?: boolean }) {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border pr-7 lg:block">
      <FilterPanel {...props} showCategories={props.showCategories ?? true} />
    </aside>
  );
}

export function ShopToolbar({
  facets,
  categories,
  total,
  sortOptions,
  showCategories = true,
}: {
  facets: Facets;
  categories: Cat[];
  total: number;
  sortOptions: readonly { value: string; label: string }[];
  showCategories?: boolean;
}) {
  const { params, update, pending } = useParamUpdater();
  const [open, setOpen] = useState(false);
  const active = ["colour", "fabric", "min", "max", "instock", "new", "bestsellers"].filter((k) => params.get(k));

  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-4 py-2.5 text-xs font-medium tracking-[0.1em] uppercase transition hover:border-wine lg:hidden">
          <SlidersHorizontal className="size-4" /> Filter {active.length > 0 && `(${active.length})`}
        </button>
        <p className={cn("text-sm text-muted-foreground", pending && "animate-pulse")}>
          {total} {total === 1 ? "piece" : "pieces"}
        </p>
        {active.length > 0 && (
          <button
            type="button"
            onClick={() => update((p) => active.forEach((k) => p.delete(k)))}
            className="inline-flex items-center gap-1 text-xs text-wine hover:underline"
          >
            <X className="size-3" /> Clear filters
          </button>
        )}
      </div>
      <label className="flex items-center gap-2 text-xs tracking-[0.14em] uppercase">
        Sort
        <select
          value={params.get("sort") ?? "featured"}
          onChange={(e) => update((p) => (e.target.value === "featured" ? p.delete("sort") : p.set("sort", e.target.value)))}
          className="rounded-sm border border-border bg-card px-3 py-2.5 text-xs tracking-normal normal-case"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto bg-ivory p-6">
          <SheetHeader className="mb-6 p-0">
            <SheetTitle className="font-serif text-2xl font-normal">Filter</SheetTitle>
          </SheetHeader>
          <FilterPanel facets={facets} categories={categories} showCategories={showCategories} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function Pagination({ page, pageCount }: { page: number; pageCount: number }) {
  const pathname = usePathname();
  const params = useSearchParams();
  if (pageCount <= 1) return null;
  const href = (p: number) => {
    const next = new URLSearchParams(params.toString());
    if (p === 1) next.delete("page");
    else next.set("page", String(p));
    return `${pathname}${next.size ? `?${next}` : ""}`;
  };
  return (
    <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-2">
      <PageLink href={href(page - 1)} disabled={page <= 1} label="Previous page">
        <ChevronLeft className="size-4" />
      </PageLink>
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn("grid size-10 place-items-center rounded-sm border text-sm transition", p === page ? "border-wine bg-wine text-ivory" : "border-border bg-card hover:border-wine")}
        >
          {p}
        </Link>
      ))}
      <PageLink href={href(page + 1)} disabled={page >= pageCount} label="Next page">
        <ChevronRight className="size-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({ href, disabled, label, children }: { href: string; disabled: boolean; label: string; children: React.ReactNode }) {
  if (disabled) return <span className="grid size-10 place-items-center border border-border opacity-40">{children}</span>;
  return (
    <Link href={href} aria-label={label} className="grid size-10 place-items-center border border-border hover:border-wine">
      {children}
    </Link>
  );
}
