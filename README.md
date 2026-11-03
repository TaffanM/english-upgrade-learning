# 41-Day English Upgrade (B1 → B2 Productive Skills Studio)

A single-learner English learning web application built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Supabase** (PostgreSQL, Auth, Private Storage), and **NVIDIA NIM** (AI Writing & Speaking Review + Speech-to-Text).

---

## Features

- **41-Day Structured Curriculum:** 6 progressive weekly phases from B1 habit building to B2 extended discourse.
- **Daily Writing Studio:** 15-minute session timer, live word count calibration, draft autosaving, proofreading checklists, and attempt history.
- **Daily Speaking Studio:** Browser audio recording normalized to 16 kHz 16-bit mono WAV, encrypted private Supabase Storage (`speaking-recordings`), and historical playback.
- **Speech-to-Text (STT) Workflow:**
  - Server-side transcription powered by **NVIDIA Parakeet CTC 1.1B ASR** (`nvidia/parakeet-ctc-1_1b-asr` via NVCF) with configurable fallback support for **Groq Whisper Large V3 Turbo** (`whisper-large-v3-turbo`).
  - Editable transcript workflow that preserves both the raw ASR output (`original_transcript`) and learner-corrected text (`edited_transcript`).
- **AI Writing & Speaking Tutor (NVIDIA NIM):**
  - Curriculum-aware B1→B2 evaluations powered by NVIDIA NIM (`nvidia/nemotron-3.5-bolt-e4b` with automatic fallback to `nvidia/nemotron-3.5-lightning-30b-a3b`).
  - Provides 4-dimension scores (`0–100`), strengths, areas for improvement, clause-level corrections with explanations, and follow-up exercises.

---

## Environment Variables

Copy `.env.example` to `.env.local` for local development. **Never commit `.env.local` or real API keys.**

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous/publishable key |
| `DATABASE_URL` | Server / CLI | Supabase PostgreSQL connection pooler URI (used by `npm run db:push`) |
| `NVIDIA_API_KEY` | **Server-Only** | NVIDIA API Catalog / NIM secret key (`nvapi-...`) |
| `NVIDIA_MODEL` | **Server-Only** | NVIDIA NIM chat model ID (default: `nvidia/nemotron-3.5-bolt-e4b`) |
| `STT_PROVIDER` | **Server-Only** | `nvidia` (default, Parakeet CTC 1.1B) or `groq` (Whisper Large V3 Turbo fallback) |
| `NVIDIA_ASR_ENDPOINT` | **Server-Only** | NVCF HTTP invocation URL for `nvidia/parakeet-ctc-1_1b-asr` |
| `NVIDIA_ASR_MODEL` | **Server-Only** | `nvidia/parakeet-ctc-1_1b-asr` |
| `GROQ_API_KEY` | **Server-Only** | Optional — required only if `STT_PROVIDER=groq` |
| `GROQ_STT_MODEL` | **Server-Only** | Optional — defaults to `whisper-large-v3-turbo` |

---

## Database Migrations & Row Level Security (RLS)

All SQL migrations reside in `supabase/migrations/`:

1. `0001_create_profiles.sql` — Learner profile linked to `auth.users`.
2. `0002_create_curriculum_tables.sql` — `challenges`, `phases`, `challenge_days`, `activities`, `checklist_items`.
3. `0003_create_learner_progress_tables.sql` — `activity_submissions`, `daily_progress`, `checklist_completions`, `self_assessments`, `weekly_reviews`.
4. `0004_enable_rls_and_policies.sql` — Row Level Security policies enforcing `user_id = (select auth.uid())`.
5. `0005_create_storage_policies.sql` — Private `speaking-recordings` bucket and folder-ownership RLS policies.
6. `0006_add_stt_and_ai_reviews.sql` — Extends `activity_submissions` with STT columns (`original_transcript`, `edited_transcript`, `transcription_status`, `transcription_provider`, `transcription_model`, `transcribed_at`, `transcript_word_timestamps`, `transcription_error`) and creates `public.ai_reviews` with `UNIQUE (submission_id)` and strict RLS policies (`select`, `insert`, `update`, `delete` restricted to `user_id = (select auth.uid())`).

To apply all migrations and seed the 41-day curriculum:

```bash
npm run db:push
```

---

## Local Development & Testing

```bash
# Install dependencies
npm install

# Run TypeScript check
npm run typecheck

# Run automated unit & integration tests (mocked providers, no real API key required)
npm run test

# Start local development server
npm run dev
```

---

## Vercel Deployment & Verification Steps

1. **Configure Vercel Environment Variables:**
   In your Vercel Project Settings → **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NVIDIA_API_KEY` (Server-only; ensure it is not exposed via `NEXT_PUBLIC_`)
   - `NVIDIA_MODEL` (`nvidia/nemotron-3.5-bolt-e4b`)
   - `STT_PROVIDER` (`nvidia`)
2. **Apply Database Migration:**
   Ensure `0006_add_stt_and_ai_reviews.sql` has been applied to the production Supabase database via `npm run db:push`.
3. **Post-Deployment Verification Checklist:**
   - Sign in as the provisioned learner and open `/challenge/1/writing`.
   - Submit a writing response and click **Request AI Tutor Feedback ✨**; verify scores, corrections, and persistence on page reload.
   - Open `/challenge/1/speaking`, record and submit an audio response, click **Transcribe Recording**, edit a word in the transcript, click **Save Transcript**, and then click **Request AI Tutor Feedback ✨**.
