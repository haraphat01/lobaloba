"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/shared/field";
import { deleteAddress, requestReturn, saveAddress, updateProfile, type AuthState } from "@/app/actions/auth";
import { COUNTRIES, NIGERIAN_STATES } from "@/lib/geo";

function Status({ state }: { state: AuthState }) {
  if (state.error) return <p role="alert" className="text-sm text-destructive">{state.error}</p>;
  if (state.message) return <p role="status" className="text-sm text-wine">{state.message}</p>;
  return null;
}

export function ProfileForm({ fullName, phone, email, marketing }: { fullName: string; phone: string; email: string; marketing: boolean }) {
  const [state, action, pending] = useActionState(updateProfile, {});
  return (
    <form action={action} className="grid max-w-xl gap-5">
      <Field label="Email">
        <input value={email} disabled className={`${inputClass} opacity-60`} />
      </Field>
      <Field label="Full name" error={state.fieldErrors?.fullName}>
        <input name="fullName" defaultValue={fullName} required className={inputClass} />
      </Field>
      <Field label="Phone" error={state.fieldErrors?.phone}>
        <input name="phone" defaultValue={phone} required className={inputClass} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="marketing" defaultChecked={marketing} /> Send me new arrivals and private sale invitations
      </label>
      <Status state={state} />
      <Button type="submit" disabled={pending} className="h-11 w-fit rounded-none px-8 text-xs tracking-[0.2em] uppercase">
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Save profile"}
      </Button>
    </form>
  );
}

type Address = { id: string; label: string; full_name: string; phone: string; country: string; state: string; city: string; address_line: string; is_default: boolean };

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Address | "new" | null>(addresses.length ? null : "new");
  const [pending, start] = useTransition();

  return (
    <div className="space-y-8">
      <ul className="grid gap-4 sm:grid-cols-2">
        {addresses.map((a) => (
          <li key={a.id} className="border border-border bg-card p-5 text-sm">
            <p className="font-medium">
              {a.label} {a.is_default && <span className="ml-2 bg-cream px-2 py-0.5 text-[0.65rem] tracking-wider text-wine uppercase">Default</span>}
            </p>
            <p className="mt-2 leading-6 text-muted-foreground">
              {a.full_name} · {a.phone}
              <br />
              {a.address_line}, {a.city}, {a.state}, {a.country}
            </p>
            <div className="mt-4 flex gap-4 text-xs">
              <button type="button" onClick={() => setEditing(a)} className="inline-flex items-center gap-1 hover:text-wine">
                <Pencil className="size-3.5" /> Edit
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    await deleteAddress(a.id);
                    router.refresh();
                  })
                }
                className="inline-flex items-center gap-1 hover:text-destructive"
              >
                <Trash2 className="size-3.5" /> Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      {editing ? (
        <AddressForm key={editing === "new" ? "new" : editing.id} address={editing === "new" ? null : editing} onDone={() => { setEditing(null); router.refresh(); }} />
      ) : (
        <Button variant="outline" className="rounded-none" onClick={() => setEditing("new")}>
          Add a new address
        </Button>
      )}
    </div>
  );
}

function AddressForm({ address, onDone }: { address: Address | null; onDone: () => void }) {
  const [country, setCountry] = useState(address?.country ?? "Nigeria");
  const [state, action, pending] = useActionState(async (prev: AuthState, fd: FormData) => {
    const res = await saveAddress(prev, fd);
    if (res.message) onDone();
    return res;
  }, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid max-w-2xl gap-5 border border-border p-6 sm:grid-cols-2">
      <input type="hidden" name="id" value={address?.id ?? ""} />
      <Field label="Label" error={fe.label}>
        <input name="label" defaultValue={address?.label ?? "Home"} className={inputClass} />
      </Field>
      <Field label="Full name" error={fe.fullName}>
        <input name="fullName" defaultValue={address?.full_name} required className={inputClass} />
      </Field>
      <Field label="Phone" error={fe.phone}>
        <input name="phone" defaultValue={address?.phone} required className={inputClass} />
      </Field>
      <Field label="Country" error={fe.country}>
        <select name="country" value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass}>
          {COUNTRIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>
      <Field label="State" error={fe.state}>
        {country === "Nigeria" ? (
          <select name="state" defaultValue={address?.state} className={inputClass}>
            {NIGERIAN_STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        ) : (
          <input name="state" defaultValue={address?.state} className={inputClass} />
        )}
      </Field>
      <Field label="City" error={fe.city}>
        <input name="city" defaultValue={address?.city} required className={inputClass} />
      </Field>
      <Field label="Address" error={fe.addressLine} className="sm:col-span-2">
        <input name="addressLine" defaultValue={address?.address_line} required className={inputClass} />
      </Field>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="isDefault" defaultChecked={address?.is_default} /> Use as my default address
      </label>
      <div className="sm:col-span-2">
        <Status state={state} />
      </div>
      <Button type="submit" disabled={pending} className="h-11 w-fit rounded-none px-8 text-xs tracking-[0.2em] uppercase">
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Save address"}
      </Button>
    </form>
  );
}

export function ReturnRequestForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(requestReturn, {});
  if (state.message) return <Status state={state} />;
  return (
    <form action={action} className="grid gap-4 border border-border bg-card p-6">
      <p className="font-serif text-xl">Request a return</p>
      <input type="hidden" name="orderId" value={orderId} />
      <Field label="Reason">
        <select name="reason" className={inputClass} required>
          <option>Item arrived damaged</option>
          <option>Wrong item or colour received</option>
          <option>Item not as described</option>
          <option>Quantity incorrect</option>
          <option>Other</option>
        </select>
      </Field>
      <Field label="Details">
        <textarea name="details" rows={3} className={inputClass} placeholder="Tell us what happened" />
      </Field>
      <Status state={state} />
      <Button type="submit" disabled={pending} className="h-11 w-fit rounded-none px-8 text-xs tracking-[0.2em] uppercase">
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Submit return request"}
      </Button>
    </form>
  );
}
