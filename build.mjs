import { cp, mkdir, rm, writeFile } from 'node:fs/promises';

const out='.vercel/output';
const baseline='https://bobbys-big-board-v2-pmu5e6526-bobbywilsonbtw-2065.vercel.app';
const SITE='https://bobbysbigboard.com';
const SUPABASE='https://twbduhmibbotregdxlla.supabase.co';
const SUPABASE_KEY='sb_publishable_R3-rucNypGm1DPd4LHV-0A_wIoT0jBS';

await rm(out,{recursive:true,force:true});
await mkdir(`${out}/static`,{recursive:true});
await mkdir(`${out}/static/seo/players`,{recursive:true});

const response=await fetch(baseline);
if(!response.ok)throw new Error(`Could not fetch production baseline: ${response.status}`);
let html=await response.text();

const analytics=`<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments);};</script><script defer src="/_vercel/insights/script.js"></script>`;
const moverNavFix=`<script>document.addEventListener('click',e=>{if(e.target.closest('.bbb-mover-row,.bbb-mover-card'))document.querySelector('#moversView')?.classList.add('hide')},true);</script>`;
const comparePolish=`<style>.bbb-compare-swap{border:1px solid #2e503f;background:#0b1712;color:#8fe1b2;border-radius:999px;width:48px;height:48px;display:grid;place-items:center;cursor:pointer;font-weight:950;font-size:18px}.bbb-compare-swap:hover{border-color:#50ce8e;color:#fff}@media(max-width:850px){.bbb-compare-swap{width:42px;height:42px}}</style><script>bbbCompareTopTraits=function(p){const pos=p?.prospect?.pos||'';return Object.entries(p?.prospect?.traits||{}).map(([head,raw])=>{const value=bbbCompareNum(raw);const name=typeof profileCleanTrait==='function'?profileCleanTrait(head):head;const max=typeof profileTraitMax==='function'?profileTraitMax(pos,name,head):(/Speed|Acceleration|Analytics/.test(name)?10:5);return{name,value,max,pct:value==null?0:value/max}}).filter(x=>x.value!=null&&!/projected draft capital/i.test(x.name)).sort((a,b)=>b.pct-a.pct||b.value-a.value).slice(0,3)};const bbbCompareRenderOriginal=bbbCompareRender;bbbCompareRender=function(){bbbCompareRenderOriginal();const vs=document.querySelector('.bbb-compare-vs');if(vs&&(bbbCompareLeft||bbbCompareRight)){vs.innerHTML='<button type="button" class="bbb-compare-swap" aria-label="Swap compared players">⇄</button>';vs.querySelector('button').onclick=()=>{[bbbCompareLeft,bbbCompareRight]=[bbbCompareRight,bbbCompareLeft];bbbCompareRender()}}};</script>`;

html=html
  .replaceAll('Google Sheet synced','Supabase SQL synced')
  .replaceAll('Sheet-backed database','SQL-backed database')
  .replaceAll("The rookie order updates directly from Bobby's sheet.","The rookie order updates directly from Bobby's database.")
  .replaceAll("Bobby's live Draft Pick Values sheet","Bobby's live SQL database")
  .replace('<a href="#trade">Trade Calculator</a>','')
  .replace('</body>',`${analytics}<script src="/bbb-core.js"></script><script src="/supabase-override.js"></script><script src="/profile-overview-fix.js"></script><script src="/updates-section.js"></script><script src="/compare-section.js"></script><script src="/profile-v2.js"></script><script src="/profile-v2-data-fix.js"></script><script src="/profile-college.js"></script><script src="/trade-v2.js"></script><script src="/advanced-filters.js"></script><script src="/seo-social.js"></script>${comparePolish}${moverNavFix}</body>`);

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function stripSeo(doc){
  return doc
    .replace(/<title[^>]*>[\s\S]*?<\/title>/i,'')
    .replace(/<meta[^>]+name=["']description["'][^>]*>/gi,'')
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi,'')
    .replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>/gi,'')
    .replace(/<meta[^>]+name=["']twitter:[^"']+["'][^>]*>/gi,'')
    .replace(/<script[^>]+id=["']bbb-seo-jsonld["'][^>]*>[\s\S]*?<\/script>/gi,'');
}
function withSeo(doc,{title,description,path,type='website',jsonLd=null,extraHead=''}){
  const url=SITE+path;
  const image=SITE+'/bbb-share.webp';
  const json=jsonLd?`<script id="bbb-seo-jsonld" type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g,'\\u003c')}</script>`:'';
  const tags=`<title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(url)}"><meta property="og:site_name" content="Bobby's Big Board"><meta property="og:type" content="${esc(type)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(url)}"><meta property="og:image" content="${image}"><meta property="og:image:type" content="image/webp"><meta property="og:image:alt" content="Bobby's Big Board dynasty fantasy football"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${image}">${json}${extraHead}`;
  return stripSeo(doc).replace('</head>',tags+'</head>');
}
async function supa(table,query){
  const r=await fetch(`${SUPABASE}/rest/v1/${table}?${query}`,{headers:{apikey:SUPABASE_KEY}});
  if(!r.ok)throw new Error(`Supabase ${table} ${r.status}`);
  return r.json();
}

const logo=html.match(/<img[^>]*class="[^"]*brand-logo[^"]*"[^>]*src="data:image\/webp;base64,([^"]+)"/i);
if(logo)await writeFile(`${out}/static/bbb-share.webp`,Buffer.from(logo[1],'base64'));

const [profileRows,dynastyRows]=await Promise.all([
  supa('site_profiles','select=player_key,name,pos,team,age,draft_year,college&order=name.asc'),
  supa('site_dynasty','select=rank,player_key,name,pos,pr,team,age,draft,market,gap,college&order=rank.asc')
]);
const dynastyMap=new Map(dynastyRows.map(x=>[x.player_key,x]));
const profiles=profileRows.filter(x=>x.player_key&&x.name);

const homeMeta={
  title:"Bobby's Big Board | Dynasty Fantasy Football Rankings",
  description:"Bobby's Big Board dynasty Superflex rankings, 2026 rookie rankings, prospect grades, player profiles, market movers, player comparison, and trade calculator.",
  path:'/',
  jsonLd:{'@context':'https://schema.org','@type':'WebSite',name:"Bobby's Big Board",url:SITE,description:"Independent dynasty fantasy football rankings, player research, market context, prospect grades, and trade tools."}
};
await writeFile(`${out}/static/index.html`,withSeo(html,homeMeta));

const tools={
  rankings:{hash:'#rankings',title:"Dynasty Fantasy Football Rankings | Bobby's Big Board",description:"Bobby's live Top 500 dynasty Superflex rankings with market gaps, advanced filters, player profiles, and trade values."},
  rookies:{hash:'#rookies',title:"2026 Dynasty Rookie Rankings | Bobby's Big Board",description:"Bobby's live 2026 dynasty rookie rankings for Superflex leagues, with tiers, market context, and player profiles."},
  prospects:{hash:'#prospects',title:"Dynasty Prospect Grades | Bobby's Big Board",description:"Browse Bobby's film-based prospect grades, traits, draft classes, and pro comparisons for quarterbacks, running backs, wide receivers, and tight ends."},
  trade:{hash:'#trade',title:"Dynasty Trade Calculator | Bobby's Big Board",description:"Build dynasty trades with Bobby's live Superflex values, cornerstone premiums, package discounts, draft picks, and BBB-vs-market valuation."},
  compare:{hash:'#compare',title:"Dynasty Player Compare | Bobby's Big Board",description:"Compare two dynasty players head-to-head using Bobby's rankings, market value, age, injury status, movement, prospect grades, and recent updates."},
  movers:{hash:'#movers',title:"Dynasty Market Movers | Bobby's Big Board",description:"Track the biggest dynasty ranking risers, fallers, and BBB-vs-market movement across Bobby's Big Board."},
  updates:{hash:'#updates',title:"Dynasty Player Updates | Bobby's Big Board",description:"Read the latest meaningful dynasty player updates, injuries, role changes, roster news, and performance notes tracked by Bobby's Big Board."}
};
for(const [slug,m] of Object.entries(tools)){
  const redirect=`<script>if(location.pathname==='/${slug}'&&!location.hash){location.replace('/${m.hash}'+location.search)}</script>`;
  const page=withSeo(html,{title:m.title,description:m.description,path:`/${slug}`,extraHead:redirect});
  await writeFile(`${out}/static/seo/${slug}.html`,page);
}

for(const p of profiles){
  const d=dynastyMap.get(p.player_key);
  const rank=d?.rank?`BBB dynasty rank #${d.rank}. `:'';
  const pos=d?.pos||p.pos||'';
  const team=d?.team||p.team||'';
  const description=`${p.name} dynasty fantasy football profile. ${rank}${pos}${team?' • '+team:''}. Rankings, market value, player updates, ranking history, career fantasy production, and prospect context from Bobby's Big Board.`;
  const path=`/player/${p.player_key}`;
  const page=withSeo(html,{
    title:`${p.name} Dynasty Profile | Bobby's Big Board`,
    description,
    path,
    type:'profile',
    jsonLd:{'@context':'https://schema.org','@type':'WebPage',name:`${p.name} Dynasty Profile`,url:SITE+path,description,about:{'@type':'Person',name:p.name}}
  });
  await writeFile(`${out}/static/seo/players/${p.player_key}.html`,page);
}

const lastmod=new Date().toISOString().slice(0,10);
const currentPlayerPaths=dynastyRows.filter(p=>p.player_key).map(p=>`/player/${p.player_key}`);
const sitemapPaths=['/',...Object.keys(tools).map(x=>`/${x}`),...currentPlayerPaths];
const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapPaths.map(path=>`  <url><loc>${SITE}${path}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}\n</urlset>\n`;
await writeFile(`${out}/static/sitemap.xml`,sitemap);
await writeFile(`${out}/static/robots.txt`,`User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);

await cp('bbb-core.js',`${out}/static/bbb-core.js`);
await cp('supabase-override.js',`${out}/static/supabase-override.js`);
await cp('profile-overview-fix.js',`${out}/static/profile-overview-fix.js`);
await cp('updates-section.js',`${out}/static/updates-section.js`);
await cp('movers-section.js',`${out}/static/movers-section.js`);
await cp('compare-section.js',`${out}/static/compare-section.js`);
await cp('profile-v2.js',`${out}/static/profile-v2.js`);
await cp('profile-v2-data-fix.js',`${out}/static/profile-v2-data-fix.js`);
await cp('profile-college.js',`${out}/static/profile-college.js`);
await cp('trade-v2.js',`${out}/static/trade-v2.js`);
await cp('advanced-filters.js',`${out}/static/advanced-filters.js`);
await cp('seo-social.js',`${out}/static/seo-social.js`);

const toolRoutes=Object.keys(tools).map(slug=>({src:`/${slug}/?`,dest:`/seo/${slug}.html`}));
await writeFile(`${out}/config.json`,JSON.stringify({
  version:3,
  routes:[
    {src:'/player/([^/]+)/?',dest:'/seo/players/$1.html'},
    ...toolRoutes,
    {handle:'filesystem'},
    {src:'/.*',dest:'/index.html'}
  ]
},null,2));

console.log(`Built production-identical Bobby's Big Board UI with shared BBB core data layer, SEO/social metadata, ${profiles.length} shareable player profiles, ${currentPlayerPaths.length} current profiles in sitemap, robots, Profile V2, Trade Calculator V2, and advanced filters.`);
