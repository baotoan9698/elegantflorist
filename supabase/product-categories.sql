-- Run once in Supabase SQL Editor. Safe to repeat; existing selections are preserved.
begin;
alter table public.products add column if not exists categories text[] not null default '{}';
update public.products set categories=array[category]
where cardinality(categories)=0 and length(btrim(category))>0;
-- Keep the legacy category column for older deployments; the app saves its first selection there.
commit;
