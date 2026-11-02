# PROJECT: BUILD LOLOBALOBA FABRICS — PREMIUM FABRIC E-COMMERCE PLATFORM

## 1. PROJECT OVERVIEW

Build a complete, production-ready e-commerce website for a Nigerian premium fabric and fashion accessories business called **Lobaloba Fabrics**.

Reference website:
https://darlingsfabrics.com/shop

Use the reference website to understand the shopping experience, page structures, features, user journeys and e-commerce functionality.

IMPORTANT:
Do not copy the reference company's branding, logo, business name, written content or proprietary images. Create a distinctive identity for Lobaloba Fabrics while implementing comparable functionality and improving the overall user experience.

This is not a static website or UI prototype. Build a fully functional e-commerce application with a customer-facing storefront, backend, database, payment integration and comprehensive admin dashboard.

The finished product must allow customers to discover fabrics, browse collections, view product details, add products to their shopping bags, make payments, track orders, request wholesale quotations and coordinate group Asoebi orders.

## 2. BRAND IDENTITY AND DESIGN DIRECTION

Brand name: Lobaloba Fabrics

Industry: Premium fabrics, bridal lace, Asoebi materials and fashion accessories.

Target customers:
- Nigerian women shopping for premium fabrics.
- Brides and wedding planners.
- Asoebi coordinators.
- Fashion designers and tailors.
- Customers buying fabrics for special occasions.
- Wholesale and bulk fabric buyers.
- International customers interested in Nigerian fabrics.

Brand personality:
- Elegant.
- Luxurious.
- Sophisticated.
- Trustworthy.
- Fashion-forward.
- Premium but approachable.

### Visual direction

Create a high-end luxury fashion e-commerce experience.

Use:
- Warm ivory and cream backgrounds.
- Deep burgundy or wine as a primary brand colour.
- Champagne gold as a secondary accent.
- Black and charcoal for typography.
- Generous whitespace.
- Elegant typography.
- Large editorial photography.
- Premium product photography.
- Subtle animations and hover interactions.

Typography:
- Use an elegant serif font for headings.
- Use a clean modern sans-serif font for body text and interface elements.

The design should feel like a luxury fashion boutique, not a generic Shopify template.

Ensure excellent responsiveness across desktop, tablets and mobile devices.

Mobile experience is especially important because many Nigerian customers will access the website using smartphones.

## 3. TECHNOLOGY STACK

Use the following architecture:

Frontend:
- Next.js with App Router.
- React.
- TypeScript.
- Tailwind CSS.
- shadcn/ui for reusable interface components.
- Lucide icons.
- Framer Motion for subtle animations.

Backend:
- Next.js server actions and API routes.
- Supabase for PostgreSQL database.
- Supabase Authentication.
- Supabase Storage for product images and other media.

Payments:
- Paystack integration.
- Support cards, bank transfers and other payment methods enabled on the merchant's Paystack account.
- Implement payment verification using secure server-side verification and webhooks.

Other integrations:
- WhatsApp Business click-to-chat.
- Resend for transactional emails.
- Optional shipping provider integration through an extensible shipping service layer.

Currency:
- Nigerian Naira (₦) as the default currency.
- Design the application to support international currencies in the future.

All payment secrets and API keys must be stored in environment variables.

Never expose secret keys in frontend code.

## 4. WEBSITE STRUCTURE AND NAVIGATION

Create the following main navigation:

- Home
- Shop
- New Arrivals
- Collections
- Asoebi Lounge
- Wholesale
- Journal
- About Us
- Contact Us

Header functionality:
- Lobaloba Fabrics logo.
- Search icon with functional search.
- Account icon.
- Wishlist icon with item count.
- Shopping bag icon with item count.
- WhatsApp support link.

Create a promotional announcement bar at the top of the website.

Example:
"Discover timeless elegance with Lobaloba Fabrics."

The announcement should be editable through the admin dashboard.

## 5. HOMEPAGE

Create an elegant homepage with the following sections.

### A. Hero section

Large editorial image featuring premium fabrics.

Headline:
"Luxury Fabrics. Unforgettable Moments."

Supporting text:
"Discover beautifully curated fabrics and accessories for weddings, celebrations and every special occasion."

Buttons:
- Shop Collection
- Explore Asoebi

The hero image, heading, supporting text and buttons must be manageable from the admin dashboard.

### B. Shopping categories

Display attractive image-based category cards.

Initial categories:

1. Luxury Crystal Fabrics
2. Beaded Fabrics
3. Panel Dress Fabrics
4. Bridal Fabrics
5. Owanbe Fabrics
6. Men's Fabrics
7. Clutch Purses
8. Accessories

Each category should link to its collection page.

Categories must be dynamically managed by administrators.

### C. New arrivals

Display recently added products.

Include:
- Product image.
- Product name.
- Category.
- Price.
- Purchase unit.
- Availability.
- Quick view.
- Wishlist action.

### D. Featured collections

Create visually attractive editorial sections for curated collections.

Examples:
- The Bridal Edit.
- The Wedding Guest Collection.
- The Asoebi Collection.
- The Luxury Crystal Collection.
- The Men's Collection.

### E. Bestsellers

Display popular products based on sales data.

### F. Asoebi Lounge promotional section

Introduce the Asoebi coordination service.

Headline:
"Planning a Celebration? Let Us Coordinate Your Asoebi."

Include a CTA to request a quotation.

### G. Brand trust section

Display:
- Premium quality.
- Secure payments.
- Nationwide delivery.
- Personalised assistance.
- Carefully packaged orders.

### H. Journal section

Display the latest fabric guides, wedding inspiration and styling articles.

### I. Newsletter subscription

Allow visitors to subscribe to updates, new arrivals and promotional offers.

### J. Footer

Include:
- Shop links.
- Category links.
- Customer service.
- About the company.
- Shipping information.
- Returns policy.
- Privacy policy.
- Terms and conditions.
- Social media links.
- Newsletter subscription.
- WhatsApp contact.

## 6. SHOP AND PRODUCT CATALOGUE

Build a comprehensive shopping experience.

Shop page requirements:

- Product grid.
- Category navigation.
- Search.
- Pagination.
- Sorting.
- Filtering.
- Quick view.
- Wishlist functionality.

Filtering options:
- Category.
- Price range.
- Colour.
- Fabric type.
- Availability.
- New arrivals.
- Bestsellers.

Sorting options:
- Featured.
- Newest.
- Price: Low to High.
- Price: High to Low.
- Bestselling.
- Alphabetical.

Product cards should display:
- Product image.
- Product name.
- Product category.
- Price.
- Purchase unit.
- Available colours.
- Stock status.
- New arrival badge where applicable.
- Wishlist button.
- Quick view button.

Support a responsive product grid.

## 7. PRODUCT DETAILS PAGE

Every product must have a dedicated product page.

Display:

- Product name.
- Multiple product images.
- Image gallery.
- Image zoom.
- Product description.
- Product category.
- Price.
- Discounted price where applicable.
- Colour options.
- Available variants.
- Stock availability.
- Quantity selector.
- Purchase unit.
- Add to Bag.
- Buy Now.
- Add to Wishlist.
- Request a Sample.
- Ask for Assistance.

### Product purchasing units

The platform must support different purchasing methods.

Examples:
- Per yard.
- Four-yard bundle.
- Five-yard bundle.
- Per item.
- Per set.
- Custom quantity.

The administrator must configure the purchase unit and pricing for each product.

For example:

Product: Premium Bridal Lace
Price: ₦65,000
Unit: Per yard

Product: Luxury Crystal Fabric
Price: ₦480,000
Unit: Four-yard bundle

The customer must clearly understand what the displayed price covers.

### Product inventory

Implement:
- Stock quantity.
- Low-stock warnings.
- Out-of-stock status.
- Automatic stock reduction after confirmed payment.
- Restock notifications.
- Product availability by variant.

Prevent customers from purchasing quantities greater than available inventory.

### Additional product functionality

- Related products.
- Recently viewed products.
- Product reviews and ratings.
- Delivery and returns information.
- Fabric care instructions.
- Product FAQs.
- WhatsApp enquiry.
- Fabric stylist assistance.

When a product is out of stock, display a Notify Me option that allows customers to submit their email address.

## 8. SEARCH FUNCTIONALITY

Implement a functional search experience.

Customers should be able to search by:
- Product name.
- Category.
- Colour.
- Fabric type.
- Keywords.

Include:
- Search suggestions.
- Search results page.
- Empty search state.
- Recently searched products where practical.

Search should work across the product catalogue.

## 9. SHOPPING BAG AND WISHLIST

### Shopping bag

Implement a functional shopping bag.

Features:
- Add products.
- Remove products.
- Change quantities.
- Change selected variants where appropriate.
- Display product images.
- Display unit prices.
- Display line totals.
- Calculate subtotal.
- Display shipping estimate.
- Calculate final total.
- Continue shopping.
- Proceed to checkout.

Persist the shopping bag for logged-in users and use local storage for guest customers.

Synchronise guest shopping bags after login.

### Wishlist

Allow customers to:
- Add products to wishlist.
- Remove products.
- View saved products.
- Move products into shopping bag.

Persist wishlists for authenticated users.

## 10. CHECKOUT AND PAYMENT

Create a streamlined checkout experience.

Customers should be able to check out as guests or logged-in users.

Checkout fields:

- Full name.
- Email.
- Phone number.
- Country.
- State.
- City.
- Delivery address.
- Additional delivery instructions.

Checkout steps:

1. Customer information.
2. Delivery information.
3. Shipping method.
4. Order review.
5. Payment.
6. Confirmation.

### Payment integration

Integrate Paystack.

Payment process:
1. Create a pending order on the server.
2. Initiate Paystack transaction.
3. Redirect the customer to the payment gateway.
4. Verify the transaction on the server.
5. Confirm payment through Paystack webhook.
6. Update order payment status.
7. Deduct stock only after confirmed payment.
8. Send order confirmation email.
9. Display order confirmation page.

Implement idempotent webhook processing to prevent duplicate order creation or stock deductions.

Never mark an order as paid based only on a frontend redirect.

### Shipping

Create a configurable shipping system.

Support:
- Lagos delivery.
- Other Nigerian states.
- International shipping.
- Store pickup.
- Manual shipping quotation where necessary.

Allow administrators to configure shipping fees by location.

Shipping rates and delivery estimates must be editable from the admin dashboard.

Do not hardcode example shipping prices as permanent business rules.

## 11. CUSTOMER ACCOUNT

Implement Supabase authentication.

Features:
- Customer registration.
- Login.
- Logout.
- Password reset.
- Email verification.
- Profile management.
- Saved delivery addresses.
- Order history.
- Order details.
- Wishlist.
- Return requests.
- Password changes.

Create a customer dashboard with a clean interface.

Customers should be able to see:
- Total orders.
- Pending orders.
- Completed orders.
- Recent purchases.
- Order tracking information.

## 12. ORDER MANAGEMENT AND TRACKING

Every successful order must receive a unique order reference.

Order statuses:

- Pending Payment.
- Payment Confirmed.
- Processing.
- Preparing for Dispatch.
- Shipped.
- Out for Delivery.
- Delivered.
- Cancelled.
- Return Requested.
- Refunded.

Customers should be able to track their orders using:
- Order number.
- Email address or phone verification.

Create a tracking page with a visual order progress timeline.

Allow administrators to update order statuses and add tracking numbers.

Send customers email notifications when important order milestones change.

## 13. ASOEBI LOUNGE

This should be one of the platform's standout features.

Create a dedicated Asoebi coordination section for weddings, birthdays, traditional marriages and other celebrations.

Landing page headline:

"Your Celebration Deserves a Perfectly Coordinated Look."

Explain the service and its benefits.

### A. Event quotation form

Collect:

- Customer's full name.
- Email.
- Phone number.
- Event type.
- Event date.
- Estimated number of guests.
- Preferred fabric category.
- Preferred colours.
- Estimated budget.
- Required quantity.
- Delivery location.
- Additional information.

Allow customers to select products from the catalogue and attach them to their quotation request.

### B. Coordination packages

Create three configurable service packages:

1. Guided Fabric Selection.
2. Group Asoebi Coordination.
3. Full Asoebi Concierge.

Each package should have its own description, included services and quotation CTA.

Do not assume fixed pricing. Allow the administrator to configure pricing or mark a package as quotation-based.

### C. Wholesale and group orders

Implement a separate workflow for bulk purchases.

Features:
- Select products.
- Specify quantities.
- Request bulk pricing.
- Select colours.
- Submit event details.
- Request availability confirmation.
- Receive a custom quotation.

### D. Quotation management

Administrators should be able to:
- View quotation requests.
- Review event information.
- Add selected products.
- Set quoted prices.
- Add discounts.
- Add delivery charges.
- Send quotations to customers.
- Mark quotations as accepted, declined or expired.
- Convert accepted quotations into orders.

### E. Event-specific Asoebi pages

Build the architecture to support dedicated pages for individual events.

Example:

/asoebi/events/john-and-mary-wedding

Each page should support:
- Event title.
- Event date.
- Event description.
- Selected fabrics.
- Available colours.
- Product images.
- Guest ordering instructions.
- Individual guest checkout.
- Order deadline.

This feature should allow a wedding coordinator to share one link with guests so that each guest can independently select and pay for their Asoebi package.

The administrator should be able to monitor:
- Total guests.
- Total orders.
- Paid orders.
- Unpaid orders.
- Total quantities.
- Delivery information.
- Revenue.

## 14. CUSTOMER SUPPORT

Create a customer support centre.

Pages:

- Contact Us.
- Help Centre.
- Frequently Asked Questions.
- Shipping and Delivery.
- Returns and Refunds.
- Fabric Care Guide.
- Size and Yardage Guide.
- Order Tracking.

### WhatsApp integration

Add floating WhatsApp buttons throughout the website.

Product pages should support product-specific WhatsApp enquiries.

For example, clicking the button should open WhatsApp with a prefilled message:

"Hello Lobaloba Fabrics, I am interested in [Product Name]. Please provide more information."

Use a configurable WhatsApp business number.

### Contact form

Collect:
- Name.
- Email.
- Phone number.
- Subject.
- Message.

Save submissions in the database and make them available in the admin dashboard.

## 15. JOURNAL / BLOG

Build a content management system for publishing articles.

Example article categories:

- Fabric Guides.
- Bridal Inspiration.
- Asoebi Planning.
- Wedding Fashion.
- Style Inspiration.
- Fabric Care.
- Fashion Trends.

Features:
- Article listing.
- Article details.
- Featured image.
- Rich text content.
- Category filtering.
- Search.
- Related articles.
- Reading time.
- Author information.
- SEO metadata.
- Social sharing.

Administrators should be able to create, edit, publish, unpublish and delete articles.

## 16. ABOUT US

Create a premium About Us page.

Include:
- Brand story.
- Mission.
- Vision.
- Brand values.
- Product quality commitment.
- Customer service commitment.
- Contact information.

Use original content for Lobaloba Fabrics.

## 17. ADMIN DASHBOARD

Build a secure and comprehensive admin dashboard.

Only authorised administrators should access this section.

### Dashboard overview

Display:
- Total sales.
- Total orders.
- Total customers.
- Pending orders.
- Completed orders.
- Low-stock products.
- Bestselling products.
- Recent transactions.
- Revenue charts.

Allow filtering by:
- Today.
- Last 7 days.
- Last 30 days.
- Last 12 months.
- Custom date range.

### Product management

Administrators must be able to:
- Add products.
- Edit products.
- Delete products.
- Upload multiple images.
- Set product prices.
- Configure purchase units.
- Create product variants.
- Add colour options.
- Manage stock.
- Assign categories.
- Mark products as featured.
- Mark products as new arrivals.
- Mark products as bestsellers.
- Manage product descriptions.
- Configure SEO information.

### Category management

Create, edit and delete categories.

Support:
- Category images.
- Category descriptions.
- Category slugs.
- Category ordering.
- Active/inactive status.

### Order management

Administrators should be able to:
- View all orders.
- Search orders.
- Filter orders.
- View customer details.
- View purchased products.
- Verify payment information.
- Update order status.
- Add tracking information.
- Process cancellation requests.
- Manage refunds.
- Export order records.

### Customer management

Administrators should be able to:
- View customers.
- Search customers.
- View order history.
- View customer contact details.
- View customer addresses.
- Manage customer accounts.

### Asoebi management

Manage:
- Quotation requests.
- Wholesale enquiries.
- Event-specific pages.
- Guest orders.
- Event payment summaries.
- Event delivery information.

### Website content management

Administrators should be able to manage:
- Homepage banners.
- Promotional announcements.
- Featured collections.
- Homepage sections.
- Blog posts.
- FAQs.
- Contact information.
- Social media links.
- Shipping settings.
- Returns policies.

### Promotions

Support:
- Discount codes.
- Percentage discounts.
- Fixed-amount discounts.
- Product-specific promotions.
- Category-specific promotions.
- Minimum order requirements.
- Coupon expiry dates.

### Settings

Create an admin settings section for:
- Business name.
- Business email.
- Phone number.
- WhatsApp number.
- Store address.
- Currency.
- Payment configuration.
- Shipping configuration.
- Email configuration.
- Social media links.

## 18. DATABASE DESIGN

Use Supabase PostgreSQL.

Create a well-structured relational database.

Required tables:

- profiles
- roles
- addresses
- categories
- products
- product_images
- product_variants
- product_colours
- inventory
- carts
- cart_items
- wishlists
- wishlist_items
- orders
- order_items
- payments
- payment_webhook_events
- shipping_zones
- shipping_rates
- coupons
- coupon_redemptions
- reviews
- sample_requests
- restock_notifications
- asoebi_events
- asoebi_event_products
- asoebi_guest_orders
- quotation_requests
- quotation_items
- contact_messages
- newsletter_subscribers
- blog_posts
- blog_categories
- faqs
- site_settings
- notifications

Use UUID primary keys, timestamps, foreign keys, appropriate indexes and database constraints.

Include:
- Database migrations.
- Supabase Row Level Security policies.
- Role-based access control.
- Secure storage policies.
- Appropriate validation.

Customers must only access their own private account information, orders and addresses.

Administrators should have access based on verified server-side permissions.

Never rely on hiding frontend components as the only security mechanism.

## 19. EMAIL NOTIFICATIONS

Use Resend.

Create transactional email templates for:

- Account verification.
- Password reset.
- Order confirmation.
- Payment confirmation.
- Order processing.
- Order dispatch.
- Order delivery.
- Order cancellation.
- Refund notification.
- Restock notification.
- Quotation received.
- Quotation issued.
- Quotation accepted.
- Newsletter confirmation.

Use professional branded email templates.

## 20. SEO AND PERFORMANCE

Implement:

- SEO-friendly URLs.
- Metadata for every page.
- Product structured data.
- Breadcrumb structured data.
- Open Graph images.
- XML sitemap.
- Robots.txt.
- Canonical URLs.
- Optimised images.
- Lazy loading.
- Responsive images.
- Server-side rendering where appropriate.
- Fast page transitions.

Ensure product pages and category pages are indexable.

Use descriptive product titles and image alt text.

## 21. SECURITY AND QUALITY REQUIREMENTS

Implement:
- Input validation using Zod.
- Secure authentication.
- Server-side authorisation.
- Rate limiting for sensitive endpoints.
- Secure payment verification.
- Webhook signature verification.
- Protection against duplicate transactions.
- Safe image upload validation.
- Secure environment variable management.
- Database Row Level Security.
- Error handling.
- Logging.
- Appropriate loading and empty states.

Never expose customer payment details or sensitive information.

## 22. USER EXPERIENCE REQUIREMENTS

Every visible button must work.

Every form must validate and submit.

Every product card must link to a real product page.

All shopping bag calculations must be accurate.

All prices must be calculated and verified server-side.

All checkout steps must be functional.

All admin forms must persist data.

Do not use hardcoded product information as the final data source.

Do not create decorative buttons that do nothing.

Do not use fake payment success responses.

Do not build a frontend-only demonstration.

If an integration requires API credentials, build the complete integration and provide clear instructions for configuring the credentials.

## 23. DEMO DATA

Create realistic demonstration products for Lobaloba Fabrics.

Use the following initial categories:

- Luxury Crystal Fabrics.
- Beaded Fabrics.
- Bridal Fabrics.
- Panel Dress Fabrics.
- Owanbe Fabrics.
- Men's Fabrics.
- Clutch Purses.
- Accessories.

Create at least 20 sample products with:
- Product names.
- Descriptions.
- Product images.
- Categories.
- Prices in Naira.
- Purchase units.
- Stock quantities.
- Colour options.
- Product variants.

Clearly separate demo data from real business inventory.

Make it possible to remove all demo products before production.

## 24. IMPLEMENTATION APPROACH

Build the application in structured phases.

Phase 1: Foundation
- Project setup.
- Next.js configuration.
- Supabase configuration.
- Database schema.
- Authentication.
- Shared layout.
- Navigation and footer.

Phase 2: Storefront
- Homepage.
- Shop.
- Categories.
- Product details.
- Search.
- Filtering.
- Sorting.

Phase 3: Shopping and payments
- Shopping bag.
- Wishlist.
- Checkout.
- Paystack integration.
- Order creation.
- Payment verification.

Phase 4: Customer features
- Customer dashboard.
- Order history.
- Order tracking.
- Returns.
- Notifications.

Phase 5: Asoebi and wholesale
- Asoebi Lounge.
- Event quotation form.
- Wholesale enquiries.
- Event-specific pages.
- Guest ordering.

Phase 6: Administration
- Admin dashboard.
- Product management.
- Inventory.
- Orders.
- Customers.
- Quotations.
- CMS.
- Settings.

Phase 7: Content and optimisation
- Blog.
- SEO.
- Performance.
- Accessibility.
- Security.
- Testing.

## 25. FINAL DELIVERABLE

Deliver a complete, polished and production-ready Lobaloba Fabrics platform.

The final result should include:

1. Fully responsive customer-facing website.
2. Complete e-commerce functionality.
3. Supabase database and migrations.
4. Secure customer authentication.
5. Paystack payment integration.
6. Shopping bag and wishlist.
7. Customer dashboard.
8. Order management and tracking.
9. Asoebi coordination system.
10. Wholesale quotation system.
11. Admin dashboard.
12. Blog and content management.
13. Email notifications.
14. SEO optimisation.
15. Setup and deployment documentation.
16. Environment variable example file.
17. Testing instructions.

Start by designing the complete architecture and project structure.

Then implement the application phase by phase.

Do not stop after generating the homepage or a static UI.

Before considering the project complete, test the complete customer journey:

Browse product → Select variant → Add to bag → Checkout → Pay → Verify payment → Receive confirmation → Track order.

Also test:

Customer registration → Login → Wishlist → Order history.

And:

Asoebi enquiry → Admin quotation → Customer acceptance → Order creation.

Build this as a real business application that Lobaloba Fabrics can operate and grow with.