import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CircleHelp, MessageCircle, PackageSearch, Ruler, RotateCcw, Sparkles, Truck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { getSettings } from "@/lib/data/settings";
import { whatsappLink } from "@/lib/format";

export const metadata: Metadata = {
  title: "Help centre",
  description: "Get help with orders, delivery, returns, fabric care and yardage at Lobaloba Deluxe.",
  alternates: { canonical: "/help" },
};

export default async function HelpPage() {
  const { business } = await getSettings();
  const topics = [
    { href: "/track", icon: PackageSearch, title: "Track an order", text: "Check the status of your delivery." },
    { href: "/faq", icon: CircleHelp, title: "FAQs", text: "Quick answers to common questions." },
    { href: "/shipping", icon: Truck, title: "Shipping & delivery", text: "Delivery options, fees and timelines." },
    { href: "/returns", icon: RotateCcw, title: "Returns & refunds", text: "How returns and refunds work." },
    { href: "/fabric-care", icon: Sparkles, title: "Fabric care guide", text: "Keep your fabrics beautiful for years." },
    { href: "/yardage-guide", icon: Ruler, title: "Size & yardage guide", text: "How much fabric does your style need?" },
    { href: "/journal", icon: BookOpen, title: "Fabric guides", text: "In-depth articles from our stylists." },
    { href: "/contact", icon: MessageCircle, title: "Contact us", text: "Send us a message — we reply within a day." },
  ];
  return (
    <>
      <PageHeader crumbs={[{ label: "Help centre" }]} eyebrow="Customer care" title="How can we help?" />
      <div className="container-x py-14">
        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          {topics.map(({ href, icon: Icon, title, text }) => (
            <Link key={href} href={href} className="group bg-ivory p-8 transition hover:bg-card">
              <Icon className="size-6 text-gold" strokeWidth={1.3} />
              <p className="mt-4 font-serif text-2xl group-hover:text-wine">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </Link>
          ))}
        </div>
        {business.whatsapp && (
          <div className="mt-14 flex flex-col items-center gap-4 bg-wine p-10 text-center text-ivory">
            <p className="font-serif text-3xl">Prefer to talk to someone?</p>
            <p className="text-ivory/80">Our stylists are available on WhatsApp {business.hours ? `· ${business.hours}` : ""}</p>
            <a href={whatsappLink(business.whatsapp, "Hello Lobaloba Deluxe, I need some help.")} target="_blank" rel="noopener noreferrer" className="bg-ivory px-8 py-3.5 text-xs tracking-[0.22em] text-wine uppercase">
              Chat on WhatsApp
            </a>
          </div>
        )}
      </div>
    </>
  );
}
