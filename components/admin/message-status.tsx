"use client";

import { useAdminAction } from "@/components/admin/use-action";
import { setMessageStatus } from "@/app/actions/admin-content";

export function MessageStatus({ table, id, status, options }: { table: "contact_messages" | "sample_requests"; id: string; status: string; options: string[] }) {
  const { pending, run } = useAdminAction();
  return (
    <select aria-label="Status" disabled={pending} defaultValue={status} onChange={(e) => run(() => setMessageStatus(table, id, e.target.value))} className="rounded-sm border border-border bg-background px-2 py-1 text-xs capitalize">
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}
