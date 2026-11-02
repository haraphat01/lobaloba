import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { AdminHeader, ButtonLink, Table, Td } from "@/components/admin/ui";
import { ReviewModeration } from "@/components/admin/review-moderation";
import { FabricImage } from "@/components/shared/fabric-image";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatMoney, unitLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  return (
    <>
      <AdminHeader
        title="Products & stock"
        description="Manage catalogue, pricing, purchase units, variants, inventory and reviews."
        actions={
          <ButtonLink href="/admin/products/new">
            <Plus className="size-4" /> Add product
          </ButtonLink>
        }
      />
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <ProductList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ProductList({ searchParams }: Pick<PageProps<"/admin/products">, "searchParams">) {
  await requireAdmin();
  const sp = await searchParams;
  const tab = sp.tab === "reviews" ? "reviews" : "products";
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const stock = typeof sp.stock === "string" ? sp.stock : "";
  const db = createAdminClient();

  const tabs = (
    <div className="mb-5 flex gap-1 border-b border-border text-sm">
      {[
        ["products", "Products"],
        ["reviews", "Reviews"],
      ].map(([k, l]) => (
        <Link key={k} href={`/admin/products?tab=${k}`} className={cn("-mb-px border-b-2 px-4 py-2", tab === k ? "border-wine text-wine" : "border-transparent text-muted-foreground")}>
          {l}
        </Link>
      ))}
    </div>
  );

  if (tab === "reviews") {
    const { data: reviews } = await db.from("reviews").select("id, author_name, rating, title, body, is_approved, is_verified_purchase, created_at, products(name)").order("is_approved").order("created_at", { ascending: false }).limit(100);
    return (
      <>
        {tabs}
        <ReviewModeration
          reviews={(reviews ?? []).map((r) => ({ ...r, product: (r.products as unknown as { name: string } | null)?.name ?? "—" }))}
        />
      </>
    );
  }

  let query = db
    .from("product_listing")
    .select("id, name, slug, price, currency, purchase_unit, unit_label, status, category_name, total_stock, low_stock_threshold, is_featured, is_new_arrival, is_bestseller, is_demo, images")
    .order("created_at", { ascending: false })
    .limit(200);
  if (q) query = query.ilike("name", `%${q.replace(/[%_]/g, "")}%`);
  if (status) query = query.eq("status", status);
  if (stock === "out") query = query.eq("total_stock", 0);
  const { data } = await query;
  let products = (data ?? []).map((p) => ({
    ...p,
    id: p.id!,
    name: p.name ?? "",
    currency: p.currency ?? "NGN",
    purchase_unit: p.purchase_unit ?? "per_item",
    total_stock: p.total_stock ?? 0,
    low_stock_threshold: p.low_stock_threshold ?? 5,
  }));
  if (stock === "low") products = products.filter((p) => p.total_stock > 0 && p.total_stock <= p.low_stock_threshold);

  return (
    <>
      {tabs}
      <form className="mb-4 flex flex-wrap gap-2 text-sm">
        <input name="q" defaultValue={q} placeholder="Search products" className="rounded-sm border border-border bg-card px-3 py-2" />
        <select name="status" defaultValue={status} className="rounded-sm border border-border bg-card px-3 py-2">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select name="stock" defaultValue={stock} className="rounded-sm border border-border bg-card px-3 py-2">
          <option value="">All stock levels</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
        <button type="submit" className="rounded-sm bg-ink px-4 text-ivory">Filter</button>
      </form>
      <Table head={["", "Product", "Category", "Price", "Stock", "Flags", "Status"]} empty={products.length === 0}>
        {products.map((p) => (
          <tr key={p.id} className="hover:bg-cream/40">
            <Td className="w-14">
              <div className="relative h-14 w-11 bg-cream">
                <FabricImage src={((p.images as { url: string }[]) ?? [])[0]?.url} alt="" fill sizes="44px" className="object-cover" />
              </div>
            </Td>
            <Td>
              <Link href={`/admin/products/${p.id}`} className="font-medium text-wine hover:underline">
                {p.name}
              </Link>
              {p.is_demo && <span className="ml-2 rounded-sm bg-amber-100 px-1.5 py-0.5 text-[0.6rem] text-amber-900 uppercase">Demo</span>}
            </Td>
            <Td>{p.category_name}</Td>
            <Td>
              {formatMoney(p.price, p.currency)}
              <span className="block text-xs text-muted-foreground">{unitLabel(p.purchase_unit, p.unit_label)}</span>
            </Td>
            <Td className={p.total_stock === 0 ? "text-destructive" : p.total_stock <= p.low_stock_threshold ? "text-amber-700" : ""}>{p.total_stock}</Td>
            <Td className="text-xs">{[p.is_featured && "Featured", p.is_new_arrival && "New", p.is_bestseller && "Bestseller"].filter(Boolean).join(" · ")}</Td>
            <Td className="capitalize">{p.status}</Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
