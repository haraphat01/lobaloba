import type { Metadata } from "next";
import { PolicyPage } from "@/components/store/policy-page";

export const metadata: Metadata = { title: "Returns & Refunds", description: "How to return a Lobaloba Deluxe order and how refunds work.", alternates: { canonical: "/returns" } };

export default function Page() {
  return <PolicyPage policy="returns" title="Returns & Refunds" eyebrow="Customer care" />;
}
