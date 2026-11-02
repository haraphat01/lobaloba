import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const site = siteUrl;
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/checkout", "/bag", "/orders", "/quotes", "/api", "/asoebi/events"] }],
    sitemap: `${site}/sitemap.xml`,
  };
}
