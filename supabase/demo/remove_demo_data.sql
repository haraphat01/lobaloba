-- Removes all demo products and demo journal articles created by
-- scripts/generate-demo.mjs (rows flagged is_demo = true).
-- Orders keep their line-item snapshots (product name, price) because
-- order_items.product_id is ON DELETE SET NULL.
begin;
delete from public.products where is_demo;
delete from public.blog_posts where is_demo;
update public.categories set image_url = null where image_url like '/demo/%' or image_url like '%/media/demo-photos/%';
update public.collections set image_url = null where image_url like '/demo/%' or image_url like '%/media/demo-photos/%';
update public.site_settings set value = jsonb_set(value, '{image_url}', '""'::jsonb)
  where key = 'hero' and (value->>'image_url' like '/demo/%' or value->>'image_url' like '%/media/demo-photos/%');
-- Stock photos in Storage (media/demo-photos/) can then be deleted from the Supabase dashboard.
commit;
