-- Phase 11: Ngan hang cau hoi - phan loai theo Mon/Khoi/Chu de/Bai + Dang cau/Muc do
-- Chay trong Supabase Dashboard > SQL Editor

alter table resources add column subject text;
alter table resources add column grade_level text;
alter table resources add column topic text;
alter table resources add column lesson text;
alter table resources add column question_types text[];
alter table resources add column difficulty_levels text[];

create index resources_subject_grade_idx on resources (subject, grade_level);
create index resources_question_types_idx on resources using gin (question_types);
create index resources_difficulty_levels_idx on resources using gin (difficulty_levels);

-- them cot moi vao cuoi danh sach cot cua view (khong doi thu tu cot cu)
drop view resources_public_view;
create view resources_public_view with (security_invoker = true) as
  select id, title, description, category, tags, is_public, is_locked, created_at, search_vector,
    case when is_locked then null else url end as url,
    subject, grade_level, topic, lesson, question_types, difficulty_levels
  from resources
  where is_public = true or is_locked = true;

grant select on resources_public_view to anon, authenticated;
