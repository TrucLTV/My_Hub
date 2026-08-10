-- Phase 10: Bucket cong khai "resource_files" cho file dinh kem trong bang
-- "resources" (vd: file trac nghiem xuat tu tool Tao Trac Nghiem Tuong Tac).
-- Khac voi bucket "documents"/"mini_games" (rieng tu, doc qua RLS + kiem tra
-- is_public/is_locked tren bang) — bucket nay cong khai hoan toan giong
-- "covers", vi cot resources.url can la 1 URL dung duoc thang, khong qua
-- buoc ky lai moi lan xem (ResourcesPublic.jsx dung thang resource.url).
--
-- Bucket "resource_files" (public=true) da duoc tao san qua script rieng —
-- chi con thieu cac RLS policy ben duoi, chay 1 lan trong SQL Editor.

create policy "resource_files_public_read" on storage.objects
  for select using (bucket_id = 'resource_files');

create policy "resource_files_admin_write" on storage.objects
  for insert with check (bucket_id = 'resource_files' and auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74');

create policy "resource_files_admin_update" on storage.objects
  for update using (bucket_id = 'resource_files' and auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74');

create policy "resource_files_admin_delete" on storage.objects
  for delete using (bucket_id = 'resource_files' and auth.uid() = 'f247e9f1-5c1b-4284-b069-c279f0bb1d74');
