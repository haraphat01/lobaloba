"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

type Result = { ok: boolean; message?: string; error?: string };

/** Runs a server action, toasts the outcome and refreshes server data. */
export function useAdminAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<Result>, onOk?: () => void) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(res.message ?? "Saved");
        onOk?.();
        router.refresh();
      } else toast.error(res.error ?? "Something went wrong");
    });
  return { pending, run };
}
