-- Official contact address.
update public.site_settings set value = value || jsonb_build_object('email', 'contact@lobalobadeluxe.com') where key = 'business';
update public.site_settings set value = value || jsonb_build_object('reply_to', 'contact@lobalobadeluxe.com') where key = 'email';
