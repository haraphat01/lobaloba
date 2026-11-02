"use client";

import { useState, useTransition } from "react";
import { Loader2, MessageCircle, Scissors, Star } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/shared/field";
import { requestSample, submitReview } from "@/app/actions/forms";
import { whatsappLink } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ProductAssistance({ productId, productName, colours, whatsapp }: { productId: string; productName: string; colours: string[]; whatsapp: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-8 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 border border-border px-4 py-3 text-xs tracking-[0.16em] uppercase hover:border-wine hover:text-wine">
        <Scissors className="size-4" /> Request a sample
      </button>
      <a
        href={whatsappLink(whatsapp, `Hello Lobaloba Deluxe, I am interested in ${productName}. Please provide more information.`)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 border border-border px-4 py-3 text-xs tracking-[0.16em] uppercase hover:border-wine hover:text-wine"
      >
        <MessageCircle className="size-4" /> Ask a stylist
      </a>
      <SampleDialog open={open} onOpenChange={setOpen} productId={productId} productName={productName} colours={colours} />
    </div>
  );
}

function SampleDialog({ open, onOpenChange, productId, productName, colours }: { open: boolean; onOpenChange: (o: boolean) => void; productId: string; productName: string; colours: string[] }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-none bg-ivory">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl font-normal">Request a sample</DialogTitle>
          <DialogDescription>See and feel {productName} before you buy. Our team will contact you to arrange a swatch.</DialogDescription>
        </DialogHeader>
        {done ? (
          <p className="py-6 text-wine">{done}</p>
        ) : (
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              start(async () => {
                const res = await requestSample({
                  productId,
                  colour: String(f.get("colour") ?? ""),
                  fullName: String(f.get("fullName") ?? ""),
                  email: String(f.get("email") ?? ""),
                  phone: String(f.get("phone") ?? ""),
                  address: String(f.get("address") ?? ""),
                  notes: String(f.get("notes") ?? ""),
                });
                if (res.ok) setDone(res.message ?? "Request received.");
                else {
                  setErrors(res.fieldErrors ?? {});
                  setFormError(res.error);
                }
              });
            }}
          >
            {colours.length > 0 && (
              <Field label="Colour" error={errors.colour}>
                <select name="colour" className={inputClass}>
                  {colours.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Full name" error={errors.fullName}>
              <input name="fullName" required className={inputClass} autoComplete="name" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" error={errors.email}>
                <input name="email" type="email" required className={inputClass} autoComplete="email" />
              </Field>
              <Field label="Phone" error={errors.phone}>
                <input name="phone" type="tel" required className={inputClass} autoComplete="tel" />
              </Field>
            </div>
            <Field label="Delivery address" error={errors.address}>
              <input name="address" required className={inputClass} autoComplete="street-address" />
            </Field>
            <Field label="Notes (optional)" error={errors.notes}>
              <textarea name="notes" rows={3} className={inputClass} />
            </Field>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <Button type="submit" disabled={pending} className="h-12 rounded-none tracking-[0.2em] uppercase">
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Send request"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(5);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-4 border border-border bg-card p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const form = e.currentTarget;
        start(async () => {
          const res = await submitReview({ productId, rating, title: String(f.get("title") ?? ""), body: String(f.get("body") ?? "") });
          setMsg({ ok: res.ok, text: res.ok ? (res.message ?? "") : res.error });
          if (res.ok) form.reset();
        });
      }}
    >
      <p className="font-serif text-2xl">Write a review</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)}>
            <Star className={cn("size-6", n <= rating ? "fill-gold text-gold" : "text-border")} />
          </button>
        ))}
      </div>
      <input name="title" placeholder="Title (optional)" aria-label="Review title" className={inputClass} />
      <textarea name="body" required rows={4} placeholder="Tell other customers about this fabric" aria-label="Review" className={inputClass} />
      {msg && <p className={cn("text-sm", msg.ok ? "text-wine" : "text-destructive")}>{msg.text}</p>}
      <Button type="submit" disabled={pending} className="rounded-none tracking-[0.18em] uppercase">
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Submit review"}
      </Button>
    </form>
  );
}
