import type { Metadata } from "next";
import { Boxes, BadgePercent, Truck, ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { QuoteRequestForm } from "@/components/store/quote-request-form";
import { getCategories } from "@/lib/data/catalog";

export const metadata: Metadata = {
  title: "Wholesale & bulk orders",
  description: "Bulk pricing on luxury laces, Asoebi fabrics and accessories for designers, retailers and large group orders.",
  alternates: { canonical: "/wholesale" },
};

export default async function WholesalePage() {
  const categories = await getCategories();
  return (
    <>
      <PageHeader crumbs={[{ label: "Wholesale" }]} eyebrow="Trade & bulk" title="Wholesale & group orders" description="Preferential pricing for fashion designers, boutiques and large celebrations. Select products, specify quantities and colours, and receive a custom quotation." />
      <section className="container-x grid gap-8 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [Boxes, "Select products", "Choose fabrics and accessories directly from our catalogue."],
          [ClipboardCheck, "Availability confirmed", "We check stock and dye lots before we quote."],
          [BadgePercent, "Bulk pricing", "Tiered pricing based on your quantities."],
          [Truck, "Delivery arranged", "Nationwide and international delivery quoted with your order."],
        ].map(([Icon, t, d]) => {
          const I = Icon as typeof Boxes;
          return (
            <div key={t as string}>
              <I className="size-7 text-gold" strokeWidth={1.3} />
              <p className="mt-4 font-serif text-2xl">{t as string}</p>
              <p className="mt-1 text-sm text-muted-foreground">{d as string}</p>
            </div>
          );
        })}
      </section>
      <section className="container-x grid gap-12 border-t border-border py-16 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <h2 className="text-5xl">Request bulk pricing</h2>
          <p className="mt-4 leading-7 text-muted-foreground">Our trade team replies within one business day with availability and a custom quotation you can accept online.</p>
        </div>
        <QuoteRequestForm type="wholesale" categories={categories.map((c) => c.name)} />
      </section>
    </>
  );
}
