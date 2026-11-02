import type { ShopFilters } from "@/lib/data/catalog";

type SP = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? v.split(",") : []).map((s) => s.trim()).filter(Boolean).slice(0, 20);
const num = (v: string | string[] | undefined) => {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Parses shop URL search params into validated filters. */
export function parseShopParams(sp: SP): ShopFilters {
  return {
    q: one(sp.q)?.slice(0, 100),
    category: one(sp.category),
    colours: list(sp.colour),
    fabrics: list(sp.fabric),
    minPrice: num(sp.min),
    maxPrice: num(sp.max),
    inStock: one(sp.instock) === "1",
    newArrivals: one(sp.new) === "1",
    bestsellers: one(sp.bestsellers) === "1",
    sort: one(sp.sort),
    page: Math.max(1, Math.floor(num(sp.page) ?? 1)),
    pageSize: 12,
  };
}
