-- Migration: 0005_create_storage_policies.sql
-- Description: Create private speaking-recordings storage bucket and RLS policies

-- Create private bucket if not exists
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'speaking-recordings',
  'speaking-recordings',
  false,
  52428800, -- 50 MB limit
  array['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-m4a']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = array['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-m4a'];

-- -- Enable RLS on storage.objects (Supabase enables this by default, but verify)
-- alter table storage.objects enable row level security;

-- Storage policies:
-- Objects are organized by {user_id}/{challenge_id}/{day_number}/{submission_id}.ext
-- The first folder segment must match auth.uid()::text

create policy "Users can read own speaking recordings"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'speaking-recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can upload own speaking recordings"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'speaking-recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own speaking recordings"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'speaking-recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'speaking-recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own speaking recordings"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'speaking-recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
