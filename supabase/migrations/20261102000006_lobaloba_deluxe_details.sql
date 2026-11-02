-- Brand rename to Lobaloba Deluxe and real store contact details.
-- Merges into existing settings so other admin-edited values are kept.
update public.site_settings set value = value || jsonb_build_object(
  'name', 'Lobaloba Deluxe',
  'email', 'contact@lobalobadeluxe.com',
  'phone', '+234 812 289 8601, +234 816 566 8362',
  'whatsapp', '2348122898601',
  'address', '117 Woro Elewa Street, off Agoro Street, Idumota, Lagos Island, Lagos')
where key = 'business';

update public.site_settings set value = value || jsonb_build_object(
  'instagram', 'https://www.instagram.com/lobalobadeluxe',
  'tiktok', 'https://www.tiktok.com/@lobalobadeluxe')
where key = 'social';

update public.site_settings set value = value || jsonb_build_object('from_name', 'Lobaloba Deluxe', 'reply_to', 'contact@lobalobadeluxe.com')
where key = 'email';

-- Replace the old brand name inside editable text settings (announcement, policies, homepage copy).
update public.site_settings set value = replace(value::text, 'Lobaloba Fabrics', 'Lobaloba Deluxe')::jsonb
where value::text like '%Lobaloba Fabrics%';

update public.faqs set question = replace(question, 'Lobaloba Fabrics', 'Lobaloba Deluxe'), answer = replace(answer, 'Lobaloba Fabrics', 'Lobaloba Deluxe')
where question like '%Lobaloba Fabrics%' or answer like '%Lobaloba Fabrics%';

update public.blog_posts set
  author_bio = replace(author_bio, 'Lobaloba Fabrics', 'Lobaloba Deluxe'),
  content = replace(content, 'Lobaloba Fabrics', 'Lobaloba Deluxe')
where author_bio like '%Lobaloba Fabrics%' or content like '%Lobaloba Fabrics%';
