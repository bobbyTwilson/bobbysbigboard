import { cp, mkdir, rm, writeFile } from 'node:fs/promises';

const out='.vercel/output';
const baseline='https://bobbys-big-board-v2-pmu5e6526-bobbywilsonbtw-2065.vercel.app';

await rm(out,{recursive:true,force:true});
await mkdir(`${out}/static`,{recursive:true});

const response=await fetch(baseline);
if(!response.ok)throw new Error(`Could not fetch production baseline: ${response.status}`);
let html=await response.text();

const analytics=`<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments);};</script><script defer src="/_vercel/insights/script.js"></script>`;
const moverNavFix=`<script>document.addEventListener('click',e=>{if(e.target.closest('.bbb-mover-row,.bbb-mover-card'))document.querySelector('#moversView')?.classList.add('hide')},true);</script>`;
const comparePolish=`<style>.bbb-compare-swap{border:1px solid #2e503f;background:#0b1712;color:#8fe1b2;border-radius:999px;width:48px;height:48px;display:grid;place-items:center;cursor:pointer;font-weight:950;font-size:18px}.bbb-compare-swap:hover{border-color:#50ce8e;color:#fff}@media(max-width:850px){.bbb-compare-swap{width:42px;height:42px}}</style><script>bbbCompareTopTraits=function(p){const pos=p?.prospect?.pos||'';return Object.entries(p?.prospect?.traits||{}).map(([head,raw])=>{const value=bbbCompareNum(raw);const name=typeof profileCleanTrait==='function'?profileCleanTrait(head):head;const max=typeof profileTraitMax==='function'?profileTraitMax(pos,name,head):(/Speed|Acceleration|Analytics/.test(name)?10:5);return{name,value,max,pct:value==null?0:value/max}}).filter(x=>x.value!=null&&!/projected draft capital/i.test(x.name)).sort((a,b)=>b.pct-a.pct||b.value-a.value).slice(0,3)};const bbbCompareRenderOriginal=bbbCompareRender;bbbCompareRender=function(){bbbCompareRenderOriginal();const vs=document.querySelector('.bbb-compare-vs');if(vs&&(bbbCompareLeft||bbbCompareRight)){vs.innerHTML='<button type="button" class="bbb-compare-swap" aria-label="Swap compared players">⇄</button>';vs.querySelector('button').onclick=()=>{[bbbCompareLeft,bbbCompareRight]=[bbbCompareRight,bbbCompareLeft];bbbCompareRender()}}};</script>`;

html=html
  .replaceAll('Google Sheet synced','Supabase SQL synced')
  .replaceAll('Sheet-backed database','SQL-backed database')
  .replaceAll("The rookie order updates directly from Bobby's sheet.","The rookie order updates directly from Bobby's database.")
  .replaceAll("Bobby's live Draft Pick Values sheet","Bobby's live SQL database")
  .replace('<a href="#trade">Trade Calculator</a>','')
  .replace('</body>',`${analytics}<script src="/supabase-override.js"></script><script src="/profile-overview-fix.js"></script><script src="/updates-section.js"></script><script src="/compare-section.js"></script><script src="/profile-v2.js"></script><script src="/profile-v2-data-fix.js"></script>${comparePolish}${moverNavFix}</body>`);

await writeFile(`${out}/static/index.html`,html);
await cp('supabase-override.js',`${out}/static/supabase-override.js`);
await cp('profile-overview-fix.js',`${out}/static/profile-overview-fix.js`);
await cp('updates-section.js',`${out}/static/updates-section.js`);
await cp('movers-section.js',`${out}/static/movers-section.js`);
await cp('compare-section.js',`${out}/static/compare-section.js`);
await cp('profile-v2.js',`${out}/static/profile-v2.js`);
await cp('profile-v2-data-fix.js',`${out}/static/profile-v2-data-fix.js`);
await writeFile(`${out}/config.json`,JSON.stringify({
  version:3,
  routes:[
    {src:'/player/.*',dest:'/index.html'},
    {handle:'filesystem'},
    {src:'/.*',dest:'/index.html'}
  ]
},null,2));

console.log("Built production-identical Bobby's Big Board UI with Supabase data layer, player updates, board movers, player compare, Profile V2, resilient profile data loading, and Vercel Web Analytics.");
