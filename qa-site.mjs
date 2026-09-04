import {access,readdir,readFile} from 'node:fs/promises';
import {join,basename} from 'node:path';

const root='.vercel/output/static';
const failures=[];
const warnings=[];
const stats={html:0,players:0,scriptsChecked:0,duplicateIds:0};

async function exists(path){try{await access(path);return true}catch{return false}}
async function walk(dir){
  const entries=await readdir(dir,{withFileTypes:true});
  const out=[];
  for(const entry of entries){
    const path=join(dir,entry.name);
    if(entry.isDirectory())out.push(...await walk(path));
    else out.push(path);
  }
  return out;
}
function uniq(xs){return [...new Set(xs)]}
function matches(text,re){return [...text.matchAll(re)].map(m=>m[1])}

const files=await walk(root);
const htmlFiles=files.filter(f=>f.endsWith('.html'));
const fileSet=new Set(files);
stats.html=htmlFiles.length;

for(const file of htmlFiles){
  const html=await readFile(file,'utf8');
  const rel=file.slice(root.length).replaceAll('\\','/');
  const isPlayer=rel.startsWith('/seo/players/');
  if(isPlayer)stats.players++;

  if(!/<head[\s>]/i.test(html)||!/<\/head>/i.test(html)||!/<body[\s>]/i.test(html)||!/<\/body>/i.test(html))failures.push(`${rel}: malformed document shell`);
  if(/docs\.google\.com\/spreadsheets/i.test(html))failures.push(`${rel}: legacy Google Sheets runtime reference`);

  const ids=matches(html,/\sid=["']([^"']+)["']/gi);
  const seen=new Set();
  for(const id of ids){if(seen.has(id)){stats.duplicateIds++;failures.push(`${rel}: duplicate id #${id}`)}seen.add(id)}

  const scripts=matches(html,/<script[^>]+src=["']([^"']+)["']/gi);
  const dupScripts=scripts.filter((s,i)=>scripts.indexOf(s)!==i);
  if(dupScripts.length)failures.push(`${rel}: duplicate scripts ${uniq(dupScripts).join(', ')}`);
  for(const src of scripts){
    if(!src.startsWith('/')||src.startsWith('//'))continue;
    if(src.startsWith('/_vercel/'))continue;
    const clean=src.split(/[?#]/)[0];
    stats.scriptsChecked++;
    if(!fileSet.has(join(root,clean)))failures.push(`${rel}: missing local script ${clean}`);
  }

  if(isPlayer){
    const slug=basename(file,'.html');
    if(!html.includes('id="bbb-player-boot-guard"'))failures.push(`${rel}: missing early player boot guard`);
    if(!html.includes('src="/profile-render-gate.js"'))failures.push(`${rel}: missing final profile render gate`);
    if(!html.includes('src="/player-deep-link-guard.js"'))failures.push(`${rel}: missing mobile deep-link guard`);
    const noindex=/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html);
    const canonical=html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]||'';
    const expected=`https://bobbysbigboard.com/player/${slug}`;
    if(!noindex&&canonical!==expected)failures.push(`${rel}: canonical mismatch (${canonical||'missing'})`);
    if(noindex&&canonical&&canonical!==expected)warnings.push(`${rel}: noindex special page canonical points to ${canonical}`);
    if(!/<title>[^<]+\| Bobby(?:&#39;|')s Big Board<\/title>/i.test(html)&&slug!=='daejon-love')warnings.push(`${rel}: unexpected player title format`);
  }
}

const config=JSON.parse(await readFile('.vercel/output/config.json','utf8'));
const routeSources=new Set((config.routes||[]).map(r=>r.src).filter(Boolean));
for(const route of ['/rankings/?','/rookies/?','/prospects/?','/trade/?','/compare/?','/movers/?','/updates/?','/player/([^/]+)/?']){
  if(!routeSources.has(route))failures.push(`routing: missing ${route}`);
}

const sitemap=await readFile(join(root,'sitemap.xml'),'utf8');
const sitemapPlayers=(sitemap.match(/<loc>https:\/\/bobbysbigboard\.com\/player\//g)||[]).length;
const indexedPlayerFiles=htmlFiles.filter(f=>f.includes(`${join(root,'seo/players')}`)).filter(async()=>true).length;
if(sitemapPlayers<500)failures.push(`sitemap: only ${sitemapPlayers} player URLs`);
if(stats.players<sitemapPlayers)failures.push(`player routes: ${stats.players} HTML pages for ${sitemapPlayers} sitemap URLs`);

const index=await readFile(join(root,'index.html'),'utf8');
for(const marker of ['id="rankingsView"','id="rookieView"','id="prospectView"','id="tradeView"','id="profileView"','src="/global-search.js"','src="/watchlist.js"','src="/compare-section.js"','src="/opportunity-feed.js"']){
  if(!index.includes(marker))failures.push(`homepage: missing ${marker}`);
}

if(warnings.length){
  console.log(`QA warnings (${warnings.length}):`);
  warnings.slice(0,25).forEach(x=>console.log(`  - ${x}`));
  if(warnings.length>25)console.log(`  ... ${warnings.length-25} more`);
}
if(failures.length){
  console.error(`QA FAILED (${failures.length} issues):`);
  failures.slice(0,50).forEach(x=>console.error(`  - ${x}`));
  if(failures.length>50)console.error(`  ... ${failures.length-50} more`);
  process.exit(1);
}

console.log(`QA passed: ${stats.html} HTML documents, ${stats.players} player pages, ${sitemapPlayers} indexed player URLs, ${stats.scriptsChecked} local script references checked, 0 duplicate IDs, routing/config/profile boot guards all valid.`);
