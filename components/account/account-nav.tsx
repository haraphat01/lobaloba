"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/returns", label: "Returns" },
  { href: "/account/quotations", label: "Quotations" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/profile", label: "Profile & password" },
];

export function AccountNav() {
  const pathname = usePathname();
  return <AccountNavLinks active={pathname} />;
}

export function AccountNavLinks({ active }: { active?: string }) {
  return (
    <nav aria-label="Account" className="flex gap-1 overflow-x-auto lg:flex-col">
      {LINKS.map((l) => {
        const isActive = l.href === "/account" ? active === "/account" : active?.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn("shrink-0 border-l-2 px-4 py-2.5 text-sm transition", isActive ? "border-wine bg-card text-wine" : "border-transparent text-charcoal hover:text-wine")}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
