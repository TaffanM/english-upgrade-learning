-- Migration: 0003_create_learner_progress_tables.sql
-- Description: Create learner-specific progress, submissions, checklists, assessments, and reviews

create table if not exists public.activity_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  status text not null check (status in ('draft', 'submitted')),
  text_content text,
  storage_bucket text,
  storage_path text,
  mime_type text,
  file_size_bytes bigint,
  duration_seconds integer,
  word_count integer,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint submissions_user_activity_attempt_unique unique (user_id, activity_id, attempt_number)
);

create unique index if not exists unique_active_draft_per_user_activity
  on public.activity_submissions (user_id, activity_id)
  where (status = 'draft');

create index if not exists submissions_user_activity_created_idx
  on public.activity_submissions (user_id, activity_id, created_at desc);

create table if not exists public.daily_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  challenge_day_id uuid not null references public.challenge_days(id) on delete cascade,
  speaking_completed_at timestamptz,
  writing_completed_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint daily_progress_user_day_unique unique (user_id, challenge_day_id)
);

create index if not exists daily_progress_user_day_idx
  on public.daily_progress (user_id, challenge_day_id);

create table if not exists public.checklist_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  checklist_item_id uuid not null references public.checklist_items(id) on delete cascade,
  is_completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint checklist_completions_user_item_unique unique (user_id, checklist_item_id)
);

create table if not exists public.self_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  challenge_day_id uuid not null references public.challenge_days(id) on delete cascade,
  activity_type text check (activity_type in ('speaking', 'writing')),
  fluency_score smallint check (fluency_score between 1 and 5),
  grammar_score smallint check (grammar_score between 1 and 5),
  vocabulary_score smallint check (vocabulary_score between 1 and 5),
  organization_score smallint check (organization_score between 1 and 5),
  confidence_score smallint check (confidence_score between 1 and 5),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  phase_id uuid not null references public.phases(id) on delete cascade,
  review_prompt text,
  reflection text,
  fluency_score smallint check (fluency_score between 1 and 5),
  grammar_score smallint check (grammar_score between 1 and 5),
  vocabulary_score smallint check (vocabulary_score between 1 and 5),
  organization_score smallint check (organization_score between 1 and 5),
  confidence_score smallint check (confidence_score between 1 and 5),
  evidence_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_reviews_user_phase_unique unique (user_id, phase_id)
);

create index if not exists weekly_reviews_user_challenge_idx
  on public.weekly_reviews (user_id, challenge_id);
