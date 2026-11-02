import { cn } from "@/lib/utils";

export const inputClass =
  "w-full border border-input bg-card px-3 py-2.5 text-sm outline-none transition focus:border-wine focus:ring-2 focus:ring-gold/20 aria-[invalid=true]:border-destructive";

export function Field({ label, error, children, className, hint }: { label: string; error?: string; children: React.ReactNode; className?: string; hint?: string }) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span className="text-[0.68rem] font-medium tracking-[0.18em] uppercase">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-muted-foreground">{hint}</span>}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}
