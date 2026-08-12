-- Phase 12: trang "Giai tri" moi - 4 muc noi dung (Song & Suy Ngam, Cau Chuyen
-- Cam Hung, Goc Nhin Da Chieu, Tram Thu Gian), moi muc co Bai viet (markdown)
-- va Video & Hinh anh (upload hoac link ngoai). Thay the media_tracker (khong
-- xoa bang cu, chi khong con dung o giao dien).
-- Chay trong Supabase Dashboard > SQL Editor (sau khi da chay phase1-phase11).

create table entertainment_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,        -- 'song_ngam' | 'cau_chuyen_cam_hung' | 'goc_nhin_da_chieu' | 'tram_thu_gian'
  content_type text not null,    -- 'article' | 'media'
  title text not null,
  description text,
  body text,                     -- markdown, dung khi content_type='article'
  media_kind text,               -- 'image' | 'video' | 'link', dung khi content_type='media'
  media_url text,                -- file trong bucket entertainment_media hoac URL ngoai
  cover_url text,                -- anh thumbnail (tuy chon)
  tags text[],
  is_public boolean default false,
  is_locked boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  search_vector tsvector generated always as
    (to_tsvector('vietnamese', coalesce(title, '') || ' ' || coalesce(description, ''))) stored
);
create index entertainment_items_search_idx on entertainment_items using gin (search_vector);
create index entertainment_items_category_idx on entertainment_items (category, content_type);

alter table entertainment_items enable row level security;

create policy "public_or_locked_read" on entertainment_items
  for select using (is_public = true or is_locked = true);

create policy "admin_full_access" on entertainment_items
  for all using (auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74')
  with check (auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74');

create view entertainment_public_view with (security_invoker = true) as
  select id, category, content_type, title, description, media_kind, cover_url, tags,
    is_public, is_locked, created_at, search_vector,
    case when is_locked then null else body end as body,
    case when is_locked then null else media_url end as media_url
  from entertainment_items
  where is_public = true or is_locked = true;

grant select on entertainment_public_view to anon, authenticated;

-- RPC mo khoa: tra ve body + media_url that su sau khi xac minh mat khau tai
-- xuong chung (verify_download_password da tao o phase7.sql)
create or replace function get_locked_entertainment_content(p_id uuid, p_password text)
returns table(body text, media_url text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not verify_download_password(p_password) then
    return;
  end if;
  return query
    select e.body, e.media_url from entertainment_items e
    where e.id = p_id and e.is_locked = true;
end;
$$;

grant execute on function get_locked_entertainment_content(uuid, text) to anon, authenticated;

-- Storage bucket cho anh/video Video & Hinh anh - public giong "covers" vi lop
-- is_locked/is_public da chan o cap DB row (media_url tra ve null khi khoa).
insert into storage.buckets (id, name, public)
values ('entertainment_media', 'entertainment_media', true)
on conflict (id) do nothing;

create policy "entertainment_media_public_read" on storage.objects
  for select using (bucket_id = 'entertainment_media');

create policy "entertainment_media_admin_write" on storage.objects
  for insert with check (bucket_id = 'entertainment_media' and auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74');

create policy "entertainment_media_admin_update" on storage.objects
  for update using (bucket_id = 'entertainment_media' and auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74');

create policy "entertainment_media_admin_delete" on storage.objects
  for delete using (bucket_id = 'entertainment_media' and auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74');
