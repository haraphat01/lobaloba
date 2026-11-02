import { orderStatusLabel, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  pending_payment: "bg-amber-500/15 text-amber-300",
  payment_confirmed: "bg-emerald-500/15 text-emerald-300",
  processing: "bg-sky-500/15 text-sky-300",
  preparing_dispatch: "bg-sky-500/15 text-sky-300",
  shipped: "bg-indigo-500/15 text-indigo-300",
  out_for_delivery: "bg-indigo-500/15 text-indigo-300",
  delivered: "bg-emerald-500/15 text-emerald-300",
  cancelled: "bg-stone-500/20 text-stone-300",
  return_requested: "bg-rose-500/15 text-rose-300",
  refunded: "bg-stone-500/20 text-stone-300",
  paid: "bg-emerald-500/15 text-emerald-300",
  unpaid: "bg-amber-500/15 text-amber-300",
  new: "bg-amber-500/15 text-amber-300",
  quoted: "bg-sky-500/15 text-sky-300",
  accepted: "bg-emerald-500/15 text-emerald-300",
  converted: "bg-emerald-500/15 text-emerald-300",
  declined: "bg-stone-500/20 text-stone-300",
  expired: "bg-stone-500/20 text-stone-300",
};

export function StatusBadge({ status, kind = "order" }: { status: string; kind?: "order" | "other" }) {
  return (
    <span className={cn("inline-flex px-2 py-0.5 text-[0.68rem] font-medium tracking-wide whitespace-nowrap", tones[status] ?? "bg-muted text-foreground")}>
      {kind === "order" ? orderStatusLabel(status) : titleCase(status)}
    </span>
  );
}
