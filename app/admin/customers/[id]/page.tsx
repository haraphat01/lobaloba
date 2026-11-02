import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminHeader, Panel, Table, Td } from "@/components/admin/ui";
import { CustomerAccess } from "@/components/admin/customer-access";
import { StatusBadge } from "@/components/account/status-badge";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatMoney } from "@/lib/format";

export default function CustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  return (
    <Suspense>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: Pick<PageProps<"/admin/customers/[id]">, "params">) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = createAdminClient();
  const [{ data: c }, { data: orders }, { data: addresses }] = await Promise.all([
    db.from("profiles").select("*, roles(name)").eq("id", id).maybeSingle(),
    db.from("orders").select("id, order_number, status, payment_status, total, currency, created_at").eq("user_id", id).order("created_at", { ascending: false }),
    db.from("addresses").select("*").eq("user_id", id),
  ]);
  if (!c) notFound();
  const spent = (orders ?? []).filter((o) => o.payment_status === "paid").reduce((s, o) => s + Number(o.total), 0);
  return (
    <>
      <AdminHeader title={c.full_name || c.email || "Customer"} description={`Joined ${formatDate(c.created_at)} · ${formatMoney(spent)} spent`} />
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Table head={["Order", "Status", "Payment", "Total", "Date"]} empty={!orders?.length}>
          {(orders ?? []).map((o) => (
            <tr key={o.id}>
              <Td>
                <Link href={`/admin/orders/${o.id}`} className="text-wine hover:underline">{o.order_number}</Link>
              </Td>
              <Td><StatusBadge status={o.status} /></Td>
              <Td><StatusBadge status={o.payment_status} kind="other" /></Td>
              <Td>{formatMoney(o.total, o.currency)}</Td>
              <Td>{formatDate(o.created_at)}</Td>
            </tr>
          ))}
        </Table>
        <div className="space-y-6">
          <Panel title="Contact">
            <p className="text-sm">{c.email}</p>
            <p className="text-sm">{c.phone}</p>
            <p className="mt-2 text-xs text-muted-foreground">Marketing emails: {c.marketing_opt_in ? "Yes" : "No"}</p>
          </Panel>
          <Panel title="Addresses">
            {!addresses?.length ? (
              <p className="text-sm text-muted-foreground">No saved addresses.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {addresses.map((a) => (
                  <li key={a.id}>
                    <strong>{a.label}</strong>: {a.address_line}, {a.city}, {a.state}, {a.country} · {a.phone}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Account access">
            <CustomerAccess userId={c.id} isActive={c.is_active} role={(c.roles as unknown as { name: "customer" | "staff" | "admin" }).name} canManage={admin.role === "admin" && admin.id !== c.id} />
          </Panel>
        </div>
      </div>
    </>
  );
}
