import { z } from "zod";

// Shared Zod schemas. Every server action validates its input with these.

export const trimmed = (max = 500) => z.string().trim().max(max);
export const requiredText = (label: string, max = 500) => z.string().trim().min(1, `${label} is required`).max(max);
export const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(254);
export const phone = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(20)
  .regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number");
export const optionalText = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));
export const uuid = z.string().uuid();

export const cartLinesSchema = z
  .array(z.object({ variantId: uuid, quantity: z.number().int().min(1).max(1000) }))
  .max(100);

export const addressSchema = z.object({
  fullName: requiredText("Full name", 120),
  phone,
  country: requiredText("Country", 80),
  state: requiredText("State", 80),
  city: requiredText("City", 80),
  addressLine: requiredText("Delivery address", 300),
});

export const checkoutSchema = z.object({
  fullName: requiredText("Full name", 120),
  email,
  phone,
  country: requiredText("Country", 80),
  state: requiredText("State / region", 80),
  city: requiredText("City", 80),
  addressLine: z.string().trim().max(300).default(""),
  instructions: optionalText(500),
  shippingRateId: uuid,
  couponCode: z.string().trim().toUpperCase().max(32).optional().default(""),
  lines: cartLinesSchema.min(1, "Your bag is empty"),
  saveAddress: z.boolean().optional().default(false),
});

export const contactSchema = z.object({
  fullName: requiredText("Name", 120),
  email,
  phone: z.union([phone, z.literal("")]).optional(),
  subject: requiredText("Subject", 160),
  message: requiredText("Message", 5000).refine((v) => v.length >= 10, "Please write a little more"),
});

export const newsletterSchema = z.object({ email, source: trimmed(40).optional() });

export const quotationItemInput = z.object({
  productId: uuid,
  quantity: z.number().int().min(1).max(100000),
  colour: trimmed(80).optional(),
});

export const quotationRequestSchema = z.object({
  requestType: z.enum(["asoebi", "wholesale"]),
  fullName: requiredText("Full name", 120),
  email,
  phone,
  companyName: optionalText(160),
  eventType: optionalText(80),
  eventDate: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Enter a valid date"),
  guestCount: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  preferredCategory: optionalText(120),
  preferredColours: optionalText(200),
  budget: optionalText(120),
  requiredQuantity: optionalText(200),
  deliveryLocation: optionalText(200),
  details: optionalText(5000),
  packageId: z.union([uuid, z.literal("")]).optional().transform((v) => (v ? v : null)),
  needsAvailabilityCheck: z.boolean().optional().default(false),
  items: z.array(quotationItemInput).max(50).default([]),
});

export const sampleRequestSchema = z.object({
  productId: uuid,
  colour: optionalText(80),
  fullName: requiredText("Full name", 120),
  email,
  phone,
  address: requiredText("Delivery address", 300),
  notes: optionalText(1000),
});

export const restockSchema = z.object({ productId: uuid, variantId: z.union([uuid, z.literal("")]).optional(), email });

export const reviewSchema = z.object({
  productId: uuid,
  rating: z.coerce.number().int().min(1).max(5),
  title: optionalText(120),
  body: requiredText("Review", 2000),
});

export const trackSchema = z.object({
  orderNumber: requiredText("Order number", 40).transform((v) => v.toUpperCase()),
  contact: requiredText("Email or phone", 254),
});

export const eventOrderSchema = z.object({
  eventSlug: z.string().trim().min(1).max(120),
  guestName: requiredText("Full name", 120),
  guestEmail: email,
  guestPhone: phone,
  deliveryPreference: z.enum(["individual", "collective"]),
  country: z.string().trim().max(80).default("Nigeria"),
  state: z.string().trim().max(80).default(""),
  city: z.string().trim().max(80).default(""),
  addressLine: z.string().trim().max(300).default(""),
  shippingRateId: z.union([uuid, z.literal("")]).optional(),
  lines: cartLinesSchema.min(1, "Select at least one item"),
});

export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export type ActionResult<T = undefined> =
  | ({ ok: true; message?: string } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
