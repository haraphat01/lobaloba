import "server-only";
import crypto from "node:crypto";
import { env } from "@/lib/env";

const BASE = "https://api.paystack.co";

export class PaystackNotConfiguredError extends Error {
  constructor() {
    super("Paystack is not configured. Set PAYSTACK_SECRET_KEY in your environment.");
  }
}

function secret() {
  const key = env.paystackSecretKey();
  if (!key) throw new PaystackNotConfiguredError();
  return key;
}

export function isPaystackConfigured() {
  return !!env.paystackSecretKey();
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as { status: boolean; message: string; data: T } | null;
  if (!res.ok || !body?.status) {
    throw new Error(`Paystack ${path} failed: ${body?.message ?? res.statusText}`);
  }
  return body.data;
}

/** Converts a major-unit amount to the minor unit Paystack expects (kobo for NGN). */
export function toMinor(amount: number) {
  return Math.round(amount * 100);
}

export async function initializeTransaction(input: {
  email: string;
  amount: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  channels?: string[];
  metadata?: Record<string, unknown>;
}) {
  return call<{ authorization_url: string; access_code: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: toMinor(input.amount),
      currency: input.currency,
      reference: input.reference,
      callback_url: input.callbackUrl,
      channels: input.channels?.length ? input.channels : undefined,
      metadata: input.metadata,
    }),
  });
}

export type PaystackTransaction = {
  id: number;
  status: "success" | "failed" | "abandoned" | "reversed" | "ongoing" | "pending" | string;
  reference: string;
  amount: number;
  currency: string;
  channel: string;
  gateway_response: string;
  paid_at: string | null;
  authorization?: { last4?: string; brand?: string; card_type?: string };
};

export async function verifyTransaction(reference: string) {
  return call<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export async function refundTransaction(reference: string, amount?: number) {
  return call<{ status: string }>("/refund", {
    method: "POST",
    body: JSON.stringify({ transaction: reference, amount: amount ? toMinor(amount) : undefined }),
  });
}

/** Constant-time HMAC-SHA512 verification of the x-paystack-signature header. */
export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const expected = crypto.createHmac("sha512", secret()).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function newPaymentReference(orderNumber: string) {
  return `${orderNumber}-${crypto.randomBytes(4).toString("hex")}`.toUpperCase();
}
