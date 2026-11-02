import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ClearBag } from "@/components/store/clear-bag";
import { OrderSummary, OrderTimeline } from "@/components/store/order-details";
import { confirmPaystackPayment } from "@/lib/payments";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrderWithAccess } from "@/lib/data/orders";

export const metadata: Metadata = { title: "Order confirmation", robots: { index: false } };

export default function CheckoutCompletePage({ searchParams }: PageProps<"/checkout/complete">) {
  return (
    <div className="container-x py-14">
      <Suspense fallback={<Verifying />}>
        <Confirmation searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function Verifying() {
  return (
    <div className="space-y-4">
      <p className="font-serif text-3xl">Confirming your payment…</p>
      <Skeleton className="h-64 w-full rounded-none" />
    </div>
  );
}

async function Confirmation({ searchParams }: Pick<PageProps<"/checkout/complete">, "searchParams">) {
  const sp = await searchParams;
  const reference = String(Array.isArray(sp.reference) ? sp.reference[0] : (sp.reference ?? sp.trxref ?? "")).slice(0, 80);
  if (!reference) return <Failure message="We couldn't find a payment reference." />;

  // Look the order up via the payment reference, then verify with Paystack server-side.
  const supabase = createAdminClient();
  const { data: payment } = await supabase.from("payments").select("order_id, orders(order_number, access_token)").eq("reference", reference).maybeSingle();
  if (!payment) return <Failure message="We couldn't find this payment." />;
  const ref = payment.orders as unknown as { order_number: string; access_token: string };

  let verified = false;
  let reason = "";
  try {
    const result = await confirmPaystackPayment(reference, "callback");
    verified = result.ok;
    if (!result.ok) reason = result.reason;
  } catch (e) {
    console.error("[checkout-complete] verification error", e);
    reason = "verification_unavailable";
  }

  const order = await getOrderWithAccess(ref.order_number, { token: ref.access_token });
  if (!order) return <Failure message="We couldn't load your order." />;
  const trackHref = `/orders/${order.order_number}?token=${order.access_token}`;

  if (!verified && order.payment_status !== "paid") {
    const pending = reason === "verification_unavailable" || reason === "transaction_ongoing" || reason === "transaction_pending";
    return pending ? (
      <div className="mx-auto max-w-2xl text-center">
        <Clock className="mx-auto size-12 text-gold" strokeWidth={1.2} />
        <h1 className="mt-6 text-5xl">Payment processing</h1>
        <p className="mt-4 text-muted-foreground">
          Your payment for order <strong>{order.order_number}</strong> is still being confirmed. You&apos;ll receive an email as soon as it&apos;s complete.
        </p>
        <Link href={trackHref} className="mt-8 inline-block text-xs tracking-[0.2em] text-wine uppercase underline underline-offset-4">
          View order status
        </Link>
      </div>
    ) : (
      <Failure message="Your payment was not completed. No money has been taken for this attempt." retryHref={trackHref} />
    );
  }

  return (
    <>
      <ClearBag />
      <div className="mx-auto max-w-2xl text-center">
        <CheckCircle2 className="mx-auto size-14 text-wine" strokeWidth={1.2} />
        <p className="eyebrow mt-6">Order {order.order_number}</p>
        <h1 className="mt-3 text-5xl sm:text-6xl">Thank you, {order.full_name.split(" ")[0]}</h1>
        <p className="mt-4 text-muted-foreground">
          Your payment has been confirmed. A confirmation has been sent to <strong className="text-ink">{order.email}</strong>.
        </p>
      </div>
      <div className="mx-auto mt-14 max-w-5xl space-y-14">
        <OrderTimeline order={order} />
        <OrderSummary order={order} />
        <div className="flex flex-wrap justify-center gap-4">
          <Link href={trackHref} className="bg-wine px-8 py-4 text-xs tracking-[0.22em] text-ivory uppercase">
            Track this order
          </Link>
          <Link href="/shop" className="border border-ink px-8 py-4 text-xs tracking-[0.22em] uppercase">
            Continue shopping
          </Link>
        </div>
      </div>
    </>
  );
}

function Failure({ message, retryHref }: { message: string; retryHref?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <XCircle className="mx-auto size-12 text-destructive" strokeWidth={1.2} />
      <h1 className="mt-6 text-5xl">Payment not completed</h1>
      <p className="mt-4 text-muted-foreground">{message}</p>
      <div className="mt-8 flex justify-center gap-4">
        {retryHref && (
          <Link href={retryHref} className="bg-wine px-8 py-4 text-xs tracking-[0.22em] text-ivory uppercase">
            Try payment again
          </Link>
        )}
        <Link href="/bag" className="border border-ink px-8 py-4 text-xs tracking-[0.22em] uppercase">
          Return to bag
        </Link>
      </div>
    </div>
  );
}
