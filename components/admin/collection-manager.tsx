"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminInput } from "@/components/admin/ui";
import { ImageUploadButton } from "@/components/admin/image-upload";
import { useAdminAction } from "@/components/admin/use-action";
import { FabricImage } from "@/components/shared/fabric-image";
import { deleteCollection, saveCollection } from "@/app/actions/admin-catalog";
import { slugify } from "@/lib/format";

type Collection = { id?: string; title: string; slug: string; subtitle: string; description: string; imageUrl: string; isFeatured: boolean; isActive: boolean; sortOrder: number; productIds: string[] };

export function CollectionManager({ collections, products }: { collections: Collection[]; products: { id: string; name: string }[] }) {
  const [editing, setEditing] = useState<Collection | null>(null);
  const [filter, setFilter] = useState("");
  const { pending, run } = useAdminAction();
  const blank: Collection = { title: "", slug: "", subtitle: "", description: "", imageUrl: "", isFeatured: true, isActive: true, sortOrder: collections.length, productIds: [] };

  return (
    <>
      <button type="button" onClick={() => setEditing(blank)} className="mb-4 inline-flex h-9 items-center gap-2 rounded-sm bg-wine px-4 text-xs tracking-wider text-ivory uppercase">
        <Plus className="size-4" /> Add collection
      </button>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {collections.map((c) => (
          <li key={c.id} className="flex gap-3 rounded-sm border border-border bg-card p-3">
            <div className="relative h-20 w-20 shrink-0 bg-cream">
              <FabricImage src={c.imageUrl} alt="" fill sizes="80px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium">{c.title}</p>
              <p className="text-xs text-muted-foreground">
                {c.productIds.length} products · {c.isFeatured ? "Featured on homepage" : "Not featured"} {!c.isActive && "· Inactive"}
              </p>
              <div className="mt-2 flex gap-3 text-xs">
                <button type="button" onClick={() => setEditing(c)} className="inline-flex items-center gap-1 text-wine">
                  <Pencil className="size-3" /> Edit
                </button>
                <button type="button" disabled={pending} onClick={() => run(() => deleteCollection(c.id!))} className="inline-flex items-center gap-1 text-destructive">
                  <Trash2 className="size-3" /> Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit collection" : "New collection"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1">
                  Title
                  <input className={adminInput} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })} />
                </label>
                <label className="grid gap-1">
                  Slug
                  <input className={adminInput} value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} />
                </label>
              </div>
              <label className="grid gap-1">
                Subtitle
                <input className={adminInput} value={editing.subtitle} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} />
              </label>
              <label className="grid gap-1">
                Description
                <textarea className={adminInput} rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </label>
              <div className="flex items-end gap-3">
                {editing.imageUrl && (
                  <div className="relative h-16 w-16 bg-cream">
                    <FabricImage src={editing.imageUrl} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                )}
                <ImageUploadButton folder="collections" onUploaded={(img) => setEditing({ ...editing, imageUrl: img.url })} />
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={editing.isFeatured} onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })} /> Feature on homepage
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Active
                </label>
                <label className="flex items-center gap-2">
                  Order <input type="number" className={`${adminInput} w-20`} value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} />
                </label>
              </div>
              <div>
                <p className="mb-1 font-medium">Products ({editing.productIds.length})</p>
                <input className={adminInput} placeholder="Filter products" value={filter} onChange={(e) => setFilter(e.target.value)} />
                <ul className="mt-2 max-h-56 overflow-y-auto rounded-sm border border-border p-2">
                  {products
                    .filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()))
                    .map((p) => (
                      <li key={p.id}>
                        <label className="flex items-center gap-2 py-1">
                          <input
                            type="checkbox"
                            checked={editing.productIds.includes(p.id)}
                            onChange={(e) => setEditing({ ...editing, productIds: e.target.checked ? [...editing.productIds, p.id] : editing.productIds.filter((x) => x !== p.id) })}
                          />
                          {p.name}
                        </label>
                      </li>
                    ))}
                </ul>
              </div>
              <button type="button" disabled={pending} onClick={() => run(() => saveCollection(editing), () => setEditing(null))} className="h-10 rounded-sm bg-wine text-xs tracking-wider text-ivory uppercase">
                Save collection
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
