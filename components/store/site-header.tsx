"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Heart, Menu, MessageCircle, Search, ShoppingBag, User, X, ChevronDown } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useStore } from "@/components/store/store-provider";
import { SearchDialog } from "@/components/store/search-dialog";
import { whatsappLink } from "@/lib/format";
import { cn } from "@/lib/utils";

type NavLink = { label: string; href: string; children?: { label: string; href: string }[] };

export function SiteHeader({
  categories,
  collections,
  whatsapp,
}: {
  categories: { name: string; slug: string }[];
  collections: { title: string; slug: string }[];
  whatsapp: string;
}) {
  const { bagCount, wishlist, setBagOpen, ready } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const nav: NavLink[] = [
    {
      label: "Shop",
      href: "/shop",
      children: [{ label: "Shop all", href: "/shop" }, ...categories.map((c) => ({ label: c.name, href: `/shop/${c.slug}` }))],
    },
    { label: "New Arrivals", href: "/new-arrivals" },
    {
      label: "Collections",
      href: "/collections",
      children: [{ label: "All collections", href: "/collections" }, ...collections.map((c) => ({ label: c.title, href: `/collections/${c.slug}` }))],
    },
    { label: "Asoebi Lounge", href: "/asoebi" },
    { label: "Wholesale", href: "/wholesale" },
    { label: "Journal", href: "/journal" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  const wa = whatsappLink(whatsapp, "Hello Lobaloba Deluxe, I would like some assistance.");

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-[#fffdf9]/95 backdrop-blur-xl transition-shadow supports-[backdrop-filter]:bg-[#fffdf9]/90",
        scrolled ? "border-border/80 shadow-[0_8px_30px_-20px_rgba(74,18,32,0.35)]" : "border-transparent",
      )}
    >
      <div className="container-x grid h-[4.5rem] grid-cols-[1fr_auto_1fr] items-center sm:h-[5rem]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="-ml-2 rounded-full p-2 text-ink hover:bg-cream lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden items-center gap-2 rounded-full border border-border/80 bg-card/60 px-4 py-2 text-xs tracking-wide text-muted-foreground transition hover:border-gold hover:bg-card hover:text-ink lg:inline-flex"
          >
            <Search className="size-4" />
            Search fabrics, colours…
            <kbd className="ml-4 rounded bg-cream px-1.5 text-[0.65rem]">⌘K</kbd>
          </button>
        </div>

        <Logo />

        <div className="flex items-center justify-end gap-0.5 sm:gap-1">
          <IconButton label="Search" onClick={() => setSearchOpen(true)} className="lg:hidden">
            <Search className="size-5" />
          </IconButton>
          <IconLink href="/account" label="Account" className="hidden sm:inline-flex">
            <User className="size-5" />
          </IconLink>
          <IconLink href="/wishlist" label={ready ? `Wishlist (${wishlist.length})` : "Wishlist"}>
            <Heart className="size-5" />
            {ready && wishlist.length > 0 && <Count n={wishlist.length} />}
          </IconLink>
          <IconButton label={ready ? `Shopping bag (${bagCount})` : "Shopping bag"} onClick={() => setBagOpen(true)}>
            <ShoppingBag className="size-5" />
            {ready && bagCount > 0 && <Count n={bagCount} />}
          </IconButton>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 hidden items-center gap-1.5 rounded-full bg-wine px-3 py-2 text-[0.7rem] font-medium tracking-wider text-ivory uppercase transition hover:bg-wine-deep md:inline-flex"
          >
            <MessageCircle className="size-4" /> WhatsApp
          </a>
        </div>
      </div>

      <nav aria-label="Main" className="hidden border-t border-border/50 lg:block">
        <ul className="container-x flex h-11 items-center justify-center gap-6 text-[0.65rem] font-medium tracking-[0.13em] uppercase xl:gap-9">
          {nav.map((item) => (
            <li key={item.href} className="group relative">
              <Suspense fallback={<TopNavLink item={item} active={false} />}>
                <ActiveTopNavLink item={item} />
              </Suspense>
              {item.children && (
                <div className="invisible absolute top-full left-1/2 z-50 w-64 -translate-x-1/2 translate-y-2 pt-1 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <ul className="rounded-sm border border-border bg-card p-2 shadow-xl shadow-wine/10">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className="block rounded-sm px-3 py-2.5 text-[0.72rem] tracking-[0.08em] text-charcoal normal-case transition hover:bg-cream hover:text-wine"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto bg-ivory p-0">
          <SheetHeader className="flex-row items-center justify-between border-b border-border px-5 py-4">
            <SheetTitle className="font-serif text-xl text-wine">Menu</SheetTitle>
          </SheetHeader>
          <nav aria-label="Mobile" className="px-5 py-4">
            <ul className="divide-y divide-border/70">
              {nav.map((item) => (
                <li key={item.href}>
                  {item.children ? (
                    <details className="group py-1">
                      <summary className="flex cursor-pointer list-none items-center justify-between py-3 font-serif text-xl">
                        {item.label}
                        <ChevronDown className="size-4 transition group-open:rotate-180" />
                      </summary>
                      <ul className="pb-3 pl-2">
                        {item.children.map((c) => (
                          <li key={c.href}>
                            <Link href={c.href} onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-charcoal">
                              {c.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : (
                    <Link href={item.href} onClick={() => setMenuOpen(false)} className="block py-4 font-serif text-xl">
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-6 grid gap-3 text-sm">
              <Link href="/account" onClick={() => setMenuOpen(false)} className="flex items-center gap-2">
                <User className="size-4" /> My account
              </Link>
              <Link href="/track" onClick={() => setMenuOpen(false)} className="flex items-center gap-2">
                <ShoppingBag className="size-4" /> Track an order
              </Link>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-wine">
                <MessageCircle className="size-4" /> Chat with a stylist
              </a>
            </div>
          </nav>
          <button type="button" className="sr-only" onClick={() => setMenuOpen(false)}>
            <X /> Close
          </button>
        </SheetContent>
      </Sheet>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}

function Count({ n }: { n: number }) {
  return (
    <span className="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-wine px-1 text-[0.6rem] leading-4 font-semibold text-ivory">
      {n > 99 ? "99+" : n}
    </span>
  );
}

function IconLink({ href, label, children, className }: { href: string; label: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} aria-label={label} className={cn("relative inline-flex size-10 items-center justify-center rounded-full text-ink transition hover:bg-cream hover:text-wine", className)}>
      {children}
    </Link>
  );
}

function IconButton({ label, children, onClick, className }: { label: string; children: React.ReactNode; onClick: () => void; className?: string }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className={cn("relative inline-flex size-10 items-center justify-center rounded-full text-ink transition hover:bg-cream hover:text-wine", className)}>
      {children}
    </button>
  );
}

function ActiveTopNavLink({ item }: { item: NavLink }) {
  const pathname = usePathname();
  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  return <TopNavLink item={item} active={active} />;
}

function TopNavLink({ item, active }: { item: NavLink; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn("link-underline inline-flex items-center gap-1 py-3 transition-colors hover:text-wine", active ? "text-wine" : "text-charcoal")}
    >
      {item.label}
      {item.children && <ChevronDown className="size-3 transition group-hover:rotate-180" />}
    </Link>
  );
}
