import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/ui";
import { ShippingManager } from "@/components/admin/shipping-manager";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default function ShippingPage() {
  return (
    <>
      <AdminHeader title="Shipping" description="Zones match a customer's country/state. A zone listing specific states takes priority over a country-wide zone. Pickup zones are always offered in their countries." />
      <Suspense>
        <Loader />
      </Suspense>
    </>
  );
}

async function Loader() {
  await requireAdmin();
  const { data } = await createAdminClient().from("shipping_zones").select("*, shipping_rates(*)").order("sort_order");
  const s = (v: number | null) => (v === null ? "" : String(v));
  return (
    <ShippingManager
      zones={(data ?? []).map((z) => ({
        id: z.id,
        name: z.name,
        description: z.description ?? "",
        zoneType: z.zone_type as "domestic" | "international" | "pickup",
        countries: z.countries.join(", "),
        states: z.states.join(", "),
        requiresQuote: z.requires_quote,
        sortOrder: z.sort_order,
        isActive: z.is_active,
        rates: [...z.shipping_rates].sort((a, b) => a.sort_order - b.sort_order).map((r) => ({ id: r.id, name: r.name, description: r.description ?? "", fee: String(r.fee), freeOver: s(r.free_over), minDays: s(r.min_days), maxDays: s(r.max_days), isActive: r.is_active })),
      }))}
    />
  );
}
