import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FabricImage } from "@/components/shared/fabric-image";
import { Breadcrumbs } from "@/components/shared/page-header";
import { CatalogResults, CatalogSkeleton } from "@/components/store/catalog-view";
import { getCollectionBySlug } from "@/lib/data/catalog";

export async function generateMetadata({ params }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCollectionBySlug(slug);
  if (!c) return { title: "Collection not found" };
  return {
    title: c.title,
    description: c.description ?? c.subtitle ?? undefined,
    alternates: { canonical: `/collections/${c.slug}` },
    openGraph: { images: c.image_url ? [c.image_url] : undefined },
  };
}

export default function CollectionPage({ params, searchParams }: PageProps<"/collections/[slug]">) {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CollectionContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CollectionContent({ params, searchParams }: Pick<PageProps<"/collections/[slug]">, "params" | "searchParams">) {
  const { slug } = await params;
  const c = await getCollectionBySlug(slug);
  if (!c) notFound();
  return (
    <>
      <section className="relative isolate overflow-hidden bg-wine-deep text-ivory">
        <FabricImage src={c.image_url} alt={c.title} fill priority sizes="100vw" className="-z-10 object-cover opacity-60" />
        <div className="container-x py-20 sm:py-28">
          <div className="[&_*]:text-ivory/80">
            <Breadcrumbs items={[{ label: "Collections", href: "/collections" }, { label: c.title }]} />
          </div>
          <p className="eyebrow mt-8 text-gold-light">Collection</p>
          <h1 className="mt-3 text-5xl sm:text-7xl">{c.title}</h1>
          {c.subtitle && <p className="mt-4 max-w-xl text-lg text-ivory/85">{c.subtitle}</p>}
        </div>
      </section>
      <CatalogResults searchParams={searchParams} fixed={{ collection: c.slug }} showCategories={false} />
    </>
  );
}
