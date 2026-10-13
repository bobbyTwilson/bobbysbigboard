/* Prefer BBB's established high-confidence ESPN player ID mappings.
   Prospect IDs only come from the manually sourced ESPN candidate registry. */
import {readFile,writeFile} from 'node:fs/promises';
const file='.vercel/output/static/scouting-headshots.json';
const url=process.env.BBB_SUPABASE_URL,key=process.env.BBB_SUPABASE_KEY;
const validId=v=>/^[0-9]{4,12}$/.test(String(v||''));
const out={},meta={nflFromVerifiedMappings:0,collegeCandidates:0,errors:[]};
try{
 const existing=JSON.parse(await readFile('scouting-espn-verified-ids.json','utf8'));
 for(const [playerKey,id] of Object.entries(existing.players||{})){
  if(!playerKey||!validId(id))continue;
  out[playerKey]={url:'https://a.espncdn.com/i/headshots/nfl/players/full/'+id+'.png',id,league:'nfl',source:'Existing verified BBB ESPN identifier',confidence:'verified'};
  meta.nflFromVerifiedMappings++;
 }
}catch(e){meta.errors.push('Existing ESPN mapping file: '+String(e.message))}
try{
 const seed=JSON.parse(await readFile('scouting-espn-seeds.json','utf8'));
 for(const [slug,p] of Object.entries(seed.players||{})){
  if(out[slug]||!p.id||!validId(p.id))continue;
  // Candidate images can be replaced once ESPN identity and licensing checks complete.
  out[slug]={url:'https://a.espncdn.com/i/headshots/'+p.league+'/players/full/'+p.id+'.png',id:p.id,league:p.league,source:'ESPN profile candidate',confidence:'preview-only'};
  meta.collegeCandidates++;
 }
}catch(e){meta.errors.push(String(e.message))}
await writeFile(file,JSON.stringify({players:out,metadata:meta}));
console.log('ESPN player imagery:',meta.nflFromVerifiedMappings,'high-confidence NFL player IDs,',meta.collegeCandidates,'supplemental candidate IDs.');
