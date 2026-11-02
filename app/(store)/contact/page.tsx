import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ContactForm } from "@/components/store/contact-form";
import { getSettings } from "@/lib/data/settings";
import { whatsappLink } from "@/lib/format";
import { splitPhones } from "@/lib/phones";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Contact Lobaloba Deluxe by WhatsApp, phone, email or our contact form.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const { business } = await getSettings();
  return (
    <>
      <PageHeader crumbs={[{ label: "Contact us" }]} eyebrow="We're here to help" title="Contact us" description="Questions about a fabric, an order or your celebration? Our team replies within one business day." />
      <div className="container-x grid gap-14 py-14 lg:grid-cols-[1fr_1.5fr]">
        <ul className="space-y-6 text-sm">
          {business.whatsapp && (
            <li className="flex gap-3">
              <MessageCircle className="size-5 text-gold" />
              <div>
                <p className="font-medium">WhatsApp</p>
                <a href={whatsappLink(business.whatsapp, "Hello Lobaloba Deluxe")} target="_blank" rel="noopener noreferrer" className="text-wine underline">
                  Chat with a stylist
                </a>
              </div>
            </li>
          )}
          <li className="flex gap-3">
            <Phone className="size-5 text-gold" />
            <div>
              <p className="font-medium">Phone</p>
              {splitPhones(business.phone).map((p) => (
                <a key={p.href} href={p.href} className="block hover:text-wine">
                  {p.label}
                </a>
              ))}
            </div>
          </li>
          <li className="flex gap-3">
            <Mail className="size-5 text-gold" />
            <div>
              <p className="font-medium">Email</p>
              <a href={`mailto:${business.email}`}>{business.email}</a>
            </div>
          </li>
          <li className="flex gap-3">
            <MapPin className="size-5 text-gold" />
            <div>
              <p className="font-medium">Studio</p>
              <p>{business.address}</p>
            </div>
          </li>
          {business.hours && (
            <li className="flex gap-3">
              <Clock className="size-5 text-gold" />
              <div>
                <p className="font-medium">Opening hours</p>
                <p>{business.hours}</p>
              </div>
            </li>
          )}
        </ul>
        <ContactForm />
      </div>
    </>
  );
}
