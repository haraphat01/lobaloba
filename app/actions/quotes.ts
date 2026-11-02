"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email/send";
import { emailTemplates } from "@/lib/email/templates";
import { notifyAdmin } from "@/lib/notifications";
import type { ActionResult } from "@/lib/validation";

/** Customer accepts or declines a quotation using its private link token. */
export async function respondToQuote(token: string, decision: "accepted" | "declined"): Promise<ActionResult> {
  const parsed = z.object({ token: z.string().uuid(), decision: z.enum(["accepted", "declined"]) }).safeParse({ token, decision });
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  if (!(await rateLimit("quote-respond", 10, 600))) return { ok: false, error: "Too many attempts." };

  const supabase = createAdminClient();
  const { data: quote } = await supabase
    .from("quotation_requests")
    .select("id, reference, full_name, email, status, valid_until")
    .eq("access_token", parsed.data.token)
    .maybeSingle();
  if (!quote) return { ok: false, error: "Quotation not found." };
  if (quote.status !== "quoted") return { ok: false, error: "This quotation can no longer be changed." };
  if (quote.valid_until && new Date(`${quote.valid_until}T23:59:59+01:00`).getTime() < Date.now()) {
    await supabase.from("quotation_requests").update({ status: "expired" }).eq("id", quote.id);
    return { ok: false, error: "This quotation has expired. Please contact us for an updated quote." };
  }

  await supabase.from("quotation_requests").update({ status: parsed.data.decision, responded_at: new Date().toISOString() }).eq("id", quote.id);
  const view = `${env.siteUrl()}/quotes/${parsed.data.token}`;

  if (parsed.data.decision === "accepted") {
    const customer = emailTemplates.quotationAccepted(quote, { site: env.siteUrl(), view });
    await sendEmail({ to: quote.email, subject: customer.subject, html: customer.html });
    const admin = emailTemplates.quotationAccepted(quote, { site: env.siteUrl(), view: `${env.siteUrl()}/admin/quotations/${quote.id}` }, true);
    await notifyAdmin({ type: "quotation_accepted", title: admin.subject, link: `/admin/quotations/${quote.id}`, email: true });
  } else {
    await notifyAdmin({ type: "quotation_declined", title: `Quotation ${quote.reference} declined`, link: `/admin/quotations/${quote.id}` });
  }
  revalidatePath(`/quotes/${parsed.data.token}`);
  return { ok: true, message: parsed.data.decision === "accepted" ? "Thank you — your quotation has been accepted." : "Quotation declined." };
}

/** Product picker search used by quotation forms. */
export async function searchProductsForQuote(q: string) {
  const term = String(q ?? "").trim().slice(0, 80);
  const supabase = createAdminClient();
  let query = supabase.from("product_listing").select("id, name, slug, price, currency, purchase_unit, unit_label, colour_names, images").eq("status", "active").limit(12);
  if (term) {
    const { data: ids } = await supabase.rpc("search_products", { p_query: term, p_limit: 12 });
    query = query.in("id", (ids ?? []).map((r) => r.id));
  } else {
    query = query.order("sales_count", { ascending: false });
  }
  const { data } = await query;
  return (data ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    price: Number(p.price),
    currency: p.currency as string,
    purchaseUnit: p.purchase_unit as string,
    unitLabel: p.unit_label as string | null,
    colours: (p.colour_names ?? []) as string[],
    image: ((p.images as { url: string }[] | null) ?? [])[0]?.url ?? null,
  }));
}
