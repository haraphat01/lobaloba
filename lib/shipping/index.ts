import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type ShippingDestination = { country: string; state?: string; city?: string };

export type ShippingQuote = {
  rateId: string;
  provider: string;
  zoneName: string;
  name: string;
  description: string | null;
  fee: number;
  requiresQuote: boolean;
  isPickup: boolean;
  minDays: number | null;
  maxDays: number | null;
};

export type ShippingQuoteInput = {
  destination: ShippingDestination;
  subtotal: number;
  currency: string;
};

/**
 * Shipping providers return delivery options for a destination. The default
 * provider reads admin-managed zones and rates from the database. To add a
 * courier integration (e.g. GIG Logistics, DHL), implement this interface and
 * register it in `providers` below.
 */
export interface ShippingProvider {
  id: string;
  getQuotes(input: ShippingQuoteInput): Promise<ShippingQuote[]>;
  /** Resolve a previously quoted rate id to its current price (used at checkout). */
  resolveRate(rateId: string, input: ShippingQuoteInput): Promise<ShippingQuote | null>;
}

const norm = (v: string | undefined | null) => (v ?? "").trim().toLowerCase();

type ZoneRow = {
  id: string;
  name: string;
  zone_type: string;
  countries: string[];
  states: string[];
  requires_quote: boolean;
  sort_order: number;
  shipping_rates: {
    id: string;
    name: string;
    description: string | null;
    fee: number;
    free_over: number | null;
    min_days: number | null;
    max_days: number | null;
    is_active: boolean;
    sort_order: number;
  }[];
};

export const tableRateProvider: ShippingProvider = {
  id: "table-rate",

  async getQuotes({ destination, subtotal }) {
    const zones = await loadZones();
    return matchZones(zones, destination).flatMap((zone) =>
      zone.shipping_rates
        .filter((r) => r.is_active)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((r) => toQuote(zone, r, subtotal)),
    );
  },

  async resolveRate(rateId, input) {
    const quotes = await this.getQuotes(input);
    return quotes.find((q) => q.rateId === rateId) ?? null;
  },
};

async function loadZones(): Promise<ZoneRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("shipping_zones")
    .select("id, name, zone_type, countries, states, requires_quote, sort_order, shipping_rates(id, name, description, fee, free_over, min_days, max_days, is_active, sort_order)")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(`Could not load shipping zones: ${error.message}`);
  return (data ?? []) as ZoneRow[];
}

function matchZones(zones: ZoneRow[], destination: ShippingDestination) {
  const country = norm(destination.country);
  const state = norm(destination.state);
  const covers = (z: ZoneRow) => z.countries.length === 0 || z.countries.some((c) => norm(c) === country);

  const domestic = zones.filter((z) => z.zone_type === "domestic" && z.countries.length > 0 && covers(z));
  const specific = domestic.filter((z) => z.states.length > 0 && z.states.some((s) => norm(s) === state));
  const catchAll = domestic.filter((z) => z.states.length === 0);
  const delivery = specific.length ? specific : catchAll;

  const international =
    domestic.length === 0 ? zones.filter((z) => z.zone_type === "international" && covers(z)) : [];

  const pickup = zones.filter((z) => z.zone_type === "pickup" && covers(z));

  return [...delivery, ...international, ...pickup];
}

function toQuote(zone: ZoneRow, rate: ZoneRow["shipping_rates"][number], subtotal: number): ShippingQuote {
  const fee = rate.free_over !== null && subtotal >= Number(rate.free_over) ? 0 : Number(rate.fee);
  return {
    rateId: rate.id,
    provider: "table-rate",
    zoneName: zone.name,
    name: rate.name,
    description: rate.description,
    fee: zone.requires_quote ? 0 : fee,
    requiresQuote: zone.requires_quote,
    isPickup: zone.zone_type === "pickup",
    minDays: rate.min_days,
    maxDays: rate.max_days,
  };
}

const providers: ShippingProvider[] = [tableRateProvider];

export async function getShippingQuotes(input: ShippingQuoteInput) {
  const all = await Promise.all(providers.map((p) => p.getQuotes(input)));
  return all.flat();
}

export async function resolveShippingRate(rateId: string, input: ShippingQuoteInput) {
  for (const p of providers) {
    const quote = await p.resolveRate(rateId, input);
    if (quote) return quote;
  }
  return null;
}

/** Cheapest non-pickup estimate, used for the bag's "shipping estimate". */
export async function estimateShipping(input: ShippingQuoteInput) {
  const quotes = (await getShippingQuotes(input)).filter((q) => !q.isPickup && !q.requiresQuote);
  if (!quotes.length) return null;
  return quotes.reduce((min, q) => (q.fee < min.fee ? q : min));
}
