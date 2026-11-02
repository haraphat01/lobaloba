"use client";

import { useState } from "react";
import { Panel, adminInput } from "@/components/admin/ui";
import { ImageUploadButton } from "@/components/admin/image-upload";
import { useAdminAction } from "@/components/admin/use-action";
import { FabricImage } from "@/components/shared/fabric-image";
import { saveSetting, type SettingKey } from "@/app/actions/admin-content";
import type { SiteSettings } from "@/lib/data/settings";

function SaveButton({ k, value }: { k: SettingKey; value: unknown }) {
  const { pending, run } = useAdminAction();
  return (
    <button type="button" disabled={pending} onClick={() => run(() => saveSetting(k, value))} className="mt-4 h-9 rounded-sm bg-wine px-5 text-xs tracking-wider text-onyx uppercase">
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

const T = ({ label, value, onChange, rows, hint, type = "text" }: { label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: string; type?: string }) => (
  <label className="grid gap-1 text-sm">
    {label}
    {rows ? <textarea className={adminInput} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} /> : <input type={type} className={adminInput} value={value} onChange={(e) => onChange(e.target.value)} />}
    {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
  </label>
);

const Check = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center gap-2 text-sm">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /> {label}
  </label>
);

export function AnnouncementForm({ initial }: { initial: SiteSettings["announcement"] }) {
  const [v, setV] = useState({ ...initial, link: initial.link ?? "", text: initial.messages.join("\n") });
  return (
    <Panel title="Announcement bar">
      <div className="grid gap-3">
        <Check label="Show announcement bar" checked={v.enabled} onChange={(enabled) => setV({ ...v, enabled })} />
        <T label="Messages (one per line, they rotate)" rows={4} value={v.text} onChange={(text) => setV({ ...v, text })} />
        <T label="Link (optional)" value={v.link} onChange={(link) => setV({ ...v, link })} hint="e.g. /new-arrivals" />
      </div>
      <SaveButton k="announcement" value={{ enabled: v.enabled, link: v.link, messages: v.text.split("\n").map((s) => s.trim()).filter(Boolean) }} />
    </Panel>
  );
}

export function HeroForm({ initial }: { initial: SiteSettings["hero"] }) {
  const [v, setV] = useState(initial);
  return (
    <Panel title="Homepage hero">
      <div className="grid gap-3 sm:grid-cols-2">
        <T label="Eyebrow" value={v.eyebrow} onChange={(eyebrow) => setV({ ...v, eyebrow })} />
        <T label="Headline" value={v.heading} onChange={(heading) => setV({ ...v, heading })} hint="Sentences split onto lines; the second appears in gold italics." />
        <div className="sm:col-span-2"><T label="Supporting text" rows={2} value={v.subheading} onChange={(subheading) => setV({ ...v, subheading })} /></div>
        <T label="Primary button label" value={v.primary_cta.label} onChange={(label) => setV({ ...v, primary_cta: { ...v.primary_cta, label } })} />
        <T label="Primary button link" value={v.primary_cta.href} onChange={(href) => setV({ ...v, primary_cta: { ...v.primary_cta, href } })} />
        <T label="Secondary button label" value={v.secondary_cta.label} onChange={(label) => setV({ ...v, secondary_cta: { ...v.secondary_cta, label } })} />
        <T label="Secondary button link" value={v.secondary_cta.href} onChange={(href) => setV({ ...v, secondary_cta: { ...v.secondary_cta, href } })} />
        <div className="flex items-end gap-3 sm:col-span-2">
          <div className="relative h-20 w-32 bg-cream">
            <FabricImage src={v.image_url || "/demo/hero.svg"} alt="" fill sizes="128px" className="object-cover" />
          </div>
          <ImageUploadButton folder="banners" label="Replace hero image" onUploaded={(img) => setV({ ...v, image_url: img.url })} />
        </div>
        <T label="Image alt text" value={v.image_alt} onChange={(image_alt) => setV({ ...v, image_alt })} />
      </div>
      <SaveButton k="hero" value={v} />
    </Panel>
  );
}

export function HomepageForm({ initial }: { initial: SiteSettings["homepage"] }) {
  const [v, setV] = useState(initial);
  return (
    <Panel title="Homepage sections">
      <div className="grid gap-2 sm:grid-cols-3">
        <Check label="New arrivals" checked={v.show_new_arrivals} onChange={(x) => setV({ ...v, show_new_arrivals: x })} />
        <Check label="Featured collections" checked={v.show_collections} onChange={(x) => setV({ ...v, show_collections: x })} />
        <Check label="Bestsellers" checked={v.show_bestsellers} onChange={(x) => setV({ ...v, show_bestsellers: x })} />
        <Check label="Asoebi Lounge promotion" checked={v.show_asoebi} onChange={(x) => setV({ ...v, show_asoebi: x })} />
        <Check label="Journal" checked={v.show_journal} onChange={(x) => setV({ ...v, show_journal: x })} />
      </div>
      <div className="mt-4 grid gap-3">
        <T label="Asoebi section heading" value={v.asoebi_heading} onChange={(asoebi_heading) => setV({ ...v, asoebi_heading })} />
        <T label="Asoebi section text" rows={3} value={v.asoebi_text} onChange={(asoebi_text) => setV({ ...v, asoebi_text })} />
        <T label="Newsletter heading" value={v.newsletter_heading} onChange={(newsletter_heading) => setV({ ...v, newsletter_heading })} />
        <T label="Newsletter text" value={v.newsletter_text} onChange={(newsletter_text) => setV({ ...v, newsletter_text })} />
      </div>
      <SaveButton k="homepage" value={v} />
    </Panel>
  );
}

const POLICY_LABELS: Record<keyof SiteSettings["policies"], string> = {
  shipping: "Shipping & delivery",
  returns: "Returns & refunds",
  privacy: "Privacy policy",
  terms: "Terms & conditions",
  fabric_care: "Fabric care guide",
  yardage_guide: "Size & yardage guide",
};

export function PoliciesForm({ initial }: { initial: SiteSettings["policies"] }) {
  const [v, setV] = useState(initial);
  const [tab, setTab] = useState<keyof SiteSettings["policies"]>("shipping");
  return (
    <Panel title="Policies & guides (Markdown)">
      <div className="mb-3 flex flex-wrap gap-1">
        {(Object.keys(POLICY_LABELS) as (keyof SiteSettings["policies"])[]).map((k) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={`rounded-sm px-3 py-1.5 text-xs ${tab === k ? "bg-wine text-onyx" : "border border-border"}`}>
            {POLICY_LABELS[k]}
          </button>
        ))}
      </div>
      <textarea className={`${adminInput} font-mono text-xs`} rows={18} value={v[tab]} onChange={(e) => setV({ ...v, [tab]: e.target.value })} aria-label={POLICY_LABELS[tab]} />
      <SaveButton k="policies" value={v} />
    </Panel>
  );
}

export function BusinessForm({ initial }: { initial: SiteSettings["business"] }) {
  const [v, setV] = useState(initial);
  return (
    <Panel title="Business & contact information">
      <div className="grid gap-3 sm:grid-cols-2">
        <T label="Business name" value={v.name} onChange={(name) => setV({ ...v, name })} />
        <T label="Tagline" value={v.tagline} onChange={(tagline) => setV({ ...v, tagline })} />
        <T label="Business email" type="email" value={v.email} onChange={(email) => setV({ ...v, email })} />
        <T label="Phone number" value={v.phone} onChange={(phone) => setV({ ...v, phone })} />
        <T label="WhatsApp number" value={v.whatsapp} onChange={(whatsapp) => setV({ ...v, whatsapp: whatsapp.replace(/\D/g, "") })} hint="Digits with country code, e.g. 2348012345678" />
        <T label="Default currency" value={v.currency} onChange={(currency) => setV({ ...v, currency: currency.toUpperCase().slice(0, 3) })} />
        <T label="Store address" value={v.address} onChange={(address) => setV({ ...v, address })} />
        <T label="Opening hours" value={v.hours} onChange={(hours) => setV({ ...v, hours })} />
      </div>
      <SaveButton k="business" value={v} />
    </Panel>
  );
}

export function SocialForm({ initial }: { initial: SiteSettings["social"] }) {
  const [v, setV] = useState(initial);
  return (
    <Panel title="Social media links">
      <div className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(v) as (keyof typeof v)[]).map((k) => (
          <T key={k} label={k === "x" ? "X (Twitter)" : k[0].toUpperCase() + k.slice(1)} value={v[k]} onChange={(val) => setV({ ...v, [k]: val })} hint="Full URL" />
        ))}
      </div>
      <SaveButton k="social" value={v} />
    </Panel>
  );
}

export function StoreForm({ initial }: { initial: SiteSettings["store"] }) {
  const [v, setV] = useState({ ...initial, low_stock_threshold: String(initial.low_stock_threshold) });
  return (
    <Panel title="Store & notifications">
      <div className="grid gap-3 sm:grid-cols-2">
        <T label="Currency" value={v.currency} onChange={(currency) => setV({ ...v, currency: currency.toUpperCase().slice(0, 3) })} hint="NGN today; products can carry their own currency for future international pricing." />
        <T label="Default low-stock threshold" value={v.low_stock_threshold} onChange={(x) => setV({ ...v, low_stock_threshold: x.replace(/\D/g, "") })} />
        <T label="Admin notification email" type="email" value={v.admin_notification_email} onChange={(admin_notification_email) => setV({ ...v, admin_notification_email })} hint="Receives new order, quotation and contact alerts" />
      </div>
      <SaveButton k="store" value={{ ...v, low_stock_threshold: Number(v.low_stock_threshold) || 0 }} />
    </Panel>
  );
}

const CHANNELS = ["card", "bank", "ussd", "bank_transfer", "qr", "mobile_money", "apple_pay"] as const;

export function PaymentForm({ initial, paystackConfigured }: { initial: SiteSettings["payment"]; paystackConfigured: boolean }) {
  const [v, setV] = useState(initial);
  return (
    <Panel title="Payment configuration">
      <p className={`mb-3 rounded-sm px-3 py-2 text-xs ${paystackConfigured ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>
        Paystack secret key: {paystackConfigured ? "configured in environment" : "NOT configured — set PAYSTACK_SECRET_KEY (keys are never stored in the database)"}
      </p>
      <p className="mb-2 text-sm">Payment channels offered at checkout (must also be enabled on your Paystack account):</p>
      <div className="flex flex-wrap gap-3">
        {CHANNELS.map((c) => (
          <Check key={c} label={c.replace("_", " ")} checked={v.channels.includes(c)} onChange={(on) => setV({ ...v, channels: on ? [...v.channels, c] : v.channels.filter((x) => x !== c) })} />
        ))}
      </div>
      <div className="mt-3"><T label="Checkout payment note" value={v.instructions} onChange={(instructions) => setV({ ...v, instructions })} /></div>
      <SaveButton k="payment" value={v} />
    </Panel>
  );
}

export function EmailForm({ initial, resendConfigured, from }: { initial: SiteSettings["email"]; resendConfigured: boolean; from: string }) {
  const [v, setV] = useState(initial);
  return (
    <Panel title="Email configuration">
      <p className={`mb-3 rounded-sm px-3 py-2 text-xs ${resendConfigured ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>
        Resend API key: {resendConfigured ? "configured" : "NOT configured — set RESEND_API_KEY"} · Sending from: {from}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <T label="Reply-to address" type="email" value={v.reply_to} onChange={(reply_to) => setV({ ...v, reply_to })} />
        <T label="Sender display name" value={v.from_name} onChange={(from_name) => setV({ ...v, from_name })} />
        <div className="sm:col-span-2"><T label="Email footer note" value={v.footer_note} onChange={(footer_note) => setV({ ...v, footer_note })} /></div>
      </div>
      <SaveButton k="email" value={v} />
    </Panel>
  );
}
