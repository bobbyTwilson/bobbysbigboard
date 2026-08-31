import { cp, mkdir, rm, writeFile } from 'node:fs/promises';

const out='.vercel/output';
const baseline='https://bobbys-big-board-v2-pmu5e6526-bobbywilsonbtw-2065.vercel.app';

await rm(out,{recursive:true,force:true});
await mkdir(`${out}/static`,{recursive:true});

const response=await fetch(baseline);
if(!response.ok)throw new Error(`Could not fetch production baseline: ${response.status}`);
let html=await response.text();

const analytics=`<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments);};</script><script defer src="/_vercel/insights/script.js"></script>`;

html=html
  .replaceAll('Google Sheet synced','Supabase SQL synced')
  .replaceAll('Sheet-backed database','SQL-backed database')
  .replaceAll("The rookie order updates directly from Bobby's sheet.","The rookie order updates directly from Bobby's database.")
  .replaceAll("Bobby's live Draft Pick Values sheet","Bobby's live SQL database")
  .replace('<a href="#trade">Trade Calculator</a>','')
  .replace('</body>',`${analytics}<script src="/supabase-override.js"></script><script src="/profile-overview-fix.js"></script><script src="/updates-section.js"></script></body>`);

await writeFile(`${out}/static/index.html`,html);
await cp('supabase-override.js',`${out}/static/supabase-override.js`);
await cp('profile-overview-fix.js',`${out}/static/profile-overview-fix.js`);
await cp('updates-section.js',`${out}/static/updates-section.js`);
await cp('movers-section.js',`${out}/static/movers-section.js`);
await writeFile(`${out}/config.json`,JSON.stringify({
  version:3,
  routes:[
    {src:'/player/.*',dest:'/index.html'},
    {handle:'filesystem'},
    {src:'/.*',dest:'/index.html'}
  ]
},null,2));

console.log("Built production-identical Bobby's Big Board UI with Supabase data layer, player updates, board movers, and Vercel Web Analytics.");
