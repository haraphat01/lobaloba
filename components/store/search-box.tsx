"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { rememberSearch } from "@/components/store/search-dialog";

export function SearchBox({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (!q.trim()) return;
        rememberSearch(q.trim());
        router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
      className="flex max-w-2xl items-center gap-3 border-b border-ink/40"
    >
      <Search className="size-5 text-gold" />
      <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" placeholder="Search fabrics, colours, categories…" className="h-14 flex-1 bg-transparent font-serif text-2xl outline-none" />
      <button type="submit" className="text-xs tracking-[0.2em] text-wine uppercase">
        Search
      </button>
    </form>
  );
}
