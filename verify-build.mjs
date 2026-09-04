import {access,readFile} from 'node:fs/promises';

const root='.vercel/output/static';
const requiredFiles=[
  'index.html','bbb-core.js','supabase-override.js','profile-overview-fix.js','updates-section.js','movers-section.js','compare-section.js','profile-v2.js','profile-v2-data-fix.js','profile-college.js','trade-v2.js','advanced-filters.js','watchlist.js','nav-polish.js','profile-snapshot.js','seo-social.js','sitemap.xml','robots.txt'
];
for(const file of requiredFiles)await access(`${root}/${file}`);

const html=await readFile(`${root}/index.html`,'utf8');
const watchlist=await readFile(`${root}/watchlist.js`,'utf8');
const navPolish=await readFile(`${root}/nav-polish.js`,'utf8');
const profileSnapshot=await readFile(`${root}/profile-snapshot.js`,'utf8');
const profileDataFix=await readFile(`${root}/profile-v2-data-fix.js`,'utf8');
const sitemap=await readFile(`${root}/sitemap.xml`,'utf8');
const config=JSON.parse(await readFile('.vercel/output/config.json','utf8'));

const requiredHtmlMarkers=[
  'id="rankingsView"','id="rookieView"','id="prospectView"','id="tradeView"','id="profileView"','id="bbb-runtime-script"','src="/bbb-core.js"','src="/supabase-override.js"','src="/updates-section.js"','src="/compare-section.js"','src="/profile-v2.js"','src="/trade-v2.js"','src="/advanced-filters.js"','src="/watchlist.js"','src="/nav-polish.js"','src="/profile-snapshot.js"'
];
for(const marker of requiredHtmlMarkers){
  if(!html.includes(marker))throw new Error(`Build smoke check failed: missing ${marker}`);
}
for(const marker of ['bbb_watchlist_v1','watchlistView','bbbWatchInjectProfileButton','site_movers','site_updates']){
  if(!watchlist.includes(marker))throw new Error(`Build smoke check failed: Watchlist runtime missing ${marker}`);
}
for(const marker of ['bbb-nav-explore','Explore','Compare Players','bbbNavPolishDesktop']){
  if(!navPolish.includes(marker))throw new Error(`Build smoke check failed: navigation polish missing ${marker}`);
}
for(const marker of ['bbb-profile-atglance','PLAYER SNAPSHOT','7D Movement','30D Movement','LATEST BBB TAKE','bbbSnapshotMover','profile-statbar','bbb-v2-snapshot','COMPARE THIS PLAYER']){
  if(!profileSnapshot.includes(marker))throw new Error(`Build smoke check failed: Profile Snapshot runtime missing ${marker}`);
}
for(const marker of ['Player Timeline V2','site_ranking_history','BBB Ranking','Show full timeline','bbb-timeline-card']){
  if(!profileDataFix.includes(marker))throw new Error(`Build smoke check failed: Player Timeline runtime missing ${marker}`);
}
new Function(watchlist);
new Function(navPolish);
new Function(profileSnapshot);
new Function(profileDataFix);
if(/docs\.google\.com\/spreadsheets/i.test(html))throw new Error('Build smoke check failed: Google Sheets runtime survived into production HTML');

const playerUrls=(sitemap.match(/<loc>https:\/\/bobbysbigboard\.com\/player\//g)||[]).length;
if(playerUrls!==500)throw new Error(`Build smoke check failed: expected 500 player profile URLs, found ${playerUrls}`);

const routeSources=new Set((config.routes||[]).map(r=>r.src).filter(Boolean));
for(const route of ['/rankings/?','/rookies/?','/prospects/?','/trade/?','/compare/?','/movers/?','/updates/?']){
  if(!routeSources.has(route))throw new Error(`Build smoke check failed: missing route ${route}`);
}
if(!routeSources.has('/player/([^/]+)/?'))throw new Error('Build smoke check failed: missing player profile route');

console.log(`Build smoke checks passed: canonical runtime present, Watchlist V1, streamlined navigation, deduplicated Profile Snapshot V1, and Player Timeline V2 bundled and syntax-valid, zero Google Sheets runtime references, ${playerUrls} player routes, and all primary BBB tools routed.`);