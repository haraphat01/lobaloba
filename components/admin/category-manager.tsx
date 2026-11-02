"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminInput } from "@/components/admin/ui";
import { ImageUploadButton } from "@/components/admin/image-upload";
import { useAdminAction } from "@/components/admin/use-action";
import { FabricImage } from "@/components/shared/fabric-image";
import { deleteCategory, saveCategory } from "@/app/actions/admin-catalog";
import { slugify } from "@/lib/format";

type Category = { id?: string; name: string; slug: string; description: string; imageUrl: string; sortOrder: number; isActive: boolean; seoTitle: string; seoDescription: string; productCount?: number };

const blank: Category = { name: "", slug: "", description: "", imageUrl: "", sortOrder: 0, isActive: true, seoTitle: "", seoDescription: "" };

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [editing, setEditing] = useState<Category | null>(null);
  const { pending, run } = useAdminAction();

  return (
    <>
      <button type="button" onClick={() => setEditing({ ...blank, sortOrder: categories.length + 1 })} className="mb-4 inline-flex h-9 items-center gap-2 rounded-sm bg-wine px-4 text-xs tracking-wider text-onyx uppercase">
        <Plus className="size-4" /> Add category
      </button>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {categories.map((c) => (
          <li key={c.id} className="overflow-hidden rounded-sm border border-border bg-card">
            <div className="relative aspect-[4/3] bg-cream">
              <FabricImage src={c.imageUrl} alt={c.name} fill sizes="300px" className="object-cover" />
              {!c.isActive && <span className="absolute top-2 left-2 rounded-sm bg-charcoal px-2 py-0.5 text-[0.6rem] text-onyx uppercase">Inactive</span>}
            </div>
            <div className="p-3">
              <p className="font-medium">
                {c.sortOrder}. {c.name}
              </p>
              <p className="text-xs text-muted-foreground">/shop/{c.slug} · {c.productCount ?? 0} products</p>
              <div className="mt-2 flex gap-3 text-xs">
                <button type="button" onClick={() => setEditing(c)} className="inline-flex items-center gap-1 text-wine">
                  <Pencil className="size-3" /> Edit
                </button>
                <button type="button" disabled={pending} onClick={() => run(() => deleteCategory(c.id!))} className="inline-flex items-center gap-1 text-destructive">
                  <Trash2 className="size-3" /> Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit category" : "New category"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3 text-sm">
              <label className="grid gap-1">
                Name
                <input className={adminInput} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })} />
              </label>
              <label className="grid gap-1">
                Slug
                <input className={adminInput} value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} />
              </label>
              <label className="grid gap-1">
                Description
                <textarea className={adminInput} rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </label>
              <div className="flex items-end gap-3">
                {editing.imageUrl && (
                  <div className="relative h-16 w-16 bg-cream">
                    <FabricImage src={editing.imageUrl} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                )}
                <ImageUploadButton folder="categories" onUploaded={(img) => setEditing({ ...editing, imageUrl: img.url })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1">
                  Display order
                  <input className={adminInput} type="number" value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} />
                </label>
                <label className="flex items-center gap-2 pt-5">
                  <input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Active
                </label>
              </div>
              <label className="grid gap-1">
                SEO title
                <input className={adminInput} value={editing.seoTitle} onChange={(e) => setEditing({ ...editing, seoTitle: e.target.value })} />
              </label>
              <label className="grid gap-1">
                SEO description
                <textarea className={adminInput} rows={2} value={editing.seoDescription} onChange={(e) => setEditing({ ...editing, seoDescription: e.target.value })} />
              </label>
              <button type="button" disabled={pending} onClick={() => run(() => saveCategory(editing), () => setEditing(null))} className="mt-2 h-10 rounded-sm bg-wine text-xs tracking-wider text-onyx uppercase">
                Save category
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
