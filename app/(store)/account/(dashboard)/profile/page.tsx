import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileForm } from "@/components/account/account-forms";
import { NewPasswordForm } from "@/components/account/auth-forms";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

export default function ProfilePage() {
  return (
    <div className="space-y-14">
      <section>
        <h1 className="mb-8 text-5xl">Profile</h1>
        <Suspense fallback={<Skeleton className="h-64 rounded-none" />}>
          <Profile />
        </Suspense>
      </section>
      <section className="max-w-xl border-t border-border pt-10">
        <h2 className="mb-6 text-3xl">Change password</h2>
        <NewPasswordForm />
      </section>
    </div>
  );
}

async function Profile() {
  const user = await requireUser("/account/profile");
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("marketing_opt_in").eq("id", user.id).maybeSingle();
  return <ProfileForm fullName={user.fullName} phone={user.phone ?? ""} email={user.email} marketing={!!data?.marketing_opt_in} />;
}
