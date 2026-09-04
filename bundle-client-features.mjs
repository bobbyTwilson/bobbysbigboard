import {cp,readdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

const root='.vercel/output/static';
const marker='src="/watchlist.js"';
const navMarker='src="/nav-polish.js"';
const scripts='<script src="/watchlist.js"></script><script src="/nav-polish.js"></script>';

await cp('watchlist.js',join(root,'watchlist.js'));
await cp('nav-polish.js',join(root,'nav-polish.js'));

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
  if(html.includes(marker)&&html.includes(navMarker))continue;
  if(!html.includes('</body>'))throw new Error(`Client feature bundle failed: ${file} has no closing body tag`);
  if(html.includes(marker)&&!html.includes(navMarker))html=html.replace('</body>','<script src="/nav-polish.js"></script></body>');
  else html=html.replace('</body>',`${scripts}</body>`);
  await writeFile(file,html);
  patched++;
}

console.log(`Bundled Watchlist V1 and streamlined navigation into ${patched} generated HTML pages.`);
