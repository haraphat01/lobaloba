/** The business phone setting may hold several numbers separated by commas or slashes. */
export function splitPhones(value: string | null | undefined) {
  return (value ?? "")
    .split(/[,/]/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => ({ label: p, href: `tel:${p.replace(/[^\d+]/g, "")}` }));
}
