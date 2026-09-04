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
  ['homepage-structure.js','src="/homepage-structure.js"']
];

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
let patched=0;
for(const file of pages){
  let html=await readFile(file,'utf8');
  if(!html.includes('</body>'))throw new Error(`Client feature bundle failed: ${file} has no closing body tag`);
  const missing=features.filter(([,marker])=>!html.includes(marker));
  if(!missing.length)continue;
  const scripts=missing.map(([name])=>`<script src="/${name}"></script>`).join('');
  html=html.replace('</body>',`${scripts}</body>`);
  await writeFile(file,html);
  patched++;
}

console.log(`Bundled Watchlist V1, streamlined navigation, Profile Snapshot V1, final profile polish, profile density polish, fantasy season/game-log profiles, preview fantasy-profile fixes, trade calculator copy polish, Global Player Search V1, Daejon Love easter egg, search UI polish, Opportunity Feed V1, and homepage structure polish into ${patched} generated HTML pages.`);
