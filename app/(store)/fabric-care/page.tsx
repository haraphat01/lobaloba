import type { Metadata } from "next";
import { PolicyPage } from "@/components/store/policy-page";

export const metadata: Metadata = { title: "Fabric Care Guide", description: "How to store, clean and press lace, beaded, crystal and aso-oke fabrics.", alternates: { canonical: "/fabric-care" } };

export default function Page() {
  return <PolicyPage policy="fabric_care" title="Fabric Care Guide" eyebrow="Guides" />;
}
