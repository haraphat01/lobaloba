"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminInput } from "@/components/admin/ui";
import { refundOrder, saveOrderNotes, updateOrderStatus, updateReturnRequest } from "@/app/actions/admin-orders";
import { ORDER_STATUSES, formatDateTime, titleCase } from "@/lib/format";

export function OrderAdminControls({
  order,
  canRefund,
}: {
  order: { id: string; status: string; paymentStatus: string; carrier: string; trackingNumber: string; trackingUrl: string; adminNotes: string };
  canRefund: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ status: order.status, note: "", carrier: order.carrier, trackingNumber: order.trackingNumber, trackingUrl: order.trackingUrl, notifyCustomer: true });
  const [notes, setNotes] = useState(order.adminNotes);
  const [refundReason, setRefundReason] = useState("");
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(res.message ?? "Saved");
        router.refresh();
      } else toast.error(res.error ?? "Failed");
    });

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium">Status</span>
          <select className={adminInput} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {ORDER_STATUSES.filter((s) => s.value !== "refunded" || order.paymentStatus === "refunded").map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium">Note to customer (optional)</span>
          <input className={adminInput} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium">Carrier</span>
          <input className={adminInput} value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} placeholder="e.g. GIG Logistics" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium">Tracking number</span>
          <input className={adminInput} value={form.trackingNumber} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} />
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2">
          <span className="text-xs font-medium">Tracking URL</span>
          <input className={adminInput} value={form.trackingUrl} onChange={(e) => setForm({ ...form, trackingUrl: e.target.value })} placeholder="https://" />
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={form.notifyCustomer} onChange={(e) => setForm({ ...form, notifyCustomer: e.target.checked })} /> Email the customer about this update
        </label>
      </div>
      <button type="button" disabled={pending} onClick={() => run(() => updateOrderStatus({ orderId: order.id, ...form }))} className="inline-flex h-9 items-center gap-2 rounded-sm bg-wine px-5 text-xs tracking-wider text-onyx uppercase">
        {pending && <Loader2 className="size-4 animate-spin" />} Update order
      </button>

      <div className="border-t border-border pt-4">
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium">Internal notes (not visible to customer)</span>
          <textarea className={adminInput} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <button type="button" disabled={pending} onClick={() => run(() => saveOrderNotes(order.id, notes))} className="mt-2 text-xs text-wine underline">
          Save notes
        </button>
      </div>

      {canRefund && order.paymentStatus === "paid" && (
        <div className="rounded-sm border border-destructive/30 p-4">
          <p className="text-sm font-medium">Refund</p>
          <p className="text-xs text-muted-foreground">Issues a full refund through Paystack, marks the order refunded and returns stock to inventory.</p>
          <input className={`${adminInput} mt-2`} placeholder="Reason (shared with customer)" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
          {confirmRefund ? (
            <div className="mt-2 flex items-center gap-3 text-xs">
              <span>Refund the full amount?</span>
              <button type="button" disabled={pending} onClick={() => run(() => refundOrder(order.id, refundReason))} className="rounded-sm bg-destructive px-3 py-1.5 text-white">
                Yes, refund
              </button>
              <button type="button" onClick={() => setConfirmRefund(false)} className="underline">Cancel</button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmRefund(true)} className="mt-2 text-xs text-destructive underline">
              Issue refund
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ReturnControls({ requests }: { requests: { id: string; reason: string; details: string | null; status: string; adminResponse: string | null; createdAt: string }[] }) {
  const router = useRouter();
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  return (
    <ul className="space-y-3">
      {requests.map((r) => (
        <li key={r.id} className="rounded-sm border border-border p-3 text-sm">
          <p>
            <strong>{r.reason}</strong> · {titleCase(r.status)} · {formatDateTime(r.createdAt)}
          </p>
          {r.details && <p className="text-muted-foreground">{r.details}</p>}
          {r.adminResponse && <p className="mt-1 text-xs">Response: {r.adminResponse}</p>}
          {["requested", "approved"].includes(r.status) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input className={`${adminInput} max-w-xs`} placeholder="Response to customer" value={responses[r.id] ?? ""} onChange={(e) => setResponses({ ...responses, [r.id]: e.target.value })} />
              {(["approved", "received", "rejected"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const res = await updateReturnRequest(r.id, s, responses[r.id] ?? "");
                      if (res.ok) toast.success("Return updated");
                      router.refresh();
                    })
                  }
                  className="rounded-sm border border-border px-2 py-1 text-xs capitalize hover:border-wine"
                >
                  {s === "approved" ? "Approve" : s === "received" ? "Mark received" : "Reject"}
                </button>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
