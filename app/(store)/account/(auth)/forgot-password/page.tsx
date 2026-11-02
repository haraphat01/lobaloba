import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/account/auth-forms";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="mb-2 text-center text-4xl">Forgot your password?</h1>
      <p className="mb-8 text-center text-sm text-muted-foreground">Enter your email and we will send you a secure link to choose a new password.</p>
      <ForgotPasswordForm />
    </>
  );
}
