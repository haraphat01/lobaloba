import type { Metadata } from "next";
import { PolicyPage } from "@/components/store/policy-page";

export const metadata: Metadata = { title: "Size & Yardage Guide", description: "How many yards of fabric you need for gowns, iro and buba, agbada and more.", alternates: { canonical: "/yardage-guide" } };

export default function Page() {
  return <PolicyPage policy="yardage_guide" title="Size & Yardage Guide" eyebrow="Guides" />;
}
