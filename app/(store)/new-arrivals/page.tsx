import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { CatalogView } from "@/components/store/catalog-view";

export const metadata: Metadata = {
  title: "New arrivals",
  description: "The newest luxury laces, crystal fabrics and accessories at Lobaloba Deluxe.",
  alternates: { canonical: "/new-arrivals" },
};

export default function NewArrivalsPage({ searchParams }: PageProps<"/new-arrivals">) {
  return (
    <>
      <PageHeader crumbs={[{ label: "New arrivals" }]} eyebrow="Just landed" title="New arrivals" description="Freshly selected fabrics and accessories, straight from our latest buying trips." />
      <CatalogView searchParams={searchParams} fixed={{ newArrivals: true }} />
    </>
  );
}
