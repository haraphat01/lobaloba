import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { QuotationEditor } from "@/components/admin/quotation-editor";
import { StatusBadge } from "@/components/account/status-badge";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatDateTime } from "@/lib/format";

export default function QuotationPage({ params }: PageProps<"/admin/quotations/[id]">) {
  return (
    <Suspense>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: Pick<PageProps<"/admin/quotations/[id]">, "params">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = createAdminClient();
  const [{ data: q }, { data: products }] = await Promise.all([
    db.from("quotation_requests").select("*, quotation_items(*), asoebi_packages(name), orders:order_id(id, order_number, payment_status)").eq("id", id).maybeSingle(),
    db.from("products").select("id, name, price").eq("status", "active").order("name"),
  ]);
  if (!q) notFound();
  const order = q.orders as unknown as { id: string; order_number: string; payment_status: string } | null;
  const pkg = q.asoebi_packages as unknown as { name: string } | null;
  const info: [string, unknown][] = [
    ["Type", q.request_type],
    ["Package", pkg?.name],
    ["Company", q.company_name],
    ["Event", q.event_type],
    ["Event date", q.event_date && formatDate(q.event_date)],
    ["Guests", q.guest_count],
    ["Category", q.preferred_category],
    ["Colours", q.preferred_colours],
    ["Budget", q.budget],
    ["Quantity", q.required_quantity],
    ["Delivery", q.delivery_location],
    ["Availability check", q.needs_availability_check ? "Requested" : null],
  ];

  return (
    <>
      <AdminHeader title={q.reference} description={`Received ${formatDateTime(q.created_at)}`} actions={<StatusBadge status={q.status} kind="other" />} />
      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <QuotationEditor
          quote={{
            id: q.id,
            status: q.status,
            currency: q.currency,
            items: [...q.quotation_items].sort((a, b) => a.sort_order - b.sort_order).map((i) => ({ productId: i.product_id ?? "", description: i.description, colour: i.colour ?? "", quantity: String(i.quantity), unitPrice: String(i.unit_price) })),
            discount: String(q.discount_amount),
            deliveryFee: String(q.delivery_fee),
            validUntil: q.valid_until ?? "",
            message: q.quote_message ?? "",
            adminNotes: q.admin_notes ?? "",
            accessToken: q.access_token,
          }}
          products={(products ?? []).map((p) => ({ id: p.id, name: p.name, price: Number(p.price) }))}
          order={order}
        />
        <div className="space-y-6">
          <Panel title="Customer">
            <p className="text-sm font-medium">{q.full_name}</p>
            <p className="text-sm"><a className="text-wine underline" href={`mailto:${q.email}`}>{q.email}</a></p>
            <p className="text-sm">{q.phone}</p>
          </Panel>
          <Panel title="Request details">
            <dl className="space-y-1.5 text-sm">
              {info.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right">{String(v)}</dd>
                </div>
              ))}
            </dl>
            {q.details && <p className="mt-3 border-t border-border pt-3 text-sm whitespace-pre-line">{q.details}</p>}
          </Panel>
          {q.request_type === "asoebi" && (
            <Panel title="Event page">
              <p className="text-sm text-muted-foreground">Create a shareable event page so guests can order and pay individually.</p>
              <Link href={`/admin/asoebi/new?quotation=${q.id}`} className="mt-2 inline-block text-sm text-wine underline">Create event page from this request</Link>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
