import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { env } from "@/lib/env";

export type Cta = { label: string; href: string };

export type SiteSettings = {
  announcement: { enabled: boolean; messages: string[]; link?: string };
  hero: {
    eyebrow: string;
    heading: string;
    subheading: string;
    image_url: string;
    image_alt: string;
    primary_cta: Cta;
    secondary_cta: Cta;
  };
  business: {
    name: string;
    tagline: string;
    email: string;
    phone: string;
    whatsapp: string;
    address: string;
    hours: string;
    currency: string;
  };
  social: Record<"instagram" | "facebook" | "tiktok" | "pinterest" | "youtube" | "x", string>;
  homepage: {
    show_new_arrivals: boolean;
    show_collections: boolean;
    show_bestsellers: boolean;
    show_asoebi: boolean;
    show_journal: boolean;
    asoebi_heading: string;
    asoebi_text: string;
    newsletter_heading: string;
    newsletter_text: string;
  };
  store: { currency: string; low_stock_threshold: number; order_email_bcc: string; admin_notification_email: string };
  payment: { paystack_enabled: boolean; channels: string[]; instructions: string };
  email: { from_name: string; reply_to: string; footer_note: string };
  policies: Record<"shipping" | "returns" | "privacy" | "terms" | "fabric_care" | "yardage_guide", string>;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  announcement: { enabled: true, messages: ["Discover timeless elegance with Lobaloba Deluxe."] },
  hero: {
    eyebrow: "The Lobaloba Atelier",
    heading: "Luxury Fabrics. Unforgettable Moments.",
    subheading:
      "Discover beautifully curated fabrics and accessories for weddings, celebrations and every special occasion.",
    image_url: "",
    image_alt: "Luxury fabrics",
    primary_cta: { label: "Shop Collection", href: "/shop" },
    secondary_cta: { label: "Explore Asoebi", href: "/asoebi" },
  },
  business: {
    name: "Lobaloba Deluxe",
    tagline: "Premium fabrics for life's finest moments",
    email: "contact@lobalobadeluxe.com",
    phone: "+234 812 289 8601, +234 816 566 8362",
    whatsapp: "2348122898601",
    address: "117 Woro Elewa Street, off Agoro Street, Idumota, Lagos Island, Lagos",
    hours: "",
    currency: "NGN",
  },
  social: { instagram: "https://www.instagram.com/lobalobadeluxe", facebook: "", tiktok: "https://www.tiktok.com/@lobalobadeluxe", pinterest: "", youtube: "", x: "" },
  homepage: {
    show_new_arrivals: true,
    show_collections: true,
    show_bestsellers: true,
    show_asoebi: true,
    show_journal: true,
    asoebi_heading: "Planning a Celebration? Let Us Coordinate Your Asoebi.",
    asoebi_text: "",
    newsletter_heading: "Join the Lobaloba circle",
    newsletter_text: "",
  },
  store: { currency: "NGN", low_stock_threshold: 5, order_email_bcc: "", admin_notification_email: "" },
  payment: { paystack_enabled: true, channels: [], instructions: "" },
  email: { from_name: "Lobaloba Deluxe", reply_to: "", footer_note: "" },
  policies: { shipping: "", returns: "", privacy: "", terms: "", fabric_care: "", yardage_guide: "" },
};

export const SETTINGS_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof SiteSettings)[];

/** All storefront settings, cached and invalidated with the "settings" tag. */
export async function getSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag("settings");
  cacheLife("hours");

  if (!env.isSupabaseConfigured()) return DEFAULT_SETTINGS;
  const { data, error } = await createPublicClient().from("site_settings").select("key, value");
  if (error) {
    console.error("[settings] failed to load", error.message);
    return DEFAULT_SETTINGS;
  }
  const merged = structuredClone(DEFAULT_SETTINGS) as Record<string, Record<string, unknown>>;
  for (const row of data ?? []) {
    if (row.key in merged && row.value && typeof row.value === "object") {
      merged[row.key] = { ...merged[row.key], ...(row.value as Record<string, unknown>) };
    }
  }
  return merged as unknown as SiteSettings;
}
