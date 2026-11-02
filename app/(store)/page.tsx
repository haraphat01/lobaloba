import Link from "next/link";
import { ArrowRight, Gift, HandHeart, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { FabricImage } from "@/components/shared/fabric-image";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { JsonLd } from "@/components/shared/json-ld";
import { ProductGrid } from "@/components/store/product-card";
import { NewsletterForm } from "@/components/store/newsletter-form";
import { getCategories, getCollections, getProducts } from "@/lib/data/catalog";
import { getBlogPosts } from "@/lib/data/content";
import { getSettings } from "@/lib/data/settings";
import { formatDate } from "@/lib/format";
import { siteUrl } from "@/lib/site-url";

export default async function HomePage() {
  const [settings, categories, collections, newArrivals, bestsellers, posts] = await Promise.all([
    getSettings(),
    getCategories(),
    getCollections(),
    getProducts({ newArrivals: true, sort: "newest", pageSize: 8 }),
    getProducts({ sort: "bestselling", pageSize: 4 }),
    getBlogPosts({ limit: 3 }),
  ]);
  const { hero, homepage, business } = settings;
  const featured = collections.filter((c) => c.is_featured);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: business.name,
          url: siteUrl,
          email: business.email,
          telephone: business.phone,
          address: business.address,
          sameAs: Object.values(settings.social).filter(Boolean),
        }}
      />

      {/* A. Hero */}
      <section className="overflow-hidden bg-cream">
        <div className="container-x grid items-center gap-7 py-6 sm:gap-9 sm:py-12 lg:min-h-[680px] lg:grid-cols-[1.03fr_0.97fr] lg:gap-12 lg:py-12">
          <div className="relative z-10 py-2 sm:py-4 lg:py-10">
            <p className="eyebrow flex items-center gap-3 text-wine">
              <span className="h-px w-8 bg-gold" />
              {hero.eyebrow}
            </p>
            <h1 className="mt-6 text-[clamp(3.25rem,6.2vw,5.5rem)] leading-[0.91] font-normal tracking-[-0.045em] text-wine">
              {hero.heading.split(". ").map((part, i, arr) => (
                <span key={i} className={i === 1 ? "mt-1 block font-normal italic text-gold md:whitespace-nowrap" : "block md:whitespace-nowrap"}>
                  {part}
                  {i < arr.length - 1 ? "." : ""}
                </span>
              ))}
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-charcoal sm:mt-7 sm:text-lg sm:leading-8">{hero.subheading}</p>
            <div className="mt-6 flex flex-wrap items-center gap-2 sm:mt-8 sm:gap-3">
              <Link href={hero.primary_cta.href} className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-wine px-4 text-[0.64rem] font-medium tracking-[0.1em] text-onyx uppercase transition hover:bg-gold-light sm:min-h-13 sm:gap-3 sm:px-7 sm:text-[0.7rem] sm:tracking-[0.16em]">
                {hero.primary_cta.label} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href={hero.secondary_cta.href} className="inline-flex min-h-12 items-center justify-center border-b border-wine/30 px-2 text-[0.62rem] font-medium tracking-[0.08em] text-wine uppercase transition hover:border-wine sm:min-h-13 sm:px-3 sm:text-[0.7rem] sm:tracking-[0.14em]">
                {hero.secondary_cta.label}
              </Link>
            </div>
            <div className="mt-6 hidden items-center gap-3 text-xs text-muted-foreground sm:flex lg:mt-10">
              <span className="flex -space-x-2">
                <span className="size-7 rounded-full border-2 border-cream bg-gold/70" />
                <span className="size-7 rounded-full border-2 border-cream bg-wine/65" />
                <span className="size-7 rounded-full border-2 border-cream bg-sand" />
              </span>
              <span>Thoughtfully selected. Made for your moment.</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[690px] lg:ml-auto">
            <div className="relative aspect-[1.05] overflow-hidden rounded-t-[48%] rounded-b-sm bg-wine sm:aspect-[1.08] lg:aspect-[1.05]">
              <FabricImage src={hero.image_url || "/demo/hero.svg"} alt={hero.image_alt} fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover transition-transform duration-1000 hover:scale-[1.025]" />
              <div className="absolute inset-0 bg-gradient-to-t from-wine-deep/70 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-5 text-ivory sm:p-8">
                <div>
                  <p className="text-[0.62rem] tracking-[0.24em] text-gold-light uppercase">The Lobaloba edit</p>
                  <p className="mt-2 max-w-xs font-serif text-2xl leading-tight sm:text-3xl">A little more extraordinary.</p>
                </div>
                <Link href="/collections" aria-label="Explore collections" className="grid size-12 shrink-0 place-items-center rounded-full border border-ivory/60 transition hover:bg-ivory hover:text-onyx">
                  <ArrowRight className="size-5" />
                </Link>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-3 hidden border border-gold/50 bg-cream px-4 py-3 text-[0.62rem] tracking-[0.2em] text-wine uppercase sm:block lg:-left-7">
              Curated in Lagos · Loved everywhere
            </div>
          </div>
        </div>
      </section>

      {/* B. Shopping categories */}
      <section className="container-x py-16 sm:py-24 lg:py-28">
        <SectionHeading eyebrow="Find your moment" title="Made for the occasion" description="From the first fitting to the last dance, discover a little something for every celebration." href="/shop" linkLabel="Explore everything" />
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {categories.map((c, i) => (
            <Reveal key={c.id} delay={(i % 4) * 0.06}>
              <Link href={`/shop/${c.slug}`} className="group relative block aspect-[0.82] overflow-hidden rounded-sm bg-cream sm:aspect-[0.9]">
                <FabricImage src={c.image_url} alt={c.name} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent transition-colors group-hover:from-wine-deep/85" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 text-ivory sm:p-5">
                  <div>
                    <p className="mb-1 text-[0.58rem] tracking-[0.2em] text-gold-light uppercase">Discover</p>
                    <h3 className="font-serif text-lg leading-tight sm:text-2xl">{c.name}</h3>
                  </div>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full border border-ivory/60 transition group-hover:bg-ivory group-hover:text-onyx">
                    <ArrowRight className="size-4 transition-transform group-hover:-rotate-45" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* C. New arrivals */}
      {homepage.show_new_arrivals && newArrivals.products.length > 0 && (
        <section className="bg-card py-20 sm:py-28">
          <div className="container-x">
            <SectionHeading eyebrow="Just in" title="New arrivals" description="Freshly landed laces, crystals and accessories — selected by our stylists this season." href="/new-arrivals" />
            <ProductGrid products={newArrivals.products} />
          </div>
        </section>
      )}

      {/* D. Featured collections */}
      {homepage.show_collections && featured.length > 0 && (
        <section className="container-x py-20 sm:py-28">
          <SectionHeading eyebrow="Curated edits" title="Featured collections" href="/collections" />
          <div className="grid gap-5 lg:grid-cols-12">
            {featured.slice(0, 5).map((c, i) => (
              <Reveal key={c.id} delay={i * 0.05} className={i === 0 ? "lg:col-span-7 lg:row-span-2" : i < 3 ? "lg:col-span-5" : "lg:col-span-6"}>
                <Link href={`/collections/${c.slug}`} className="group relative block h-full min-h-[320px] overflow-hidden bg-cream">
                  <FabricImage src={c.image_url} alt={c.title} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover transition duration-1000 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-wine-deep/85 via-wine-deep/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-ivory sm:p-8">
                    <p className="eyebrow text-gold-light">Collection</p>
                    <h3 className={i === 0 ? "mt-2 text-4xl sm:text-5xl" : "mt-2 text-3xl"}>{c.title}</h3>
                    {c.subtitle && <p className="mt-2 max-w-md text-sm text-ivory/80">{c.subtitle}</p>}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* E. Bestsellers */}
      {homepage.show_bestsellers && bestsellers.products.length > 0 && (
        <section className="bg-cream/70 py-20 sm:py-28">
          <div className="container-x">
            <SectionHeading eyebrow="Most loved" title="Bestsellers" description="The fabrics our customers return to, again and again." href="/shop?sort=bestselling" />
            <ProductGrid products={bestsellers.products} />
          </div>
        </section>
      )}

      {/* F. Asoebi Lounge promotion */}
      {homepage.show_asoebi && (
        <section className="relative overflow-hidden border-y border-gold/20 bg-card text-ivory">
          <div className="container-x grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-2">
            <Reveal>
              <p className="eyebrow text-gold-light">The Asoebi Lounge</p>
              <h2 className="mt-5 text-4xl leading-tight sm:text-6xl">{homepage.asoebi_heading}</h2>
              <p className="mt-6 max-w-xl leading-8 text-ivory/80">{homepage.asoebi_text}</p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/asoebi#quote" className="inline-flex h-13 items-center gap-3 bg-gold px-8 text-xs font-medium tracking-[0.24em] text-onyx uppercase transition hover:bg-gold-light hover:text-onyx">
                  Request a quotation <ArrowRight className="size-4" />
                </Link>
                <Link href="/asoebi" className="inline-flex h-13 items-center border border-ivory/50 px-8 text-xs font-medium tracking-[0.24em] uppercase hover:bg-ivory/10">
                  How it works
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <ol className="grid gap-px bg-ivory/15 sm:grid-cols-2">
                {[
                  ["01", "Choose your fabric", "Our stylists help you select colours and fabrics for your theme."],
                  ["02", "Share one link", "Each guest selects and pays for their own Asoebi on your event page."],
                  ["03", "Track every guest", "See paid and unpaid guests and quantities at a glance."],
                  ["04", "Delivered beautifully", "Individually packaged and delivered — or collected together."],
                ].map(([n, t, d]) => (
                  <li key={n} className="bg-card p-7">
                    <span className="font-serif text-3xl text-gold-light">{n}</span>
                    <p className="mt-3 font-serif text-2xl">{t}</p>
                    <p className="mt-2 text-sm leading-6 text-ivory/70">{d}</p>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>
      )}

      {/* G. Brand trust */}
      <section className="border-b border-border/70">
        <div className="container-x grid grid-cols-2 gap-x-6 gap-y-10 py-12 sm:grid-cols-3 lg:grid-cols-5 lg:py-14">
          {[
            { icon: Sparkles, title: "Premium quality", text: "Every bolt inspected by hand" },
            { icon: ShieldCheck, title: "Secure payments", text: "Protected by Paystack" },
            { icon: Truck, title: "Nationwide delivery", text: "Across Nigeria & worldwide" },
            { icon: HandHeart, title: "Personalised assistance", text: "Stylists on WhatsApp" },
            { icon: Gift, title: "Carefully packaged", text: "Wrapped with tissue & care" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3 sm:justify-center">
              <Icon className="mt-0.5 size-5 shrink-0 text-gold" strokeWidth={1.5} />
              <div>
                <p className="font-serif text-lg leading-tight">{title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* H. Journal */}
      {homepage.show_journal && posts.length > 0 && (
        <section className="container-x py-20 sm:py-28">
          <SectionHeading eyebrow="The Journal" title="Fabric guides & inspiration" href="/journal" linkLabel="Read the journal" />
          <div className="grid gap-10 md:grid-cols-3">
            {posts.map((post, i) => (
              <Reveal key={post.id} delay={i * 0.06}>
                <Link href={`/journal/${post.slug}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-cream">
                    <FabricImage src={post.cover_image_url} alt={post.title} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
                  </div>
                  <p className="mt-5 text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">
                    {post.category?.name} · {post.reading_minutes} min read
                  </p>
                  <h3 className="mt-2 font-serif text-2xl leading-snug group-hover:text-wine">{post.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
                  <p className="mt-3 text-xs text-muted-foreground">{formatDate(post.published_at)}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* I. Newsletter */}
      <section className="bg-cream">
        <div className="container-x grid items-center gap-10 py-20 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Stay in touch</p>
            <h2 className="mt-4 text-4xl sm:text-5xl">{homepage.newsletter_heading}</h2>
            <p className="mt-4 max-w-md leading-7 text-muted-foreground">{homepage.newsletter_text}</p>
          </div>
          <NewsletterForm source="homepage" />
        </div>
      </section>
    </>
  );
}
