import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveShippingRate, type ShippingDestination, type ShippingQuote } from "@/lib/shipping";
import { unitLabel } from "@/lib/format";

export type CartLineInput = { variantId: string; quantity: number };

export type PricedLine = {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantName: string;
  colour: string | null;
  categoryId: string | null;
  imageUrl: string | null;
  purchaseUnit: string;
  unitLabel: string;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  requestedQuantity: number;
  available: number;
  minQuantity: number;
  maxQuantity: number | null;
  lineTotal: number;
  currency: string;
  issue: "out_of_stock" | "insufficient_stock" | "unavailable" | null;
  otherVariants: { id: string; name: string; available: number }[];
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Prices cart lines from the database. Client-supplied prices are never
 * trusted; quantities are clamped to available inventory.
 */
export async function priceLines(
  lines: CartLineInput[],
  opts: { priceOverrides?: Map<string, number> } = {},
): Promise<PricedLine[]> {
  const merged = new Map<string, number>();
  for (const l of lines) {
    if (!l.variantId || !Number.isFinite(l.quantity)) continue;
    merged.set(l.variantId, (merged.get(l.variantId) ?? 0) + Math.max(1, Math.floor(l.quantity)));
  }
  if (merged.size === 0) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select(
      `id, name, colour_id, price_override, is_active, inventory(quantity),
       product_colours(name),
       products!inner(id, name, slug, status, price, compare_at_price, currency, purchase_unit, unit_label, min_quantity, max_quantity, category_id,
         product_images(url, colour_id, sort_order),
         product_variants(id, name, is_active, inventory(quantity)))`,
    )
    .in("id", [...merged.keys()]);
  if (error) throw new Error(`Could not price cart: ${error.message}`);

  const result: PricedLine[] = [];
  for (const [variantId, requested] of merged) {
    const v = data?.find((d) => d.id === variantId);
    if (!v) continue;
    const p = v.products as unknown as {
      id: string; name: string; slug: string; status: string; price: number; compare_at_price: number | null; currency: string;
      purchase_unit: string; unit_label: string | null; min_quantity: number; max_quantity: number | null; category_id: string | null;
      product_images: { url: string; colour_id: string | null; sort_order: number }[];
      product_variants: { id: string; name: string; is_active: boolean; inventory: { quantity: number } | null }[];
    };
    const available = (v.inventory as { quantity: number } | null)?.quantity ?? 0;
    const sellable = v.is_active && p.status === "active";
    const override = opts.priceOverrides?.get(p.id);
    const unitPrice = Number(override ?? v.price_override ?? p.price);
    const max = Math.min(available, p.max_quantity ?? Number.MAX_SAFE_INTEGER);
    const quantity = sellable ? Math.min(requested, max) : 0;
    const images = [...p.product_images].sort((a, b) => a.sort_order - b.sort_order);
    const image = images.find((i) => i.colour_id && i.colour_id === v.colour_id) ?? images[0];

    let issue: PricedLine["issue"] = null;
    if (!sellable) issue = "unavailable";
    else if (available <= 0) issue = "out_of_stock";
    else if (requested > max) issue = "insufficient_stock";

    result.push({
      variantId,
      productId: p.id,
      productName: p.name,
      productSlug: p.slug,
      variantName: v.name,
      colour: (v.product_colours as { name: string } | null)?.name ?? null,
      categoryId: p.category_id,
      imageUrl: image?.url ?? null,
      purchaseUnit: p.purchase_unit,
      unitLabel: unitLabel(p.purchase_unit, p.unit_label),
      unitPrice,
      compareAtPrice: p.compare_at_price === null ? null : Number(p.compare_at_price),
      quantity,
      requestedQuantity: requested,
      available,
      minQuantity: p.min_quantity,
      maxQuantity: p.max_quantity,
      lineTotal: round2(unitPrice * quantity),
      currency: p.currency,
      issue,
      otherVariants: p.product_variants
        .filter((o) => o.is_active)
        .map((o) => ({ id: o.id, name: o.name, available: o.inventory?.quantity ?? 0 })),
    });
  }
  return result;
}

export type CouponResult =
  | { ok: true; couponId: string; code: string; discount: number; description: string | null }
  | { ok: false; error: string };

export async function evaluateCoupon(code: string, lines: PricedLine[], email?: string | null): Promise<CouponResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, error: "Enter a discount code." };
  const supabase = createAdminClient();
  const { data: coupon } = await supabase.from("coupons").select("*").eq("code", normalized).maybeSingle();
  if (!coupon || !coupon.is_active) return { ok: false, error: "This discount code is not valid." };

  const now = Date.now();
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) return { ok: false, error: "This discount code is not active yet." };
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) return { ok: false, error: "This discount code has expired." };
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit)
    return { ok: false, error: "This discount code has reached its usage limit." };

  if (coupon.per_customer_limit !== null && email) {
    const { count } = await supabase
      .from("coupon_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", coupon.id)
      .ilike("email", email);
    if ((count ?? 0) >= coupon.per_customer_limit) return { ok: false, error: "You have already used this discount code." };
  }

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  if (subtotal < Number(coupon.min_order_amount))
    return { ok: false, error: `This code requires a minimum order of ₦${Number(coupon.min_order_amount).toLocaleString("en-NG")}.` };

  const restricted = coupon.product_ids.length > 0 || coupon.category_ids.length > 0;
  const eligible = restricted
    ? lines
        .filter((l) => coupon.product_ids.includes(l.productId) || (l.categoryId && coupon.category_ids.includes(l.categoryId)))
        .reduce((s, l) => s + l.lineTotal, 0)
    : subtotal;
  if (eligible <= 0) return { ok: false, error: "This code does not apply to the items in your bag." };

  let discount =
    coupon.discount_type === "percentage" ? (eligible * Number(coupon.value)) / 100 : Math.min(Number(coupon.value), eligible);
  if (coupon.max_discount !== null) discount = Math.min(discount, Number(coupon.max_discount));

  return { ok: true, couponId: coupon.id, code: coupon.code, discount: round2(discount), description: coupon.description };
}

export type OrderQuote = {
  lines: PricedLine[];
  currency: string;
  subtotal: number;
  discount: number;
  coupon: Extract<CouponResult, { ok: true }> | null;
  couponError: string | null;
  shipping: ShippingQuote | null;
  shippingTotal: number;
  total: number;
};

export async function quoteOrder(input: {
  lines: CartLineInput[];
  couponCode?: string | null;
  email?: string | null;
  shippingRateId?: string | null;
  destination?: ShippingDestination | null;
  priceOverrides?: Map<string, number>;
}): Promise<OrderQuote> {
  const lines = await priceLines(input.lines, { priceOverrides: input.priceOverrides });
  const currency = lines[0]?.currency ?? "NGN";
  const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));

  let coupon: OrderQuote["coupon"] = null;
  let couponError: string | null = null;
  if (input.couponCode) {
    const res = await evaluateCoupon(input.couponCode, lines, input.email);
    if (res.ok) coupon = res;
    else couponError = res.error;
  }
  const discount = Math.min(coupon?.discount ?? 0, subtotal);

  let shipping: ShippingQuote | null = null;
  if (input.shippingRateId && input.destination) {
    shipping = await resolveShippingRate(input.shippingRateId, {
      destination: input.destination,
      subtotal: subtotal - discount,
      currency,
    });
  }
  const shippingTotal = shipping?.fee ?? 0;
  const total = round2(Math.max(0, subtotal - discount) + shippingTotal);

  return { lines, currency, subtotal, discount, coupon, couponError, shipping, shippingTotal, total };
}
