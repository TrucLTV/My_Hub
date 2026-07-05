-- Phase 9: bang danh sach lop (student_rosters) cho cong cu "Goi ten ngau nhien"
-- Chay trong Supabase Dashboard > SQL Editor

create table student_rosters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  students text[] not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table student_rosters enable row level security;

-- Ai cung xem duoc danh sach (can de quay tren trang public khi len lop),
-- nhung chi admin moi them/sua/xoa duoc.
create policy "public_read" on student_rosters
  for select using (true);

create policy "admin_insert" on student_rosters
  for insert with check (auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74');

create policy "admin_update" on student_rosters
  for update using (auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74')
  with check (auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74');

create policy "admin_delete" on student_rosters
  for delete using (auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74');
