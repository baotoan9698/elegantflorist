-- Run in SQL Editor AFTER schema.sql. Safe to run again.
begin;
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now()
);
create unique index if not exists categories_name_normalized
on public.categories (lower(regexp_replace(btrim(name), '\s+', ' ', 'g')));
alter table public.categories enable row level security;
grant select on public.categories to anon, authenticated;
grant insert on public.categories to authenticated;
revoke update, delete on public.categories from anon, authenticated;
drop policy if exists "Read flower categories" on public.categories;
create policy "Read flower categories" on public.categories for select to anon, authenticated using (true);
drop policy if exists "Admins create flower categories" on public.categories;
create policy "Admins create flower categories" on public.categories for insert to authenticated with check (public.is_flower_admin());

-- Preserve product values; copy their existing categories without modifying any product.
insert into public.categories(name)
select distinct btrim(category) from public.products
where length(btrim(category)) between 1 and 80
on conflict do nothing;
insert into public.categories(name) values
('Hoa Hồng'), ('Hoa Mix'), ('Hoa Lan'), ('Hoa Cưới'), ('Hoa Chúc Mừng')
on conflict do nothing;
commit;
