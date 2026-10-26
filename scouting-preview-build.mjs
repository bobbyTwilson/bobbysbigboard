import {readFile,writeFile,copyFile,mkdir,readdir} from 'node:fs/promises';
const root='.vercel/output/static';
const original=await readFile(root+'/index.html','utf8');
await mkdir(root+'/dynasty-engine',{recursive:true});
/* Legacy dynasty tools are a component inside the new scouting shell, not a second visible website. */
const styles=`<style>
.site-header,.mobile-subnav,footer,.footer,.youtube-strip{display:none!important}
html,body{background:#0b180f!important;color:#eef4ed!important}
.hero,.trade-hero{padding:27px 0 32px!important;background:linear-gradient(125deg,#15281a,#0d1b11)!important}
.hero h1,.trade-hero h1{font-size:clamp(36px,5vw,62px)!important}
.hero-card,.trade-summary-card,.rankings-panel,.market-card,.trade-team-card,.trade-verdict-card{background:#13241a!important;border-color:#38563e!important}
.btn-primary,.tab.active,.nav-cta{background:#276d39!important;border-color:#3d8d51!important}
a:hover,.rank-cell{color:#8bdfa0!important}
.section{padding:32px 0!important}
.shell{width:min(1150px,calc(100% - 22px))!important}
@media(max-width:650px){.shell{width:calc(100% - 16px)!important}.section{padding:24px 0!important}.hero{padding:19px 0!important}}
</style>`;
await writeFile(root+'/dynasty-engine/index.html',original.replace('</head>', '<meta name="robots" content="noindex,nofollow">'+styles+'</head>'));
const publicBuild=process.env.VERCEL_ENV==='production';
let preview=await readFile('scouting-preview.html','utf8');
if(publicBuild){
  preview=preview.replace('<meta name="robots" content="noindex,nofollow">','<meta name="robots" content="index,follow">')
    .replace('<title>Bobby\'s Big Board — Scouting Platform Preview</title>','<title>Bobby\'s Big Board | Film, Scouting & Dynasty Rankings</title>')
    .replace(/<div class="previewbar">[\s\S]*?<\/div>/,'');
}
await writeFile(root+'/index.html',preview);
await copyFile('scouting-preview.js',root+'/scouting-preview.js');
await copyFile('scouting-samples.js',root+'/scouting-samples.js');
await copyFile('scouting-green.css',root+'/scouting-green.css');
await copyFile('scouting-atmosphere.css',root+'/scouting-atmosphere.css');
await copyFile('scouting-directory.css',root+'/scouting-directory.css');
await copyFile('scouting-profile-v5.js',root+'/scouting-profile-v5.js');
await copyFile('scouting-profile-v5.css',root+'/scouting-profile-v5.css');
await copyFile('scouting-intelligence-v6.js',root+'/scouting-intelligence-v6.js');
await copyFile('scouting-intelligence-v6.css',root+'/scouting-intelligence-v6.css');
await copyFile('scouting-film-room-v1.js',root+'/scouting-film-room-v1.js');
await copyFile('scouting-film-room-v1.css',root+'/scouting-film-room-v1.css');
/* The existing BBB rich profile UI is available inside scouting pages without a second site header. */
const embed='<script>if(new URLSearchParams(location.search).get("bbbEmbed")==="1")document.documentElement.classList.add("bbb-embed")</script><style>html.bbb-embed .site-header,html.bbb-embed .mobile-subnav,html.bbb-embed .footer,html.bbb-embed .youtube-strip,html.bbb-embed footer,html.bbb-embed .footer-inner{display:none!important}html.bbb-embed body{background:#102218!important}html.bbb-embed .profile-card{border-color:#395c43!important}html.bbb-embed .profile-loading{min-height:300px}html.bbb-embed .profile-route-active{min-height:0!important}html.bbb-embed .profile-header,html.bbb-embed .profile-hero{padding-top:26px!important}</style>';
const profileDir=root+'/seo/players';
let embedded=0;
for(const name of await readdir(profileDir)){
 if(!name.endsWith('.html'))continue;
 const dest=profileDir+'/'+name,body=await readFile(dest,'utf8');
 if(!body.includes('</head>'))continue;
 await writeFile(dest,body.replace('</head>',embed+'</head>'));
 embedded++;
}
console.log('Prepared '+embedded+' original BBB profiles for header-free scouting embeds.');
try{await import('./scouting-espn-headshots.mjs')}catch(e){console.warn('ESPN headshots unavailable during preview build:',e.message);await writeFile(root+'/scouting-headshots.json','{"players":{},"metadata":{"error":"provider unavailable"}}')}
/* Auth-free public YouTube oEmbed metadata, fixed-domain HTTPS request only; no API key or vidIQ. */
const metadataFunctionDir='.vercel/output/functions/api/youtube-meta.func';
await mkdir(metadataFunctionDir,{recursive:true});
await copyFile('scouting-youtube-meta.mjs',metadataFunctionDir+'/index.mjs');
await writeFile(metadataFunctionDir+'/.vc-config.json',JSON.stringify({runtime:'nodejs22.x',handler:'index.mjs',launcherType:'Nodejs',maxDuration:10,shouldAddHelpers:true}));
/* Search/social metadata is emitted into actual HTML at build time for public
   crawlers. Preview deployments remain noindex and disallow crawling. */
const htmlEscape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const canonical='https://bobbysbigboard.com';
const metaPage=(source,{title,description,path,robots})=>{
  let doc=source.replace(/<title>[\s\S]*?<\/title>/i,'<title>'+htmlEscape(title)+'</title>')
    .replace(/<meta name="robots" content="[^"]*">/i,'<meta name="robots" content="'+(robots||'index,follow')+'">');
  const metadata=[
   '<meta name="description" content="'+htmlEscape(description)+'">',
   '<link rel="canonical" href="'+canonical+htmlEscape(path)+'">',
   '<meta property="og:type" content="website">',
   '<meta property="og:site_name" content="Bobby’s Big Board">',
   '<meta property="og:title" content="'+htmlEscape(title)+'">',
   '<meta property="og:description" content="'+htmlEscape(description)+'">',
   '<meta property="og:url" content="'+canonical+htmlEscape(path)+'">',
   '<meta property="og:image" content="'+canonical+'/bbb-share.webp">',
   '<meta name="twitter:card" content="summary_large_image">',
   '<meta name="twitter:title" content="'+htmlEscape(title)+'">',
   '<meta name="twitter:description" content="'+htmlEscape(description)+'">'
  ].join('');
  return doc.replace('</head>',metadata+'</head>');
};
let publicSitemap='';
if(publicBuild){
 const landing=[
  ['','Film, Scouting & Dynasty Rankings','Detailed football scouting reports, player film breakdowns, draft prospects and Superflex dynasty rankings from Bobby’s Big Board.'],
  ['players','Football Player Scouting Database','Explore NFL and college prospect scouting, verified athletic profiles, player grades, production, and connected game film.'],
  ['film','Football Film Room','Watch original NFL and draft prospect film breakdowns from Bobby’s Big Board with player-linked scouting reports.'],
  ['draft','NFL Draft Prospects & Scouting Grades','Explore independently graded draft prospects, trait breakdowns, college backgrounds, athletic testing and film.'],
  ['dynasty/rankings','Superflex Dynasty Top 500 Rankings','Current Bobby’s Big Board Superflex dynasty rankings, position rankings and player values.'],
  ['dynasty/trade','Dynasty Trade Calculator','Evaluate fantasy football dynasty trades and player values with the existing BBB trade engine.'],
  ['dynasty/rookies','Rookie Dynasty Rankings','Rookie dynasty fantasy football rankings with independent player scouting context.'],
  ['dynasty/compare','Compare Football Players','Compare player rankings, dynasty value, scouting and production side by side.'],
  ['dynasty/movers','Dynasty Ranking Movers','Risers and fallers in Bobby’s Big Board dynasty rankings.'],
  ['dynasty/updates','Player Updates & Rankings Context','Read natural-language player updates, injuries and roster context for dynasty fantasy football.'],
  ['terms','Terms of Service','Terms of Service for Bobby’s Big Board football analysis and membership features.'],
  ['privacy','Privacy Policy','How Bobby’s Big Board handles account, membership and fantasy-football data.'],
  ['billing','BBB+ Billing Policy','Subscription billing and cancellation terms for BBB+ memberships.']
 ];
 const directory=root+'/seo/scouting';
 await mkdir(directory,{recursive:true});
 await mkdir(directory+'/landing',{recursive:true});
 const entry=landing[0];
 await writeFile(root+'/index.html',metaPage(preview,{title:entry[1]+' | Bobby’s Big Board',description:entry[2],path:'/'}));
 for(const [path,title,description] of landing.slice(1)){
  await writeFile(directory+'/landing/'+path.replaceAll('/','-')+'.html',metaPage(preview,{title:title+' | Bobby’s Big Board',description,path:'/'+path}));
 }
 const profileFiles=await readdir(profileDir);
 const profileSlugs=[];
 for(const filename of profileFiles){
  if(!filename.endsWith('.html'))continue;
  const slug=filename.slice(0,-5);
  const old=await readFile(profileDir+'/'+filename,'utf8');
  const oldTitle=old.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'';
  const person=oldTitle.replace(/&amp;/g,'&').split(/\s+(?:\d{4}\s+)?(?:Dynasty|NFL Draft|Scouting|Player|Stats|Fantasy)\b|\s+\|/i)[0].trim()
    ||slug.split('-').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' ');
  const title=person+' — Scouting Report, Stats & Film | Bobby’s Big Board';
  const description=person+' scouting report, prospect grades, verified football athletic testing, player stats and film breakdowns from Bobby’s Big Board.';
  await writeFile(directory+'/'+slug+'.html',metaPage(preview,{title,description,path:'/scouting/'+slug}));
  profileSlugs.push(slug);
 }
 const skipAliases=new Set(['michael-penix','ben-sinnot','lequint-allen','erick-all']);
 const siteRoutes=landing.map(x=>x[0]).filter(x=>!['terms','privacy','billing'].includes(x));
 const urls=[...new Set([...siteRoutes.map(x=>canonical+'/'+x),...profileSlugs.filter(x=>!skipAliases.has(x)).map(x=>canonical+'/scouting/'+x)])];
 const modified=new Date().toISOString().slice(0,10);
 publicSitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
   urls.map(url=>'  <url><loc>'+htmlEscape(url)+'</loc><lastmod>'+modified+'</lastmod></url>').join('\n')+'\n</urlset>\n';
 await writeFile(root+'/sitemap.xml',publicSitemap);
 console.log('Scouting SEO: '+profileSlugs.length+' static share/indexing profiles; preview remains excluded.');
}

let config=JSON.parse(await readFile('.vercel/output/config.json','utf8'));
config.routes=[
 {src:'/players/?',dest:publicBuild?'/seo/scouting/landing/players.html':'/index.html'},
 {src:'/film/?',dest:publicBuild?'/seo/scouting/landing/film.html':'/index.html'},
 {src:'/draft/?',dest:publicBuild?'/seo/scouting/landing/draft.html':'/index.html'},
 {src:'/scouting/([^/]+)/?',dest:publicBuild?'/seo/scouting/$1.html':'/index.html'},
 {src:'/dynasty/?',dest:'/index.html'},
 {src:'/dynasty/(rankings|trade|compare|rookies|movers|updates|watchlist|stats)/?',dest:'/index.html'},
 {src:'/(account|plus|watchlist|stats|terms|privacy|billing)/?',dest:'/index.html'},
 {src:'/rankings/?',dest:'/dynasty/rankings',status:308},
 {src:'/rookies/?',dest:'/dynasty/rookies',status:308},
 {src:'/prospects/?',dest:'/draft',status:308},
 {src:'/trade/?',dest:'/dynasty/trade',status:308},
 {src:'/compare/?',dest:'/dynasty/compare',status:308},
 {src:'/movers/?',dest:'/dynasty/movers',status:308},
 {src:'/updates/?',dest:'/dynasty/updates',status:308},
 {src:'/dynasty-engine/?',dest:'/dynasty-engine/index.html'},
 ...config.routes
];
await writeFile('.vercel/output/config.json',JSON.stringify(config,null,2));
if(publicBuild){
  await writeFile(root+'/robots.txt','User-agent: *\\nDisallow: /admin\\nDisallow: /dynasty-engine\\nDisallow: /account\\nDisallow: /watchlist\\nDisallow: /seo\\nSitemap: https://bobbysbigboard.com/sitemap.xml\\n'.replaceAll('\\n','\n'));
}else{
  await writeFile(root+'/robots.txt','User-agent: *\\nDisallow: /\\n'.replaceAll('\\n','\n'));
}
console.log('Unified BBB scouting preview, green identity, dynamic ESPN headshots and integrated dynasty tools built. No production deployment.');
