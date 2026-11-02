import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { siteUrl } from "@/lib/site-url";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const body = Jost({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
});


export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Lobaloba Deluxe — Luxury Fabrics. Unforgettable Moments.",
    template: "%s | Lobaloba Deluxe",
  },
  description:
    "Premium bridal lace, crystal fabrics, Asoebi and fashion accessories, curated in Lagos for weddings, celebrations and every special occasion.",
  applicationName: "Lobaloba Deluxe",
  openGraph: {
    type: "website",
    siteName: "Lobaloba Deluxe",
    locale: "en_NG",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#6e1f2f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NG" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        {children}
        <Toaster position="bottom-center" theme="light" />
      </body>
    </html>
  );
}
