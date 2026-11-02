import { Suspense } from "react";
import { AnnouncementBar } from "@/components/store/announcement-bar";
import { SiteHeader } from "@/components/store/site-header";
import { SiteFooter } from "@/components/store/site-footer";
import { BagDrawer } from "@/components/store/bag-drawer";
import { WhatsAppFloat } from "@/components/store/whatsapp-float";
import { StoreProvider } from "@/components/store/store-provider";
import { getSettings } from "@/lib/data/settings";
import { getCategories, getCollections } from "@/lib/data/catalog";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const [settings, categories, collections] = await Promise.all([getSettings(), getCategories(), getCollections()]);
  const navCategories = categories.map((c) => ({ name: c.name, slug: c.slug }));

  return (
    <StoreProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-gold focus:text-onyx focus:px-4 focus:py-2">
        Skip to content
      </a>
      {settings.announcement.enabled && <AnnouncementBar messages={settings.announcement.messages} link={settings.announcement.link} />}
      <SiteHeader categories={navCategories} collections={collections.map((c) => ({ title: c.title, slug: c.slug }))} whatsapp={settings.business.whatsapp} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} categories={navCategories} />
      <BagDrawer />
      <Suspense fallback={null}>
        <WhatsAppFloat number={settings.business.whatsapp} />
      </Suspense>
    </StoreProvider>
  );
}
