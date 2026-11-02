import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View all",
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 sm:mb-10", align === "center" ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && (
          <p className="eyebrow mb-3 flex items-center gap-3 text-wine">
            <span className="h-px w-6 bg-gold" />
            {eyebrow}
          </p>
        )}
        <h2 className="text-[clamp(2.35rem,4vw,3.8rem)] leading-[0.98] font-normal text-wine">{title}</h2>
        {description && <p className="mt-3 max-w-xl text-[0.95rem] leading-7 text-charcoal/75">{description}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-2 text-xs font-medium tracking-[0.14em] text-wine uppercase">
          <span className="link-underline">{linkLabel}</span>
          <ArrowRight className="size-3.5 transition group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
