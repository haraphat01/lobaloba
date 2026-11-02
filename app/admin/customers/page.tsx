import Link from "next/link";
import { Suspense } from "react";
import { AdminHeader, Table, Td } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatMoney } from "@/lib/format";

export default function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  return (
    <>
      <AdminHeader title="Customers" />
      <Suspense>
        <List searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function List({ searchParams }: Pick<PageProps<"/admin/customers">, "searchParams">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.replace(/[%,()]/g, " ").trim().slice(0, 80) : "";
  const db = createAdminClient();
  let query = db.from("profiles").select("id, email, full_name, phone, is_active, created_at, roles(name)").order("created_at", { ascending: false }).limit(300);
  if (q) query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%,phone.ilike.%${q}%`);
  const { data: customers } = await query;
  const ids = (customers ?? []).map((c) => c.id);
  const { data: orders } = ids.length ? await db.from("orders").select("user_id, total, payment_status").in("user_id", ids) : { data: [] };
  const stats = new Map<string, { count: number; spent: number }>();
  for (const o of orders ?? []) {
    const s = stats.get(o.user_id!) ?? { count: 0, spent: 0 };
    s.count += 1;
    if (o.payment_status === "paid") s.spent += Number(o.total);
    stats.set(o.user_id!, s);
  }

  return (
    <>
      <form className="mb-4 flex gap-2 text-sm">
        <input name="q" defaultValue={q} placeholder="Search name, email or phone" className="min-w-64 rounded-sm border border-border bg-card px-3 py-2" />
        <button type="submit" className="rounded-sm bg-ink px-4 text-ivory">Search</button>
      </form>
      <Table head={["Customer", "Phone", "Role", "Orders", "Total spent", "Joined", "Status"]} empty={!customers?.length}>
        {(customers ?? []).map((c) => (
          <tr key={c.id} className="hover:bg-cream/40">
            <Td>
              <Link href={`/admin/customers/${c.id}`} className="font-medium text-wine hover:underline">
                {c.full_name || "—"}
              </Link>
              <span className="block text-xs text-muted-foreground">{c.email}</span>
            </Td>
            <Td>{c.phone}</Td>
            <Td className="capitalize">{(c.roles as unknown as { name: string })?.name}</Td>
            <Td>{stats.get(c.id)?.count ?? 0}</Td>
            <Td>{formatMoney(stats.get(c.id)?.spent ?? 0)}</Td>
            <Td>{formatDate(c.created_at)}</Td>
            <Td>{c.is_active ? "Active" : <span className="text-destructive">Disabled</span>}</Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
