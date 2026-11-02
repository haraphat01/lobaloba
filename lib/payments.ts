import "server-only";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTransaction, toMinor } from "@/lib/paystack";
import { sendOrderEmail } from "@/lib/notifications";

export type ConfirmResult =
  | { ok: true; orderId: string; alreadyProcessed: boolean }
  | { ok: false; reason: string; orderId?: string };

/**
 * Verifies a Paystack transaction with the Paystack API (never trusting the
 * browser redirect) and confirms the order atomically and idempotently.
 * Safe to call from both the webhook and the callback page.
 */
export async function confirmPaystackPayment(reference: string, via: "webhook" | "callback"): Promise<ConfirmResult> {
  const tx = await verifyTransaction(reference);
  const supabase = createAdminClient();

  if (tx.status !== "success") {
    if (tx.status === "failed" || tx.status === "abandoned" || tx.status === "reversed") {
      await supabase
        .from("payments")
        .update({ status: tx.status === "reversed" ? "reversed" : tx.status === "failed" ? "failed" : "abandoned", gateway_response: tx.gateway_response })
        .eq("reference", reference)
        .neq("status", "success");
    }
    return { ok: false, reason: `transaction_${tx.status}` };
  }

  const { data, error } = await supabase.rpc("confirm_order_payment", {
    p_reference: tx.reference,
    p_amount_minor: tx.amount,
    p_currency: tx.currency,
    p_channel: tx.channel,
    p_card_last4: tx.authorization?.last4 ?? null,
    p_card_brand: tx.authorization?.brand ?? null,
    p_gateway_response: tx.gateway_response,
    p_paid_at: tx.paid_at ?? new Date().toISOString(),
    p_verified_via: via,
  } as never);
  if (error) throw new Error(`confirm_order_payment failed: ${error.message}`);

  const result = data as { ok: boolean; already_processed?: boolean; order_id?: string; reason?: string };
  if (!result.ok) return { ok: false, reason: result.reason ?? "unknown", orderId: result.order_id };

  if (!result.already_processed && result.order_id) {
    // Stock and bestseller counts changed.
    revalidateTag("products", "max");
    await Promise.allSettled([
      sendOrderEmail(result.order_id, "order_confirmation"),
      sendOrderEmail(result.order_id, "payment_confirmation", { reference: tx.reference, channel: tx.channel }),
    ]);
  }
  return { ok: true, orderId: result.order_id!, alreadyProcessed: !!result.already_processed };
}

export { toMinor };
