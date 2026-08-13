-- Grant client-side access required by the existing 1v1 readiness and gameplay flows.
-- RLS policies remain the row-level enforcement boundary.

GRANT SELECT ON TABLE public.matches TO authenticated;
GRANT SELECT, INSERT ON TABLE public.match_events TO authenticated;