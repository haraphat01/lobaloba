import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { env } from "@/lib/env";

export type BlogPostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  author_name: string;
  published_at: string | null;
  reading_minutes: number;
  category: { name: string; slug: string } | null;
};

const POST_SUMMARY = "id, title, slug, excerpt, cover_image_url, author_name, published_at, reading_minutes, blog_categories(name, slug)";

function mapSummary(row: Record<string, unknown>): BlogPostSummary {
  return {
    ...(row as unknown as BlogPostSummary),
    category: (row.blog_categories as BlogPostSummary["category"]) ?? null,
  };
}

export async function getBlogCategories() {
  "use cache";
  cacheTag("blog");
  cacheLife("hours");
  if (!env.isSupabaseConfigured()) return [];
  const { data } = await createPublicClient().from("blog_categories").select("id, name, slug").order("sort_order");
  return data ?? [];
}

export async function getBlogPosts({ category, q, limit = 24 }: { category?: string; q?: string; limit?: number } = {}) {
  "use cache";
  cacheTag("blog");
  cacheLife("minutes");
  if (!env.isSupabaseConfigured()) return [];
  let query = createPublicClient()
    .from("blog_posts")
    .select(category ? POST_SUMMARY.replace("blog_categories(", "blog_categories!inner(") : POST_SUMMARY)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (category) query = query.eq("blog_categories.slug", category);
  if (q) {
    const term = q.replace(/[%,()]/g, " ").trim().slice(0, 80);
    if (term) query = query.or(`title.ilike.%${term}%,excerpt.ilike.%${term}%,content.ilike.%${term}%`);
  }
  const { data, error } = await query;
  if (error) console.error("[content] posts", error.message);
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(mapSummary);
}

export async function getBlogPost(slug: string) {
  "use cache";
  cacheTag("blog", `post:${slug}`);
  cacheLife("minutes");
  if (!env.isSupabaseConfigured()) return null;
  const { data } = await createPublicClient()
    .from("blog_posts")
    .select(`${POST_SUMMARY}, content, author_bio, seo_title, seo_description, updated_at, category_id`)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!data) return null;
  const row = data as unknown as Record<string, unknown>;
  return {
    ...mapSummary(row),
    content: row.content as string,
    author_bio: row.author_bio as string | null,
    seo_title: row.seo_title as string | null,
    seo_description: row.seo_description as string | null,
    updated_at: row.updated_at as string,
    category_id: row.category_id as string | null,
  };
}

export async function getFaqs() {
  "use cache";
  cacheTag("faqs");
  cacheLife("hours");
  if (!env.isSupabaseConfigured()) return [];
  const { data } = await createPublicClient()
    .from("faqs")
    .select("id, question, answer, category")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

export async function getAsoebiPackages() {
  "use cache";
  cacheTag("asoebi");
  cacheLife("hours");
  if (!env.isSupabaseConfigured()) return [];
  const { data } = await createPublicClient()
    .from("asoebi_packages")
    .select("id, name, slug, tagline, description, included_services, price, price_note, is_quote_based")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

export async function getAsoebiEvent(slug: string) {
  "use cache";
  cacheTag("asoebi", `event:${slug}`);
  cacheLife("minutes");
  if (!env.isSupabaseConfigured()) return null;
  const { data } = await createPublicClient()
    .from("asoebi_events")
    .select(
      `id, slug, title, event_type, event_date, order_deadline, description, guest_instructions, cover_image_url,
       coordinator_name, delivery_mode, collective_delivery_note,
       asoebi_event_products(id, package_label, price_override, notes, sort_order, product_id)`,
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return data;
}

export async function getShippingOptions() {
  "use cache";
  cacheTag("shipping");
  cacheLife("hours");
  if (!env.isSupabaseConfigured()) return [];
  const { data } = await createPublicClient()
    .from("shipping_zones")
    .select("id, name, description, zone_type, countries, states, requires_quote, sort_order, shipping_rates(id, name, description, fee, free_over, min_days, max_days, sort_order, is_active)")
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []).map((z) => ({
    ...z,
    shipping_rates: z.shipping_rates.filter((r) => r.is_active).sort((a, b) => a.sort_order - b.sort_order),
  }));
}
