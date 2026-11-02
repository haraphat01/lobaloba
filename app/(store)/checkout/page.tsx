import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckoutFlow } from "@/components/store/checkout-flow";
import { PageHeader } from "@/components/shared/page-header";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isPaystackConfigured } from "@/lib/paystack";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Shopping bag", href: "/bag" }, { label: "Checkout" }]} eyebrow="Almost yours" title="Complete your order" description="A few details, then your beautiful pieces will be on their way." />
      <div className="container-x py-8 sm:py-12">
        <Suspense fallback={<Skeleton className="mt-4 h-96 w-full rounded-sm" />}>
          <CheckoutLoader />
        </Suspense>
      </div>
    </>
  );
}

async function CheckoutLoader() {
  const user = await getCurrentUser();
  let addresses: { id: string; label: string; full_name: string; phone: string; country: string; state: string; city: string; address_line: string; is_default: boolean }[] = [];
  if (user) {
    const supabase = await createClient();
    const { data } = await supabase.from("addresses").select("id, label, full_name, phone, country, state, city, address_line, is_default").order("is_default", { ascending: false });
    addresses = data ?? [];
  }
  return (
    <CheckoutFlow
      user={user ? { email: user.email, fullName: user.fullName, phone: user.phone ?? "" } : null}
      addresses={addresses}
      paymentsReady={isPaystackConfigured()}
    />
  );
}
