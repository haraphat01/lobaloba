import type { Metadata } from "next";
import { NewPasswordForm } from "@/components/account/auth-forms";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="mb-2 text-center text-4xl">Choose a new password</h1>
      <p className="mb-8 text-center text-sm text-muted-foreground">You opened a secure reset link. Choose a new password for your account.</p>
      <NewPasswordForm submitLabel="Save new password" />
    </>
  );
}
