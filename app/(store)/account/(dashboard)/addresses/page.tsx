import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressManager } from "@/components/account/account-forms";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Saved addresses", robots: { index: false } };

export default function AddressesPage() {
  return (
    <>
      <h1 className="mb-8 text-5xl">Saved addresses</h1>
      <Suspense fallback={<Skeleton className="h-48 rounded-none" />}>
        <Addresses />
      </Suspense>
    </>
  );
}

async function Addresses() {
  await requireUser("/account/addresses");
  const supabase = await createClient();
  const { data } = await supabase.from("addresses").select("id, label, full_name, phone, country, state, city, address_line, is_default").order("created_at");
  return <AddressManager addresses={data ?? []} />;
}
