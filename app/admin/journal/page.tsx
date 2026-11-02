import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { AdminHeader, ButtonLink, Panel, Table, Td } from "@/components/admin/ui";
import { FaqManager } from "@/components/admin/faq-manager";
import { PostRowActions } from "@/components/admin/post-row-actions";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/format";

export default function JournalAdminPage() {
  return (
    <>
      <AdminHeader title="Journal & FAQs" actions={<ButtonLink href="/admin/journal/new"><Plus className="size-4" /> New article</ButtonLink>} />
      <Suspense>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  await requireAdmin();
  const db = createAdminClient();
  const [{ data: posts }, { data: faqs }] = await Promise.all([
    db.from("blog_posts").select("id, title, slug, status, published_at, is_demo, blog_categories(name)").order("created_at", { ascending: false }),
    db.from("faqs").select("*").order("sort_order"),
  ]);
  return (
    <div className="space-y-8">
      <Table head={["Article", "Category", "Status", "Published", ""]} empty={!posts?.length}>
        {(posts ?? []).map((p) => (
          <tr key={p.id}>
            <Td>
              <Link href={`/admin/journal/${p.id}`} className="font-medium text-wine hover:underline">{p.title}</Link>
              {p.is_demo && <span className="ml-2 rounded-sm bg-amber-100 px-1.5 text-[0.6rem] text-amber-900 uppercase">Demo</span>}
            </Td>
            <Td>{(p.blog_categories as unknown as { name: string } | null)?.name}</Td>
            <Td className="capitalize">{p.status}</Td>
            <Td>{formatDate(p.published_at)}</Td>
            <Td><PostRowActions id={p.id} status={p.status as "draft" | "published"} slug={p.slug} /></Td>
          </tr>
        ))}
      </Table>
      <Panel title="Frequently asked questions">
        <FaqManager faqs={(faqs ?? []).map((f) => ({ id: f.id, question: f.question, answer: f.answer, category: f.category, sortOrder: f.sort_order, isActive: f.is_active }))} />
      </Panel>
    </div>
  );
}
