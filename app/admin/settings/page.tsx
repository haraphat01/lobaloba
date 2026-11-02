import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/ui";
import { BusinessForm, EmailForm, PaymentForm, SocialForm, StoreForm } from "@/components/admin/settings-forms";
import { DemoDataPanel } from "@/components/admin/demo-data";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/data/settings";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

export default function SettingsPage() {
  return (
    <>
      <AdminHeader title="Settings" description="API keys and secrets are configured as environment variables, never here." />
      <Suspense>
        <Forms />
      </Suspense>
    </>
  );
}

async function Forms() {
  await requireAdmin();
  const s = await getSettings();
  const db = createAdminClient();
  const [{ count: demoProducts }, { count: demoPosts }] = await Promise.all([
    db.from("products").select("id", { count: "exact", head: true }).eq("is_demo", true),
    db.from("blog_posts").select("id", { count: "exact", head: true }).eq("is_demo", true),
  ]);
  return (
    <div className="space-y-6">
      <BusinessForm initial={s.business} />
      <SocialForm initial={s.social} />
      <StoreForm initial={s.store} />
      <PaymentForm initial={s.payment} paystackConfigured={!!env.paystackSecretKey()} />
      <EmailForm initial={s.email} resendConfigured={!!env.resendApiKey()} from={env.emailFrom()} />
      <DemoDataPanel demoProducts={demoProducts ?? 0} demoPosts={demoPosts ?? 0} />
    </div>
  );
}
