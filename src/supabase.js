import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = url && key ? createClient(url, key) : null;
export const slugify = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export function productView(row) {
  return {...row, image:row.images[0], price:new Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND'}).format(row.price_vnd), quote:row.description, match:98, tone:'#91bddd'};
}
