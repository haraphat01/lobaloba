import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/components/account/auth-forms";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default function RegisterPage() {
  return (
    <>
      <h1 className="mb-2 text-center text-4xl">Create your account</h1>
      <p className="mb-8 text-center text-sm text-muted-foreground">Track orders, save addresses and keep your wishlist across devices.</p>
      <Suspense>
        <RegisterForm />
      </Suspense>
    </>
  );
}
