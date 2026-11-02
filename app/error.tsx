"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-6 text-center">
      <div>
        <h1 className="text-5xl">Something went wrong</h1>
        <p className="mt-4 text-muted-foreground">Please try again. If the problem continues, contact us on WhatsApp.</p>
        <button type="button" onClick={reset} className="mt-8 bg-wine px-8 py-4 text-xs tracking-[0.22em] text-onyx uppercase">
          Try again
        </button>
      </div>
    </div>
  );
}
