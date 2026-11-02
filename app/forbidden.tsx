import Link from "next/link";

export default function Forbidden() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-6 text-center">
      <div>
        <p className="eyebrow">Error 403</p>
        <h1 className="mt-3 text-5xl">Access restricted</h1>
        <p className="mt-4 text-muted-foreground">You don&apos;t have permission to view this area.</p>
        <Link href="/" className="mt-8 inline-block bg-wine px-8 py-4 text-xs tracking-[0.22em] text-ivory uppercase">Return home</Link>
      </div>
    </div>
  );
}
