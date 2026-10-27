-- BBB prelaunch security: remove the anonymous premium-history backdoor.
-- The deprecated site_player_profile_bundle RPC bundles raw ranking and market
-- history while running as SECURITY DEFINER. Public BBB profiles use their
-- own documented views (site_profiles / site_movers / approved film); BBB+
-- obtains premium ranking history through the authenticated entitlement-
-- checked bbb-plus-value-history Edge Function.
--
-- This migration is intentionally narrow: no tables, views, player rows,
-- app sessions or subscription objects are modified.
REVOKE EXECUTE ON FUNCTION public.site_player_profile_bundle(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.site_player_profile_bundle(text)
  TO service_role;
-- Verification:
-- SELECT has_function_privilege('anon','public.site_player_profile_bundle(text)','EXECUTE');
-- SELECT has_function_privilege('authenticated','public.site_player_profile_bundle(text)','EXECUTE');
-- SELECT has_function_privilege('service_role','public.site_player_profile_bundle(text)','EXECUTE');
--
-- Rollback, only if a backend dependency is identified:
-- GRANT EXECUTE ON FUNCTION public.site_player_profile_bundle(text)
--   TO anon, authenticated;
