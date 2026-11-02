// Normalises NEXT_PUBLIC_SITE_URL so a value entered without a scheme
// ("lobalobadeluxe.com"), with quotes or with a trailing slash still works.
// Falls back to localhost when the value is missing or unusable.
const FALLBACK = "http://localhost:3000";

function normalise(raw: string | undefined): string {
  const value = (raw ?? "").trim().replace(/^["']|["']$/g, "").trim();
  if (!value) return FALLBACK;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return FALLBACK;
  }
}

export const siteUrl = normalise(process.env.NEXT_PUBLIC_SITE_URL);
