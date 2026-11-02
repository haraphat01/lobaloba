"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/shared/field";
import { submitContact } from "@/app/actions/forms";

export function ContactForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  if (result?.ok) {
    return (
      <div className="border border-border bg-card p-10 text-center">
        <CheckCircle2 className="mx-auto size-10 text-wine" strokeWidth={1.2} />
        <p className="mt-4 font-serif text-3xl">Message sent</p>
        <p className="mt-2 text-muted-foreground">{result.text}</p>
      </div>
    );
  }

  return (
    <form
      className="grid gap-5 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.currentTarget));
        start(async () => {
          const res = await submitContact(f);
          setResult({ ok: res.ok, text: res.ok ? (res.message ?? "") : res.error });
          setErrors(res.ok ? {} : (res.fieldErrors ?? {}));
        });
      }}
    >
      <Field label="Name" error={errors.fullName}>
        <input name="fullName" required autoComplete="name" className={inputClass} />
      </Field>
      <Field label="Email" error={errors.email}>
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </Field>
      <Field label="Phone (optional)" error={errors.phone}>
        <input name="phone" type="tel" autoComplete="tel" className={inputClass} />
      </Field>
      <Field label="Subject" error={errors.subject}>
        <input name="subject" required className={inputClass} />
      </Field>
      <Field label="Message" error={errors.message} className="sm:col-span-2">
        <textarea name="message" rows={6} required className={inputClass} />
      </Field>
      {result && !result.ok && <p role="alert" className="text-sm text-destructive sm:col-span-2">{result.text}</p>}
      <Button type="submit" disabled={pending} className="h-12 w-fit rounded-none px-10 text-xs tracking-[0.22em] uppercase">
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Send message"}
      </Button>
    </form>
  );
}
