import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminHeader, Panel, Stat, Table, Td } from "@/components/admin/ui";
import { EventEditor } from "@/components/admin/event-editor";
import { StatusBadge } from "@/components/account/status-badge";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime, formatMoney } from "@/lib/format";

export default function EventAdminPage({ params }: PageProps<"/admin/asoebi/[id]">) {
  return (
    <Suspense>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: Pick<PageProps<"/admin/asoebi/[id]">, "params">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = createAdminClient();
  const [{ data: e }, { data: products }] = await Promise.all([
    db
      .from("asoebi_events")
      .select("*, asoebi_event_products(*), asoebi_guest_orders(*, orders(id, order_number, status, payment_status, total, currency, shipping_address, order_items(product_name, variant_name, quantity)))")
      .eq("id", id)
      .maybeSingle(),
    db.from("products").select("id, name, price").neq("status", "archived").order("name"),
  ]);
  if (!e) notFound();

  type GuestOrder = { id: string; order_number: string; status: string; payment_status: string; total: number; currency: string; shipping_address: { address_line?: string; city?: string; state?: string }; order_items: { product_name: string; variant_name: string | null; quantity: number }[] };
  const guests = e.asoebi_guest_orders.map((g) => ({ ...g, order: g.orders as unknown as GuestOrder }));
  const paid = guests.filter((g) => g.order.payment_status === "paid");
  const qty = paid.reduce((s, g) => s + g.order.order_items.reduce((a, i) => a + i.quantity, 0), 0);
  const byVariant = new Map<string, number>();
  for (const g of paid) for (const i of g.order.order_items) byVariant.set(`${i.product_name} — ${i.variant_name ?? ""}`, (byVariant.get(`${i.product_name} — ${i.variant_name ?? ""}`) ?? 0) + i.quantity);

  return (
    <>
      <AdminHeader title={e.title} description={`Guest link: /asoebi/events/${e.slug}`} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-6">
        <Stat label="Expected guests" value={e.expected_guests ?? "—"} />
        <Stat label="Guest orders" value={guests.length} />
        <Stat label="Paid" value={paid.length} />
        <Stat label="Unpaid" value={guests.length - paid.length} />
        <Stat label="Units ordered" value={qty} hint="Paid orders" />
        <Stat label="Revenue" value={formatMoney(paid.reduce((s, g) => s + Number(g.order.total), 0))} />
      </div>
      {byVariant.size > 0 && (
        <Panel title="Quantities by fabric & colour" className="mb-6">
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {[...byVariant].map(([k, v]) => (
              <li key={k} className="flex justify-between border-b border-border/50 py-1"><span>{k}</span><strong>{v}</strong></li>
            ))}
          </ul>
        </Panel>
      )}
      <div className="mb-8">
        <Table head={["Guest", "Order", "Items", "Delivery", "Payment", "Total", "Placed"]} empty={guests.length === 0}>
          {guests.map((g) => (
            <tr key={g.id}>
              <Td>
                {g.guest_name}
                <span className="block text-xs text-muted-foreground">{g.guest_phone} · {g.guest_email}</span>
              </Td>
              <Td><Link href={`/admin/orders/${g.order.id}`} className="text-wine hover:underline">{g.order.order_number}</Link></Td>
              <Td className="text-xs">{g.order.order_items.map((i) => `${i.variant_name ?? i.product_name} ×${i.quantity}`).join(", ")}</Td>
              <Td className="text-xs">{g.delivery_preference === "collective" ? "Collective" : [g.order.shipping_address.address_line, g.order.shipping_address.city, g.order.shipping_address.state].filter(Boolean).join(", ")}</Td>
              <Td><StatusBadge status={g.order.payment_status} kind="other" /></Td>
              <Td>{formatMoney(g.order.total, g.order.currency)}</Td>
              <Td className="text-xs">{formatDateTime(g.created_at)}</Td>
            </tr>
          ))}
        </Table>
      </div>
      <EventEditor
        products={(products ?? []).map((p) => ({ ...p, price: Number(p.price) }))}
        event={{
          id: e.id,
          title: e.title,
          slug: e.slug,
          eventType: e.event_type ?? "",
          eventDate: e.event_date ?? "",
          orderDeadline: e.order_deadline ? new Date(e.order_deadline).toISOString().slice(0, 16) : "",
          description: e.description ?? "",
          guestInstructions: e.guest_instructions ?? "",
          coverImageUrl: e.cover_image_url ?? "",
          coordinatorName: e.coordinator_name ?? "",
          coordinatorEmail: e.coordinator_email ?? "",
          coordinatorPhone: e.coordinator_phone ?? "",
          expectedGuests: e.expected_guests === null ? "" : String(e.expected_guests),
          deliveryMode: e.delivery_mode as "individual" | "collective" | "both",
          collectiveDeliveryNote: e.collective_delivery_note ?? "",
          isPublished: e.is_published,
          quotationId: e.quotation_id ?? "",
          products: [...e.asoebi_event_products].sort((a, b) => a.sort_order - b.sort_order).map((p) => ({ productId: p.product_id, packageLabel: p.package_label ?? "", priceOverride: p.price_override === null ? "" : String(p.price_override), notes: p.notes ?? "" })),
        }}
      />
    </>
  );
}
