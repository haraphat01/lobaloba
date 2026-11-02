import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { CatalogResults, CatalogSkeleton } from "@/components/store/catalog-view";
import { getCategoryBySlug } from "@/lib/data/catalog";

export async function generateMetadata({ params }: PageProps<"/shop/[category]">): Promise<Metadata> {
  const { category } = await params;
  const c = await getCategoryBySlug(category);
  if (!c) return { title: "Category not found" };
  return {
    title: c.seo_title || c.name,
    description: c.seo_description || c.description || `Shop ${c.name} at Lobaloba Deluxe.`,
    alternates: { canonical: `/shop/${c.slug}` },
    openGraph: { images: c.image_url ? [c.image_url] : undefined },
  };
}

export default function CategoryPage({ params, searchParams }: PageProps<"/shop/[category]">) {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CategoryContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CategoryContent({ params, searchParams }: Pick<PageProps<"/shop/[category]">, "params" | "searchParams">) {
  const { category } = await params;
  const c = await getCategoryBySlug(category);
  if (!c) notFound();
  return (
    <>
      <PageHeader crumbs={[{ label: "Shop", href: "/shop" }, { label: c.name }]} eyebrow="Category" title={c.name} description={c.description ?? undefined} />
      <CatalogResults searchParams={searchParams} fixed={{ category: c.slug }} showCategories />
    </>
  );
}
