-- Phase 1 MVP: bang notes va resources
-- Chay toan bo file nay trong Supabase Dashboard > SQL Editor

create table notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  tags text[],
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  description text,
  category text,
  tags text[],
  is_public boolean default false,
  created_at timestamptz default now()
);

alter table notes enable row level security;
alter table resources enable row level security;

-- Thay 'ADMIN_UID' bang User UID lay tu Authentication > Users truoc khi chay
create policy "public_read" on notes
  for select using (is_public = true);

create policy "admin_full_access" on notes
  for all using (auth.uid() = 'ADMIN_UID')
  with check (auth.uid() = 'ADMIN_UID');

create policy "public_read" on resources
  for select using (is_public = true);

create policy "admin_full_access" on resources
  for all using (auth.uid() = 'ADMIN_UID')
  with check (auth.uid() = 'ADMIN_UID');
