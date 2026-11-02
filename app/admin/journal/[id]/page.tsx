import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/ui";
import { PostEditor } from "@/components/admin/post-editor";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Handles both /admin/journal/new and /admin/journal/<id>.
export default function PostPage({ params }: PageProps<"/admin/journal/[id]">) {
  return (
    <Suspense>
      <Loader params={params} />
    </Suspense>
  );
}

async function Loader({ params }: Pick<PageProps<"/admin/journal/[id]">, "params">) {
  await requireAdmin();
  const { id } = await params;
  const db = createAdminClient();
  const { data: categories } = await db.from("blog_categories").select("id, name").order("sort_order");
  if (id === "new") {
    return (
      <>
        <AdminHeader title="New article" />
        <PostEditor categories={categories ?? []} post={{ title: "", slug: "", excerpt: "", content: "", coverImageUrl: "", categoryId: "", authorName: "Lobaloba Editorial", authorBio: "", status: "draft", publishedAt: "", seoTitle: "", seoDescription: "" }} />
      </>
    );
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: p } = await db.from("blog_posts").select("*").eq("id", id).maybeSingle();
  if (!p) notFound();
  return (
    <>
      <AdminHeader title={p.title} />
      <PostEditor
        categories={categories ?? []}
        post={{ id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt ?? "", content: p.content, coverImageUrl: p.cover_image_url ?? "", categoryId: p.category_id ?? "", authorName: p.author_name, authorBio: p.author_bio ?? "", status: p.status as "draft" | "published", publishedAt: p.published_at ? p.published_at.slice(0, 16) : "", seoTitle: p.seo_title ?? "", seoDescription: p.seo_description ?? "" }}
      />
    </>
  );
}
