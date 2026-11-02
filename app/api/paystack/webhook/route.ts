import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPaystackConfigured, verifyWebhookSignature } from "@/lib/paystack";
import { confirmPaystackPayment } from "@/lib/payments";

// Paystack webhook. Configure in Paystack Dashboard → Settings → API Keys & Webhooks:
//   https://<your-domain>/api/paystack/webhook
// Every event is signature-verified, recorded once (idempotency key) and the
// transaction is re-verified with the Paystack API before the order is marked paid.
export async function POST(request: NextRequest) {
  if (!isPaystackConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const raw = await request.text();
  if (!verifyWebhookSignature(raw, request.headers.get("x-paystack-signature"))) {
    console.warn("[paystack-webhook] invalid signature");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: { event: string; data: { id?: number; reference?: string; status?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const reference = event.data?.reference ?? null;
  const eventKey = `${event.event}:${event.data?.id ?? reference ?? "unknown"}`;
  const supabase = createAdminClient();

  const { data: recorded, error: insertError } = await supabase
    .from("payment_webhook_events")
    .insert({ provider: "paystack", event_key: eventKey, event_type: event.event, reference, payload: event as never })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      // Already received. If it previously failed, let Paystack's retry reprocess it.
      const { data: existing } = await supabase.from("payment_webhook_events").select("id, status").eq("provider", "paystack").eq("event_key", eventKey).single();
      if (existing?.status !== "failed") return NextResponse.json({ received: true, duplicate: true });
      return process(existing.id, event.event, reference);
    }
    console.error("[paystack-webhook] could not record event", insertError.message);
    return NextResponse.json({ error: "storage error" }, { status: 500 });
  }

  return process(recorded.id, event.event, reference);
}

async function process(id: string, type: string, reference: string | null) {
  const supabase = createAdminClient();
  const mark = (status: "processed" | "ignored" | "failed", error?: string) =>
    supabase.from("payment_webhook_events").update({ status, error: error ?? null, processed_at: new Date().toISOString() }).eq("id", id);

  if (type !== "charge.success" || !reference) {
    await mark("ignored");
    return NextResponse.json({ received: true });
  }

  try {
    const result = await confirmPaystackPayment(reference, "webhook");
    await mark(result.ok ? "processed" : "ignored", result.ok ? undefined : result.reason);
    return NextResponse.json({ received: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[paystack-webhook] processing failed", message);
    await mark("failed", message);
    // 500 so Paystack retries.
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
