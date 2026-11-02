"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/format";

export function WhatsAppFloat({ number }: { number: string }) {
  const pathname = usePathname();
  if (!number || pathname.startsWith("/checkout")) return null;
  return (
    <a
      href={whatsappLink(number, "Hello Lobaloba Deluxe, I would like some assistance.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-wine px-4 py-3 text-sm font-medium text-ivory shadow-lg shadow-wine/20 transition hover:-translate-y-0.5 hover:bg-wine-deep sm:right-6 sm:bottom-6"
    >
      <MessageCircle className="size-5" />
      <span className="hidden sm:inline">Chat with a stylist</span>
    </a>
  );
}
