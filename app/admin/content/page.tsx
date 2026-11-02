import Link from "next/link";
import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/ui";
import { AnnouncementForm, HeroForm, HomepageForm, PoliciesForm } from "@/components/admin/settings-forms";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/data/settings";

export default function ContentPage() {
  return (
    <>
      <AdminHeader title="Website content" description="Homepage banner, announcements, sections and policy pages. Collections, FAQs and articles have their own sections." />
      <p className="mb-6 text-sm">
        Also manage: <Link href="/admin/collections" className="text-wine underline">Featured collections</Link> · <Link href="/admin/journal" className="text-wine underline">Journal & FAQs</Link> · <Link href="/admin/settings" className="text-wine underline">Contact & social links</Link> · <Link href="/admin/shipping" className="text-wine underline">Shipping settings</Link>
      </p>
      <Suspense>
        <Forms />
      </Suspense>
    </>
  );
}

async function Forms() {
  await requireAdmin();
  const s = await getSettings();
  return (
    <div className="space-y-6">
      <AnnouncementForm initial={s.announcement} />
      <HeroForm initial={s.hero} />
      <HomepageForm initial={s.homepage} />
      <PoliciesForm initial={s.policies} />
    </div>
  );
}
