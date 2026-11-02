"use client";

import { useState } from "react";
import { Panel } from "@/components/admin/ui";
import { useAdminAction } from "@/components/admin/use-action";
import { removeDemoData } from "@/app/actions/admin-catalog";

export function DemoDataPanel({ demoProducts, demoPosts }: { demoProducts: number; demoPosts: number }) {
  const [confirm, setConfirm] = useState(false);
  const { pending, run } = useAdminAction();
  return (
    <Panel title="Demo data">
      <p className="text-sm">
        {demoProducts} demo products and {demoPosts} demo articles are installed. Remove them before launch; real products and orders are not affected.
      </p>
      {demoProducts + demoPosts > 0 &&
        (confirm ? (
          <div className="mt-3 flex items-center gap-3 text-sm">
            <span>This permanently deletes all demo products and articles.</span>
            <button type="button" disabled={pending} onClick={() => run(removeDemoData, () => setConfirm(false))} className="rounded-sm bg-destructive px-3 py-1.5 text-xs text-white">Remove demo data</button>
            <button type="button" onClick={() => setConfirm(false)} className="text-xs underline">Cancel</button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirm(true)} className="mt-3 text-sm text-destructive underline">Remove all demo data…</button>
        ))}
    </Panel>
  );
}
