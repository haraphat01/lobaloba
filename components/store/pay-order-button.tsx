"use client";

import { useState, useTransition } from "react";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { payExistingOrder } from "@/app/actions/checkout";

export function PayOrderButton({ orderNumber, token, label = "Pay now" }: { orderNumber: string; token: string; label?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="text-right">
      <Button
        className="h-12 rounded-none px-8 text-xs tracking-[0.22em] uppercase"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await payExistingOrder(orderNumber, token);
            if (res.ok) window.location.assign(res.data.paymentUrl);
            else setError(res.error);
          })
        }
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />} {label}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
