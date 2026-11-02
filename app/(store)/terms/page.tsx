import type { Metadata } from "next";
import { PolicyPage } from "@/components/store/policy-page";

export const metadata: Metadata = { title: "Terms & Conditions", description: "Terms and conditions for shopping with Lobaloba Deluxe.", alternates: { canonical: "/terms" } };

export default function Page() {
  return <PolicyPage policy="terms" title="Terms & Conditions" eyebrow="Legal" />;
}
