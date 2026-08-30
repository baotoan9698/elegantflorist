-- Run once in your Supabase SQL editor. No service-role key belongs in the browser.
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admin_users enable row level security;
create policy "Read own admin membership" on public.admin_users for select to authenticated using (user_id = (select auth.uid()));
grant select on public.admin_users to authenticated;
revoke insert, update, delete on public.admin_users from anon, authenticated;

create function public.is_flower_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_users where user_id = (select auth.uid()));
$$;
revoke all on function public.is_flower_admin() from public;
grant execute on function public.is_flower_admin() to anon, authenticated;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) > 0),
  category text not null default 'Hoa Mix',
  categories text[] not null default '{}',
  price_vnd bigint not null default 0 check (price_vnd >= 0),
  origin text not null default '',
  tagline text not null default '',
  description text not null default '',
  tags text[] not null default '{}',
  images text[] not null default '{}',
  light text not null default '',
  water text not null default '',
  rarity text not null default '',
  published boolean not null default false,
  featured boolean not null default true,
  created_at timestamptz not null default now(),
  check (not published or cardinality(images) > 0)
);
alter table public.products enable row level security;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
create policy "Public sees published products" on public.products for select to anon, authenticated using (published or public.is_flower_admin());
create policy "Admins create products" on public.products for insert to authenticated with check (public.is_flower_admin());
create policy "Admins update products" on public.products for update to authenticated using (public.is_flower_admin()) with check (public.is_flower_admin());
create policy "Admins delete products" on public.products for delete to authenticated using (public.is_flower_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('flower-images', 'flower-images', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "Admins read image objects" on storage.objects for select to authenticated using (bucket_id = 'flower-images' and public.is_flower_admin());
create policy "Admins upload images" on storage.objects for insert to authenticated with check (bucket_id = 'flower-images' and public.is_flower_admin());
create policy "Admins remove images" on storage.objects for delete to authenticated using (bucket_id = 'flower-images' and public.is_flower_admin());

-- After creating your account in Authentication > Users, run separately:
-- insert into public.admin_users(user_id) values ('YOUR-AUTH-USER-UUID');
