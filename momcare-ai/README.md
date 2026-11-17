# MomCare AI — Maternal Healthcare & Pregnancy Tracking Platform

MomCare AI is a full-stack maternal healthcare, pregnancy tracking, nutrition planning, appointment booking, and postpartum care platform built with **React + Vite + TypeScript**, **Express** (with **Vercel Serverless API** adapter), **Supabase PostgreSQL**, **Firebase Google Authentication**, and **Google Gemini AI** (`@google/genai`).

---

## Architecture Overview

- **Frontend (`src/`)**: React 19 + TypeScript + Tailwind CSS v4 SPA with URL-synced routing (`/`, `/pregnancy-tracker`, `/baby-development`, `/ai-assistant`, `/nutrition`, `/doctors`, `/appointments`, `/reminders`, `/community`, `/postpartum`, `/profile`, `/admin`, `/auth`).
- **Backend (`src/server/app.ts`)**: Shared Express application used both in local dev/Node (`server.ts`) and in Vercel Serverless production (`api/[...path].ts`).
- **Database (`src/db/repository.ts`, `supabase/schema.sql`)**: Supabase PostgreSQL across 8 relational tables (`users`, `doctors`, `appointments`, `reminders`, `community_posts`, `community_comments`, `postpartum_logs`, `hydration_logs`).
- **Authentication (`src/middleware/auth.ts`, `src/lib/passwordReset.ts`)**:
  - Local email/password authentication (`scrypt` salted password hashing + HMAC-SHA256 signed session tokens).
  - Verified 6-digit email OTP password reset flow (when `RESEND_API_KEY` is configured) and authenticated password change in **My Dashboard**.
  - Firebase Google Sign-In (`firebase-admin` server verification with `email_verified` linking guard).
  - Demo Patient (`Ananya Mehta`) & Demo Admin (`Dr. Kavya Menon`) preview login.
- **AI Assistant (`/api/ai/assistant`)**: Uses `@google/genai` server-side only with strict non-diagnostic medical guardrails and emergency symptom detection.

---

## Environment Variables

Copy `.env.example` to `.env` for local development, and configure these exact variables in **Vercel → Project Settings → Environment Variables**:

| Variable | Required? | Purpose & Where to Obtain |
| --- | --- | --- |
| `SUPABASE_URL` | **Required** | Supabase Project Settings → Data API → Project URL |
| `SUPABASE_PUBLISHABLE_KEY` | **Required** | Supabase Project Settings → API Keys → `anon` / Publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Strongly Recommended** | Supabase Project Settings → API Keys → `service_role` secret key (server-side only; required before applying RLS hardening migration) |
| `SESSION_SECRET` | **Recommended** | Random 32+ byte hex secret (`openssl rand -hex 32`) for persistent HMAC session & password reset signing across serverless cold starts |
| `GEMINI_API_KEY` | **Required for AI Assistant** | Google AI Studio API Key (server-side only) |
| `RESEND_API_KEY` | Optional | Resend API key for 6-digit password reset emails (`POST /api/auth/forgot-password`) |
| `RESET_FROM_EMAIL` | Optional | Verified sender address in Resend (e.g., `MomCare AI <no-reply@yourdomain.com>`) |
| `APP_URL` | Optional | Public production URL (e.g., `https://maternal-health-platform.vercel.app`) |

> **Security Note:** Never expose `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `SESSION_SECRET`, or `RESEND_API_KEY` with a `VITE_` prefix or in client-side code.

---

## Local Development

```bash
npm install
npm run dev
```

The app runs on `http://localhost:3000`.

### Build & Typecheck

```bash
npm run lint
npm run build
```

### Automated Tests

```bash
# Unit & Express API integration tests (Vitest)
npm test

# End-to-End Desktop & Mobile browser tests (Playwright Chromium)
npm run test:e2e
```

> Both test suites automatically clean up any synthetic test user rows they create so your Supabase production data remains untouched.

---

## Supabase Database & Non-Destructive RLS Migration

Your existing schema (`supabase/schema.sql`) preserves all 8 tables and production rows.

If you want to lock down direct anonymous browser access to sensitive maternal tables in Supabase while keeping the backend working:

1. **First**, add `SUPABASE_SERVICE_ROLE_KEY` in **Vercel → Settings → Environment Variables** and **Redeploy**.
2. **Second**, open **Supabase Dashboard → SQL Editor → New Query**, paste the contents of `supabase/migrations/001_harden_rls_policies.sql`, and click **Run**.

This migration does **not** drop, truncate, or modify any tables or existing records.

---

## Vercel Deployment Settings

In **Vercel → Project → Settings → Build & Development Settings**:

- **Root Directory**: `momcare-ai` *(only if this project lives inside a `momcare-ai/` subfolder in your GitHub repository; leave `.` if pushed at repository root)*
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

`vercel.json` is preconfigured for Vite SPA routing while excluding `/api/*`, `/src/assets/*`, and static files so `POST /api/auth/demo` and all backend API routes resolve cleanly via `api/[...path].ts`.

### Google Sign-In on Production Domain

If using Google Sign-In on `https://maternal-health-platform.vercel.app`:
1. Open **Firebase Console → Authentication → Settings → Authorized Domains**.
2. Add `maternal-health-platform.vercel.app` (and any preview domain).

---

## Uploading to GitHub & Redeploying on Vercel

```bash
# Inside the momcare-ai project directory (or repository root)
git status
git add .
git commit -m "Complete MomCare AI audit fixes, Vercel serverless API, and automated tests"
git push origin main
```

1. Verify `.env` is **not** staged (`git status` should never list `.env`).
2. Confirm Vercel triggers an automatic production build from `main` (or click **Deployments → Redeploy** in Vercel).
3. Test `https://maternal-health-platform.vercel.app/api/health` in your browser to confirm `{"status":"ok","service":"MomCare AI",...}`.
