/* Build-time ESPN headshot matching for the preview. Does not modify Supabase or rehost ESPN images.
   Exact athlete name, college/team and position matching. Unmatched names have no image. */
import {readFile,writeFile} from 'node:fs/promises';
const out='.vercel/output/static/scouting-headshots.json';
const url=process.env.BBB_SUPABASE_URL,apikey=process.env.BBB_SUPABASE_KEY;
const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]/g,'');
const text=s=>String(s||'').trim();
const get=async(path,ms=6000)=>{
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),ms);
 try{const r=await fetch(path,{signal:ctl.signal,headers:{'accept':'application/json','user-agent':'BBB scouting preview/1.0'}});if(!r.ok)throw Error(String(r.status));return await r.json()}finally{clearTimeout(timer)}
};
const fetchDb=async(table,params)=>get(url+'/rest/v1/'+table+'?'+params,8000).catch(()=>[]);
let outMap={},log={nfl:0,college:0,matchedNfl:0,matchedCollege:0,unavailable:[]};
try{const seeds=JSON.parse(await readFile('scouting-espn-seeds.json','utf8'));outMap={...(seeds.players||{})};log.confirmedProfiles=Object.keys(outMap).length;}catch(error){console.warn('Could not load ESPN identity matches',error.message)}
if(!url||!apikey){await writeFile(out,JSON.stringify({players:outMap,metadata:log}));process.exit(0)}
async function readPublic(table,query){const r=await fetch(url+'/rest/v1/'+table+'?'+query,{headers:{apikey}});if(!r.ok)throw Error('Supabase '+table+' '+r.status);return await r.json()}
const [players,prospects]=await Promise.all([readPublic('site_profiles','select=player_key,name,pos,team,college,draft_year&limit=1000'),readPublic('site_prospects','select=player_key,year&limit=300')]);
const futureKeys=new Set(prospects.filter(p=>Number(p.year)>=2027).map(p=>p.player_key));
const matchTable=new Map();for(const p of players){const k=norm(p.name);if(!matchTable.has(k))matchTable.set(k,[]);matchTable.get(k).push(p)}
const collegeSchools=new Set(players.filter(p=>futureKeys.has(p.player_key)).map(p=>norm(p.college)).filter(Boolean));
const normalizeSchool=s=>norm(String(s||'').replace(/^University of /i,'').replace(/^The /i,'').replace(/^(University|College) /i,''));
const alias={olemiss:'mississippi',lsu:'louisianastate',miami:'miamifl',usf:'southflorida',usc:'southerncalifornia',pitt:'pittsburgh',smu:'southernmethodist',utsa:'texassanantonio',tcu:'texaschristian',ucf:'centralflorida'};
function sameSchool(a,b){let x=normalizeSchool(a),y=normalizeSchool(b);if(x===y)return true;return alias[x]===y||alias[y]===x}
function walk(value,acc,depth=0){if(!value||depth>7)return;if(Array.isArray(value)){for(const x of value)walk(x,acc,depth+1);return}if(typeof value!=='object')return;
 if((value.fullName||value.displayName)&&value.id&&(value.headshot?.href||value.headshot?.url)){acc.push(value)}
 for(const [k,v] of Object.entries(value)){if(k==='stats'||k==='statistics'||k==='events'||k==='links'||k==='logos')continue;if(v&&typeof v==='object')walk(v,acc,depth+1)}
}
function position(o){return norm(typeof o.position==='string'?o.position:o.position?.abbreviation||'')}
function matches(athlete,league,team){const candidates=matchTable.get(norm(athlete.fullName||athlete.displayName||''))||[];
 const matches=candidates.filter(p=>{
  if(p.pos&&position(athlete)&&norm(p.pos)!==position(athlete))return false;
  if(league==='nfl'){if(futureKeys.has(p.player_key))return false;return norm(p.team)===norm(team.abbreviation)}
  if(!futureKeys.has(p.player_key))return false;
  return sameSchool(p.college,team.location||team.displayName||team.shortDisplayName)
 });return matches.length===1?matches[0]:null}
function add(athlete,league,team){const p=matches(athlete,league,team);if(!p)return;const href=athlete.headshot?.href||athlete.headshot?.url;if(!/^https:\/\/(a\.)?espncdn\.com\//.test(href||''))return;
 outMap[p.player_key]={url:href,id:String(athlete.id),league,source:'ESPN team roster',team:league==='nfl'?team.abbreviation:team.location};
 if(league==='nfl')log.matchedNfl++;else log.matchedCollege++}
async function teamsFor(league){const data=await get('https://site.api.espn.com/apis/site/v2/sports/football/'+league+'/teams?limit=400',9000);return (data.sports||[]).flatMap(s=>(s.leagues||[]).flatMap(l=>(l.teams||[]).map(t=>t.team||t)))}
let tasks=[];
for(const league of ['nfl','college-football']){
 try{const teams=await teamsFor(league);let targeted=league==='nfl'?teams:teams.filter(t=>[...collegeSchools].some(c=>sameSchool(c,t.location||t.displayName||t.shortDisplayName)));
 log[league==='nfl'?'nfl':'college']=targeted.length;
 tasks.push(...targeted.map(team=>({league,team})));
 }catch(e){log.unavailable.push(league+': teams '+String(e.message))}
}
let cursor=0;
async function worker(){while(cursor<tasks.length){const {league,team}=tasks[cursor++];try{const data=await get('https://site.api.espn.com/apis/site/v2/sports/football/'+league+'/teams/'+team.id+'/roster',8000);const athletes=[];walk(data.athletes||data,athletes);for(const athlete of athletes)add(athlete,league,team)}catch(e){log.unavailable.push(league+':'+team.id+':'+String(e.message))}}}
await Promise.all(Array.from({length:8},()=>worker()));
await writeFile(out,JSON.stringify({players:outMap,metadata:log},null,2));
console.log('ESPN preview headshot matching:',Object.keys(outMap).length,'verified player matches,',log.matchedCollege,'college matches for 2027/2028,',log.unavailable.length,'endpoint issues');
