-- Default, editable store configuration. Everything here can be changed from
-- the admin dashboard; none of it is hardcoded in application code.

insert into public.categories (name, slug, description, sort_order) values
  ('Luxury Crystal Fabrics', 'luxury-crystal-fabrics', 'Hand-set crystals and stone-encrusted tulle that catch every light.', 1),
  ('Beaded Fabrics', 'beaded-fabrics', 'Intricately hand-beaded laces for statement celebration looks.', 2),
  ('Panel Dress Fabrics', 'panel-dress-fabrics', 'Engineered panel laces designed for sculpted silhouettes.', 3),
  ('Bridal Fabrics', 'bridal-fabrics', 'Ivory laces, satins and tulles for the bride''s most important day.', 4),
  ('Owanbe Fabrics', 'owanbe-fabrics', 'Bold, joyful fabrics made for the party and the dance floor.', 5),
  ('Men''s Fabrics', 'mens-fabrics', 'Cashmere wools, voiles and brocades for agbada, kaftan and senator styles.', 6),
  ('Clutch Purses', 'clutch-purses', 'Jewelled clutches to finish every celebration look.', 7),
  ('Accessories', 'accessories', 'Coral beads, hair combs, fans and gele to complete the ensemble.', 8);

insert into public.blog_categories (name, slug, sort_order) values
  ('Fabric Guides', 'fabric-guides', 1),
  ('Bridal Inspiration', 'bridal-inspiration', 2),
  ('Asoebi Planning', 'asoebi-planning', 3),
  ('Wedding Fashion', 'wedding-fashion', 4),
  ('Style Inspiration', 'style-inspiration', 5),
  ('Fabric Care', 'fabric-care', 6),
  ('Fashion Trends', 'fashion-trends', 7);

insert into public.site_settings (key, value) values
('announcement', jsonb_build_object(
  'enabled', true,
  'messages', jsonb_build_array(
    'Discover timeless elegance with Lobaloba Deluxe.',
    'Nationwide delivery across Nigeria · International shipping on request',
    'Planning a celebration? Ask about our Asoebi Lounge.'),
  'link', '/new-arrivals')),
('hero', jsonb_build_object(
  'eyebrow', 'The Lobaloba Atelier',
  'heading', 'Luxury Fabrics. Unforgettable Moments.',
  'subheading', 'Discover beautifully curated fabrics and accessories for weddings, celebrations and every special occasion.',
  'image_url', '',
  'image_alt', 'Draped luxury lace and crystal fabrics in wine and champagne tones',
  'primary_cta', jsonb_build_object('label', 'Shop Collection', 'href', '/shop'),
  'secondary_cta', jsonb_build_object('label', 'Explore Asoebi', 'href', '/asoebi'))),
('business', jsonb_build_object(
  'name', 'Lobaloba Deluxe',
  'tagline', 'Premium fabrics for life''s finest moments',
  'email', 'contact@lobalobadeluxe.com',
  'phone', '+234 812 289 8601, +234 816 566 8362',
  'whatsapp', '2348122898601',
  'address', '117 Woro Elewa Street, off Agoro Street, Idumota, Lagos Island, Lagos',
  'hours', 'Monday – Saturday, 9am – 6pm WAT',
  'currency', 'NGN')),
('social', jsonb_build_object(
  'instagram', 'https://www.instagram.com/lobalobadeluxe', 'facebook', '', 'tiktok', 'https://www.tiktok.com/@lobalobadeluxe', 'pinterest', '', 'youtube', '', 'x', '')),
('homepage', jsonb_build_object(
  'show_new_arrivals', true,
  'show_collections', true,
  'show_bestsellers', true,
  'show_asoebi', true,
  'show_journal', true,
  'asoebi_heading', 'Planning a Celebration? Let Us Coordinate Your Asoebi.',
  'asoebi_text', 'From fabric selection to individual guest payments and delivery, our Asoebi Lounge takes care of every detail so you can enjoy your celebration.',
  'newsletter_heading', 'Join the Lobaloba circle',
  'newsletter_text', 'Be first to see new arrivals, private sales and styling notes.')),
('store', jsonb_build_object(
  'currency', 'NGN',
  'low_stock_threshold', 5,
  'order_email_bcc', '',
  'admin_notification_email', '')),
('payment', jsonb_build_object(
  'paystack_enabled', true,
  'channels', jsonb_build_array('card', 'bank', 'ussd', 'bank_transfer', 'qr', 'mobile_money'),
  'instructions', 'You will be redirected to Paystack to complete payment securely.')),
('email', jsonb_build_object(
  'from_name', 'Lobaloba Deluxe',
  'reply_to', 'contact@lobalobadeluxe.com',
  'footer_note', 'You are receiving this email because you placed an order or contacted Lobaloba Deluxe.')),
('policies', jsonb_build_object(
  'shipping', E'## Delivery within Nigeria\n\nOrders are processed within 1–2 business days after payment is confirmed. Delivery times and fees depend on your location and are shown at checkout.\n\n## International shipping\n\nWe ship worldwide. International shipping is quoted individually based on weight and destination — our team will contact you with a quote after you place your order.\n\n## Store pickup\n\nChoose Store Pickup at checkout and we will notify you when your order is ready to collect.',
  'returns', E'## Our promise\n\nIf your order arrives damaged or differs from what you ordered, contact us within 48 hours of delivery and we will make it right.\n\n## Eligibility\n\n- Fabrics must be uncut, unwashed and in their original packaging.\n- Custom-cut lengths and sale items cannot be returned unless faulty.\n- Accessories must be unused with tags attached.\n\n## How to request a return\n\nSign in, open the order in your account and choose **Request a return**, or contact us on WhatsApp with your order number.\n\n## Refunds\n\nApproved refunds are issued to the original payment method within 5–10 business days.',
  'privacy', E'## Information we collect\n\nWe collect the details you provide when you place an order, create an account, request a quotation or contact us: your name, email address, phone number and delivery address.\n\n## How we use it\n\nWe use your information to process orders, arrange delivery, provide customer support and — only with your consent — send marketing emails.\n\n## Payments\n\nPayments are processed securely by Paystack. We never see or store your full card details.\n\n## Your rights\n\nYou can access, update or delete your personal information at any time from your account or by contacting us.',
  'terms', E'## Orders\n\nAll orders are subject to availability and confirmation of payment. Prices are shown in Nigerian Naira unless stated otherwise.\n\n## Product information\n\nWe make every effort to display colours accurately; however, colours may vary slightly between screens.\n\n## Quotations\n\nQuotations are valid until the date stated on the quotation and are subject to stock availability at the time of acceptance.\n\n## Governing law\n\nThese terms are governed by the laws of the Federal Republic of Nigeria.',
  'fabric_care', E'## Laces and beaded fabrics\n\n- Dry clean only.\n- Store rolled or flat in breathable fabric bags.\n- Press on the reverse side at low heat using a pressing cloth.\n\n## Crystal and stone fabrics\n\n- Never iron directly over crystals.\n- Avoid perfume and hairspray contact.\n- Hand-steam from a distance to release creases.\n\n## Aso-oke\n\n- Air regularly and store with cedar to deter moths.\n- Dry clean or spot clean only.',
  'yardage_guide', E'## How much fabric do I need?\n\n| Style | Women | Men |\n| --- | --- | --- |\n| Iro and buba | 5 yards | — |\n| Fitted gown | 4–5 yards | — |\n| Ball gown with train | 7–10 yards | — |\n| Kaftan / senator | 4 yards | 4–5 yards |\n| Agbada (3-piece) | — | 10 yards |\n| Gele | 1 set | — |\n\nAdd half a yard for pattern matching on large motifs. When in doubt, ask our stylists on WhatsApp.\n\n## Understanding our units\n\n- **Per yard** — price for one yard; choose how many yards you need.\n- **Four-yard / five-yard bundle** — price covers the whole bundle cut from one bolt.\n- **Per item / per set** — price covers one piece or one complete set.'));

-- Shipping zones and default rates (edit in Admin → Shipping)
with z as (
  insert into public.shipping_zones (name, description, zone_type, countries, states, sort_order)
  values ('Lagos', 'Delivery within Lagos State', 'domestic', array['Nigeria'], array['Lagos'], 1)
  returning id
)
insert into public.shipping_rates (zone_id, name, description, fee, min_days, max_days, sort_order)
select id, 'Lagos standard delivery', 'Doorstep delivery within Lagos', 5000, 1, 3, 1 from z
union all
select id, 'Lagos express delivery', 'Same / next-day delivery within Lagos', 10000, 0, 1, 2 from z;

with z as (
  insert into public.shipping_zones (name, description, zone_type, countries, states, sort_order)
  values ('Other Nigerian states', 'Delivery to all other states in Nigeria', 'domestic', array['Nigeria'], '{}', 2)
  returning id
)
insert into public.shipping_rates (zone_id, name, description, fee, min_days, max_days, sort_order)
select id, 'Nationwide delivery', 'Delivered by our courier partners', 9000, 3, 7, 1 from z;

with z as (
  insert into public.shipping_zones (name, description, zone_type, countries, states, requires_quote, sort_order)
  values ('International', 'Worldwide shipping — quoted individually', 'international', '{}', '{}', true, 3)
  returning id
)
insert into public.shipping_rates (zone_id, name, description, fee, min_days, max_days, sort_order)
select id, 'International shipping (quoted)', 'Our team will contact you with a shipping quote after checkout', 0, 5, 14, 1 from z;

with z as (
  insert into public.shipping_zones (name, description, zone_type, countries, states, sort_order)
  values ('Store pickup', 'Collect from our Lagos studio', 'pickup', array['Nigeria'], '{}', 4)
  returning id
)
insert into public.shipping_rates (zone_id, name, description, fee, min_days, max_days, sort_order)
select id, 'Store pickup', 'We will notify you when your order is ready to collect', 0, 1, 2, 1 from z;

insert into public.asoebi_packages (name, slug, tagline, description, included_services, is_quote_based, sort_order) values
('Guided Fabric Selection', 'guided-fabric-selection', 'Expert help choosing the perfect fabric',
 'A personal consultation with our fabric stylists to choose colours, textures and quantities for your celebration.',
 array['One-to-one styling consultation (in studio or video call)', 'Colour palette and fabric shortlist', 'Yardage recommendations per style', 'Swatch samples on request'], true, 1),
('Group Asoebi Coordination', 'group-asoebi-coordination', 'One link for all your guests',
 'We create a dedicated event page so every guest can select, pay for and receive their Asoebi independently.',
 array['Everything in Guided Fabric Selection', 'Dedicated event ordering page', 'Individual guest payments', 'Live paid/unpaid tracking for the coordinator', 'Stock reserved from a single dye lot'], true, 2),
('Full Asoebi Concierge', 'full-asoebi-concierge', 'We handle every detail, end to end',
 'Our concierge team manages fabric sourcing, guest communication, packaging and delivery for a completely stress-free celebration.',
 array['Everything in Group Asoebi Coordination', 'Dedicated concierge manager', 'Guest reminders and follow-ups', 'Personalised packaging and labelling', 'Coordinated delivery or event-day distribution'], true, 3);

insert into public.faqs (question, answer, category, sort_order) values
('How do I know how much fabric to buy?', 'Each product clearly shows its purchase unit — per yard, a four- or five-yard bundle, per item or per set. See our Size and Yardage Guide or ask our stylists on WhatsApp.', 'Ordering', 1),
('Which payment methods do you accept?', 'We accept cards, bank transfers, USSD and other methods available through Paystack. Payments are processed securely and we never store your card details.', 'Payments', 2),
('How long does delivery take?', 'Lagos orders typically arrive in 1–3 business days and other Nigerian states in 3–7 business days. Exact estimates are shown at checkout.', 'Delivery', 3),
('Do you ship internationally?', 'Yes. Choose International at checkout and our team will contact you with a shipping quote for your destination.', 'Delivery', 4),
('Can I request a fabric sample?', 'Yes. Use the Request a Sample button on any product page and we will arrange a swatch.', 'Ordering', 5),
('How does Asoebi coordination work?', 'Request a quotation in the Asoebi Lounge. Once confirmed, we can create a dedicated event page where each guest selects and pays for their own Asoebi.', 'Asoebi', 6),
('Can I return fabric?', 'Uncut, unwashed fabric in its original packaging can be returned within 48 hours of delivery if it is faulty or not as ordered. See our Returns policy for details.', 'Returns', 7),
('How do I track my order?', 'Use the Track Order page with your order number and email address or phone number, or sign in to view your order history.', 'Orders', 8);
