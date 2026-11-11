-- BBB+ Film Notebook V1: free grade + overview, paid detail, verified on server.
-- Existing Admin editorial RPCs keep writing into prospect_grades unmodified.
-- Do not add hidden scouting text to the public view or static SEO HTML.

-- Keep the established shape for existing consumers, but zero the private fields.
-- Appending notebook_available lets a public profile show a lock/teaser without
-- giving out subscriber text. The underlying view is deliberately owner-run:
-- only these selected output columns are publicly readable.
CREATE OR REPLACE VIEW public.site_prospects AS
SELECT
 g.player_key,
 p.name,
 g.position AS pos,
 g.class_year AS year,
 g.overall_grade AS grade,
 g.pro_comp AS comp,
 g.traits,
 CASE WHEN g.scouting_published THEN NULLIF(g.scouting_overview,'') ELSE NULL::text END AS overview,
 NULL::text AS strengths,
 NULL::text AS concerns,
 NULL::text AS projection,
 NULL::text AS development_plan,
 NULL::text AS comp_explanation,
 NULLIF(g.photo_url,'') AS photo_url,
 NULLIF(g.photo_credit,'') AS photo_credit,
 (
  g.scouting_published
  AND g.class_year >= 2027
  AND (
   NULLIF(BTRIM(g.scouting_strengths),'') IS NOT NULL
   OR NULLIF(BTRIM(g.scouting_concerns),'') IS NOT NULL
   OR NULLIF(BTRIM(g.nfl_projection),'') IS NOT NULL
   OR NULLIF(BTRIM(g.development_plan),'') IS NOT NULL
   OR NULLIF(BTRIM(g.comp_explanation),'') IS NOT NULL
  )
 ) AS notebook_available
FROM public.prospect_grades g
JOIN public.players p USING(player_key);

COMMENT ON VIEW public.site_prospects IS
 'Public free prospect grades and overview only. Subscriber film notes must be read from verified bbb-plus-film-notebook Edge Function.';

-- RLS filters rows, not columns. Revoke table-level SELECT to prevent the
-- public REST endpoint from exposing paid fields directly.
REVOKE SELECT ON TABLE public.prospect_grades FROM anon, authenticated;
GRANT SELECT (
 player_key,position,class_year,overall_grade,pro_comp,traits,
 updated_at,scouting_overview,scouting_published,photo_url,photo_credit
) ON public.prospect_grades TO anon, authenticated;

-- Service role retains full access; SECURITY DEFINER Admin grading and
-- editorial save procedures remain unchanged.
GRANT SELECT ON public.site_prospects TO anon, authenticated;
