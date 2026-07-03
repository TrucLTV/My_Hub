-- Phase 7: 3-cap hien thi (Cong khai / Khoa tai / An hoan toan) + mat khau tai xuong chung cho site
-- Chay trong Supabase Dashboard > SQL Editor

create extension if not exists pgcrypto;

-- 1 hang duy nhat luu hash mat khau tai xuong dung chung cho toan site
create table site_settings (
  id int primary key default 1,
  download_password_hash text,
  constraint single_row check (id = 1)
);
insert into site_settings (id, download_password_hash) values (1, null);
alter table site_settings enable row level security;
create policy "admin_manage_settings" on site_settings
  for all using (auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74')
  with check (auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74');

-- them cot is_locked cho ca 4 bang
alter table notes add column is_locked boolean default false;
alter table resources add column is_locked boolean default false;
alter table media_tracker add column is_locked boolean default false;
alter table documents add column is_locked boolean default false;

-- ==== VIEWS: dung cho trang public, an payload neu is_locked, loai bo hang an hoan toan ====

create view notes_public_view with (security_invoker = true) as
  select id, title, tags, is_public, is_locked, created_at, search_vector,
    case when is_locked then null else content end as content
  from notes
  where is_public = true or is_locked = true;

create view resources_public_view with (security_invoker = true) as
  select id, title, description, category, tags, is_public, is_locked, created_at, search_vector,
    case when is_locked then null else url end as url
  from resources
  where is_public = true or is_locked = true;

create view media_public_view with (security_invoker = true) as
  select id, title, type, status, rating, progress, cover_url, genre, is_public, is_locked,
    started_at, finished_at, created_at, search_vector,
    case when is_locked then null else review end as review
  from media_tracker
  where is_public = true or is_locked = true;

create view documents_public_view with (security_invoker = true) as
  select id, title, description, category, subject, grade_level, material_type, tags,
    is_public, is_locked, sort_order, created_at, updated_at, search_vector, file_type,
    case when is_locked then null else file_url end as file_url
  from documents
  where is_public = true or is_locked = true;

-- security_invoker=true lam view chay theo quyen cua nguoi goi (anon), nen can thay
-- policy "public_read" cu (chi is_public) bang dieu kien rong hon is_public/is_locked
drop policy "public_read" on notes;
create policy "public_or_locked_read" on notes
  for select using (is_public = true or is_locked = true);

drop policy "public_read" on resources;
create policy "public_or_locked_read" on resources
  for select using (is_public = true or is_locked = true);

drop policy "public_read" on media_tracker;
create policy "public_or_locked_read" on media_tracker
  for select using (is_public = true or is_locked = true);

drop policy "public_read" on documents;
create policy "public_or_locked_read" on documents
  for select using (is_public = true or is_locked = true);

grant select on notes_public_view to anon, authenticated;
grant select on resources_public_view to anon, authenticated;
grant select on media_public_view to anon, authenticated;
grant select on documents_public_view to anon, authenticated;

-- ==== RPC: xac minh mat khau + tra ve payload that su (bo qua RLS vi la security definer) ====

create or replace function verify_download_password(p_password text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
begin
  select download_password_hash into v_hash from site_settings where id = 1;
  if v_hash is null then
    return false;
  end if;
  return crypt(p_password, v_hash) = v_hash;
end;
$$;

create or replace function get_locked_note_content(p_id uuid, p_password text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_content text;
begin
  if not verify_download_password(p_password) then
    return null;
  end if;
  select content into v_content from notes where id = p_id and is_locked = true;
  return v_content;
end;
$$;

create or replace function get_locked_resource_url(p_id uuid, p_password text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
begin
  if not verify_download_password(p_password) then
    return null;
  end if;
  select url into v_url from resources where id = p_id and is_locked = true;
  return v_url;
end;
$$;

create or replace function get_locked_media_review(p_id uuid, p_password text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_review text;
begin
  if not verify_download_password(p_password) then
    return null;
  end if;
  select review into v_review from media_tracker where id = p_id and is_locked = true;
  return v_review;
end;
$$;

create or replace function get_locked_document_path(p_id uuid, p_password text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_path text;
begin
  if not verify_download_password(p_password) then
    return null;
  end if;
  select file_url into v_path from documents where id = p_id and is_locked = true;
  return v_path;
end;
$$;

create or replace function set_download_password(p_new_password text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() != 'f247e9f1-5c1b-4284-b069-c279f0bb1d74' then
    raise exception 'not authorized';
  end if;
  update site_settings set download_password_hash = crypt(p_new_password, gen_salt('bf')) where id = 1;
end;
$$;

grant execute on function set_download_password(text) to authenticated;
grant execute on function verify_download_password(text) to anon, authenticated;
grant execute on function get_locked_note_content(uuid, text) to anon, authenticated;
grant execute on function get_locked_resource_url(uuid, text) to anon, authenticated;
grant execute on function get_locked_media_review(uuid, text) to anon, authenticated;
grant execute on function get_locked_document_path(uuid, text) to anon, authenticated;

-- storage: cho phep tai file cua tai lieu "khoa" (da qua RPC xac minh o buoc truoc)
create policy "documents_locked_read" on storage.objects
  for select using (
    bucket_id = 'documents'
    and exists (
      select 1 from public.documents d
      where d.file_url = storage.objects.name
      and d.is_locked = true
    )
  );
