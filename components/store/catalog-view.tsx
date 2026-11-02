import { Suspense } from "react";
import Link from "next/link";
import { ProductGrid } from "@/components/store/product-card";
import { Pagination, ShopSidebar, ShopToolbar } from "@/components/store/shop-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategories, getProducts, getShopFacets, SORT_OPTIONS, type ShopFilters } from "@/lib/data/catalog";
import { parseShopParams } from "@/lib/shop-params";

type SP = Promise<Record<string, string | string[] | undefined>>;

/** Shop grid with filters/sort/pagination. Reads searchParams, so it streams behind Suspense. */
export function CatalogView({ searchParams, fixed = {}, showCategories = true }: { searchParams: SP; fixed?: Partial<ShopFilters>; showCategories?: boolean }) {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogResults searchParams={searchParams} fixed={fixed} showCategories={showCategories} />
    </Suspense>
  );
}

export async function CatalogResults({ searchParams, fixed, showCategories }: { searchParams: SP; fixed: Partial<ShopFilters>; showCategories: boolean }) {
  const filters = { ...parseShopParams(await searchParams), ...fixed };
  const [result, facets, categories] = await Promise.all([getProducts(filters), getShopFacets(), getCategories()]);
  const cats = categories.map((c) => ({ name: c.name, slug: c.slug }));

  return (
    <div className="container-x flex gap-9 py-8 sm:py-10 lg:gap-12 lg:py-12">
      <ShopSidebar facets={facets} categories={cats} showCategories={showCategories} />
      <div className="min-w-0 flex-1">
        <ShopToolbar facets={facets} categories={cats} total={result.total} sortOptions={SORT_OPTIONS} showCategories={showCategories} />
        {result.products.length === 0 ? (
          <div className="rounded-sm bg-[#f3ede4] px-5 py-20 text-center sm:py-24">
            <p className="font-serif text-3xl text-wine">No pieces match your selection</p>
            <p className="mt-3 text-sm text-muted-foreground">Try removing a filter, or ask a stylist on WhatsApp to help you find the perfect fabric.</p>
            <Link href="/shop" className="mt-6 inline-block text-xs tracking-[0.2em] text-wine uppercase underline underline-offset-4">
              View all products
            </Link>
          </div>
        ) : (
          <ProductGrid products={result.products} priorityCount={4} />
        )}
        <Pagination page={result.page} pageCount={result.pageCount} />
      </div>
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div className="container-x flex gap-9 py-8 sm:py-10 lg:gap-12 lg:py-12">
      <div className="hidden w-60 shrink-0 space-y-4 lg:block">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-5 w-3/4" />
        ))}
      </div>
      <div className="grid flex-1 grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[4/5] rounded-none" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
