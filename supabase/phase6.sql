-- Phase 6: full-text search tieng Viet khong dau + go thieu chu
-- Chay trong Supabase Dashboard > SQL Editor

create extension if not exists unaccent;

create text search configuration vietnamese (copy = simple);
alter text search configuration vietnamese
  alter mapping for hword, hword_part, word
  with unaccent, simple;

-- notes
alter table notes drop column search_vector;
alter table notes add column search_vector tsvector
  generated always as (to_tsvector('vietnamese', coalesce(title, '') || ' ' || coalesce(content, ''))) stored;
create index notes_search_idx on notes using gin (search_vector);

-- resources
alter table resources drop column search_vector;
alter table resources add column search_vector tsvector
  generated always as (to_tsvector('vietnamese', coalesce(title, '') || ' ' || coalesce(description, ''))) stored;
create index resources_search_idx on resources using gin (search_vector);

-- media_tracker
alter table media_tracker drop column search_vector;
alter table media_tracker add column search_vector tsvector
  generated always as (to_tsvector('vietnamese', coalesce(title, '') || ' ' || coalesce(review, ''))) stored;
create index media_tracker_search_idx on media_tracker using gin (search_vector);

-- documents
alter table documents drop column search_vector;
alter table documents add column search_vector tsvector
  generated always as (
    to_tsvector('vietnamese', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(subject, ''))
  ) stored;
create index documents_search_idx on documents using gin (search_vector);
