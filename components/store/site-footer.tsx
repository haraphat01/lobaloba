import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { NewsletterForm } from "@/components/store/newsletter-form";
import type { SiteSettings } from "@/lib/data/settings";
import { whatsappLink } from "@/lib/format";
import { splitPhones } from "@/lib/phones";

export function SiteFooter({ settings, categories }: { settings: SiteSettings; categories: { name: string; slug: string }[] }) {
  const { business, social } = settings;
  const socials = [
    { key: "instagram", href: social.instagram, label: "Instagram" },
    { key: "facebook", href: social.facebook, label: "Facebook" },
    { key: "youtube", href: social.youtube, label: "YouTube" },
    { key: "tiktok", href: social.tiktok, label: "TikTok" },
    { key: "pinterest", href: social.pinterest, label: "Pinterest" },
    { key: "x", href: social.x, label: "X" },
  ].filter((s) => s.href);

  const columns = [
    {
      title: "Shop",
      links: [
        { label: "Shop all", href: "/shop" },
        { label: "New arrivals", href: "/new-arrivals" },
        { label: "Collections", href: "/collections" },
        { label: "Bestsellers", href: "/shop?bestsellers=1" },
        { label: "Asoebi Lounge", href: "/asoebi" },
        { label: "Wholesale", href: "/wholesale" },
      ],
    },
    { title: "Categories", links: categories.map((c) => ({ label: c.name, href: `/shop/${c.slug}` })) },
    {
      title: "Customer care",
      links: [
        { label: "Help centre", href: "/help" },
        { label: "Track your order", href: "/track" },
        { label: "Shipping & delivery", href: "/shipping" },
        { label: "Returns & refunds", href: "/returns" },
        { label: "Fabric care guide", href: "/fabric-care" },
        { label: "Size & yardage guide", href: "/yardage-guide" },
        { label: "FAQs", href: "/faq" },
      ],
    },
    {
      title: "Lobaloba",
      links: [
        { label: "About us", href: "/about" },
        { label: "Journal", href: "/journal" },
        { label: "Contact us", href: "/contact" },
        { label: "Privacy policy", href: "/privacy" },
        { label: "Terms & conditions", href: "/terms" },
      ],
    },
  ];

  return (
    <footer className="mt-auto bg-[#32151c] text-ivory/80">
      <div className="container-x grid gap-12 py-14 sm:py-16 lg:grid-cols-[0.9fr_1.7fr] lg:gap-20">
        <div className="max-w-md">
          <Logo light className="items-start" />
          <p className="mt-5 max-w-sm font-serif text-2xl leading-snug text-ivory">{business.tagline}</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-ivory/60">Considered fabrics and finishing touches for the moments that matter.</p>
          <div className="mt-8 border-t border-ivory/15 pt-6">
            <p className="eyebrow text-gold-light">Notes from the atelier</p>
            <p className="mt-2 text-sm text-ivory/70">{settings.homepage.newsletter_heading}</p>
            <div className="mt-3">
              <NewsletterForm source="footer" tone="dark" />
            </div>
          </div>
          <ul className="mt-8 space-y-2 text-sm">
            {business.whatsapp && (
              <li>
                <a href={whatsappLink(business.whatsapp, "Hello Lobaloba Deluxe")} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-gold-light">
                  <MessageCircle className="size-4" /> WhatsApp us
                </a>
              </li>
            )}
            {splitPhones(business.phone).map((p) => (
              <li key={p.href}>
                <a href={p.href} className="flex items-center gap-2 hover:text-gold-light">
                  <Phone className="size-4" /> {p.label}
                </a>
              </li>
            ))}
            {business.email && (
              <li>
                <a href={`mailto:${business.email}`} className="flex items-center gap-2 hover:text-gold-light">
                  <Mail className="size-4" /> {business.email}
                </a>
              </li>
            )}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <p className="eyebrow mb-4 text-gold-light">{col.title}</p>
              <ul className="space-y-3 text-[0.83rem]">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="text-ivory/65 transition-colors hover:text-ivory">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="container-x flex flex-col items-start justify-between gap-4 py-5 text-xs text-ivory/50 sm:flex-row sm:items-center">
          <p>
            © <CopyrightYear /> {business.name}. {business.address}.
          </p>
          <div className="flex items-center gap-4">
            {socials.map((s) => (
              <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="hover:text-gold-light">
                <span className="text-[0.7rem] tracking-wider uppercase">{s.label}</span>
              </a>
            ))}
            <span>Payments secured by Paystack</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

async function CopyrightYear() {
  "use cache";
  return <>{new Date().getFullYear()}</>;
}
