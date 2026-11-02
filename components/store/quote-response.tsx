"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { respondToQuote } from "@/app/actions/quotes";

export function QuoteResponse({ token }: { token: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const respond = (d: "accepted" | "declined") =>
    start(async () => {
      const res = await respondToQuote(token, d);
      setMsg(res.ok ? (res.message ?? null) : res.error);
      router.refresh();
    });
  return (
    <div className="flex flex-wrap items-center gap-4 border-t border-border pt-8">
      <Button onClick={() => respond("accepted")} disabled={pending} className="h-12 rounded-none px-10 text-xs tracking-[0.22em] uppercase">
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Accept quotation"}
      </Button>
      <Button variant="outline" onClick={() => respond("declined")} disabled={pending} className="h-12 rounded-none px-8 text-xs tracking-[0.22em] uppercase">
        Decline
      </Button>
      {msg && <p className="text-sm text-wine">{msg}</p>}
    </div>
  );
}
