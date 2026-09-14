import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';

const ROOT='.vercel/output/static';
const SEO_DIR=`${ROOT}/seo`;
const PLAYER_DIR=`${SEO_DIR}/players`;
const SITE='https://bobbysbigboard.com';

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function unesc(v){return String(v??'').replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');}
function getTitle(doc){return unesc(doc.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'');}
function getDescription(doc){return unesc(doc.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)?.[1]||doc.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i)?.[1]||'');}
function replaceTitle(doc,title){return /<title[^>]*>[\s\S]*?<\/title>/i.test(doc)?doc.replace(/<title[^>]*>[\s\S]*?<\/title>/i,`<title>${esc(title)}</title>`):doc.replace('</head>',`<title>${esc(title)}</title></head>`);}
function replaceMetaName(doc,name,value){
  const re1=new RegExp(`<meta[^>]+name=["']${name}["'][^>]*>`,`i`);
  const tag=`<meta name="${name}" content="${esc(value)}">`;
  return re1.test(doc)?doc.replace(re1,tag):doc.replace('</head>',tag+'</head>');
}
function replaceMetaProp(doc,name,value){
  const re1=new RegExp(`<meta[^>]+property=["']${name}["'][^>]*>`,`i`);
  const tag=`<meta property="${name}" content="${esc(value)}">`;
  return re1.test(doc)?doc.replace(re1,tag):doc.replace('</head>',tag+'</head>');
}
function replaceCanonical(doc,path){const tag=`<link rel="canonical" href="${SITE}${path}">`;return /<link[^>]+rel=["']canonical["'][^>]*>/i.test(doc)?doc.replace(/<link[^>]+rel=["']canonical["'][^>]*>/i,tag):doc.replace('</head>',tag+'</head>');}
function replaceJsonLd(doc,json){
  const tag=`<script id="bbb-seo-jsonld" type="application/ld+json">${JSON.stringify(json).replace(/</g,'\\u003c')}</script>`;
  const re=/<script[^>]+id=["']bbb-seo-jsonld["'][^>]*>[\s\S]*?<\/script>/i;
  return re.test(doc)?doc.replace(re,tag):doc.replace('</head>',tag+'</head>');
}
function applyMeta(doc,{title,description,path,jsonLd}){
  doc=replaceTitle(doc,title);
  doc=replaceMetaName(doc,'description',description);
  doc=replaceCanonical(doc,path);
  doc=replaceMetaProp(doc,'og:title',title);doc=replaceMetaProp(doc,'og:description',description);doc=replaceMetaProp(doc,'og:url',SITE+path);
  doc=replaceMetaName(doc,'twitter:title',title);doc=replaceMetaName(doc,'twitter:description',description);
  if(jsonLd)doc=replaceJsonLd(doc,jsonLd);
  return doc;
}
function graphForPage(type,name,path,description){
  const page={ '@type':type,name,url:SITE+path,description,isPartOf:{'@type':'WebSite',name:"Bobby's Big Board",url:SITE}};
  const crumbs={ '@type':'BreadcrumbList',itemListElement:[
    {'@type':'ListItem',position:1,name:"Bobby's Big Board",item:SITE+'/'},
    {'@type':'ListItem',position:2,name,item:SITE+path}
  ]};
  return {'@context':'https://schema.org','@graph':[page,crumbs]};
}
function graphForPlayer(name,path,description){
  return {'@context':'https://schema.org','@graph':[
    {'@type':'WebPage',name,url:SITE+path,description,isPartOf:{'@type':'WebSite',name:"Bobby's Big Board",url:SITE},about:{'@type':'Person',name}},
    {'@type':'BreadcrumbList',itemListElement:[
      {'@type':'ListItem',position:1,name:"Bobby's Big Board",item:SITE+'/'},
      {'@type':'ListItem',position:2,name:'Player Profiles',item:SITE+'/rankings'},
      {'@type':'ListItem',position:3,name,item:SITE+path}
    ]}
  ]};
}

const HOME={
  title:"Dynasty Fantasy Football Rankings, Stats & Prospect Grades | Bobby's Big Board",
  description:"Independent 2026 dynasty Superflex Top 500 rankings, rookie rankings, PPR fantasy stats, NFL Draft prospect grades, player updates, market movers, comparisons, and trade tools.",
  path:'/'
};
const PAGES={
  rankings:{title:"2026 Dynasty Fantasy Football Rankings (Superflex Top 500) | Bobby's Big Board",description:"Updated 2026 dynasty fantasy football Superflex Top 500 rankings with position ranks, market comparisons, player profiles, trade values, and Bobby's independent dynasty evaluations.",type:'CollectionPage'},
  rookies:{title:"2026 Dynasty Rookie Rankings (Superflex Top 100) | Bobby's Big Board",description:"Updated 2026 dynasty rookie rankings for Superflex leagues with a Top 100 rookie board, tiers, market comparisons, player profiles, and Bobby's independent evaluations.",type:'CollectionPage'},
  prospects:{title:"NFL Draft Prospect Rankings & Grades | Bobby's Big Board",description:"Browse film-based NFL Draft prospect rankings and grades with position-specific traits, draft classes, scouting context, and pro comparisons from Bobby's Big Board.",type:'CollectionPage'},
  stats:{title:"2026 Fantasy Football PPR Leaders & Player Stats | Bobby's Big Board",description:"Track 2026 fantasy football PPR leaders, positional fantasy ranks, passing, rushing, receiving, weekly production, and season stats alongside Bobby's dynasty rankings.",type:'CollectionPage'},
  trade:{title:"Dynasty Trade Calculator & Superflex Values | Bobby's Big Board",description:"Build dynasty fantasy football trades using Bobby's live Superflex rankings, player values, draft picks, package adjustments, and BBB-vs-market valuations.",type:'WebPage'},
  compare:{title:"Dynasty Fantasy Football Player Comparison | Bobby's Big Board",description:"Compare dynasty fantasy football players head-to-head using Bobby's rankings, market value, age, injuries, recent updates, movement, and prospect grades.",type:'WebPage'},
  movers:{title:"Dynasty Fantasy Football Risers & Fallers | Bobby's Big Board",description:"Track dynasty fantasy football risers, fallers, ranking movement, and the biggest differences between Bobby's Big Board and current market value.",type:'CollectionPage'},
  updates:{title:"Dynasty Fantasy Football Player News & Updates | Bobby's Big Board",description:"Follow dynasty fantasy football player news, injuries, role changes, roster moves, and performance updates tracked across Bobby's Big Board.",type:'CollectionPage'}
};

const footerStyle=`<style id="bbb-seo-footer-style">.bbb-seo-links{width:min(1180px,calc(100% - 32px));margin:18px auto 0;padding-top:18px;border-top:1px solid #13241d;display:flex;flex-wrap:wrap;gap:10px 16px}.bbb-seo-links a{color:#7f9388;font-size:10px;font-weight:850}.bbb-seo-links a:hover{color:#72dda4}@media(max-width:640px){.bbb-seo-links{width:min(100% - 20px,1180px)}}</style>`;
const footerLinks=`<nav class="bbb-seo-links" aria-label="Explore Bobby's Big Board"><a href="/rankings">Dynasty Rankings</a><a href="/rookies">2026 Rookie Rankings</a><a href="/prospects">Prospect Grades</a><a href="/stats">Fantasy Stats</a><a href="/updates">Player Updates</a><a href="/movers">Risers & Fallers</a><a href="/compare">Player Compare</a><a href="/trade">Trade Calculator</a></nav>`;
function enhanceShell(doc){
  if(!doc.includes('bbb-seo-footer-style'))doc=doc.replace('</head>',footerStyle+'</head>');
  if(!doc.includes('class="bbb-seo-links"'))doc=doc.replace('</footer>',footerLinks+'</footer>');
  if(!doc.includes('/seo-phase1-runtime.js'))doc=doc.replace('</body>','<script src="/seo-phase1-runtime.js"></script></body>');
  return doc;
}

await mkdir(SEO_DIR,{recursive:true});
await mkdir(PLAYER_DIR,{recursive:true});
await cp('seo-phase1-runtime.js',`${ROOT}/seo-phase1-runtime.js`);

let home=await readFile(`${ROOT}/index.html`,'utf8');
home=applyMeta(home,{...HOME,jsonLd:{'@context':'https://schema.org','@type':'WebSite',name:"Bobby's Big Board",url:SITE,description:HOME.description}});
home=enhanceShell(home);
await writeFile(`${ROOT}/index.html`,home);

for(const [slug,m] of Object.entries(PAGES)){
  let doc;
  const existing=`${SEO_DIR}/${slug}.html`;
  try{doc=await readFile(existing,'utf8');}catch{doc=await readFile(`${ROOT}/index.html`,'utf8');}
  const path=`/${slug}`;
  doc=applyMeta(doc,{title:m.title,description:m.description,path,jsonLd:graphForPage(m.type,m.title.replace(/ \| Bobby's Big Board$/,''),path,m.description)});
  if(slug==='stats'&&!doc.includes('bbb-stats-route-bootstrap'))doc=doc.replace('</head>',`<script id="bbb-stats-route-bootstrap">if(location.pathname==='/stats'&&!location.hash){location.replace('/#stats')}</script></head>`);
  doc=enhanceShell(doc);
  await writeFile(existing,doc);
}

const playerFiles=await readdir(PLAYER_DIR);
let optimizedPlayers=0;
for(const file of playerFiles){
  if(!file.endsWith('.html'))continue;
  const path=`/player/${file.slice(0,-5)}`;
  const fp=`${PLAYER_DIR}/${file}`;
  let doc=await readFile(fp,'utf8');
  const oldTitle=getTitle(doc);
  const oldDescription=getDescription(doc);
  let name='',title='',description='';
  const prospect=oldTitle.match(/^(.*?)\s+(\d{4})\s+NFL Draft Prospect\s+\|\s+Bobby's Big Board$/i);
  const dynasty=oldTitle.match(/^(.*?)\s+Dynasty Profile\s+\|\s+Bobby's Big Board$/i);
  if(prospect){
    name=prospect[1];const year=prospect[2];
    title=`${name} ${year} NFL Draft Scouting Report & Grade | Bobby's Big Board`;
    description=oldDescription||`${name} ${year} NFL Draft scouting report with Bobby's prospect grade, film traits, strengths, concerns, pro comp, and dynasty prospect context.`;
  }else if(dynasty){
    name=dynasty[1];
    title=`${name} Dynasty Ranking, Stats & Outlook | Bobby's Big Board`;
    description=(oldDescription||`${name} dynasty fantasy football ranking, stats and outlook.`).replace(`${name} dynasty fantasy football profile.`,`${name} dynasty fantasy football ranking, stats and outlook.`);
  }else{
    name=oldTitle.split('|')[0].trim()||file.slice(0,-5).replace(/-/g,' ');
    title=oldTitle||`${name} Dynasty Ranking, Stats & Outlook | Bobby's Big Board`;
    description=oldDescription||`${name} dynasty fantasy football ranking, stats, player updates and outlook from Bobby's Big Board.`;
  }
  doc=applyMeta(doc,{title,description,path,jsonLd:graphForPlayer(name,path,description)});
  doc=enhanceShell(doc);
  await writeFile(fp,doc);optimizedPlayers++;
}

const sitemapPath=`${ROOT}/sitemap.xml`;
let sitemap=await readFile(sitemapPath,'utf8');
if(!sitemap.includes(`${SITE}/stats`)){
  const lastmod=new Date().toISOString().slice(0,10);
  sitemap=sitemap.replace('</urlset>',`  <url><loc>${SITE}/stats</loc><lastmod>${lastmod}</lastmod></url>\n</urlset>`);
  await writeFile(sitemapPath,sitemap);
}

const configPath='.vercel/output/config.json';
const config=JSON.parse(await readFile(configPath,'utf8'));
if(!config.routes.some(r=>r.src==='/stats/?')){
  const idx=config.routes.findIndex(r=>r.handle==='filesystem');
  config.routes.splice(idx<0?config.routes.length:idx,0,{src:'/stats/?',dest:'/seo/stats.html'});
  await writeFile(configPath,JSON.stringify(config,null,2));
}

console.log(`SEO Phase 1: optimized homepage, ${Object.keys(PAGES).length} section pages, ${optimizedPlayers} player/prospect pages, added /stats route+sitemap entry, structured data, and internal footer links.`);
await import('./seo-phase2-identity.mjs');
