"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Star } from "lucide-react";
import { moderateReview } from "@/app/actions/admin-catalog";
import { formatDate } from "@/lib/format";

type Review = { id: string; author_name: string; rating: number; title: string | null; body: string; is_approved: boolean; is_verified_purchase: boolean; created_at: string; product: string };

export function ReviewModeration({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const act = (id: string, action: "approve" | "hide" | "delete") =>
    start(async () => {
      await moderateReview(id, action);
      router.refresh();
    });
  if (!reviews.length) return <p className="text-sm text-muted-foreground">No reviews yet.</p>;
  return (
    <ul className="space-y-3">
      {reviews.map((r) => (
        <li key={r.id} className="rounded-sm border border-border bg-card p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p>
              <strong>{r.product}</strong> · {r.author_name} · {formatDate(r.created_at)}
              {r.is_verified_purchase && <span className="ml-2 text-xs text-wine">Verified</span>}
            </p>
            <span className="flex">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={n <= r.rating ? "size-3.5 fill-gold text-gold" : "size-3.5 text-border"} />
              ))}
            </span>
          </div>
          {r.title && <p className="mt-2 font-medium">{r.title}</p>}
          <p className="mt-1 text-muted-foreground">{r.body}</p>
          <div className="mt-3 flex gap-3 text-xs">
            <span className={r.is_approved ? "text-emerald-400" : "text-amber-400"}>{r.is_approved ? "Published" : "Awaiting approval"}</span>
            {r.is_approved ? (
              <button type="button" disabled={pending} onClick={() => act(r.id, "hide")} className="underline">Hide</button>
            ) : (
              <button type="button" disabled={pending} onClick={() => act(r.id, "approve")} className="text-wine underline">Approve</button>
            )}
            <button type="button" disabled={pending} onClick={() => act(r.id, "delete")} className="text-destructive underline">Delete</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
