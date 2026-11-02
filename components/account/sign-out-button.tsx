"use client";

import { useTransition } from "react";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

/** Signs out on the server, then reloads so no account data stays in the browser. */
export function SignOutButton({ className }: { className?: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={cn(className)}
      onClick={() =>
        start(async () => {
          await signOut();
          // Full reload on purpose: clears in-memory session, bag and wishlist state.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.assign("/");
        })
      }
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
