import { PageHeader } from "@/components/shared/page-header";
import { getSettings, type SiteSettings } from "@/lib/data/settings";
import { renderMarkdown } from "@/lib/markdown";

/** Renders an admin-editable policy (Admin → Content → Policies). */
export async function PolicyPage({ policy, title, eyebrow, description }: { policy: keyof SiteSettings["policies"]; title: string; eyebrow: string; description?: string }) {
  const settings = await getSettings();
  return (
    <>
      <PageHeader crumbs={[{ label: "Help", href: "/help" }, { label: title }]} eyebrow={eyebrow} title={title} description={description} />
      <div className="container-x max-w-3xl py-14">
        <div className="prose-lux" dangerouslySetInnerHTML={{ __html: renderMarkdown(settings.policies[policy] || "This page is being updated.") }} />
      </div>
    </>
  );
}
