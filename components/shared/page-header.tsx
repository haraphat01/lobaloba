import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/shared/json-ld";
import { siteUrl } from "@/lib/site-url";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ label: "Home", href: "/" }, ...items];
  const site = siteUrl;
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-[0.7rem] tracking-[0.14em] text-muted-foreground uppercase">
        <ol className="flex flex-wrap items-center gap-1.5">
          {all.map((c, i) => (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="size-3" />}
              {c.href && i < all.length - 1 ? (
                <Link href={c.href} className="hover:text-wine">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={i === all.length - 1 ? "page" : undefined} className="text-charcoal">
                  {c.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.label,
            ...(c.href ? { item: `${site}${c.href}` } : {}),
          })),
        }}
      />
    </>
  );
}

export function PageHeader({ eyebrow, title, description, crumbs }: { eyebrow?: string; title: string; description?: string; crumbs?: Crumb[] }) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-cream">
      <div className="container-x relative py-9 sm:py-12 lg:py-14">
        {crumbs && <Breadcrumbs items={crumbs} />}
        <div className={crumbs ? "mt-6 max-w-4xl sm:mt-8" : "max-w-4xl"}>
          {eyebrow && (
            <p className="eyebrow flex items-center gap-3 text-wine">
              <span className="h-px w-7 bg-gold" />
              {eyebrow}
            </p>
          )}
          <h1 className="mt-3 text-[clamp(2.9rem,6vw,5.25rem)] leading-[0.96] font-normal text-wine">{title}</h1>
          {description && <p className="mt-4 max-w-2xl text-base leading-7 text-charcoal/80 sm:mt-5 sm:text-lg sm:leading-8">{description}</p>}
        </div>
      </div>
    </section>
  );
}
