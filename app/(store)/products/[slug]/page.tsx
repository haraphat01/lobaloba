import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Star } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumbs } from "@/components/shared/page-header";
import { JsonLd } from "@/components/shared/json-ld";
import { ProductShowcase } from "@/components/store/product-showcase";
import { ProductAssistance, ReviewForm } from "@/components/store/product-extras";
import { ProductGrid } from "@/components/store/product-card";
import { RecentlyViewed } from "@/components/store/recently-viewed";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/catalog";
import { getSettings } from "@/lib/data/settings";
import { renderMarkdown } from "@/lib/markdown";
import { formatDate } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product not found" };
  const image = p.images[0]?.url;
  return {
    title: p.seoTitle || `${p.name}${p.category ? ` — ${p.category.name}` : ""}`,
    description: p.seoDescription || p.shortDescription || undefined,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { type: "website", title: p.name, description: p.shortDescription ?? undefined, images: image ? [{ url: image, alt: p.images[0].alt }] : undefined },
  };
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: Pick<PageProps<"/products/[slug]">, "params">) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!product) notFound();
  const related = await getRelatedProducts(product.id, product.category?.slug ?? null);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          sku: product.sku ?? undefined,
          description: product.shortDescription ?? product.description ?? undefined,
          image: product.images.map((i) => (i.url.startsWith("http") ? i.url : `${siteUrl}${i.url}`)),
          category: product.category?.name,
          brand: { "@type": "Brand", name: "Lobaloba Deluxe" },
          offers: {
            "@type": "Offer",
            url: `${siteUrl}/products/${product.slug}`,
            priceCurrency: product.currency,
            price: product.price,
            availability: product.totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
          ...(product.reviews.length
            ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating.toFixed(1), reviewCount: product.reviews.length } }
            : {}),
        }}
      />

      <div className="container-x py-8">
        <Breadcrumbs
          items={[
            { label: "Shop", href: "/shop" },
            ...(product.category ? [{ label: product.category.name, href: `/shop/${product.category.slug}` }] : []),
            { label: product.name },
          ]}
        />
      </div>

      <section className="container-x pb-16">
        <ProductShowcase product={product}>
          <div className="mb-6">
            <p className="eyebrow">{product.category?.name}</p>
            <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">{product.name}</h1>
            {product.reviews.length > 0 && (
              <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-wine">
                <Stars rating={product.rating} /> {product.rating.toFixed(1)} · {product.reviews.length} review{product.reviews.length > 1 ? "s" : ""}
              </a>
            )}
            {product.shortDescription && <p className="mt-4 leading-7 text-charcoal">{product.shortDescription}</p>}
            {product.fabricType && (
              <p className="mt-3 text-xs tracking-[0.14em] text-muted-foreground uppercase">
                Fabric: <span className="text-ink">{product.fabricType}</span>
                {product.sku && <> · SKU {product.sku}</>}
              </p>
            )}
          </div>
        </ProductShowcase>
        <div className="lg:ml-auto lg:w-[calc(46.5%-2rem)]">
          <ProductAssistance productId={product.id} productName={product.name} colours={product.colours.map((c) => c.name)} whatsapp={settings.business.whatsapp} />
        </div>
      </section>

      <section className="border-t border-border bg-card">
        <div className="container-x grid gap-12 py-16 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="eyebrow">The details</p>
            <h2 className="mt-3 text-4xl">About this piece</h2>
          </div>
          <Accordion type="multiple" defaultValue={["description"]} className="w-full">
            <AccordionItem value="description">
              <AccordionTrigger className="font-serif text-xl">Description</AccordionTrigger>
              <AccordionContent>
                <div className="prose-lux" dangerouslySetInnerHTML={{ __html: renderMarkdown(product.description ?? "") }} />
              </AccordionContent>
            </AccordionItem>
            {product.careInstructions && (
              <AccordionItem value="care">
                <AccordionTrigger className="font-serif text-xl">Fabric care</AccordionTrigger>
                <AccordionContent className="leading-7 text-charcoal">{product.careInstructions}</AccordionContent>
              </AccordionItem>
            )}
            <AccordionItem value="delivery">
              <AccordionTrigger className="font-serif text-xl">Delivery & returns</AccordionTrigger>
              <AccordionContent>
                <div className="prose-lux text-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(settings.policies.shipping.split("\n\n").slice(0, 3).join("\n\n")) }} />
                <p className="mt-3 text-sm">
                  <a href="/shipping" className="text-wine underline">Shipping information</a> · <a href="/returns" className="text-wine underline">Returns policy</a>
                </p>
              </AccordionContent>
            </AccordionItem>
            {product.faqs.length > 0 && (
              <AccordionItem value="faqs">
                <AccordionTrigger className="font-serif text-xl">Questions</AccordionTrigger>
                <AccordionContent>
                  <dl className="space-y-4">
                    {product.faqs.map((f) => (
                      <div key={f.question}>
                        <dt className="font-medium">{f.question}</dt>
                        <dd className="mt-1 text-charcoal">{f.answer}</dd>
                      </div>
                    ))}
                  </dl>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </section>

      <section id="reviews" className="container-x grid gap-12 py-16 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="eyebrow">Reviews</p>
          <h2 className="mt-3 text-4xl">What customers say</h2>
          {product.reviews.length > 0 && (
            <p className="mt-4 flex items-center gap-3">
              <Stars rating={product.rating} /> <span className="font-serif text-2xl">{product.rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">from {product.reviews.length} review{product.reviews.length > 1 ? "s" : ""}</span>
            </p>
          )}
          <div className="mt-8">
            <ReviewForm productId={product.id} />
          </div>
        </div>
        <div>
          {product.reviews.length === 0 ? (
            <p className="text-muted-foreground">No reviews yet — be the first to share your thoughts.</p>
          ) : (
            <ul className="divide-y divide-border">
              {product.reviews.map((r) => (
                <li key={r.id} className="py-6">
                  <Stars rating={r.rating} />
                  {r.title && <p className="mt-2 font-serif text-xl">{r.title}</p>}
                  <p className="mt-2 leading-7 text-charcoal">{r.body}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {r.author_name} · {formatDate(r.created_at)}
                    {r.is_verified_purchase && <span className="ml-2 text-wine">Verified purchase</span>}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="container-x border-t border-border py-16">
          <h2 className="mb-10 text-4xl">You may also love</h2>
          <ProductGrid products={related.slice(0, 4)} />
        </section>
      )}
      <RecentlyViewed excludeId={product.id} />
    </>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={n <= Math.round(rating) ? "size-4 fill-gold text-gold" : "size-4 text-border"} />
      ))}
    </span>
  );
}

function ProductSkeleton() {
  return (
    <div className="container-x grid gap-12 py-16 lg:grid-cols-2">
      <Skeleton className="aspect-[4/5] rounded-none" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
