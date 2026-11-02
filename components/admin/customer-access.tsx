"use client";

import { adminInput } from "@/components/admin/ui";
import { useAdminAction } from "@/components/admin/use-action";
import { setCustomerAccess } from "@/app/actions/admin-content";

export function CustomerAccess({ userId, isActive, role, canManage }: { userId: string; isActive: boolean; role: "customer" | "staff" | "admin"; canManage: boolean }) {
  const { pending, run } = useAdminAction();
  if (!canManage) return <p className="text-sm text-muted-foreground">Role: {role}. Only administrators can change access (and not their own).</p>;
  return (
    <div className="space-y-3 text-sm">
      <label className="grid gap-1">
        Role
        <select className={adminInput} defaultValue={role} disabled={pending} onChange={(e) => run(() => setCustomerAccess(userId, { role: e.target.value as typeof role }))}>
          <option value="customer">Customer</option>
          <option value="staff">Staff (dashboard access)</option>
          <option value="admin">Administrator</option>
        </select>
      </label>
      <button type="button" disabled={pending} onClick={() => run(() => setCustomerAccess(userId, { isActive: !isActive }))} className={isActive ? "text-destructive underline" : "text-wine underline"}>
        {isActive ? "Disable account" : "Re-enable account"}
      </button>
    </div>
  );
}
