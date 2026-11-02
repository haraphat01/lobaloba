import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/ui";
import { CollectionManager } from "@/components/admin/collection-manager";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default function CollectionsAdminPage() {
  return (
    <>
      <AdminHeader title="Collections" description="Curated edits shown on the homepage and the Collections page." />
      <Suspense>
        <Loader />
      </Suspense>
    </>
  );
}

async function Loader() {
  await requireAdmin();
  const db = createAdminClient();
  const [{ data: cols }, { data: products }] = await Promise.all([
    db.from("collections").select("*, collection_products(product_id, sort_order)").order("sort_order"),
    db.from("products").select("id, name").neq("status", "archived").order("name"),
  ]);
  return (
    <CollectionManager
      products={products ?? []}
      collections={(cols ?? []).map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        subtitle: c.subtitle ?? "",
        description: c.description ?? "",
        imageUrl: c.image_url ?? "",
        isFeatured: c.is_featured,
        isActive: c.is_active,
        sortOrder: c.sort_order,
        productIds: [...c.collection_products].sort((a, b) => a.sort_order - b.sort_order).map((x) => x.product_id),
      }))}
    />
  );
}
