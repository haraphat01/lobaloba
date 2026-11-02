import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { siteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = siteUrl;
  const statics = ["", "/shop", "/new-arrivals", "/collections", "/asoebi", "/wholesale", "/journal", "/about", "/contact", "/help", "/faq", "/shipping", "/returns", "/fabric-care", "/yardage-guide", "/privacy", "/terms", "/track"].map(
    (path) => ({ url: `${site}${path}`, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.6 }),
  );
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return statics;

  const db = createPublicClient();
  const [products, categories, collections, posts] = await Promise.all([
    db.from("products").select("slug, updated_at").eq("status", "active"),
    db.from("categories").select("slug, updated_at").eq("is_active", true),
    db.from("collections").select("slug, updated_at").eq("is_active", true),
    db.from("blog_posts").select("slug, updated_at").eq("status", "published"),
  ]);
  return [
    ...statics,
    ...(categories.data ?? []).map((c) => ({ url: `${site}/shop/${c.slug}`, lastModified: c.updated_at, priority: 0.8 })),
    ...(collections.data ?? []).map((c) => ({ url: `${site}/collections/${c.slug}`, lastModified: c.updated_at, priority: 0.7 })),
    ...(products.data ?? []).map((p) => ({ url: `${site}/products/${p.slug}`, lastModified: p.updated_at, priority: 0.9 })),
    ...(posts.data ?? []).map((p) => ({ url: `${site}/journal/${p.slug}`, lastModified: p.updated_at, priority: 0.5 })),
  ];
}
