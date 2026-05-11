
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  name text not null,
  phone text,
  address text,
  note text,
  file_path text not null,
  file_name text not null,
  file_format text not null,
  file_size_bytes bigint not null,
  bbox_mm jsonb,
  volume_cm3 numeric,
  scale text,
  color text,
  quality text,
  estimated_price_czk numeric,
  final_price_czk numeric,
  status text not null default 'new'
);

alter table public.orders enable row level security;

create policy "anyone can insert orders"
  on public.orders for insert
  to anon, authenticated
  with check (true);

-- no select/update/delete policies → only service role can read/modify

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('models', 'models', false, 104857600, null)
on conflict (id) do nothing;

create policy "anyone can upload models"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'models');
