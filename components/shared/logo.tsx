import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" aria-label="Lobaloba Deluxe — home" className={cn("group inline-flex flex-col items-center leading-none", className)}>
      <span className={cn("font-serif text-[1.65rem] tracking-[0.32em] sm:text-3xl", light ? "text-ivory" : "text-wine")}>LOBALOBA</span>
      <span className={cn("mt-1 text-[0.58rem] font-medium tracking-[0.6em] pl-[0.6em]", light ? "text-gold-light" : "text-gold")}>DELUXE</span>
    </Link>
  );
}
