"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/shared/field";
import { FabricImage } from "@/components/shared/fabric-image";
import { submitQuotationRequest } from "@/app/actions/forms";
import { searchProductsForQuote } from "@/app/actions/quotes";
import { formatMoney, unitShort } from "@/lib/format";

type PickerProduct = Awaited<ReturnType<typeof searchProductsForQuote>>[number];
type Item = { product: PickerProduct; quantity: number; colour: string };

export function QuoteRequestForm({
  type,
  packages = [],
  categories,
  defaultPackageId,
}: {
  type: "asoebi" | "wholesale";
  packages?: { id: string; name: string }[];
  categories: string[];
  defaultPackageId?: string;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<{ reference: string; token: string } | null>(null);
  const [pending, start] = useTransition();

  if (done) {
    return (
      <div className="border border-border bg-card p-10 text-center">
        <CheckCircle2 className="mx-auto size-12 text-wine" strokeWidth={1.2} />
        <h3 className="mt-4 text-4xl">Request received</h3>
        <p className="mt-3 text-muted-foreground">
          Your reference is <strong className="text-ink">{done.reference}</strong>. We&apos;ve emailed you a copy and our team will send your tailored quotation shortly.
        </p>
        <Link href={`/quotes/${done.token}`} className="mt-6 inline-block text-xs tracking-[0.2em] text-wine uppercase underline underline-offset-4">
          View your request
        </Link>
      </div>
    );
  }

  return (
    <form
      className="grid gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const get = (k: string) => String(f.get(k) ?? "");
        setFormError(null);
        start(async () => {
          const res = await submitQuotationRequest({
            requestType: type,
            fullName: get("fullName"),
            email: get("email"),
            phone: get("phone"),
            companyName: get("companyName"),
            eventType: get("eventType"),
            eventDate: get("eventDate"),
            guestCount: get("guestCount") ? Number(get("guestCount")) : null,
            preferredCategory: get("preferredCategory"),
            preferredColours: get("preferredColours"),
            budget: get("budget"),
            requiredQuantity: get("requiredQuantity"),
            deliveryLocation: get("deliveryLocation"),
            details: get("details"),
            packageId: get("packageId"),
            needsAvailabilityCheck: f.get("availability") === "on",
            items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity, colour: i.colour })),
          });
          if (res.ok) setDone(res.data);
          else {
            setErrors(res.fieldErrors ?? {});
            setFormError(res.error);
          }
        });
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" error={errors.fullName}>
          <input name="fullName" required autoComplete="name" className={inputClass} />
        </Field>
        <Field label="Email" error={errors.email}>
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </Field>
        <Field label="Phone number" error={errors.phone}>
          <input name="phone" type="tel" required autoComplete="tel" className={inputClass} />
        </Field>
        {type === "wholesale" ? (
          <Field label="Business / company name (optional)" error={errors.companyName}>
            <input name="companyName" className={inputClass} />
          </Field>
        ) : (
          <Field label="Event type" error={errors.eventType}>
            <select name="eventType" className={inputClass}>
              {["Wedding", "Traditional marriage", "Birthday", "Anniversary", "Burial / remembrance", "Naming ceremony", "Other celebration"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
        )}
        <Field label={type === "wholesale" ? "Required by (optional)" : "Event date"} error={errors.eventDate}>
          <input name="eventDate" type="date" className={inputClass} />
        </Field>
        {type === "asoebi" ? (
          <Field label="Estimated number of guests" error={errors.guestCount}>
            <input name="guestCount" type="number" min={0} className={inputClass} />
          </Field>
        ) : (
          <Field label="Event type (if any)" error={errors.eventType}>
            <input name="eventType" className={inputClass} placeholder="e.g. Retail restock, wedding, uniform" />
          </Field>
        )}
        <Field label="Preferred fabric category" error={errors.preferredCategory}>
          <select name="preferredCategory" className={inputClass}>
            <option value="">No preference</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Preferred colours" error={errors.preferredColours}>
          <input name="preferredColours" placeholder="e.g. Emerald and gold" className={inputClass} />
        </Field>
        <Field label="Estimated budget" error={errors.budget}>
          <input name="budget" placeholder="e.g. ₦2,000,000" className={inputClass} />
        </Field>
        <Field label="Required quantity" error={errors.requiredQuantity}>
          <input name="requiredQuantity" placeholder="e.g. 80 bundles, 400 yards" className={inputClass} />
        </Field>
        <Field label="Delivery location" error={errors.deliveryLocation}>
          <input name="deliveryLocation" placeholder="City, state, country" className={inputClass} />
        </Field>
        {packages.length > 0 && (
          <Field label="Coordination package" error={errors.packageId}>
            <select name="packageId" defaultValue={defaultPackageId ?? ""} className={inputClass}>
              <option value="">Not sure yet</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      <ProductPicker items={items} setItems={setItems} />

      <Field label="Additional information" error={errors.details}>
        <textarea name="details" rows={4} className={inputClass} placeholder="Tell us about your celebration, styling ideas or delivery needs" />
      </Field>
      {type === "wholesale" && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="availability" defaultChecked /> Please confirm stock availability before quoting
        </label>
      )}
      {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
      <Button type="submit" disabled={pending} className="h-13 w-full rounded-none text-xs tracking-[0.22em] uppercase sm:w-fit sm:px-12">
        {pending ? <Loader2 className="size-4 animate-spin" /> : type === "wholesale" ? "Request bulk pricing" : "Request my quotation"}
      </Button>
    </form>
  );
}

function ProductPicker({ items, setItems }: { items: Item[]; setItems: (fn: (i: Item[]) => Item[]) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PickerProduct[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => searchProductsForQuote(q).then(setResults), 200);
    return () => clearTimeout(t);
  }, [q, open]);

  return (
    <div className="border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-medium tracking-[0.18em] uppercase">Selected fabrics (optional)</p>
          <p className="mt-1 text-xs text-muted-foreground">Attach pieces from our catalogue with quantities and colours.</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="rounded-none" onClick={() => setOpen((o) => !o)}>
          <Plus className="size-3.5" /> Add product
        </Button>
      </div>

      {open && (
        <div className="mt-4">
          <div className="flex items-center gap-2 border-b border-border">
            <Search className="size-4 text-gold" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the catalogue" aria-label="Search the catalogue" className="h-10 flex-1 bg-transparent text-sm outline-none" />
          </div>
          <ul className="mt-2 max-h-64 overflow-y-auto">
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    setItems((cur) => (cur.some((i) => i.product.id === p.id) ? cur : [...cur, { product: p, quantity: 1, colour: p.colours[0] ?? "" }]));
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-2 py-2 text-left text-sm hover:bg-cream"
                >
                  <span className="relative h-10 w-8 shrink-0 bg-cream">
                    <FabricImage src={p.image} alt="" fill sizes="32px" className="object-cover" />
                  </span>
                  <span className="flex-1">{p.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatMoney(p.price, p.currency)} {unitShort(p.purchaseUnit, p.unitLabel)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {items.length > 0 && (
        <ul className="mt-4 divide-y divide-border">
          {items.map((item, idx) => (
            <li key={item.product.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <span className="min-w-40 flex-1 font-medium">{item.product.name}</span>
              {item.product.colours.length > 0 && (
                <select
                  aria-label="Colour"
                  value={item.colour}
                  onChange={(e) => setItems((cur) => cur.map((c, i) => (i === idx ? { ...c, colour: e.target.value } : c)))}
                  className="border border-border bg-transparent px-2 py-1.5 text-xs"
                >
                  {item.product.colours.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              )}
              <input
                type="number"
                min={1}
                aria-label="Quantity"
                value={item.quantity}
                onChange={(e) => setItems((cur) => cur.map((c, i) => (i === idx ? { ...c, quantity: Math.max(1, Number(e.target.value) || 1) } : c)))}
                className="w-20 border border-border bg-transparent px-2 py-1.5 text-xs"
              />
              <span className="text-xs text-muted-foreground">{unitShort(item.product.purchaseUnit, item.product.unitLabel).replace("/ ", "")}</span>
              <button type="button" aria-label={`Remove ${item.product.name}`} onClick={() => setItems((cur) => cur.filter((_, i) => i !== idx))} className="hover:text-destructive">
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
