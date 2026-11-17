-- MomCare AI — Non-Destructive RLS Security Hardening Migration
--
-- PURPOSE:
--   Locks down direct anonymous (anon) public browser reads/writes on sensitive
--   maternal healthcare tables while keeping all MomCare AI backend API routes
--   working via Supabase `service_role`.
--
-- IMPORTANT PREREQUISITE:
--   DO NOT RUN THIS SCRIPT until you have added `SUPABASE_SERVICE_ROLE_KEY`
--   to your Vercel Environment Variables (and local `.env` / Secrets)!
--   The Express backend automatically prefers `SUPABASE_SERVICE_ROLE_KEY` when set.
--   If you run this before setting `SUPABASE_SERVICE_ROLE_KEY`, the backend's
--   fallback `SUPABASE_PUBLISHABLE_KEY` (anon role) will be blocked from reading users
--   and private health logs.
--
-- SAFE DATA GUARANTEE:
--   - Does NOT drop, truncate, or alter any tables or columns.
--   - Preserves 100% of existing patient, doctor, appointment, reminder,
--     community, postpartum, and hydration records.
--
-- HOW TO APPLY MANUALLY:
--   1. Add `SUPABASE_SERVICE_ROLE_KEY` (from Supabase Dashboard -> Project Settings -> API)
--      to Vercel Environment Variables and redeploy.
--   2. Open Supabase Dashboard -> SQL Editor -> New Query.
--   3. Paste this entire script and click Run.

-- Ensure RLS stays enabled on all 8 tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postpartum_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hydration_logs ENABLE ROW LEVEL SECURITY;

-- Remove overly permissive public anon/authenticated full-access policies
DROP POLICY IF EXISTS "MomCare full access" ON public.users;
DROP POLICY IF EXISTS "MomCare full access" ON public.doctors;
DROP POLICY IF EXISTS "MomCare full access" ON public.appointments;
DROP POLICY IF EXISTS "MomCare full access" ON public.reminders;
DROP POLICY IF EXISTS "MomCare full access" ON public.community_posts;
DROP POLICY IF EXISTS "MomCare full access" ON public.community_comments;
DROP POLICY IF EXISTS "MomCare full access" ON public.postpartum_logs;
DROP POLICY IF EXISTS "MomCare full access" ON public.hydration_logs;

-- Allow public read-only catalog visibility for doctors & community feed if queried directly,
-- while restricting all private health & user records strictly to the server-side `service_role`.
DROP POLICY IF EXISTS "Public read available doctors" ON public.doctors;
CREATE POLICY "Public read available doctors"
  ON public.doctors
  FOR SELECT
  TO anon, authenticated
  USING (is_available = true);

DROP POLICY IF EXISTS "Public read community posts" ON public.community_posts;
CREATE POLICY "Public read community posts"
  ON public.community_posts
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read community comments" ON public.community_comments;
CREATE POLICY "Public read community comments"
  ON public.community_comments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Explicit service_role policies (defense-in-depth alongside Supabase service_role bypass)
DROP POLICY IF EXISTS "Service role full access users" ON public.users;
CREATE POLICY "Service role full access users"
  ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access doctors" ON public.doctors;
CREATE POLICY "Service role full access doctors"
  ON public.doctors FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access appointments" ON public.appointments;
CREATE POLICY "Service role full access appointments"
  ON public.appointments FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access reminders" ON public.reminders;
CREATE POLICY "Service role full access reminders"
  ON public.reminders FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access community_posts" ON public.community_posts;
CREATE POLICY "Service role full access community_posts"
  ON public.community_posts FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access community_comments" ON public.community_comments;
CREATE POLICY "Service role full access community_comments"
  ON public.community_comments FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access postpartum_logs" ON public.postpartum_logs;
CREATE POLICY "Service role full access postpartum_logs"
  ON public.postpartum_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access hydration_logs" ON public.hydration_logs;
CREATE POLICY "Service role full access hydration_logs"
  ON public.hydration_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
