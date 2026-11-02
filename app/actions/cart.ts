"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { priceLines, evaluateCoupon } from "@/lib/pricing";
import { getShippingQuotes, type ShippingDestination } from "@/lib/shipping";
import { cartLinesSchema, uuid } from "@/lib/validation";
import { getProductsByIds } from "@/lib/data/catalog";

type Lines = z.infer<typeof cartLinesSchema>;

/** Server-verified bag contents: live prices, stock and a shipping estimate. */
export async function getBagDetails(input: Lines) {
  const parsed = cartLinesSchema.safeParse(input);
  if (!parsed.success) return { lines: [], subtotal: 0, currency: "NGN", shippingFrom: null as number | null };
  const lines = await priceLines(parsed.data);
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const currency = lines[0]?.currency ?? "NGN";

  let shippingFrom: number | null = null;
  try {
    const quotes = await getShippingQuotes({ destination: { country: "Nigeria", state: "Lagos" }, subtotal, currency });
    const paid = quotes.filter((q) => !q.isPickup && !q.requiresQuote).map((q) => q.fee);
    shippingFrom = paid.length ? Math.min(...paid) : null;
  } catch (e) {
    console.error("[bag] shipping estimate failed", e);
  }
  return { lines, subtotal, currency, shippingFrom };
}

export async function getShippingOptionsFor(destination: ShippingDestination, subtotal: number) {
  const d = z
    .object({ country: z.string().trim().min(1).max(80), state: z.string().trim().max(80).optional(), city: z.string().trim().max(80).optional() })
    .safeParse(destination);
  if (!d.success) return [];
  return getShippingQuotes({ destination: d.data, subtotal: Math.max(0, Number(subtotal) || 0), currency: "NGN" });
}

export async function checkCoupon(code: string, lines: Lines, email?: string) {
  const parsed = cartLinesSchema.safeParse(lines);
  if (!parsed.success) return { ok: false as const, error: "Your bag could not be read." };
  const priced = await priceLines(parsed.data);
  return evaluateCoupon(String(code ?? "").slice(0, 32), priced, email ? String(email).slice(0, 254) : null);
}

async function userCart() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  let { data: cart } = await supabase.from("carts").select("id").eq("user_id", data.user.id).maybeSingle();
  if (!cart) {
    const inserted = await supabase.from("carts").insert({ user_id: data.user.id }).select("id").single();
    cart = inserted.data;
  }
  return cart ? { supabase, cartId: cart.id } : null;
}

/** Merges the guest (localStorage) bag into the account bag after login. */
export async function syncCart(localLines: Lines): Promise<Lines | null> {
  const parsed = cartLinesSchema.safeParse(localLines);
  const ctx = await userCart();
  if (!ctx) return null;
  const { supabase, cartId } = ctx;
  const { data: existing } = await supabase.from("cart_items").select("variant_id, quantity").eq("cart_id", cartId);

  const merged = new Map<string, number>((existing ?? []).map((i) => [i.variant_id, i.quantity]));
  for (const l of parsed.success ? parsed.data : []) merged.set(l.variantId, Math.max(merged.get(l.variantId) ?? 0, l.quantity));

  const rows = [...merged].map(([variant_id, quantity]) => ({ cart_id: cartId, variant_id, quantity }));
  if (rows.length) await supabase.from("cart_items").upsert(rows, { onConflict: "cart_id,variant_id" });
  return rows.map((r) => ({ variantId: r.variant_id, quantity: r.quantity }));
}

/** Replaces the signed-in user's saved bag. */
export async function saveCart(lines: Lines) {
  const parsed = cartLinesSchema.safeParse(lines);
  if (!parsed.success) return;
  const ctx = await userCart();
  if (!ctx) return;
  const { supabase, cartId } = ctx;
  const ids = parsed.data.map((l) => l.variantId);
  let del = supabase.from("cart_items").delete().eq("cart_id", cartId);
  if (ids.length) del = del.not("variant_id", "in", `(${ids.join(",")})`);
  await del;
  if (parsed.data.length) {
    await supabase
      .from("cart_items")
      .upsert(parsed.data.map((l) => ({ cart_id: cartId, variant_id: l.variantId, quantity: l.quantity })), { onConflict: "cart_id,variant_id" });
  }
}

// ---------------------------------------------------------------------------
// Wishlist
// ---------------------------------------------------------------------------
async function userWishlist() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  let { data: list } = await supabase.from("wishlists").select("id").eq("user_id", data.user.id).maybeSingle();
  if (!list) {
    const inserted = await supabase.from("wishlists").insert({ user_id: data.user.id }).select("id").single();
    list = inserted.data;
  }
  return list ? { supabase, wishlistId: list.id } : null;
}

export async function syncWishlist(localIds: string[]): Promise<string[] | null> {
  const ids = z.array(uuid).max(200).safeParse(localIds);
  const ctx = await userWishlist();
  if (!ctx) return null;
  const { supabase, wishlistId } = ctx;
  if (ids.success && ids.data.length) {
    await supabase
      .from("wishlist_items")
      .upsert(ids.data.map((product_id) => ({ wishlist_id: wishlistId, product_id })), { onConflict: "wishlist_id,product_id", ignoreDuplicates: true });
  }
  const { data } = await supabase.from("wishlist_items").select("product_id").eq("wishlist_id", wishlistId).order("created_at", { ascending: false });
  return (data ?? []).map((r) => r.product_id);
}

export async function setWishlistItem(productId: string, saved: boolean) {
  if (!uuid.safeParse(productId).success) return;
  const ctx = await userWishlist();
  if (!ctx) return;
  const { supabase, wishlistId } = ctx;
  if (saved) {
    await supabase.from("wishlist_items").upsert({ wishlist_id: wishlistId, product_id: productId }, { onConflict: "wishlist_id,product_id", ignoreDuplicates: true });
  } else {
    await supabase.from("wishlist_items").delete().eq("wishlist_id", wishlistId).eq("product_id", productId);
  }
}

export async function getWishlistProducts(ids: string[]) {
  const parsed = z.array(uuid).max(200).safeParse(ids);
  if (!parsed.success) return [];
  return getProductsByIds(parsed.data);
}

/** Minimal variant info so wishlist "move to bag" can pick an in-stock variant. */
export async function getDefaultVariant(productId: string) {
  if (!uuid.safeParse(productId).success) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_variants")
    .select("id, name, sort_order, inventory(quantity)")
    .eq("product_id", productId)
    .eq("is_active", true)
    .order("sort_order");
  const inStock = (data ?? []).find((v) => ((v.inventory as { quantity: number } | null)?.quantity ?? 0) > 0);
  return inStock ? { id: inStock.id, name: inStock.name } : null;
}
