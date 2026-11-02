# Lobaloba Deluxe

Premium fabric e-commerce platform: storefront, Asoebi Lounge, wholesale quotations, customer accounts and a full admin dashboard.

**Stack:** Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Motion · Supabase (Postgres, Auth, Storage, RLS) · Paystack · Resend · Zod

---

## 1. What's included

| Area | Highlights |
| --- | --- |
| Storefront | Editable hero and announcement bar, image-led categories, new arrivals, featured collections, bestsellers, Asoebi promo, trust section, journal and newsletter |
| Catalogue | Shop with category, price, colour, fabric type, availability, new and bestseller filters; six sort orders; pagination; quick view; wishlist |
| Search | Prefix and typo-tolerant search (`search_products` RPC: full text plus trigram), suggestions, recent searches, results page with an empty state |
| Product page | Gallery with zoom and colour-linked images, purchase units with a plain explanation of what the price covers, per-variant stock, low-stock and sold-out states, Notify Me, Request a Sample, WhatsApp enquiry, reviews, FAQs, related and recently viewed products, Product and Breadcrumb JSON-LD |
| Bag & wishlist | Stored in localStorage for guests and in Supabase for signed-in users, merged after login. Every price and stock figure is re-checked on the server |
| Checkout | Steps: details → delivery → shipping → review → Paystack → confirmation. Supports coupons and shipping zones (Lagos, other states, international by quote, store pickup) |
| Payments | Order is created server-side, then Paystack is initialised. Payment is verified by the Paystack API in both the callback and the HMAC-signed webhook. `confirm_order_payment` runs atomically and idempotently: amount/currency check, stock deducted exactly once, coupon redeemed once |
| Accounts | Register (with email verification), login, password reset, profile and password change, addresses, order history and details, returns, quotations |
| Orders | 10 statuses, visual tracking timeline, tracking by order number plus email or phone, milestone emails |
| Asoebi | Lounge landing page, three configurable packages, quotation form with catalogue product picker, shareable event pages (`/asoebi/events/<slug>`) where each guest orders and pays independently |
| Wholesale | Bulk-pricing request with products, quantities, colours and an availability check |
| Admin (`/admin`) | Dashboard (KPIs, revenue chart, bestsellers, low stock, recent transactions, date ranges); products (variants, colours, stock, images, SEO, FAQs) and reviews; categories; collections; orders (search, filter, status and tracking, refunds, returns, CSV export); customers and roles; quotations (pricing, send, accept/decline/expire, convert to order); Asoebi events and guest-order monitoring; promotions; shipping; website content; journal and FAQs; messages; settings; demo-data removal |

---

## 2. Local development

Prerequisites: Node 22+, the Supabase CLI, and Docker (Docker Desktop, OrbStack or colima).

```bash
npm install
supabase start                  # local Postgres, Auth, Storage, Mailpit
supabase db reset               # applies migrations and loads supabase/seed.sql (demo data)
```

Create `.env.local` from `.env.example`. Use the values printed by `supabase status`:
`API_URL` → `NEXT_PUBLIC_SUPABASE_URL`, `ANON_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SERVICE_ROLE_KEY` → `SUPABASE_SERVICE_ROLE_KEY`.

```bash
npm run admin:create -- you@example.com 'a-strong-password' "Your Name" admin
npm run dev                     # http://localhost:3000  ·  admin at /admin
```

- Local emails (sign-up verification, password reset) are captured by **Mailpit** at http://127.0.0.1:54324.
- Transactional emails (orders, quotations) are sent through Resend. If `RESEND_API_KEY` is not set they are skipped and logged, and nothing else breaks.
- After any schema change, run `npm run db:types` to regenerate `lib/supabase/database.types.ts`.

### Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run typecheck` | Regenerate route types and run `tsc` |
| `npm run lint` | ESLint |
| `npm run build` | Production build |
| `npm run demo:generate` | Regenerate demo artwork (`public/demo`) and `supabase/seed.sql` |
| `npm run admin:create -- <email> <password> [name] [admin\|staff]` | Create or promote a dashboard user |

---

## 3. Configuring the integrations

### Supabase (production)

1. Create a project at https://supabase.com.
2. Link it and push the migrations:
   ```bash
   supabase link --project-ref <ref>
   supabase db push
   ```
3. Optional demo catalogue: `psql "<connection string>" -f supabase/seed.sql`.
4. **Auth → URL configuration:** set the Site URL to your domain and add `https://<domain>/auth/confirm` to the redirect URLs.
5. **Auth → Email:** keep "Confirm email" on. Paste the branded templates from `supabase/templates/` (confirmation, recovery, email change) into the matching Supabase templates. They link to `/auth/confirm?token_hash=…`.
6. **Auth → SMTP:** to send auth emails through Resend, use host `smtp.resend.com`, port `465`, user `resend`, and your Resend API key as the password.
7. Create your first administrator with `npm run admin:create`, using the production env values.

Storage: the `media` bucket and its policies are created by the migrations. It is public-read and admin-write. Uploads are checked server-side for type (magic bytes) and size (5 MB).

### Paystack

1. Add `PAYSTACK_SECRET_KEY` and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`. Use the `sk_test_` and `pk_test_` keys until launch.
2. **Dashboard → Settings → API Keys & Webhooks:** set the webhook URL to `https://<domain>/api/paystack/webhook`.
3. The callback URL is sent automatically on each transaction (`/checkout/complete`).
4. Choose the payment channels in **Admin → Settings → Payment configuration**. They must also be enabled on your Paystack account.

An order is never marked paid from the browser redirect alone. The callback page and the webhook both re-verify the transaction with Paystack's API. Webhook events are signature-checked (HMAC-SHA512) and de-duplicated in `payment_webhook_events`.

### Resend

1. Verify your sending domain in Resend.
2. Set `RESEND_API_KEY` and `EMAIL_FROM` (an address on that domain).
3. Set the admin alert recipient in **Admin → Settings → Store & notifications**.

Templates live in `lib/email/templates.ts`. They cover order confirmation, payment confirmation, processing, dispatch, out for delivery, delivered, cancelled, refunded, restock, quotation received, quotation issued, quotation accepted (customer and admin), payment link, newsletter confirmation and admin notices. Account verification and password reset use the Supabase templates in `supabase/templates/`.

### WhatsApp

Set the business number (digits only, including country code, e.g. `2348012345678`) in **Admin → Settings → Business**. It is used by the floating button, product enquiries, the header and the footer.

### Shipping providers

`lib/shipping/index.ts` defines a `ShippingProvider` interface. The default provider reads admin-managed zones and rates. To add a courier API, implement the interface and register it in `providers`.

---

## 4. Deployment (Vercel)

1. Push the repository and import it into Vercel. The framework is detected automatically.
2. Add every variable from `.env.example` to the Production and Preview environments. Set `NEXT_PUBLIC_SITE_URL` to the real domain.
3. Deploy, then point the Paystack webhook and the Supabase Auth URLs at the deployed domain.
4. **Before launch:**
   - Remove the demo data (Admin → Settings → Demo data, or `supabase/demo/remove_demo_data.sql`).
   - Upload real product photography and replace the hero image.
   - Review the shipping rates, policies, contact details and social links.
   - Switch to live Paystack keys.

---

## 5. Testing

Automated checks: `npm run typecheck && npm run lint && npm run build`.

Manual end-to-end journeys (use Paystack **test** keys and test cards from https://paystack.com/docs/payments/test-payments):

1. **Purchase:** browse → open a product → choose a colour → Add to bag → Checkout → details → delivery → shipping → review (try a coupon) → Pay on Paystack → you return to `/checkout/complete`. Check that the order is Payment Confirmed, stock has dropped, emails were sent, and the order appears in `/admin/orders`. Then track it at `/track` with the order number and your email.
2. **Webhook idempotency:** resend the `charge.success` event from the Paystack dashboard. The order, stock and coupon usage must not change a second time.
3. **Accounts:** register → verify via the emailed link (Mailpit locally) → sign in → add to wishlist and bag → sign out and back in. Items persist, and a different account never receives them → order history.
4. **Asoebi:** request a quote at `/asoebi` (attach a product) → in Admin → Quotations set prices, discount and delivery, then **Send quotation** → open the customer link `/quotes/<token>` and **Accept** → Admin → **Convert to order & send payment link** → pay from the quote page.
5. **Event page:** Admin → Asoebi events → New → add fabrics and publish → open `/asoebi/events/<slug>` as a guest and pay. The guest appears in the event's monitoring table.
6. **Admin:** create a product with colours, variants and images; set a variant to 0 stock; submit Notify Me on the storefront; restock the variant. The waiting customer is emailed.

Payment-function check (SQL, local): see `confirm_order_payment` in `supabase/migrations/20261102000001_schema.sql`. It rejects amount mismatches, and a second call returns `already_processed: true`.

---

## 6. Project structure

```
app/(store)/…            storefront routes (shop, products, checkout, account, asoebi, journal, …)
app/admin/…              admin dashboard (role-checked on the server in the layout, every page and every action)
app/actions/…            server actions (Zod-validated, rate-limited where public)
app/api/                 search suggestions, Paystack webhook
components/{store,admin,account,shared,ui}
lib/                     data access, pricing, shipping, Paystack, email, auth, validation
supabase/migrations      schema, RLS and storage policies, base content, catalogue view and search
supabase/seed.sql        demo data (generated; flagged is_demo)
```

Security model: every table has RLS. Customers can read only their own profile, addresses, cart, wishlist, orders, returns, quotations and notifications. Admin access is checked in the database (`is_admin()`) and on the server (`requireAdmin()`), never just by hiding UI. Secrets exist only in environment variables, and the service-role client is used only on the server.
# lobaloba
