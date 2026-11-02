import { formatMoney, formatDate, orderStatusLabel } from "@/lib/format";

// Branded, table-based HTML emails that render consistently across clients.

const BRAND = { wine: "#6e1f2f", gold: "#b8955a", ivory: "#faf6ef", ink: "#1f1a17", muted: "#6b625b" };

export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout({ preheader, title, body, siteUrl, footerNote }: { preheader: string; title: string; body: string; siteUrl: string; footerNote?: string }) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:${BRAND.ivory};font-family:Helvetica,Arial,sans-serif;color:${BRAND.ink}">
<span style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.ivory};padding:32px 12px"><tr><td align="center">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #eadfcf">
<tr><td style="background:${BRAND.wine};padding:28px 32px;text-align:center">
<a href="${siteUrl}" style="text-decoration:none;color:#fff;font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:4px">LOBALOBA</a>
<div style="color:${BRAND.gold};font-size:10px;letter-spacing:6px;margin-top:4px">DELUXE</div></td></tr>
<tr><td style="padding:36px 32px 8px"><h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:26px;color:${BRAND.wine}">${escapeHtml(title)}</h1>${body}</td></tr>
<tr><td style="padding:24px 32px 32px;border-top:1px solid #f0e8dc;color:${BRAND.muted};font-size:12px;line-height:18px">
${escapeHtml(footerNote ?? "Lobaloba Deluxe · Premium fabrics for life's finest moments")}<br><a href="${siteUrl}" style="color:${BRAND.wine}">${siteUrl.replace(/^https?:\/\//, "")}</a></td></tr>
</table></td></tr></table></body></html>`;
}

const p = (text: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:24px">${text}</p>`;
const button = (href: string, label: string) =>
  `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px 0"><tr><td style="background:${BRAND.wine}"><a href="${href}" style="display:inline-block;padding:14px 28px;color:#fff;text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase">${escapeHtml(label)}</a></td></tr></table>`;

type OrderForEmail = {
  order_number: string;
  full_name: string;
  currency: string;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  total: number;
  shipping_method: string | null;
  shipping_requires_quote: boolean;
  shipping_address: { address_line?: string; city?: string; state?: string; country?: string } | null;
  tracking_number?: string | null;
  carrier?: string | null;
  tracking_url?: string | null;
  items: { product_name: string; variant_name: string | null; unit_label: string; quantity: number; line_total: number }[];
};

function orderTable(o: OrderForEmail) {
  const rows = o.items
    .map(
      (i) => `<tr><td style="padding:10px 0;border-bottom:1px solid #f0e8dc;font-size:14px">${escapeHtml(i.product_name)}<br><span style="color:${BRAND.muted};font-size:12px">${escapeHtml(i.variant_name ?? "")} · ${escapeHtml(i.unit_label)} × ${i.quantity}</span></td>
<td style="padding:10px 0;border-bottom:1px solid #f0e8dc;text-align:right;font-size:14px">${formatMoney(i.line_total, o.currency)}</td></tr>`,
    )
    .join("");
  const line = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:6px 0;font-size:14px;${bold ? "font-weight:bold" : `color:${BRAND.muted}`}">${label}</td><td style="padding:6px 0;text-align:right;font-size:14px;${bold ? "font-weight:bold" : ""}">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0">${rows}
${line("Subtotal", formatMoney(o.subtotal, o.currency))}
${o.discount_total > 0 ? line("Discount", `−${formatMoney(o.discount_total, o.currency)}`) : ""}
${line(`Delivery${o.shipping_method ? ` (${escapeHtml(o.shipping_method)})` : ""}`, o.shipping_requires_quote ? "To be quoted" : formatMoney(o.shipping_total, o.currency))}
${line("Total", formatMoney(o.total, o.currency), true)}</table>`;
}

function addressBlock(o: OrderForEmail) {
  const a = o.shipping_address ?? {};
  const parts = [a.address_line, a.city, a.state, a.country].filter(Boolean).map(escapeHtml);
  return parts.length ? p(`<strong>Delivering to</strong><br>${parts.join(", ")}`) : "";
}

export const emailTemplates = {
  orderConfirmation(o: OrderForEmail, links: { track: string; site: string }) {
    return {
      subject: `Order ${o.order_number} confirmed — thank you`,
      html: layout({
        siteUrl: links.site,
        preheader: `We've received your order ${o.order_number}.`,
        title: "Thank you for your order",
        body:
          p(`Dear ${escapeHtml(o.full_name)},`) +
          p(`Your payment has been confirmed and order <strong>${escapeHtml(o.order_number)}</strong> is now with our team. We'll let you know as soon as it's on its way.`) +
          orderTable(o) +
          addressBlock(o) +
          (o.shipping_requires_quote ? p("Our team will contact you shortly with a delivery quote for your destination.") : "") +
          button(links.track, "Track your order"),
      }),
    };
  },

  paymentConfirmation(o: OrderForEmail & { reference: string; channel?: string | null }, links: { site: string; track: string }) {
    return {
      subject: `Payment received for ${o.order_number}`,
      html: layout({
        siteUrl: links.site,
        preheader: `Payment of ${formatMoney(o.total, o.currency)} received.`,
        title: "Payment received",
        body:
          p(`We have received your payment of <strong>${formatMoney(o.total, o.currency)}</strong> for order ${escapeHtml(o.order_number)}.`) +
          p(`Payment reference: <strong>${escapeHtml(o.reference)}</strong>${o.channel ? ` · Paid via ${escapeHtml(o.channel)}` : ""}`) +
          button(links.track, "View order"),
      }),
    };
  },

  orderStatus(o: OrderForEmail & { status: string; note?: string | null }, links: { site: string; track: string }) {
    const copy: Record<string, { title: string; text: string }> = {
      processing: { title: "Your order is being prepared", text: "Our team has started preparing your order with care." },
      preparing_dispatch: { title: "Your order is almost ready", text: "Your order is being packaged and prepared for dispatch." },
      shipped: { title: "Your order is on its way", text: "Good news — your order has been dispatched." },
      out_for_delivery: { title: "Out for delivery", text: "Your order is out for delivery and will arrive soon." },
      delivered: { title: "Your order has been delivered", text: "Your order has been delivered. We hope you love it." },
      cancelled: { title: "Your order has been cancelled", text: "Your order has been cancelled. If you have already paid, our team will be in touch about your refund." },
      refunded: { title: "Your refund has been processed", text: "We have processed your refund. Depending on your bank it may take 5–10 business days to appear." },
      return_requested: { title: "We've received your return request", text: "Our team will review your return request and get back to you shortly." },
    };
    const c = copy[o.status] ?? { title: `Order update: ${orderStatusLabel(o.status)}`, text: `Your order status is now ${orderStatusLabel(o.status)}.` };
    const tracking =
      o.tracking_number
        ? p(`<strong>Tracking:</strong> ${escapeHtml(o.carrier ?? "")} ${escapeHtml(o.tracking_number)}${o.tracking_url ? ` — <a href="${escapeHtml(o.tracking_url)}" style="color:${BRAND.wine}">track shipment</a>` : ""}`)
        : "";
    return {
      subject: `${c.title} — ${o.order_number}`,
      html: layout({
        siteUrl: links.site,
        preheader: c.text,
        title: c.title,
        body:
          p(`Dear ${escapeHtml(o.full_name)},`) +
          p(c.text) +
          (o.note ? p(escapeHtml(o.note)) : "") +
          tracking +
          (o.status === "refunded" || o.status === "cancelled" ? "" : orderTable(o)) +
          button(links.track, "Track your order"),
      }),
    };
  },

  restock(input: { productName: string; productUrl: string; site: string }) {
    return {
      subject: `${input.productName} is back in stock`,
      html: layout({
        siteUrl: input.site,
        preheader: `${input.productName} is available again.`,
        title: "It's back",
        body: p(`Good news — <strong>${escapeHtml(input.productName)}</strong> is back in stock. Popular fabrics sell quickly, so we recommend ordering soon.`) + button(input.productUrl, "Shop now"),
      }),
    };
  },

  quotationReceived(q: { reference: string; full_name: string; request_type: string }, links: { site: string; view: string }) {
    return {
      subject: `We've received your ${q.request_type === "wholesale" ? "wholesale" : "Asoebi"} request (${q.reference})`,
      html: layout({
        siteUrl: links.site,
        preheader: "Our team will prepare your quotation shortly.",
        title: "Your request is with us",
        body:
          p(`Dear ${escapeHtml(q.full_name)},`) +
          p(`Thank you for your ${q.request_type === "wholesale" ? "wholesale enquiry" : "Asoebi quotation request"}. Your reference is <strong>${escapeHtml(q.reference)}</strong>.`) +
          p("Our team will review your requirements, confirm availability and send a tailored quotation, usually within one business day.") +
          button(links.view, "View your request"),
      }),
    };
  },

  quotationIssued(
    q: { reference: string; full_name: string; currency: string; total: number; valid_until: string | null; quote_message: string | null },
    links: { site: string; view: string },
  ) {
    return {
      subject: `Your quotation ${q.reference} is ready`,
      html: layout({
        siteUrl: links.site,
        preheader: `Quotation total ${formatMoney(q.total, q.currency)}.`,
        title: "Your quotation is ready",
        body:
          p(`Dear ${escapeHtml(q.full_name)},`) +
          p(`Your quotation <strong>${escapeHtml(q.reference)}</strong> is ready, with a total of <strong>${formatMoney(q.total, q.currency)}</strong>.`) +
          (q.quote_message ? p(escapeHtml(q.quote_message)) : "") +
          (q.valid_until ? p(`This quotation is valid until ${formatDate(q.valid_until)}.`) : "") +
          button(links.view, "Review and accept"),
      }),
    };
  },

  quotationAccepted(q: { reference: string; full_name: string }, links: { site: string; view: string }, forAdmin = false) {
    return {
      subject: forAdmin ? `Quotation ${q.reference} accepted by ${q.full_name}` : `Thank you — quotation ${q.reference} accepted`,
      html: layout({
        siteUrl: links.site,
        preheader: "Quotation accepted.",
        title: forAdmin ? "Quotation accepted" : "Thank you for accepting",
        body: forAdmin
          ? p(`${escapeHtml(q.full_name)} accepted quotation <strong>${escapeHtml(q.reference)}</strong>. Convert it to an order from the admin dashboard.`) + button(links.view, "Open quotation")
          : p(`Dear ${escapeHtml(q.full_name)},`) +
            p(`Thank you for accepting quotation <strong>${escapeHtml(q.reference)}</strong>. We are preparing your order and will send you a secure payment link shortly.`) +
            button(links.view, "View quotation"),
      }),
    };
  },

  orderPaymentLink(o: { order_number: string; full_name: string; total: number; currency: string }, links: { site: string; pay: string }) {
    return {
      subject: `Complete payment for order ${o.order_number}`,
      html: layout({
        siteUrl: links.site,
        preheader: `Your order total is ${formatMoney(o.total, o.currency)}.`,
        title: "Your order is ready for payment",
        body:
          p(`Dear ${escapeHtml(o.full_name)},`) +
          p(`We've created order <strong>${escapeHtml(o.order_number)}</strong> from your accepted quotation. The total is <strong>${formatMoney(o.total, o.currency)}</strong>.`) +
          button(links.pay, "Pay securely"),
      }),
    };
  },

  newsletterConfirmation(links: { site: string; confirm: string }) {
    return {
      subject: "Please confirm your subscription to Lobaloba Deluxe",
      html: layout({
        siteUrl: links.site,
        preheader: "One click to join the Lobaloba circle.",
        title: "Welcome to the Lobaloba circle",
        body: p("Thank you for subscribing. Please confirm your email address to receive new arrivals, private sales and styling notes.") + button(links.confirm, "Confirm subscription"),
      }),
    };
  },

  adminNotice(input: { title: string; lines: string[]; link: string; site: string }) {
    return {
      subject: input.title,
      html: layout({
        siteUrl: input.site,
        preheader: input.title,
        title: input.title,
        body: input.lines.map((l) => p(escapeHtml(l))).join("") + button(input.link, "Open in dashboard"),
      }),
    };
  },
};
