"use client";

import { useState } from "react";
import { adminInput } from "@/components/admin/ui";
import { useAdminAction } from "@/components/admin/use-action";
import { deleteFaq, saveFaq } from "@/app/actions/admin-content";

type Faq = { id?: string; question: string; answer: string; category: string; sortOrder: number; isActive: boolean };

function FaqRow({ faq }: { faq: Faq }) {
  const [f, setF] = useState(faq);
  const { pending, run } = useAdminAction();
  return (
    <li className="grid gap-2 rounded-sm border border-border p-3 text-sm sm:grid-cols-[1fr_160px_80px]">
      <input className={adminInput} value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} placeholder="Question" aria-label="Question" />
      <input className={adminInput} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="Category" aria-label="Category" />
      <input className={adminInput} type="number" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: Number(e.target.value) })} aria-label="Order" />
      <textarea className={`${adminInput} sm:col-span-3`} rows={2} value={f.answer} onChange={(e) => setF({ ...f, answer: e.target.value })} placeholder="Answer" aria-label="Answer" />
      <div className="flex items-center gap-4 text-xs sm:col-span-3">
        <label className="flex items-center gap-1"><input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} /> Visible</label>
        <button type="button" disabled={pending} onClick={() => run(() => saveFaq(f))} className="text-wine underline">Save</button>
        {f.id && <button type="button" disabled={pending} onClick={() => run(() => deleteFaq(f.id!))} className="text-destructive underline">Delete</button>}
      </div>
    </li>
  );
}

export function FaqManager({ faqs }: { faqs: Faq[] }) {
  const [adding, setAdding] = useState(0);
  return (
    <>
      <ul className="space-y-3">
        {faqs.map((f) => <FaqRow key={f.id} faq={f} />)}
        {Array.from({ length: adding }, (_, i) => <FaqRow key={`n${i}`} faq={{ question: "", answer: "", category: "General", sortOrder: faqs.length + i + 1, isActive: true }} />)}
      </ul>
      <button type="button" onClick={() => setAdding((n) => n + 1)} className="mt-3 text-xs text-wine underline">Add FAQ</button>
    </>
  );
}
