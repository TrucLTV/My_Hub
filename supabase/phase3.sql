-- Phase 3: full-text search (tsvector + GIN index) cho 4 bang
-- Chay toan bo file nay trong Supabase Dashboard > SQL Editor (sau khi da chay phase1.sql va phase2.sql)

alter table notes add column search_vector tsvector
  generated always as (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, ''))) stored;
create index notes_search_idx on notes using gin (search_vector);

alter table resources add column search_vector tsvector
  generated always as (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))) stored;
create index resources_search_idx on resources using gin (search_vector);

alter table media_tracker add column search_vector tsvector
  generated always as (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(review, ''))) stored;
create index media_tracker_search_idx on media_tracker using gin (search_vector);

alter table documents add column search_vector tsvector
  generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(subject, ''))
  ) stored;
create index documents_search_idx on documents using gin (search_vector);
