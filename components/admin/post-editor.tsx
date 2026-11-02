"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Panel, adminInput } from "@/components/admin/ui";
import { ImageUploadButton } from "@/components/admin/image-upload";
import { FabricImage } from "@/components/shared/fabric-image";
import { saveBlogPost } from "@/app/actions/admin-content";
import { readingMinutes, slugify } from "@/lib/format";

type Post = { id?: string; title: string; slug: string; excerpt: string; content: string; coverImageUrl: string; categoryId: string; authorName: string; authorBio: string; status: "draft" | "published"; publishedAt: string; seoTitle: string; seoDescription: string };

export function PostEditor({ post, categories }: { post: Post; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [p, setP] = useState(post);
  const [pending, start] = useTransition();
  const save = (status: Post["status"]) =>
    start(async () => {
      const res = await saveBlogPost({ ...p, status });
      if (!res.ok) return void toast.error(res.error);
      toast.success(res.message ?? "Saved");
      setP({ ...p, status });
      if (!p.id) router.replace(`/admin/journal/${res.data.id}`);
      else router.refresh();
    });

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <Panel>
        <div className="grid gap-3 text-sm">
          <input className={`${adminInput} font-serif text-2xl`} placeholder="Article title" value={p.title} onChange={(e) => setP({ ...p, title: e.target.value, slug: p.id ? p.slug : slugify(e.target.value) })} aria-label="Title" />
          <label className="grid gap-1">Excerpt<textarea className={adminInput} rows={2} value={p.excerpt} onChange={(e) => setP({ ...p, excerpt: e.target.value })} /></label>
          <label className="grid gap-1">
            Content (Markdown: ## headings, **bold**, lists, links, tables)
            <textarea className={`${adminInput} font-mono text-xs leading-6`} rows={24} value={p.content} onChange={(e) => setP({ ...p, content: e.target.value })} />
          </label>
          <p className="text-xs text-muted-foreground">{readingMinutes(p.content)} min read</p>
        </div>
      </Panel>
      <div className="space-y-6">
        <Panel title="Publish">
          <p className="mb-3 text-sm">Status: <strong className="capitalize">{p.status}</strong></p>
          <label className="grid gap-1 text-sm">Publish date<input type="datetime-local" className={adminInput} value={p.publishedAt} onChange={(e) => setP({ ...p, publishedAt: e.target.value })} /></label>
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={pending} onClick={() => save("draft")} className="h-9 flex-1 rounded-sm border border-border bg-white text-xs uppercase tracking-wider">Save draft</button>
            <button type="button" disabled={pending} onClick={() => save("published")} className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-sm bg-wine text-xs uppercase tracking-wider text-ivory">
              {pending && <Loader2 className="size-3 animate-spin" />} Publish
            </button>
          </div>
        </Panel>
        <Panel title="Details">
          <div className="grid gap-3 text-sm">
            <label className="grid gap-1">Slug<input className={adminInput} value={p.slug} onChange={(e) => setP({ ...p, slug: slugify(e.target.value) })} /></label>
            <label className="grid gap-1">Category
              <select className={adminInput} value={p.categoryId} onChange={(e) => setP({ ...p, categoryId: e.target.value })}>
                <option value="">—</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <div>
              {p.coverImageUrl && (
                <div className="relative mb-2 aspect-video bg-cream">
                  <FabricImage src={p.coverImageUrl} alt="" fill sizes="300px" className="object-cover" />
                </div>
              )}
              <ImageUploadButton folder="journal" label="Featured image" onUploaded={(img) => setP({ ...p, coverImageUrl: img.url })} />
            </div>
            <label className="grid gap-1">Author<input className={adminInput} value={p.authorName} onChange={(e) => setP({ ...p, authorName: e.target.value })} /></label>
            <label className="grid gap-1">Author bio<textarea className={adminInput} rows={2} value={p.authorBio} onChange={(e) => setP({ ...p, authorBio: e.target.value })} /></label>
          </div>
        </Panel>
        <Panel title="SEO">
          <div className="grid gap-3 text-sm">
            <label className="grid gap-1">SEO title<input className={adminInput} value={p.seoTitle} onChange={(e) => setP({ ...p, seoTitle: e.target.value })} /></label>
            <label className="grid gap-1">Meta description<textarea className={adminInput} rows={3} value={p.seoDescription} onChange={(e) => setP({ ...p, seoDescription: e.target.value })} /></label>
          </div>
        </Panel>
      </div>
    </div>
  );
}
