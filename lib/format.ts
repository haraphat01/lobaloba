// Formatting helpers shared by server and client code.

const currencyLocales: Record<string, string> = { NGN: "en-NG", USD: "en-US", GBP: "en-GB", EUR: "en-IE" };

export function formatMoney(amount: number | string | null | undefined, currency = "NGN") {
  const value = typeof amount === "string" ? Number(amount) : (amount ?? 0);
  return new Intl.NumberFormat(currencyLocales[currency] ?? "en-NG", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

export const PURCHASE_UNITS = {
  per_yard: { label: "Per yard", short: "/ yard", quantityNoun: "yards" },
  bundle_4_yard: { label: "Four-yard bundle", short: "/ 4-yard bundle", quantityNoun: "bundles" },
  bundle_5_yard: { label: "Five-yard bundle", short: "/ 5-yard bundle", quantityNoun: "bundles" },
  per_item: { label: "Per item", short: "/ item", quantityNoun: "items" },
  per_set: { label: "Per set", short: "/ set", quantityNoun: "sets" },
  custom: { label: "Custom quantity", short: "", quantityNoun: "units" },
} as const;

export type PurchaseUnit = keyof typeof PURCHASE_UNITS;

export function unitLabel(unit: string, custom?: string | null) {
  if (unit === "custom") return custom || "Per unit";
  return PURCHASE_UNITS[unit as PurchaseUnit]?.label ?? unit;
}

export function unitShort(unit: string, custom?: string | null) {
  if (unit === "custom") return custom ? `/ ${custom}` : "";
  return PURCHASE_UNITS[unit as PurchaseUnit]?.short ?? "";
}

export function quantityNoun(unit: string) {
  return PURCHASE_UNITS[unit as PurchaseUnit]?.quantityNoun ?? "units";
}

/** Explains exactly what the displayed price covers. */
export function priceExplanation(unit: string, custom?: string | null) {
  switch (unit) {
    case "per_yard":
      return "Price is for one yard. Choose the number of yards you need.";
    case "bundle_4_yard":
      return "Price covers a complete four-yard bundle cut from a single bolt.";
    case "bundle_5_yard":
      return "Price covers a complete five-yard bundle cut from a single bolt.";
    case "per_item":
      return "Price is for one item.";
    case "per_set":
      return "Price is for one complete set.";
    default:
      return custom ? `Price covers one ${custom.toLowerCase()}.` : "Price is per unit.";
  }
}

export const ORDER_STATUSES = [
  { value: "pending_payment", label: "Pending Payment" },
  { value: "payment_confirmed", label: "Payment Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "preparing_dispatch", label: "Preparing for Dispatch" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "return_requested", label: "Return Requested" },
  { value: "refunded", label: "Refunded" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["value"];

/** The happy-path progression shown on tracking timelines. */
export const ORDER_PROGRESS: OrderStatus[] = [
  "pending_payment",
  "payment_confirmed",
  "processing",
  "preparing_dispatch",
  "shipped",
  "out_for_delivery",
  "delivered",
];

export function orderStatusLabel(status: string) {
  return ORDER_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export const QUOTATION_STATUSES = ["new", "reviewing", "quoted", "accepted", "declined", "expired", "converted"] as const;

export function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatDate(value: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", ...opts }).format(new Date(value));
}

export function formatDateTime(value: string | Date | null | undefined) {
  return formatDate(value, { dateStyle: "medium", timeStyle: "short" });
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function whatsappLink(number: string | null | undefined, message: string) {
  const digits = (number ?? "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function readingMinutes(markdown: string) {
  return Math.max(1, Math.round(markdown.split(/\s+/).filter(Boolean).length / 200));
}
