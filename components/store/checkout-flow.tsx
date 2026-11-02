"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { AlertCircle, Check, Loader2, Lock, MapPin, Store, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/shared/field";
import { FabricImage } from "@/components/shared/fabric-image";
import { useStore } from "@/components/store/store-provider";
import { SummaryRow, useBagDetails } from "@/components/store/bag-contents";
import { checkCoupon, getShippingOptionsFor } from "@/app/actions/cart";
import { placeOrder } from "@/app/actions/checkout";
import type { ShippingQuote } from "@/lib/shipping";
import { COUNTRIES, NIGERIAN_STATES } from "@/lib/geo";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type Address = { id: string; label: string; full_name: string; phone: string; country: string; state: string; city: string; address_line: string; is_default: boolean };

const STEPS = ["Your details", "Delivery", "Shipping", "Review", "Payment"] as const;

export function CheckoutFlow({
  user,
  addresses,
  paymentsReady,
}: {
  user: { email: string; fullName: string; phone: string } | null;
  addresses: Address[];
  paymentsReady: boolean;
}) {
  const { lines } = useStore();
  const { details, loading } = useBagDetails();
  const def = addresses.find((a) => a.is_default) ?? addresses[0];
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    fullName: def?.full_name ?? user?.fullName ?? "",
    email: user?.email ?? "",
    phone: def?.phone ?? user?.phone ?? "",
    country: def?.country ?? "Nigeria",
    state: def?.state ?? "",
    city: def?.city ?? "",
    addressLine: def?.address_line ?? "",
    instructions: "",
    saveAddress: !!user && addresses.length === 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [optionState, setOptionState] = useState<{ key: string; options: ShippingQuote[] } | null>(null);
  const [rateId, setRateId] = useState<string>("");
  const [coupon, setCoupon] = useState({ code: "", applied: "", discount: 0, error: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const subtotal = details?.subtotal ?? 0;
  const currency = details?.currency ?? "NGN";
  const optionsKey = `${form.country}|${form.state}|${form.city}|${subtotal - coupon.discount}`;
  const options = optionState?.key === optionsKey ? optionState.options : null;
  const selected = options?.find((o) => o.rateId === rateId) ?? null;
  const isPickup = !!selected?.isPickup;
  const shipping = selected?.fee ?? 0;
  const total = Math.max(0, subtotal - coupon.discount) + shipping;
  const blocked = details?.lines.some((l) => l.issue === "out_of_stock" || l.issue === "unavailable");

  // Load delivery options whenever the destination changes on the shipping step.
  useEffect(() => {
    if (step < 2) return;
    let cancelled = false;
    getShippingOptionsFor({ country: form.country, state: form.state, city: form.city }, subtotal - coupon.discount).then((o) => {
      if (cancelled) return;
      setOptionState({ key: optionsKey, options: o });
      setRateId((cur) => (o.some((q) => q.rateId === cur) ? cur : (o[0]?.rateId ?? "")));
    });
    return () => {
      cancelled = true;
    };
  }, [step, optionsKey, form.country, form.state, form.city, subtotal, coupon.discount]);

  function validate(s: number) {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (form.fullName.trim().length < 2) e.fullName = "Enter your full name";
      if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email address";
      if (!/^\+?[0-9 ()-]{7,20}$/.test(form.phone.trim())) e.phone = "Enter a valid phone number";
    }
    if (s === 1) {
      if (!form.country) e.country = "Select a country";
      if (!form.state.trim()) e.state = "Enter your state or region";
      if (!form.city.trim()) e.city = "Enter your city";
      if (!form.addressLine.trim()) e.addressLine = "Enter your delivery address";
    }
    if (s === 2 && !rateId) e.shipping = "Choose a delivery option";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const next = () => validate(step) && setStep((s) => Math.min(s + 1, 3));

  function applyCoupon() {
    start(async () => {
      const res = await checkCoupon(coupon.code, lines, form.email);
      if (res.ok) setCoupon({ code: res.code, applied: res.code, discount: res.discount, error: "" });
      else setCoupon((c) => ({ ...c, applied: "", discount: 0, error: res.error }));
    });
  }

  function pay() {
    setFormError(null);
    start(async () => {
      const res = await placeOrder({
        ...form,
        shippingRateId: rateId,
        couponCode: coupon.applied,
        lines,
        instructions: form.instructions,
      });
      if (!res.ok) {
        setFormError(res.error);
        if (res.fieldErrors) setErrors(res.fieldErrors);
        return;
      }
      setStep(4);
      window.location.assign(res.data.paymentUrl);
    });
  }

  if (!loading && lines.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="font-serif text-3xl">Your bag is empty</p>
        <Link href="/shop" className="mt-6 inline-block text-xs tracking-[0.2em] text-wine uppercase underline underline-offset-4">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_420px]">
      <div>
        <ol className="mb-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.68rem] tracking-[0.18em] uppercase" aria-label="Checkout progress">
          {STEPS.map((label, i) => (
            <li key={label} className={cn("flex items-center gap-2", i === step ? "text-wine" : i < step ? "text-ink" : "text-muted-foreground")}>
              <span className={cn("grid size-6 place-items-center rounded-full border text-[0.65rem]", i < step ? "border-wine bg-wine text-ivory" : i === step ? "border-wine" : "border-border")}>
                {i < step ? <Check className="size-3" /> : i + 1}
              </span>
              {i < step ? (
                <button type="button" onClick={() => setStep(i)} className="hover:underline">
                  {label}
                </button>
              ) : (
                label
              )}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <Section title="Your details" subtitle={user ? `Signed in as ${user.email}` : undefined}>
            {!user && (
              <p className="mb-6 text-sm text-muted-foreground">
                Checking out as a guest.{" "}
                <Link href="/account/login?next=/checkout" className="text-wine underline">
                  Sign in
                </Link>{" "}
                to use saved addresses and track orders in your account.
              </p>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name" error={errors.fullName} className="sm:col-span-2">
                <input className={inputClass} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} autoComplete="name" aria-invalid={!!errors.fullName} />
              </Field>
              <Field label="Email" error={errors.email}>
                <input className={inputClass} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" aria-invalid={!!errors.email} />
              </Field>
              <Field label="Phone number" error={errors.phone} hint="For delivery updates">
                <input className={inputClass} type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" aria-invalid={!!errors.phone} />
              </Field>
            </div>
          </Section>
        )}

        {step === 1 && (
          <Section title="Delivery information">
            {addresses.length > 0 && (
              <div className="mb-6 grid gap-3 sm:grid-cols-2">
                {addresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, fullName: a.full_name, phone: a.phone, country: a.country, state: a.state, city: a.city, addressLine: a.address_line, saveAddress: false }))}
                    className={cn("border p-4 text-left text-sm transition hover:border-wine", form.addressLine === a.address_line && form.city === a.city ? "border-wine bg-card" : "border-border")}
                  >
                    <p className="flex items-center gap-2 font-medium">
                      <MapPin className="size-3.5 text-gold" /> {a.label}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {a.address_line}, {a.city}, {a.state}
                    </p>
                  </button>
                ))}
              </div>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Country" error={errors.country}>
                <select className={inputClass} value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value, state: "" }))}>
                  {COUNTRIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label={form.country === "Nigeria" ? "State" : "State / region"} error={errors.state}>
                {form.country === "Nigeria" ? (
                  <select className={inputClass} value={form.state} onChange={(e) => set("state", e.target.value)} aria-invalid={!!errors.state}>
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <input className={inputClass} value={form.state} onChange={(e) => set("state", e.target.value)} aria-invalid={!!errors.state} />
                )}
              </Field>
              <Field label="City" error={errors.city}>
                <input className={inputClass} value={form.city} onChange={(e) => set("city", e.target.value)} autoComplete="address-level2" aria-invalid={!!errors.city} />
              </Field>
              <Field label="Delivery address" error={errors.addressLine}>
                <input className={inputClass} value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} autoComplete="street-address" aria-invalid={!!errors.addressLine} />
              </Field>
              <Field label="Delivery instructions (optional)" className="sm:col-span-2">
                <textarea className={inputClass} rows={3} value={form.instructions} onChange={(e) => set("instructions", e.target.value)} placeholder="Landmarks, gate codes, best time to deliver…" />
              </Field>
              {user && (
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input type="checkbox" checked={form.saveAddress} onChange={(e) => set("saveAddress", e.target.checked)} /> Save this address to my account
                </label>
              )}
            </div>
          </Section>
        )}

        {step === 2 && (
          <Section title="Shipping method" subtitle={`Delivering to ${form.city}, ${form.state}, ${form.country}`}>
            {!options ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Finding delivery options…
              </p>
            ) : options.length === 0 ? (
              <p className="text-sm text-destructive">We don&apos;t have a delivery option for this location yet. Please contact us on WhatsApp.</p>
            ) : (
              <div className="grid gap-3" role="radiogroup" aria-label="Delivery options">
                {options.map((o) => (
                  <button
                    key={o.rateId}
                    type="button"
                    role="radio"
                    aria-checked={rateId === o.rateId}
                    onClick={() => setRateId(o.rateId)}
                    className={cn("flex items-center gap-4 border p-4 text-left transition", rateId === o.rateId ? "border-wine bg-card" : "border-border hover:border-gold")}
                  >
                    {o.isPickup ? <Store className="size-5 text-gold" /> : <Truck className="size-5 text-gold" />}
                    <div className="flex-1">
                      <p className="font-medium">{o.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.description}
                        {o.minDays !== null && o.maxDays !== null && ` · ${o.minDays === o.maxDays ? o.minDays : `${o.minDays}–${o.maxDays}`} business day${o.maxDays === 1 ? "" : "s"}`}
                      </p>
                    </div>
                    <p className="text-sm font-medium">{o.requiresQuote ? "Quoted later" : o.fee === 0 ? "Free" : formatMoney(o.fee, currency)}</p>
                  </button>
                ))}
              </div>
            )}
            {errors.shipping && <p className="mt-2 text-xs text-destructive">{errors.shipping}</p>}
            {selected?.requiresQuote && (
              <p className="mt-4 bg-cream p-4 text-sm">
                International delivery is quoted individually. You&apos;ll pay for your items now and our team will contact you with a shipping quote for {form.country}.
              </p>
            )}
          </Section>
        )}

        {step >= 3 && (
          <Section title="Review your order">
            <dl className="grid gap-6 text-sm sm:grid-cols-3">
              <ReviewBlock title="Contact" onEdit={() => setStep(0)}>
                {form.fullName}
                <br />
                {form.email}
                <br />
                {form.phone}
              </ReviewBlock>
              <ReviewBlock title={isPickup ? "Pickup" : "Delivery"} onEdit={() => setStep(1)}>
                {isPickup ? "Collect from our Lagos studio" : `${form.addressLine}, ${form.city}, ${form.state}, ${form.country}`}
              </ReviewBlock>
              <ReviewBlock title="Shipping" onEdit={() => setStep(2)}>
                {selected?.name}
              </ReviewBlock>
            </dl>

            <div className="mt-8 border-t border-border pt-6">
              <p className="text-[0.68rem] font-medium tracking-[0.18em] uppercase">Discount code</p>
              <div className="mt-2 flex max-w-md gap-2">
                <input className={inputClass} value={coupon.code} onChange={(e) => setCoupon((c) => ({ ...c, code: e.target.value.toUpperCase() }))} placeholder="Enter code" aria-label="Discount code" />
                <Button type="button" variant="outline" className="h-auto rounded-none px-5" disabled={!coupon.code || pending} onClick={applyCoupon}>
                  Apply
                </Button>
              </div>
              {coupon.applied && <p className="mt-2 text-xs text-wine">Code {coupon.applied} applied — you save {formatMoney(coupon.discount, currency)}.</p>}
              {coupon.error && <p className="mt-2 text-xs text-destructive">{coupon.error}</p>}
            </div>

            {!paymentsReady && (
              <p className="mt-6 flex items-start gap-2 bg-cream p-4 text-sm">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-gold" /> Online payments are being configured. Please contact us on WhatsApp to complete your purchase.
              </p>
            )}
            {formError && (
              <p role="alert" className="mt-6 flex items-start gap-2 border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" /> {formError}
              </p>
            )}
          </Section>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          {step > 0 && step < 4 ? (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="text-xs tracking-[0.18em] uppercase hover:text-wine">
              ← Back
            </button>
          ) : (
            <Link href="/bag" className="text-xs tracking-[0.18em] uppercase hover:text-wine">
              ← Back to bag
            </Link>
          )}
          {step < 3 ? (
            <Button type="button" onClick={next} disabled={step === 2 && !rateId} className="h-12 rounded-none px-10 text-xs tracking-[0.22em] uppercase">
              Continue
            </Button>
          ) : (
            <Button type="button" onClick={pay} disabled={pending || blocked || !paymentsReady || step === 4} className="h-12 rounded-none px-10 text-xs tracking-[0.22em] uppercase">
              {pending || step === 4 ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              {step === 4 ? "Redirecting to Paystack…" : `Pay ${formatMoney(total, currency)}`}
            </Button>
          )}
        </div>
      </div>

      <aside className="h-fit border border-border bg-card p-6 lg:sticky lg:top-36">
        <h2 className="font-serif text-2xl">Order summary</h2>
        <ul className="mt-4 divide-y divide-border">
          {details?.lines.map((l) => (
            <li key={l.variantId} className="flex gap-3 py-3">
              <div className="relative h-16 w-13 shrink-0 bg-cream">
                <FabricImage src={l.imageUrl} alt={l.productName} fill sizes="52px" className="object-cover" />
                <span className="absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-charcoal text-[0.6rem] text-ivory">{l.quantity}</span>
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-medium">{l.productName}</p>
                <p className="text-xs text-muted-foreground">
                  {l.variantName} · {l.unitLabel}
                </p>
                {l.issue && <p className="text-xs text-destructive">{l.issue === "insufficient_stock" ? `Only ${l.available} available` : "Unavailable"}</p>}
              </div>
              <p className="text-sm">{formatMoney(l.lineTotal, l.currency)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          <SummaryRow label="Subtotal" value={formatMoney(subtotal, currency)} />
          {coupon.discount > 0 && <SummaryRow label={`Discount (${coupon.applied})`} value={`−${formatMoney(coupon.discount, currency)}`} />}
          <SummaryRow label="Shipping" value={selected ? (selected.requiresQuote ? "Quoted later" : selected.fee === 0 ? "Free" : formatMoney(shipping, currency)) : "Next step"} />
          <SummaryRow label="Total" value={formatMoney(total, currency)} strong className="border-t border-border pt-3" />
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="size-3.5" /> Prices and stock are confirmed on our server. Payment is processed securely by Paystack.
        </p>
      </aside>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-3xl">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function ReviewBlock({ title, children, onEdit }: { title: string; children: React.ReactNode; onEdit: () => void }) {
  return (
    <div>
      <dt className="flex items-center justify-between text-[0.68rem] font-medium tracking-[0.18em] uppercase">
        {title}
        <button type="button" onClick={onEdit} className="text-wine normal-case tracking-normal hover:underline">
          Edit
        </button>
      </dt>
      <dd className="mt-2 leading-6 text-charcoal">{children}</dd>
    </div>
  );
}
