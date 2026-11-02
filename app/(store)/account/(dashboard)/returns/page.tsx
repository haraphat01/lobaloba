import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/account/status-badge";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Returns", robots: { index: false } };

export default function ReturnsPage() {
  return (
    <>
      <h1 className="text-5xl">Returns</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        To start a return, open the order from your <Link href="/account/orders" className="text-wine underline">order history</Link> and choose “Request a return”.
      </p>
      <Suspense fallback={<Skeleton className="mt-8 h-40 rounded-none" />}>
        <ReturnList />
      </Suspense>
    </>
  );
}

async function ReturnList() {
  await requireUser("/account/returns");
  const supabase = await createClient();
  const { data } = await supabase.from("return_requests").select("id, reason, status, admin_response, created_at, orders(id, order_number)").order("created_at", { ascending: false });
  if (!data?.length) return <p className="mt-8 text-muted-foreground">You have no return requests.</p>;
  return (
    <ul className="mt-8 space-y-3">
      {data.map((r) => {
        const order = r.orders as unknown as { id: string; order_number: string };
        return (
          <li key={r.id} className="border border-border bg-card p-5 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link href={`/account/orders/${order.id}`} className="font-medium text-wine hover:underline">
                {order.order_number}
              </Link>
              <StatusBadge status={r.status} kind="other" />
            </div>
            <p className="mt-2">{r.reason}</p>
            {r.admin_response && <p className="mt-1 text-muted-foreground">Response: {r.admin_response}</p>}
            <p className="mt-2 text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
          </li>
        );
      })}
    </ul>
  );
}
