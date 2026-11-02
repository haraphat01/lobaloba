"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3, BookOpen, Boxes, FolderTree, Inbox, LayoutTemplate, Menu, Package, Percent, Settings, ShoppingCart, Sparkles, Truck, Users, FileText, X, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products & stock", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/collections", label: "Collections", icon: Layers },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/quotations", label: "Quotations", icon: FileText },
  { href: "/admin/asoebi", label: "Asoebi events", icon: Sparkles },
  { href: "/admin/promotions", label: "Promotions", icon: Percent },
  { href: "/admin/shipping", label: "Shipping", icon: Truck },
  { href: "/admin/content", label: "Website content", icon: LayoutTemplate },
  { href: "/admin/journal", label: "Journal & FAQs", icon: BookOpen },
  { href: "/admin/messages", label: "Messages", icon: Inbox },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function Links({ active, onNavigate }: { active?: string; onNavigate?: () => void }) {
  return (
    <ul className="space-y-0.5">
      {ADMIN_LINKS.map(({ href, label, icon: Icon }) => {
        const isActive = href === "/admin" ? active === "/admin" : active?.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              className={cn("flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition", isActive ? "bg-wine text-ivory" : "text-ivory/75 hover:bg-ivory/10 hover:text-ivory")}
            >
              <Icon className="size-4" /> {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="fixed top-3 left-3 z-50 rounded bg-wine-deep p-2 text-ivory lg:hidden" onClick={() => setOpen(true)} aria-label="Open admin menu">
        <Menu className="size-5" />
      </button>
      <div className="hidden lg:block">
        <Links active={pathname} />
      </div>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="h-full w-72 overflow-y-auto bg-wine-deep p-4" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="mb-4 text-ivory">
              <X className="size-5" />
            </button>
            <Links active={pathname} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

export function AdminNavFallback() {
  return (
    <div className="hidden lg:block">
      <Links />
    </div>
  );
}

export { Boxes };
