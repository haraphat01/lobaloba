import Link from "next/link";
import { Suspense } from "react";
import { AdminHeader, Table, Td } from "@/components/admin/ui";
import { StatusBadge } from "@/components/account/status-badge";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatMoney, QUOTATION_STATUSES, titleCase } from "@/lib/format";

export default function QuotationsPage({ searchParams }: PageProps<"/admin/quotations">) {
  return (
    <>
      <AdminHeader title="Quotations" description="Asoebi quotation requests and wholesale enquiries." />
      <Suspense>
        <List searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function List({ searchParams }: Pick<PageProps<"/admin/quotations">, "searchParams">) {
  await requireAdmin();
  const sp = await searchParams;
  const type = typeof sp.type === "string" ? sp.type : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  let q = createAdminClient().from("quotation_requests").select("id, reference, request_type, full_name, email, phone, event_type, event_date, guest_count, status, total, currency, created_at").order("created_at", { ascending: false }).limit(300);
  if (type) q = q.eq("request_type", type);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return (
    <>
      <form className="mb-4 flex gap-2 text-sm">
        <select name="type" defaultValue={type} className="rounded-sm border border-border bg-card px-3 py-2">
          <option value="">All types</option>
          <option value="asoebi">Asoebi</option>
          <option value="wholesale">Wholesale</option>
        </select>
        <select name="status" defaultValue={status} className="rounded-sm border border-border bg-card px-3 py-2">
          <option value="">All statuses</option>
          {QUOTATION_STATUSES.map((s) => (
            <option key={s} value={s}>{titleCase(s)}</option>
          ))}
        </select>
        <button type="submit" className="rounded-sm bg-wine px-4 text-onyx">Filter</button>
      </form>
      <Table head={["Reference", "Customer", "Type", "Event", "Status", "Total", "Received"]} empty={!data?.length}>
        {(data ?? []).map((r) => (
          <tr key={r.id} className="hover:bg-cream/40">
            <Td>
              <Link href={`/admin/quotations/${r.id}`} className="font-medium text-wine hover:underline">{r.reference}</Link>
            </Td>
            <Td>
              {r.full_name}
              <span className="block text-xs text-muted-foreground">{r.phone}</span>
            </Td>
            <Td className="capitalize">{r.request_type}</Td>
            <Td className="text-xs">
              {[r.event_type, r.event_date && formatDate(r.event_date), r.guest_count && `${r.guest_count} guests`].filter(Boolean).join(" · ")}
            </Td>
            <Td><StatusBadge status={r.status} kind="other" /></Td>
            <Td>{Number(r.total) > 0 ? formatMoney(r.total, r.currency) : "—"}</Td>
            <Td>{formatDate(r.created_at)}</Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
