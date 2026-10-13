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
const preview=await readFile('scouting-preview.html','utf8');
await writeFile(root+'/index.html',preview);
await copyFile('scouting-preview.js',root+'/scouting-preview.js');
await copyFile('scouting-samples.js',root+'/scouting-samples.js');
await copyFile('scouting-green.css',root+'/scouting-green.css');
await copyFile('scouting-directory.css',root+'/scouting-directory.css');
await copyFile('scouting-profile-v5.js',root+'/scouting-profile-v5.js');
await copyFile('scouting-profile-v5.css',root+'/scouting-profile-v5.css');
await copyFile('scouting-intelligence-v6.js',root+'/scouting-intelligence-v6.js');
await copyFile('scouting-intelligence-v6.css',root+'/scouting-intelligence-v6.css');
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
let config=JSON.parse(await readFile('.vercel/output/config.json','utf8'));
config.routes=[
 {src:'/players/?',dest:'/index.html'},
 {src:'/film/?',dest:'/index.html'},
 {src:'/draft/?',dest:'/index.html'},
 {src:'/scouting/([^/]+)/?',dest:'/index.html'},
 {src:'/dynasty/?',dest:'/index.html'},
 {src:'/dynasty/(rankings|trade|compare|rookies|movers|updates)/?',dest:'/index.html'},
 {src:'/dynasty-engine/?',dest:'/dynasty-engine/index.html'},
 ...config.routes
];
await writeFile('.vercel/output/config.json',JSON.stringify(config,null,2));
await writeFile(root+'/robots.txt','User-agent: *\nDisallow: /\n');
console.log('Unified BBB scouting preview, green identity, dynamic ESPN headshots and integrated dynasty tools built. No production deployment.');
