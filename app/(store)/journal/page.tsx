import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { FabricImage } from "@/components/shared/fabric-image";
import { Skeleton } from "@/components/ui/skeleton";
import { getBlogCategories, getBlogPosts } from "@/lib/data/content";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "The Journal — fabric guides & wedding inspiration",
  description: "Fabric guides, bridal inspiration, Asoebi planning and styling notes from Lobaloba Deluxe.",
  alternates: { canonical: "/journal" },
};

export default function JournalPage({ searchParams }: PageProps<"/journal">) {
  return (
    <>
      <PageHeader crumbs={[{ label: "Journal" }]} eyebrow="Stories & guides" title="The Journal" description="Fabric know-how, wedding inspiration and Asoebi planning from our stylists." />
      <Suspense fallback={<div className="container-x py-14"><Skeleton className="h-96 rounded-none" /></div>}>
        <JournalList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function JournalList({ searchParams }: Pick<PageProps<"/journal">, "searchParams">) {
  const sp = await searchParams;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const [categories, posts] = await Promise.all([getBlogCategories(), getBlogPosts({ category, q })]);

  return (
    <div className="container-x py-12">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Journal categories" className="flex flex-wrap gap-2">
          <Link href="/journal" className={cn("rounded-full border px-4 py-1.5 text-xs", !category ? "border-wine bg-wine text-ivory" : "border-border hover:border-wine")}>
            All
          </Link>
          {categories.map((c) => (
            <Link key={c.slug} href={`/journal?category=${c.slug}`} className={cn("rounded-full border px-4 py-1.5 text-xs", category === c.slug ? "border-wine bg-wine text-ivory" : "border-border hover:border-wine")}>
              {c.name}
            </Link>
          ))}
        </nav>
        <form action="/journal" className="flex border-b border-ink/40">
          <input name="q" defaultValue={q} placeholder="Search articles" aria-label="Search articles" className="h-10 bg-transparent text-sm outline-none" />
          <button type="submit" className="text-xs tracking-[0.18em] text-wine uppercase">Search</button>
        </form>
      </div>
      {posts.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">No articles found.</p>
      ) : (
        <div className="grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <Link key={post.id} href={`/journal/${post.slug}`} className={cn("group block", i === 0 && !category && !q && "md:col-span-2")}>
              <div className={cn("relative overflow-hidden bg-cream", i === 0 && !category && !q ? "aspect-[16/9]" : "aspect-[4/3]")}>
                <FabricImage src={post.cover_image_url} alt={post.title} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
              </div>
              <p className="mt-5 text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">
                {post.category?.name} · {post.reading_minutes} min read · {formatDate(post.published_at)}
              </p>
              <h2 className="mt-2 font-serif text-3xl leading-tight group-hover:text-wine">{post.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
