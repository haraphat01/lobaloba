import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/ui";
import { ProductEditor, type EditableProduct } from "@/components/admin/product-editor";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export default function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <Loader params={params} />
    </Suspense>
  );
}

async function Loader({ params }: Pick<PageProps<"/admin/products/[id]">, "params">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = createAdminClient();
  const [{ data: p }, { data: categories }] = await Promise.all([
    db
      .from("products")
      .select("*, product_colours(id, name, hex, sort_order), product_images(id, url, storage_path, alt, colour_id, sort_order), product_variants(id, name, sku, colour_id, price_override, is_active, sort_order, inventory(quantity))")
      .eq("id", id)
      .maybeSingle(),
    db.from("categories").select("id, name").order("sort_order"),
  ]);
  if (!p) notFound();
  const colours = [...p.product_colours].sort((a, b) => a.sort_order - b.sort_order);
  const colourName = (cid: string | null) => colours.find((c) => c.id === cid)?.name ?? "";
  const product: EditableProduct = {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku ?? "",
    categoryId: p.category_id ?? "",
    shortDescription: p.short_description ?? "",
    description: p.description ?? "",
    careInstructions: p.care_instructions ?? "",
    fabricType: p.fabric_type ?? "",
    price: String(p.price),
    compareAtPrice: p.compare_at_price === null ? "" : String(p.compare_at_price),
    currency: p.currency,
    purchaseUnit: p.purchase_unit as EditableProduct["purchaseUnit"],
    unitLabel: p.unit_label ?? "",
    minQuantity: String(p.min_quantity),
    maxQuantity: p.max_quantity === null ? "" : String(p.max_quantity),
    lowStockThreshold: String(p.low_stock_threshold),
    status: p.status as EditableProduct["status"],
    isFeatured: p.is_featured,
    isNewArrival: p.is_new_arrival,
    isBestseller: p.is_bestseller,
    tags: p.tags.join(", "),
    seoTitle: p.seo_title ?? "",
    seoDescription: p.seo_description ?? "",
    faqs: (Array.isArray(p.faqs) ? p.faqs : []) as { question: string; answer: string }[],
    colours: colours.map((c) => ({ id: c.id, name: c.name, hex: c.hex })),
    variants: [...p.product_variants]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku ?? "",
        colourName: colourName(v.colour_id),
        priceOverride: v.price_override === null ? "" : String(v.price_override),
        isActive: v.is_active,
        stock: String((v.inventory as { quantity: number } | null)?.quantity ?? 0),
      })),
    images: [...p.product_images]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((im) => ({ id: im.id, url: im.url, storagePath: im.storage_path ?? "", alt: im.alt ?? "", colourName: colourName(im.colour_id) })),
  };
  return (
    <>
      <AdminHeader title={p.name} description={p.is_demo ? "Demo product — removable from Settings → Demo data." : undefined} />
      <ProductEditor categories={categories ?? []} product={product} />
    </>
  );
}
