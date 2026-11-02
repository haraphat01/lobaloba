import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/account/status-badge";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Quotations", robots: { index: false } };

export default function QuotationsPage() {
  return (
    <>
      <h1 className="text-5xl">Quotations</h1>
      <Suspense fallback={<Skeleton className="mt-8 h-40 rounded-none" />}>
        <QuoteList />
      </Suspense>
    </>
  );
}

async function QuoteList() {
  await requireUser("/account/quotations");
  const supabase = await createClient();
  const { data } = await supabase.from("quotation_requests").select("id, reference, request_type, status, total, currency, access_token, created_at").order("created_at", { ascending: false });
  if (!data?.length)
    return (
      <p className="mt-8 text-muted-foreground">
        No quotation requests yet. Visit the <Link href="/asoebi" className="text-wine underline">Asoebi Lounge</Link> or <Link href="/wholesale" className="text-wine underline">Wholesale</Link> to request one.
      </p>
    );
  return (
    <ul className="mt-8 divide-y divide-border border-y border-border">
      {data.map((q) => (
        <li key={q.id}>
          <Link href={`/quotes/${q.access_token}`} className="flex items-center justify-between gap-4 py-4 hover:bg-card">
            <div>
              <p className="font-medium">{q.reference}</p>
              <p className="text-sm text-muted-foreground">
                {q.request_type === "asoebi" ? "Asoebi" : "Wholesale"} · {formatDate(q.created_at)}
              </p>
            </div>
            <div className="text-right">
              <StatusBadge status={q.status} kind="other" />
              {Number(q.total) > 0 && <p className="mt-1 text-sm">{formatMoney(q.total, q.currency)}</p>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
