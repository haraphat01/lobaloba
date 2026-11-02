"use client";

import Link from "next/link";
import { useState } from "react";
import { useAdminAction } from "@/components/admin/use-action";
import { deleteBlogPost, setBlogPostStatus } from "@/app/actions/admin-content";

export function PostRowActions({ id, status, slug }: { id: string; status: "draft" | "published"; slug: string }) {
  const { pending, run } = useAdminAction();
  const [confirm, setConfirm] = useState(false);
  return (
    <span className="flex justify-end gap-3 text-xs">
      {status === "published" && <Link href={`/journal/${slug}`} target="_blank" className="underline">View</Link>}
      <button type="button" disabled={pending} onClick={() => run(() => setBlogPostStatus(id, status === "published" ? "draft" : "published"))} className="text-wine underline">
        {status === "published" ? "Unpublish" : "Publish"}
      </button>
      {confirm ? (
        <button type="button" disabled={pending} onClick={() => run(() => deleteBlogPost(id))} className="font-medium text-destructive underline">Confirm delete</button>
      ) : (
        <button type="button" onClick={() => setConfirm(true)} className="text-destructive underline">Delete</button>
      )}
    </span>
  );
}
