
drop policy "anyone can insert orders" on public.orders;

create policy "public can submit valid orders"
  on public.orders for insert
  to anon, authenticated
  with check (
    length(trim(name)) between 1 and 200
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    and length(email) <= 320
    and length(file_path) between 1 and 500
    and file_size_bytes between 1 and 104857600
  );

drop policy "anyone can upload models" on storage.objects;

create policy "public can upload to models bucket"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'models'
    and (storage.foldername(name))[1] = 'uploads'
  );
