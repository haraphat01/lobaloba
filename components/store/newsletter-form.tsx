"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { subscribeNewsletter } from "@/app/actions/forms";
import { cn } from "@/lib/utils";

export function NewsletterForm({ source = "website", tone = "light" }: { source?: string; tone?: "light" | "dark" }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await subscribeNewsletter({ email, source });
          setMessage({ ok: res.ok, text: res.ok ? (res.message ?? "Subscribed") : res.error });
          if (res.ok) setEmail("");
        });
      }}
      className="w-full"
    >
      <div className={cn("flex items-center border-b", tone === "dark" ? "border-ivory/40" : "border-ink/30")}>
        <label htmlFor={`nl-${source}`} className="sr-only">
          Email address
        </label>
        <input
          id={`nl-${source}`}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          className={cn(
            "h-12 flex-1 bg-transparent text-sm outline-none",
            tone === "dark" ? "text-ivory placeholder:text-ivory/50" : "placeholder:text-muted-foreground",
          )}
        />
        <button type="submit" disabled={pending} aria-label="Subscribe" className={cn("p-2 transition hover:translate-x-1", tone === "dark" ? "text-gold-light" : "text-wine")}>
          {pending ? <Loader2 className="size-5 animate-spin" /> : <ArrowRight className="size-5" />}
        </button>
      </div>
      {message && (
        <p role="status" className={cn("mt-3 flex items-center gap-1.5 text-xs", message.ok ? (tone === "dark" ? "text-gold-light" : "text-wine") : "text-destructive")}>
          {message.ok && <Check className="size-3.5" />} {message.text}
        </p>
      )}
    </form>
  );
}
