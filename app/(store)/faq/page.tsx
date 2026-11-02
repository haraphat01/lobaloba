import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { JsonLd } from "@/components/shared/json-ld";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getFaqs } from "@/lib/data/content";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "Answers to common questions about ordering, payments, delivery, Asoebi and returns at Lobaloba Deluxe.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const faqs = await getFaqs();
  const groups = [...new Set(faqs.map((f) => f.category))];
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
        }}
      />
      <PageHeader crumbs={[{ label: "Help", href: "/help" }, { label: "FAQs" }]} eyebrow="Help centre" title="Frequently asked questions" />
      <div className="container-x max-w-3xl space-y-12 py-14">
        {groups.map((g) => (
          <section key={g}>
            <h2 className="text-3xl">{g}</h2>
            <Accordion type="single" collapsible className="mt-4">
              {faqs
                .filter((f) => f.category === g)
                .map((f) => (
                  <AccordionItem key={f.id} value={f.id}>
                    <AccordionTrigger className="text-left text-base">{f.question}</AccordionTrigger>
                    <AccordionContent className="leading-7 text-charcoal">{f.answer}</AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          </section>
        ))}
      </div>
    </>
  );
}
