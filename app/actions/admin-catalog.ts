"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email/send";
import { emailTemplates } from "@/lib/email/templates";
import { slugify } from "@/lib/format";
import { fieldErrors, type ActionResult } from "@/lib/validation";

const slug = z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens");
const money = z.coerce.number().min(0).max(1_000_000_000);
const optMoney = z.union([z.literal(""), z.null(), z.undefined(), money]).transform((v) => (v === "" || v === undefined || v === null ? null : Number(v)));
const optUuid = z.union([z.literal(""), z.null(), z.undefined(), z.string().uuid()]).transform((v) => (v ? v : null));
const text = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : null));

// ---------------------------------------------------------------------------
// Media uploads
// ---------------------------------------------------------------------------
const MAX_UPLOAD = 5 * 1024 * 1024;
const SIGNATURES: { type: string; ext: string; test: (b: Uint8Array) => boolean }[] = [
  { type: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: "image/png", ext: "png", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { type: "image/webp", ext: "webp", test: (b) => String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP" },
  { type: "image/avif", ext: "avif", test: (b) => String.fromCharCode(...b.slice(4, 12)).startsWith("ftypavi") },
];

/** Validates (size + magic bytes, not just the declared MIME type) and stores an image. */
export async function uploadImage(formData: FormData): Promise<ActionResult<{ url: string; path: string }>> {
  await requireAdmin();
  const file = formData.get("file");
  const folder = String(formData.get("folder") ?? "misc").replace(/[^a-z0-9-]/gi, "").slice(0, 40) || "misc";
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image to upload." };
  if (file.size > MAX_UPLOAD) return { ok: false, error: "Images must be 5 MB or smaller." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const sig = SIGNATURES.find((s) => s.test(bytes));
  if (!sig) return { ok: false, error: "Only JPEG, PNG, WebP or AVIF images are allowed." };

  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${sig.ext}`;
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from("media").upload(path, bytes, { contentType: sig.type, cacheControl: "31536000", upsert: false });
  if (error) return { ok: false, error: `Upload failed: ${error.message}` };
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return { ok: true, data: { url: data.publicUrl, path } };
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(160),
  slug,
  sku: text(60),
  categoryId: optUuid,
  shortDescription: text(400),
  description: text(20000),
  careInstructions: text(2000),
  fabricType: text(80),
  price: money,
  compareAtPrice: optMoney,
  currency: z.string().trim().length(3).toUpperCase().default("NGN"),
  purchaseUnit: z.enum(["per_yard", "bundle_4_yard", "bundle_5_yard", "per_item", "per_set", "custom"]),
  unitLabel: text(60),
  minQuantity: z.coerce.number().int().min(1).max(1000),
  maxQuantity: z.union([z.literal(""), z.null(), z.undefined(), z.coerce.number().int().min(1)]).transform((v) => (v === "" || v == null ? null : Number(v))),
  lowStockThreshold: z.coerce.number().int().min(0).max(10000),
  status: z.enum(["draft", "active", "archived"]),
  isFeatured: z.boolean(),
  isNewArrival: z.boolean(),
  isBestseller: z.boolean(),
  tags: z.array(z.string().trim().min(1).max(40)).max(30),
  seoTitle: text(160),
  seoDescription: text(320),
  faqs: z.array(z.object({ question: z.string().trim().min(1).max(300), answer: z.string().trim().min(1).max(2000) })).max(20),
  colours: z.array(z.object({ id: z.string().uuid().optional(), name: z.string().trim().min(1).max(60), hex: z.string().regex(/^#[0-9a-fA-F]{6}$/) })).max(40),
  variants: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(1).max(80),
        sku: text(60),
        colourName: text(60),
        priceOverride: optMoney,
        isActive: z.boolean(),
        stock: z.coerce.number().int().min(0).max(1_000_000),
      }),
    )
    .min(1, "Add at least one variant")
    .max(100),
  images: z.array(z.object({ id: z.string().uuid().optional(), url: z.string().trim().min(1).max(1000), storagePath: text(500), alt: text(200), colourName: text(60) })).max(30),
});

export type ProductInput = z.input<typeof productSchema>;

export async function saveProduct(input: ProductInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid product", fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  if (d.purchaseUnit === "custom" && !d.unitLabel) return { ok: false, error: "Enter a unit label for a custom purchase unit.", fieldErrors: { unitLabel: "Required" } };
  const colourNames = new Set(d.colours.map((c) => c.name.toLowerCase()));
  if (colourNames.size !== d.colours.length) return { ok: false, error: "Colour names must be unique." };

  const supabase = createAdminClient();
  const row = {
    name: d.name,
    slug: d.slug,
    sku: d.sku,
    category_id: d.categoryId,
    short_description: d.shortDescription,
    description: d.description,
    care_instructions: d.careInstructions,
    fabric_type: d.fabricType,
    price: d.price,
    compare_at_price: d.compareAtPrice,
    currency: d.currency,
    purchase_unit: d.purchaseUnit,
    unit_label: d.unitLabel,
    min_quantity: d.minQuantity,
    max_quantity: d.maxQuantity,
    low_stock_threshold: d.lowStockThreshold,
    status: d.status,
    is_featured: d.isFeatured,
    is_new_arrival: d.isNewArrival,
    is_bestseller: d.isBestseller,
    tags: d.tags,
    seo_title: d.seoTitle,
    seo_description: d.seoDescription,
    faqs: d.faqs,
  };

  const { data: saved, error } = d.id
    ? await supabase.from("products").update(row).eq("id", d.id).select("id, slug").single()
    : await supabase.from("products").insert(row).select("id, slug").single();
  if (error || !saved) {
    if (error?.code === "23505") return { ok: false, error: "That slug or SKU is already in use.", fieldErrors: { slug: "Already in use" } };
    return { ok: false, error: error?.message ?? "Could not save product." };
  }
  const productId = saved.id;

  // Colours
  const { data: existingColours } = await supabase.from("product_colours").select("id").eq("product_id", productId);
  const keepColourIds = d.colours.filter((c) => c.id).map((c) => c.id!);
  const removeColours = (existingColours ?? []).map((c) => c.id).filter((id) => !keepColourIds.includes(id));
  if (removeColours.length) await supabase.from("product_colours").delete().in("id", removeColours);
  const colourIdByName = new Map<string, string>();
  for (const [i, c] of d.colours.entries()) {
    const payload = { product_id: productId, name: c.name, hex: c.hex, sort_order: i };
    const res = c.id
      ? await supabase.from("product_colours").update(payload).eq("id", c.id).select("id").single()
      : await supabase.from("product_colours").insert(payload).select("id").single();
    if (res.data) colourIdByName.set(c.name.toLowerCase(), res.data.id);
  }

  // Variants and inventory (track restocks for "notify me" emails)
  const { data: existingVariants } = await supabase.from("product_variants").select("id, inventory(quantity)").eq("product_id", productId);
  const previousStock = new Map((existingVariants ?? []).map((v) => [v.id, (v.inventory as { quantity: number } | null)?.quantity ?? 0]));
  const wasOutOfStock = [...previousStock.values()].reduce((s, q) => s + q, 0) === 0;
  const keepVariantIds = d.variants.filter((v) => v.id).map((v) => v.id!);
  const removeVariants = [...previousStock.keys()].filter((id) => !keepVariantIds.includes(id));
  if (removeVariants.length) await supabase.from("product_variants").delete().in("id", removeVariants);

  const restockedVariants: string[] = [];
  for (const [i, v] of d.variants.entries()) {
    const payload = {
      product_id: productId,
      name: v.name,
      sku: v.sku,
      colour_id: v.colourName ? (colourIdByName.get(v.colourName.toLowerCase()) ?? null) : null,
      price_override: v.priceOverride,
      is_active: v.isActive,
      sort_order: i,
    };
    const res = v.id
      ? await supabase.from("product_variants").update(payload).eq("id", v.id).select("id").single()
      : await supabase.from("product_variants").insert(payload).select("id").single();
    if (res.error) return { ok: false, error: res.error.code === "23505" ? `Variant SKU "${v.sku}" is already in use.` : res.error.message };
    await supabase.from("inventory").upsert({ variant_id: res.data.id, quantity: v.stock }, { onConflict: "variant_id" });
    if ((previousStock.get(res.data.id) ?? 0) === 0 && v.stock > 0 && v.id) restockedVariants.push(res.data.id);
  }

  // Images
  const { data: existingImages } = await supabase.from("product_images").select("id").eq("product_id", productId);
  const keepImageIds = d.images.filter((im) => im.id).map((im) => im.id!);
  const removeImages = (existingImages ?? []).map((im) => im.id).filter((id) => !keepImageIds.includes(id));
  if (removeImages.length) await supabase.from("product_images").delete().in("id", removeImages);
  for (const [i, im] of d.images.entries()) {
    const payload = {
      product_id: productId,
      url: im.url,
      storage_path: im.storagePath,
      alt: im.alt || d.name,
      colour_id: im.colourName ? (colourIdByName.get(im.colourName.toLowerCase()) ?? null) : null,
      sort_order: i,
    };
    if (im.id) await supabase.from("product_images").update(payload).eq("id", im.id);
    else await supabase.from("product_images").insert(payload);
  }

  const totalStock = d.variants.reduce((s, v) => s + v.stock, 0);
  if (d.status === "active" && (restockedVariants.length || (wasOutOfStock && totalStock > 0 && d.id))) {
    await sendRestockEmails(productId, d.name, saved.slug, restockedVariants);
  }

  updateTag("products");
  updateTag(`product:${saved.slug}`);
  return { ok: true, data: { id: productId }, message: "Product saved." };
}

async function sendRestockEmails(productId: string, name: string, productSlug: string, variantIds: string[]) {
  const supabase = createAdminClient();
  let query = supabase.from("restock_notifications").select("id, email, variant_id").eq("product_id", productId).is("notified_at", null);
  if (variantIds.length) query = query.or(`variant_id.is.null,variant_id.in.(${variantIds.join(",")})`);
  const { data: waiting } = await query;
  if (!waiting?.length) return;
  const email = emailTemplates.restock({ productName: name, productUrl: `${env.siteUrl()}/products/${productSlug}`, site: env.siteUrl() });
  for (const w of waiting) await sendEmail({ to: w.email, subject: email.subject, html: email.html });
  await supabase.from("restock_notifications").update({ notified_at: new Date().toISOString() }).in("id", waiting.map((w) => w.id));
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid product" };
  const supabase = createAdminClient();
  const { count } = await supabase.from("order_items").select("id", { count: "exact", head: true }).eq("product_id", id);
  // Products with order history are archived rather than deleted to keep reporting intact.
  const { error } = (count ?? 0) > 0 ? await supabase.from("products").update({ status: "archived" }).eq("id", id) : await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  updateTag("products");
  return { ok: true, message: (count ?? 0) > 0 ? "Product has orders, so it was archived instead of deleted." : "Product deleted." };
}

export async function quickUpdateStock(variantId: string, quantity: number): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z.object({ variantId: z.string().uuid(), quantity: z.number().int().min(0).max(1_000_000) }).safeParse({ variantId, quantity });
  if (!parsed.success) return { ok: false, error: "Invalid quantity" };
  const supabase = createAdminClient();
  await supabase.from("inventory").upsert({ variant_id: variantId, quantity }, { onConflict: "variant_id" });
  updateTag("products");
  return { ok: true };
}

export async function moderateReview(id: string, action: "approve" | "hide" | "delete"): Promise<ActionResult> {
  await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid review" };
  const supabase = createAdminClient();
  if (action === "delete") await supabase.from("reviews").delete().eq("id", id);
  else await supabase.from("reviews").update({ is_approved: action === "approve" }).eq("id", id);
  updateTag("products");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Categories and collections
// ---------------------------------------------------------------------------
const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(80),
  slug,
  description: text(500),
  imageUrl: text(1000),
  sortOrder: z.coerce.number().int().min(0).max(1000),
  isActive: z.boolean(),
  seoTitle: text(160),
  seoDescription: text(320),
});

export async function saveCategory(input: z.input<typeof categorySchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categorySchema.safeParse({ ...input, slug: input.slug || slugify(String(input.name ?? "")) });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid category", fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const row = { name: d.name, slug: d.slug, description: d.description, image_url: d.imageUrl, sort_order: d.sortOrder, is_active: d.isActive, seo_title: d.seoTitle, seo_description: d.seoDescription };
  const supabase = createAdminClient();
  const { error } = d.id ? await supabase.from("categories").update(row).eq("id", d.id) : await supabase.from("categories").insert(row);
  if (error) return { ok: false, error: error.code === "23505" ? "That slug is already in use." : error.message };
  updateTag("categories");
  updateTag("products");
  return { ok: true, message: "Category saved." };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", id);
  if ((count ?? 0) > 0) return { ok: false, error: `Move or delete the ${count} product(s) in this category first, or mark it inactive.` };
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  updateTag("categories");
  return { ok: true };
}

const collectionSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(120),
  slug,
  subtitle: text(200),
  description: text(2000),
  imageUrl: text(1000),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(1000),
  productIds: z.array(z.string().uuid()).max(200),
});

export async function saveCollection(input: z.input<typeof collectionSchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = collectionSchema.safeParse({ ...input, slug: input.slug || slugify(String(input.title ?? "")) });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid collection" };
  const d = parsed.data;
  const supabase = createAdminClient();
  const row = { title: d.title, slug: d.slug, subtitle: d.subtitle, description: d.description, image_url: d.imageUrl, is_featured: d.isFeatured, is_active: d.isActive, sort_order: d.sortOrder };
  const { data, error } = d.id
    ? await supabase.from("collections").update(row).eq("id", d.id).select("id").single()
    : await supabase.from("collections").insert(row).select("id").single();
  if (error || !data) return { ok: false, error: error?.code === "23505" ? "That slug is already in use." : (error?.message ?? "Could not save") };
  await supabase.from("collection_products").delete().eq("collection_id", data.id);
  if (d.productIds.length) await supabase.from("collection_products").insert(d.productIds.map((product_id, i) => ({ collection_id: data.id, product_id, sort_order: i })));
  updateTag("collections");
  updateTag("products");
  return { ok: true, message: "Collection saved." };
}

export async function deleteCollection(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createAdminClient();
  await supabase.from("collections").delete().eq("id", id);
  updateTag("collections");
  return { ok: true };
}

/** Removes all demo products and articles created by the demo seed. */
export async function removeDemoData(): Promise<ActionResult> {
  const user = await requireAdmin();
  if (user.role !== "admin") return { ok: false, error: "Only administrators can remove demo data." };
  const supabase = createAdminClient();
  const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("is_demo", true);
  await supabase.from("products").delete().eq("is_demo", true);
  await supabase.from("blog_posts").delete().eq("is_demo", true);
  // Demo imagery is either bundled (/demo/…) or stock photos uploaded to media/demo-photos/.
  for (const pattern of ["/demo/%", "%/media/demo-photos/%"]) {
    await supabase.from("categories").update({ image_url: null }).like("image_url", pattern);
    await supabase.from("collections").update({ image_url: null }).like("image_url", pattern);
  }
  const { data: hero } = await supabase.from("site_settings").select("value").eq("key", "hero").maybeSingle();
  const heroValue = (hero?.value ?? {}) as Record<string, unknown>;
  const heroImage = String(heroValue.image_url ?? "");
  if (heroImage.startsWith("/demo/") || heroImage.includes("/media/demo-photos/")) {
    await supabase.from("site_settings").update({ value: { ...heroValue, image_url: "" } }).eq("key", "hero");
    updateTag("settings");
  }
  updateTag("products");
  updateTag("categories");
  updateTag("collections");
  updateTag("blog");
  return { ok: true, message: `Removed ${count ?? 0} demo products and all demo articles.` };
}
