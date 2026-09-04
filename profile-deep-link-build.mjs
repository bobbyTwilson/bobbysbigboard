import {access,mkdir,readFile,writeFile} from 'node:fs/promises';

const ROOT='.vercel/output/static';
const PLAYER_DIR=`${ROOT}/seo/players`;
const SITE='https://bobbysbigboard.com';
const SUPABASE='https://twbduhmibbotregdxlla.supabase.co';
const SUPABASE_KEY='sb_publishable_R3-rucNypGm1DPd4LHV-0A_wIoT0jBS';

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function slug(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/['’.]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function stripSeo(doc){
  return doc
    .replace(/<title[^>]*>[\s\S]*?<\/title>/i,'')
    .replace(/<meta[^>]+name=["']description["'][^>]*>/gi,'')
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi,'')
    .replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>/gi,'')
    .replace(/<meta[^>]+name=["']twitter:[^"']+["'][^>]*>/gi,'')
    .replace(/<script[^>]+id=["']bbb-seo-jsonld["'][^>]*>[\s\S]*?<\/script>/gi,'');
}
function withSeo(doc,p){
  const path=`/player/${p.key}`;
  const url=SITE+path;
  const context=[p.pos,p.team].filter(Boolean).join(' • ');
  const description=`${p.name} dynasty fantasy football profile.${context?' '+context+'.':''} Rankings, player updates, prospect context, and Bobby's Big Board dynasty analysis.`;
  const image=SITE+'/bbb-share.webp';
  const tags=`<title>${esc(p.name)} Dynasty Profile | Bobby's Big Board</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(url)}"><meta property="og:site_name" content="Bobby's Big Board"><meta property="og:type" content="profile"><meta property="og:title" content="${esc(p.name)} Dynasty Profile | Bobby's Big Board"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(url)}"><meta property="og:image" content="${image}"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="${esc(p.name)} Dynasty Profile | Bobby's Big Board"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${image}"><script id="bbb-seo-jsonld" type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'WebPage',name:`${p.name} Dynasty Profile`,url,description,about:{'@type':'Person',name:p.name}}).replace(/</g,'\\u003c')}</script>`;
  return stripSeo(doc).replace('</head>',tags+'</head>');
}
async function supa(table,query){
  const r=await fetch(`${SUPABASE}/rest/v1/${table}?${query}`,{headers:{apikey:SUPABASE_KEY}});
  if(!r.ok)throw new Error(`Supabase ${table} ${r.status}`);
  return r.json();
}
async function exists(path){try{await access(path);return true}catch{return false}}

await mkdir(PLAYER_DIR,{recursive:true});
const index=await readFile(`${ROOT}/index.html`,'utf8');
const [dynasty,rookies,prospects,profiles]=await Promise.all([
  supa('site_dynasty','select=player_key,name,pos,team'),
  supa('site_rookies','select=player_key,name,pos,team'),
  supa('site_prospects','select=player_key,name,pos,year'),
  supa('site_profiles','select=player_key,name,pos,team')
]);

const merged=new Map();
function add(row){
  if(!row?.name)return;
  const key=String(row.player_key||slug(row.name)).trim();
  if(!key)return;
  const current=merged.get(key)||{key,name:row.name,pos:'',team:''};
  if(!current.name)current.name=row.name;
  if(!current.pos&&row.pos)current.pos=row.pos;
  if(!current.team&&row.team)current.team=row.team;
  merged.set(key,current);
}
[dynasty,rookies,prospects,profiles].forEach(rows=>rows.forEach(add));

let created=0;
for(const p of merged.values()){
  const file=`${PLAYER_DIR}/${p.key}.html`;
  if(await exists(file))continue;
  await writeFile(file,withSeo(index,p));
  created++;
}

// Keep every generated player URL discoverable and shareable, not just the
// current Top 500 subset used by the original sitemap pass.
const sitemapPath=`${ROOT}/sitemap.xml`;
let sitemap=await readFile(sitemapPath,'utf8');
const lastmod=new Date().toISOString().slice(0,10);
const missing=[...merged.values()].filter(p=>!sitemap.includes(`${SITE}/player/${p.key}`));
if(missing.length){
  const rows=missing.map(p=>`  <url><loc>${SITE}/player/${p.key}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n');
  sitemap=sitemap.replace('</urlset>',`${rows}\n</urlset>`);
  await writeFile(sitemapPath,sitemap);
}

console.log(`Deep-link build ensured ${merged.size} player routes; created ${created} missing profile pages.`);
