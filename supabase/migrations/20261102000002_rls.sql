-- Row Level Security. Every table has RLS enabled.
-- Public form submissions, checkout and payment confirmation run on the server
-- with the service role after Zod validation and rate limiting, so anon users
-- get read access to public catalogue/content only.

do $$
declare t text;
begin
  foreach t in array array[
    'roles','profiles','addresses','categories','products','product_colours','product_images',
    'product_variants','inventory','collections','collection_products','carts','cart_items',
    'wishlists','wishlist_items','shipping_zones','shipping_rates','coupons','asoebi_packages',
    'asoebi_events','asoebi_event_products','quotation_requests','quotation_items','orders',
    'order_items','order_status_history','return_requests','payments','payment_webhook_events',
    'coupon_redemptions','asoebi_guest_orders','reviews','sample_requests','restock_notifications',
    'contact_messages','newsletter_subscribers','blog_categories','blog_posts','faqs',
    'site_settings','notifications','rate_limits'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    -- Administrators (admin/staff roles verified in the database) can do everything.
    if t <> 'rate_limits' then
      execute format(
        'create policy "admin full access" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
        t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Public read access
-- ---------------------------------------------------------------------------
create policy "public read roles" on public.roles for select using (true);

create policy "public read active categories" on public.categories
  for select using (is_active);

create policy "public read active products" on public.products
  for select using (status = 'active');

create policy "public read product colours" on public.product_colours
  for select using (exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));

create policy "public read product images" on public.product_images
  for select using (exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));

create policy "public read product variants" on public.product_variants
  for select using (is_active and exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));

create policy "public read inventory" on public.inventory for select using (true);

create policy "public read collections" on public.collections for select using (is_active);
create policy "public read collection products" on public.collection_products for select using (true);

create policy "public read shipping zones" on public.shipping_zones for select using (is_active);
create policy "public read shipping rates" on public.shipping_rates for select using (is_active);

create policy "public read asoebi packages" on public.asoebi_packages for select using (is_active);
create policy "public read published events" on public.asoebi_events for select using (is_published);
create policy "public read event products" on public.asoebi_event_products
  for select using (exists (select 1 from public.asoebi_events e where e.id = event_id and e.is_published));

create policy "public read approved reviews" on public.reviews for select using (is_approved);

create policy "public read blog categories" on public.blog_categories for select using (true);
create policy "public read published posts" on public.blog_posts
  for select using (status = 'published' and published_at <= now());

create policy "public read active faqs" on public.faqs for select using (is_active);
create policy "public read site settings" on public.site_settings for select using (true);

-- ---------------------------------------------------------------------------
-- Customer-owned data
-- ---------------------------------------------------------------------------
create policy "own profile read" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "own profile update" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "own addresses" on public.addresses
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own cart" on public.carts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own cart items" on public.cart_items
  for all to authenticated
  using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));

create policy "own wishlist" on public.wishlists
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own wishlist items" on public.wishlist_items
  for all to authenticated
  using (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid()))
  with check (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid()));

create policy "own orders read" on public.orders
  for select to authenticated using (user_id = auth.uid());
create policy "own order items read" on public.order_items
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "own order history read" on public.order_status_history
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

create policy "own returns read" on public.return_requests
  for select to authenticated using (user_id = auth.uid());

create policy "own quotations read" on public.quotation_requests
  for select to authenticated using (user_id = auth.uid());
create policy "own quotation items read" on public.quotation_items
  for select to authenticated
  using (exists (select 1 from public.quotation_requests q where q.id = quotation_id and q.user_id = auth.uid()));

create policy "own notifications read" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "own notifications update" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own reviews read" on public.reviews
  for select to authenticated using (user_id = auth.uid());

-- payments, payment_webhook_events, coupons, coupon_redemptions, sample_requests,
-- restock_notifications, contact_messages, newsletter_subscribers, rate_limits:
-- admin / service role only (no customer policies on purpose).

-- ---------------------------------------------------------------------------
-- Storage: public "media" bucket for product, category, blog and banner images.
-- Anyone can read; only admins can write. Uploads are additionally validated
-- server-side (MIME type, size) before reaching storage.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "media public read" on storage.objects
  for select using (bucket_id = 'media');
create policy "media admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy "media admin update" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin());
create policy "media admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());
