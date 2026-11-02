import { Suspense } from "react";
import { AccountNav, AccountNavLinks } from "@/components/account/account-nav";
import { SignOutButton } from "@/components/account/sign-out-button";

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <div className="container-x py-8 sm:py-12">
      <p className="eyebrow flex items-center gap-3 text-wine"><span className="h-px w-7 bg-gold" />Your Lobaloba</p>
      <h1 className="mt-3 text-5xl font-normal text-wine">My account</h1>
      <div className="mt-8 grid gap-5 lg:grid-cols-[230px_1fr] lg:gap-8">
        <aside className="h-fit space-y-5 rounded-sm border border-border bg-card p-3 sm:p-4">
          <Suspense fallback={<AccountNavLinks />}>
            <AccountNav />
          </Suspense>
          <div className="border-t border-border pt-3">
            <SignOutButton className="px-4 text-xs tracking-[0.14em] text-muted-foreground uppercase transition-colors hover:text-wine" />
          </div>
        </aside>
        <div className="min-w-0 rounded-sm border border-border bg-card p-5 sm:p-8 lg:p-10">{children}</div>
      </div>
    </div>
  );
}
