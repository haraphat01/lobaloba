"use server";

import { z } from "zod";
import { getProductBySlug, getProductsByIds } from "@/lib/data/catalog";
import { uuid } from "@/lib/validation";

export async function getQuickView(slug: string) {
  const s = z.string().trim().min(1).max(160).regex(/^[a-z0-9-]+$/).safeParse(slug);
  if (!s.success) return null;
  return getProductBySlug(s.data);
}

export async function getRecentlyViewed(ids: string[]) {
  const parsed = z.array(uuid).max(12).safeParse(ids);
  return parsed.success ? getProductsByIds(parsed.data) : [];
}
