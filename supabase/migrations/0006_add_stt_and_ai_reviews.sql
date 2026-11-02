-- Migration: 0006_add_stt_and_ai_reviews.sql
-- Description: Add Speech-to-Text columns to activity_submissions and create ai_reviews table with RLS

-- 1. Extend activity_submissions for Speech-to-Text persistence
alter table public.activity_submissions
  add column if not exists original_transcript text,
  add column if not exists edited_transcript text,
  add column if not exists transcription_status text not null default 'none'
    check (transcription_status in ('none', 'processing', 'completed', 'edited', 'failed')),
  add column if not exists transcription_provider text,
  add column if not exists transcription_model text,
  add column if not exists transcribed_at timestamptz,
  add column if not exists transcript_word_timestamps jsonb,
  add column if not exists transcription_error text;

-- 2. Create ai_reviews table (one active review per submission via unique constraint)
create table if not exists public.ai_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  submission_id uuid not null references public.activity_submissions(id) on delete cascade,
  review_type text not null check (review_type in ('speaking', 'writing')),
  model_name text not null,
  review_version integer not null default 1 check (review_version > 0),
  overall_feedback text not null,
  scores jsonb not null,
  strengths jsonb not null default '[]'::jsonb,
  improvements jsonb not null default '[]'::jsonb,
  corrections jsonb not null default '[]'::jsonb,
  recommended_practice jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_reviews_submission_unique unique (submission_id)
);

create index if not exists ai_reviews_user_created_idx
  on public.ai_reviews (user_id, created_at desc);

-- 3. Enable RLS and add ownership policies for ai_reviews
alter table public.ai_reviews enable row level security;

drop policy if exists "Users can read own ai reviews" on public.ai_reviews;
create policy "Users can read own ai reviews"
  on public.ai_reviews for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can insert own ai reviews" on public.ai_reviews;
create policy "Users can insert own ai reviews"
  on public.ai_reviews for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can update own ai reviews" on public.ai_reviews;
create policy "Users can update own ai reviews"
  on public.ai_reviews for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete own ai reviews" on public.ai_reviews;
create policy "Users can delete own ai reviews"
  on public.ai_reviews for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Reversible Down Migration (for manual rollback if needed):
-- drop table if exists public.ai_reviews cascade;
-- alter table public.activity_submissions
--   drop column if exists original_transcript,
--   drop column if exists edited_transcript,
--   drop column if exists transcription_status,
--   drop column if exists transcription_provider,
--   drop column if exists transcription_model,
--   drop column if exists transcribed_at,
--   drop column if exists transcript_word_timestamps,
--   drop column if exists transcription_error;
