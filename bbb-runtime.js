// Bobby's Big Board shared browser runtime.
// This file owns UI state, rendering, routing, and shared helpers only.
// Live data loaders are supplied by the Supabase data layer.

let players=[],pos='ALL',q='',mf='ALL',visible=50,tradeA=[],tradeB=[];
const weights=[1,.85,.70,.55,.45,.35,.30,.25];
let rookies=[],rookiePos='ALL',rookieQ='',rookieTier='ALL',rookieVisible=50;
let prospects=[],prospectPos='ALL',prospectQ='',prospectClass='ALL',prospectVisible=50;
const posOrder={QB:0,RB:1,WR:2,TE:3};
let draftPicks=[];
let profileGradeDetails=new Map();
const PROFILE_ALIAS={'jeremiyah-love':'jeremiah-love'};

function num(v){
  if(v==null)return null;
  const s=String(v).trim();
  if(!s||s==='NO RANK'||s==='#N/A')return null;
  const n=Number(s.replace(/,/g,''));
  return Number.isFinite(n)?n:null;
}
function mv(p){
  const s=(p?.view||'').toUpperCase();
  if(s.includes('BUY'))return['buy','BBB BUY'];
  if(s.includes('FADE'))return['fade','BBB FADE'];
  return['market','≈ MARKET'];
}
function badge(p){const [c,t]=mv(p);return `<span class="market-badge ${c}">${t}</span>`;}
function diff(v){if(v==null)return['neutral','—'];return[v>0?'positive':v<0?'negative':'neutral',v>0?'+'+v:String(v)];}
function val(p){return p?.rank?Math.round(10000*Math.exp(-.012*(p.rank-1))):0;}
function fmt(n){return Math.round(Number(n)||0).toLocaleString();}

function filt(){
  return players.filter(p=>(pos==='ALL'||p.pos===pos)&&(!q||(`${p.name} ${p.team} ${p.pos}`).toLowerCase().includes(q))&&(mf==='ALL'||mv(p)[0]===mf.toLowerCase()));
}
function render(){
  const list=filt(),slice=list.slice(0,visible);
  rankingsBody.innerHTML=slice.map(p=>{const d=diff(p.gap);return `<tr data-r="${p.rank}"><td class="rank-cell">${p.rank}</td><td class="player-cell">${p.name}</td><td class="col-pos"><span class="pos-chip">${p.pos}</span></td><td class="col-team">${p.team}</td><td class="col-age">${p.age??'—'}</td><td class="col-posrank">${p.pos}${p.pr??'—'}</td><td class="col-market-rank muted">${p.market??'—'}</td><td class="col-diff"><span class="diff ${d[0]}">${d[1]}</span></td><td class="col-view">${badge(p)}</td></tr>`;}).join('')||'<tr><td colspan="9" class="empty">No players match those filters.</td></tr>';
  resultCount.textContent=`Showing ${Math.min(visible,list.length)} of ${list.length} players`;
  loadMore.classList.toggle('hide',visible>=list.length);
  document.querySelectorAll('tr[data-r]').forEach(x=>x.onclick=()=>openPlayer(+x.dataset.r));
}
function openPlayer(r){
  const p=players.find(x=>x.rank===r);if(!p)return;
  const d=diff(p.gap);
  modalTitle.textContent=p.name;
  modalSub.textContent=`${p.team} • ${p.pos}${p.pr||''} • Dynasty Rank #${p.rank}`;
  modalBadge.innerHTML=badge(p);
  modalDetails.innerHTML=`<div class="detail"><span>BBB Rank</span><strong>#${p.rank}</strong></div><div class="detail"><span>Position Rank</span><strong>${p.pos}${p.pr||'—'}</strong></div><div class="detail"><span>Age</span><strong>${p.age??'—'}</strong></div><div class="detail"><span>Draft Year</span><strong>${p.draft??'—'}</strong></div><div class="detail"><span>Market Rank</span><strong>${p.market??'—'}</strong></div><div class="detail"><span>BBB vs Market</span><strong class="${d[0]}">${d[1]} spots</strong></div>`;
  modalNotes.textContent=p.notes||'';
  modalNotes.classList.toggle('hide',!p.notes);
  playerModal.showModal();
}

function rookieFiltered(){return rookies.filter(p=>(rookiePos==='ALL'||p.pos===rookiePos)&&(!rookieQ||(`${p.name} ${p.team} ${p.pos}`).toLowerCase().includes(rookieQ))&&(rookieTier==='ALL'||p.tier===rookieTier));}
function renderRookies(){
  const list=rookieFiltered(),slice=list.slice(0,rookieVisible);
  rookieBody.innerHTML=slice.map(p=>{const d=diff(p.gap);return `<tr data-rookie-r="${p.rank}"><td class="rank-cell">${p.rank}</td><td class="player-cell">${p.name}</td><td class="col-pos"><span class="pos-chip">${p.pos}</span></td><td class="col-team">${p.team}</td><td class="col-age">${p.age??'—'}</td><td class="col-market-rank muted">${p.market??'—'}</td><td class="col-diff"><span class="diff ${d[0]}">${d[1]}</span></td><td class="col-view"><span class="tier-chip">${p.tier||'—'}</span></td></tr>`;}).join('')||'<tr><td colspan="8" class="empty">No rookies match those filters.</td></tr>';
  rookieResultCount.textContent=`Showing ${Math.min(rookieVisible,list.length)} of ${list.length} rookies`;
  rookieLoadMore.classList.toggle('hide',rookieVisible>=list.length);
  document.querySelectorAll('tr[data-rookie-r]').forEach(x=>x.onclick=()=>openRookie(+x.dataset.rookieR));
}
function openRookie(r){
  const p=rookies.find(x=>x.rank===r);if(!p)return;
  const d=diff(p.gap);
  modalTitle.textContent=p.name;
  modalSub.textContent=`${p.team} • ${p.pos} • 2026 Rookie Rank #${p.rank}`;
  modalBadge.innerHTML=`<span class="tier-chip">Tier ${p.tier||'—'}</span>`;
  modalDetails.innerHTML=`<div class="detail"><span>BBB Rookie Rank</span><strong>#${p.rank}</strong></div><div class="detail"><span>Position</span><strong>${p.pos}</strong></div><div class="detail"><span>Age</span><strong>${p.age??'—'}</strong></div><div class="detail"><span>Draft Year</span><strong>${p.draft??2026}</strong></div><div class="detail"><span>Market Rookie Rank</span><strong>${p.market??'—'}</strong></div><div class="detail"><span>BBB vs Market</span><strong class="${d[0]}">${p.gap==null?'—':d[1]+' spots'}</strong></div>`;
  modalNotes.textContent=p.notes||'';
  modalNotes.classList.toggle('hide',!p.notes);
  playerModal.showModal();
}

function prospectFiltered(){return prospects.filter(p=>(prospectPos==='ALL'||p.pos===prospectPos)&&(!prospectQ||(`${p.name} ${p.comp} ${p.pos} ${p.year}`).toLowerCase().includes(prospectQ))&&(prospectClass==='ALL'||String(p.year)===prospectClass));}
function renderProspects(){
  const list=prospectFiltered(),slice=list.slice(0,prospectVisible);
  prospectBody.innerHTML=slice.map(p=>`<tr><td class="prospect-player">${p.name}</td><td class="prospect-pos-cell"><span class="prospect-pos">${p.pos}</span></td><td class="prospect-class">${p.year??'—'}</td><td class="grade-cell">${Number.isInteger(p.grade)?p.grade.toFixed(0):p.grade.toFixed(1)}</td><td class="prospect-comp">${p.comp||'—'}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">No prospects match those filters.</td></tr>';
  prospectResultCount.textContent=`Showing ${Math.min(prospectVisible,list.length)} of ${list.length} prospects`;
  prospectLoadMore.classList.toggle('hide',prospectVisible>=list.length);
}

function resolveTradeAsset(id){if(typeof id==='number')return players.find(p=>p.rank===id)||null;return draftPicks.find(p=>p.id===id)||null;}
function assetValue(a){return a?.type==='pick'?a.value:val(a);}
function side(s){const ar=s==='A'?tradeA:tradeB;return ar.map(resolveTradeAsset).filter(Boolean);}
function adj(s){return Math.round(side(s).map(assetValue).sort((a,b)=>b-a).reduce((z,v,i)=>z+v*(weights[i]||0),0));}
function raw(s){return side(s).reduce((z,p)=>z+assetValue(p),0);}
function removeTradeAsset(s,index){const ar=s==='A'?tradeA:tradeB;ar.splice(index,1);tradeRender();}
function tradeAssets(s){
  const ar=side(s),box=document.querySelector('#tradeAssets'+s);if(!box)return;
  box.innerHTML=ar.length?ar.map((p,i)=>p.type==='pick'?`<div class="trade-asset pick-asset"><div><div class="trade-asset-name">${p.name}</div><div class="trade-asset-meta"><span class="pick-badge">PICK</span> • ${p.year||''} • ${p.range}</div></div><div class="trade-asset-value"><strong>${fmt(assetValue(p))}</strong><span>BBB PICK VALUE</span></div><button class="trade-remove" data-s="${s}" data-i="${i}">×</button></div>`:`<div class="trade-asset"><div><div class="trade-asset-name">${p.name}</div><div class="trade-asset-meta">BBB #${p.rank} • ${p.pos}${p.pr||''} • ${p.team}</div></div><div class="trade-asset-value"><strong>${fmt(assetValue(p))}</strong><span>RAW VALUE</span></div><button class="trade-remove" data-s="${s}" data-i="${i}">×</button></div>`).join(''):'<div class="trade-empty">Add up to eight players or picks.</div>';
  box.querySelectorAll('.trade-remove').forEach(b=>b.onclick=()=>removeTradeAsset(b.dataset.s,+b.dataset.i));
}
function tradeRender(){
  if(!document.querySelector('#tradeView'))return;
  tradeAssets('A');tradeAssets('B');
  const ar=raw('A'),br=raw('B'),aa=adj('A'),ba=adj('B');
  teamATotal.textContent=fmt(ar);teamBTotal.textContent=fmt(br);teamAAdjusted.textContent=fmt(aa);teamBAdjusted.textContent=fmt(ba);
  teamACount.textContent=`${tradeA.length} / 8 assets`;teamBCount.textContent=`${tradeB.length} / 8 assets`;
  if(!tradeA.length||!tradeB.length||!aa||!ba){tradeVerdict.textContent=tradeA.length||tradeB.length?'ADD BOTH SIDES':'BUILD A TRADE';tradeVerdictSub.textContent='Add players or picks to both sides to compare the deal.';fairnessPct.textContent='—';fairnessFill.style.width='0';return;}
  const f=Math.min(aa,ba)/Math.max(aa,ba),win=aa>ba?'TEAM A':'TEAM B',edge=Math.max(aa,ba)/Math.min(aa,ba)-1;
  tradeVerdict.textContent=f>=.95?'FAIR TRADE':f>=.9?'SLIGHT LEAN '+win:f>=.8?'LEAN '+win:'STRONGLY FAVORS '+win;
  tradeVerdictSub.textContent=f>=.95?'Adjusted values are within 5%.':`${win} receives about ${(edge*100).toFixed(1)}% more adjusted value.`;
  fairnessPct.textContent=(f*100).toFixed(1)+'%';fairnessFill.style.width=(f*100)+'%';
}
function searchTrade(s){
  const inp=document.querySelector('#tradeSearch'+s),out=document.querySelector('#tradeResults'+s),qq=inp.value.trim().toLowerCase();if(!qq){out.classList.add('hide');return;}
  const usedPlayers=new Set([...tradeA,...tradeB].filter(x=>typeof x==='number'));
  const pm=players.filter(p=>!usedPlayers.has(p.rank)&&(`${p.name} ${p.team} ${p.pos}`).toLowerCase().includes(qq)).map(p=>({kind:'player',key:String(p.rank),obj:p,score:p.name.toLowerCase().startsWith(qq)?0:1}));
  const km=draftPicks.filter(p=>(`${p.name} ${p.year} ${p.range} pick`).toLowerCase().includes(qq)).map(p=>({kind:'pick',key:p.id,obj:p,score:String(p.year)===qq||p.name.toLowerCase().startsWith(qq)?0:1}));
  const m=[...km,...pm].sort((a,b)=>a.score-b.score).slice(0,12);
  out.innerHTML=m.length?m.map(x=>x.kind==='pick'?`<button class="trade-result pick-result" data-kind="pick" data-key="${x.key}"><div><strong>${x.obj.name}</strong><span><span class="pick-badge">PICK</span> • ${x.obj.year} • ${x.obj.range}</span></div><span class="trade-result-value">${fmt(x.obj.value)}</span></button>`:`<button class="trade-result" data-kind="player" data-key="${x.key}"><div><strong>${x.obj.name}</strong><span>BBB #${x.obj.rank} • ${x.obj.pos}${x.obj.pr||''} • ${x.obj.team}</span></div><span class="trade-result-value">${fmt(val(x.obj))}</span></button>`).join(''):'<div class="empty">No matches.</div>';
  out.classList.remove('hide');
  out.querySelectorAll('.trade-result').forEach(b=>b.onclick=()=>{const ar=s==='A'?tradeA:tradeB;if(ar.length<8)ar.push(b.dataset.kind==='player'?+b.dataset.key:b.dataset.key);inp.value='';out.classList.add('hide');tradeRender();});
}

function bbbView(){
  const h=location.hash,mode=h==='#trade'?'trade':h==='#rookies'?'rookies':h==='#prospects'?'prospects':'rankings';
  rankingsView.classList.toggle('hide',mode!=='rankings');tradeView.classList.toggle('hide',mode!=='trade');rookieView.classList.toggle('hide',mode!=='rookies');prospectView.classList.toggle('hide',mode!=='prospects');
  if(mode!=='rankings')window.scrollTo(0,0);else if(['#rankings','#market','#about'].includes(h))requestAnimationFrame(()=>document.querySelector(h)?.scrollIntoView());
}
function view(){bbbView();}

function profileSlug(n){return String(n||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/['’.]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function profileNorm(n){return profileSlug(n).replace(/-/g,'');}
function profileGo(name){
  const match=[...players,...rookies,...prospects].find(x=>profileNorm(x.name)===profileNorm(name));
  const key=match?.playerKey||match?.player_key||profileSlug(name);
  history.pushState({profile:name},'', '/player/'+encodeURIComponent(key));profileRoute(true);
}
function profileNameFromPath(){const m=location.pathname.match(/^\/player\/([^/?#]+)/);return m?decodeURIComponent(m[1]):'';}
function profileFind(slug){
  const target=PROFILE_ALIAS[slug]||slug,all=[...players,...rookies,...prospects];
  return all.find(x=>String(x.playerKey||x.player_key||'')===target)||all.find(x=>profileSlug(x.name)===target)||all.find(x=>PROFILE_ALIAS[profileSlug(x.name)]===target)||null;
}
function profileFmt(v){return v==null||v===''?'—':v;}
function profileTradeValue(p){return p?.rank?val(p):null;}
function profileDiff(v){if(v==null)return '—';return (v>0?'+':'')+v;}
function profileRows(rows){return '<div class="profile-rows">'+rows.map(([a,b])=>'<div class="profile-row"><span>'+a+'</span><strong>'+profileFmt(b)+'</strong></div>').join('')+'</div>';}
function profileTraitMax(pos,name,header){const m=String(header||'').match(/\((\d+(?:\.\d+)?)\)/);if(m)return +m[1];if(['Speed','Acceleration','Analytics'].includes(name))return 10;return 5;}
function profileCleanTrait(h){return String(h||'').replace(/\s*\([^)]*\)\s*$/,'').trim();}
function profileIsTrait(name){return !['Player','Players','Year','Overall Grade','Prospect Score','Prospect Score (100)','Pro Comp','Analytics','College Analytics','Projected Draft Capital'].includes(name);}
function profileFindGrade(name){const n=profileNorm(name),g=profileGradeDetails.get(n);if(g)return g;if(n==='jeremiyahlove')return profileGradeDetails.get('jeremiahlove')||null;return null;}
function profileHideOtherViews(){['rankingsView','rookieView','prospectView','tradeView'].forEach(id=>document.querySelector('#'+id)?.classList.add('hide'));profileView?.classList.remove('hide');}
function profileShowSite(){profileView?.classList.add('hide');if(typeof bbbView==='function')bbbView();}
function profileCard(title,kicker,body,full=false){return '<section class="profile-card'+(full?' full':'')+'"><div class="profile-card-kicker">'+kicker+'</div><h2>'+title+'</h2>'+body+'</section>';}
async function profileRender(slug){
  profileHideOtherViews();
  const mount=document.querySelector('#profileMount');mount.innerHTML='<div class="profile-loading shell">Loading player profile…</div>';
  let tries=0,p=null;while(!p&&tries<25){p=profileFind(slug);if(p)break;await new Promise(r=>setTimeout(r,120));tries++;}
  if(!p){mount.innerHTML='<div class="profile-missing shell"><div class="profile-kicker">BBB PLAYER DATABASE</div><h1>Player not found.</h1><p>This profile is not available on the current board.</p><a class="btn btn-primary" href="#rankings">Back to rankings</a></div>';return;}
  if(typeof profileLoadGrades==='function')await profileLoadGrades().catch(()=>{});
  const dynasty=players.find(x=>profileNorm(x.name)===profileNorm(p.name));
  const rookie=rookies.find(x=>profileNorm(x.name)===profileNorm(p.name));
  const grade=profileFindGrade(p.name);
  const name=p.name,pPos=p.pos||grade?.pos||'',team=dynasty?.team||rookie?.team||'',age=dynasty?.age??rookie?.age,market=dynasty?.market??rookie?.market,gap=dynasty?.gap??rookie?.gap;
  const stats=[];
  if(dynasty?.rank)stats.push(['Overall Rank','#'+dynasty.rank]);if(dynasty?.pr)stats.push(['Position Rank',dynasty.pos+dynasty.pr]);if(dynasty?.rank)stats.push(['Trade Value',fmt(profileTradeValue(dynasty))]);if(market!=null)stats.push(['Market Rank','#'+market]);if(gap!=null)stats.push(['BBB vs Market',profileDiff(gap)]);
  if(!dynasty&&grade){stats.push(['Prospect Grade',Number.isInteger(grade.grade)?grade.grade:grade.grade.toFixed(1)]);stats.push(['Draft Class',grade.year||'—']);stats.push(['Position',grade.pos]);if(grade.comp)stats.push(['Pro Comp',grade.comp]);}
  const meta=[pPos?'<span class="pos-chip">'+pPos+'</span>':'',team,age!=null?'Age '+age:''].filter(Boolean).join(' • '),cards=[];
  if(dynasty)cards.push(profileCard('Current value.','Dynasty Snapshot',profileRows([['Overall Rank','#'+dynasty.rank],['Position Rank',dynasty.pos+(dynasty.pr||'—')],['Team',dynasty.team],['Age',dynasty.age],['Draft Year',dynasty.draft],['Market Rank',dynasty.market!=null?'#'+dynasty.market:'—'],['BBB vs Market',dynasty.gap==null?'—':profileDiff(dynasty.gap)+' spots'],['Trade Value',fmt(profileTradeValue(dynasty))]])+(dynasty.notes?'<div class="profile-note">'+dynasty.notes+'</div>':''),!rookie&&!grade));
  if(rookie)cards.push(profileCard('Class standing.','Rookie Board',profileRows([['BBB Rookie Rank','#'+rookie.rank],['Position',rookie.pos],['Team',rookie.team],['Age',rookie.age],['Tier',rookie.tier?('Tier '+rookie.tier):'—'],['Market Rookie Rank',rookie.market!=null?'#'+rookie.market:'—'],['BBB vs Market',rookie.gap==null?'—':profileDiff(rookie.gap)+' spots']])+(rookie.notes?'<div class="profile-note">'+rookie.notes+'</div>':''),!dynasty&&!grade));
  if(grade){const top=grade.traits.slice(0,5),traitHtml='<div class="profile-trait-head"><div><div class="profile-card-kicker">Film Grade Profile</div><h2 style="margin-bottom:0">Top qualities.</h2></div><div class="profile-grade"><span>Overall Prospect Grade</span><strong>'+ (Number.isInteger(grade.grade)?grade.grade:grade.grade.toFixed(1)) +'</strong></div></div><div class="trait-list">'+top.map(t=>'<div class="trait-item"><div class="trait-name">'+t.name+'</div><div class="trait-track"><div class="trait-fill" style="width:'+t.pct.toFixed(1)+'%"></div></div><div class="trait-score">'+t.value+' / '+t.max+'</div></div>').join('')+'</div><div class="profile-prospect-meta"><span>'+profileFmt(grade.year)+' Draft Class</span><span>'+grade.pos+' Prospect</span>'+(grade.comp?'<span>Pro Comp: '+grade.comp+'</span>':'')+'</div>';cards.push('<section class="profile-card full">'+traitHtml+'</section>');}
  mount.innerHTML='<section class="profile-hero"><div class="shell"><a class="profile-back" href="#rankings">← BACK TO THE BOARD</a><div class="profile-kicker">BBB PLAYER DATABASE</div><h1 class="profile-title">'+name.replace(/\s+([^\s]+)$/,' <span>$1</span>')+'</h1><div class="profile-meta">'+meta+'</div></div></section><section class="profile-statbar"><div class="shell profile-statgrid" style="--profile-stats:'+Math.max(1,stats.length)+'">'+stats.map(x=>'<div class="profile-stat"><span>'+x[0]+'</span><strong>'+x[1]+'</strong></div>').join('')+'</div></section><section class="profile-content"><div class="shell profile-grid">'+cards.join('')+'</div></section>';
  window.scrollTo(0,0);
}
function profileRoute(force=false){const slug=profileNameFromPath();if(slug){profileRender(slug);return;}profileShowSite();if(force&&location.hash&&typeof bbbView==='function')bbbView();}
function profileBindRows(){
  document.querySelectorAll('#rankingsBody tr[data-r]').forEach(row=>{const p=players.find(x=>x.rank===+row.dataset.r);if(p)row.onclick=()=>profileGo(p.name);});
  document.querySelectorAll('#rookieBody tr[data-rookie-r]').forEach(row=>{const p=rookies.find(x=>x.rank===+row.dataset.rookieR);if(p)row.onclick=()=>profileGo(p.name);});
  const plist=typeof prospectFiltered==='function'?prospectFiltered().slice(0,prospectVisible||50):[];
  document.querySelectorAll('#prospectBody tr').forEach((row,i)=>{if(plist[i])row.onclick=()=>profileGo(plist[i].name);});
}

const oldRender=render;render=function(){oldRender();profileBindRows();};
const oldRookieRender=renderRookies;renderRookies=function(){oldRookieRender();profileBindRows();};
const oldProspectRender=renderProspects;renderProspects=function(){oldProspectRender();profileBindRows();};

document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a||!location.pathname.startsWith('/player/'))return;e.preventDefault();history.pushState({},'', '/'+a.getAttribute('href'));profileRoute(true);});
window.addEventListener('popstate',()=>profileRoute(true));

document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-pos]').forEach(b=>b.onclick=()=>{pos=b.dataset.pos;visible=50;document.querySelectorAll('[data-pos]').forEach(x=>x.classList.toggle('active',x===b));render();});
  playerSearch.oninput=e=>{q=e.target.value.trim().toLowerCase();visible=50;render();};
  marketFilter.onchange=e=>{mf=e.target.value;visible=50;render();};
  loadMore.onclick=()=>{visible+=50;render();};
  closeModal.onclick=()=>playerModal.close();

  document.querySelectorAll('.rookie-tab').forEach(b=>b.onclick=()=>{rookiePos=b.dataset.rookiePos;rookieVisible=50;document.querySelectorAll('.rookie-tab').forEach(x=>x.classList.toggle('active',x===b));renderRookies();});
  rookieSearch.oninput=e=>{rookieQ=e.target.value.trim().toLowerCase();rookieVisible=50;renderRookies();};
  rookieTierFilter.onchange=e=>{rookieTier=e.target.value;rookieVisible=50;renderRookies();};
  rookieLoadMore.onclick=()=>{rookieVisible+=50;renderRookies();};

  document.querySelectorAll('.prospect-tab').forEach(b=>b.onclick=()=>{prospectPos=b.dataset.prospectPos;prospectVisible=50;document.querySelectorAll('.prospect-tab').forEach(x=>x.classList.toggle('active',x===b));renderProspects();});
  prospectSearch.oninput=e=>{prospectQ=e.target.value.trim().toLowerCase();prospectVisible=50;renderProspects();};
  prospectClassFilter.onchange=e=>{prospectClass=e.target.value;prospectVisible=50;renderProspects();};
  prospectLoadMore.onclick=()=>{prospectVisible+=50;renderProspects();};

  tradeSearchA.oninput=()=>searchTrade('A');tradeSearchB.oninput=()=>searchTrade('B');
  swapTrade.onclick=()=>{[tradeA,tradeB]=[tradeB,tradeA];tradeRender();};
  clearTrade.onclick=()=>{tradeA=[];tradeB=[];tradeSearchA.value='';tradeSearchB.value='';tradeRender();};
  document.querySelectorAll('.trade-search').forEach(x=>x.placeholder='Search a player or draft pick…');
  document.querySelectorAll('.trade-empty').forEach(x=>x.textContent='Add up to eight players or picks.');

  window.addEventListener('hashchange',bbbView);bbbView();profileBindRows();profileRoute();

  if(typeof load==='function')load().catch(e=>{console.error('Dynasty rankings:',e);previewRows.innerHTML='<div class="empty">Live rankings unavailable. Refresh in a moment.</div>';rankingsBody.innerHTML='<tr><td colspan="9" class="empty">Live rankings unavailable. Refresh in a moment.</td></tr>';});
  if(typeof loadRookies==='function')loadRookies().catch(e=>{console.error('Rookie rankings:',e);rookiePreviewRows.innerHTML='<div class="empty">Rookie rankings unavailable. Refresh in a moment.</div>';rookieBody.innerHTML='<tr><td colspan="8" class="empty">Rookie rankings unavailable. Refresh in a moment.</td></tr>';});
  if(typeof loadProspects==='function')loadProspects().catch(e=>{console.error('Prospect grades:',e);prospectPreviewRows.innerHTML='<div class="empty">Prospect grades unavailable. Refresh in a moment.</div>';prospectBody.innerHTML='<tr><td colspan="5" class="empty">Prospect grades unavailable. Refresh in a moment.</td></tr>';});
  if(typeof loadDraftPicks==='function')loadDraftPicks().catch(e=>console.error('Draft pick values:',e));
});
