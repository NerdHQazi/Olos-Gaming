-- Phase 8 / Phase 1: fix table privileges for auth-facing tables.
-- Keep RLS enabled; only grant the minimum privileges required.

-- profiles: app reads profile; authenticated users can insert/update their own row via RLS.
GRANT SELECT ON TABLE public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;

-- wallets: app reads wallet and may create a missing wallet row for the current user via RLS.
GRANT SELECT, INSERT ON TABLE public.wallets TO authenticated;
