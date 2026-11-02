import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/account/auth-forms";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-2 text-center text-4xl">Welcome back</h1>
      <p className="mb-8 text-center text-sm text-muted-foreground">Sign in to view orders, saved addresses and your wishlist.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
