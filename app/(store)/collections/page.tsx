import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { FabricImage } from "@/components/shared/fabric-image";
import { Reveal } from "@/components/shared/reveal";
import { getCollections } from "@/lib/data/catalog";

export const metadata: Metadata = {
  title: "Collections",
  description: "Curated edits for brides, wedding guests, Asoebi groups and gentlemen.",
  alternates: { canonical: "/collections" },
};

export default async function CollectionsPage() {
  const collections = await getCollections();
  return (
    <>
      <PageHeader crumbs={[{ label: "Collections" }]} eyebrow="Curated edits" title="Collections" description="Thoughtfully assembled edits for every role at the celebration." />
      <div className="container-x grid gap-6 py-14 md:grid-cols-2">
        {collections.map((c, i) => (
          <Reveal key={c.id} delay={(i % 2) * 0.06}>
            <Link href={`/collections/${c.slug}`} className="group relative block aspect-[5/4] overflow-hidden bg-cream">
              <FabricImage src={c.image_url} alt={c.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-wine-deep/85 via-wine-deep/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-8 text-ivory">
                <h2 className="text-4xl">{c.title}</h2>
                {c.subtitle && <p className="mt-2 text-sm text-ivory/80">{c.subtitle}</p>}
                <span className="mt-4 inline-flex items-center gap-2 text-[0.68rem] tracking-[0.22em] uppercase">
                  Explore <ArrowRight className="size-3.5 transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
        {collections.length === 0 && <p className="text-muted-foreground">Collections are coming soon.</p>}
      </div>
    </>
  );
}
