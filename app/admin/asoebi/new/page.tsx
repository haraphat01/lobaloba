import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/ui";
import { EventEditor } from "@/components/admin/event-editor";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default function NewEventPage({ searchParams }: PageProps<"/admin/asoebi/new">) {
  return (
    <>
      <AdminHeader title="New Asoebi event page" />
      <Suspense>
        <Loader searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Loader({ searchParams }: Pick<PageProps<"/admin/asoebi/new">, "searchParams">) {
  await requireAdmin();
  const sp = await searchParams;
  const db = createAdminClient();
  const quotationId = typeof sp.quotation === "string" ? sp.quotation : "";
  const [{ data: products }, { data: quote }] = await Promise.all([
    db.from("products").select("id, name, price").eq("status", "active").order("name"),
    quotationId ? db.from("quotation_requests").select("id, full_name, email, phone, event_type, event_date, guest_count, quotation_items(product_id, unit_price)").eq("id", quotationId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return (
    <EventEditor
      products={(products ?? []).map((p) => ({ ...p, price: Number(p.price) }))}
      event={{
        title: quote ? `${quote.full_name}'s ${quote.event_type ?? "celebration"}` : "",
        slug: "",
        eventType: quote?.event_type ?? "Wedding",
        eventDate: quote?.event_date ?? "",
        orderDeadline: "",
        description: "",
        guestInstructions: "Choose your fabric and colour below, enter your details and pay securely. You will receive an email confirmation and can track your order at any time.",
        coverImageUrl: "",
        coordinatorName: quote?.full_name ?? "",
        coordinatorEmail: quote?.email ?? "",
        coordinatorPhone: quote?.phone ?? "",
        expectedGuests: quote?.guest_count ? String(quote.guest_count) : "",
        deliveryMode: "collective",
        collectiveDeliveryNote: "",
        isPublished: false,
        quotationId: quote?.id ?? "",
        products: (quote?.quotation_items ?? []).filter((i) => i.product_id).map((i) => ({ productId: i.product_id!, packageLabel: "", priceOverride: Number(i.unit_price) > 0 ? String(i.unit_price) : "", notes: "" })),
      }}
    />
  );
}
