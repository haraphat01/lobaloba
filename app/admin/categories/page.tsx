import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/ui";
import { CategoryManager } from "@/components/admin/category-manager";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default function CategoriesPage() {
  return (
    <>
      <AdminHeader title="Categories" description="Shown in navigation, the homepage and shop filters, in display order." />
      <Suspense>
        <Loader />
      </Suspense>
    </>
  );
}

async function Loader() {
  await requireAdmin();
  const { data } = await createAdminClient().from("categories").select("*, products(count)").order("sort_order");
  return (
    <CategoryManager
      categories={(data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description ?? "",
        imageUrl: c.image_url ?? "",
        sortOrder: c.sort_order,
        isActive: c.is_active,
        seoTitle: c.seo_title ?? "",
        seoDescription: c.seo_description ?? "",
        productCount: (c.products as unknown as { count: number }[])[0]?.count ?? 0,
      }))}
    />
  );
}
