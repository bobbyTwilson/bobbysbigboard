const SUPA='https://twbduhmibbotregdxlla.supabase.co';
const KEY='sb_publishable_R3-rucNypGm1DPd4LHV-0A_wIoT0jBS';
const STORE='bbb_admin_session_v1';
let session=null,board=[],profileMap=new Map(),reviewQueue=[],prospectLab=[],dataHealth={},adminActivity=[],rookiesCount=0,prospectsCount=0,rankPage=0,playerPage=0,reviewPage=0;
const PAGE=50;
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>v==null||v===''?null:Number(v);
const healthy=s=>!s||String(s).trim()===''||String(s).trim().toLowerCase()==='healthy';
function msg(t,ok=false){$('#authMessage').textContent=t||'';$('#authMessage').style.color=ok?'#69d99d':'#ef8585'}
function saveSession(x){session=x;localStorage.setItem(STORE,JSON.stringify(x))}
function clearSession(){session=null;localStorage.removeItem(STORE)}
function authHeaders(extra={}){return {apikey:KEY,Authorization:`Bearer ${session?.access_token||''}`,...extra}}
async function jsonFetch(url,opt={}){const r=await fetch(url,opt);let data=null;try{data=await r.json()}catch{}if(!r.ok)throw new Error(data?.msg||data?.message||data?.error_description||data?.error||`Request failed (${r.status})`);return data}
async function refreshSession(){if(!session?.refresh_token)return false;try{const x=await jsonFetch(`${SUPA}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});saveSession(x);return true}catch{clearSession();return false}}
async function rest(path,opt={}){if(session?.expires_at&&Date.now()/1000>session.expires_at-60)await refreshSession();const headers=authHeaders(opt.headers||{});let r=await fetch(`${SUPA}/rest/v1/${path}`,{...opt,headers});if(r.status===401&&await refreshSession())r=await fetch(`${SUPA}/rest/v1/${path}`,{...opt,headers:authHeaders(opt.headers||{})});let data=null;const txt=await r.text();if(txt)try{data=JSON.parse(txt)}catch{data=txt}if(!r.ok)throw new Error(data?.message||data?.hint||`Database request failed (${r.status})`);return data}
async function rpc(name,body){return rest(`rpc/${name}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})}
async function checkAdmin(){const email=session?.user?.email;if(!email)return null;const rows=await rest(`bbb_admin_users?select=email,role,active&email=eq.${encodeURIComponent(email)}`);return rows?.[0]||null}
function sessionFromAuth(x){if(!x?.access_token)return null;return {...x,expires_at:Math.floor(Date.now()/1000)+(x.expires_in||3600)}}
async function signIn(email,password){const x=await jsonFetch(`${SUPA}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password})});saveSession(sessionFromAuth(x));const admin=await checkAdmin();if(!admin){clearSession();throw new Error('This account is authenticated but is not approved for BBB Admin.')}return admin}
function showLogin(){ $('#loginView').classList.remove('hide');$('#appView').classList.add('hide') }
function showApp(admin){$('#loginView').classList.add('hide');$('#appView').classList.remove('hide');$('#adminRole').textContent=`${String(admin.role||'admin').toUpperCase()} ACCESS`}
async function boot(){let raw=localStorage.getItem(STORE);if(raw)try{session=JSON.parse(raw)}catch{}if(!session){showLogin();return}if(session.expires_at&&Date.now()/1000>session.expires_at-60&&!await refreshSession()){showLogin();return}try{const admin=await checkAdmin();if(!admin){clearSession();showLogin();return}showApp(admin);await loadAll()}catch(e){console.error(e);clearSession();showLogin()}}
async function loadAll(){
  const jobs=await Promise.allSettled([loadBoard(),loadProfiles(),loadActivity(),loadReviewQueue(),loadProspectLab(),loadDataHealth()]);
  const failed=jobs.filter(x=>x.status==='rejected');
  if(failed.length)console.error('BBB Admin data load warning',failed.map(x=>x.reason));
  try{await loadCounts()}catch(e){console.error('BBB Admin count load warning',e)}
  renderRankings();renderPlayers();renderReviewQueue();renderProspectLab();renderDataHealth();renderCommandDashboard()
}
async function loadBoard(){board=await rest('site_dynasty?select=rank,player_key,name,pos,pr,team,age,draft,market,gap,view,injury_status,injury_note,injury_updated,college,overview&order=rank.asc')||[]}
async function loadProfiles(){const rows=await rest('site_profiles?select=player_key,name,pos,team,age,draft_year,college,overall_breakdown,injury_status,injury_note,injury_updated&order=name.asc')||[];profileMap=new Map(rows.map(x=>[x.player_key,x]))}
async function loadReviewQueue(){reviewQueue=await rpc('admin_get_review_queue',{p_limit:500})||[]}
async function loadProspectLab(){prospectLab=await rpc('admin_get_prospect_lab',{p_year:null,p_include_graded:true})||[]}
async function loadDataHealth(){dataHealth=await rpc('admin_get_data_health',{})||{}}
async function loadCounts(){const [r,p]=await Promise.all([rest('site_rookies?select=player_key'),rest('site_prospects?select=player_key')]);rookiesCount=r?.length??0;prospectsCount=p?.length??0;if($('#metricPlayers'))$('#metricPlayers').textContent=board.length;if($('#metricRookies'))$('#metricRookies').textContent=rookiesCount;if($('#metricProspects'))$('#metricProspects').textContent=prospectsCount;if($('#metricInjuries'))$('#metricInjuries').textContent=board.filter(x=>!healthy(x.injury_status)).length}
function activityPlayerName(a){
  const key=a?.row_key||a?.new_row?.player_key||a?.old_row?.player_key||'';
  const direct=a?.new_row?.name||a?.old_row?.name;
  if(direct)return direct;
  const fromBoard=board.find(x=>x.player_key===key)?.name;
  if(fromBoard)return fromBoard;
  const fromProfile=profileMap.get(key)?.name;
  if(fromProfile)return fromProfile;
  return String(key||'System').split('-').map(x=>x?x[0].toUpperCase()+x.slice(1):'').join(' ');
}
function activitySummary(a){
  const old=a.old_row||{},neu=a.new_row||{};
  if(a.table_name==='dynasty_rankings'){
    const oldRank=old.overall_rank, newRank=neu.overall_rank;
    if(oldRank!=null||newRank!=null){
      if(oldRank!==newRank)return `Overall #${oldRank??'—'} → #${newRank??'—'}`;
      const oldPos=old.position_rank,newPos=neu.position_rank;
      if(oldPos!==newPos)return `Position #${oldPos??'—'} → #${newPos??'—'}`;
      const oldGap=old.bbb_vs_fp,newGap=neu.bbb_vs_fp;
      if(oldGap!==newGap)return `Market gap ${oldGap??'—'} → ${newGap??'—'}`;
    }
    return 'Ranking record updated';
  }
  if(a.table_name==='player_profiles'){
    if(old.injury_status!==neu.injury_status)return `Injury: ${old.injury_status||'—'} → ${neu.injury_status||'—'}`;
    if(old.latest_weekly_update!==neu.latest_weekly_update)return 'Weekly update refreshed';
    if(old.overall_breakdown!==neu.overall_breakdown)return 'Player overview updated';
    return `Profile ${String(a.operation||'updated').toLowerCase()}`;
  }
  if(a.table_name==='players'){
    if(old.team!==neu.team)return `Team: ${old.team||'FA'} → ${neu.team||'FA'}`;
    return `Player ${String(a.operation||'updated').toLowerCase()}`;
  }
  return String(a.operation||'Updated').toLowerCase().replace(/^./,c=>c.toUpperCase());
}
function dashboardTimeAgo(value){
  const ms=Date.now()-new Date(value).getTime();
  if(!Number.isFinite(ms))return'—';
  const m=Math.max(0,Math.floor(ms/60000));
  if(m<1)return'now';
  if(m<60)return m+'m';
  const h=Math.floor(m/60);if(h<24)return h+'h';
  return Math.floor(h/24)+'d';
}
function renderActivityStream(){
  const el=$('#activityList');if(!el)return;
  el.innerHTML=adminActivity.length?adminActivity.slice(0,8).map(a=>{
    const name=activityPlayerName(a);
    return `<button type="button" class="activity-row" data-activity-player="${esc(a.row_key||'')}"><span class="activity-time">${dashboardTimeAgo(a.changed_at)}</span><span class="activity-table" title="${esc(name)}">${esc(name)}</span><span class="activity-key">${esc(activitySummary(a))}</span></button>`;
  }).join(''):'<div class="empty">No recent changes yet.</div>';
}
function boardHealthChecks(){
  const h=dataHealth||{};
  const ranked=Number(h.ranked_players)||0,slots=Number(h.unique_rank_slots)||0;
  const breakdowns=Number(h.missing_breakdowns)||0,sources=Number(h.missing_breakdown_sources)||0;
  const teams=Number(h.team_mismatches)||0,injuries=Number(h.injury_status_mismatches)||0,dupes=Number(h.duplicate_ranking_history_groups)||0;
  return [
    {label:'Rank slots',ok:ranked===500&&slots===500,value:`${slots}/500`,target:'rankings'},
    {label:'Player breakdowns',ok:breakdowns===0,value:breakdowns===0?'Complete':`${breakdowns} missing`,target:'players'},
    {label:'Source coverage',ok:sources===0,value:sources===0?'Complete':`${sources} missing`,target:'review',kind:'SOURCE'},
    {label:'Team synchronization',ok:teams===0,value:teams===0?'Clean':`${teams} issues`,target:'players'},
    {label:'Injury synchronization',ok:injuries===0,value:injuries===0?'Clean':`${injuries} issues`,target:'review',kind:'INJURY'},
    {label:'Ranking history',ok:dupes===0,value:dupes===0?'Clean':`${dupes} duplicate groups`,target:'rankings'}
  ];
}
function renderMarketSignal(){
  const el=$('#marketSignalChart');if(!el)return;
  const points=board.slice(0,42).map(x=>Number(x.gap)).map(x=>Number.isFinite(x)?x:0);
  if(!points.length){el.innerHTML='<div class="empty">No market signal yet.</div>';return}
  const w=620,h=150,pad=8,max=Math.max(8,...points.map(x=>Math.abs(x))),mid=h/2;
  const coords=points.map((v,i)=>[pad+i*((w-pad*2)/Math.max(1,points.length-1)),mid-(v/max)*(mid-18)]);
  const line=coords.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const area=line+` L ${coords.at(-1)[0].toFixed(1)} ${mid} L ${coords[0][0].toFixed(1)} ${mid} Z`;
  const buys=board.filter(x=>marketKind(x)==='BUY').length,fades=board.filter(x=>marketKind(x)==='FADE').length;
  el.innerHTML=`<svg class="signal-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-label="BBB market edge signal">
    <defs><linearGradient id="signalArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#39ff9b" stop-opacity=".22"/><stop offset="100%" stop-color="#39ff9b" stop-opacity="0"/></linearGradient></defs>
    ${[.2,.4,.6,.8].map(y=>`<line class="signal-gridline" x1="0" x2="${w}" y1="${(h*y).toFixed(1)}" y2="${(h*y).toFixed(1)}"/>`).join('')}
    <line class="signal-zero" x1="0" x2="${w}" y1="${mid}" y2="${mid}"/>
    <path class="signal-area" d="${area}"/><path class="signal-line" d="${line}"/>
    ${coords.filter((_,i)=>i%7===0||i===coords.length-1).map(p=>`<circle class="signal-point" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.2"/>`).join('')}
  </svg><div class="signal-axis"><span>#1</span><span>#10</span><span>#20</span><span>#30</span><span>#42</span></div><div class="signal-summary"><button type="button" data-market-jump="BUY">BBB Buys <b>${buys}</b></button><button type="button" data-market-jump="FADE">BBB Fades <b>${fades}</b></button><span>Signal range <b>±${Math.round(max)}</b></span></div>`;
}
function renderBoardCore(){
  const towerEl=$('#positionTowers'),legend=$('#positionLegend');if(!towerEl||!legend)return;
  const positions=['QB','RB','WR','TE'];
  const counts=Object.fromEntries(positions.map(pos=>[pos,board.filter(x=>x.pos===pos).length]));
  const max=Math.max(1,...Object.values(counts));
  towerEl.innerHTML=positions.map(pos=>{const count=counts[pos]||0;const height=82+Math.round((count/max)*185);return `<button type="button" class="position-tower" data-core-pos="${pos}" style="--tower-h:${height}px" title="Open ${pos} rankings"><span class="tower-value">${count}</span><div class="tower-cap"></div><div class="tower-beam"></div><span class="tower-label">${pos}</span></button>`}).join('');
  legend.innerHTML=positions.map(pos=>`<button type="button" data-core-pos="${pos}"><span>${pos} PLAYERS</span><strong>${counts[pos]||0}</strong></button>`).join('');
  if($('#dashBoardTotal'))$('#dashBoardTotal').textContent=board.length||'—';
}
function renderDashboardHealth(){
  const gauge=$('#dashHealthGauge'),scoreEl=$('#dashHealthScore'),list=$('#dashHealthList');if(!gauge||!scoreEl||!list)return;
  const checks=boardHealthChecks(),passed=checks.filter(x=>x.ok).length,score=Math.round(passed/checks.length*100);
  gauge.style.setProperty('--score',(score*3.6)+'deg');scoreEl.textContent=score+'%';
  list.innerHTML=checks.map(x=>`<button type="button" class="health-line ${x.ok?'':'bad'}" data-health-target="${esc(x.target||'review')}" data-health-kind="${esc(x.kind||'')}"><i>${x.ok?'✓':'!'}</i><span>${esc(x.label)}</span><b>${esc(x.value)}</b></button>`).join('');
}
function renderDashboardReview(){
  if($('#dashReviewCount'))$('#dashReviewCount').textContent=reviewQueue.length;
  const el=$('#dashReviewPreview');if(!el)return;
  const rows=[...reviewQueue].sort((a,b)=>Number(a.queue_priority)-Number(b.queue_priority)||Number(a.overall_rank||999)-Number(b.overall_rank||999)).slice(0,5);
  el.innerHTML=rows.length?rows.map(x=>`<button type="button" class="review-mini" data-review-open="${esc(x.player_key)}"><span class="review-mini-priority p${x.queue_priority||3}"></span><span class="review-mini-rank">#${x.overall_rank??'—'}</span><div><strong>${esc(x.name)}</strong><small>${esc(x.position||'')} · ${esc(x.team||'FA')} · ${esc(x.attention_reason||'Review needed')}</small></div><span class="review-mini-age">${reviewAge(x.hours_since_verified)} ›</span></button>`).join(''):'<div class="empty">Watchtower clear.</div>';
}
function renderMarketEdges(){
  const el=$('#dashMarketEdges');if(!el)return;
  const buys=board.filter(x=>marketKind(x)==='BUY'&&Number.isFinite(Number(x.gap))).sort((a,b)=>Number(b.gap)-Number(a.gap)).slice(0,5);
  const fades=board.filter(x=>marketKind(x)==='FADE'&&Number.isFinite(Number(x.gap))).sort((a,b)=>Number(a.gap)-Number(b.gap)).slice(0,5);
  const max=Math.max(1,...[...buys,...fades].map(x=>Math.abs(Number(x.gap))));
  const column=(title,list,kind)=>`<div class="edge-column ${kind}"><div class="edge-title"><span>${title}</span><b>${list.length}</b></div><div class="edge-list">${list.map(x=>{const g=Number(x.gap)||0;return `<button type="button" class="edge-row" data-edge-player="${esc(x.player_key)}"><span class="edge-rank">#${x.rank}</span><div class="edge-player"><strong>${esc(x.name)}</strong><small>${esc(x.pos)} · ${esc(x.team||'FA')} · Market ${x.market?'#'+x.market:'UR'}</small></div><span class="edge-gap ${kind}">${g>0?'+':''}${g}</span><div class="edge-track"><i style="width:${Math.max(8,Math.round(Math.abs(g)/max*100))}%"></i></div></button>`}).join('')||'<div class="empty">No signals.</div>'}</div></div>`;
  el.innerHTML=column('BBB ABOVE MARKET',buys,'buy')+column('BBB BELOW MARKET',fades,'fade');
}
function goRankings(filters={}){
  page('rankings');
  if($('#rankSearch'))$('#rankSearch').value=filters.q||'';
  if($('#rankPos'))$('#rankPos').value=filters.pos||'ALL';
  if($('#rankMarket'))$('#rankMarket').value=filters.market||'ALL';
  rankPage=0;renderRankings();
}
function goReview(filters={}){
  page('review');
  if($('#reviewSearch'))$('#reviewSearch').value=filters.q||'';
  if($('#reviewPriority'))$('#reviewPriority').value=filters.priority||'ALL';
  if($('#reviewKind'))$('#reviewKind').value=filters.kind||'ALL';
  reviewPage=0;renderReviewQueue();
}
function bindDashboardActions(){
  $$('[data-core-pos]').forEach(b=>b.onclick=()=>goRankings({pos:b.dataset.corePos}));
  $$('[data-market-jump]').forEach(b=>b.onclick=()=>goRankings({market:b.dataset.marketJump}));
  $$('[data-edge-player]').forEach(b=>b.onclick=()=>{const p=board.find(x=>x.player_key===b.dataset.edgePlayer);goRankings({q:p?.name||''})});
  $$('[data-review-open]').forEach(b=>b.onclick=()=>{const x=reviewQueue.find(v=>v.player_key===b.dataset.reviewOpen);goReview({q:x?.name||''})});
  $$('[data-health-target]').forEach(b=>b.onclick=()=>{
    const target=b.dataset.healthTarget,kind=b.dataset.healthKind||'';
    if(target==='review')goReview({kind});
    else if(target==='players')page('players');
    else goRankings();
  });
  $$('[data-activity-player]').forEach(b=>b.onclick=()=>{
    const key=b.dataset.activityPlayer;
    const p=board.find(x=>x.player_key===key);
    if(p)goRankings({q:p.name});
  });
}
function renderCommandDashboard(){
  if(!$('#pageDashboard'))return;
  if($('#metricPlayers'))$('#metricPlayers').textContent=board.length||'—';
  if($('#metricInjuries'))$('#metricInjuries').textContent=board.filter(x=>!healthy(x.injury_status)).length;
  if($('#metricRookies'))$('#metricRookies').textContent=rookiesCount;
  if($('#metricProspects'))$('#metricProspects').textContent=prospectsCount;
  renderMarketSignal();renderBoardCore();renderDashboardHealth();renderDashboardReview();renderMarketEdges();renderActivityStream();bindDashboardActions();
}
function updateAdminClock(){
  const d=new Date(),time=$('#adminClock'),date=$('#adminDate');if(time)time.textContent=d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});if(date)date.textContent=d.toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'});
}
async function loadActivity(){try{adminActivity=await rpc('admin_recent_activity',{p_limit:20})||[];renderActivityStream()}catch(e){adminActivity=[];if($('#activityList'))$('#activityList').innerHTML=`<div class="empty">${esc(e.message)}</div>`}}
function marketKind(x){const s=String(x.view||'').toUpperCase();if(s.includes('BUY'))return'BUY';if(s.includes('FADE'))return'FADE';return'MARKET'}
function filteredRank(){const q=$('#rankSearch').value.trim().toLowerCase(),pos=$('#rankPos').value,m=$('#rankMarket').value;return board.filter(x=>(pos==='ALL'||x.pos===pos)&&(m==='ALL'||marketKind(x)===m)&&(!q||`${x.name} ${x.team} ${x.college||''}`.toLowerCase().includes(q)))}
function renderRankings(){const list=filteredRank();const max=Math.max(0,Math.ceil(list.length/PAGE)-1);rankPage=Math.min(rankPage,max);const rows=list.slice(rankPage*PAGE,(rankPage+1)*PAGE);$('#rankBody').innerHTML=rows.map(x=>`<tr><td class="rank-number">${x.rank}</td><td class="player-name">${esc(x.name)}</td><td><span class="pos">${esc(x.pos)}</span></td><td>${esc(x.team||'—')}</td><td>${x.market?`#${x.market}`:'UR'}</td><td class="${x.gap>0?'green':x.gap<0?'red':''}">${x.gap==null?'—':(x.gap>0?'+':'')+x.gap}</td><td><div class="move-wrap"><input class="rank-input" type="number" min="1" max="${board.length}" value="${x.rank}" data-move-input="${esc(x.player_key)}"><button class="move-btn" data-move="${esc(x.player_key)}">MOVE</button></div></td><td><button class="edit-btn" data-edit="${esc(x.player_key)}">EDIT</button></td></tr>`).join('')||'<tr><td colspan="8" class="empty">No players match.</td></tr>';$('#rankCount').textContent=`${list.length?rankPage*PAGE+1:0}–${Math.min((rankPage+1)*PAGE,list.length)} of ${list.length}`;$('#rankPrev').disabled=rankPage===0;$('#rankNext').disabled=rankPage>=max;bindRows()}
function filteredPlayers(){const q=$('#playerAdminSearch').value.trim().toLowerCase(),pos=$('#playerAdminPos').value,inj=$('#playerAdminInjury').value;return board.filter(x=>(pos==='ALL'||x.pos===pos)&&(inj==='ALL'||(inj==='HEALTHY'?healthy(x.injury_status):!healthy(x.injury_status)))&&(!q||`${x.name} ${x.team} ${x.college||''}`.toLowerCase().includes(q)))}
function renderPlayers(){const list=filteredPlayers();const max=Math.max(0,Math.ceil(list.length/PAGE)-1);playerPage=Math.min(playerPage,max);const rows=list.slice(playerPage*PAGE,(playerPage+1)*PAGE);$('#playerAdminBody').innerHTML=rows.map(x=>`<tr><td class="rank-number">${x.rank}</td><td class="player-name">${esc(x.name)}</td><td><span class="pos">${esc(x.pos)}</span></td><td>${esc(x.team||'—')}</td><td>${x.age??'—'}</td><td>${esc(x.college||'—')}</td><td class="${healthy(x.injury_status)?'green':'red'}">${esc(x.injury_status||'Healthy')}</td><td><button class="edit-btn" data-edit="${esc(x.player_key)}">EDIT</button></td></tr>`).join('')||'<tr><td colspan="8" class="empty">No players match.</td></tr>';$('#playerAdminCount').textContent=`${list.length?playerPage*PAGE+1:0}–${Math.min((playerPage+1)*PAGE,list.length)} of ${list.length}`;$('#playerAdminPrev').disabled=playerPage===0;$('#playerAdminNext').disabled=playerPage>=max;bindRows()}
function bindRows(){$$('[data-edit]').forEach(b=>b.onclick=()=>openEditor(b.dataset.edit));$$('[data-move]').forEach(b=>b.onclick=()=>movePlayer(b.dataset.move))}
const clip=(v,len=180)=>{const x=String(v??'').replace(/\s+/g,' ').trim();return x.length>len?x.slice(0,len-1)+'…':x};
const PROSPECT_TRAITS={
QB:[['Arm Talent (10)',10],['Deep Accuracy (10)',10],['Play Extension (5)',5],['Rushing Upside (5)',5],['Short Accuracy (5)',5],['Pocket Presence (10)',10],['Pressure / Clutch (5)',5],['Throw Off-Platform (5)',5],['Pre-Snap Processing (5)',5],['Post-Snap Processing (10)',10],['Anticipation / Timing (10)',10],['Intermediate Accuracy (10)',10],['Decision Making / Ball Security (10)',10]],
RB:[['Speed',10],['Run IQ',5],['Vision',5],['Agility',5],['Catching',5],['Creativity',5],['DAWG Factor',5],['Physicality',5],['Acceleration',10],['Deceleration',5],['Ball Security',5],['Route Running',5],['Contact Balance',5],['Pass Protection',5],['Run After Catch',5],['College Analytics',5],['Change of Direction',5],['Projected Draft Capital',5]],
WR:[['Speed',10],['Agility',5],['Catching',5],['Releases',5],['Analytics',10],['DAWG Factor',5],['Deep Routes',5],['Acceleration',10],['Deceleration',5],['Double Moves',5],['Short Routes',5],['Medium Routes',5],['Run After Catch',5],['Catch in Traffic',5],['X/Z/Slot Ability',5],['Change of Direction',5],['Projected Draft Capital',5]],
TE:[['Speed',10],['Agility',5],['Blocking',5],['Catching',5],['Analytics',10],['DAWG Factor',5],['Deep Routes',5],['Football IQ',5],['Acceleration',10],['Deceleration',5],['Short Routes',5],['Medium Routes',5],['Run After Catch',5],['Catch in Traffic',5],['Change of Direction',5],['Positional Versatility',5],['Projected Draft Capital',5]]
};
function prospectReady(x){return x.research_status==='researched'||x.recommended_overall_grade!=null||Object.keys(x.recommended_traits||{}).length>0}
function filteredProspects(){
 const q=($('#prospectSearch')?.value||'').toLowerCase(),year=$('#prospectYear')?.value||'ALL',pos=$('#prospectPos')?.value||'ALL',research=$('#prospectResearch')?.value||'ALL',show=!!$('#prospectIncludeGraded')?.checked;
 return prospectLab.filter(x=>(show||!x.graded)&&(year==='ALL'||String(x.class_year)===year)&&(pos==='ALL'||x.position===pos)&&(research==='ALL'||(research==='READY')===prospectReady(x))&&(!q||(`${x.name} ${x.school||''}`).toLowerCase().includes(q)));
}
function renderProspectLab(){
 const grid=$('#prospectLabGrid');if(!grid)return;
 const ungraded=prospectLab.filter(x=>!x.graded);
 $('#prospectUngraded').textContent=ungraded.length;$('#prospect2027').textContent=prospectLab.filter(x=>+x.class_year===2027).length;$('#prospect2028').textContent=prospectLab.filter(x=>+x.class_year===2028).length;$('#prospectResearched').textContent=prospectLab.filter(prospectReady).length;$('#prospectNavCount').textContent=ungraded.length||'04';
 const list=filteredProspects();
 grid.innerHTML=list.length?list.map(x=>`<article class="prospect-card">${x.graded?'<span class="prospect-graded">GRADED</span>':''}<div class="prospect-card-head"><span class="prospect-pos">${esc(x.position)}</span><div class="prospect-name"><strong>${esc(x.name)}</strong><span>${esc(x.school||'School TBD')}</span></div><span class="prospect-class">${x.class_year}</span></div><div class="prospect-card-summary">${esc(x.summary||'Research profile pending. This player is in your scouting queue and ready for a BBB grading pass.')}</div><div class="prospect-card-rec"><div><span>RECOMMENDED GRADE</span><strong class="${x.recommended_overall_grade==null?'pending':''}">${x.recommended_overall_grade==null?'PENDING':Number(x.recommended_overall_grade).toFixed(1)}</strong></div><div><span>PRO COMP IDEA</span><strong class="${x.recommended_pro_comp?'':'pending'}">${esc(x.recommended_pro_comp||'PENDING')}</strong></div></div><div class="prospect-card-actions"><span class="research-state ${prospectReady(x)?'ready':''}"><i></i>${prospectReady(x)?'RESEARCH READY':'RESEARCH PENDING'}</span><button class="small-btn grade-prospect-btn" data-grade-prospect="${esc(x.player_key)}">${x.graded?'EDIT GRADE':'GRADE PLAYER'}</button></div></article>`).join(''):'<div class="empty">No prospects match these filters.</div>';
 $$('[data-grade-prospect]').forEach(b=>b.onclick=()=>openProspectGrader(b.dataset.gradeProspect));
}
function prospectTotal(){const t=$('[data-prospect-trait]').reduce((a,i)=>a+(+i.value||0),0);$('#prospectGradeTotal').textContent=t.toFixed(1);return +t.toFixed(1)}
function openProspectGrader(key){
 const x=prospectLab.find(v=>v.player_key===key);if(!x)return;
 $('#prospectKey').value=key;$('#prospectDrawerTitle').textContent=x.name;$('#prospectDrawerMeta').textContent=`${x.position} · ${x.school||'School TBD'} · ${x.class_year} NFL Draft Class`;$('#prospectRecGrade').textContent=x.recommended_overall_grade==null?'Pending':(+x.recommended_overall_grade).toFixed(1);$('#prospectRecComp').textContent=x.recommended_pro_comp||'Research pending';$('#prospectSummary').textContent=x.summary||x.recommendation_notes||'Research notes have not been loaded for this prospect yet.';$('#prospectFinalComp').value=x.pro_comp||x.recommended_pro_comp||'';
 const current=x.traits||{},rec=x.recommended_traits||{};
 $('#prospectTraitGrid').innerHTML=(PROSPECT_TRAITS[x.position]||[]).map(([label,max])=>`<div class="prospect-trait"><label>${esc(label)} <small>/ ${max}</small></label><span class="trait-rec">REC ${rec[label]??'—'}</span><input class="input trait-input" type="number" min="0" max="${max}" step="0.5" data-prospect-trait="${esc(label)}" value="${current[label]??''}"></div>`).join('');
 $('#prospectApplyRec').disabled=!Object.keys(rec).length;$('#prospectApplyRec').dataset.playerKey=key;$('[data-prospect-trait]').forEach(i=>i.oninput=prospectTotal);prospectTotal();$('#prospectSaveStatus').textContent='';$('#prospectDrawerBackdrop').classList.remove('hide');$('#prospectDrawer').classList.remove('hide');
}
function closeProspectGrader(){$('#prospectDrawerBackdrop').classList.add('hide');$('#prospectDrawer').classList.add('hide')}
function applyProspectRec(){const x=prospectLab.find(v=>v.player_key===$('#prospectApplyRec').dataset.playerKey);if(!x)return;$('[data-prospect-trait]').forEach(i=>{if(x.recommended_traits?.[i.dataset.prospectTrait]!=null)i.value=x.recommended_traits[i.dataset.prospectTrait]});if(x.recommended_pro_comp)$('#prospectFinalComp').value=x.recommended_pro_comp;prospectTotal()}
async function saveProspectGrade(e){
 e.preventDefault();const x=prospectLab.find(v=>v.player_key===$('#prospectKey').value);if(!x)return;const traits={};$('[data-prospect-trait]').forEach(i=>{if(i.value!=='')traits[i.dataset.prospectTrait]=String(+i.value)});if(Object.keys(traits).length!==(PROSPECT_TRAITS[x.position]||[]).length)return alert('Finish every trait grade first.');
 const btn=$('#saveProspectGrade');btn.disabled=true;$('#prospectSaveStatus').textContent='Saving grade…';
 try{await rpc('admin_grade_prospect',{p_player_key:x.player_key,p_name:x.name,p_position:x.position,p_school:x.school||null,p_class_year:+x.class_year,p_overall_grade:prospectTotal(),p_pro_comp:$('#prospectFinalComp').value.trim()||null,p_traits:traits});await Promise.all([loadProspectLab(),loadCounts()]);renderProspectLab();$('#prospectSaveStatus').textContent='Grade locked ✓';setTimeout(closeProspectGrader,300)}catch(err){$('#prospectSaveStatus').textContent=err.message}finally{btn.disabled=false}
}

function reviewPriorityLabel(p){return Number(p)===1?'Critical':Number(p)===2?'High':'Normal'}
function reviewAge(h){const x=Number(h);if(!Number.isFinite(x))return'—';if(x<1)return'<1h ago';if(x<48)return`${Math.round(x)}h ago`;return`${Math.round(x/24)}d ago`}
function reviewSource(x){const src=x.source_1||x.source_2;if(!src)return'';if(/^https?:\/\//i.test(src))return `<a class="queue-source" href="${esc(src)}" target="_blank" rel="noopener">Source ↗</a>`;return `<div class="review-status">Source: ${esc(src)}</div>`}
function filteredReview(){const q=$('#reviewSearch')?.value.trim().toLowerCase()||'',priority=$('#reviewPriority')?.value||'ALL',kind=$('#reviewKind')?.value||'ALL';return reviewQueue.filter(x=>{if(priority!=='ALL'&&String(x.queue_priority)!==priority)return false;const hay=`${x.name} ${x.team||''} ${x.injury_status||''} ${x.attention_reason||''} ${x.latest_update_text||''}`.toLowerCase();if(q&&!hay.includes(q))return false;if(kind==='RANK'&&!x.ranking_review_needed)return false;if(kind==='INJURY'&&healthy(x.injury_status))return false;if(kind==='SOURCE'&&x.latest_update_review_status!=='needs_review'&&!String(x.attention_reason||'').toLowerCase().includes('source'))return false;if(kind==='STALE'&&!String(x.attention_reason||'').toLowerCase().includes('stale'))return false;return true})}
function renderReviewQueue(){if(!$('#reviewBody'))return;const list=filteredReview();const max=Math.max(0,Math.ceil(list.length/PAGE)-1);reviewPage=Math.min(reviewPage,max);const rows=list.slice(reviewPage*PAGE,(reviewPage+1)*PAGE);$('#reviewBody').innerHTML=rows.map(x=>`<tr><td><span class="queue-priority queue-p${x.queue_priority}">${reviewPriorityLabel(x.queue_priority)}</span></td><td class="rank-number">${x.overall_rank??'—'}</td><td class="player-name">${esc(x.name)}<div class="review-status">${esc(x.position||'')} · ${esc(x.team||'FA')}</div>${x.ranking_review_needed?'<span class="review-rank-flag">RANKING REVIEW</span>':''}</td><td class="${healthy(x.injury_status)?'green':'red'}">${esc(x.injury_status||'Healthy')}</td><td>${reviewAge(x.hours_since_verified)}<div class="review-status">Target ${x.freshness_target_hours||'—'}h</div></td><td class="queue-reason">${esc(x.attention_reason||'Review needed')}</td><td class="queue-update">${esc(clip(x.latest_update_text,190))}${reviewSource(x)}</td><td><div class="queue-actions"><button class="queue-action verify" data-review-verify="${esc(x.player_key)}">MARK VERIFIED</button><button class="queue-action ${x.ranking_review_needed?'resolve':'rank'}" data-review-rank="${esc(x.player_key)}">${x.ranking_review_needed?'RESOLVE RANK':'FLAG RANK'}</button><button class="queue-action" data-edit="${esc(x.player_key)}">EDIT</button><a class="queue-action" href="/player/${encodeURIComponent(x.player_key)}" target="_blank">PROFILE ↗</a></div></td></tr>`).join('')||'<tr><td colspan="8" class="empty">Queue is clear for these filters.</td></tr>';$('#reviewCount').textContent=`${list.length?reviewPage*PAGE+1:0}–${Math.min((reviewPage+1)*PAGE,list.length)} of ${list.length}`;$('#reviewPrev').disabled=reviewPage===0;$('#reviewNext').disabled=reviewPage>=max;const high=reviewQueue.filter(x=>Number(x.queue_priority)<=2).length,normal=reviewQueue.filter(x=>Number(x.queue_priority)===3).length,ranks=reviewQueue.filter(x=>x.ranking_review_needed).length;$('#metricReviewHigh').textContent=high;$('#metricReviewNormal').textContent=normal;$('#metricRankReviews').textContent=ranks;$('#reviewNavCount').textContent=reviewQueue.length;bindRows();bindReviewRows()}
function renderDataHealth(){if(!$('#healthGrid'))return;const h=dataHealth||{};const integrity=Number(h.ranked_players)===500&&Number(h.unique_rank_slots)===500;const checks=[['Rank Slots',integrity?`${h.unique_rank_slots}/500`:`${h.unique_rank_slots||0}/${h.ranked_players||0}`,integrity],['Breakdowns',Number(h.missing_breakdowns)===0?'Complete':`${h.missing_breakdowns} missing`,Number(h.missing_breakdowns)===0],['Sources',Number(h.missing_breakdown_sources)===0?'Complete':`${h.missing_breakdown_sources} missing`,Number(h.missing_breakdown_sources)===0],['Team Sync',Number(h.team_mismatches)===0?'Clean':`${h.team_mismatches} issues`,Number(h.team_mismatches)===0],['Injury Sync',Number(h.injury_status_mismatches)===0?'Clean':`${h.injury_status_mismatches} issues`,Number(h.injury_status_mismatches)===0],['Rank History',Number(h.duplicate_ranking_history_groups)===0?'Clean':`${h.duplicate_ranking_history_groups} dupes`,Number(h.duplicate_ranking_history_groups)===0]];$('#healthGrid').innerHTML=checks.map(([label,value,ok])=>`<div class="health-chip ${ok?'health-ok':'health-bad'}"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');$('#metricBoardHealth').textContent=checks.every(x=>x[2])?'CLEAN':'CHECK'}
function bindReviewRows(){$$('[data-review-verify]').forEach(b=>b.onclick=()=>markReviewVerified(b.dataset.reviewVerify,b));$$('[data-review-rank]').forEach(b=>b.onclick=()=>toggleRankingReview(b.dataset.reviewRank,b))}
async function refreshReviewOnly(){await Promise.all([loadReviewQueue(),loadDataHealth(),loadActivity()]);renderReviewQueue();renderDataHealth();renderCommandDashboard()}
async function markReviewVerified(key,btn){const x=reviewQueue.find(v=>v.player_key===key);if(!x)return;const old=btn.textContent;btn.disabled=true;btn.textContent='…';try{await rpc('admin_mark_player_verified',{p_player_key:key});await refreshReviewOnly()}catch(e){alert(e.message);btn.disabled=false;btn.textContent=old}}
async function toggleRankingReview(key,btn){const x=reviewQueue.find(v=>v.player_key===key);if(!x)return;const old=btn.textContent;btn.disabled=true;btn.textContent='…';try{if(x.ranking_review_needed){await rpc('admin_set_ranking_review',{p_player_key:key,p_needed:false,p_reason:null,p_priority:1})}else{const reason=prompt(`Why should ${x.name} get a ranking review?`,x.attention_reason||'Manual ranking review');if(reason===null){btn.disabled=false;btn.textContent=old;return}await rpc('admin_set_ranking_review',{p_player_key:key,p_needed:true,p_reason:reason,p_priority:2})}await refreshReviewOnly()}catch(e){alert(e.message);btn.disabled=false;btn.textContent=old}}
async function movePlayer(key){const x=board.find(p=>p.player_key===key);const input=$(`[data-move-input="${CSS.escape(key)}"]`);const nr=Number(input?.value);if(!x||!Number.isInteger(nr)||nr<1||nr>board.length)return alert(`Enter a rank from 1 to ${board.length}.`);if(nr===x.rank)return;const btn=$(`[data-move="${CSS.escape(key)}"]`);const old=btn.textContent;btn.disabled=true;btn.textContent='…';try{const result=await rpc('admin_move_dynasty_player',{p_player_key:key,p_new_rank:nr});await Promise.all([loadBoard(),loadActivity()]);renderRankings();renderPlayers();if($('#metricInjuries'))$('#metricInjuries').textContent=board.filter(v=>!healthy(v.injury_status)).length;renderCommandDashboard();alert(`${x.name} moved from #${x.rank} to #${nr}. ${result?.affected??''} board rows updated.`)}catch(e){alert(e.message)}finally{btn.disabled=false;btn.textContent=old}}
function openEditor(key){const b=board.find(x=>x.player_key===key),p=profileMap.get(key)||{};if(!b)return;$('#editKey').value=key;$('#drawerTitle').textContent=b.name;$('#editName').value=b.name||'';$('#editPosition').value=b.pos||'WR';$('#editTeam').value=b.team||'';$('#editAge').value=b.age??'';$('#editDraft').value=b.draft??'';$('#editCollege').value=b.college||'';$('#editInjury').value=p.injury_status||b.injury_status||'Healthy';$('#editInjuryDate').value=(p.injury_updated||b.injury_updated||'').slice(0,10);$('#editInjuryNote').value=p.injury_note||b.injury_note||'';$('#editOverview').value=p.overall_breakdown||b.overview||'';$('#profileLink').href=`/player/${encodeURIComponent(key)}`;$('#saveStatus').textContent='';$('#drawerBackdrop').classList.remove('hide');$('#playerDrawer').classList.remove('hide')}
function closeEditor(){$('#drawerBackdrop').classList.add('hide');$('#playerDrawer').classList.add('hide')}
async function savePlayer(e){e.preventDefault();const key=$('#editKey').value;if(!key)return;const save=$('#savePlayer');save.disabled=true;$('#saveStatus').textContent='Saving…';const identity={name:$('#editName').value.trim(),position:$('#editPosition').value,team:$('#editTeam').value.trim(),age:n($('#editAge').value),draft_year:n($('#editDraft').value),college:$('#editCollege').value.trim()||null};const profile={player_key:key,overall_breakdown:$('#editOverview').value.trim(),breakdown_basis:'BBB Admin',breakdown_updated:new Date().toISOString().slice(0,10),injury_status:$('#editInjury').value.trim()||'Healthy',injury_note:$('#editInjuryNote').value.trim(),injury_updated:$('#editInjuryDate').value||new Date().toISOString().slice(0,10),review_status:'Reviewed'};try{await rest(`players?player_key=eq.${encodeURIComponent(key)}`,{method:'PATCH',headers:{'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify(identity)});await rest(`player_profiles?on_conflict=player_key`,{method:'POST',headers:{'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(profile)});$('#saveStatus').textContent='Saved ✓';await Promise.all([loadBoard(),loadProfiles(),loadActivity()]);renderRankings();renderPlayers();if($('#metricInjuries'))$('#metricInjuries').textContent=board.filter(v=>!healthy(v.injury_status)).length;renderCommandDashboard();$('#drawerTitle').textContent=identity.name}catch(err){$('#saveStatus').textContent=err.message;$('#saveStatus').style.color='#ef8585'}finally{save.disabled=false}}
function page(name){
  $$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.page===name));
  $$('.admin-page').forEach(p=>p.classList.add('hide'));
  const target=$(`#page${name[0].toUpperCase()+name.slice(1)}`);
  if(!target)return;
  target.classList.remove('hide');
  if(name==='rankings')renderRankings();
  if(name==='players')renderPlayers();
  if(name==='prospects')renderProspectLab();
  if(name==='review'){renderReviewQueue();renderDataHealth()}
  if(name==='dashboard')renderCommandDashboard()
}
document.addEventListener('DOMContentLoaded',()=>{
  updateAdminClock();setInterval(updateAdminClock,30000);
  $$('.auth-tabs').forEach(x=>x.remove());
  $('#authForm').onsubmit=async e=>{e.preventDefault();const btn=$('#authSubmit');btn.disabled=true;msg('');try{const email=$('#authEmail').value.trim().toLowerCase(),password=$('#authPassword').value;const admin=await signIn(email,password);showApp(admin);await loadAll()}catch(err){msg(err.message)}finally{btn.disabled=false}};
  $('#signOut').onclick=()=>{clearSession();location.reload()};
  $$('.nav-btn').forEach(b=>b.onclick=()=>page(b.dataset.page));
  $$('[data-page-jump]').forEach(b=>b.onclick=()=>page(b.dataset.pageJump));
  const globalSearch=$('#adminGlobalSearch');
  if(globalSearch){
    globalSearch.addEventListener('keydown',e=>{
      if(e.key!=='Enter')return;
      const q=globalSearch.value.trim();page('rankings');
      if($('#rankSearch')){$('#rankSearch').value=q;rankPage=0;renderRankings()}
    });
  }
  document.addEventListener('keydown',e=>{
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'&&globalSearch){e.preventDefault();globalSearch.focus()}
  });
  $$('[data-refresh]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await loadAll()}finally{b.disabled=false}});
  ['#rankSearch','#rankPos','#rankMarket'].forEach(s=>$(s).addEventListener(s==='#rankSearch'?'input':'change',()=>{rankPage=0;renderRankings()}));
  $('#rankClear').onclick=()=>{$('#rankSearch').value='';$('#rankPos').value='ALL';$('#rankMarket').value='ALL';rankPage=0;renderRankings()};
  $('#rankPrev').onclick=()=>{rankPage=Math.max(0,rankPage-1);renderRankings()};$('#rankNext').onclick=()=>{rankPage++;renderRankings()};
  ['#playerAdminSearch','#playerAdminPos','#playerAdminInjury'].forEach(s=>$(s).addEventListener(s==='#playerAdminSearch'?'input':'change',()=>{playerPage=0;renderPlayers()}));
  ['#prospectSearch','#prospectYear','#prospectPos','#prospectResearch'].forEach(sel=>$(sel)?.addEventListener(sel==='#prospectSearch'?'input':'change',renderProspectLab));
  $('#prospectIncludeGraded')?.addEventListener('change',renderProspectLab);
  $('#prospectDrawerClose')?.addEventListener('click',closeProspectGrader);
  $('#prospectDrawerBackdrop')?.addEventListener('click',closeProspectGrader);
  $('#prospectApplyRec')?.addEventListener('click',applyProspectRec);
  $('#prospectGradeForm')?.addEventListener('submit',saveProspectGrade);
  ['#reviewSearch','#reviewPriority','#reviewKind'].forEach(s=>$(s).addEventListener(s==='#reviewSearch'?'input':'change',()=>{reviewPage=0;renderReviewQueue()}));
  $('#reviewClear').onclick=()=>{$('#reviewSearch').value='';$('#reviewPriority').value='ALL';$('#reviewKind').value='ALL';reviewPage=0;renderReviewQueue()};
  $('#reviewPrev').onclick=()=>{reviewPage=Math.max(0,reviewPage-1);renderReviewQueue()};$('#reviewNext').onclick=()=>{reviewPage++;renderReviewQueue()};
  $('#playerAdminClear').onclick=()=>{$('#playerAdminSearch').value='';$('#playerAdminPos').value='ALL';$('#playerAdminInjury').value='ALL';playerPage=0;renderPlayers()};
  $('#playerAdminPrev').onclick=()=>{playerPage=Math.max(0,playerPage-1);renderPlayers()};$('#playerAdminNext').onclick=()=>{playerPage++;renderPlayers()};
  $('#drawerClose').onclick=closeEditor;$('#drawerBackdrop').onclick=closeEditor;$('#playerForm').onsubmit=savePlayer;
  boot();
});