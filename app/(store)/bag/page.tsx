import type { Metadata } from "next";
import { BagPage } from "@/components/store/bag-page";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Your shopping bag", robots: { index: false } };

export default function Page() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Shopping bag" }]} eyebrow="Your selection" title="Shopping bag" description="Your chosen pieces, gathered in one place." />
      <div className="container-x py-8 sm:py-12">
        <BagPage />
      </div>
    </>
  );
}
