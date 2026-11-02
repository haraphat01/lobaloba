import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Confirm subscription", robots: { index: false } };

export default function NewsletterConfirmPage({ searchParams }: PageProps<"/newsletter/confirm">) {
  return (
    <div className="container-x max-w-xl py-24 text-center">
      <Suspense fallback={<p>Confirming…</p>}>
        <Confirm searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Confirm({ searchParams }: Pick<PageProps<"/newsletter/confirm">, "searchParams">) {
  const { token } = await searchParams;
  let ok = false;
  if (typeof token === "string" && /^[0-9a-f-]{36}$/i.test(token)) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("newsletter_subscribers")
      .update({ status: "subscribed", confirmed_at: new Date().toISOString() })
      .eq("confirm_token", token)
      .select("id")
      .maybeSingle();
    ok = !!data;
  }
  return (
    <>
      <h1 className="text-5xl">{ok ? "You're subscribed" : "Link not valid"}</h1>
      <p className="mt-4 text-muted-foreground">{ok ? "Welcome to the Lobaloba circle. Look out for new arrivals and private sale invitations." : "This confirmation link is invalid or has already been used."}</p>
      <Link href="/shop" className="mt-8 inline-block bg-wine px-8 py-4 text-xs tracking-[0.22em] text-ivory uppercase">
        Explore the collection
      </Link>
    </>
  );
}
