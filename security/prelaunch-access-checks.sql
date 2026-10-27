-- Bobby's Big Board pre-launch access contract (READ ONLY).
-- Run through the connected Supabase SQL tool. All tests should report PASS.
-- Keep this file alongside 2026-10-27-restrict-player-profile-bundle.sql.
-- Do not substitute a privileged RPC for the BBB+ entitlement-checked
-- value-history Edge Function.

WITH checks(check_name,pass) AS (
 VALUES
 ('anonymous cannot execute privileged raw player-history bundle',
    NOT has_function_privilege('anon','public.site_player_profile_bundle(text)','EXECUTE')),
 ('ordinary members cannot execute privileged raw player-history bundle',
    NOT has_function_privilege('authenticated','public.site_player_profile_bundle(text)','EXECUTE')),
 ('trusted backend retains bundle privilege',
    has_function_privilege('service_role','public.site_player_profile_bundle(text)','EXECUTE')),
 ('anonymous cannot query raw ranking history',
    NOT has_table_privilege('anon','public.dynasty_ranking_history','SELECT')),
 ('anonymous cannot query raw market history',
    NOT has_table_privilege('anon','public.dynasty_market_history','SELECT')),
 ('anonymous cannot query convenience ranking-history view',
    NOT has_table_privilege('anon','public.site_ranking_history','SELECT')),
 ('anonymous cannot query convenience market-history view',
    NOT has_table_privilege('anon','public.site_market_history','SELECT')),
 ('anonymous cannot read customer membership rows',
    NOT has_table_privilege('anon','public.bbb_plus_memberships','SELECT')),
 ('ordinary members cannot update their own paid status',
    NOT has_table_privilege('authenticated','public.bbb_plus_memberships','UPDATE')),
 ('public player profiles remain readable',
    has_table_privilege('anon','public.site_profiles','SELECT')),
 ('public dynasty rankings remain readable',
    has_table_privilege('anon','public.site_dynasty','SELECT')),
 ('public market-movers summaries remain readable',
    has_table_privilege('anon','public.site_movers','SELECT')),
 ('public approved film catalog remains readable',
    has_table_privilege('anon','public.site_bbb_film_catalog','SELECT'))
)
SELECT check_name,CASE WHEN pass THEN 'PASS' ELSE 'FAIL' END result
FROM checks ORDER BY check_name;

-- Manual configuration checks not available through SQL:
-- 1. Supabase Auth > URL Configuration:
--    verify live /account URL and the *intended* preview redirect URLs.
-- 2. Supabase Auth > Attack Protection:
--    enable leaked password protection.
-- 3. Stripe QA: isolate the sandbox webhook + membership writes before
--    completing even fake checkout sessions.
-- 4. Review site_movers security_definer view. It deliberately exposes
--    movement summaries from private snapshot tables, not raw histories.
--    Future hardening: a public sanitized summary table populated by a
--    trusted job, with a security_invoker view on top.
