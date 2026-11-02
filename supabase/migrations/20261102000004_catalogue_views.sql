-- Read-optimised catalogue view and search used by the storefront.
-- security_invoker = true so the caller's RLS policies apply.

create or replace view public.product_listing with (security_invoker = true) as
select
  p.id,
  p.name,
  p.slug,
  p.price,
  p.compare_at_price,
  p.currency,
  p.purchase_unit,
  p.unit_label,
  p.fabric_type,
  p.short_description,
  p.status,
  p.is_featured,
  p.is_new_arrival,
  p.is_bestseller,
  p.sales_count,
  p.low_stock_threshold,
  p.is_demo,
  p.created_at,
  p.category_id,
  c.name as category_name,
  c.slug as category_slug,
  coalesce((
    select sum(i.quantity)::int from public.product_variants v
    join public.inventory i on i.variant_id = v.id
    where v.product_id = p.id and v.is_active
  ), 0) as total_stock,
  coalesce((
    select array_agg(pc.name order by pc.sort_order) from public.product_colours pc where pc.product_id = p.id
  ), '{}') as colour_names,
  coalesce((
    select jsonb_agg(jsonb_build_object('name', pc.name, 'hex', pc.hex) order by pc.sort_order)
    from public.product_colours pc where pc.product_id = p.id
  ), '[]'::jsonb) as colours,
  coalesce((
    select jsonb_agg(jsonb_build_object('url', pi.url, 'alt', coalesce(pi.alt, p.name)) order by pi.sort_order)
    from (select * from public.product_images x where x.product_id = p.id order by x.sort_order limit 2) pi
  ), '[]'::jsonb) as images,
  coalesce((select avg(r.rating)::numeric(3, 2) from public.reviews r where r.product_id = p.id and r.is_approved), 0) as rating,
  (select count(*)::int from public.reviews r where r.product_id = p.id and r.is_approved) as review_count
from public.products p
left join public.categories c on c.id = p.category_id;

grant select on public.product_listing to anon, authenticated;

-- Ranked product search: full text (prefix-aware) plus trigram similarity on
-- the name for typo tolerance. Returns active products only (RLS applies).
create or replace function public.search_products(p_query text, p_limit int default 50)
returns table (id uuid, rank real)
language sql stable security invoker set search_path = public as $$
  with q as (
    select
      trim(p_query) as raw,
      nullif(
        array_to_string(
          array(
            select regexp_replace(t, '[^[:alnum:]]', '', 'g') || ':*'
            from unnest(regexp_split_to_array(lower(trim(p_query)), '\s+')) t
            where regexp_replace(t, '[^[:alnum:]]', '', 'g') <> ''
          ), ' & '),
        '') as tsq
  )
  select p.id,
         (coalesce(ts_rank(p.search_vector, to_tsquery('simple', q.tsq)), 0) + similarity(p.name, q.raw))::real as rank
  from public.products p, q
  where p.status = 'active'
    and q.raw <> ''
    and (
      (q.tsq is not null and p.search_vector @@ to_tsquery('simple', q.tsq))
      or similarity(p.name, q.raw) > 0.25
      or p.name ilike '%' || q.raw || '%'
    )
  order by rank desc
  limit greatest(1, least(p_limit, 200));
$$;

grant execute on function public.search_products(text, int) to anon, authenticated;
