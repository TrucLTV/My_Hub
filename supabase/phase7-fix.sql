-- Fix: pgcrypto cai vao schema "extensions" tren Supabase, can them vao search_path
-- Chay trong Supabase Dashboard > SQL Editor (sau phase7.sql)

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
