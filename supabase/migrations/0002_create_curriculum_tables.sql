-- Migration: 0002_create_curriculum_tables.sql
-- Description: Create curriculum tables (challenges, phases, challenge_days, activities, checklist_items)

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  source_level text,
  target_level text,
  start_date date not null,
  end_date date not null,
  total_days integer not null check (total_days > 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.phases (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  phase_number smallint not null,
  title text not null,
  focus text,
  start_day smallint not null,
  end_day smallint not null,
  created_at timestamptz not null default now(),
  constraint phases_challenge_phase_unique unique (challenge_id, phase_number),
  constraint phases_day_range_check check (start_day <= end_day)
);

create table if not exists public.challenge_days (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  phase_id uuid references public.phases(id) on delete set null,
  day_number smallint not null,
  scheduled_date date not null,
  title text,
  intro text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  constraint challenge_days_number_unique unique (challenge_id, day_number),
  constraint challenge_days_date_unique unique (challenge_id, scheduled_date)
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  challenge_day_id uuid not null references public.challenge_days(id) on delete cascade,
  activity_type text not null check (activity_type in ('speaking', 'writing')),
  title text not null,
  prompt text not null,
  instructions text,
  target_duration_minutes smallint not null default 15,
  target_word_count integer,
  minimum_word_count integer,
  maximum_word_count integer,
  sort_order smallint not null default 1,
  is_required boolean not null default true,
  created_at timestamptz not null default now(),
  constraint activities_day_type_unique unique (challenge_day_id, activity_type)
);

create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  challenge_day_id uuid not null references public.challenge_days(id) on delete cascade,
  label text not null,
  sort_order smallint not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists challenge_days_challenge_day_idx
  on public.challenge_days (challenge_id, day_number);

create index if not exists activities_day_sort_idx
  on public.activities (challenge_day_id, sort_order);

create index if not exists checklist_items_day_idx
  on public.checklist_items (challenge_day_id, sort_order);
