-- Run after categories.sql. No existing data is deleted by this setup script.
begin;
create or replace function public.delete_flower_category(category_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare category_name text;
begin
  if not coalesce(public.is_flower_admin(), false) then
    raise exception 'Chỉ admin mới được xóa danh mục.' using errcode = '42501';
  end if;
  -- Serialize against product saves while checking every product, including drafts.
  lock table public.products in share row exclusive mode;
  select name into category_name from public.categories where id = category_id for update;
  if not found then
    raise exception 'Danh mục không còn tồn tại. Hãy tải lại danh mục.';
  end if;
  if exists (
    select 1 from public.products p
    where p.category = category_name
      or coalesce(to_jsonb(p)->'categories', '[]'::jsonb) ? category_name
  ) then
    raise exception 'Danh mục đang được sản phẩm sử dụng. Hãy đổi danh mục của các sản phẩm và lưu trước khi xóa.';
  end if;
  delete from public.categories where id = category_id;
end;
$$;
revoke all on function public.delete_flower_category(uuid) from public, anon;
grant execute on function public.delete_flower_category(uuid) to authenticated;
commit;
