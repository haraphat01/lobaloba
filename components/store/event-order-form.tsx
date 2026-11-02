"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Loader2, Lock, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/shared/field";
import { FabricImage } from "@/components/shared/fabric-image";
import { placeEventOrder } from "@/app/actions/checkout";
import { getShippingOptionsFor } from "@/app/actions/cart";
import type { ShippingQuote } from "@/lib/shipping";
import { NIGERIAN_STATES } from "@/lib/geo";
import { formatMoney, priceExplanation, unitShort } from "@/lib/format";
import { cn } from "@/lib/utils";

type EventProduct = {
  id: string;
  name: string;
  label: string | null;
  notes: string | null;
  price: number;
  currency: string;
  purchaseUnit: string;
  unitLabel: string | null;
  image: string | null;
  colours: { id: string; name: string; hex: string }[];
  images: { url: string; colourId: string | null }[];
  variants: { id: string; name: string; colourId: string | null; stock: number }[];
};

export function EventOrderForm({
  eventSlug,
  products,
  deliveryMode,
  collectiveNote,
}: {
  eventSlug: string;
  products: EventProduct[];
  deliveryMode: "individual" | "collective" | "both";
  collectiveNote: string | null;
}) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [delivery, setDelivery] = useState<"individual" | "collective">(deliveryMode === "individual" ? "individual" : "collective");
  const [addr, setAddr] = useState({ state: "Lagos", city: "", addressLine: "" });
  const [options, setOptions] = useState<ShippingQuote[]>([]);
  const [rateId, setRateId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();

  const lines = useMemo(() => Object.entries(qty).filter(([, q]) => q > 0).map(([variantId, quantity]) => ({ variantId, quantity })), [qty]);
  const priceOf = (variantId: string) => products.find((p) => p.variants.some((v) => v.id === variantId))?.price ?? 0;
  const subtotal = lines.reduce((s, l) => s + priceOf(l.variantId) * l.quantity, 0);
  const currency = products[0]?.currency ?? "NGN";
  const shipping = delivery === "individual" ? (options.find((o) => o.rateId === rateId)?.fee ?? 0) : 0;

  useEffect(() => {
    if (delivery !== "individual" || !addr.state) return;
    getShippingOptionsFor({ country: "Nigeria", state: addr.state, city: addr.city }, subtotal).then((o) => {
      const deliverable = o.filter((q) => !q.isPickup);
      setOptions(deliverable);
      setRateId((cur) => (deliverable.some((q) => q.rateId === cur) ? cur : (deliverable[0]?.rateId ?? "")));
    });
  }, [delivery, addr.state, addr.city, subtotal]);

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setError(null);
        start(async () => {
          const res = await placeEventOrder({
            eventSlug,
            guestName: String(f.get("guestName") ?? ""),
            guestEmail: String(f.get("guestEmail") ?? ""),
            guestPhone: String(f.get("guestPhone") ?? ""),
            deliveryPreference: delivery,
            country: "Nigeria",
            state: delivery === "individual" ? addr.state : "",
            city: delivery === "individual" ? addr.city : "",
            addressLine: delivery === "individual" ? addr.addressLine : "",
            shippingRateId: delivery === "individual" ? rateId : "",
            lines,
          });
          if (res.ok) window.location.assign(res.data.paymentUrl);
          else {
            setError(res.error);
            setFieldErrors(res.fieldErrors ?? {});
          }
        });
      }}
    >
      <div>
        <p className="eyebrow">Step 1</p>
        <h2 className="mt-2 text-3xl">Choose your Asoebi</h2>
        <ul className="mt-6 space-y-6">
          {products.map((p) => (
            <li key={p.id} className="border border-border bg-card p-5">
              <div className="flex gap-4">
                <div className="relative h-28 w-22 shrink-0 bg-cream">
                  <FabricImage src={p.image} alt={p.name} fill sizes="88px" className="object-cover" />
                </div>
                <div className="flex-1">
                  <p className="font-serif text-2xl">{p.label || p.name}</p>
                  {p.label && <p className="text-sm text-muted-foreground">{p.name}</p>}
                  <p className="mt-1 text-sm">
                    {formatMoney(p.price, p.currency)} <span className="text-muted-foreground">{unitShort(p.purchaseUnit, p.unitLabel)}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{priceExplanation(p.purchaseUnit, p.unitLabel)}</p>
                  {p.notes && <p className="mt-1 text-xs text-wine">{p.notes}</p>}
                </div>
              </div>
              <ul className="mt-4 divide-y divide-border/70">
                {p.variants.map((v) => {
                  const colour = p.colours.find((c) => c.id === v.colourId);
                  const q = qty[v.id] ?? 0;
                  return (
                    <li key={v.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className="flex items-center gap-2">
                        {colour && <span className="size-4 rounded-full border border-black/10" style={{ background: colour.hex }} />}
                        {v.name}
                        {v.stock <= 0 && <span className="text-xs text-destructive">Out of stock</span>}
                      </span>
                      <span className="inline-flex items-center border border-border">
                        <button type="button" aria-label={`Fewer ${v.name}`} disabled={q <= 0} onClick={() => setQty((s) => ({ ...s, [v.id]: q - 1 }))} className="p-2 disabled:opacity-30">
                          <Minus className="size-3" />
                        </button>
                        <span className="w-8 text-center tabular-nums">{q}</span>
                        <button type="button" aria-label={`More ${v.name}`} disabled={q >= v.stock} onClick={() => setQty((s) => ({ ...s, [v.id]: q + 1 }))} className="p-2 disabled:opacity-30">
                          <Plus className="size-3" />
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="eyebrow">Step 2</p>
        <h2 className="mt-2 text-3xl">Your details</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Full name" error={fieldErrors.guestName} className="sm:col-span-2">
            <input name="guestName" required autoComplete="name" className={inputClass} />
          </Field>
          <Field label="Email" error={fieldErrors.guestEmail}>
            <input name="guestEmail" type="email" required autoComplete="email" className={inputClass} />
          </Field>
          <Field label="Phone" error={fieldErrors.guestPhone}>
            <input name="guestPhone" type="tel" required autoComplete="tel" className={inputClass} />
          </Field>
        </div>
      </div>

      <div>
        <p className="eyebrow">Step 3</p>
        <h2 className="mt-2 text-3xl">Delivery</h2>
        {deliveryMode === "both" && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(["collective", "individual"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setDelivery(m)} aria-pressed={delivery === m} className={cn("border p-4 text-left text-sm", delivery === m ? "border-wine bg-card" : "border-border")}>
                <p className="font-medium">{m === "collective" ? "Collect with the group" : "Deliver to me"}</p>
                <p className="text-xs text-muted-foreground">{m === "collective" ? "No delivery fee" : "Delivery fee applies"}</p>
              </button>
            ))}
          </div>
        )}
        {delivery === "collective" ? (
          <p className="mt-4 bg-cream p-4 text-sm">{collectiveNote || "Your Asoebi will be delivered to the coordinator together with the group order."}</p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="State">
              <select value={addr.state} onChange={(e) => setAddr((a) => ({ ...a, state: e.target.value }))} className={inputClass}>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="City">
              <input value={addr.city} onChange={(e) => setAddr((a) => ({ ...a, city: e.target.value }))} className={inputClass} required />
            </Field>
            <Field label="Delivery address" error={fieldErrors.addressLine} className="sm:col-span-2">
              <input value={addr.addressLine} onChange={(e) => setAddr((a) => ({ ...a, addressLine: e.target.value }))} className={inputClass} required />
            </Field>
            {options.length > 0 && (
              <Field label="Delivery option" className="sm:col-span-2">
                <select value={rateId} onChange={(e) => setRateId(e.target.value)} className={inputClass}>
                  {options.map((o) => (
                    <option key={o.rateId} value={o.rateId}>
                      {o.name} — {o.fee === 0 ? "Free" : formatMoney(o.fee, currency)}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border pt-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Asoebi</span>
          <span>{formatMoney(subtotal, currency)}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm">
          <span className="text-muted-foreground">Delivery</span>
          <span>{formatMoney(shipping, currency)}</span>
        </div>
        <div className="mt-3 flex justify-between font-serif text-2xl">
          <span>Total</span>
          <span>{formatMoney(subtotal + shipping, currency)}</span>
        </div>
        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={pending || lines.length === 0} className="mt-6 h-13 w-full rounded-none text-xs tracking-[0.22em] uppercase">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />} Pay for my Asoebi
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">Prices are confirmed on our server. Payment is processed securely by Paystack.</p>
      </div>
    </form>
  );
}
