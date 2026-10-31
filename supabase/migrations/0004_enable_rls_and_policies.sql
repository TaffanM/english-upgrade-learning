-- Migration: 0004_enable_rls_and_policies.sql
-- Description: Enable Row Level Security (RLS) on all public tables and create access policies

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.challenges enable row level security;
alter table public.phases enable row level security;
alter table public.challenge_days enable row level security;
alter table public.activities enable row level security;
alter table public.checklist_items enable row level security;
alter table public.activity_submissions enable row level security;
alter table public.daily_progress enable row level security;
alter table public.checklist_completions enable row level security;
alter table public.self_assessments enable row level security;
alter table public.weekly_reviews enable row level security;

-- 1. Curriculum read-only policies (available to all authenticated users; published challenges available to anon)
create policy "Anyone can read published challenges"
  on public.challenges for select
  using (is_published = true or auth.role() = 'authenticated');

create policy "Authenticated users can read phases"
  on public.phases for select
  to authenticated
  using (true);

create policy "Authenticated users can read challenge days"
  on public.challenge_days for select
  to authenticated
  using (is_published = true);

create policy "Authenticated users can read activities"
  on public.activities for select
  to authenticated
  using (true);

create policy "Authenticated users can read checklist items"
  on public.checklist_items for select
  to authenticated
  using (true);

-- 2. Profiles policies
create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- 3. Activity Submissions policies
create policy "Users can read own submissions"
  on public.activity_submissions for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can insert own submissions"
  on public.activity_submissions for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update own submissions"
  on public.activity_submissions for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete own submissions"
  on public.activity_submissions for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- 4. Daily Progress policies
create policy "Users can read own daily progress"
  on public.daily_progress for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can insert own daily progress"
  on public.daily_progress for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update own daily progress"
  on public.daily_progress for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- 5. Checklist Completions policies
create policy "Users can read own checklist completions"
  on public.checklist_completions for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can insert own checklist completions"
  on public.checklist_completions for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update own checklist completions"
  on public.checklist_completions for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- 6. Self Assessments policies
create policy "Users can read own self assessments"
  on public.self_assessments for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can insert own self assessments"
  on public.self_assessments for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update own self assessments"
  on public.self_assessments for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- 7. Weekly Reviews policies
create policy "Users can read own weekly reviews"
  on public.weekly_reviews for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can insert own weekly reviews"
  on public.weekly_reviews for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update own weekly reviews"
  on public.weekly_reviews for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
