-- Private file storage. Apply only after reviewing Supabase Storage and user authorization.
-- Storage SQL schema is supplied by Supabase, not portable raw PostgreSQL.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('private-health','private-health',false,20971520,array['application/pdf','application/zip','text/csv','application/octet-stream'])
on conflict (id) do update set public = false;
-- No direct client policies are provided: all access defaults to denied.
-- In Sprint 6.3, implement authenticated signed upload/download with user-folder checks.
