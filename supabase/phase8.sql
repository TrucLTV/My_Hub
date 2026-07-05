-- Phase 8: thay "Ghi chu" (notes) bang "Mini game" (mini_games)
-- Chay trong Supabase Dashboard > SQL Editor
-- Da xac nhan: khong co ghi chu that nao can giu lai truoc khi xoa bang notes.

-- ==== 1) Xoa sach bang notes va moi thu lien quan ====

drop function if exists get_locked_note_content(uuid, text);
drop view if exists notes_public_view;
drop table if exists notes;

-- ==== 2) Bang mini_games ====

create table mini_games (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null,        -- random_picker | quiz | team_competition | timer | other
  delivery_type text not null,   -- web_tool | downloadable | external_link
  tool_key text,
  file_url text,
  file_type text,
  external_url text,
  tags text[],
  is_public boolean default false,
  is_locked boolean default false,
  sort_order int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table mini_games add column search_vector tsvector
  generated always as (to_tsvector('vietnamese', coalesce(title, '') || ' ' || coalesce(description, ''))) stored;
create index mini_games_search_idx on mini_games using gin (search_vector);

alter table mini_games enable row level security;

create policy "admin_full_access" on mini_games
  for all using (auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74')
  with check (auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74');

create policy "public_or_locked_read" on mini_games
  for select using (is_public = true or is_locked = true);

-- ==== 3) View public: an payload neu is_locked, loai bo hang an hoan toan ====

create view mini_games_public_view with (security_invoker = true) as
  select id, title, description, category, delivery_type, tags, is_public, is_locked,
    sort_order, created_at, updated_at, search_vector,
    case when is_locked then null else tool_key end as tool_key,
    case when is_locked then null else file_url end as file_url,
    case when is_locked then null else file_type end as file_type,
    case when is_locked then null else external_url end as external_url
  from mini_games
  where is_public = true or is_locked = true;

grant select on mini_games_public_view to anon, authenticated;

-- ==== 4) RPC: xac minh mat khau + tra ve payload that su ====

create or replace function get_locked_mini_game_payload(p_id uuid, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row mini_games;
begin
  if not verify_download_password(p_password) then
    return null;
  end if;
  select * into v_row from mini_games where id = p_id and is_locked = true;
  if not found then
    return null;
  end if;
  return jsonb_build_object(
    'tool_key', v_row.tool_key,
    'file_url', v_row.file_url,
    'file_type', v_row.file_type,
    'external_url', v_row.external_url
  );
end;
$$;

grant execute on function get_locked_mini_game_payload(uuid, text) to anon, authenticated;

-- ==== 5) Storage bucket cho file tai ve ====

insert into storage.buckets (id, name, public)
values ('mini_games', 'mini_games', false)
on conflict (id) do nothing;

create policy "mini_games_admin_full_access" on storage.objects
  for all using (bucket_id = 'mini_games' and auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74')
  with check (bucket_id = 'mini_games' and auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74');

create policy "mini_games_public_read" on storage.objects
  for select using (
    bucket_id = 'mini_games'
    and exists (
      select 1 from public.mini_games g
      where g.file_url = storage.objects.name
      and g.is_public = true
    )
  );

create policy "mini_games_locked_read" on storage.objects
  for select using (
    bucket_id = 'mini_games'
    and exists (
      select 1 from public.mini_games g
      where g.file_url = storage.objects.name
      and g.is_locked = true
    )
  );
