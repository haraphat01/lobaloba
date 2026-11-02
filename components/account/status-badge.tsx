import { orderStatusLabel, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-900",
  payment_confirmed: "bg-emerald-100 text-emerald-900",
  processing: "bg-sky-100 text-sky-900",
  preparing_dispatch: "bg-sky-100 text-sky-900",
  shipped: "bg-indigo-100 text-indigo-900",
  out_for_delivery: "bg-indigo-100 text-indigo-900",
  delivered: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-stone-200 text-stone-800",
  return_requested: "bg-rose-100 text-rose-900",
  refunded: "bg-stone-200 text-stone-800",
  paid: "bg-emerald-100 text-emerald-900",
  unpaid: "bg-amber-100 text-amber-900",
  new: "bg-amber-100 text-amber-900",
  quoted: "bg-sky-100 text-sky-900",
  accepted: "bg-emerald-100 text-emerald-900",
  converted: "bg-emerald-100 text-emerald-900",
  declined: "bg-stone-200 text-stone-800",
  expired: "bg-stone-200 text-stone-800",
};

export function StatusBadge({ status, kind = "order" }: { status: string; kind?: "order" | "other" }) {
  return (
    <span className={cn("inline-flex px-2 py-0.5 text-[0.68rem] font-medium tracking-wide whitespace-nowrap", tones[status] ?? "bg-muted text-foreground")}>
      {kind === "order" ? orderStatusLabel(status) : titleCase(status)}
    </span>
  );
}
