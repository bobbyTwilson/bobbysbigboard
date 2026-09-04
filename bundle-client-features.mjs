import {cp,readdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

const root='.vercel/output/static';
const features=[
  ['watchlist.js','src="/watchlist.js"'],
  ['nav-polish.js','src="/nav-polish.js"'],
  ['profile-snapshot.js','src="/profile-snapshot.js"'],
  ['profile-polish.js','src="/profile-polish.js"'],
  ['profile-density.js','src="/profile-density.js"'],
  ['profile-fantasy-stats.js','src="/profile-fantasy-stats.js"'],
  ['profile-fantasy-preview-fix.js','src="/profile-fantasy-preview-fix.js"'],
  ['trade-copy-polish.js','src="/trade-copy-polish.js"'],
  ['global-search.js','src="/global-search.js"'],
  ['easter-egg-player.js','src="/easter-egg-player.js"'],
  ['search-polish.js','src="/search-polish.js"'],
  ['opportunity-feed.js','src="/opportunity-feed.js"'],
  ['homepage-structure.js','src="/homepage-structure.js"'],
  ['deep-link-routing-fix.js','src="/deep-link-routing-fix.js"'],
  ['player-deep-link-guard.js','src="/player-deep-link-guard.js"'],
  ['profile-render-gate.js','src="/profile-render-gate.js"']
];

const playerBootGuard=`<script id="bbb-player-boot-guard">if(/^\\/player\\/[^/?#]+\\/?$/.test(location.pathname))document.documentElement.classList.add('bbb-player-boot')</script><style id="bbb-player-boot-styles">html.bbb-player-boot #rankingsView,html.bbb-player-boot #rookieView,html.bbb-player-boot #prospectView,html.bbb-player-boot #tradeView,html.bbb-player-boot #compareView,html.bbb-player-boot #updatesView,html.bbb-player-boot #moversView,html.bbb-player-boot #watchlistView,html.bbb-player-boot #opportunityView{display:none!important}html.bbb-player-boot #profileView{display:block!important;min-height:72vh}html.bbb-player-boot #profileMount{min-height:62vh}html.bbb-player-boot #profileMount:empty:before{content:'Loading player profile…';display:grid;place-items:center;min-height:52vh;color:#819188;font-size:12px;font-weight:800;background:#050807}</style>`;

for(const [file] of features)await cp(file,join(root,file));

async function htmlFiles(dir){
  const entries=await readdir(dir,{withFileTypes:true});
  const out=[];
  for(const entry of entries){
    const path=join(dir,entry.name);
    if(entry.isDirectory())out.push(...await htmlFiles(path));
    else if(entry.isFile()&&entry.name.endsWith('.html'))out.push(path);
  }
  return out;
}

const pages=await htmlFiles(root);
let patched=0,playerBootPatched=0;
for(const file of pages){
  let html=await readFile(file,'utf8');
  if(!html.includes('</body>'))throw new Error(`Client feature bundle failed: ${file} has no closing body tag`);

  if(file.includes(`${root}/seo/players/`)&&!html.includes('id="bbb-player-boot-guard"')){
    if(!html.includes('</head>'))throw new Error(`Client feature bundle failed: ${file} has no closing head tag`);
    html=html.replace('</head>',`${playerBootGuard}</head>`);
    playerBootPatched++;
  }

  const missing=features.filter(([,marker])=>!html.includes(marker));
  if(missing.length){
    const scripts=missing.map(([name])=>`<script src="/${name}"></script>`).join('');
    html=html.replace('</body>',`${scripts}</body>`);
  }

  if(missing.length||file.includes(`${root}/seo/players/`)){
    await writeFile(file,html);
    patched++;
  }
}

console.log(`Bundled Watchlist V1, streamlined navigation, Profile Snapshot V1, final profile polish, profile density polish, fantasy season/game-log profiles, preview fantasy-profile fixes, trade calculator copy polish, Global Player Search V1, Daejon Love easter egg, search UI polish, Opportunity Feed V1, homepage structure polish, hardened player deep-link routing, and the no-flash profile render gate into ${patched} generated HTML pages (${playerBootPatched} player boot guards).`);
