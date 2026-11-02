import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { CatalogView } from "@/components/store/catalog-view";

export const metadata: Metadata = {
  title: "Shop luxury fabrics & accessories",
  description: "Shop bridal lace, crystal fabrics, beaded lace, Asoebi fabrics, men's fabrics, clutch purses and accessories.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <>
      <PageHeader crumbs={[{ label: "Shop" }]} eyebrow="The collection" title="Shop" description="Luxury laces, crystal fabrics and finishing touches — curated for weddings, owambe and every celebration in between." />
      <CatalogView searchParams={searchParams} />
    </>
  );
}
