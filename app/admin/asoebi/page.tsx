import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { AdminHeader, ButtonLink, Panel, Table, Td } from "@/components/admin/ui";
import { PackageEditor } from "@/components/admin/package-editor";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatMoney } from "@/lib/format";

export default function AsoebiAdminPage() {
  return (
    <>
      <AdminHeader
        title="Asoebi events"
        description="Event pages let coordinators share one link so every guest selects and pays independently."
        actions={
          <ButtonLink href="/admin/asoebi/new">
            <Plus className="size-4" /> New event page
          </ButtonLink>
        }
      />
      <Suspense>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  await requireAdmin();
  const db = createAdminClient();
  const [{ data: events }, { data: packages }] = await Promise.all([
    db.from("asoebi_events").select("id, slug, title, event_date, order_deadline, is_published, expected_guests, asoebi_guest_orders(order_id, orders(payment_status, total))").order("event_date", { ascending: false }),
    db.from("asoebi_packages").select("*").order("sort_order"),
  ]);
  return (
    <div className="space-y-8">
      <Table head={["Event", "Date", "Order deadline", "Guests", "Paid", "Revenue", "Status"]} empty={!events?.length}>
        {(events ?? []).map((e) => {
          const orders = e.asoebi_guest_orders.map((g) => g.orders as unknown as { payment_status: string; total: number });
          const paid = orders.filter((o) => o?.payment_status === "paid");
          return (
            <tr key={e.id} className="hover:bg-cream/40">
              <Td>
                <Link href={`/admin/asoebi/${e.id}`} className="font-medium text-wine hover:underline">{e.title}</Link>
                <span className="block text-xs text-muted-foreground">/asoebi/events/{e.slug}</span>
              </Td>
              <Td>{formatDate(e.event_date)}</Td>
              <Td>{formatDate(e.order_deadline)}</Td>
              <Td>{orders.length}{e.expected_guests ? ` / ${e.expected_guests}` : ""}</Td>
              <Td>{paid.length}</Td>
              <Td>{formatMoney(paid.reduce((s, o) => s + Number(o.total), 0))}</Td>
              <Td>{e.is_published ? "Published" : "Draft"}</Td>
            </tr>
          );
        })}
      </Table>
      <Panel title="Coordination packages">
        <div className="grid gap-4 lg:grid-cols-3">
          {(packages ?? []).map((p) => (
            <PackageEditor
              key={p.id}
              pkg={{ id: p.id, name: p.name, tagline: p.tagline ?? "", description: p.description ?? "", includedServices: p.included_services.join("\n"), price: p.price === null ? "" : String(p.price), priceNote: p.price_note ?? "", isQuoteBased: p.is_quote_based, isActive: p.is_active }}
            />
          ))}
        </div>
      </Panel>
    </div>
  );
}
