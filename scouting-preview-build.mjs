import {readFile,writeFile,copyFile,mkdir,readdir} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const root='.vercel/output/static';
const original=await readFile(root+'/index.html','utf8');
await mkdir(root+'/dynasty-engine',{recursive:true});
/* Legacy dynasty tools are a component inside the new scouting shell, not a second visible website. */
const styles=`<style>
.site-header,.mobile-subnav,footer,.footer,.youtube-strip{display:none!important}
/* Only the parent page scrolls. The embedded engine expands to its content. */
html,body{background:#0b180f!important;color:#eef4ed!important;overflow-y:hidden!important;scrollbar-width:none!important}
html::-webkit-scrollbar,body::-webkit-scrollbar{display:none!important}
.hero,.trade-hero{padding:27px 0 32px!important;background:linear-gradient(125deg,#15281a,#0d1b11)!important}
.hero h1,.trade-hero h1{font-size:clamp(36px,5vw,62px)!important}
.hero-card,.trade-summary-card,.rankings-panel,.market-card,.trade-team-card,.trade-verdict-card{background:#13241a!important;border-color:#38563e!important}
.btn-primary,.tab.active,.nav-cta{background:#276d39!important;border-color:#3d8d51!important}
a:hover,.rank-cell{color:#8bdfa0!important}
.section{padding:32px 0!important}
.shell{width:min(1150px,calc(100% - 22px))!important}
@media(max-width:650px){.shell{width:calc(100% - 16px)!important}.section{padding:24px 0!important}.hero{padding:19px 0!important}}
</style>`;
// updates-section.js already injects movers-section.js at runtime. Adding a
// second script tag re-evaluated top-level const BBB_MOVER_MODES and crashed
// the embedded dynasty engine, including on player profile pages.
const moverLoader=await readFile(root+'/updates-section.js','utf8');
if(!moverLoader.includes("s.src='/movers-section.js'"))throw new Error('Market Movers runtime loader missing');
const engineWithMovers=original;
await writeFile(root+'/dynasty-engine/index.html',
  engineWithMovers.replace('</head>', '<meta name="robots" content="noindex,nofollow">'+styles+'</head>'));
const publicBuild=process.env.VERCEL_ENV==='production';

// Payment safety: the preview uses the live Supabase project. Until a truly
// isolated Stripe sandbox and membership datastore are connected, do NOT allow
// visitors (including the owner) to start a potentially live Checkout session.
// This modifies only the preview build output, never the source or production.
if(!publicBuild){
 const billingPath=root+'/bbb-plus-v1.js';
 let billingSource=await readFile(billingPath,'utf8');
 const checkoutStart=billingSource.indexOf('  async function checkout(){');
 const portalStart=billingSource.indexOf('  async function portal(){',checkoutStart);
 const followingNav=billingSource.indexOf('  function nav(){',portalStart);
 if(checkoutStart<0||portalStart<0||followingNav<0)
   throw new Error('Could not safely isolate billing handlers for payment-free preview');
 const sandboxCheckoutUrl='https://buy.stripe.com/test_fZu4gs2l73vXaRC1HT4F200';
// Keep live Supabase billing APIs entirely absent in preview bundles.
// The test link is on the isolated Stripe sandbox account and cannot grant a live entitlement.
const cardStart=billingSource.indexOf('  function card(){');
const cardEnd=billingSource.indexOf('  function markup(){',cardStart);
if(cardStart<0||cardEnd<=cardStart)throw new Error('BBB+ card markup could not be located');
let cardSource=billingSource.slice(cardStart,cardEnd);
const btnStart=cardSource.indexOf('const p=price(), active=isActive(), btn=');
const btnEnd=cardSource.indexOf(';\n    return ',btnStart);
if(btnStart<0||btnEnd<0)throw new Error('BBB+ preview checkout button not found');
cardSource=cardSource.slice(0,btnStart)+
  `const p=price(), active=isActive(), btn='<button class="bbb-plus-btn" id="bbbPlusCheckout" type="button">TEST STRIPE CHECKOUT · NO REAL CHARGE</button>'`+
  cardSource.slice(btnEnd);
cardSource=cardSource.replace(
  '<div class="bbb-plus-note">Rankings and Sleeper integration stay free.',
  '<div class="bbb-plus-note"><strong>PREVIEW TEST MODE:</strong> This uses a separate Stripe sandbox, charges no real money, and will not activate a live BBB+ subscription.<br>Rankings and Sleeper integration stay free.'
);
billingSource=billingSource.slice(0,cardStart)+cardSource+billingSource.slice(cardEnd);
// Card markup changed length; locate the payment functions again before slicing.
const safeCheckoutStart=billingSource.indexOf('  async function checkout(){');
const safePortalStart=billingSource.indexOf('  async function portal(){',safeCheckoutStart);
const safeFollowingNav=billingSource.indexOf('  function nav(){',safePortalStart);
if(safeCheckoutStart<0||safePortalStart<0||safeFollowingNav<0)
  throw new Error('Preview payment handlers missing after card transformation');
const blockedMessage='BBB+ PREVIEW: Billing management is unavailable because this environment is not connected to a test membership datastore.';
 billingSource=billingSource.slice(0,safeCheckoutStart)+
   '  // PREVIEW_PAYMENT_LOCK — No Stripe requests are made by these handlers.\n'+
   '  async function checkout(){const url='+JSON.stringify(sandboxCheckoutUrl)+';const browser=(window.top&&window.top!==window)?window.top:window;browser.location.assign(url);}\n'+
   '  async function portal(){alert('+JSON.stringify(blockedMessage)+');}\n'+
   billingSource.slice(safeFollowingNav);
 // Make the safety state clear before a member even clicks.
 // The primary preview checkout button now opens a sandbox-only Stripe URL.
 if(!billingSource.includes("TEST STRIPE CHECKOUT")||!billingSource.includes("buy.stripe.com/test_"))
   throw new Error('The BBB+ preview did not receive its sandbox checkout button');
 if(billingSource.includes("'/functions/v1/bbb-plus-checkout'")||
    billingSource.includes("'/functions/v1/bbb-plus-portal'"))
   throw new Error('Preview still contains a live payment endpoint call');
 await writeFile(billingPath,billingSource);
 console.log('BBB+ preview payments locked: no live Stripe checkout or billing portal calls.');
}

if(!publicBuild){
 const url='https://buy.stripe.com/test_fZu4gs2l73vXaRC1HT4F200';
 const instruction='<section class="bbb-preview-test-stripe" style="margin:22px auto;max-width:1080px;padding:18px;border:1px solid #3b7a55;background:#0b2417;border-radius:14px;color:#e6f6e9"><strong>STRIPE TEST MODE — NO REAL CHARGES</strong><p>This test checkout is separate from live BBB+ and does not activate a real membership. Use Stripe test card 4242 4242 4242 4242, any future expiration, any three-digit CVC, and any valid ZIP.</p><a style="color:#8ff2b4;text-decoration:underline" target="_blank" rel="noopener noreferrer" href="'+url+'">Open BBB+ sandbox checkout ↗</a></section>';
 const source=root+'/bbb-plus-v1.js';
 let src=await readFile(source,'utf8');
 src=src.replace('  function nav(){', '  function nav(){');
 src += '\n;(function(){function add(){if(!location.hash.includes("plus"))return;let v=document.querySelector("#plusView");if(v&&!v.querySelector(".bbb-preview-test-stripe")){v.insertAdjacentHTML("afterbegin",'+JSON.stringify(instruction)+');}}window.addEventListener("hashchange",()=>setTimeout(add,300));setTimeout(add,1700);setTimeout(add,3500);})();\n';
 await writeFile(source,src);
}
let preview=await readFile('scouting-preview.html','utf8');
// Preserve stylesheet cascade order while reducing six blocking CSS files to one.
// Emit a single, cacheable asset; keep original assets for existing references.
const styleSources=[
  'scouting-green.css','scouting-directory.css','scouting-profile-v5.css',
  'scouting-intelligence-v6.css','scouting-film-room-v1.css','scouting-atmosphere.css'
];
const styleText=(await Promise.all(styleSources.map(file=>readFile(file,'utf8')))).join('\n');
await writeFile(root+'/scouting-styles.css',styleText);
for(const [i,file] of styleSources.entries()){
  const originalTag='<link rel="stylesheet" href="/'+file+'">';
  if(!preview.includes(originalTag))throw new Error('Missing style link '+file);
  preview=preview.replace(originalTag,i===0?'<link rel="stylesheet" href="/scouting-styles.css">':'');
}
// Warm the public database origin before its API calls start.
preview=preview.replace('</head>',
  '<link rel="preconnect" href="https://twbduhmibbotregdxlla.supabase.co" crossorigin>'+
  '<link rel="dns-prefetch" href="//i.ytimg.com">'+
  '</head>');

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
 {src:'/player/([^/]+)/?',dest:'/scouting/$1',status:308},
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
// Validate the FINAL preview output. Earlier QA checks run before this script
// replaces the legacy index, so they cannot catch missing scouting assets.
const qaErrors=[];
const builtPreview=await readFile(root+'/index.html','utf8');
const builtEngine=await readFile(root+'/dynasty-engine/index.html','utf8');
for(const [label,doc] of [['preview',builtPreview],['dynasty engine',builtEngine]]){
 if(!doc.includes('rel="icon"')||!doc.includes('href="/favicon.png"'))
   qaErrors.push(label+': missing BBB browser favicon');
 if(!doc.includes('rel="apple-touch-icon"'))
   qaErrors.push(label+': missing BBB mobile bookmark icon');
}
const png=await readFile(root+'/favicon.png');
if(png.length<1024||png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')
 qaErrors.push('BBB favicon is missing or invalid');
if(!builtPreview.includes('src="/scouting-preview.js"'))qaErrors.push('Scouting app boot script missing');
if(!builtPreview.includes('href="/scouting-styles.css"'))qaErrors.push('Consolidated scouting CSS missing');
if(!builtEngine.includes('src="/updates-section.js"')||!moverLoader.includes("s.src='/movers-section.js'"))
  qaErrors.push('Market Movers dynamic loader missing from dynasty engine');
if(!builtEngine.includes('src="/profile-ui-redesign-preview.js"'))qaErrors.push('Player art/profile module missing from dynasty engine');
if(!builtEngine.includes('src="/bbb-plus-v1.js"'))qaErrors.push('BBB+ membership module missing from dynasty engine');
if(!builtEngine.includes('src="/account-v1-preview.js"')||!builtEngine.includes('src="/account-auth-cleanup.js"'))
 qaErrors.push('BBB account and password-recovery modules missing from dynasty engine');
const billingJs=await readFile(root+'/bbb-plus-v1.js','utf8');
if(publicBuild){
 if(!billingJs.includes('openStripePage(d.url,"checkout")')||!billingJs.includes('openStripePage(d.url,"billing")')||
    !billingJs.includes('browser.location.assign(target.href)'))
   qaErrors.push('Production Stripe checkout/portal must navigate the outer browser window');
}else{
 if(!billingJs.includes('PREVIEW_PAYMENT_LOCK')||
    !billingJs.includes('TEST STRIPE CHECKOUT')||
    !billingJs.includes('buy.stripe.com/test_')||
    billingJs.includes("'/functions/v1/bbb-plus-checkout'")||
    billingJs.includes("'/functions/v1/bbb-plus-portal'"))
   qaErrors.push('PREVIEW PAYMENT LOCK FAILED: expected sandbox-only checkout');
}
const authJs=await readFile(root+'/account-auth-cleanup.js','utf8');
if(!authJs.includes('/auth/v1/recover')||!authJs.includes('handleAuthCallback'))
 qaErrors.push('Account confirmation/reset callbacks missing');
const signupJs=await readFile(root+'/account-v1-preview.js','utf8');
if(!signupJs.includes("signup?redirect_to=\u0024{encodeURIComponent(callbackUrl)}")||
   !signupJs.includes("bbbAccountReturnOrigin()+'/account'"))
 qaErrors.push('Signup confirmation must use stable BBB callback URL');
if(!authJs.includes('bbbAccountReturnOrigin()}/account?'))
 qaErrors.push('Password resets must use stable BBB account callback URL');
try{
 const a=signupJs.indexOf('const BBB_PREVIEW_AUTH_BRANCH=');
 const b=signupJs.indexOf('let bbbAccountSession=',a);
 if(a<0||b<a)throw new Error('Account return-origin helper missing');
 const callbackCode=signupJs.slice(a,b)+'; bbbAccountReturnOrigin()';
 const stable='https://bobbys-big-board-v2-git-preview-scou-92f477-bobbywilsonbtw-2065.vercel.app';
 const originFor=(hostname,origin)=>runInNewContext(callbackCode,{location:{hostname,origin}},{timeout:1000});
 if(originFor('bobbys-big-board-v2-ihwj4i4gi-bobbywilsonbtw-2065.vercel.app','https://bobbys-big-board-v2-ihwj4i4gi-bobbywilsonbtw-2065.vercel.app')!==stable||
    originFor('bobbys-big-board-v2-git-preview-scou-92f477-bobbywilsonbtw-2065.vercel.app',stable)!==stable||
    originFor('bobbysbigboard.com','https://bobbysbigboard.com')!=='https://bobbysbigboard.com')
   throw new Error('Stable preview and live-domain redirect selection failed');
 console.log('Auth redirect behavioral QA passed: immutable preview branch URL and official production domain.');
}catch(error){qaErrors.push('Account redirect behavioral QA failed: '+error.message)}
if(!authJs.includes('showAuthLinkError')||!authJs.includes("params.has('error_description')")||
   !authJs.includes('Never keep an invalid token'))
 qaErrors.push('Expired confirmation/password-reset links must clear tokens and show an error');
const scoutingJs=await readFile(root+'/scouting-preview.js','utf8');
if(!scoutingJs.includes('(?:access_token|error|error_description)'))
 qaErrors.push('Outer scouting routes must forward failed auth callbacks to account page');

if(!scoutingJs.includes('checkoutSearch+"#"+which'))
 qaErrors.push('Stripe checkout return not forwarded to BBB+ embedded account');

// Exercise the actual shipped Film Room catalog code, not a duplicate
// implementation. This catches unpublished, orphaned and duplicate videos
// leaking into either the Film Room or individual player profiles.
try {
 const filmJs=await readFile(root+'/scouting-film-room-v1.js','utf8');
 const isolated={};
 runInNewContext(filmJs,{window:isolated,sessionStorage:{getItem:()=>null},document:{}},{timeout:1500});
 const buildCatalog=isolated.BBB_FILM_ROOM?.catalog;
 if(typeof buildCatalog!=='function')throw new Error('film catalog factory unavailable');
 const profiles=[
  {player_key:'qa-nfl',name:'QA NFL Player',team:'NYJ',pos:'RB',draft_year:2024},
  {player_key:'qa-prospect',name:'QA Prospect',team:'',pos:'WR',draft_year:2028}
 ];
 const prospects=[{player_key:'qa-prospect',year:2028}];
 const approved=[
  {video_id:'abcDEFGHijk',player_key:'qa-nfl',title:'Published NFL Film',video_type:'rookie_film',editorial_status:'approved',created_at:'2026-10-20T00:00:00Z'},
  {video_id:'XYZabcdef12',player_key:'qa-prospect',title:'Published Prospect Film',video_type:'prospect_breakdown',editorial_status:'approved',created_at:'2026-10-22T00:00:00Z'},
  {video_id:'12345678901',player_key:'qa-nfl',title:'Private draft must stay hidden',editorial_status:'draft'},
  {video_id:'short',player_key:'qa-nfl',title:'Bad ID must stay hidden',editorial_status:'approved'},
  {video_id:'abcDEFGHijk',player_key:'qa-nfl',title:'Duplicate must stay hidden',editorial_status:'approved'},
  {video_id:'abcdefghijkl',player_key:'qa-missing',title:'Orphan must stay hidden',editorial_status:'approved'}
 ];
 const catalog=buildCatalog(approved,[],profiles,prospects);
 if(catalog.length!==2||
    catalog[0].video_id!=='XYZabcdef12'||
    catalog[0].category!=='prospect'||
    catalog[1].video_id!=='abcDEFGHijk'||
    catalog[1].category!=='nfl')
   throw new Error('published film filtering, matching, sort or category failed');
 console.log('Film Room behavioral QA passed: approved-only, player matching, ID/duplicate guards, categories, newest-first.');
}catch(error){qaErrors.push('Film Room behavioral QA failed: '+error.message)}

const assetChecks=['scouting-preview.js','scouting-styles.css','scouting-profile-v5.js',
 'scouting-intelligence-v6.js','scouting-film-room-v1.js','scouting-samples.js',
 'scouting-headshots.json','bbb-core.js','movers-section.js',
 'profile-ui-redesign-preview.js','dynasty-engine/index.html'];
for(const asset of assetChecks){
 try{const bytes=await readFile(root+'/'+asset);if(bytes.length<50)qaErrors.push(asset+': unexpectedly empty')}
 catch(error){qaErrors.push(asset+': missing ('+error.code+')')}
}
try{
 const headshots=JSON.parse(await readFile(root+'/scouting-headshots.json','utf8'));
 if(Object.keys(headshots.players||{}).length<450)qaErrors.push('Player PNG manifest coverage unexpectedly low');
}catch(error){qaErrors.push('Player PNG manifest invalid: '+error.message)}
if(!config.routes.some(route=>route.src.startsWith('/scouting/')))
 qaErrors.push('Scouting profile deep-link routing missing');
if(!config.routes.some(route=>route.src.includes('/dynasty/')))
 qaErrors.push('Dynasty tools routing missing');
if(qaErrors.length)throw new Error('Preview launch checks failed:\\n'+qaErrors.join('\\n'));
console.log('Final preview QA passed: favicon, '+assetChecks.length+' app assets, player headshots, embedded movers/profile modules and deep-link routes.');
console.log('Unified BBB scouting preview, green identity, dynamic ESPN headshots and integrated dynasty tools built. No production deployment.');
