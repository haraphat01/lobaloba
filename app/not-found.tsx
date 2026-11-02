import Link from "next/link";
import { Logo } from "@/components/shared/logo";

export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-6 text-center">
      <div>
        <Logo />
        <p className="eyebrow mt-12">Error 404</p>
        <h1 className="mt-3 text-5xl">This page has slipped off the bolt</h1>
        <p className="mt-4 text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/" className="bg-wine px-8 py-4 text-xs tracking-[0.22em] text-ivory uppercase">Home</Link>
          <Link href="/shop" className="border border-ink px-8 py-4 text-xs tracking-[0.22em] uppercase">Shop</Link>
        </div>
      </div>
    </div>
  );
}
