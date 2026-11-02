"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/shared/field";
import { requestPasswordReset, signIn, signUp, updatePassword, type AuthState } from "@/app/actions/auth";

function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" disabled={pending} className="h-12 w-full rounded-none text-xs tracking-[0.22em] uppercase">
      {pending ? <Loader2 className="size-4 animate-spin" /> : children}
    </Button>
  );
}

/** Completes sign-in/up with a full page load so client session state is rebuilt. */
function useFollowRedirect(state: AuthState) {
  useEffect(() => {
    if (state.redirectTo) window.location.assign(state.redirectTo);
  }, [state.redirectTo]);
}

function Status({ state }: { state: AuthState }) {
  if (state.error) return <p role="alert" className="text-sm text-destructive">{state.error}</p>;
  if (state.message) return <p role="status" className="bg-cream p-4 text-sm text-wine">{state.message}</p>;
  return null;
}

export function LoginForm() {
  const params = useSearchParams();
  const [state, action, pending] = useActionState(signIn, {});
  useFollowRedirect(state);
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="next" value={params.get("next") ?? "/account"} />
      {params.get("error") === "link" && <p className="text-sm text-destructive">That link is invalid or has expired. Please try again.</p>}
      <Field label="Email" error={state.fieldErrors?.email}>
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </Field>
      <Field label="Password" error={state.fieldErrors?.password}>
        <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
      </Field>
      <div className="text-right text-xs">
        <Link href="/account/forgot-password" className="text-wine hover:underline">
          Forgot your password?
        </Link>
      </div>
      <Status state={state} />
      <Submit pending={pending || !!state.redirectTo}>Sign in</Submit>
      <p className="text-center text-sm text-muted-foreground">
        New to Lobaloba?{" "}
        <Link href={`/account/register${params.get("next") ? `?next=${encodeURIComponent(params.get("next")!)}` : ""}`} className="text-wine underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const params = useSearchParams();
  const [state, action, pending] = useActionState(signUp, {});
  useFollowRedirect(state);
  if (state.message) return <Status state={state} />;
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="next" value={params.get("next") ?? "/account"} />
      <Field label="Full name" error={fe.fullName}>
        <input name="fullName" required autoComplete="name" className={inputClass} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email" error={fe.email}>
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </Field>
        <Field label="Phone" error={fe.phone}>
          <input name="phone" type="tel" required autoComplete="tel" className={inputClass} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Password" error={fe.password} hint="At least 8 characters">
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
        </Field>
        <Field label="Confirm password" error={fe.confirm}>
          <input name="confirm" type="password" required autoComplete="new-password" className={inputClass} />
        </Field>
      </div>
      <Status state={state} />
      <Submit pending={pending}>Create account</Submit>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/account/login" className="text-wine underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, {});
  return (
    <form action={action} className="grid gap-5">
      <Field label="Email">
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </Field>
      <Status state={state} />
      <Submit pending={pending}>Send reset link</Submit>
    </form>
  );
}

export function NewPasswordForm({ submitLabel = "Update password" }: { submitLabel?: string }) {
  const [state, action, pending] = useActionState(updatePassword, {});
  return (
    <form action={action} className="grid gap-5">
      <Field label="New password" error={state.fieldErrors?.password} hint="At least 8 characters">
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
      </Field>
      <Field label="Confirm new password" error={state.fieldErrors?.confirm}>
        <input name="confirm" type="password" required autoComplete="new-password" className={inputClass} />
      </Field>
      <Status state={state} />
      <Submit pending={pending}>{submitLabel}</Submit>
    </form>
  );
}
