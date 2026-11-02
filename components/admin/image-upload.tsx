"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { uploadImage } from "@/app/actions/admin-catalog";

/** Uploads images to Supabase Storage via a validated server action. */
export function ImageUploadButton({ folder, onUploaded, multiple = false, label = "Upload image" }: { folder: string; onUploaded: (img: { url: string; path: string }) => void; multiple?: boolean; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("folder", folder);
      const res = await uploadImage(fd);
      if (res.ok) onUploaded(res.data);
      else setError(res.error);
    }
    setBusy(false);
    if (ref.current) ref.current.value = "";
  }

  return (
    <div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple={multiple} className="hidden" onChange={(e) => handle(e.target.files)} />
      <button type="button" disabled={busy} onClick={() => ref.current?.click()} className="inline-flex items-center gap-2 rounded-sm border border-dashed border-wine/50 px-3 py-2 text-xs text-wine hover:bg-cream">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />} {label}
      </button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      <p className="mt-1 text-[0.65rem] text-muted-foreground">JPEG, PNG, WebP or AVIF · max 5 MB</p>
    </div>
  );
}
