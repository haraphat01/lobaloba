import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/ui";
import { ProductEditor } from "@/components/admin/product-editor";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export default function NewProductPage() {
  return (
    <>
      <AdminHeader title="Add product" />
      <Suspense>
        <Loader />
      </Suspense>
    </>
  );
}

async function Loader() {
  await requireAdmin();
  const { data } = await createAdminClient().from("categories").select("id, name").order("sort_order");
  return <ProductEditor categories={data ?? []} product={null} />;
}
