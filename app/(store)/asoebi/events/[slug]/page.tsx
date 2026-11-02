import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { CalendarDays, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { FabricImage } from "@/components/shared/fabric-image";
import { EventOrderForm } from "@/components/store/event-order-form";
import { getAsoebiEvent } from "@/lib/data/content";
import { getProductBySlug, getProductsByIds } from "@/lib/data/catalog";
import { renderMarkdown } from "@/lib/markdown";
import { formatDate, formatDateTime } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/asoebi/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await getAsoebiEvent(slug);
  return {
    title: event ? `${event.title} — Asoebi` : "Event not found",
    description: event?.description?.slice(0, 160),
    robots: { index: false, follow: false }, // private, link-shared pages
  };
}

export default function EventPage({ params }: PageProps<"/asoebi/events/[slug]">) {
  return (
    <Suspense fallback={<Skeleton className="m-12 h-96 rounded-none" />}>
      <EventContent params={params} />
    </Suspense>
  );
}

async function EventContent({ params }: Pick<PageProps<"/asoebi/events/[slug]">, "params">) {
  const { slug } = await params;
  const event = await getAsoebiEvent(slug);
  if (!event) notFound();

  const links = [...event.asoebi_event_products].sort((a, b) => a.sort_order - b.sort_order);
  const cards = await getProductsByIds(links.map((l) => l.product_id));
  const details = await Promise.all(cards.map((c) => getProductBySlug(c.slug)));
  const products = links
    .map((l) => {
      const detail = details.find((d) => d?.id === l.product_id);
      return detail ? { link: l, detail } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  await connection();
  const closed = hasPassed(event.order_deadline);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-wine-deep text-ivory">
        <FabricImage src={event.cover_image_url || "/demo/collection-the-asoebi-collection.svg"} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-45" />
        <div className="container-x py-20 text-center sm:py-28">
          <p className="eyebrow text-gold-light">{event.event_type ?? "Celebration"} · Asoebi</p>
          <h1 className="mx-auto mt-4 max-w-4xl text-5xl sm:text-7xl">{event.title}</h1>
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-ivory/85">
            {event.event_date && (
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="size-4" /> {formatDate(event.event_date, { dateStyle: "full" })}
              </span>
            )}
            {event.order_deadline && (
              <span className="inline-flex items-center gap-2">
                <Clock className="size-4" /> Order by {formatDateTime(event.order_deadline)}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="container-x grid gap-14 py-16 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-8">
          {event.description && <div className="prose-lux" dangerouslySetInnerHTML={{ __html: renderMarkdown(event.description) }} />}
          {event.guest_instructions && (
            <div className="border border-border bg-card p-6">
              <p className="eyebrow">Guest ordering instructions</p>
              <div className="prose-lux mt-2 text-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(event.guest_instructions) }} />
            </div>
          )}
          {event.coordinator_name && <p className="text-sm text-muted-foreground">Coordinated by {event.coordinator_name} with Lobaloba Deluxe.</p>}
        </div>

        {closed ? (
          <div className="border border-border bg-card p-10 text-center">
            <p className="font-serif text-3xl">Orders have closed</p>
            <p className="mt-2 text-sm text-muted-foreground">The ordering deadline for this event has passed. Please contact the coordinator or our team on WhatsApp.</p>
          </div>
        ) : products.length === 0 ? (
          <p className="text-muted-foreground">Fabrics for this event will be announced soon.</p>
        ) : (
          <EventOrderForm
            eventSlug={event.slug}
            deliveryMode={event.delivery_mode as "individual" | "collective" | "both"}
            collectiveNote={event.collective_delivery_note}
            products={products.map(({ link, detail }) => ({
              id: detail.id,
              name: detail.name,
              label: link.package_label,
              notes: link.notes,
              price: link.price_override !== null ? Number(link.price_override) : detail.price,
              currency: detail.currency,
              purchaseUnit: detail.purchaseUnit,
              unitLabel: detail.unitLabel,
              image: detail.images[0]?.url ?? null,
              colours: detail.colours,
              images: detail.images,
              variants: detail.variants,
            }))}
          />
        )}
      </div>
    </>
  );
}

function hasPassed(deadline: string | null) {
  return !!deadline && new Date(deadline).getTime() < Date.now();
}
