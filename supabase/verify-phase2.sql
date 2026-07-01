-- Kiem tra Phase 2 da tao du chua (chi doc, khong tao gi)

select table_name from information_schema.tables
where table_schema = 'public' and table_name in ('media_tracker', 'documents');

select tablename, policyname from pg_policies
where tablename in ('media_tracker', 'documents');

select id, name, public from storage.buckets
where id in ('covers', 'documents');

select policyname from pg_policies
where tablename = 'objects' and schemaname = 'storage'
and policyname like '%covers%' or policyname like '%documents%';
