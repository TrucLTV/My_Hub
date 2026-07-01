-- Phase 2: bang media_tracker va documents + storage buckets
-- Chay toan bo file nay trong Supabase Dashboard > SQL Editor (sau khi da chay phase1.sql)

create table media_tracker (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text,
  status text,
  rating numeric,
  review text,
  progress text,
  cover_url text,
  genre text[],
  is_public boolean default false,
  started_at date,
  finished_at date,
  created_at timestamptz default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  subject text,
  grade_level text,
  file_url text,
  file_type text,
  tags text[],
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table media_tracker enable row level security;
alter table documents enable row level security;

create policy "public_read" on media_tracker
  for select using (is_public = true);

create policy "admin_full_access" on media_tracker
  for all using (auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74')
  with check (auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74');

create policy "public_read" on documents
  for select using (is_public = true);

create policy "admin_full_access" on documents
  for all using (auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74')
  with check (auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74');

-- Storage buckets
-- covers: public (anh cover phim/game, khong nhay cam)
-- documents: private (file giao an/giao trinh), doc qua signed URL, RLS quyet dinh ai duoc sign

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- covers: ai cung doc duoc (bucket public), chi admin duoc ghi/sua/xoa
create policy "covers_public_read" on storage.objects
  for select using (bucket_id = 'covers');

create policy "covers_admin_write" on storage.objects
  for insert with check (bucket_id = 'covers' and auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74');

create policy "covers_admin_update" on storage.objects
  for update using (bucket_id = 'covers' and auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74');

create policy "covers_admin_delete" on storage.objects
  for delete using (bucket_id = 'covers' and auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74');

-- documents: admin luon truy cap toan bo; nguoi ngoai chi doc duoc file
-- neu dong tuong ung trong bang documents co is_public = true
create policy "documents_admin_full_access" on storage.objects
  for all using (bucket_id = 'documents' and auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74')
  with check (bucket_id = 'documents' and auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74');

create policy "documents_public_read" on storage.objects
  for select using (
    bucket_id = 'documents'
    and exists (
      select 1 from public.documents d
      where d.file_url = storage.objects.name
      and d.is_public = true
    )
  );
