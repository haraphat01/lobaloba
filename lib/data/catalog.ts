import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { env } from "@/lib/env";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  purchaseUnit: string;
  unitLabel: string | null;
  fabricType: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  totalStock: number;
  lowStockThreshold: number;
  colours: { name: string; hex: string }[];
  images: { url: string; alt: string }[];
  isNewArrival: boolean;
  isBestseller: boolean;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "bestselling", label: "Bestselling" },
  { value: "alphabetical", label: "Alphabetical" },
] as const;

export type ShopFilters = {
  q?: string;
  category?: string;
  collection?: string;
  colours?: string[];
  fabrics?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  newArrivals?: boolean;
  bestsellers?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
};

type ListingRow = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  currency: string;
  purchase_unit: string;
  unit_label: string | null;
  fabric_type: string | null;
  category_name: string | null;
  category_slug: string | null;
  total_stock: number;
  low_stock_threshold: number;
  colours: unknown;
  images: unknown;
  is_new_arrival: boolean;
  is_bestseller: boolean;
  is_featured: boolean;
  rating: number;
  review_count: number;
};

const LISTING_COLUMNS =
  "id, name, slug, price, compare_at_price, currency, purchase_unit, unit_label, fabric_type, category_name, category_slug, total_stock, low_stock_threshold, colours, images, is_new_arrival, is_bestseller, is_featured, rating, review_count";

function toCard(row: ListingRow): ProductCardData {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price === null ? null : Number(row.compare_at_price),
    currency: row.currency,
    purchaseUnit: row.purchase_unit,
    unitLabel: row.unit_label,
    fabricType: row.fabric_type,
    categoryName: row.category_name,
    categorySlug: row.category_slug,
    totalStock: row.total_stock ?? 0,
    lowStockThreshold: row.low_stock_threshold ?? 5,
    colours: (row.colours as ProductCardData["colours"]) ?? [],
    images: (row.images as ProductCardData["images"]) ?? [],
    isNewArrival: row.is_new_arrival,
    isBestseller: row.is_bestseller,
    isFeatured: row.is_featured,
    rating: Number(row.rating ?? 0),
    reviewCount: row.review_count ?? 0,
  };
}

function db() {
  return createPublicClient();
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheTag("categories");
  cacheLife("hours");
  if (!env.isSupabaseConfigured()) return [];
  const { data, error } = await db()
    .from("categories")
    .select("id, name, slug, description, image_url, seo_title, seo_description")
    .eq("is_active", true)
    .order("sort_order");
  if (error) console.error("[catalog] categories", error.message);
  return data ?? [];
}

export async function getCategoryBySlug(slug: string) {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

/** Product grid query with filtering, sorting and pagination. */
export async function getProducts(filters: ShopFilters = {}) {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  const pageSize = Math.min(Math.max(filters.pageSize ?? 12, 1), 48);
  const page = Math.max(filters.page ?? 1, 1);
  if (!env.isSupabaseConfigured()) return { products: [], total: 0, page, pageSize, pageCount: 0 };

  const supabase = db();
  let searchIds: string[] | null = null;
  if (filters.q && filters.q.trim()) {
    const { data } = await supabase.rpc("search_products", { p_query: filters.q.trim().slice(0, 100), p_limit: 200 });
    searchIds = (data ?? []).map((r) => r.id);
    if (searchIds.length === 0) return { products: [], total: 0, page, pageSize, pageCount: 0 };
  }

  let collectionIds: string[] | null = null;
  if (filters.collection) {
    const { data } = await supabase
      .from("collections")
      .select("collection_products(product_id, sort_order)")
      .eq("slug", filters.collection)
      .maybeSingle();
    collectionIds = (data?.collection_products ?? []).map((cp) => cp.product_id);
    if (collectionIds.length === 0) return { products: [], total: 0, page, pageSize, pageCount: 0 };
  }

  let query = supabase.from("product_listing").select(LISTING_COLUMNS, { count: "exact" }).eq("status", "active");

  if (searchIds) query = query.in("id", searchIds);
  if (collectionIds) query = query.in("id", collectionIds);
  if (filters.category) query = query.eq("category_slug", filters.category);
  if (filters.colours?.length) query = query.overlaps("colour_names", filters.colours);
  if (filters.fabrics?.length) query = query.in("fabric_type", filters.fabrics);
  if (filters.minPrice !== undefined) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte("price", filters.maxPrice);
  if (filters.inStock) query = query.gt("total_stock", 0);
  if (filters.newArrivals) query = query.eq("is_new_arrival", true);
  if (filters.bestsellers) query = query.eq("is_bestseller", true);

  switch (filters.sort) {
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "price-asc":
      query = query.order("price", { ascending: true });
      break;
    case "price-desc":
      query = query.order("price", { ascending: false });
      break;
    case "bestselling":
      query = query.order("sales_count", { ascending: false });
      break;
    case "alphabetical":
      query = query.order("name", { ascending: true });
      break;
    default:
      query = query.order("is_featured", { ascending: false }).order("sales_count", { ascending: false });
  }
  query = query.order("id");

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);
  if (error) {
    console.error("[catalog] products", error.message);
    return { products: [], total: 0, page, pageSize, pageCount: 0 };
  }

  let products = (data as ListingRow[]).map(toCard);
  // Preserve relevance order for searches when no explicit sort was chosen.
  if (searchIds && (!filters.sort || filters.sort === "featured")) {
    const order = new Map(searchIds.map((id, i) => [id, i]));
    products = products.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }
  const total = count ?? products.length;
  return { products, total, page, pageSize, pageCount: Math.ceil(total / pageSize) };
}

export async function getProductsByIds(ids: string[]) {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");
  if (!ids.length || !env.isSupabaseConfigured()) return [];
  const { data } = await db().from("product_listing").select(LISTING_COLUMNS).in("id", ids).eq("status", "active");
  const byId = new Map((data as ListingRow[] | null)?.map((r) => [r.id, toCard(r)]) ?? []);
  return ids.map((id) => byId.get(id)).filter((p): p is ProductCardData => !!p);
}

/** Facet values for the filter sidebar. */
export async function getShopFacets() {
  "use cache";
  cacheTag("products");
  cacheLife("hours");
  if (!env.isSupabaseConfigured()) return { colours: [], fabrics: [], maxPrice: 0 };
  const { data } = await db().from("product_listing").select("colour_names, fabric_type, price").eq("status", "active");
  const colours = new Set<string>();
  const fabrics = new Set<string>();
  let maxPrice = 0;
  for (const row of data ?? []) {
    (row.colour_names ?? []).forEach((c: string) => colours.add(c));
    if (row.fabric_type) fabrics.add(row.fabric_type);
    maxPrice = Math.max(maxPrice, Number(row.price));
  }
  return {
    colours: [...colours].sort(),
    fabrics: [...fabrics].sort(),
    maxPrice,
  };
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export async function getProductBySlug(slug: string) {
  "use cache";
  cacheTag("products", `product:${slug}`);
  cacheLife("minutes");
  if (!env.isSupabaseConfigured()) return null;

  const { data, error } = await db()
    .from("products")
    .select(
      `id, name, slug, sku, short_description, description, care_instructions, fabric_type, price, compare_at_price, currency,
       purchase_unit, unit_label, min_quantity, max_quantity, low_stock_threshold, is_new_arrival, is_bestseller, is_featured,
       faqs, seo_title, seo_description, created_at, category_id,
       categories(name, slug),
       product_images(id, url, alt, sort_order, colour_id),
       product_colours(id, name, hex, sort_order),
       product_variants(id, name, sku, colour_id, price_override, is_active, sort_order, inventory(quantity))`,
    )
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error) console.error("[catalog] product", error.message);
  if (!data) return null;

  const { data: reviews } = await db()
    .from("reviews")
    .select("id, author_name, rating, title, body, is_verified_purchase, created_at")
    .eq("product_id", data.id)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(20);

  const images = [...data.product_images].sort((a, b) => a.sort_order - b.sort_order);
  const colours = [...data.product_colours].sort((a, b) => a.sort_order - b.sort_order);
  const variants = data.product_variants
    .filter((v) => v.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      colourId: v.colour_id,
      price: v.price_override !== null ? Number(v.price_override) : Number(data.price),
      stock: (v.inventory as { quantity: number } | null)?.quantity ?? 0,
    }));

  const reviewList = reviews ?? [];
  const rating = reviewList.length ? reviewList.reduce((s, r) => s + r.rating, 0) / reviewList.length : 0;

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    sku: data.sku,
    shortDescription: data.short_description,
    description: data.description,
    careInstructions: data.care_instructions,
    fabricType: data.fabric_type,
    price: Number(data.price),
    compareAtPrice: data.compare_at_price === null ? null : Number(data.compare_at_price),
    currency: data.currency,
    purchaseUnit: data.purchase_unit,
    unitLabel: data.unit_label,
    minQuantity: data.min_quantity,
    maxQuantity: data.max_quantity,
    lowStockThreshold: data.low_stock_threshold,
    isNewArrival: data.is_new_arrival,
    isBestseller: data.is_bestseller,
    faqs: (Array.isArray(data.faqs) ? data.faqs : []) as { question: string; answer: string }[],
    seoTitle: data.seo_title,
    seoDescription: data.seo_description,
    categoryId: data.category_id,
    category: data.categories as { name: string; slug: string } | null,
    images: images.map((i) => ({ id: i.id, url: i.url, alt: i.alt ?? data.name, colourId: i.colour_id })),
    colours: colours.map((c) => ({ id: c.id, name: c.name, hex: c.hex })),
    variants,
    totalStock: variants.reduce((s, v) => s + v.stock, 0),
    reviews: reviewList,
    rating,
  };
}

export async function getRelatedProducts(productId: string, categorySlug: string | null) {
  const { products } = await getProducts({ category: categorySlug ?? undefined, pageSize: 9, sort: "bestselling" });
  return products.filter((p) => p.id !== productId).slice(0, 8);
}

export type Collection = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  is_featured: boolean;
};

export async function getCollections(): Promise<Collection[]> {
  "use cache";
  cacheTag("collections");
  cacheLife("hours");
  if (!env.isSupabaseConfigured()) return [];
  const { data } = await db()
    .from("collections")
    .select("id, title, slug, subtitle, description, image_url, is_featured")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

export async function getCollectionBySlug(slug: string) {
  const all = await getCollections();
  return all.find((c) => c.slug === slug) ?? null;
}

/** Lightweight index used by search suggestions. */
export async function getSearchIndex() {
  "use cache";
  cacheTag("products", "categories");
  cacheLife("hours");
  if (!env.isSupabaseConfigured()) return [];
  const { data } = await db()
    .from("product_listing")
    .select("name, slug, category_name, fabric_type, colour_names, price, currency, images")
    .eq("status", "active");
  return (data ?? []).map((r) => ({
    name: r.name as string,
    slug: r.slug as string,
    category: r.category_name as string | null,
    fabric: r.fabric_type as string | null,
    colours: (r.colour_names ?? []) as string[],
    price: Number(r.price),
    currency: r.currency as string,
    image: ((r.images as { url: string }[] | null) ?? [])[0]?.url ?? null,
  }));
}
