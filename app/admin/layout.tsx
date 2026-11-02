import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AdminNav, AdminNavFallback } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/auth";
import { SignOutButton } from "@/components/account/sign-out-button";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · Lobaloba" }, robots: { index: false, follow: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-wine-deep px-4 py-6 lg:flex">
        <Link href="/admin" className="mb-8 px-3">
          <span className="font-serif text-2xl tracking-[0.3em] text-ivory">LOBALOBA</span>
          <span className="block text-[0.6rem] tracking-[0.5em] text-gold-light">ADMIN</span>
        </Link>
        <nav aria-label="Admin" className="flex-1 overflow-y-auto">
          <Suspense fallback={<AdminNavFallback />}>
            <AdminNav />
          </Suspense>
        </nav>
        <div className="space-y-2 border-t border-ivory/10 pt-4 text-xs">
          <Link href="/" className="block px-3 text-ivory/70 hover:text-ivory">
            View storefront ↗
          </Link>
          <SignOutButton className="px-3 text-ivory/70 hover:text-ivory" />
        </div>
      </aside>
      <div className="lg:hidden">
        <Suspense>
          <AdminNav />
        </Suspense>
      </div>
      <main className="min-w-0 flex-1 px-4 py-14 sm:px-8 lg:ml-64 lg:py-8">
        <Suspense
          fallback={
            <div className="grid h-64 place-items-center">
              <Loader2 className="size-6 animate-spin text-gold" />
            </div>
          }
        >
          <AdminGate>{children}</AdminGate>
        </Suspense>
      </main>
    </div>
  );
}

/** Server-side role check for every admin route (pages and actions re-check too). */
async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
