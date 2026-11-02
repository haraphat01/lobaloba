"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/shared/field";
import { trackOrder } from "@/app/actions/checkout";

export function TrackForm() {
  const [state, action, pending] = useActionState(trackOrder, {});
  return (
    <form action={action} className="grid gap-5">
      <Field label="Order number">
        <input name="orderNumber" required placeholder="e.g. LBF-10001" className={inputClass} />
      </Field>
      <Field label="Email or phone number">
        <input name="contact" required className={inputClass} />
      </Field>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="h-12 rounded-none text-xs tracking-[0.22em] uppercase">
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Track order"}
      </Button>
    </form>
  );
}
