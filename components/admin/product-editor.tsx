"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Panel, adminInput } from "@/components/admin/ui";
import { ImageUploadButton } from "@/components/admin/image-upload";
import { FabricImage } from "@/components/shared/fabric-image";
import { deleteProduct, saveProduct } from "@/app/actions/admin-catalog";
import { PURCHASE_UNITS, priceExplanation, slugify } from "@/lib/format";

type Unit = keyof typeof PURCHASE_UNITS;

export type EditableProduct = {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  careInstructions: string;
  fabricType: string;
  price: string;
  compareAtPrice: string;
  currency: string;
  purchaseUnit: Unit;
  unitLabel: string;
  minQuantity: string;
  maxQuantity: string;
  lowStockThreshold: string;
  status: "draft" | "active" | "archived";
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestseller: boolean;
  tags: string;
  seoTitle: string;
  seoDescription: string;
  faqs: { question: string; answer: string }[];
  colours: { id?: string; name: string; hex: string }[];
  variants: { id?: string; name: string; sku: string; colourName: string; priceOverride: string; isActive: boolean; stock: string }[];
  images: { id?: string; url: string; storagePath: string; alt: string; colourName: string }[];
};

const EMPTY: EditableProduct = {
  name: "",
  slug: "",
  sku: "",
  categoryId: "",
  shortDescription: "",
  description: "",
  careInstructions: "",
  fabricType: "",
  price: "",
  compareAtPrice: "",
  currency: "NGN",
  purchaseUnit: "per_yard",
  unitLabel: "",
  minQuantity: "1",
  maxQuantity: "",
  lowStockThreshold: "5",
  status: "active",
  isFeatured: false,
  isNewArrival: true,
  isBestseller: false,
  tags: "",
  seoTitle: "",
  seoDescription: "",
  faqs: [],
  colours: [],
  variants: [{ name: "Standard", sku: "", colourName: "", priceOverride: "", isActive: true, stock: "0" }],
  images: [],
};

function move<T>(list: T[], i: number, dir: -1 | 1) {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const copy = [...list];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

function L({ label, children, hint, className }: { label: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`grid gap-1 text-sm ${className ?? ""}`}>
      <span className="text-xs font-medium text-charcoal">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function ProductEditor({ product, categories }: { product: EditableProduct | null; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [p, setP] = useState<EditableProduct>(product ?? EMPTY);
  const [slugTouched, setSlugTouched] = useState(!!product);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof EditableProduct>(k: K, v: EditableProduct[K]) => setP((s) => ({ ...s, [k]: v }));

  function save() {
    setError(null);
    start(async () => {
      const res = await saveProduct({
        ...p,
        id: p.id,
        tags: p.tags.split(",").map((t) => t.trim()).filter(Boolean),
        isFeatured: p.isFeatured,
        variants: p.variants.map((v) => ({ ...v, stock: Number(v.stock) || 0 })),
      });
      if (!res.ok) {
        setError(res.error);
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Saved");
      if (!p.id) router.replace(`/admin/products/${res.data.id}`);
      else router.refresh();
    });
  }

  function remove() {
    if (!p.id) return;
    start(async () => {
      const res = await deleteProduct(p.id!);
      if (res.ok) {
        toast.success(res.message ?? "Deleted");
        router.push("/admin/products");
      } else toast.error(res.error);
    });
  }

  function generateVariantsFromColours() {
    setP((s) => ({
      ...s,
      variants: s.colours.map((c) => s.variants.find((v) => v.colourName === c.name) ?? { name: c.name, sku: "", colourName: c.name, priceOverride: "", isActive: true, stock: "0" }),
    }));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Panel title="Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <L label="Product name" className="sm:col-span-2">
              <input
                className={adminInput}
                value={p.name}
                onChange={(e) => {
                  set("name", e.target.value);
                  if (!slugTouched) set("slug", slugify(e.target.value));
                }}
              />
            </L>
            <L label="URL slug" hint={`/products/${p.slug || "…"}`}>
              <input
                className={adminInput}
                value={p.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", slugify(e.target.value));
                }}
              />
            </L>
            <L label="SKU">
              <input className={adminInput} value={p.sku} onChange={(e) => set("sku", e.target.value)} />
            </L>
            <L label="Category">
              <select className={adminInput} value={p.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </L>
            <L label="Fabric type" hint="Used for filtering and search">
              <input className={adminInput} value={p.fabricType} onChange={(e) => set("fabricType", e.target.value)} placeholder="e.g. Beaded lace" />
            </L>
            <L label="Short description" className="sm:col-span-2">
              <textarea className={adminInput} rows={2} value={p.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
            </L>
            <L label="Full description (Markdown supported)" className="sm:col-span-2">
              <textarea className={adminInput} rows={7} value={p.description} onChange={(e) => set("description", e.target.value)} />
            </L>
            <L label="Fabric care instructions" className="sm:col-span-2">
              <textarea className={adminInput} rows={3} value={p.careInstructions} onChange={(e) => set("careInstructions", e.target.value)} />
            </L>
            <L label="Search tags (comma separated)" className="sm:col-span-2">
              <input className={adminInput} value={p.tags} onChange={(e) => set("tags", e.target.value)} />
            </L>
          </div>
        </Panel>

        <Panel title="Pricing & purchase unit">
          <div className="grid gap-4 sm:grid-cols-3">
            <L label={`Price (${p.currency})`}>
              <input className={adminInput} inputMode="decimal" value={p.price} onChange={(e) => set("price", e.target.value)} />
            </L>
            <L label="Compare-at price" hint="Shows a sale price when higher">
              <input className={adminInput} inputMode="decimal" value={p.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} />
            </L>
            <L label="Currency">
              <select className={adminInput} value={p.currency} onChange={(e) => set("currency", e.target.value)}>
                {["NGN", "USD", "GBP", "EUR"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </L>
            <L label="Purchase unit">
              <select className={adminInput} value={p.purchaseUnit} onChange={(e) => set("purchaseUnit", e.target.value as Unit)}>
                {Object.entries(PURCHASE_UNITS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </L>
            {p.purchaseUnit === "custom" && (
              <L label="Custom unit label" hint="e.g. 10-yard Agbada set">
                <input className={adminInput} value={p.unitLabel} onChange={(e) => set("unitLabel", e.target.value)} />
              </L>
            )}
            <L label="Minimum quantity">
              <input className={adminInput} inputMode="numeric" value={p.minQuantity} onChange={(e) => set("minQuantity", e.target.value)} />
            </L>
            <L label="Maximum per order (optional)">
              <input className={adminInput} inputMode="numeric" value={p.maxQuantity} onChange={(e) => set("maxQuantity", e.target.value)} />
            </L>
            <L label="Low-stock threshold">
              <input className={adminInput} inputMode="numeric" value={p.lowStockThreshold} onChange={(e) => set("lowStockThreshold", e.target.value)} />
            </L>
          </div>
          <p className="mt-3 rounded-sm bg-cream px-3 py-2 text-xs">Customers will see: “{priceExplanation(p.purchaseUnit, p.unitLabel)}”</p>
        </Panel>

        <Panel
          title="Colours"
          actions={
            <button type="button" className="text-xs text-wine underline" onClick={() => set("colours", [...p.colours, { name: "", hex: "#b8955a" }])}>
              Add colour
            </button>
          }
        >
          {p.colours.length === 0 && <p className="text-sm text-muted-foreground">No colours. Add colours to show swatches and colour filters.</p>}
          <ul className="space-y-2">
            {p.colours.map((c, i) => (
              <li key={c.id ?? `new-${i}`} className="flex items-center gap-2">
                <input type="color" aria-label="Swatch colour" value={c.hex} onChange={(e) => set("colours", p.colours.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))} className="h-9 w-12 rounded-sm border border-border" />
                <input
                  className={adminInput}
                  placeholder="Colour name"
                  value={c.name}
                  onChange={(e) => {
                    const old = c.name;
                    const name = e.target.value;
                    setP((s) => ({
                      ...s,
                      colours: s.colours.map((x, j) => (j === i ? { ...x, name } : x)),
                      variants: s.variants.map((v) => (v.colourName === old ? { ...v, colourName: name } : v)),
                      images: s.images.map((im) => (im.colourName === old ? { ...im, colourName: name } : im)),
                    }));
                  }}
                />
                <button type="button" aria-label="Remove colour" onClick={() => set("colours", p.colours.filter((_, j) => j !== i))} className="p-2 text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          {p.colours.length > 0 && (
            <button type="button" onClick={generateVariantsFromColours} className="mt-3 text-xs text-wine underline">
              Create one variant per colour
            </button>
          )}
        </Panel>

        <Panel
          title="Variants & inventory"
          actions={
            <button type="button" className="text-xs text-wine underline" onClick={() => set("variants", [...p.variants, { name: "", sku: "", colourName: "", priceOverride: "", isActive: true, stock: "0" }])}>
              Add variant
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Colour</th>
                  <th className="pb-2">SKU</th>
                  <th className="pb-2">Price override</th>
                  <th className="pb-2">Stock</th>
                  <th className="pb-2">Active</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {p.variants.map((v, i) => {
                  const upd = (patch: Partial<typeof v>) => set("variants", p.variants.map((x, j) => (j === i ? { ...x, ...patch } : x)));
                  return (
                    <tr key={v.id ?? `nv-${i}`}>
                      <td className="pr-2 pb-2">
                        <input className={adminInput} value={v.name} onChange={(e) => upd({ name: e.target.value })} />
                      </td>
                      <td className="pr-2 pb-2">
                        <select className={adminInput} value={v.colourName} onChange={(e) => upd({ colourName: e.target.value })}>
                          <option value="">—</option>
                          {p.colours.map((c) => (
                            <option key={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="pr-2 pb-2">
                        <input className={adminInput} value={v.sku} onChange={(e) => upd({ sku: e.target.value })} />
                      </td>
                      <td className="pr-2 pb-2">
                        <input className={adminInput} inputMode="decimal" placeholder="—" value={v.priceOverride} onChange={(e) => upd({ priceOverride: e.target.value })} />
                      </td>
                      <td className="w-24 pr-2 pb-2">
                        <input className={adminInput} inputMode="numeric" value={v.stock} onChange={(e) => upd({ stock: e.target.value.replace(/\D/g, "") })} />
                      </td>
                      <td className="pb-2 text-center">
                        <input type="checkbox" aria-label="Active" checked={v.isActive} onChange={(e) => upd({ isActive: e.target.checked })} />
                      </td>
                      <td className="pb-2">
                        <button type="button" aria-label="Remove variant" disabled={p.variants.length === 1} onClick={() => set("variants", p.variants.filter((_, j) => j !== i))} className="p-2 text-muted-foreground hover:text-destructive disabled:opacity-30">
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Stock is deducted automatically when payment is confirmed. Customers waiting on “Notify me” are emailed when a sold-out variant is restocked.</p>
        </Panel>

        <Panel title="Images" actions={<ImageUploadButton folder="products" multiple label="Upload images" onUploaded={(img) => setP((s) => ({ ...s, images: [...s.images, { url: img.url, storagePath: img.path, alt: s.name, colourName: "" }] }))} />}>
          {p.images.length === 0 && <p className="text-sm text-muted-foreground">No images yet. The first image is the main product image.</p>}
          <ul className="grid gap-3 sm:grid-cols-2">
            {p.images.map((im, i) => (
              <li key={im.id ?? im.url} className="flex gap-3 rounded-sm border border-border p-2">
                <div className="relative h-24 w-20 shrink-0 bg-cream">
                  <FabricImage src={im.url} alt={im.alt} fill sizes="80px" className="object-cover" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <input className={adminInput} placeholder="Alt text" value={im.alt} onChange={(e) => set("images", p.images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))} />
                  <select className={adminInput} value={im.colourName} onChange={(e) => set("images", p.images.map((x, j) => (j === i ? { ...x, colourName: e.target.value } : x)))}>
                    <option value="">Any colour</option>
                    {p.colours.map((c) => (
                      <option key={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <div className="flex gap-1">
                    <button type="button" aria-label="Move up" onClick={() => set("images", move(p.images, i, -1))} className="rounded-sm border border-border p-1">
                      <ArrowUp className="size-3" />
                    </button>
                    <button type="button" aria-label="Move down" onClick={() => set("images", move(p.images, i, 1))} className="rounded-sm border border-border p-1">
                      <ArrowDown className="size-3" />
                    </button>
                    <button type="button" aria-label="Remove image" onClick={() => set("images", p.images.filter((_, j) => j !== i))} className="ml-auto rounded-sm border border-border p-1 text-destructive">
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Product FAQs"
          actions={
            <button type="button" className="text-xs text-wine underline" onClick={() => set("faqs", [...p.faqs, { question: "", answer: "" }])}>
              Add question
            </button>
          }
        >
          {p.faqs.length === 0 && <p className="text-sm text-muted-foreground">No product-specific FAQs.</p>}
          <ul className="space-y-3">
            {p.faqs.map((f, i) => (
              <li key={i} className="grid gap-2 rounded-sm border border-border p-3">
                <input className={adminInput} placeholder="Question" value={f.question} onChange={(e) => set("faqs", p.faqs.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))} />
                <textarea className={adminInput} rows={2} placeholder="Answer" value={f.answer} onChange={(e) => set("faqs", p.faqs.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))} />
                <button type="button" onClick={() => set("faqs", p.faqs.filter((_, j) => j !== i))} className="w-fit text-xs text-destructive underline">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="space-y-6">
        <Panel title="Publishing">
          <div className="space-y-3 text-sm">
            <L label="Status">
              <select className={adminInput} value={p.status} onChange={(e) => set("status", e.target.value as EditableProduct["status"])}>
                <option value="active">Active (visible)</option>
                <option value="draft">Draft (hidden)</option>
                <option value="archived">Archived (hidden)</option>
              </select>
            </L>
            {(
              [
                ["isFeatured", "Featured"],
                ["isNewArrival", "New arrival"],
                ["isBestseller", "Bestseller"],
              ] as const
            ).map(([k, l]) => (
              <label key={k} className="flex items-center gap-2">
                <input type="checkbox" checked={p[k]} onChange={(e) => set(k, e.target.checked)} /> {l}
              </label>
            ))}
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <button type="button" onClick={save} disabled={pending} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-sm bg-wine text-xs tracking-wider text-ivory uppercase hover:bg-wine-deep">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} {p.id ? "Save changes" : "Create product"}
          </button>
          {p.id && (
            <div className="mt-3 flex justify-between text-xs">
              <Link href={`/products/${p.slug}`} target="_blank" className="text-wine underline">
                View on store
              </Link>
              <button type="button" onClick={remove} disabled={pending} className="text-destructive underline">
                Delete product
              </button>
            </div>
          )}
        </Panel>
        <Panel title="SEO">
          <div className="space-y-3">
            <L label="SEO title" hint={`${p.seoTitle.length}/60 recommended`}>
              <input className={adminInput} value={p.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} placeholder={p.name} />
            </L>
            <L label="Meta description" hint={`${p.seoDescription.length}/160 recommended`}>
              <textarea className={adminInput} rows={3} value={p.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} placeholder={p.shortDescription} />
            </L>
          </div>
        </Panel>
      </div>
    </div>
  );
}
