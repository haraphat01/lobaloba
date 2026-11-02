import type { Metadata } from "next";
import { PolicyPage } from "@/components/store/policy-page";

export const metadata: Metadata = { title: "Shipping & Delivery", description: "Delivery options, timelines and fees for Lobaloba Deluxe orders in Nigeria and worldwide.", alternates: { canonical: "/shipping" } };

export default function Page() {
  return <PolicyPage policy="shipping" title="Shipping & Delivery" eyebrow="Customer care" />;
}
