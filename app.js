const SUPABASE_URL='https://twbduhmibbotregdxlla.supabase.co';
const SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3YmR1aG1pYmJvdHJlZ2R4bGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNjAzODgsImV4cCI6MjEwMzczNjM4OH0.HJSyCcZop9KJXB2NY-nIsPYMw6ra5RQgKxCYQL821NQ';
const API=`${SUPABASE_URL}/rest/v1`;
const headers={apikey:SUPABASE_KEY};
let dynasty=[],rookies=[],prospects=[],picks=[],profiles=[];
let dPos='ALL',dQ='',dMarket='ALL',dVisible=50;
let rPos='ALL',rQ='',rTier='ALL',rVisible=50;
let pPos='ALL',pQ='',pYear='ALL',pVisible=50;
let tradeA=[],tradeB=[];
const packageWeights=[1,.85,.70,.55,.45,.35,.30,.25];
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Math.round(Number(n)||0).toLocaleString();

async function api(table,query=''){
  const r=await fetch(`${API}/${table}?${query}`,{headers,cache:'no-store'});
  if(!r.ok) throw new Error(`${table}: ${r.status}`);
  return r.json();
}
function marketType(p){const s=String(p.view||'').toUpperCase();if(s.includes('BUY'))return['buy','BBB BUY'];if(s.includes('FADE'))return['fade','BBB FADE'];return['market','≈ MARKET']}
function marketBadge(p){const [c,t]=marketType(p);return `<span class="market-badge ${c}">${t}</span>`}
function diff(v){if(v==null)return'<span class="muted">—</span>';return `<span class="${v>0?'positive':v<0?'negative':'muted'}">${v>0?'+':''}${v}</span>`}
function slug(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/['’.]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function tabs(mount,kind,handler){mount.innerHTML=['ALL','QB','RB','WR','TE'].map((x,i)=>`<button class="tab ${i===0?'active':''}" data-v="${x}">${x==='ALL'?(kind==='dynasty'?'Overall':'All'):x}</button>`).join('');mount.querySelectorAll('button').forEach(b=>b.onclick=()=>{mount.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));handler(b.dataset.v)})}

async function loadAll(){
  try{
    const [d,r,p,k,pr,status]=await Promise.all([
      api('site_dynasty','select=*&order=rank.asc'),api('site_rookies','select=*&order=rank.asc'),api('site_prospects','select=*&order=grade.desc'),api('site_draft_picks','select=*&order=value.desc'),api('site_profiles','select=*'),api('site_status','select=*')
    ]);
    dynasty=d;rookies=r;prospects=p;picks=k;profiles=pr;
    $('#dynastyCount').textContent=d.length;$('#rookieCount').textContent=r.length;$('#prospectCount').textContent=p.length;
    if(status[0]?.dynasty_updated_at) $('#statusText').textContent='Database live';
    $('#topFive').innerHTML=d.slice(0,5).map(x=>`<div class="preview-row"><strong>${x.rank}</strong><div><b>${esc(x.name)}</b><br><span>${esc(x.team)} • ${esc(x.pos)}${x.pr||''}</span></div><span class="pill">${esc(x.pos)}</span></div>`).join('');
    populateProspectYears();renderDynasty();renderRookies();renderProspects();renderTrade();route();
  }catch(e){console.error(e);$('#topFive').innerHTML='<div class="empty">Database unavailable. Refresh in a moment.</div>';}
}

function renderDynasty(){
  const list=dynasty.filter(p=>(dPos==='ALL'||p.pos===dPos)&&(!dQ||`${p.name} ${p.team} ${p.pos}`.toLowerCase().includes(dQ))&&(dMarket==='ALL'||marketType(p)[0]===dMarket.toLowerCase()));
  $('#dynastyBody').innerHTML=list.slice(0,dVisible).map(p=>`<tr data-player="${esc(p.name)}"><td class="rank">${p.rank}</td><td class="player">${esc(p.name)}</td><td><span class="pill">${esc(p.pos)}</span></td><td>${esc(p.team)}</td><td class="mobile-hide">${p.age??'—'}</td><td class="mobile-hide">${esc(p.pos)}${p.pr??'—'}</td><td class="mobile-hide muted">${p.market??'UR'}</td><td class="mobile-hide">${diff(p.gap)}</td><td>${marketBadge(p)}</td></tr>`).join('')||'<tr><td class="empty">No players match.</td></tr>';
  $('#dynastyResultCount').textContent=`Showing ${Math.min(dVisible,list.length)} of ${list.length}`;$('#dynastyMore').style.display=dVisible>=list.length?'none':'';bindPlayerRows('#dynastyBody');
}
function renderRookies(){
  const list=rookies.filter(p=>(rPos==='ALL'||p.pos===rPos)&&(!rQ||`${p.name} ${p.team} ${p.pos}`.toLowerCase().includes(rQ))&&(rTier==='ALL'||p.tier===rTier));
  $('#rookieBody').innerHTML=list.slice(0,rVisible).map(p=>`<tr data-player="${esc(p.name)}"><td class="rank">${p.rank}</td><td class="player">${esc(p.name)}</td><td><span class="pill">${esc(p.pos)}</span></td><td>${esc(p.team)}</td><td class="mobile-hide">${p.age??'—'}</td><td class="mobile-hide muted">${p.market??'UR'}</td><td class="mobile-hide">${diff(p.gap)}</td><td><span class="pill">${esc(p.tier||'—')}</span></td></tr>`).join('')||'<tr><td class="empty">No rookies match.</td></tr>';
  $('#rookieResultCount').textContent=`Showing ${Math.min(rVisible,list.length)} of ${list.length}`;$('#rookieMore').style.display=rVisible>=list.length?'none':'';bindPlayerRows('#rookieBody');
}
function populateProspectYears(){const ys=[...new Set(prospects.map(p=>p.year).filter(Boolean))].sort((a,b)=>b-a);$('#prospectYear').innerHTML='<option value="ALL">All classes</option>'+ys.map(y=>`<option value="${y}">${y} Draft Class</option>`).join('')}
function renderProspects(){
  const list=prospects.filter(p=>(pPos==='ALL'||p.pos===pPos)&&(!pQ||`${p.name} ${p.comp||''} ${p.pos} ${p.year}`.toLowerCase().includes(pQ))&&(pYear==='ALL'||String(p.year)===pYear));
  $('#prospectBody').innerHTML=list.slice(0,pVisible).map(p=>`<tr data-player="${esc(p.name)}"><td class="player">${esc(p.name)}</td><td><span class="pill">${esc(p.pos)}</span></td><td>${p.year??'—'}</td><td class="rank">${Number(p.grade).toFixed(Number(p.grade)%1?1:0)}</td><td>${esc(p.comp||'—')}</td></tr>`).join('')||'<tr><td class="empty">No prospects match.</td></tr>';
  $('#prospectResultCount').textContent=`Showing ${Math.min(pVisible,list.length)} of ${list.length}`;$('#prospectMore').style.display=pVisible>=list.length?'none':'';bindPlayerRows('#prospectBody');
}
function bindPlayerRows(root){$$(root+' tr[data-player]').forEach(row=>row.onclick=()=>goProfile(row.dataset.player))}

function playerValue(p){return Math.round(10000*Math.exp(-.012*(p.rank-1)))}
function resolveAsset(id){if(String(id).startsWith('pick:'))return picks.find(p=>p.id===id);return dynasty.find(p=>p.player_key===id)}
function assetValue(a){return a?.id?.startsWith('pick:')?Number(a.value):playerValue(a)}
function side(which){return (which==='A'?tradeA:tradeB).map(resolveAsset).filter(Boolean)}
function adjusted(which){return Math.round(side(which).map(assetValue).sort((a,b)=>b-a).reduce((z,v,i)=>z+v*(packageWeights[i]||0),0))}
function searchAssets(q){q=q.toLowerCase();const used=new Set([...tradeA,...tradeB]);const ps=dynasty.filter(p=>!used.has(p.player_key)&&`${p.name} ${p.team} ${p.pos}`.toLowerCase().includes(q)).slice(0,8).map(p=>({id:p.player_key,name:p.name,meta:`BBB #${p.rank} • ${p.pos}${p.pr||''} • ${p.team}`,value:playerValue(p)}));const ks=picks.filter(p=>!used.has(p.id)&&`${p.name} ${p.year} ${p.range} pick`.toLowerCase().includes(q)).slice(0,5).map(p=>({id:p.id,name:p.name,meta:`PICK • ${p.year} • ${p.range}`,value:Number(p.value)}));return [...ks,...ps].slice(0,10)}
function renderSearch(which){const inp=$(`#tradeSearch${which}`),out=$(`#tradeResults${which}`),q=inp.value.trim();if(!q){out.innerHTML='';return}const m=searchAssets(q);out.innerHTML=m.map(x=>`<button class="trade-result" data-id="${esc(x.id)}"><div><strong>${esc(x.name)}</strong><span>${esc(x.meta)}</span></div><strong>${fmt(x.value)}</strong></button>`).join('');out.querySelectorAll('button').forEach(b=>b.onclick=()=>{const arr=which==='A'?tradeA:tradeB;if(arr.length<8)arr.push(b.dataset.id);inp.value='';out.innerHTML='';renderTrade()})}
function renderSide(which){const box=$(`#tradeAssets${which}`);box.innerHTML=side(which).map((a,i)=>`<div class="trade-asset"><div><strong>${esc(a.name)}</strong><span>${a.id?.startsWith('pick:')?`PICK • ${a.year} • ${esc(a.range)}`:`BBB #${a.rank} • ${esc(a.pos)}${a.pr||''}`}</span></div><div><strong>${fmt(assetValue(a))}</strong><button class="trade-remove" data-i="${i}">×</button></div></div>`).join('')||'<div class="empty">Add up to eight assets.</div>';box.querySelectorAll('.trade-remove').forEach(b=>b.onclick=()=>{(which==='A'?tradeA:tradeB).splice(+b.dataset.i,1);renderTrade()})}
function renderTrade(){renderSide('A');renderSide('B');const a=adjusted('A'),b=adjusted('B');$('#teamAAdjusted').textContent=fmt(a);$('#teamBAdjusted').textContent=fmt(b);if(!a||!b){$('#tradeVerdict').textContent='BUILD A TRADE';$('#tradeVerdictSub').textContent='Add assets to both sides.';return}const f=Math.min(a,b)/Math.max(a,b),win=a>b?'TEAM A':'TEAM B',edge=(Math.max(a,b)/Math.min(a,b)-1)*100;$('#tradeVerdict').textContent=f>=.95?'FAIR TRADE':f>=.9?`SLIGHT LEAN ${win}`:f>=.8?`LEAN ${win}`:`STRONGLY FAVORS ${win}`;$('#tradeVerdictSub').textContent=f>=.95?'Adjusted values are within 5%.':`${win} receives about ${edge.toFixed(1)}% more adjusted value.`}

function findProfile(name){const key=slug(name);const d=dynasty.find(x=>slug(x.name)===key),r=rookies.find(x=>slug(x.name)===key),g=prospects.filter(x=>slug(x.name)===key).sort((a,b)=>Number(b.grade)-Number(a.grade))[0],pr=profiles.find(x=>slug(x.name)===key);return {name:d?.name||r?.name||g?.name||pr?.name||name,d,r,g,pr}}
function rows(items){return items.map(([a,b])=>`<div class="profile-row"><span>${esc(a)}</span><strong>${esc(b??'—')}</strong></div>`).join('')}
function goProfile(name){history.pushState({},'',`/player/${slug(name)}`);route()}
function route(){const m=location.pathname.match(/^\/player\/([^/]+)/);if(!m){$('#app').classList.remove('hide');$('#profileView').classList.add('hide');return}const key=decodeURIComponent(m[1]),all=[...dynasty,...rookies,...prospects,...profiles],found=all.find(x=>slug(x.name)===key);if(!found)return;const x=findProfile(found.name);$('#app').classList.add('hide');$('#profileView').classList.remove('hide');const traits=x.g?.traits&&typeof x.g.traits==='object'?Object.entries(x.g.traits).filter(([,v])=>Number.isFinite(Number(v))).sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,6):[];const traitMax=Math.max(10,...traits.map(([,v])=>Number(v)));
  $('#profileMount').innerHTML=`<section class="profile-hero"><div class="shell"><a href="/#rankings" class="kicker">← BACK TO THE BOARD</a><h1 class="profile-title">${esc(x.name).replace(/\s+([^\s]+)$/,' <span>$1</span>')}</h1><div class="profile-meta"><span class="pill">${esc(x.d?.pos||x.r?.pos||x.g?.pos||x.pr?.pos||'')}</span> ${esc(x.d?.team||x.r?.team||x.pr?.team||'')} ${x.d?.age||x.r?.age||x.pr?.age?`• Age ${x.d?.age||x.r?.age||x.pr?.age}`:''}</div></div></section><section class="profile-content"><div class="shell profile-grid">${x.d?`<article class="profile-card"><div class="kicker">DYNASTY SNAPSHOT</div><h2>Current value.</h2>${rows([['Overall Rank','#'+x.d.rank],['Position Rank',x.d.pos+(x.d.pr||'—')],['FantasyPros Rank',x.d.market??'UR'],['BBB vs FP',x.d.gap==null?'—':(x.d.gap>0?'+':'')+x.d.gap],['Injury Status',x.d.injury_status||'—']])}${x.d.overview?`<div class="profile-note">${esc(x.d.overview)}</div>`:''}${x.d.latest_update?`<div class="profile-note"><b>Latest update:</b> ${esc(x.d.latest_update)}</div>`:''}</article>`:''}${x.r?`<article class="profile-card"><div class="kicker">ROOKIE BOARD</div><h2>Class standing.</h2>${rows([['Rookie Rank','#'+x.r.rank],['Position',x.r.pos],['Tier',x.r.tier||'—'],['FP Rookie Rank',x.r.market??'UR'],['BBB vs FP',x.r.gap==null?'—':(x.r.gap>0?'+':'')+x.r.gap]])}</article>`:''}${x.g?`<article class="profile-card full"><div class="kicker">PROSPECT PROFILE</div><h2>${Number(x.g.grade).toFixed(Number(x.g.grade)%1?1:0)} overall grade • ${esc(x.g.comp||'No comp')}</h2><div class="trait-list">${traits.map(([n,v])=>`<div class="trait"><b>${esc(n)}</b><div class="trait-track"><div class="trait-fill" style="width:${Math.min(100,Number(v)/traitMax*100)}%"></div></div><span>${esc(v)}</span></div>`).join('')||'<div class="muted">Trait detail unavailable.</div>'}</div></article>`:''}${x.pr&&!x.d?`<article class="profile-card"><div class="kicker">PLAYER UPDATE</div><h2>Latest profile.</h2>${x.pr.overall_breakdown?`<div class="profile-note">${esc(x.pr.overall_breakdown)}</div>`:''}${x.pr.latest_weekly_update?`<div class="profile-note">${esc(x.pr.latest_weekly_update)}</div>`:''}</article>`:''}</div></section>`;window.scrollTo(0,0)}

function init(){
  tabs($('#dynastyTabs'),'dynasty',v=>{dPos=v;dVisible=50;renderDynasty()});tabs($('#rookieTabs'),'rookie',v=>{rPos=v;rVisible=50;renderRookies()});tabs($('#prospectTabs'),'prospect',v=>{pPos=v;pVisible=50;renderProspects()});
  $('#dynastySearch').oninput=e=>{dQ=e.target.value.trim().toLowerCase();dVisible=50;renderDynasty()};$('#marketFilter').onchange=e=>{dMarket=e.target.value;dVisible=50;renderDynasty()};$('#dynastyMore').onclick=()=>{dVisible+=50;renderDynasty()};
  $('#rookieSearch').oninput=e=>{rQ=e.target.value.trim().toLowerCase();rVisible=50;renderRookies()};$('#rookieTier').onchange=e=>{rTier=e.target.value;rVisible=50;renderRookies()};$('#rookieMore').onclick=()=>{rVisible+=50;renderRookies()};
  $('#prospectSearch').oninput=e=>{pQ=e.target.value.trim().toLowerCase();pVisible=50;renderProspects()};$('#prospectYear').onchange=e=>{pYear=e.target.value;pVisible=50;renderProspects()};$('#prospectMore').onclick=()=>{pVisible+=50;renderProspects()};
  $('#tradeSearchA').oninput=()=>renderSearch('A');$('#tradeSearchB').oninput=()=>renderSearch('B');$('#clearTrade').onclick=()=>{tradeA=[];tradeB=[];renderTrade()};window.addEventListener('popstate',route);loadAll();
}
document.addEventListener('DOMContentLoaded',init);
