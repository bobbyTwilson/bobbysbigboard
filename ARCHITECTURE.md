# Bobby's Big Board — Production Architecture

## Source of truth

- `site-shell.html` is the captured visual HTML/CSS shell used as the production baseline.
- `bbb-runtime.js` is the canonical browser runtime for shared UI state, rendering, navigation, trade state, and profile routing.
- `bbb-core.js` owns shared Supabase REST access, page-level request caching, retry behavior, and common escaping/number utilities.
- `supabase-override.js` is the canonical Supabase-backed loader layer for dynasty rankings, rookie rankings, prospect grades, draft picks, and profile-grade hydration. The legacy filename is retained for deployment compatibility; it no longer overrides Google Sheets loaders.
- Feature files such as `updates-section.js`, `movers-section.js`, `compare-section.js`, `profile-v2.js`, `trade-v2.js`, and `advanced-filters.js` enhance the shared runtime.

## Production build

`npm run build` runs these stages in order:

1. `prepare-shell.mjs`
   - removes the four historical Google Sheets-era inline runtime blocks from `site-shell.html`
   - validates `bbb-runtime.js` syntax and required entry points
   - fails if a Google Sheets runtime URL remains
   - installs the canonical runtime into the build shell
2. `build.mjs`
   - generates the production site from the repo-owned shell
   - adds SEO metadata and player/tool routes
   - emits the current feature scripts and static assets
3. `verify-build.mjs`
   - confirms all primary views/scripts exist
   - confirms zero Google Sheets runtime references
   - requires exactly 500 current player profile URLs in the sitemap
   - verifies Rankings, Rookies, Prospects, Trade, Compare, Movers, Updates, and player routes
4. `admin-build.mjs`
   - adds the private sign-in-only admin route/assets

## Data path

Browser UI -> canonical runtime -> Supabase loaders -> `bbb-core.js` -> Supabase public site views

Primary public views include:

- `site_dynasty`
- `site_rookies`
- `site_prospects`
- `site_draft_picks`
- `site_profiles`
- `site_updates`
- `site_movers`
- `site_player_season_stats`
- `site_market_history`

Google Sheets are not part of the production browser data path.

## Release rules

- Build and test feature/refactor work on a branch first.
- Do not intentionally change Bobby's ranking order during frontend refactors.
- Structural refactors should preserve the visible UI unless the change explicitly calls for UI work.
- A production deployment should not be merged if the build smoke checks fail.
