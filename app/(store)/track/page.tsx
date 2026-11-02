import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { TrackForm } from "@/components/store/track-form";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Track your Lobaloba Deluxe order with your order number and email or phone number.",
  alternates: { canonical: "/track" },
};

export default function TrackPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Track order" }]} eyebrow="Customer care" title="Track your order" description="Enter your order number and the email address or phone number you used at checkout." />
      <div className="container-x max-w-xl py-14">
        <TrackForm />
      </div>
    </>
  );
}
