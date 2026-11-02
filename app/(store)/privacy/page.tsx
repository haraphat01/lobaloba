import type { Metadata } from "next";
import { PolicyPage } from "@/components/store/policy-page";

export const metadata: Metadata = { title: "Privacy Policy", description: "How Lobaloba Deluxe collects, uses and protects your personal information.", alternates: { canonical: "/privacy" } };

export default function Page() {
  return <PolicyPage policy="privacy" title="Privacy Policy" eyebrow="Legal" />;
}
