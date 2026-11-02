import type { Metadata } from "next";
import Link from "next/link";
import { Check, Sparkles, Users, Crown } from "lucide-react";
import { FabricImage } from "@/components/shared/fabric-image";
import { Reveal } from "@/components/shared/reveal";
import { Breadcrumbs } from "@/components/shared/page-header";
import { QuoteRequestForm } from "@/components/store/quote-request-form";
import { getAsoebiPackages } from "@/lib/data/content";
import { getCategories } from "@/lib/data/catalog";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = {
  title: "Asoebi Lounge — group Asoebi coordination",
  description: "Coordinated Asoebi for weddings, traditional marriages and celebrations: fabric selection, a shareable guest ordering page, individual payments and delivery.",
  alternates: { canonical: "/asoebi" },
};

const icons = [Sparkles, Users, Crown];

export default async function AsoebiPage() {
  const [packages, categories] = await Promise.all([getAsoebiPackages(), getCategories()]);
  return (
    <>
      <section className="relative isolate overflow-hidden bg-wine-deep text-ivory">
        <FabricImage src="/demo/collection-the-asoebi-collection.svg" alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-50" />
        <div className="container-x py-20 sm:py-32">
          <div className="[&_*]:text-ivory/75">
            <Breadcrumbs items={[{ label: "Asoebi Lounge" }]} />
          </div>
          <p className="eyebrow mt-10 text-gold-light">The Asoebi Lounge</p>
          <h1 className="mt-4 max-w-4xl text-5xl leading-[1.02] sm:text-7xl">Your Celebration Deserves a Perfectly Coordinated Look.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ivory/80">
            From choosing the perfect fabric to collecting individual payments from every guest, our Asoebi specialists coordinate it all — so your family and friends arrive beautifully matched.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href="#quote" className="bg-gold px-8 py-4 text-xs tracking-[0.24em] text-ivory uppercase hover:bg-gold-light hover:text-wine">
              Request a quotation
            </a>
            <a href="#packages" className="border border-ivory/50 px-8 py-4 text-xs tracking-[0.24em] uppercase hover:bg-ivory/10">
              View packages
            </a>
          </div>
        </div>
      </section>

      <section className="container-x grid gap-10 py-20 md:grid-cols-4">
        {[
          ["One dye lot", "Every guest's fabric is cut from the same production run, so colours match perfectly in photographs."],
          ["One shareable link", "We create a private event page where each guest chooses their package and pays for themselves."],
          ["Live coordination", "See who has paid, quantities ordered and delivery details at a glance."],
          ["Delivered with care", "Individually packaged and labelled — delivered to guests or collected together."],
        ].map(([t, d], i) => (
          <Reveal key={t} delay={i * 0.05}>
            <p className="font-serif text-5xl text-gold">0{i + 1}</p>
            <p className="mt-4 font-serif text-2xl">{t}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{d}</p>
          </Reveal>
        ))}
      </section>

      <section id="packages" className="bg-card py-20">
        <div className="container-x">
          <p className="eyebrow text-center">Coordination packages</p>
          <h2 className="mt-3 text-center text-5xl">Choose the support you need</h2>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {packages.map((p, i) => {
              const Icon = icons[i % icons.length];
              return (
                <Reveal key={p.id} delay={i * 0.06} className="h-full">
                  <article className={`flex h-full flex-col border p-8 ${i === 1 ? "border-wine bg-ivory shadow-xl shadow-wine/5" : "border-border bg-ivory"}`}>
                    <Icon className="size-7 text-gold" strokeWidth={1.3} />
                    <h3 className="mt-5 text-3xl">{p.name}</h3>
                    {p.tagline && <p className="mt-1 text-sm text-wine">{p.tagline}</p>}
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">{p.description}</p>
                    <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                      {p.included_services.map((s) => (
                        <li key={s} className="flex gap-2">
                          <Check className="mt-0.5 size-4 shrink-0 text-wine" /> {s}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-8 font-serif text-2xl">{p.is_quote_based || p.price === null ? "Quotation-based" : `From ${formatMoney(p.price)}`}</p>
                    {p.price_note && <p className="text-xs text-muted-foreground">{p.price_note}</p>}
                    <Link href="#quote" className="mt-6 bg-wine px-6 py-3.5 text-center text-xs tracking-[0.22em] text-ivory uppercase hover:bg-wine-deep">
                      Request a quote
                    </Link>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section id="quote" className="container-x grid gap-12 py-20 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <p className="eyebrow">Event quotation</p>
          <h2 className="mt-3 text-5xl">Tell us about your celebration</h2>
          <p className="mt-4 leading-7 text-muted-foreground">Share a few details and our Asoebi specialists will prepare a tailored quotation — usually within one business day.</p>
          <p className="mt-6 text-sm text-muted-foreground">
            Buying in bulk for a business? Visit <Link href="/wholesale" className="text-wine underline">Wholesale</Link>.
          </p>
        </div>
        <QuoteRequestForm type="asoebi" packages={packages.map((p) => ({ id: p.id, name: p.name }))} categories={categories.map((c) => c.name)} />
      </section>
    </>
  );
}
