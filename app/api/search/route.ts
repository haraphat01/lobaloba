import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { getCategories, getProductsByIds } from "@/lib/data/catalog";

// Search suggestions for the header search dialog.
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ products: [], categories: [] });

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("search_products", { p_query: q, p_limit: 6 });
  if (error) {
    console.error("[search] suggest failed", error.message);
    return NextResponse.json({ products: [], categories: [] }, { status: 500 });
  }
  const products = await getProductsByIds((data ?? []).map((r) => r.id));
  const lower = q.toLowerCase();
  const categories = (await getCategories()).filter((c) => c.name.toLowerCase().includes(lower)).slice(0, 3);

  return NextResponse.json({
    products: products.map((p) => ({
      name: p.name,
      slug: p.slug,
      category: p.categoryName,
      price: p.price,
      currency: p.currency,
      purchaseUnit: p.purchaseUnit,
      unitLabel: p.unitLabel,
      image: p.images[0]?.url ?? null,
    })),
    categories: categories.map((c) => ({ name: c.name, slug: c.slug })),
  });
}
