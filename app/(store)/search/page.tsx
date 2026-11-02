import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { CatalogResults, CatalogSkeleton } from "@/components/store/catalog-view";
import { SearchBox } from "@/components/store/search-box";
import { getProducts } from "@/lib/data/catalog";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <>
      <PageHeader crumbs={[{ label: "Search" }]} title="Search" />
      <Suspense fallback={<CatalogSkeleton />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function SearchResults({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() ?? "";
  const probe = q ? await getProducts({ q, pageSize: 1 }) : null;

  return (
    <>
      <div className="container-x pt-10">
        <SearchBox initial={q} />
        {q && probe && probe.total > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            {probe.total} {probe.total === 1 ? "result" : "results"} for <span className="text-ink">“{q}”</span>
          </p>
        )}
      </div>
      {!q ? (
        <div className="container-x py-20 text-center text-muted-foreground">Search by product name, category, colour or fabric type.</div>
      ) : probe && probe.total === 0 ? (
        <div className="container-x py-20 text-center">
          <p className="font-serif text-3xl">No results for “{q}”</p>
          <p className="mt-3 text-sm text-muted-foreground">Check the spelling, try a broader term like “lace” or “gold”, or browse our categories.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {["Lace", "Crystal", "Bridal", "Gold", "Clutch", "Aso-oke"].map((t) => (
              <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="rounded-full border border-border px-4 py-2 text-sm hover:border-wine hover:text-wine">
                {t}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <CatalogResults searchParams={searchParams} fixed={{ q }} showCategories />
      )}
    </>
  );
}
