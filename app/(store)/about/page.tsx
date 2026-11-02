import type { Metadata } from "next";
import Link from "next/link";
import { Gem, HeartHandshake, Leaf, Sparkles } from "lucide-react";
import { FabricImage } from "@/components/shared/fabric-image";
import { Reveal } from "@/components/shared/reveal";
import { Breadcrumbs } from "@/components/shared/page-header";
import { getSettings } from "@/lib/data/settings";

export const metadata: Metadata = {
  title: "About us",
  description: "The story of Lobaloba Deluxe — a Lagos atelier curating luxury laces, crystal fabrics and Asoebi for life's finest celebrations.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const { business } = await getSettings();
  return (
    <>
      <section className="container-x grid items-center gap-12 py-14 lg:grid-cols-2 lg:py-24">
        <div>
          <Breadcrumbs items={[{ label: "About us" }]} />
          <p className="eyebrow mt-10">Our story</p>
          <h1 className="mt-4 text-5xl leading-[1.02] sm:text-7xl">
            Fabric is how we <em className="text-wine">celebrate</em>.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-charcoal">
            In Nigeria, the fabric you wear tells everyone how much a moment means. Lobaloba Deluxe was founded in Lagos to honour that tradition — with laces, crystal tulles and accessories chosen as carefully as the celebrations they are made for.
          </p>
          <p className="mt-5 max-w-xl leading-8 text-muted-foreground">
            The name comes from the joyful rhythm of an owambe in full swing. That spirit guides everything we do: from the bride choosing her first lace to the coordinator dressing two hundred guests in perfect harmony.
          </p>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden bg-cream">
          <FabricImage src="/demo/collection-the-bridal-edit.svg" alt="Ivory bridal lace" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
      </section>

      <section className="bg-wine text-ivory">
        <div className="container-x grid gap-12 py-20 md:grid-cols-2">
          <Reveal>
            <p className="eyebrow text-gold-light">Our mission</p>
            <p className="mt-4 font-serif text-3xl leading-snug">To make exceptional fabrics — and the expert guidance that goes with them — accessible to every Nigerian celebration, at home and abroad.</p>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="eyebrow text-gold-light">Our vision</p>
            <p className="mt-4 font-serif text-3xl leading-snug">To be the most trusted name in celebration fabrics across Africa and the diaspora, known for quality, honesty and beautiful coordination.</p>
          </Reveal>
        </div>
      </section>

      <section className="container-x py-20">
        <p className="eyebrow text-center">What we stand for</p>
        <h2 className="mt-3 text-center text-5xl">Our values</h2>
        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [Gem, "Uncompromising quality", "Every bolt is inspected by hand for embellishment, colour and finish before it is cut."],
            [HeartHandshake, "Personal service", "Real stylists, real advice — on WhatsApp, by video call or in our studio."],
            [Sparkles, "Honest description", "Clear purchase units, accurate colours and transparent pricing. No surprises."],
            [Leaf, "Care in every detail", "Tissue-wrapped, carefully packaged orders that arrive ready for your tailor."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Gem;
            return (
              <div key={t as string}>
                <I className="size-7 text-gold" strokeWidth={1.2} />
                <p className="mt-4 font-serif text-2xl">{t as string}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{d as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-card">
        <div className="container-x grid gap-12 py-20 lg:grid-cols-2">
          <div>
            <h2 className="text-4xl">Our quality commitment</h2>
            <p className="mt-4 leading-8 text-charcoal">
              We work directly with trusted mills and artisans, and we only list fabrics we would be proud to wear ourselves. Bundles are cut from a single bolt, so the colour and embellishment density are consistent from the first yard to the last.
            </p>
          </div>
          <div>
            <h2 className="text-4xl">Our service commitment</h2>
            <p className="mt-4 leading-8 text-charcoal">
              We answer every enquiry within one business day, confirm stock before you pay, and keep you updated at every step from payment to delivery. If anything isn&apos;t right, we will make it right.
            </p>
          </div>
        </div>
      </section>

      <section className="container-x py-20 text-center">
        <h2 className="text-4xl">Visit or contact us</h2>
        <p className="mt-4 text-muted-foreground">
          {business.address} · {business.hours}
        </p>
        <p className="mt-2 text-muted-foreground">
          {business.email} · {business.phone}
        </p>
        <Link href="/contact" className="mt-8 inline-block bg-wine px-8 py-4 text-xs tracking-[0.22em] text-ivory uppercase">
          Get in touch
        </Link>
      </section>
    </>
  );
}
