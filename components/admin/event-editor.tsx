"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Panel, adminInput } from "@/components/admin/ui";
import { ImageUploadButton } from "@/components/admin/image-upload";
import { deleteAsoebiEvent, saveAsoebiEvent } from "@/app/actions/admin-orders";

export type EditableEvent = {
  id?: string;
  title: string;
  slug: string;
  eventType: string;
  eventDate: string;
  orderDeadline: string;
  description: string;
  guestInstructions: string;
  coverImageUrl: string;
  coordinatorName: string;
  coordinatorEmail: string;
  coordinatorPhone: string;
  expectedGuests: string;
  deliveryMode: "individual" | "collective" | "both";
  collectiveDeliveryNote: string;
  isPublished: boolean;
  quotationId: string;
  products: { productId: string; packageLabel: string; priceOverride: string; notes: string }[];
};

export function EventEditor({ event, products }: { event: EditableEvent; products: { id: string; name: string; price: number }[] }) {
  const router = useRouter();
  const [e, setE] = useState(event);
  const [pending, start] = useTransition();
  const set = <K extends keyof EditableEvent>(k: K, v: EditableEvent[K]) => setE((s) => ({ ...s, [k]: v }));
  const F = ({ label, k, type = "text", rows }: { label: string; k: keyof EditableEvent; type?: string; rows?: number }) => (
    <label className="grid gap-1 text-sm">
      {label}
      {rows ? (
        <textarea className={adminInput} rows={rows} value={String(e[k] ?? "")} onChange={(ev) => set(k, ev.target.value as never)} />
      ) : (
        <input className={adminInput} type={type} value={String(e[k] ?? "")} onChange={(ev) => set(k, ev.target.value as never)} />
      )}
    </label>
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <div className="space-y-6">
        <Panel title="Event details">
          <div className="grid gap-3 sm:grid-cols-2">
            {F({ label: "Event title", k: "title" })}
            {F({ label: "URL slug (optional)", k: "slug" })}
            {F({ label: "Event type", k: "eventType" })}
            {F({ label: "Event date", k: "eventDate", type: "date" })}
            {F({ label: "Order deadline", k: "orderDeadline", type: "datetime-local" })}
            {F({ label: "Expected guests", k: "expectedGuests", type: "number" })}
          </div>
          <div className="mt-3 grid gap-3">
            {F({ label: "Description (Markdown)", k: "description", rows: 4 })}
            {F({ label: "Guest ordering instructions (Markdown)", k: "guestInstructions", rows: 3 })}
          </div>
          <div className="mt-3">
            <ImageUploadButton folder="events" label="Upload cover image" onUploaded={(img) => set("coverImageUrl", img.url)} />
            {e.coverImageUrl && <p className="mt-1 truncate text-xs text-muted-foreground">{e.coverImageUrl}</p>}
          </div>
        </Panel>
        <Panel
          title="Fabrics & packages for guests"
          actions={
            <button type="button" className="text-xs text-wine underline" onClick={() => set("products", [...e.products, { productId: products[0]?.id ?? "", packageLabel: "", priceOverride: "", notes: "" }])}>
              Add fabric
            </button>
          }
        >
          {e.products.length === 0 && <p className="text-sm text-muted-foreground">Add the fabrics guests can choose from.</p>}
          <ul className="space-y-3">
            {e.products.map((p, i) => {
              const upd = (patch: Partial<typeof p>) => set("products", e.products.map((x, j) => (j === i ? { ...x, ...patch } : x)));
              const base = products.find((x) => x.id === p.productId);
              return (
                <li key={i} className="grid gap-2 rounded-sm border border-border p-3 sm:grid-cols-2">
                  <select className={adminInput} value={p.productId} onChange={(ev) => upd({ productId: ev.target.value })} aria-label="Product">
                    {products.map((x) => (
                      <option key={x.id} value={x.id}>{x.name}</option>
                    ))}
                  </select>
                  <input className={adminInput} placeholder="Package label (e.g. Ladies' lace + gele)" value={p.packageLabel} onChange={(ev) => upd({ packageLabel: ev.target.value })} />
                  <input className={adminInput} inputMode="decimal" placeholder={`Event price (default ${base?.price ?? "—"})`} value={p.priceOverride} onChange={(ev) => upd({ priceOverride: ev.target.value })} />
                  <div className="flex gap-2">
                    <input className={adminInput} placeholder="Note for guests" value={p.notes} onChange={(ev) => upd({ notes: ev.target.value })} />
                    <button type="button" aria-label="Remove" onClick={() => set("products", e.products.filter((_, j) => j !== i))} className="p-2 text-destructive">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
      <div className="space-y-6">
        <Panel title="Coordinator">
          <div className="grid gap-3">
            {F({ label: "Name", k: "coordinatorName" })}
            {F({ label: "Email", k: "coordinatorEmail", type: "email" })}
            {F({ label: "Phone", k: "coordinatorPhone" })}
          </div>
        </Panel>
        <Panel title="Delivery">
          <select className={adminInput} value={e.deliveryMode} onChange={(ev) => set("deliveryMode", ev.target.value as EditableEvent["deliveryMode"])} aria-label="Delivery mode">
            <option value="collective">Collective (delivered to coordinator)</option>
            <option value="individual">Individual (each guest pays delivery)</option>
            <option value="both">Guest chooses</option>
          </select>
          <div className="mt-3">{F({ label: "Collective delivery note", k: "collectiveDeliveryNote", rows: 2 })}</div>
        </Panel>
        <Panel title="Publish">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={e.isPublished} onChange={(ev) => set("isPublished", ev.target.checked)} /> Published (guests can order)
          </label>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await saveAsoebiEvent(e);
                if (!res.ok) return void toast.error(res.error);
                toast.success("Event saved");
                if (!e.id) router.replace(`/admin/asoebi/${res.data.id}`);
                else router.refresh();
              })
            }
            className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-sm bg-wine text-xs tracking-wider text-ivory uppercase"
          >
            {pending && <Loader2 className="size-4 animate-spin" />} Save event
          </button>
          {e.id && (
            <div className="mt-3 flex justify-between text-xs">
              <Link href={`/asoebi/events/${e.slug}`} target="_blank" className="text-wine underline">Open guest page</Link>
              <button
                type="button"
                onClick={() =>
                  start(async () => {
                    const res = await deleteAsoebiEvent(e.id!);
                    if (res.ok) router.push("/admin/asoebi");
                    else toast.error(res.error);
                  })
                }
                className="text-destructive underline"
              >
                Delete event
              </button>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
