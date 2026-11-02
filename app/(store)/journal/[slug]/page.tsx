import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/shared/page-header";
import { FabricImage } from "@/components/shared/fabric-image";
import { JsonLd } from "@/components/shared/json-ld";
import { Skeleton } from "@/components/ui/skeleton";
import { getBlogPost, getBlogPosts } from "@/lib/data/content";
import { renderMarkdown } from "@/lib/markdown";
import { formatDate } from "@/lib/format";
import { siteUrl } from "@/lib/site-url";

export async function generateMetadata({ params }: PageProps<"/journal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Article not found" };
  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt || undefined,
    alternates: { canonical: `/journal/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.excerpt ?? undefined, images: post.cover_image_url ? [post.cover_image_url] : undefined, publishedTime: post.published_at ?? undefined, authors: [post.author_name] },
  };
}

export default function ArticlePage({ params }: PageProps<"/journal/[slug]">) {
  return (
    <Suspense fallback={<div className="container-x py-14"><Skeleton className="h-96 rounded-none" /></div>}>
      <Article params={params} />
    </Suspense>
  );
}

async function Article({ params }: Pick<PageProps<"/journal/[slug]">, "params">) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();
  const related = (await getBlogPosts({ category: post.category?.slug, limit: 4 })).filter((p) => p.id !== post.id).slice(0, 3);
  const site = siteUrl;
  const url = `${site}/journal/${post.slug}`;
  const share = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${post.title} ${url}`)}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { label: "X", href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.title)}` },
    { label: "Pinterest", href: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(post.title)}` },
  ];

  return (
    <article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt,
          image: post.cover_image_url ? (post.cover_image_url.startsWith("http") ? post.cover_image_url : `${site}${post.cover_image_url}`) : undefined,
          datePublished: post.published_at,
          dateModified: post.updated_at,
          author: { "@type": "Person", name: post.author_name },
          publisher: { "@type": "Organization", name: "Lobaloba Deluxe" },
          mainEntityOfPage: url,
        }}
      />
      <header className="container-x max-w-4xl pt-10 text-center">
        <div className="flex justify-center">
          <Breadcrumbs items={[{ label: "Journal", href: "/journal" }, { label: post.title }]} />
        </div>
        <p className="eyebrow mt-10">{post.category?.name}</p>
        <h1 className="mt-4 text-5xl leading-[1.05] sm:text-6xl">{post.title}</h1>
        <p className="mt-5 text-sm text-muted-foreground">
          By {post.author_name} · {formatDate(post.published_at, { dateStyle: "long" })} · {post.reading_minutes} min read
        </p>
      </header>
      {post.cover_image_url && (
        <div className="container-x mt-10 max-w-6xl">
          <div className="relative aspect-[16/8] overflow-hidden bg-cream">
            <FabricImage src={post.cover_image_url} alt={post.title} fill priority sizes="(min-width: 1280px) 1152px, 100vw" className="object-cover" />
          </div>
        </div>
      )}
      <div className="container-x max-w-3xl py-14">
        <div className="prose-lux" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />
        <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-border pt-8 text-xs tracking-[0.16em] uppercase">
          Share:
          {share.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="border border-border px-3 py-1.5 hover:border-wine hover:text-wine">
              {s.label}
            </a>
          ))}
        </div>
        {post.author_bio && (
          <div className="mt-10 bg-card p-6">
            <p className="font-serif text-xl">{post.author_name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{post.author_bio}</p>
          </div>
        )}
      </div>
      {related.length > 0 && (
        <section className="container-x border-t border-border py-14">
          <h2 className="mb-8 text-4xl">Related articles</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {related.map((r) => (
              <Link key={r.id} href={`/journal/${r.slug}`} className="group">
                <div className="relative aspect-[4/3] overflow-hidden bg-cream">
                  <FabricImage src={r.cover_image_url} alt={r.title} fill sizes="33vw" className="object-cover transition duration-700 group-hover:scale-105" />
                </div>
                <h3 className="mt-4 font-serif text-2xl group-hover:text-wine">{r.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
