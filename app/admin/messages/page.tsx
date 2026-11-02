import Link from "next/link";
import { Suspense } from "react";
import { AdminHeader, Table, Td } from "@/components/admin/ui";
import { MessageStatus } from "@/components/admin/message-status";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const TABS = [
  ["contact", "Contact messages"],
  ["samples", "Sample requests"],
  ["restock", "Restock alerts"],
  ["newsletter", "Newsletter"],
] as const;

export default function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  return (
    <>
      <AdminHeader title="Messages" />
      <Suspense>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Content({ searchParams }: Pick<PageProps<"/admin/messages">, "searchParams">) {
  await requireAdmin();
  const sp = await searchParams;
  const tab = TABS.find(([k]) => k === sp.tab)?.[0] ?? "contact";
  const db = createAdminClient();

  const nav = (
    <div className="mb-5 flex flex-wrap gap-1 border-b border-border text-sm">
      {TABS.map(([k, l]) => (
        <Link key={k} href={`/admin/messages?tab=${k}`} className={cn("-mb-px border-b-2 px-4 py-2", tab === k ? "border-wine text-wine" : "border-transparent text-muted-foreground")}>{l}</Link>
      ))}
    </div>
  );

  if (tab === "contact") {
    const { data } = await db.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(200);
    return (
      <>
        {nav}
        <Table head={["From", "Subject & message", "Received", "Status"]} empty={!data?.length}>
          {(data ?? []).map((m) => (
            <tr key={m.id} className={m.status === "new" ? "bg-cream/40" : ""}>
              <Td>{m.full_name}<span className="block text-xs"><a className="text-wine underline" href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}>{m.email}</a></span><span className="text-xs text-muted-foreground">{m.phone}</span></Td>
              <Td className="max-w-lg"><strong>{m.subject}</strong><p className="mt-1 text-xs whitespace-pre-line text-muted-foreground">{m.message}</p></Td>
              <Td className="text-xs whitespace-nowrap">{formatDateTime(m.created_at)}</Td>
              <Td><MessageStatus table="contact_messages" id={m.id} status={m.status} options={["new", "read", "replied", "archived"]} /></Td>
            </tr>
          ))}
        </Table>
      </>
    );
  }
  if (tab === "samples") {
    const { data } = await db.from("sample_requests").select("*, products(name)").order("created_at", { ascending: false }).limit(200);
    return (
      <>
        {nav}
        <Table head={["Customer", "Product", "Address", "Received", "Status"]} empty={!data?.length}>
          {(data ?? []).map((s) => (
            <tr key={s.id}>
              <Td>{s.full_name}<span className="block text-xs text-muted-foreground">{s.email} · {s.phone}</span></Td>
              <Td>{(s.products as unknown as { name: string } | null)?.name}{s.colour && <span className="block text-xs text-muted-foreground">{s.colour}</span>}</Td>
              <Td className="text-xs">{s.address}{s.notes && <p className="text-muted-foreground">“{s.notes}”</p>}</Td>
              <Td className="text-xs">{formatDateTime(s.created_at)}</Td>
              <Td><MessageStatus table="sample_requests" id={s.id} status={s.status} options={["new", "contacted", "sent", "closed"]} /></Td>
            </tr>
          ))}
        </Table>
      </>
    );
  }
  if (tab === "restock") {
    const { data } = await db.from("restock_notifications").select("*, products(name), product_variants(name)").order("created_at", { ascending: false }).limit(300);
    return (
      <>
        {nav}
        <p className="mb-3 text-xs text-muted-foreground">Customers are emailed automatically when you restock a sold-out product or variant.</p>
        <Table head={["Email", "Product", "Requested", "Notified"]} empty={!data?.length}>
          {(data ?? []).map((r) => (
            <tr key={r.id}>
              <Td>{r.email}</Td>
              <Td>{(r.products as unknown as { name: string } | null)?.name} {(r.product_variants as unknown as { name: string } | null)?.name && `— ${(r.product_variants as unknown as { name: string }).name}`}</Td>
              <Td className="text-xs">{formatDateTime(r.created_at)}</Td>
              <Td className="text-xs">{r.notified_at ? formatDateTime(r.notified_at) : "Waiting"}</Td>
            </tr>
          ))}
        </Table>
      </>
    );
  }
  const { data } = await db.from("newsletter_subscribers").select("*").order("created_at", { ascending: false }).limit(1000);
  return (
    <>
      {nav}
      <p className="mb-3 text-sm">{(data ?? []).filter((s) => s.status === "subscribed").length} confirmed subscribers</p>
      <Table head={["Email", "Status", "Source", "Joined"]} empty={!data?.length}>
        {(data ?? []).map((s) => (
          <tr key={s.id}>
            <Td>{s.email}</Td>
            <Td className="capitalize">{s.status}</Td>
            <Td>{s.source}</Td>
            <Td className="text-xs">{formatDateTime(s.created_at)}</Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
