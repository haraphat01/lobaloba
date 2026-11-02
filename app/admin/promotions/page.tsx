import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/ui";
import { CouponManager } from "@/components/admin/coupon-manager";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const local = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

export default function PromotionsPage() {
  return (
    <>
      <AdminHeader title="Promotions" description="Discount codes: percentage or fixed, product- or category-specific, with minimums, limits and expiry dates." />
      <Suspense>
        <Loader />
      </Suspense>
    </>
  );
}

async function Loader() {
  await requireAdmin();
  const db = createAdminClient();
  const [{ data: coupons }, { data: products }, { data: categories }] = await Promise.all([
    db.from("coupons").select("*").order("created_at", { ascending: false }),
    db.from("products").select("id, name").eq("status", "active").order("name"),
    db.from("categories").select("id, name").order("sort_order"),
  ]);
  return (
    <CouponManager
      products={products ?? []}
      categories={categories ?? []}
      coupons={(coupons ?? []).map((c) => ({
        id: c.id,
        code: c.code,
        description: c.description ?? "",
        discountType: c.discount_type as "percentage" | "fixed",
        value: String(c.value),
        minOrderAmount: String(c.min_order_amount),
        maxDiscount: c.max_discount === null ? "" : String(c.max_discount),
        productIds: c.product_ids,
        categoryIds: c.category_ids,
        startsAt: local(c.starts_at),
        expiresAt: local(c.expires_at),
        usageLimit: c.usage_limit === null ? "" : String(c.usage_limit),
        perCustomerLimit: c.per_customer_limit === null ? "" : String(c.per_customer_limit),
        isActive: c.is_active,
        usedCount: c.used_count,
      }))}
    />
  );
}
