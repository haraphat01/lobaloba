-- Lobaloba Deluxe — core schema
-- All money columns are numeric(14,2) in the order/product currency (NGN by default).

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Identity: roles, profiles, addresses
-- ---------------------------------------------------------------------------
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name in ('customer', 'staff', 'admin')),
  description text,
  created_at timestamptz not null default now()
);

insert into public.roles (name, description) values
  ('customer', 'Storefront customer'),
  ('staff', 'Store staff with admin dashboard access'),
  ('admin', 'Full administrative access');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role_id uuid not null references public.roles (id)
    default '00000000-0000-0000-0000-000000000000',
  is_active boolean not null default true,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Replace the placeholder default with the real customer role id.
do $$
declare cid uuid;
begin
  select id into cid from public.roles where name = 'customer';
  execute format('alter table public.profiles alter column role_id set default %L::uuid', cid);
end $$;

create index profiles_email_idx on public.profiles (lower(email));
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = auth.uid() and p.is_active and r.name in ('admin', 'staff')
  );
$$;

-- Create a profile whenever an auth user is created.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Customers may edit their own profile but never their role or active flag.
create or replace function public.protect_profile_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.role_id is distinct from old.role_id or new.is_active is distinct from old.is_active)
     and coalesce(auth.role(), '') <> 'service_role'
     and not public.is_admin() then
    raise exception 'Not permitted to change role or account status';
  end if;
  return new;
end;
$$;

create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_columns();

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null default 'Home',
  full_name text not null,
  phone text not null,
  country text not null default 'Nigeria',
  state text not null,
  city text not null,
  address_line text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index addresses_user_idx on public.addresses (user_id);
create trigger addresses_updated_at before update on public.addresses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index categories_active_sort_idx on public.categories (is_active, sort_order);
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sku text unique,
  category_id uuid references public.categories (id) on delete set null,
  short_description text,
  description text,
  care_instructions text,
  fabric_type text,
  price numeric(14, 2) not null check (price >= 0),
  compare_at_price numeric(14, 2) check (compare_at_price is null or compare_at_price >= 0),
  currency text not null default 'NGN' check (char_length(currency) = 3),
  purchase_unit text not null default 'per_yard'
    check (purchase_unit in ('per_yard', 'bundle_4_yard', 'bundle_5_yard', 'per_item', 'per_set', 'custom')),
  unit_label text, -- used when purchase_unit = 'custom', e.g. "6-yard bundle"
  min_quantity int not null default 1 check (min_quantity >= 1),
  max_quantity int check (max_quantity is null or max_quantity >= 1),
  low_stock_threshold int not null default 5 check (low_stock_threshold >= 0),
  status text not null default 'active' check (status in ('draft', 'active', 'archived')),
  is_featured boolean not null default false,
  is_new_arrival boolean not null default false,
  is_bestseller boolean not null default false,
  sales_count int not null default 0,
  faqs jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  seo_title text,
  seo_description text,
  is_demo boolean not null default false,
  search_vector tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);
create index products_status_idx on public.products (status, created_at desc);
create index products_flags_idx on public.products (is_featured, is_new_arrival, is_bestseller) where status = 'active';
create index products_search_idx on public.products using gin (search_vector);
create index products_name_trgm_idx on public.products using gin (name gin_trgm_ops);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_colours (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  hex text not null default '#000000' check (hex ~ '^#[0-9a-fA-F]{6}$'),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, name)
);
create index product_colours_product_idx on public.product_colours (product_id);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  colour_id uuid references public.product_colours (id) on delete set null,
  url text not null,
  storage_path text,
  alt text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, sort_order);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  colour_id uuid references public.product_colours (id) on delete set null,
  name text not null,
  sku text unique,
  price_override numeric(14, 2) check (price_override is null or price_override >= 0),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index product_variants_product_idx on public.product_variants (product_id);
create trigger product_variants_updated_at before update on public.product_variants
  for each row execute function public.set_updated_at();

create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null unique references public.product_variants (id) on delete cascade,
  quantity int not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now()
);
create trigger inventory_updated_at before update on public.inventory
  for each row execute function public.set_updated_at();

-- Keep product search vectors in sync (name, fabric type, tags, colours, category).
create or replace function public.refresh_product_search(p_product_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.products p set search_vector =
    setweight(to_tsvector('simple', coalesce(p.name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(p.fabric_type, '') || ' ' || array_to_string(p.tags, ' ')), 'B') ||
    setweight(to_tsvector('simple', coalesce((select c.name from public.categories c where c.id = p.category_id), '')), 'B') ||
    setweight(to_tsvector('simple', coalesce((select string_agg(pc.name, ' ') from public.product_colours pc where pc.product_id = p.id), '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(p.short_description, '') || ' ' || coalesce(p.description, '')), 'C')
  where p.id = p_product_id;
end;
$$;

create or replace function public.products_search_trigger()
returns trigger language plpgsql as $$
begin
  perform public.refresh_product_search(new.id);
  return null;
end;
$$;

create trigger products_search_refresh after insert or update of name, fabric_type, tags, short_description, description, category_id
  on public.products for each row execute function public.products_search_trigger();

create or replace function public.colours_search_trigger()
returns trigger language plpgsql as $$
begin
  perform public.refresh_product_search(coalesce(new.product_id, old.product_id));
  return null;
end;
$$;

create trigger colours_search_refresh after insert or update or delete
  on public.product_colours for each row execute function public.colours_search_trigger();

-- Curated collections (The Bridal Edit, Wedding Guest, ...)
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  subtitle text,
  description text,
  image_url text,
  is_featured boolean not null default true,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger collections_updated_at before update on public.collections
  for each row execute function public.set_updated_at();

create table public.collection_products (
  collection_id uuid not null references public.collections (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  sort_order int not null default 0,
  primary key (collection_id, product_id)
);

-- ---------------------------------------------------------------------------
-- Carts and wishlists
-- ---------------------------------------------------------------------------
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger carts_updated_at before update on public.carts
  for each row execute function public.set_updated_at();

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  quantity int not null check (quantity > 0 and quantity <= 1000),
  created_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (wishlist_id, product_id)
);

-- ---------------------------------------------------------------------------
-- Shipping
-- ---------------------------------------------------------------------------
create table public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  zone_type text not null default 'domestic' check (zone_type in ('domestic', 'international', 'pickup')),
  countries text[] not null default '{}', -- empty = any country (for international catch-all)
  states text[] not null default '{}',    -- empty = any state in the listed countries
  requires_quote boolean not null default false,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger shipping_zones_updated_at before update on public.shipping_zones
  for each row execute function public.set_updated_at();

create table public.shipping_rates (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.shipping_zones (id) on delete cascade,
  name text not null,
  description text,
  fee numeric(14, 2) not null default 0 check (fee >= 0),
  free_over numeric(14, 2) check (free_over is null or free_over >= 0),
  min_days int check (min_days is null or min_days >= 0),
  max_days int check (max_days is null or max_days >= 0),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index shipping_rates_zone_idx on public.shipping_rates (zone_id);
create trigger shipping_rates_updated_at before update on public.shipping_rates
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Promotions
-- ---------------------------------------------------------------------------
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code) and code ~ '^[A-Z0-9_-]{3,32}$'),
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  value numeric(14, 2) not null check (value > 0),
  min_order_amount numeric(14, 2) not null default 0 check (min_order_amount >= 0),
  max_discount numeric(14, 2) check (max_discount is null or max_discount > 0),
  product_ids uuid[] not null default '{}',
  category_ids uuid[] not null default '{}',
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit int check (usage_limit is null or usage_limit > 0),
  per_customer_limit int check (per_customer_limit is null or per_customer_limit > 0),
  used_count int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discount_type <> 'percentage' or value <= 100)
);
create trigger coupons_updated_at before update on public.coupons
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Asoebi
-- ---------------------------------------------------------------------------
create table public.asoebi_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  tagline text,
  description text,
  included_services text[] not null default '{}',
  price numeric(14, 2) check (price is null or price >= 0),
  price_note text,
  is_quote_based boolean not null default true,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger asoebi_packages_updated_at before update on public.asoebi_packages
  for each row execute function public.set_updated_at();

create table public.asoebi_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  event_type text,
  event_date date,
  order_deadline timestamptz,
  description text,
  guest_instructions text,
  cover_image_url text,
  coordinator_name text,
  coordinator_email text,
  coordinator_phone text,
  expected_guests int check (expected_guests is null or expected_guests >= 0),
  delivery_mode text not null default 'individual' check (delivery_mode in ('individual', 'collective', 'both')),
  collective_delivery_note text,
  is_published boolean not null default false,
  quotation_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger asoebi_events_updated_at before update on public.asoebi_events
  for each row execute function public.set_updated_at();

create table public.asoebi_event_products (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.asoebi_events (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  package_label text, -- e.g. "Ladies' Gele + Lace (5 yards)"
  price_override numeric(14, 2) check (price_override is null or price_override >= 0),
  notes text,
  sort_order int not null default 0,
  unique (event_id, product_id)
);

-- ---------------------------------------------------------------------------
-- Quotations (Asoebi & wholesale)
-- ---------------------------------------------------------------------------
create table public.quotation_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  request_type text not null check (request_type in ('asoebi', 'wholesale')),
  access_token uuid not null unique default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  package_id uuid references public.asoebi_packages (id) on delete set null,
  full_name text not null,
  email text not null,
  phone text not null,
  company_name text,
  event_type text,
  event_date date,
  guest_count int check (guest_count is null or guest_count >= 0),
  preferred_category text,
  preferred_colours text,
  budget text,
  required_quantity text,
  delivery_location text,
  needs_availability_check boolean not null default false,
  details text,
  status text not null default 'new'
    check (status in ('new', 'reviewing', 'quoted', 'accepted', 'declined', 'expired', 'converted')),
  currency text not null default 'NGN',
  subtotal numeric(14, 2) not null default 0,
  discount_amount numeric(14, 2) not null default 0 check (discount_amount >= 0),
  delivery_fee numeric(14, 2) not null default 0 check (delivery_fee >= 0),
  total numeric(14, 2) not null default 0,
  quote_message text,
  valid_until date,
  quoted_at timestamptz,
  responded_at timestamptz,
  order_id uuid,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index quotation_requests_status_idx on public.quotation_requests (status, created_at desc);
create index quotation_requests_email_idx on public.quotation_requests (lower(email));
create trigger quotation_requests_updated_at before update on public.quotation_requests
  for each row execute function public.set_updated_at();

alter table public.asoebi_events
  add constraint asoebi_events_quotation_fk foreign key (quotation_id)
  references public.quotation_requests (id) on delete set null;

create table public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotation_requests (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  description text not null,
  colour text,
  quantity int not null default 1 check (quantity > 0),
  unit_price numeric(14, 2) not null default 0 check (unit_price >= 0),
  line_total numeric(14, 2) generated always as (unit_price * quantity) stored,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index quotation_items_quotation_idx on public.quotation_items (quotation_id);

-- ---------------------------------------------------------------------------
-- Orders and payments
-- ---------------------------------------------------------------------------
create sequence public.order_number_seq start 10001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique
    default ('LBF-' || nextval('public.order_number_seq')::text),
  access_token uuid not null unique default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  phone text not null,
  full_name text not null,
  shipping_address jsonb not null default '{}'::jsonb,
  delivery_instructions text,
  status text not null default 'pending_payment' check (status in (
    'pending_payment', 'payment_confirmed', 'processing', 'preparing_dispatch', 'shipped',
    'out_for_delivery', 'delivered', 'cancelled', 'return_requested', 'refunded')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'failed', 'refunded', 'partially_refunded')),
  currency text not null default 'NGN',
  subtotal numeric(14, 2) not null check (subtotal >= 0),
  discount_total numeric(14, 2) not null default 0 check (discount_total >= 0),
  shipping_total numeric(14, 2) not null default 0 check (shipping_total >= 0),
  total numeric(14, 2) not null check (total >= 0),
  coupon_id uuid references public.coupons (id) on delete set null,
  coupon_code text,
  shipping_rate_id uuid references public.shipping_rates (id) on delete set null,
  shipping_method text,
  shipping_requires_quote boolean not null default false,
  carrier text,
  tracking_number text,
  tracking_url text,
  asoebi_event_id uuid references public.asoebi_events (id) on delete set null,
  quotation_id uuid references public.quotation_requests (id) on delete set null,
  source text not null default 'storefront' check (source in ('storefront', 'asoebi_event', 'quotation', 'admin')),
  stock_deducted boolean not null default false,
  paid_at timestamptz,
  cancelled_at timestamptz,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);
create index orders_email_idx on public.orders (lower(email));
create index orders_created_idx on public.orders (created_at desc);
create index orders_event_idx on public.orders (asoebi_event_id) where asoebi_event_id is not null;
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.quotation_requests
  add constraint quotation_requests_order_fk foreign key (order_id)
  references public.orders (id) on delete set null;

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name text not null,
  product_slug text,
  variant_name text,
  colour text,
  unit_label text not null,
  image_url text,
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  line_total numeric(14, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status text not null,
  note text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history (order_id, created_at);

create table public.return_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'rejected', 'received', 'refunded')),
  admin_response text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index return_requests_order_idx on public.return_requests (order_id);
create trigger return_requests_updated_at before update on public.return_requests
  for each row execute function public.set_updated_at();

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null default 'paystack',
  reference text not null unique,
  amount numeric(14, 2) not null,
  currency text not null default 'NGN',
  status text not null default 'initialized'
    check (status in ('initialized', 'success', 'failed', 'abandoned', 'reversed', 'refunded')),
  channel text,
  card_last4 text,
  card_brand text,
  gateway_response text,
  paid_at timestamptz,
  verified_via text check (verified_via in ('webhook', 'callback', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_order_idx on public.payments (order_id);
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

create table public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'paystack',
  event_key text not null, -- event type + transaction id; unique per provider (idempotency)
  event_type text not null,
  reference text,
  payload jsonb not null,
  status text not null default 'received' check (status in ('received', 'processed', 'ignored', 'failed')),
  error text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, event_key)
);

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons (id) on delete cascade,
  order_id uuid not null unique references public.orders (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  amount numeric(14, 2) not null,
  created_at timestamptz not null default now()
);
create index coupon_redemptions_coupon_idx on public.coupon_redemptions (coupon_id);

create table public.asoebi_guest_orders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.asoebi_events (id) on delete cascade,
  order_id uuid not null unique references public.orders (id) on delete cascade,
  guest_name text not null,
  guest_email text not null,
  guest_phone text not null,
  delivery_preference text not null default 'individual' check (delivery_preference in ('individual', 'collective')),
  created_at timestamptz not null default now()
);
create index asoebi_guest_orders_event_idx on public.asoebi_guest_orders (event_id);

-- ---------------------------------------------------------------------------
-- Customer engagement
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  author_name text not null,
  rating int not null check (rating between 1 and 5),
  title text,
  body text not null,
  is_verified_purchase boolean not null default false,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index reviews_product_idx on public.reviews (product_id, is_approved);
create unique index reviews_one_per_user on public.reviews (product_id, user_id) where user_id is not null;

create table public.sample_requests (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete set null,
  colour text,
  full_name text not null,
  email text not null,
  phone text not null,
  address text not null,
  notes text,
  status text not null default 'new' check (status in ('new', 'contacted', 'sent', 'closed')),
  created_at timestamptz not null default now()
);

create table public.restock_notifications (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete cascade,
  email text not null,
  notified_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index restock_notifications_pending_uniq
  on public.restock_notifications (product_id, coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(email))
  where notified_at is null;

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  created_at timestamptz not null default now()
);

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'subscribed', 'unsubscribed')),
  confirm_token uuid not null default gen_random_uuid(),
  source text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index newsletter_subscribers_email_uniq on public.newsletter_subscribers (lower(email));

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------
create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  excerpt text,
  content text not null default '', -- Markdown
  cover_image_url text,
  category_id uuid references public.blog_categories (id) on delete set null,
  author_name text not null default 'Lobaloba Editorial',
  author_bio text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  reading_minutes int not null default 1,
  seo_title text,
  seo_description text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index blog_posts_status_idx on public.blog_posts (status, published_at desc);
create trigger blog_posts_updated_at before update on public.blog_posts
  for each row execute function public.set_updated_at();

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text not null default 'General',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger faqs_updated_at before update on public.faqs
  for each row execute function public.set_updated_at();

-- Key/value store for editable storefront settings (announcement, hero, contact, social, policies…).
-- Never store secrets here: secrets live in environment variables only.
create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade, -- null = admin/staff notification
  audience text not null default 'customer' check (audience in ('customer', 'admin')),
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_audience_idx on public.notifications (audience, created_at desc);

-- ---------------------------------------------------------------------------
-- Rate limiting (fixed window, used by server actions and route handlers)
-- ---------------------------------------------------------------------------
create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  count int not null
);

create or replace function public.rate_limit_hit(p_key text, p_limit int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_count int;
begin
  insert into public.rate_limits as r (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update set
    count = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.count + 1 end,
    window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning count into v_count;
  return v_count <= p_limit;
end;
$$;

-- ---------------------------------------------------------------------------
-- Payment confirmation: idempotent, atomic. Called by the webhook and the
-- server-side callback verification (service role only).
-- ---------------------------------------------------------------------------
create or replace function public.confirm_order_payment(
  p_reference text,
  p_amount_minor bigint,
  p_currency text,
  p_channel text,
  p_card_last4 text,
  p_card_brand text,
  p_gateway_response text,
  p_paid_at timestamptz,
  p_verified_via text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
  v_item record;
  v_expected_minor bigint;
begin
  select * into v_payment from public.payments where reference = p_reference for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'unknown_reference');
  end if;

  select * into v_order from public.orders where id = v_payment.order_id for update;

  if v_order.payment_status = 'paid' then
    return jsonb_build_object('ok', true, 'already_processed', true, 'order_id', v_order.id);
  end if;

  v_expected_minor := round(v_order.total * 100)::bigint;
  if p_amount_minor <> v_expected_minor or upper(p_currency) <> upper(v_order.currency) then
    update public.payments set status = 'failed', gateway_response = 'Amount or currency mismatch'
      where id = v_payment.id;
    insert into public.notifications (audience, type, title, body, link)
      values ('admin', 'payment_mismatch', 'Payment amount mismatch',
              'Reference ' || p_reference || ' paid ' || p_amount_minor || ' ' || p_currency ||
              ' but order ' || v_order.order_number || ' expects ' || v_expected_minor,
              '/admin/orders/' || v_order.id);
    return jsonb_build_object('ok', false, 'reason', 'amount_mismatch', 'order_id', v_order.id);
  end if;

  update public.payments set
    status = 'success', channel = p_channel, card_last4 = p_card_last4, card_brand = p_card_brand,
    gateway_response = p_gateway_response, paid_at = coalesce(p_paid_at, now()), verified_via = p_verified_via
  where id = v_payment.id;

  update public.orders set
    payment_status = 'paid',
    status = case when status = 'pending_payment' then 'payment_confirmed' else status end,
    paid_at = coalesce(p_paid_at, now())
  where id = v_order.id;

  insert into public.order_status_history (order_id, status, note)
    values (v_order.id, 'payment_confirmed', 'Payment confirmed via ' || p_verified_via);

  -- Deduct stock exactly once.
  if not v_order.stock_deducted then
    for v_item in select variant_id, product_id, quantity from public.order_items where order_id = v_order.id loop
      if v_item.variant_id is not null then
        update public.inventory set quantity = greatest(0, quantity - v_item.quantity)
          where variant_id = v_item.variant_id;
      end if;
      if v_item.product_id is not null then
        update public.products set sales_count = sales_count + v_item.quantity where id = v_item.product_id;
      end if;
    end loop;
    update public.orders set stock_deducted = true where id = v_order.id;
  end if;

  if v_order.coupon_id is not null then
    insert into public.coupon_redemptions (coupon_id, order_id, user_id, email, amount)
      values (v_order.coupon_id, v_order.id, v_order.user_id, v_order.email, v_order.discount_total)
      on conflict (order_id) do nothing;
    if found then
      update public.coupons set used_count = used_count + 1 where id = v_order.coupon_id;
    end if;
  end if;

  if v_order.quotation_id is not null then
    update public.quotation_requests set status = 'converted' where id = v_order.quotation_id;
  end if;

  if v_order.user_id is not null then
    insert into public.notifications (user_id, audience, type, title, body, link)
      values (v_order.user_id, 'customer', 'order_paid', 'Payment received',
              'We have received payment for order ' || v_order.order_number || '.',
              '/account/orders/' || v_order.id);
  end if;
  insert into public.notifications (audience, type, title, body, link)
    values ('admin', 'new_order', 'New paid order ' || v_order.order_number,
            v_order.full_name || ' paid ' || v_order.currency || ' ' || v_order.total,
            '/admin/orders/' || v_order.id);

  return jsonb_build_object('ok', true, 'already_processed', false, 'order_id', v_order.id);
end;
$$;

revoke all on function public.confirm_order_payment(text, bigint, text, text, text, text, text, timestamptz, text) from public, anon, authenticated;
revoke all on function public.rate_limit_hit(text, int, int) from public, anon, authenticated;
revoke all on function public.refresh_product_search(uuid) from public, anon, authenticated;

-- Dashboard aggregates (admin only, enforced inside).
create or replace function public.admin_sales_summary(p_from timestamptz, p_to timestamptz)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v jsonb;
begin
  if not public.is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'forbidden';
  end if;
  select jsonb_build_object(
    'revenue', coalesce(sum(total) filter (where payment_status = 'paid'), 0),
    'orders', count(*) filter (where payment_status = 'paid'),
    'pending', count(*) filter (where status in ('payment_confirmed', 'processing', 'preparing_dispatch')),
    'completed', count(*) filter (where status = 'delivered'),
    'awaiting_payment', count(*) filter (where status = 'pending_payment')
  ) into v
  from public.orders where created_at >= p_from and created_at < p_to;
  return v;
end;
$$;

create or replace function public.admin_revenue_series(p_from timestamptz, p_to timestamptz, p_bucket text)
returns table (bucket timestamptz, revenue numeric, orders bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'forbidden';
  end if;
  if p_bucket not in ('hour', 'day', 'week', 'month') then
    raise exception 'invalid bucket';
  end if;
  return query
    select date_trunc(p_bucket, o.paid_at) as bucket, sum(o.total), count(*)
    from public.orders o
    where o.payment_status = 'paid' and o.paid_at >= p_from and o.paid_at < p_to
    group by 1 order by 1;
end;
$$;
