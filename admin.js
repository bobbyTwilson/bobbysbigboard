const SUPA='https://twbduhmibbotregdxlla.supabase.co';
const KEY='sb_publishable_R3-rucNypGm1DPd4LHV-0A_wIoT0jBS';
const STORE='bbb_admin_session_v1';
const BRIEF_SEEN='bbb_admin_brief_seen_v1';
let session=null,board=[],profileMap=new Map(),reviewQueue=[],rankingMoveQueue=[],weeklyScanner=null,scannerLoaded=false,scannerLoading=false,prospectLab=[],dataHealth={},adminActivity=[],rookiesCount=0,prospectsCount=0,rankPage=0,playerPage=0,reviewPage=0,selectedRankKey=null,commandIndex=0,researchQueue=[],researchLoaded=false,researchLoading=false,classAudit=[],classAuditLoaded=false,classAuditLoading=false,classAuditView='attention',prospectGradeOnly=false,commandBrief=null,commandBriefLoading=false,briefMode='ranking_decisions',activeAdminPage='dashboard';
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
function nextPaint(){return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))}
async function settleDashboardPaint(){
  const dash=$('#pageDashboard');
  if(!dash)return;
  dash.style.animation='none';
  dash.style.opacity='1';
  dash.style.transform='none';
  dash.style.willChange='auto';
  void dash.getBoundingClientRect();
  renderCommandDashboard();
  await nextPaint();
  void dash.offsetHeight;
  renderCommandDashboard();
}
async function enterAdmin(admin){
  showApp(admin);
  activeAdminPage='dashboard';
  await nextPaint();
  await loadAll();
  if(activeAdminPage==='dashboard')await settleDashboardPaint();
  window.dispatchEvent(new Event('resize'));
}
async function boot(){let raw=localStorage.getItem(STORE);if(raw)try{session=JSON.parse(raw)}catch{}if(!session){showLogin();return}if(session.expires_at&&Date.now()/1000>session.expires_at-60&&!await refreshSession()){showLogin();return}try{const admin=await checkAdmin();if(!admin){clearSession();showLogin();return}await enterAdmin(admin)}catch(e){console.error(e);clearSession();showLogin()}}
let dashboardPaintQueued=false;
function queueDashboardPaint(){
  if(dashboardPaintQueued)return;
  dashboardPaintQueued=true;
  requestAnimationFrame(()=>{
    dashboardPaintQueued=false;
    renderCommandDashboard();
  });
}
async function loadAll(){
  const jobs=await Promise.allSettled([
    loadBoard().then(()=>{renderRankings();renderPlayers();queueDashboardPaint()}),
    loadProfiles().then(()=>{renderPlayers();queueDashboardPaint()}),
    loadActivity().then(()=>queueDashboardPaint()),
    loadReviewQueue().then(()=>{renderReviewQueue();queueDashboardPaint()}),
    loadRankingMoveQueue().then(()=>{renderRankingMoveQueue();queueDashboardPaint()}),
    loadProspectLab().then(()=>{renderProspectLab();queueDashboardPaint()}),
    loadDataHealth().then(()=>{renderDataHealth();queueDashboardPaint()}),
    loadCounts().then(()=>queueDashboardPaint()),
    loadCommandBrief(false).then(()=>queueDashboardPaint())
  ]);
  const failed=jobs.filter(x=>x.status==='rejected');
  if(failed.length)console.error('BBB Admin data load warning',failed.map(x=>x.reason));
  renderRankings();renderPlayers();renderReviewQueue();renderProspectLab();renderDataHealth();renderCommandDashboard()
}
async function loadBoard(){board=await rest('site_dynasty?select=rank,player_key,name,pos,pr,team,age,draft,market,gap,view,injury_status,injury_note,injury_updated,college,overview&order=rank.asc')||[]}
async function loadProfiles(){const rows=await rest('site_profiles?select=player_key,name,pos,team,age,draft_year,college,overall_breakdown,injury_status,injury_note,injury_updated&order=name.asc')||[];profileMap=new Map(rows.map(x=>[x.player_key,x]))}
async function loadReviewQueue(){reviewQueue=await rpc('admin_get_review_queue',{p_limit:500})||[]}
async function loadRankingMoveQueue(){rankingMoveQueue=await rpc('admin_get_ranking_move_queue',{p_include_resolved:false,p_limit:500})||[]}
async function loadProspectLab(){prospectLab=await rpc('admin_get_prospect_lab',{p_year:null,p_include_graded:true})||[]}
async function loadDataHealth(){dataHealth=await rpc('admin_get_data_health',{})||{}}
async function loadCounts(){const [r,p]=await Promise.all([rest('site_rookies?select=player_key'),rest('site_prospects?select=player_key')]);rookiesCount=r?.length??0;prospectsCount=p?.length??0}

function briefSince(){
  const raw=localStorage.getItem(BRIEF_SEEN);
  const t=raw?new Date(raw).getTime():NaN;
  const now=Date.now(),week=7*24*60*60*1000;
  if(Number.isFinite(t)&&t<=now&&now-t<=week)return new Date(t).toISOString();
  return new Date(now-24*60*60*1000).toISOString();
}
function briefWindowText(){
  const raw=localStorage.getItem(BRIEF_SEEN);
  const since=new Date(briefSince());
  const label=raw?'Since you last marked the brief read':'Last 24 hours';
  return label+' · '+since.toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
}
async function loadCommandBrief(force=false){
  if(commandBriefLoading)return;
  if(commandBrief&&!force){renderOpsActionCenter();return}
  commandBriefLoading=true;
  try{
    commandBrief=await rpc('admin_get_command_brief',{p_since:briefSince()})||null;
    renderOpsActionCenter();
  }catch(e){
    console.error('BBB Daily Command Brief failed',e);
    const feed=$('#commandBriefFeed');
    if(feed)feed.innerHTML='<div class="empty">'+esc(e.message||'Command Brief could not load.')+'</div>';
  }finally{commandBriefLoading=false}
}
function briefItems(mode){
  if(!commandBrief)return[];
  return Array.isArray(commandBrief[mode])?commandBrief[mode]:[];
}
function briefSignal(mode,x){
  if(mode==='market_movers'){
    const n=Number(x.market_move)||0;
    return {text:(n>0?'+':'')+n+' MARKET',cls:n<0?'down':''};
  }
  if(mode==='rank_moves'){
    return {text:x.rank_impact||'RANK MOVE',cls:''};
  }
  if(mode==='injury_changes'){
    return {text:x.injury_status||'INJURY UPDATE',cls:'warn'};
  }
  return {text:'P'+(x.queue_priority||'—')+' REVIEW',cls:'warn'};
}
function briefCopy(mode,x){
  if(mode==='market_movers')return 'Market #'+(x.previous_market_rank??'—')+' → #'+(x.current_market_rank??'—')+' · BBB #'+(x.rank??'UR')+' · edge '+((Number(x.bbb_edge)>0?'+':'')+(x.bbb_edge??'—'));
  if(mode==='ranking_decisions')return x.ranking_review_reason||x.attention_reason||x.latest_update_text||'Ranking decision required.';
  return x.update_text||'No additional detail.';
}
function renderBriefFeed(){
  const feed=$('#commandBriefFeed'),title=$('#briefDetailTitle'),meta=$('#briefDetailMeta');
  if(!feed)return;
  const definitions={
    ranking_decisions:{title:'Ranking decisions waiting on you',meta:'Current unresolved review flags'},
    injury_changes:{title:'Injury changes',meta:'Since the current brief window'},
    rank_moves:{title:'Recent BBB rank moves',meta:'Changes already made and logged'},
    market_movers:{title:'Major market movement',meta:'20+ spots · latest market snapshot'}
  };
  const def=definitions[briefMode]||definitions.ranking_decisions;
  const rows=briefItems(briefMode);
  if(title)title.textContent=def.title;
  if(meta)meta.textContent=def.meta;
  if(!rows.length){
    feed.innerHTML='<div class="empty">Nothing in this bucket right now.</div>';
    return;
  }
  feed.innerHTML=rows.map(x=>{
    const signal=briefSignal(briefMode,x);
    return '<button type="button" class="brief-row" data-brief-player="'+esc(x.player_key||'')+'" data-brief-kind="'+esc(briefMode)+'">'+
      '<span class="brief-row-pos">'+esc(x.pos||'—')+'</span>'+
      '<span class="brief-row-player"><strong>'+esc(x.name||x.player_key||'Player')+'</strong><span>'+(x.rank!=null?'#'+esc(x.rank)+' · ':'')+esc(x.team||'—')+'</span></span>'+
      '<span class="brief-row-copy">'+esc(briefCopy(briefMode,x))+'</span>'+
      '<span class="brief-row-signal '+esc(signal.cls)+'">'+esc(signal.text)+'</span>'+
    '</button>';
  }).join('');
}

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
function renderOpsActionCenter(){
  const cards=$('#commandBriefCards');if(!cards)return;
  if($('#missionReviewCount'))$('#missionReviewCount').textContent=reviewQueue.length;
  if($('#missionProspectCount'))$('#missionProspectCount').textContent=prospectLab.filter(x=>!x.graded).length;
  if($('#briefWindowLabel'))$('#briefWindowLabel').textContent=briefWindowText();
  if(!commandBrief){
    if(!commandBriefLoading)void loadCommandBrief(false);
    return;
  }
  const counts=commandBrief.counts||{};
  const defs=[
    {key:'ranking_decisions',icon:'◈',count:Number(counts.ranking_decisions)||0,label:'Ranking decisions',sub:'Unresolved reviews that still need your call.',accent:'#ff7f90'},
    {key:'injury_changes',icon:'＋',count:Number(counts.injury_changes)||0,label:'Injury changes',sub:'New availability and injury updates in this brief window.',accent:'#ffc861'},
    {key:'rank_moves',icon:'↕',count:Number(counts.rank_moves)||0,label:'BBB rank moves',sub:'Moves already made and logged since the brief started.',accent:'#39ff9b'},
    {key:'market_movers',icon:'↗',count:Number(counts.market_movers)||0,label:'Major market movers',sub:'Players who moved 20+ spots in the latest market snapshot.',accent:'#58eaff'}
  ];
  if(!defs.some(x=>x.key===briefMode&&x.count>0))briefMode=defs.find(x=>x.count>0)?.key||'ranking_decisions';
  cards.innerHTML=defs.map(a=>'<button type="button" class="ops-action '+(briefMode===a.key?'active':'')+'" data-brief-mode="'+a.key+'" style="--action-accent:'+a.accent+'"><div class="ops-action-top"><span class="ops-action-icon">'+a.icon+'</span><span class="ops-action-count">'+a.count+'</span></div><strong>'+a.label+'</strong><small>'+a.sub+'</small></button>').join('');
  renderBriefFeed();
}
function renderCommandDashboard(){
  if(!$('#pageDashboard'))return;
  if($('#metricPlayers'))$('#metricPlayers').textContent=board.length||'—';
  if($('#metricInjuries'))$('#metricInjuries').textContent=board.filter(x=>!healthy(x.injury_status)).length;
  if($('#metricRookies'))$('#metricRookies').textContent=rookiesCount;
  if($('#metricProspects'))$('#metricProspects').textContent=prospectLab.filter(x=>x.graded).length;
  renderMarketSignal();renderBoardCore();renderDashboardHealth();renderDashboardReview();renderMarketEdges();renderActivityStream();renderOpsActionCenter();bindDashboardActions();
}
function updateAdminClock(){
  const d=new Date(),time=$('#adminClock'),date=$('#adminDate');
  if(time)time.textContent=d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit',second:'2-digit'});
  if(date)date.textContent=d.toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'});
}
async function loadActivity(){try{adminActivity=await rpc('admin_recent_activity',{p_limit:20})||[];renderActivityStream()}catch(e){adminActivity=[];if($('#activityList'))$('#activityList').innerHTML=`<div class="empty">${esc(e.message)}</div>`}}
function marketKind(x){const s=String(x.view||'').toUpperCase();if(s.includes('BUY'))return'BUY';if(s.includes('FADE'))return'FADE';return'MARKET'}
function filteredRank(){const q=$('#rankSearch').value.trim().toLowerCase(),pos=$('#rankPos').value,m=$('#rankMarket').value;return board.filter(x=>(pos==='ALL'||x.pos===pos)&&(m==='ALL'||marketKind(x)===m)&&(!q||`${x.name} ${x.team} ${x.college||''}`.toLowerCase().includes(q)))}
function renderRankings(){
  const list=filteredRank();
  const max=Math.max(0,Math.ceil(list.length/PAGE)-1);rankPage=Math.min(rankPage,max);
  const rows=list.slice(rankPage*PAGE,(rankPage+1)*PAGE);
  $('#rankBody').innerHTML=rows.map(x=>{
    const gap=x.gap==null?'—':((Number(x.gap)>0?'+':'')+x.gap);
    return '<tr data-rank-player="'+esc(x.player_key)+'" class="'+(selectedRankKey===x.player_key?'rank-selected':'')+'">'+
      '<td class="rank-number">'+x.rank+'</td>'+
      '<td class="player-name">'+esc(x.name)+'</td>'+
      '<td><span class="pos">'+esc(x.pos)+'</span></td>'+
      '<td>'+esc(x.team||'—')+'</td>'+
      '<td>'+(x.market?'#'+x.market:'UR')+'</td>'+
      '<td class="'+(x.gap>0?'green':x.gap<0?'red':'')+'">'+gap+'</td>'+
      '<td><div class="move-wrap"><input class="rank-input" type="number" min="1" max="'+board.length+'" value="'+x.rank+'" data-move-input="'+esc(x.player_key)+'"><button class="move-btn" data-move="'+esc(x.player_key)+'">MOVE</button></div></td>'+
      '<td><button class="edit-btn" data-edit="'+esc(x.player_key)+'">EDIT</button></td></tr>';
  }).join('')||'<tr><td colspan="8" class="empty">No players match.</td></tr>';
  $('#rankCount').textContent=(list.length?rankPage*PAGE+1:0)+'–'+Math.min((rankPage+1)*PAGE,list.length)+' of '+list.length;
  $('#rankPrev').disabled=rankPage===0;$('#rankNext').disabled=rankPage>=max;bindRows();renderRankLens();
}
function filteredPlayers(){
  const q=$('#playerAdminSearch').value.trim().toLowerCase();
  const pos=$('#playerAdminPos').value;
  const draft=$('#playerAdminDraft')?.value||'ALL';
  const inj=$('#playerAdminInjury').value;
  return board.filter(x=>
    (pos==='ALL'||x.pos===pos)&&
    (draft==='ALL'||String(x.draft)===draft)&&
    (inj==='ALL'||(inj==='HEALTHY'?healthy(x.injury_status):!healthy(x.injury_status)))&&
    (!q||(x.name+' '+x.team+' '+(x.college||'')).toLowerCase().includes(q))
  );
}
function renderPlayers(){const list=filteredPlayers();const max=Math.max(0,Math.ceil(list.length/PAGE)-1);playerPage=Math.min(playerPage,max);const rows=list.slice(playerPage*PAGE,(playerPage+1)*PAGE);$('#playerAdminBody').innerHTML=rows.map(x=>`<tr><td class="rank-number">${x.rank}</td><td class="player-name">${esc(x.name)}</td><td><span class="pos">${esc(x.pos)}</span></td><td>${esc(x.team||'—')}</td><td>${x.age??'—'}</td><td>${esc(x.college||'—')}</td><td class="${healthy(x.injury_status)?'green':'red'}">${esc(x.injury_status||'Healthy')}</td><td><button class="edit-btn" data-edit="${esc(x.player_key)}">EDIT</button></td></tr>`).join('')||'<tr><td colspan="8" class="empty">No players match.</td></tr>';$('#playerAdminCount').textContent=`${list.length?playerPage*PAGE+1:0}–${Math.min((playerPage+1)*PAGE,list.length)} of ${list.length}`;$('#playerAdminPrev').disabled=playerPage===0;$('#playerAdminNext').disabled=playerPage>=max;bindRows()}
function bindRows(){$$('[data-edit]').forEach(b=>b.onclick=()=>openEditor(b.dataset.edit));$$('[data-move]').forEach(b=>b.onclick=()=>movePlayer(b.dataset.move))}
function selectRankPlayer(key){selectedRankKey=key;renderRankings()}
function renderRankLens(){
  const el=$('#rankLens');if(!el)return;
  const x=board.find(v=>v.player_key===selectedRankKey);
  if(!x){el.innerHTML='<div class="rank-lens-empty"><div class="rank-lens-orb">⌁</div><div><div class="panel-kicker">BOARD LENS</div><strong>Select a player</strong><span>Click any player row to inspect rank, market gap, health and quick actions without leaving the board.</span></div></div>';return}
  const gap=x.gap==null?'—':((Number(x.gap)>0?'+':'')+x.gap);
  el.innerHTML='<div class="rank-lens-player">'+
    '<div class="rank-lens-rank"><span>BBB RANK</span><strong>#'+x.rank+'</strong></div>'+
    '<div class="rank-lens-id"><strong>'+esc(x.name)+'</strong><span>'+esc(x.pos)+' · '+esc(x.team||'FA')+' · '+esc(x.college||'College —')+'</span><p>'+esc(clip(x.overview||x.injury_note||'No current overview loaded for this player.',150))+'</p></div>'+
    '<div class="rank-lens-stat"><span>POS RANK</span><strong>'+(x.pr?'#'+x.pr:'—')+'</strong></div>'+
    '<div class="rank-lens-stat"><span>MARKET</span><strong>'+(x.market?'#'+x.market:'UR')+'</strong></div>'+
    '<div class="rank-lens-stat"><span>EDGE</span><strong class="'+(Number(x.gap)>0?'green':Number(x.gap)<0?'red':'')+'">'+gap+'</strong></div>'+
    '<div class="rank-lens-stat"><span>STATUS</span><strong class="'+(healthy(x.injury_status)?'green':'red')+'">'+esc(x.injury_status||'Healthy')+'</strong></div>'+
    '<div class="rank-lens-actions"><button type="button" data-lens-edit="'+esc(x.player_key)+'">EDIT DATA</button><a href="/player/'+encodeURIComponent(x.player_key)+'" target="_blank">PROFILE ↗</a><button type="button" data-lens-step="-1" '+(x.rank<=1?'disabled':'')+'>UP 1</button><button type="button" data-lens-step="1" '+(x.rank>=board.length?'disabled':'')+' >DOWN 1</button></div>'+
  '</div>';
  $('[data-lens-edit]')?.addEventListener('click',()=>openEditor(x.player_key));
  $$('[data-lens-step]').forEach(b=>b.onclick=()=>quickMoveSelected(Number(b.dataset.lensStep)));
}
async function quickMoveSelected(delta){
  const x=board.find(v=>v.player_key===selectedRankKey);if(!x)return;
  const nr=x.rank+delta;if(nr<1||nr>board.length)return;
  try{await rpc('admin_move_dynasty_player',{p_player_key:x.player_key,p_new_rank:nr});await Promise.all([loadBoard(),loadActivity()]);renderRankings();renderPlayers();renderCommandDashboard()}catch(e){alert(e.message)}
}


function rankingMoveDirection(x){
  if(x.recommended_rank==null)return 'needs_target';
  const cur=Number(x.current_rank),rec=Number(x.recommended_rank);
  if(rec<cur)return 'up';
  if(rec>cur)return 'down';
  return 'hold';
}
function rankingMoveSignal(x){
  const dir=rankingMoveDirection(x),cur=Number(x.current_rank),rec=x.recommended_rank==null?null:Number(x.recommended_rank);
  if(dir==='needs_target')return {label:'TARGET NEEDED',cls:'target',spots:''};
  if(dir==='hold')return {label:'HOLD #'+cur,cls:'hold',spots:'NO CHANGE'};
  const spots=Math.abs(cur-rec);
  return {label:(dir==='up'?'MOVE UP':'MOVE DOWN'),cls:dir,spots:(dir==='up'?'UP ':'DOWN ')+spots};
}
function filteredRankingMoves(){
  const q=($('#moveSearch')?.value||'').trim().toLowerCase();
  const priority=$('#movePriority')?.value||'ALL';
  const direction=$('#moveDirection')?.value||'ALL';
  return rankingMoveQueue.filter(x=>{
    if(priority!=='ALL'&&String(x.priority)!==priority)return false;
    const dir=rankingMoveDirection(x);
    if(direction!=='ALL'&&dir!==direction)return false;
    const hay=(x.name+' '+(x.team||'')+' '+(x.position||'')+' '+(x.reason||'')+' '+(x.latest_update_text||'')).toLowerCase();
    return !q||hay.includes(q);
  });
}
function rankingMoveMarketText(x){
  const market=x.market_rank?'Market #'+x.market_rank:'Market UR';
  const gap=x.market_gap==null?'':(' · Edge '+(Number(x.market_gap)>0?'+':'')+x.market_gap);
  return market+gap;
}
function renderRankingMoveQueue(){
  const grid=$('#rankingMoveGrid');if(!grid)return;
  const pending=rankingMoveQueue.filter(x=>x.status==='pending');
  const list=filteredRankingMoves();
  if($('#movePending'))$('#movePending').textContent=pending.length;
  if($('#moveUp'))$('#moveUp').textContent=pending.filter(x=>rankingMoveDirection(x)==='up').length;
  if($('#moveDown'))$('#moveDown').textContent=pending.filter(x=>rankingMoveDirection(x)==='down').length;
  if($('#moveTargetless'))$('#moveTargetless').textContent=pending.filter(x=>rankingMoveDirection(x)==='needs_target').length;
  if($('#moveNavCount'))$('#moveNavCount').textContent=pending.length||'0';
  if($('#moveQueueCount'))$('#moveQueueCount').textContent=list.length+' pending decision'+(list.length===1?'':'s');
  if($('#moveQueueHint'))$('#moveQueueHint').textContent=pending.length?'Nothing moves until you approve it. Change any target rank before approving.':'Queue clear — no ranking decision is waiting on you.';
  grid.innerHTML=list.length?list.map(x=>{
    const sig=rankingMoveSignal(x);
    const cur=Number(x.current_rank)||'—';
    const rec=x.recommended_rank==null?'—':Number(x.recommended_rank);
    const priority=Number(x.priority)===1?'P1 · CRITICAL':Number(x.priority)===2?'P2 · HIGH':'P3 · NORMAL';
    const latest=x.latest_update_text?'<div class="move-card-update"><span>LATEST PLAYER SIGNAL</span><p>'+esc(clip(x.latest_update_text,240))+'</p>'+(x.latest_rank_impact?'<small>'+esc(x.latest_rank_impact)+'</small>':'')+'</div>':'';
    const targetless=x.recommended_rank==null;
    return '<article class="move-card '+sig.cls+'" data-move-card="'+x.id+'">'+
      '<div class="move-card-top">'+
        '<span class="move-priority p'+(x.priority||3)+'">'+priority+'</span>'+
        '<span class="move-direction '+sig.cls+'">'+sig.label+(sig.spots?' · '+sig.spots:'')+'</span>'+
      '</div>'+
      '<div class="move-card-main">'+
        '<div class="move-player-block"><span class="move-player-rank">#'+cur+'</span><div><button type="button" class="move-player-name" data-move-open="'+esc(x.player_key)+'">'+esc(x.name)+'</button><span>'+esc(x.position||'')+' · '+esc(x.team||'FA')+(x.college?' · '+esc(x.college):'')+'</span></div></div>'+
        '<div class="move-rank-flow"><div><span>CURRENT</span><strong>#'+cur+'</strong></div><b>→</b><div class="'+(targetless?'targetless':'')+'"><span>RECOMMENDED</span><strong>'+(targetless?'?':'#'+rec)+'</strong></div></div>'+
      '</div>'+
      '<div class="move-card-context"><span>'+esc(rankingMoveMarketText(x))+'</span><span class="'+(healthy(x.injury_status)?'':'warn')+'">'+esc(x.injury_status||'Healthy')+'</span><span>'+esc((x.source||'manual_review').replaceAll('_',' ').toUpperCase())+'</span>'+(x.confidence?'<span>'+esc(String(x.confidence).toUpperCase())+' CONFIDENCE</span>':'')+'</div>'+
      '<div class="move-card-reason"><span>WHY IT IS HERE</span><p>'+esc(x.reason||'Manual ranking review — set a target or resolve the hold.')+'</p></div>'+
      latest+
      '<div class="move-decision">'+
        '<div class="move-target"><label>FINAL RANK</label><input class="rank-input" type="number" min="1" max="'+board.length+'" '+(targetless?'placeholder="'+cur+'"':'value="'+rec+'"')+' data-move-target="'+x.id+'"><small>'+(targetless?'Choose a target, or keep the current rank.':'Change this number to modify the recommendation before approval.')+'</small></div>'+
        '<div class="move-decision-actions">'+
          (targetless?'<button type="button" class="queue-action hold" data-move-keep="'+x.id+'" data-current-rank="'+cur+'">KEEP #'+cur+'</button>':'')+
          '<button type="button" class="queue-action reject" data-move-reject="'+x.id+'">REJECT</button>'+
          '<button type="button" class="queue-action approve" data-move-approve="'+x.id+'">'+(sig.cls==='hold'?'APPROVE HOLD':'APPROVE')+'</button>'+
        '</div>'+
      '</div>'+
    '</article>';
  }).join(''):'<div class="move-queue-empty"><div class="move-empty-orb">✓</div><strong>No ranking decisions waiting.</strong><span>Future scanner recommendations and manual ranking reviews will land here instead of moving the board automatically.</span></div>';

  $('[data-move-open]').forEach(b=>b.onclick=()=>window.openBBBPlayerWorkspace?.(b.dataset.moveOpen,'dynasty'));
  $('[data-move-approve]').forEach(b=>b.onclick=()=>resolveRankingMove(Number(b.dataset.moveApprove),'approve',b));
  $('[data-move-reject]').forEach(b=>b.onclick=()=>resolveRankingMove(Number(b.dataset.moveReject),'reject',b));
  $('[data-move-keep]').forEach(b=>b.onclick=()=>{
    const id=Number(b.dataset.moveKeep),input=$('[data-move-target="'+id+'"]');
    if(input)input.value=b.dataset.currentRank;
    resolveRankingMove(id,'approve',b,Number(b.dataset.currentRank));
  });
}
function showMoveQueueNotice(message,warn=false){
  const el=$('#moveQueueNotice');if(!el)return;
  el.textContent=message;
  el.classList.remove('hide','warn');
  if(warn)el.classList.add('warn');
  clearTimeout(showMoveQueueNotice.timer);
  showMoveQueueNotice.timer=setTimeout(()=>el.classList.add('hide'),6500);
}
async function refreshRankingDecisionState(){
  commandBrief=null;
  await Promise.all([loadBoard(),loadRankingMoveQueue(),loadReviewQueue(),loadActivity(),loadDataHealth()]);
  await loadCommandBrief(true);
  renderRankings();renderPlayers();renderRankingMoveQueue();renderReviewQueue();renderDataHealth();renderCommandDashboard();
}
async function resolveRankingMove(id,action,btn,overrideRank){
  const x=rankingMoveQueue.find(v=>Number(v.id)===Number(id));if(!x)return;
  let finalRank=null;
  if(action==='approve'){
    const input=$('[data-move-target="'+id+'"]');
    finalRank=Number.isInteger(overrideRank)?overrideRank:Number(input?.value);
    if(!Number.isInteger(finalRank)||finalRank<1||finalRank>board.length){
      alert('Choose a final rank from 1 to '+board.length+'.');
      input?.focus();
      return;
    }
  }
  const old=btn?.textContent;
  if(btn){btn.disabled=true;btn.textContent=action==='approve'?'APPLYING…':'REJECTING…'}
  try{
    const modified=action==='approve'&&x.recommended_rank!=null&&Number(x.recommended_rank)!==finalRank;
    const note=modified?'Approved with modified target: recommended #'+x.recommended_rank+', final #'+finalRank:null;
    const result=await rpc('admin_resolve_ranking_move',{p_id:id,p_action:action,p_final_rank:finalRank,p_note:note});
    await refreshRankingDecisionState();
    if(action==='approve'){
      const oldRank=Number(result?.old_rank??x.current_rank),newRank=Number(result?.final_rank??finalRank);
      showMoveQueueNotice(newRank===oldRank?x.name+' held at #'+newRank+' — decision resolved.':x.name+' moved from #'+oldRank+' to #'+newRank+' and the queue item is resolved.');
    }else{
      showMoveQueueNotice(x.name+' recommendation rejected. The live rank stayed at #'+x.current_rank+'.');
    }
  }catch(e){
    alert(e.message);
    if(btn){btn.disabled=false;btn.textContent=old}
  }
}


function scannerPct(v,digits=1){
  const n=Number(v);return Number.isFinite(n)?(n*100).toFixed(digits)+'%':'—';
}
function scannerNum(v,digits=1){
  const n=Number(v);return Number.isFinite(n)?n.toFixed(digits):'—';
}
function scannerInt(v){
  const n=Number(v);return Number.isFinite(n)?Math.round(n):'—';
}
function scannerDelta(v,kind='num'){
  const n=Number(v);if(!Number.isFinite(n))return '—';
  if(kind==='pct')return (n>0?'+':'')+(n*100).toFixed(1)+' pp';
  return (n>0?'+':'')+n.toFixed(kind==='int'?0:1);
}
async function loadWeeklyScanner(force=false,week=null){
  if(scannerLoading)return;
  if(scannerLoaded&&!force&&weeklyScanner){renderWeeklyScanner();return}
  scannerLoading=true;
  if($('#scannerLoadState'))$('#scannerLoadState').textContent='SCANNING…';
  try{
    weeklyScanner=await rpc('admin_get_weekly_performance_scanner',{p_season:null,p_week:week==null?null:Number(week),p_limit:500})||null;
    scannerLoaded=true;
    populateScannerWeeks();
    renderWeeklyScanner();
  }catch(e){
    console.error('BBB Weekly Performance Scanner failed',e);
    const grid=$('#scannerGrid');
    if(grid)grid.innerHTML='<div class="empty">'+esc(e.message||'Weekly scanner could not load.')+'</div>';
  }finally{
    scannerLoading=false;
    if($('#scannerLoadState'))$('#scannerLoadState').textContent='LIVE DATA';
  }
}
function populateScannerWeeks(){
  const sel=$('#scannerWeek');if(!sel||!weeklyScanner)return;
  const current=Number(weeklyScanner.week)||1;
  const existing=Number(sel.value);
  sel.innerHTML=Array.from({length:current},(_,i)=>current-i).map(w=>'<option value="'+w+'">Week '+w+'</option>').join('');
  sel.value=existing&&existing<=current?String(existing):String(current);
  if($('#scannerSeasonWeek'))$('#scannerSeasonWeek').textContent=weeklyScanner.season+' · WEEK '+weeklyScanner.week;
  if($('#scannerNavCount'))$('#scannerNavCount').textContent='W'+weeklyScanner.week;
}
function scannerRows(){
  return Array.isArray(weeklyScanner?.players)?weeklyScanner.players:[];
}
function scannerSignalClass(signal){
  return String(signal||'steady').toLowerCase().replaceAll(' ','-');
}
function scannerIsSignal(x){
  return ['BREAKOUT','RISING','FALLING','CONCERN'].includes(String(x.signal||''));
}
function filteredScanner(){
  const q=($('#scannerSearch')?.value||'').trim().toLowerCase();
  const pos=$('#scannerPos')?.value||'ALL';
  const signal=$('#scannerSignal')?.value||'ALL';
  const scope=$('#scannerScope')?.value||'SIGNALS';
  return scannerRows().filter(x=>{
    if(pos!=='ALL'&&x.position!==pos)return false;
    if(signal!=='ALL'&&x.signal!==signal)return false;
    if(scope==='SIGNALS'&&!scannerIsSignal(x))return false;
    if(scope==='DATA'&&(x.source==null||x.source==='bbb_zero_fill'))return false;
    const hay=(x.name+' '+(x.team||'')+' '+(x.position||'')+' '+(x.signal_reason||'')+' '+(x.college||'')).toLowerCase();
    return !q||hay.includes(q);
  });
}
function scannerStat(label,value,sub='',cls=''){
  return '<div class="scanner-stat '+cls+'"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong>'+(sub?'<small>'+esc(sub)+'</small>':'')+'</div>';
}
function scannerPositionStats(x){
  if(x.position==='QB'){
    return [
      scannerStat('PASS',''+scannerInt(x.completions)+' / '+scannerInt(x.attempts),scannerInt(x.passing_yards)+' yds · '+scannerInt(x.passing_tds)+' TD'),
      scannerStat('RUSH',scannerInt(x.carries)+' att',scannerInt(x.rushing_yards)+' yds'),
      scannerStat('PASS AIR YDS',scannerInt(x.passing_air_yards),'downfield volume'),
      scannerStat('CPOE',scannerNum(x.passing_cpoe,1),'> 0 is above expectation',Number(x.passing_cpoe)>0?'good':Number(x.passing_cpoe)<0?'bad':''),
      scannerStat('PASS EPA',scannerNum(x.passing_epa,1),'weekly efficiency',Number(x.passing_epa)>0?'good':Number(x.passing_epa)<0?'bad':''),
      scannerStat('PACR',scannerNum(x.pacr,2),'pass air conversion'),
      scannerStat('PPR',scannerNum(x.fantasy_points_ppr,1),'Δ '+scannerDelta(x.ppr_delta),Number(x.ppr_delta)>0?'good':Number(x.ppr_delta)<0?'bad':''),
      scannerStat('WEEK FIN',x.weekly_position_finish?'#'+x.weekly_position_finish:'—','position finish')
    ].join('');
  }
  if(x.position==='RB'){
    return [
      scannerStat('OPPORTUNITIES',scannerInt(x.opportunities),'Δ '+scannerDelta(x.opportunity_delta,'int'),Number(x.opportunity_delta)>0?'good':Number(x.opportunity_delta)<0?'bad':''),
      scannerStat('TEAM OPP SHARE',scannerPct(x.opportunity_share),'rush attempts + targets'),
      scannerStat('TOUCHES',scannerInt(x.touches),scannerInt(x.scrimmage_yards)+' scrim yds'),
      scannerStat('TARGET SHARE',scannerPct(x.target_share),'Δ '+scannerDelta(x.target_share_delta,'pct'),Number(x.target_share_delta)>0?'good':Number(x.target_share_delta)<0?'bad':''),
      scannerStat('YPC',scannerNum(x.yards_per_carry,2),scannerInt(x.carries)+' carries'),
      scannerStat('YDS / TGT',scannerNum(x.yards_per_target,2),scannerInt(x.targets)+' targets'),
      scannerStat('RUSH EPA',scannerNum(x.rushing_epa,1),'weekly rushing efficiency',Number(x.rushing_epa)>0?'good':Number(x.rushing_epa)<0?'bad':''),
      scannerStat('REC EPA',scannerNum(x.receiving_epa,1),'weekly receiving efficiency',Number(x.receiving_epa)>0?'good':Number(x.receiving_epa)<0?'bad':'')
    ].join('');
  }
  return [
    scannerStat('TARGET SHARE',scannerPct(x.target_share),'Δ '+scannerDelta(x.target_share_delta,'pct'),Number(x.target_share_delta)>0?'good':Number(x.target_share_delta)<0?'bad':''),
    scannerStat('AIR YARDS SHARE',scannerPct(x.air_yards_share),'Δ '+scannerDelta(x.air_yards_share_delta,'pct'),Number(x.air_yards_share_delta)>0?'good':Number(x.air_yards_share_delta)<0?'bad':''),
    scannerStat('aDOT',scannerNum(x.adot,1),scannerInt(x.receiving_air_yards)+' air yds'),
    scannerStat('WOPR',scannerNum(x.wopr,2),'weighted opportunity'),
    scannerStat('RACR',scannerNum(x.racr,2),'air-yards conversion'),
    scannerStat('YAC / REC',scannerNum(x.yac_per_reception,1),scannerInt(x.receiving_yards_after_catch)+' total YAC'),
    scannerStat('YDS / TGT',scannerNum(x.yards_per_target,1),scannerInt(x.targets)+' targets'),
    scannerStat('REC EPA',scannerNum(x.receiving_epa,1),scannerInt(x.receiving_first_downs)+' first downs',Number(x.receiving_epa)>0?'good':Number(x.receiving_epa)<0?'bad':'')
  ].join('');
}
function scannerBoxScore(x){
  if(x.source==null)return 'No Week '+weeklyScanner.week+' row';
  if(x.source==='bbb_zero_fill')return 'No offensive stat line';
  if(x.position==='QB')return scannerInt(x.completions)+'/'+scannerInt(x.attempts)+' · '+scannerInt(x.passing_yards)+' pass yds · '+scannerInt(x.passing_tds)+' pass TD · '+scannerInt(x.carries)+' rush';
  if(x.position==='RB')return scannerInt(x.carries)+' car · '+scannerInt(x.rushing_yards)+' rush yds · '+scannerInt(x.targets)+' tgt · '+scannerInt(x.receiving_yards)+' rec yds';
  return scannerInt(x.targets)+' tgt · '+scannerInt(x.receptions)+' rec · '+scannerInt(x.receiving_yards)+' yds · '+scannerInt(x.receiving_tds)+' TD';
}
function scannerQueued(x){
  return rankingMoveQueue.some(q=>q.status==='pending'&&q.player_key===x.player_key);
}
function renderWeeklyScanner(){
  const grid=$('#scannerGrid');if(!grid)return;
  if(!scannerLoaded||!weeklyScanner){
    if(!scannerLoading)void loadWeeklyScanner(false);
    return;
  }
  const rows=scannerRows(),list=filteredScanner();
  const breakout=rows.filter(x=>x.signal==='BREAKOUT').length;
  const rising=rows.filter(x=>x.signal==='RISING').length;
  const falling=rows.filter(x=>x.signal==='FALLING'||x.signal==='CONCERN').length;
  const usage=rows.filter(x=>Math.abs(Number(x.target_share_delta)||0)>=.08||Math.abs(Number(x.opportunity_delta)||0)>=5).length;
  if($('#scannerBreakout'))$('#scannerBreakout').textContent=breakout;
  if($('#scannerRising'))$('#scannerRising').textContent=rising;
  if($('#scannerConcern'))$('#scannerConcern').textContent=falling;
  if($('#scannerUsage'))$('#scannerUsage').textContent=usage;
  if($('#scannerCount'))$('#scannerCount').textContent=list.length+' players shown';
  if($('#scannerRouteNote'))$('#scannerRouteNote').textContent=weeklyScanner.route_metrics_note||'Route metrics require a separate source.';
  if($('#scannerSeasonWeek'))$('#scannerSeasonWeek').textContent=weeklyScanner.season+' · WEEK '+weeklyScanner.week;
  if($('#scannerNavCount'))$('#scannerNavCount').textContent='W'+weeklyScanner.week;

  grid.innerHTML=list.length?list.map(x=>{
    const sig=scannerSignalClass(x.signal);
    const queued=scannerQueued(x);
    return '<article class="scanner-card '+sig+'">'+
      '<div class="scanner-card-head">'+
        '<div class="scanner-player"><span class="scanner-rank">#'+x.overall_rank+'</span><div><button type="button" data-scanner-open="'+esc(x.player_key)+'">'+esc(x.name)+'</button><span>'+esc(x.position)+' · '+esc(x.team||'FA')+' vs '+esc(x.opponent_team||'—')+'</span></div></div>'+
        '<div class="scanner-head-right"><span class="scanner-signal '+sig+'">'+esc(x.signal)+'</span><strong>'+esc(scannerBoxScore(x))+'</strong></div>'+
      '</div>'+
      '<div class="scanner-reason"><span>WHY THE SCANNER FLAGGED IT</span><p>'+esc(x.signal_reason||'No major usage change detected.')+'</p><small>Prior data: '+(x.prior_week?'Week '+x.prior_week:'none')+' · PPR '+scannerNum(x.fantasy_points_ppr,1)+' ('+scannerDelta(x.ppr_delta)+')</small></div>'+
      '<div class="scanner-stats">'+scannerPositionStats(x)+'</div>'+
      '<div class="scanner-card-foot">'+
        '<div class="scanner-market"><span>BBB #'+x.overall_rank+'</span><span>'+(x.fp_sf_rank?'Market #'+x.fp_sf_rank:'Market UR')+'</span><span class="'+(Number(x.bbb_vs_fp)>0?'good':Number(x.bbb_vs_fp)<0?'bad':'')+'">Edge '+(x.bbb_vs_fp==null?'—':(Number(x.bbb_vs_fp)>0?'+':'')+x.bbb_vs_fp)+'</span><span class="'+(healthy(x.injury_status)?'':'bad')+'">'+esc(x.injury_status||'Healthy')+'</span></div>'+
        '<div class="scanner-actions"><button type="button" class="small-btn" data-scanner-open="'+esc(x.player_key)+'">OPEN PLAYER</button><button type="button" class="queue-action '+(queued?'verified-state':'')+'" data-scanner-queue="'+esc(x.player_key)+'" '+(queued?'disabled':'')+'>'+(queued?'QUEUED ✓':'QUEUE RANK REVIEW')+'</button></div>'+
      '</div>'+
    '</article>';
  }).join(''):'<div class="move-queue-empty"><div class="move-empty-orb">◎</div><strong>No players match this scanner view.</strong><span>Try All Players, another position, or clear the signal filter.</span></div>';

  $('[data-scanner-open]').forEach(b=>b.onclick=()=>window.openBBBPlayerWorkspace?.(b.dataset.scannerOpen,'stats'));
  $('[data-scanner-queue]').forEach(b=>b.onclick=()=>queueScannerReview(b.dataset.scannerQueue,b));
}
async function queueScannerReview(key,btn){
  const x=scannerRows().find(v=>v.player_key===key);if(!x)return;
  const reason='Week '+weeklyScanner.week+' '+String(x.signal||'weekly').toLowerCase()+' signal: '+(x.signal_reason||scannerBoxScore(x));
  const priority=['BREAKOUT','FALLING'].includes(x.signal)?2:3;
  const old=btn.textContent;btn.disabled=true;btn.textContent='QUEUING…';
  try{
    await rpc('admin_queue_ranking_move',{
      p_player_key:key,
      p_recommended_rank:null,
      p_reason:reason,
      p_priority:priority,
      p_source:'weekly_scanner',
      p_confidence:Math.abs(Number(x.signal_score)||0)>=5?'high':'medium',
      p_trigger_update_id:null
    });
    await Promise.all([loadRankingMoveQueue(),loadReviewQueue()]);
    renderWeeklyScanner();renderRankingMoveQueue();renderReviewQueue();renderCommandDashboard();
  }catch(e){
    alert(e.message);btn.disabled=false;btn.textContent=old;
  }
}

const clip=(v,len=180)=>{const x=String(v??'').replace(/\s+/g,' ').trim();return x.length>len?x.slice(0,len-1)+'…':x};
const PROSPECT_TRAITS={
QB:[['Arm Talent (10)',10],['Deep Accuracy (10)',10],['Play Extension (5)',5],['Rushing Upside (5)',5],['Short Accuracy (5)',5],['Pocket Presence (10)',10],['Pressure / Clutch (5)',5],['Throw Off-Platform (5)',5],['Pre-Snap Processing (5)',5],['Post-Snap Processing (10)',10],['Anticipation / Timing (10)',10],['Intermediate Accuracy (10)',10],['Decision Making / Ball Security (10)',10]],
RB:[['Speed',10],['Run IQ',5],['Vision',5],['Agility',5],['Catching',5],['Creativity',5],['DAWG Factor',5],['Physicality',5],['Acceleration',10],['Deceleration',5],['Ball Security',5],['Route Running',5],['Contact Balance',5],['Pass Protection',5],['Run After Catch',5],['College Analytics',5],['Change of Direction',5],['Projected Draft Capital',5]],
WR:[['Speed',10],['Agility',5],['Catching',5],['Releases',5],['Analytics',10],['DAWG Factor',5],['Deep Routes',5],['Acceleration',10],['Deceleration',5],['Double Moves',5],['Short Routes',5],['Medium Routes',5],['Run After Catch',5],['Catch in Traffic',5],['X/Z/Slot Ability',5],['Change of Direction',5],['Projected Draft Capital',5]],
TE:[['Speed',10],['Agility',5],['Blocking',5],['Catching',5],['Analytics',10],['DAWG Factor',5],['Deep Routes',5],['Football IQ',5],['Acceleration',10],['Deceleration',5],['Short Routes',5],['Medium Routes',5],['Run After Catch',5],['Catch in Traffic',5],['Change of Direction',5],['Positional Versatility',5],['Projected Draft Capital',5]]
};
function prospectReady(x){return x.research_status==='researched'||x.recommended_overall_grade!=null||Object.keys(x.recommended_traits||{}).length>0}
function filteredProspects(){
  const q=($('#prospectSearch')?.value||'').toLowerCase();
  const year=$('#prospectYear')?.value||'ALL';
  const pos=$('#prospectPos')?.value||'ALL';
  const research=$('#prospectResearch')?.value||'ALL';
  const show=!!$('#prospectIncludeGraded')?.checked;
  return prospectLab.filter(x=>
    (prospectGradeOnly?x.graded:(show||!x.graded))&&
    (year==='ALL'||String(x.class_year)===year)&&
    (pos==='ALL'||x.position===pos)&&
    (research==='ALL'||(research==='READY')===prospectReady(x))&&
    (!q||(x.name+' '+(x.school||'')).toLowerCase().includes(q))
  );
}
function renderProspectLab(){
 const grid=$('#prospectLabGrid');if(!grid)return;
 const ungraded=prospectLab.filter(x=>!x.graded);
 $('#prospectUngraded').textContent=ungraded.length;$('#prospect2027').textContent=prospectLab.filter(x=>+x.class_year===2027).length;$('#prospect2028').textContent=prospectLab.filter(x=>+x.class_year===2028).length;$('#prospectResearched').textContent=prospectLab.filter(prospectReady).length;$('#prospectNavCount').textContent=ungraded.length||'04';
 const list=filteredProspects();
 grid.innerHTML=list.length?list.map(x=>`<article class="prospect-card" data-open-prospect="${esc(x.player_key)}">${x.graded?'<span class="prospect-graded">GRADED</span>':''}<div class="prospect-card-head"><span class="prospect-pos">${esc(x.position)}</span><div class="prospect-name"><strong>${esc(x.name)}</strong><span>${esc(x.school||'School TBD')}</span></div><span class="prospect-class">${x.class_year}${x.class_verified_at?' ✓':''}</span></div><div class="prospect-card-summary">${esc(x.summary||'Research profile pending. This player is in your scouting queue and ready for a BBB grading pass.')}</div><div class="prospect-card-rec"><div><span>RECOMMENDED GRADE</span><strong class="${x.recommended_overall_grade==null?'pending':''}">${x.recommended_overall_grade==null?'PENDING':Number(x.recommended_overall_grade).toFixed(1)}</strong></div><div><span>PRO COMP IDEA</span><strong class="${x.recommended_pro_comp?'':'pending'}">${esc(x.recommended_pro_comp||'PENDING')}</strong></div></div><div class="prospect-card-actions"><span class="research-state ${prospectReady(x)?'ready':''} ${esc(x.research_depth||'pending')}"><i></i>${prospectReady(x)?((x.research_depth==='deep'?'DEEP':'BASELINE')+' · '+String(x.research_confidence||'UNRATED').toUpperCase()):'RESEARCH PENDING'}</span><button class="small-btn grade-prospect-btn" data-grade-prospect="${esc(x.player_key)}">${x.graded?'EDIT GRADE':'GRADE PLAYER'}</button></div></article>`).join(''):'<div class="empty">No prospects match these filters.</div>';
}
function prospectTotal(){const t=$$('[data-prospect-trait]').reduce((a,i)=>a+(+i.value||0),0);$('#prospectGradeTotal').textContent=t.toFixed(1);return +t.toFixed(1)}
function prospectByKey(key){return prospectLab.find(v=>v.player_key===key)}
function renderProspectRecommendationTraits(x){
 const el=$('#prospectRecommendationTraits');if(!el)return;const traits=x?.recommended_traits||{},schema=PROSPECT_TRAITS[x?.position]||[];
 if(!Object.keys(traits).length){el.innerHTML='<div class="empty">Full trait recommendations are still being researched.</div>';return}
 el.innerHTML=schema.map(([label,max])=>`<div class="prospect-rec-trait"><span>${esc(label)}</span><strong>${traits[label]??'—'} / ${max}</strong></div>`).join('');
}
function renderProspectSources(x){
 const el=$('#prospectSourceLinks');if(!el)return;const urls=Array.isArray(x?.source_urls)?x.source_urls:[];
 el.innerHTML=urls.length?urls.map((url,i)=>`<a href="${esc(url)}" target="_blank" rel="noopener">SOURCE ${i+1} ↗</a>`).join(''):'<span class="empty">Source trail pending.</span>';
}
function setProspectDrawerHeader(x,mode='report'){
 $('#prospectDrawerTitle').textContent=x.name;$('#prospectDrawerMeta').textContent=`${x.position} · ${x.school||'School TBD'} · ${x.class_year} NFL Draft Class`;const eyebrow=$('#prospectDrawer .eyebrow');if(eyebrow)eyebrow.textContent=mode==='grade'?'PROSPECT LAB · FINAL GRADE':'PROSPECT LAB · SCOUTING REPORT';
}
function showProspectReport(){$('#prospectReportView').classList.remove('hide');$('#prospectGradeForm').classList.add('hide')}
function showProspectGrade(){$('#prospectReportView').classList.add('hide');$('#prospectGradeForm').classList.remove('hide')}
function openProspectReport(key){
 const x=prospectByKey(key);if(!x)return;$('#prospectKey').value=key;setProspectDrawerHeader(x,'report');
 $('#prospectRecGrade').textContent=x.recommended_overall_grade==null?'Pending':(+x.recommended_overall_grade).toFixed(1);$('#prospectRecComp').textContent=x.recommended_pro_comp||'Research pending';
 $('#prospectClassLabel').textContent=String(x.class_year||'—');$('#prospectClassAudit').textContent=x.class_verification_note||'Class verification pending';$('#prospectResearchState').textContent=prospectReady(x)?((x.research_depth==='deep'?'Deep research':'Baseline research')+' · '+String(x.research_confidence||'unrated')+' confidence'):'Research pending';
 $('#prospectSummary').textContent=x.summary||'A full scouting breakdown has not been completed yet. The player is tracked so he stays on the BBB radar.';$('#prospectRecommendationNotes').textContent=x.recommendation_notes||'No additional recommendation notes yet.';
 renderProspectRecommendationTraits(x);renderProspectSources(x);$('#prospectStartGrade').dataset.playerKey=key;showProspectReport();$('#prospectDrawerBackdrop').classList.remove('hide');$('#prospectDrawer').classList.remove('hide');
}
function startProspectGrade(key){
 const x=prospectByKey(key);if(!x)return;$('#prospectKey').value=key;setProspectDrawerHeader(x,'grade');$('#prospectGradeRecGrade').textContent=x.recommended_overall_grade==null?'Pending':(+x.recommended_overall_grade).toFixed(1);$('#prospectGradeRecComp').textContent=x.recommended_pro_comp||'Research pending';$('#prospectFinalComp').value=x.pro_comp||x.recommended_pro_comp||'';
 const current=x.traits||{},rec=x.recommended_traits||{};$('#prospectTraitGrid').innerHTML=(PROSPECT_TRAITS[x.position]||[]).map(([label,max])=>`<div class="prospect-trait"><label>${esc(label)} <small>/ ${max}</small></label><span class="trait-rec">REC ${rec[label]??'—'}</span><input class="input trait-input" type="number" min="0" max="${max}" step="0.5" data-prospect-trait="${esc(label)}" value="${current[label]??''}"></div>`).join('');
 $('#prospectApplyRec').disabled=!Object.keys(rec).length;$('#prospectApplyRec').dataset.playerKey=key;$$('[data-prospect-trait]').forEach(i=>i.oninput=prospectTotal);prospectTotal();$('#prospectSaveStatus').textContent='';showProspectGrade();$('#prospectDrawerBackdrop').classList.remove('hide');$('#prospectDrawer').classList.remove('hide');
}
function closeProspectGrader(){$('#prospectDrawerBackdrop').classList.add('hide');$('#prospectDrawer').classList.add('hide')}
function applyProspectRec(){const x=prospectByKey($('#prospectApplyRec').dataset.playerKey);if(!x)return;$$('[data-prospect-trait]').forEach(i=>{if(x.recommended_traits?.[i.dataset.prospectTrait]!=null)i.value=x.recommended_traits[i.dataset.prospectTrait]});if(x.recommended_pro_comp)$('#prospectFinalComp').value=x.recommended_pro_comp;prospectTotal()}
async function saveProspectGrade(e){
 e.preventDefault();const x=prospectByKey($('#prospectKey').value);if(!x)return;const traits={};$$('[data-prospect-trait]').forEach(i=>{if(i.value!=='')traits[i.dataset.prospectTrait]=String(+i.value)});if(Object.keys(traits).length!==(PROSPECT_TRAITS[x.position]||[]).length)return alert('Finish every trait grade first.');
 const btn=$('#saveProspectGrade');btn.disabled=true;$('#prospectSaveStatus').textContent='Saving grade…';
 try{await rpc('admin_grade_prospect',{p_player_key:x.player_key,p_name:x.name,p_position:x.position,p_school:x.school||null,p_class_year:+x.class_year,p_overall_grade:prospectTotal(),p_pro_comp:$('#prospectFinalComp').value.trim()||null,p_traits:traits});await Promise.all([loadProspectLab(),loadCounts()]);renderProspectLab();$('#prospectSaveStatus').textContent='Grade locked ✓';setTimeout(closeProspectGrader,300)}catch(err){$('#prospectSaveStatus').textContent=err.message}finally{btn.disabled=false}
}
function reviewPriorityLabel(p){return Number(p)===1?'Critical':Number(p)===2?'High':'Normal'}
function reviewAge(h){const x=Number(h);if(!Number.isFinite(x))return'—';if(x<1)return'<1h ago';if(x<48)return`${Math.round(x)}h ago`;return`${Math.round(x/24)}d ago`}
function reviewSource(x){const src=x.source_1||x.source_2;if(!src)return'';if(/^https?:\/\//i.test(src))return `<a class="queue-source" href="${esc(src)}" target="_blank" rel="noopener">Source ↗</a>`;return `<div class="review-status">Source: ${esc(src)}</div>`}

function reviewVerificationNeeded(x){
  const hours=Number(x?.hours_since_verified);
  const target=Number(x?.freshness_target_hours);
  const stale=Number.isFinite(hours)&&Number.isFinite(target)&&hours>target;
  return stale||x?.latest_update_review_status==='needs_review';
}
function reviewActionHtml(x){
  const needsVerify=reviewVerificationNeeded(x);
  const verify=needsVerify
    ?'<button class="queue-action verify" data-review-verify="'+esc(x.player_key)+'">'+(x.ranking_review_needed?'VERIFY DATA':'MARK VERIFIED')+'</button>'
    :'<span class="queue-action verified-state">DATA VERIFIED ✓</span>';
  const rank='<button class="queue-action '+(x.ranking_review_needed?'resolve':'rank')+'" data-review-rank="'+esc(x.player_key)+'">'+(x.ranking_review_needed?'RESOLVE RANK':'FLAG RANK')+'</button>';
  const edit='<button class="queue-action" data-edit="'+esc(x.player_key)+'">EDIT</button>';
  const profile='<a class="queue-action" href="/player/'+encodeURIComponent(x.player_key)+'" target="_blank">PROFILE ↗</a>';
  return verify+rank+edit+profile;
}
function showReviewActionNotice(message,warn=false){
  const el=$('#reviewActionNotice');if(!el)return;
  const token=String(Date.now());
  el.dataset.token=token;
  el.textContent=message;
  el.classList.remove('hide','warn');
  if(warn)el.classList.add('warn');
  setTimeout(()=>{if(el.dataset.token===token)el.classList.add('hide')},6500);
}

function filteredReview(){const q=$('#reviewSearch')?.value.trim().toLowerCase()||'',priority=$('#reviewPriority')?.value||'ALL',kind=$('#reviewKind')?.value||'ALL';return reviewQueue.filter(x=>{if(priority!=='ALL'&&String(x.queue_priority)!==priority)return false;const hay=`${x.name} ${x.team||''} ${x.injury_status||''} ${x.attention_reason||''} ${x.latest_update_text||''}`.toLowerCase();if(q&&!hay.includes(q))return false;if(kind==='RANK'&&!x.ranking_review_needed)return false;if(kind==='INJURY'&&healthy(x.injury_status))return false;if(kind==='SOURCE'&&x.latest_update_review_status!=='needs_review'&&!String(x.attention_reason||'').toLowerCase().includes('source'))return false;if(kind==='STALE'&&!String(x.attention_reason||'').toLowerCase().includes('stale'))return false;return true})}
function renderReviewQueue(){
  if(!$('#reviewBody'))return;
  const list=filteredReview();
  const max=Math.max(0,Math.ceil(list.length/PAGE)-1);
  reviewPage=Math.min(reviewPage,max);
  const rows=list.slice(reviewPage*PAGE,(reviewPage+1)*PAGE);
  $('#reviewBody').innerHTML=rows.map(x=>
    '<tr>'+
      '<td><span class="queue-priority queue-p'+x.queue_priority+'">'+reviewPriorityLabel(x.queue_priority)+'</span></td>'+
      '<td class="rank-number">'+(x.overall_rank??'—')+'</td>'+
      '<td class="player-name">'+esc(x.name)+
        '<div class="review-status">'+esc(x.position||'')+' · '+esc(x.team||'FA')+'</div>'+
        (x.ranking_review_needed?'<span class="review-rank-flag">RANKING REVIEW</span>':'')+
      '</td>'+
      '<td class="'+(healthy(x.injury_status)?'green':'red')+'">'+esc(x.injury_status||'Healthy')+'</td>'+
      '<td>'+reviewAge(x.hours_since_verified)+'<div class="review-status">Target '+(x.freshness_target_hours||'—')+'h</div></td>'+
      '<td class="queue-reason">'+esc(x.attention_reason||'Review needed')+'</td>'+
      '<td class="queue-update">'+esc(clip(x.latest_update_text,190))+reviewSource(x)+'</td>'+
      '<td><div class="queue-actions">'+reviewActionHtml(x)+'</div></td>'+
    '</tr>'
  ).join('')||'<tr><td colspan="8" class="empty">Queue is clear for these filters.</td></tr>';

  $('#reviewCount').textContent=(list.length?reviewPage*PAGE+1:0)+'–'+Math.min((reviewPage+1)*PAGE,list.length)+' of '+list.length;
  $('#reviewPrev').disabled=reviewPage===0;
  $('#reviewNext').disabled=reviewPage>=max;
  const high=reviewQueue.filter(x=>Number(x.queue_priority)<=2).length;
  const normal=reviewQueue.filter(x=>Number(x.queue_priority)===3).length;
  const ranks=reviewQueue.filter(x=>x.ranking_review_needed).length;
  $('#metricReviewHigh').textContent=high;
  $('#metricReviewNormal').textContent=normal;
  $('#metricRankReviews').textContent=ranks;
  $('#reviewNavCount').textContent=reviewQueue.length;
  bindRows();
  bindReviewRows();
}
function renderDataHealth(){if(!$('#healthGrid'))return;const h=dataHealth||{};const integrity=Number(h.ranked_players)===500&&Number(h.unique_rank_slots)===500;const checks=[['Rank Slots',integrity?`${h.unique_rank_slots}/500`:`${h.unique_rank_slots||0}/${h.ranked_players||0}`,integrity],['Breakdowns',Number(h.missing_breakdowns)===0?'Complete':`${h.missing_breakdowns} missing`,Number(h.missing_breakdowns)===0],['Sources',Number(h.missing_breakdown_sources)===0?'Complete':`${h.missing_breakdown_sources} missing`,Number(h.missing_breakdown_sources)===0],['Team Sync',Number(h.team_mismatches)===0?'Clean':`${h.team_mismatches} issues`,Number(h.team_mismatches)===0],['Injury Sync',Number(h.injury_status_mismatches)===0?'Clean':`${h.injury_status_mismatches} issues`,Number(h.injury_status_mismatches)===0],['Rank History',Number(h.duplicate_ranking_history_groups)===0?'Clean':`${h.duplicate_ranking_history_groups} dupes`,Number(h.duplicate_ranking_history_groups)===0]];$('#healthGrid').innerHTML=checks.map(([label,value,ok])=>`<div class="health-chip ${ok?'health-ok':'health-bad'}"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');$('#metricBoardHealth').textContent=checks.every(x=>x[2])?'CLEAN':'CHECK'}
function bindReviewRows(){$$('[data-review-verify]').forEach(b=>b.onclick=()=>markReviewVerified(b.dataset.reviewVerify,b));$$('[data-review-rank]').forEach(b=>b.onclick=()=>toggleRankingReview(b.dataset.reviewRank,b))}
async function refreshReviewOnly(){
  commandBrief=null;
  await Promise.all([loadReviewQueue(),loadDataHealth(),loadActivity()]);
  await loadCommandBrief(true);
  renderReviewQueue();
  renderDataHealth();
  renderCommandDashboard();
}
async function markReviewVerified(key,btn){
  const x=reviewQueue.find(v=>v.player_key===key);if(!x)return;
  const old=btn.textContent;
  btn.disabled=true;
  btn.textContent='VERIFYING…';
  try{
    await rpc('admin_mark_player_verified',{p_player_key:key});
    await refreshReviewOnly();
    const remaining=reviewQueue.find(v=>v.player_key===key);
    if(remaining){
      showReviewActionNotice(
        x.name+' data verified. Still needs attention: '+(remaining.attention_reason||'another review item remains.'),
        true
      );
    }else{
      showReviewActionNotice(x.name+' verified — Review Queue item cleared.');
    }
  }catch(e){
    alert(e.message);
    btn.disabled=false;
    btn.textContent=old;
  }
}
async function toggleRankingReview(key,btn){
  const x=reviewQueue.find(v=>v.player_key===key);if(!x)return;
  const old=btn.textContent;
  btn.disabled=true;
  btn.textContent='…';
  try{
    if(x.ranking_review_needed){
      await rpc('admin_set_ranking_review',{p_player_key:key,p_needed:false,p_reason:null,p_priority:1});
      await refreshReviewOnly();
      const remaining=reviewQueue.find(v=>v.player_key===key);
      if(remaining){
        showReviewActionNotice(
          x.name+' ranking review resolved. Still needs attention: '+(remaining.attention_reason||'another review item remains.'),
          true
        );
      }else{
        showReviewActionNotice(x.name+' ranking review resolved — Review Queue item cleared.');
      }
    }else{
      const reason=prompt('Why should '+x.name+' get a ranking review?',x.attention_reason||'Manual ranking review');
      if(reason===null){btn.disabled=false;btn.textContent=old;return}
      await rpc('admin_set_ranking_review',{p_player_key:key,p_needed:true,p_reason:reason,p_priority:2});
      await refreshReviewOnly();
      showReviewActionNotice(x.name+' flagged for a ranking decision.',true);
    }
  }catch(e){
    alert(e.message);
    btn.disabled=false;
    btn.textContent=old;
  }
}
async function movePlayer(key){const x=board.find(p=>p.player_key===key);const input=$(`[data-move-input="${CSS.escape(key)}"]`);const nr=Number(input?.value);if(!x||!Number.isInteger(nr)||nr<1||nr>board.length)return alert(`Enter a rank from 1 to ${board.length}.`);if(nr===x.rank)return;const btn=$(`[data-move="${CSS.escape(key)}"]`);const old=btn.textContent;btn.disabled=true;btn.textContent='…';try{const result=await rpc('admin_move_dynasty_player',{p_player_key:key,p_new_rank:nr});await Promise.all([loadBoard(),loadActivity()]);renderRankings();renderPlayers();if($('#metricInjuries'))$('#metricInjuries').textContent=board.filter(v=>!healthy(v.injury_status)).length;renderCommandDashboard();alert(`${x.name} moved from #${x.rank} to #${nr}. ${result?.affected??''} board rows updated.`)}catch(e){alert(e.message)}finally{btn.disabled=false;btn.textContent=old}}
function openEditor(key){const b=board.find(x=>x.player_key===key),p=profileMap.get(key)||{};if(!b)return;$('#editKey').value=key;$('#drawerTitle').textContent=b.name;$('#editName').value=b.name||'';$('#editPosition').value=b.pos||'WR';$('#editTeam').value=b.team||'';$('#editAge').value=b.age??'';$('#editDraft').value=b.draft??'';$('#editCollege').value=b.college||'';$('#editInjury').value=p.injury_status||b.injury_status||'Healthy';$('#editInjuryDate').value=(p.injury_updated||b.injury_updated||'').slice(0,10);$('#editInjuryNote').value=p.injury_note||b.injury_note||'';$('#editOverview').value=p.overall_breakdown||b.overview||'';$('#profileLink').href=`/player/${encodeURIComponent(key)}`;$('#saveStatus').textContent='';$('#drawerBackdrop').classList.remove('hide');$('#playerDrawer').classList.remove('hide')}
function closeEditor(){$('#drawerBackdrop').classList.add('hide');$('#playerDrawer').classList.add('hide')}
async function savePlayer(e){e.preventDefault();const key=$('#editKey').value;if(!key)return;const save=$('#savePlayer');save.disabled=true;$('#saveStatus').textContent='Saving…';const identity={name:$('#editName').value.trim(),position:$('#editPosition').value,team:$('#editTeam').value.trim(),age:n($('#editAge').value),draft_year:n($('#editDraft').value),college:$('#editCollege').value.trim()||null};const profile={player_key:key,overall_breakdown:$('#editOverview').value.trim(),breakdown_basis:'BBB Admin',breakdown_updated:new Date().toISOString().slice(0,10),injury_status:$('#editInjury').value.trim()||'Healthy',injury_note:$('#editInjuryNote').value.trim(),injury_updated:$('#editInjuryDate').value||new Date().toISOString().slice(0,10),review_status:'Reviewed'};try{await rest(`players?player_key=eq.${encodeURIComponent(key)}`,{method:'PATCH',headers:{'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify(identity)});await rest(`player_profiles?on_conflict=player_key`,{method:'POST',headers:{'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(profile)});$('#saveStatus').textContent='Saved ✓';await Promise.all([loadBoard(),loadProfiles(),loadActivity()]);renderRankings();renderPlayers();if($('#metricInjuries'))$('#metricInjuries').textContent=board.filter(v=>!healthy(v.injury_status)).length;renderCommandDashboard();$('#drawerTitle').textContent=identity.name}catch(err){$('#saveStatus').textContent=err.message;$('#saveStatus').style.color='#ef8585'}finally{save.disabled=false}}

function researchHours(ts){if(!ts)return Infinity;const t=new Date(ts).getTime();return Number.isFinite(t)?Math.max(0,(Date.now()-t)/36e5):Infinity}
function researchAgeLabel(hours){
  if(!Number.isFinite(hours))return 'Never verified';
  if(hours<1)return 'Verified <1h ago';
  if(hours<24)return 'Verified '+Math.floor(hours)+'h ago';
  return 'Verified '+Math.floor(hours/24)+'d ago';
}
function researchPriorityLabel(p){return p===1?'P1 · CRITICAL':p===2?'P2 · HIGH':'P3 · NORMAL'}
function researchHasIssue(row,code){return row.issues.some(x=>x.code===code)}
function buildResearchRows(dynastyRows,rawProfiles,statsRows){
  const rawMap=new Map((rawProfiles||[]).map(x=>[x.player_key,x]));
  const statsSet=new Set((statsRows||[]).map(x=>x.player_key));
  const dynasty=(dynastyRows||[]).map(x=>{
    const raw=rawMap.get(x.player_key)||{};
    const issues=[];let deduct=0,urgency=0;
    const add=(code,label,severity,points,boost)=>{issues.push({code,label,severity:severity||''});deduct+=points||0;urgency+=boost||0};
    if(!x.college)add('RESEARCH','Missing college','hot',12,20);
    if(x.draft==null||x.draft==='')add('RESEARCH','Missing draft data','hot',10,20);
    if(!x.overview)add('RESEARCH','Missing player overview','hot',18,25);
    if(!x.latest_update)add('RESEARCH','No current player update','warn',16,22);
    if(!statsSet.has(x.player_key))add('STATS','No 2026 stat row','warn',10,10);
    if(x.market==null||x.market==='')add('MARKET','Market rank unavailable','',6,4);
    const age=researchHours(raw.last_verified_at);
    if(!Number.isFinite(age)||age>=72)add('STALE',Number.isFinite(age)?'Stale '+Math.floor(age/24)+'d':'Never verified','warn',14,18);
    if(raw.ranking_review_needed)add('RANK','Ranking review flagged','hot',0,55);
    if(!healthy(x.injury_status))add('RESEARCH','Active availability flag','warn',0,12);
    if(Number(x.rank)<=50)urgency+=10;else if(Number(x.rank)<=100)urgency+=6;else if(Number(x.rank)<=250)urgency+=3;
    const priority=urgency>=50?1:urgency>=25?2:3;
    const completeness=Math.max(0,Math.min(100,100-deduct));
    let workspaceTab='data';
    if(issues.some(i=>i.code==='RANK'))workspaceTab='dynasty';
    else if(issues.some(i=>i.code==='STATS'))workspaceTab='stats';
    else if(issues.some(i=>i.code==='STALE'))workspaceTab='activity';
    return {
      kind:'DYNASTY',player_key:x.player_key,name:x.name,position:x.pos,team:x.team||'FA',school:x.college||'College —',
      class_year:null,rank:Number(x.rank)||null,priority,urgency,completeness,issues,workspaceTab,
      verifiedHours:age,context:'#'+(x.rank||'—')+' · '+(x.pos||'—')+' · '+(x.team||'FA'),
      graded:true
    };
  }).filter(x=>x.issues.length);

  const prospects=(prospectLab||[]).map(x=>{
    const issues=[];let deduct=0,urgency=0;
    const add=(code,label,severity,points,boost)=>{issues.push({code,label,severity:severity||''});deduct+=points||0;urgency+=boost||0};
    if(!prospectReady(x))add('RESEARCH','Research profile incomplete','hot',18,45);
    if(!x.summary)add('RESEARCH','Missing scouting summary','hot',18,25);
    if(x.recommended_overall_grade==null)add('RESEARCH','Missing recommended grade','hot',15,25);
    if(!x.recommended_pro_comp)add('RESEARCH','Missing pro comp','warn',12,15);
    const sources=Array.isArray(x.source_urls)?x.source_urls:[];
    if(!sources.length)add('RESEARCH','No research sources','warn',12,12);
    if(!x.class_verified_at)add('CLASS','Draft class unverified','hot',16,50);
    if(!x.graded)add('GRADE','Needs BBB grade','warn',15,20);
    if(Number(x.class_year)===2027)urgency+=10;else urgency+=4;
    const priority=urgency>=50?1:urgency>=25?2:3;
    const completeness=Math.max(0,Math.min(100,100-deduct));
    return {
      kind:'PROSPECT',player_key:x.player_key,name:x.name,position:x.position,team:'',school:x.school||'School TBD',
      class_year:Number(x.class_year)||null,rank:null,priority,urgency,completeness,issues,workspaceTab:'scouting',
      verifiedHours:Infinity,context:(x.class_year||'—')+' NFL Draft · '+(x.position||'—')+' · '+(x.school||'School TBD'),
      graded:!!x.graded
    };
  }).filter(x=>x.issues.length);

  return dynasty.concat(prospects).sort((a,b)=>a.priority-b.priority||a.completeness-b.completeness||b.urgency-a.urgency||(a.rank||9999)-(b.rank||9999)||a.name.localeCompare(b.name));
}
async function loadResearchQueue(force){
  if(researchLoading)return;
  if(researchLoaded&&!force){renderResearchQueue();return}
  researchLoading=true;
  const state=$('#researchLoadState');
  if(state){state.textContent='SCANNING…';state.classList.remove('good')}
  const grid=$('#researchQueueGrid');
  if(grid&&!researchLoaded)grid.innerHTML='<div class="research-loading"><span></span><strong>Scanning BBB player data…</strong><small>Building completeness and urgency scores.</small></div>';
  try{
    const jobs=await Promise.allSettled([
      rest('site_dynasty?select=rank,player_key,name,pos,pr,team,age,draft,market,gap,view,fp_status,injury_status,injury_note,injury_updated,college,overview,latest_update,weekly_update_date&order=rank.asc'),
      rest('player_profiles?select=player_key,last_verified_at,review_status,ranking_review_needed,ranking_review_reason,ranking_review_priority'),
      rest('player_season_stats?select=player_key,season,games,team,updated_at&season=eq.2026')
    ]);
    const failed=jobs.filter(x=>x.status==='rejected');
    if(failed.length)throw failed[0].reason;
    researchQueue=buildResearchRows(jobs[0].value||[],jobs[1].value||[],jobs[2].value||[]);
    researchLoaded=true;
    renderResearchQueue();
    if(state){state.textContent='LIVE · '+researchQueue.length+' ITEMS';state.classList.add('good')}
  }catch(e){
    console.error('BBB Research Queue load failed',e);
    if(state){state.textContent='LOAD ERROR';state.classList.remove('good')}
    if(grid)grid.innerHTML='<div class="research-empty"><strong>Research Queue could not load.</strong><span>'+esc(e.message||'Unknown error')+'</span></div>';
  }finally{researchLoading=false}
}
function researchOwner(row){
  const has=code=>researchHasIssue(row,code);
  if(row.kind==='PROSPECT'&&(has('RESEARCH')||has('CLASS')))return 'SYSTEM';
  if(has('RANK')||has('GRADE'))return 'BOBBY';
  if(has('RESEARCH')||has('STATS')||has('STALE')||has('CLASS'))return 'SYSTEM';
  return 'FYI';
}
function researchOwnerMeta(owner){
  if(owner==='BOBBY')return {label:'YOUR DECISION',icon:'★',title:'Bobby Action Required',desc:'Only decisions that need your football judgment.'};
  if(owner==='SYSTEM')return {label:'SYSTEM WORK',icon:'⚙',title:'System Work Queue',desc:'Data and research cleanup that should not require a Bobby decision.'};
  return {label:'FYI',icon:'◎',title:'Data Health / FYI',desc:'Useful signals to know about, but nothing you need to act on right now.'};
}
function researchInstruction(row){
  const has=code=>researchHasIssue(row,code);
  if(researchOwner(row)==='BOBBY'){
    if(has('RANK'))return 'Open Dynasty, review the latest context and market position, then decide whether the current BBB rank should move.';
    if(has('GRADE'))return 'Review the scouting recommendation, adjust the traits or comp if needed, then lock in your final BBB grade.';
    return 'Review the player context and make the final BBB decision.';
  }
  if(researchOwner(row)==='SYSTEM'){
    if(row.kind==='PROSPECT'&&has('CLASS'))return 'Verify the draft class from current sources. Only escalate this to Bobby if the evidence conflicts or remains unclear.';
    if(row.kind==='PROSPECT'&&has('RESEARCH'))return 'Finish or refresh the scouting recommendation, sources, comp and trait notes before this reaches Bobby for grading.';
    if(has('STATS')&&has('STALE'))return 'Refresh the current-season stats and recheck the latest player status. Escalate only if something meaningful changed.';
    if(has('STATS'))return 'Refresh the missing 2026 stat coverage. No manual football decision is needed.';
    if(has('STALE'))return 'Recheck the latest player status/news and refresh verification. Escalate only if new information changes the player outlook.';
    return 'Fill the missing profile or research data in the background. No Bobby decision is needed yet.';
  }
  if(has('MARKET'))return 'Market coverage is missing or unavailable. Keep this visible for data health, but it does not require a ranking decision by itself.';
  return 'Informational data-health signal only. No action is required right now.';
}
function researchPrimaryLabel(row){
  if(researchOwner(row)==='BOBBY'){
    if(researchHasIssue(row,'RANK'))return 'REVIEW DYNASTY';
    if(researchHasIssue(row,'GRADE'))return 'SCOUT / GRADE';
    return 'OPEN WORKSPACE';
  }
  return researchOwner(row)==='SYSTEM'?'VIEW DATA':'VIEW DETAILS';
}
function activeResearchOwner(){
  return $('.research-owner-tab.active')?.dataset.researchOwner||'BOBBY';
}
function researchIssueCompatible(owner,issue){
  if(!issue||issue==='ALL'||owner==='ALL')return true;
  if(owner==='BOBBY')return ['GRADE','RANK'].includes(issue);
  if(owner==='SYSTEM')return ['RESEARCH','CLASS','STATS','STALE'].includes(issue);
  if(owner==='FYI')return ['MARKET'].includes(issue);
  return true;
}
function setResearchOwner(owner){
  $$('.research-owner-tab').forEach(b=>b.classList.toggle('active',b.dataset.researchOwner===owner));
  const issue=$('#researchIssue');
  if(issue&&!researchIssueCompatible(owner,issue.value))issue.value='ALL';
  renderResearchQueue();
}
function filteredResearchRows(ownerOverride){
  const q=String($('#researchSearch')?.value||'').trim().toLowerCase();
  const scope=$('#researchScope')?.value||'ALL',issue=$('#researchIssue')?.value||'ALL',priority=$('#researchPriority')?.value||'ALL',year=$('#researchClass')?.value||'ALL';
  const owner=ownerOverride||activeResearchOwner();
  return researchQueue.filter(x=>{
    if(owner!=='ALL'&&researchOwner(x)!==owner)return false;
    if(scope!=='ALL'&&x.kind!==scope)return false;
    if(issue!=='ALL'&&!researchHasIssue(x,issue))return false;
    if(priority!=='ALL'&&String(x.priority)!==priority)return false;
    if(year!=='ALL'&&String(x.class_year)!==year)return false;
    if(q){
      const hay=(x.name+' '+x.position+' '+x.team+' '+x.school+' '+x.context+' '+x.issues.map(i=>i.label).join(' ')).toLowerCase();
      if(!hay.includes(q))return false;
    }
    return true;
  });
}
function researchCardHtml(x){
  const owner=researchOwner(x),meta=researchOwnerMeta(owner);
  const issueHtml=x.issues.slice(0,5).map(i=>'<span class="research-issue '+esc(i.severity)+'">'+esc(i.label)+'</span>').join('')+(x.issues.length>5?'<span class="research-issue">+'+(x.issues.length-5)+' more</span>':'');
  const playerMeta=x.kind==='PROSPECT'?(x.class_year+' · '+x.school):x.context;
  const context=x.kind==='DYNASTY'?researchAgeLabel(x.verifiedHours):(x.graded?'BBB grade saved':'Awaiting Bobby grade');
  return '<article class="research-card p'+x.priority+' owner-'+owner.toLowerCase()+'">'+
    '<div class="research-card-head"><span class="research-kind">'+esc(x.kind==='PROSPECT'?'PRO':x.position)+'</span><div class="research-player"><span class="research-owner-chip">'+esc(meta.icon+' '+meta.label)+'</span><strong>'+esc(x.name)+'</strong><span>'+esc(playerMeta)+'</span></div><div class="research-priority"><b>'+researchPriorityLabel(x.priority)+'</b><span>urgency '+x.urgency+'</span></div></div>'+
    '<div class="research-score-row"><div class="research-score"><strong>'+x.completeness+'</strong><span>% COMPLETE</span></div><div><div class="research-complete-bar"><i style="width:'+x.completeness+'%"></i></div><div class="research-complete-label"><span>Data completeness</span><span>'+x.issues.length+' issue'+(x.issues.length===1?'':'s')+'</span></div></div></div>'+
    '<div class="research-issues">'+issueHtml+'</div>'+
    '<div class="research-instruction"><span>'+(owner==='BOBBY'?'WHAT YOU NEED TO DO':owner==='SYSTEM'?'SYSTEM WORK':'WHY THIS IS HERE')+'</span><strong>'+esc(researchInstruction(x))+'</strong></div>'+
    '<div class="research-card-foot"><span class="research-context">'+esc(context)+'</span><div class="research-actions">'+
      (owner==='BOBBY'
        ?'<button type="button" class="research-open primary" data-research-open="'+esc(x.player_key)+'" data-research-tab="'+esc(x.workspaceTab)+'">'+researchPrimaryLabel(x)+'</button>'
        :'<span class="research-no-action">'+(owner==='SYSTEM'?'NO BOBBY ACTION':'FYI ONLY')+'</span><button type="button" class="research-open" data-research-open="'+esc(x.player_key)+'" data-research-tab="'+esc(x.workspaceTab)+'">'+researchPrimaryLabel(x)+'</button>')+
    '</div></div>'+
  '</article>';
}
function researchLaneHtml(owner,rows){
  const meta=researchOwnerMeta(owner);
  const laneRows=rows.filter(x=>researchOwner(x)===owner);
  const totalOwner=researchQueue.filter(x=>researchOwner(x)===owner).length;
  return '<section class="research-lane owner-'+owner.toLowerCase()+'"><div class="research-lane-head"><div class="research-lane-title"><span class="research-lane-icon">'+esc(meta.icon)+'</span><div><h3>'+esc(meta.title)+'</h3><p>'+esc(meta.desc)+'</p></div></div><span class="research-lane-count">'+laneRows.length+' ITEM'+(laneRows.length===1?'':'S')+'</span></div>'+
    (laneRows.length?'<div class="research-lane-grid">'+laneRows.map(researchCardHtml).join('')+'</div>':'<div class="research-lane-empty"><strong>No '+esc(meta.title)+' items match these filters.</strong><span>'+totalOwner+' exist overall. Clear search, player type, priority or draft class to see them.</span></div>')+
  '</section>';
}
function renderResearchQueue(){
  const grid=$('#researchQueueGrid');if(!grid)return;
  if(!researchLoaded){if(!researchLoading)loadResearchQueue(false);return}
  const bobbies=researchQueue.filter(x=>researchOwner(x)==='BOBBY');
  const systems=researchQueue.filter(x=>researchOwner(x)==='SYSTEM');
  const fyis=researchQueue.filter(x=>researchOwner(x)==='FYI');
  const grades=researchQueue.filter(x=>researchOwner(x)==='BOBBY'&&researchHasIssue(x,'GRADE'));

  if($('#researchBobbyCount'))$('#researchBobbyCount').textContent=bobbies.length;
  if($('#researchSystemCount'))$('#researchSystemCount').textContent=systems.length;
  if($('#researchFyiCount'))$('#researchFyiCount').textContent=fyis.length;
  if($('#researchProspects'))$('#researchProspects').textContent=grades.length;
  if($('#researchNavCount'))$('#researchNavCount').textContent=bobbies.length||'05';

  const owner=activeResearchOwner();
  const rows=filteredResearchRows(owner);
  const tabBobby=filteredResearchRows('BOBBY').length;
  const tabSystem=filteredResearchRows('SYSTEM').length;
  const tabFyi=filteredResearchRows('FYI').length;
  const tabAll=filteredResearchRows('ALL').length;
  if($('#researchTabBobby'))$('#researchTabBobby').textContent=tabBobby;
  if($('#researchTabSystem'))$('#researchTabSystem').textContent=tabSystem;
  if($('#researchTabFyi'))$('#researchTabFyi').textContent=tabFyi;
  if($('#researchTabAll'))$('#researchTabAll').textContent=tabAll;
  if($('#researchQueueCount'))$('#researchQueueCount').textContent=rows.length+' matching · '+bobbies.length+' need Bobby · '+systems.length+' system · '+fyis.length+' FYI';
  if($('#researchQueueHint'))$('#researchQueueHint').textContent=owner==='BOBBY'?'Showing only decisions that require your judgment':owner==='SYSTEM'?'Background cleanup — no Bobby decision required':owner==='FYI'?'Informational signals only':'All three ownership lanes';

  if(owner==='ALL'){
    const filteredAll=filteredResearchRows('ALL');
    grid.innerHTML=researchLaneHtml('BOBBY',filteredAll)+researchLaneHtml('SYSTEM',filteredAll)+researchLaneHtml('FYI',filteredAll);
  }else{
    grid.innerHTML=researchLaneHtml(owner,rows);
  }
  $$('[data-research-open]').forEach(b=>b.onclick=()=>{if(window.openBBBPlayerWorkspace)window.openBBBPlayerWorkspace(b.dataset.researchOpen,b.dataset.researchTab||'data')});
}
async function markResearchVerified(key,btn){
  const old=btn.textContent;btn.disabled=true;btn.textContent='VERIFYING…';
  try{
    await rpc('admin_mark_player_verified',{p_player_key:key});
    researchLoaded=false;
    await Promise.allSettled([loadResearchQueue(true),loadReviewQueue()]);
    renderReviewQueue();
    queueDashboardPaint();
  }catch(e){alert(e.message);btn.disabled=false;btn.textContent=old}
}


function classAuditStatusLabel(status){
  return status==='conflict'?'CLASS CONFLICT':status==='recheck'?'NEEDS RECHECK':'VERIFIED';
}
function classAuditDate(ts){
  if(!ts)return 'Never verified';
  const d=new Date(ts);
  return Number.isFinite(d.getTime())?d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'Unknown date';
}
function setClassAuditView(view){
  classAuditView=view||'attention';
  $$('.class-tab').forEach(b=>b.classList.toggle('active',b.dataset.classView===classAuditView));
  renderClassAudit();
}
function classAuditBaseRows(){
  const q=String($('#classAuditSearch')?.value||'').trim().toLowerCase();
  const year=$('#classAuditYear')?.value||'ALL';
  const pos=$('#classAuditPos')?.value||'ALL';
  const confidence=$('#classAuditConfidence')?.value||'ALL';
  return classAudit.filter(x=>{
    if(year!=='ALL'&&String(x.current_class)!==year&&String(x.recommended_class)!==year)return false;
    if(pos!=='ALL'&&x.pos!==pos)return false;
    if(confidence!=='ALL'&&String(x.confidence||'').toUpperCase()!==confidence)return false;
    if(q){
      const hay=(x.name+' '+(x.school||'')+' '+x.pos+' '+x.issue+' '+(x.evidence||'')+' '+(x.evidence_source||'')).toLowerCase();
      if(!hay.includes(q))return false;
    }
    return true;
  });
}
function filteredClassAuditRows(view){
  const rows=classAuditBaseRows(),v=view||classAuditView;
  if(v==='attention')return rows.filter(x=>x.audit_status==='conflict'||x.audit_status==='recheck');
  if(v==='all')return rows;
  return rows.filter(x=>x.audit_status===v);
}
async function loadClassAudit(force){
  if(classAuditLoading)return;
  if(classAuditLoaded&&!force){renderClassAudit();return}
  classAuditLoading=true;
  const state=$('#classAuditState');
  const grid=$('#classAuditGrid');
  if(state){state.textContent='SCANNING…';state.classList.remove('good')}
  if(grid&&!classAuditLoaded)grid.innerHTML='<div class="research-loading"><span></span><strong>Cross-checking draft classes…</strong><small>Comparing canonical, scouting and grade data.</small></div>';
  try{
    classAudit=await rpc('admin_get_class_audit',{p_year:null,p_status:null})||[];
    classAuditLoaded=true;
    renderClassAudit();
    if(state){state.textContent='LIVE · '+classAudit.length+' PROSPECTS';state.classList.add('good')}
  }catch(e){
    console.error('BBB Class Audit load failed',e);
    if(state){state.textContent='LOAD ERROR';state.classList.remove('good')}
    if(grid)grid.innerHTML='<div class="class-empty"><strong>Class Audit could not load.</strong><span>'+esc(e.message||'Unknown database error')+'</span></div>';
  }finally{classAuditLoading=false}
}
function classAuditCardHtml(x){
  const status=String(x.audit_status||'verified').toLowerCase();
  const current=x.current_class??'—',recommended=x.recommended_class??'—';
  const conflict=status==='conflict',recheck=status==='recheck';
  const grade=x.grade_class==null?'No final BBB grade yet':'Saved BBB grade class: '+x.grade_class;
  let actions='<button type="button" class="class-action" data-class-open="'+esc(x.player_key)+'">OPEN SCOUTING</button>';
  if(conflict){
    actions='<button type="button" class="class-action accept" data-class-action="accept" data-class-key="'+esc(x.player_key)+'">ACCEPT '+esc(recommended)+'</button>'+
      '<button type="button" class="class-action keep" data-class-action="keep" data-class-key="'+esc(x.player_key)+'">KEEP '+esc(current)+'</button>'+actions;
  }else if(recheck){
    actions='<button type="button" class="class-action accept" data-class-action="verify" data-class-key="'+esc(x.player_key)+'">VERIFY '+esc(current)+'</button>'+actions;
  }
  return '<article class="class-card '+esc(status)+'">'+
    '<div class="class-card-head"><span class="class-pos">'+esc(x.pos||'—')+'</span><div class="class-player"><strong>'+esc(x.name)+'</strong><span>'+esc(x.school||'School TBD')+' · '+esc(x.research_status||'research')+'</span></div><span class="class-status">'+classAuditStatusLabel(status)+'</span></div>'+
    '<div class="class-compare"><div class="class-year-box"><span>CURRENT CLASS</span><strong>'+esc(current)+'</strong></div><span class="class-arrow">→</span><div class="class-year-box recommended"><span>SCOUTING RECOMMENDS</span><strong>'+esc(recommended)+'</strong></div><div class="class-grade-note">'+esc(grade)+'</div></div>'+
    '<div class="class-evidence"><div class="class-evidence-label"><span>'+esc(x.issue||'Eligibility check')+'</span><span>'+esc(classAuditDate(x.class_verified_at))+'</span></div><p>'+esc(x.evidence||'No verification note has been saved yet.')+'</p><div class="class-source">Evidence source: '+esc(x.evidence_source||'Not recorded')+'</div></div>'+
    '<div class="class-card-foot"><span class="class-confidence">SYSTEM CONFIDENCE <b>'+esc(x.confidence||'—')+'</b></span><div class="class-actions">'+actions+'</div></div>'+
  '</article>';
}
function renderClassAudit(){
  const grid=$('#classAuditGrid');if(!grid)return;
  if(!classAuditLoaded){if(!classAuditLoading)void loadClassAudit(false);return}
  const conflicts=classAudit.filter(x=>x.audit_status==='conflict');
  const rechecks=classAudit.filter(x=>x.audit_status==='recheck');
  const verified=classAudit.filter(x=>x.audit_status==='verified');
  const y27=verified.filter(x=>Number(x.current_class)===2027);
  const y28=verified.filter(x=>Number(x.current_class)===2028);
  const base=classAuditBaseRows();
  const rows=filteredClassAuditRows();

  if($('#classConflictCount'))$('#classConflictCount').textContent=conflicts.length;
  if($('#classRecheckCount'))$('#classRecheckCount').textContent=rechecks.length;
  if($('#class2027Count'))$('#class2027Count').textContent=y27.length;
  if($('#class2028Count'))$('#class2028Count').textContent=y28.length;
  if($('#classAuditNavCount'))$('#classAuditNavCount').textContent=conflicts.length+rechecks.length;
  if($('#classTabAttention'))$('#classTabAttention').textContent=base.filter(x=>x.audit_status!=='verified').length;
  if($('#classTabConflict'))$('#classTabConflict').textContent=base.filter(x=>x.audit_status==='conflict').length;
  if($('#classTabRecheck'))$('#classTabRecheck').textContent=base.filter(x=>x.audit_status==='recheck').length;
  if($('#classTabVerified'))$('#classTabVerified').textContent=base.filter(x=>x.audit_status==='verified').length;
  if($('#classTabAll'))$('#classTabAll').textContent=base.length;
  if($('#classAuditCount'))$('#classAuditCount').textContent=rows.length+' shown · '+conflicts.length+' conflicts · '+rechecks.length+' rechecks · '+verified.length+' verified';

  const hint=$('#classAuditHint');
  if(hint)hint.textContent=classAuditView==='attention'?'Only conflicts and missing evidence need your attention.':classAuditView==='verified'?'Verified class records — inspect anytime, no action required.':classAuditView==='conflict'?'Choose Accept Recommendation or Keep Current for each conflict.':classAuditView==='recheck'?'Evidence is incomplete — verify the current class after review.':'Showing the complete 2027 / 2028 eligibility board.';

  if(rows.length){
    grid.innerHTML=rows.map(classAuditCardHtml).join('');
  }else if(classAuditView==='attention'&&conflicts.length===0&&rechecks.length===0){
    grid.innerHTML='<div class="class-empty"><strong>Class board is clean.</strong><span>All '+verified.length+' current 2027/2028 prospects have matching canonical and scouting classes with verification evidence. Nothing needs a Bobby decision right now.</span><div class="class-empty-actions"><button class="class-action" type="button" data-class-year-jump="2027">VIEW 2027 CLASS</button><button class="class-action" type="button" data-class-year-jump="2028">VIEW 2028 CLASS</button></div></div>';
  }else{
    grid.innerHTML='<div class="class-empty"><strong>No prospects match this view.</strong><span>Clear the search, year, position or confidence filters to widen the audit.</span></div>';
  }
}
async function resolveClassAudit(key,action,btn){
  const row=classAudit.find(x=>x.player_key===key);
  if(!row)return;
  const verb=action==='accept'?'Accept '+row.recommended_class+' for '+row.name+'?':action==='keep'?'Keep '+row.current_class+' for '+row.name+'?':'Re-verify '+row.current_class+' for '+row.name+'?';
  if(!confirm(verb+' This will not change dynasty rank.'))return;
  const old=btn?.textContent;
  if(btn){btn.disabled=true;btn.textContent='SAVING…'}
  try{
    await rpc('admin_resolve_class_audit',{p_player_key:key,p_action:action});
    classAuditLoaded=false;
    await loadClassAudit(true);
    researchLoaded=false;
    if(activeAdminPage==='research')await loadResearchQueue(true);
  }catch(e){
    alert(e.message);
    if(btn){btn.disabled=false;btn.textContent=old}
  }
}

const ADMIN_COMMANDS=[
  {id:'dashboard',icon:'⌂',label:'Dashboard',sub:'Return to Dynasty Command Center',tag:'PAGE'},
  {id:'moves',icon:'↕',label:'Ranking Move Queue',sub:'Approve, modify or reject rank recommendations',tag:'PAGE'},
  {id:'scanner',icon:'⌁',label:'Weekly Performance Scanner',sub:'Advanced weekly usage, efficiency and role changes',tag:'PAGE'},
  {id:'rankings',icon:'▥',label:'Rankings Manager',sub:'Move and inspect the Top 500',tag:'PAGE'},
  {id:'players',icon:'◎',label:'Player Editor',sub:'Edit identity, injury and profile data',tag:'PAGE'},
  {id:'prospects',icon:'✦',label:'Prospect Lab',sub:'Research and grade 2027 / 2028 prospects',tag:'PAGE'},
  {id:'research',icon:'⌬',label:'Research Queue',sub:'Work player completeness, class audits and missing data',tag:'PAGE'},
  {id:'eligibility',icon:'⌁',label:'Draft Class Audit',sub:'Verify 2027 / 2028 eligibility and resolve class conflicts',tag:'PAGE'},
  {id:'review',icon:'◈',label:'Review Queue',sub:'Work freshness, sources and ranking flags',tag:'PAGE'},
  {id:'injuries',icon:'＋',label:'Show injury concerns',sub:'Open Player Editor filtered to active injuries',tag:'ACTION'},
  {id:'buys',icon:'↗',label:'Show BBB buys',sub:'Open rankings where BBB is above market',tag:'ACTION'},
  {id:'fades',icon:'↘',label:'Show BBB fades',sub:'Open rankings where BBB is below market',tag:'ACTION'},
  {id:'ungraded',icon:'◇',label:'Show ungraded prospects',sub:'Open the remaining Prospect Lab queue',tag:'ACTION'}
];
function commandItems(query){
  const q=String(query||'').trim().toLowerCase(),items=[];
  ADMIN_COMMANDS.filter(x=>!q||(x.label+' '+x.sub).toLowerCase().includes(q)).slice(0,q?6:9).forEach(x=>items.push(Object.assign({type:'command'},x)));
  if(q){
    board.filter(x=>(x.name+' '+(x.team||'')+' '+(x.college||'')).toLowerCase().includes(q)).slice(0,8).forEach(x=>items.push({type:'player',id:x.player_key,icon:x.pos,label:x.name,sub:'#'+x.rank+' · '+(x.team||'FA')+' · '+(x.college||'College —'),tag:'PLAYER'}));
    prospectLab.filter(x=>(x.name+' '+(x.school||'')).toLowerCase().includes(q)).slice(0,8).forEach(x=>items.push({type:'prospect',id:x.player_key,icon:x.position,label:x.name,sub:x.class_year+' · '+(x.school||'School TBD')+' · '+(prospectReady(x)?'Research ready':'Research pending'),tag:'PROSPECT'}));
  }
  return items.slice(0,16);
}
function renderCommandPalette(){
  const el=$('#commandPaletteResults');if(!el)return;const items=commandItems($('#commandPaletteInput')?.value||'');commandIndex=Math.min(commandIndex,Math.max(0,items.length-1));
  el.innerHTML=items.length?items.map((x,i)=>'<button type="button" class="command-result '+(i===commandIndex?'active':'')+'" data-command-index="'+i+'"><span class="command-result-icon">'+esc(x.icon)+'</span><span><strong>'+esc(x.label)+'</strong><small>'+esc(x.sub)+'</small></span><span class="command-result-tag">'+esc(x.tag)+'</span></button>').join(''):'<div class="empty">No command or player matched.</div>';
}
function openCommandPalette(seed){
  $('#commandBackdrop').classList.remove('hide');$('#commandPalette').classList.remove('hide');const input=$('#commandPaletteInput');input.value=seed||'';commandIndex=0;renderCommandPalette();requestAnimationFrame(()=>input.focus());
}
function closeCommandPalette(){$('#commandBackdrop').classList.add('hide');$('#commandPalette').classList.add('hide')}
function executeCommandItem(item){
  if(!item)return;closeCommandPalette();
  if(item.type==='player'){selectedRankKey=item.id;const x=board.find(v=>v.player_key===item.id);goRankings({q:x?.name||''});return}
  if(item.type==='prospect'){page('prospects');const x=prospectLab.find(v=>v.player_key===item.id);if($('#prospectSearch'))$('#prospectSearch').value=x?.name||'';renderProspectLab();setTimeout(()=>openProspectReport(item.id),0);return}
  if(item.id==='injuries'){page('players');$('#playerAdminInjury').value='CONCERN';playerPage=0;renderPlayers();return}
  if(item.id==='buys'){goRankings({market:'BUY'});return}
  if(item.id==='fades'){goRankings({market:'FADE'});return}
  if(item.id==='ungraded'){page('prospects');$('#prospectIncludeGraded').checked=false;renderProspectLab();return}
  page(item.id);
}
function executeActiveCommand(){const items=commandItems($('#commandPaletteInput')?.value||'');executeCommandItem(items[commandIndex])}
function page(name){
  activeAdminPage=name;
  document.documentElement.dataset.adminPage=name;
  $$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.page===name));
  $$('.admin-page').forEach(p=>p.classList.add('hide'));
  const target=$(`#page${name[0].toUpperCase()+name.slice(1)}`);
  if(!target)return;
  target.classList.remove('hide');
  const titles={dashboard:'Dashboard',moves:'Ranking Move Queue',scanner:'Weekly Performance Scanner',rankings:'Rankings Manager',players:'Player Editor',prospects:'Prospect Lab',research:'Research Queue',eligibility:'Draft Class Audit',review:'Review Queue'};if($('#missionPageTitle'))$('#missionPageTitle').textContent=titles[name]||name;
  if(name==='moves')renderRankingMoveQueue();
  if(name==='scanner'){renderWeeklyScanner();if(!scannerLoaded&&!scannerLoading)void loadWeeklyScanner(false)}
  if(name==='rankings')renderRankings();
  if(name==='players')renderPlayers();
  if(name==='prospects'){prospectGradeOnly=false;renderProspectLab()}
  if(name==='research'){renderResearchQueue();if(!researchLoaded&&!researchLoading)void loadResearchQueue(false)}
  if(name==='eligibility'){renderClassAudit();if(!classAuditLoaded&&!classAuditLoading)void loadClassAudit(false)}
  if(name==='review'){renderReviewQueue();renderDataHealth()}
  if(name==='dashboard')renderCommandDashboard()
}
function bindControlGroup(name,fn){
  try{fn()}catch(e){console.error('BBB Admin '+name+' controls failed',e)}
}
function adminClickRouter(e){
  const nav=e.target.closest&&e.target.closest('.nav-btn[data-page]');
  if(nav){
    e.preventDefault();
    page(nav.dataset.page);
    return;
  }
  const jump=e.target.closest&&e.target.closest('[data-page-jump]');
  if(jump){
    e.preventDefault();
    page(jump.dataset.pageJump);
    return;
  }
  const quick=e.target.closest&&e.target.closest('[data-quick-page]');
  if(quick){
    e.preventDefault();
    page(quick.dataset.quickPage);
    return;
  }
  const briefCard=e.target.closest&&e.target.closest('[data-brief-mode]');
  if(briefCard){
    e.preventDefault();
    briefMode=briefCard.dataset.briefMode||'ranking_decisions';
    renderOpsActionCenter();
    return;
  }
  const briefPlayer=e.target.closest&&e.target.closest('[data-brief-player]');
  if(briefPlayer){
    e.preventDefault();
    const key=briefPlayer.dataset.briefPlayer;
    const kind=briefPlayer.dataset.briefKind||'';
    if(window.openBBBPlayerWorkspace&&key){
      window.openBBBPlayerWorkspace(key,kind==='injury_changes'?'activity':kind==='market_movers'||kind==='rank_moves'?'dynasty':'overview');
    }
    return;
  }
  const dashKpi=e.target.closest&&e.target.closest('[data-dashboard-kpi]');
  if(dashKpi){
    e.preventDefault();
    const key=dashKpi.dataset.dashboardKpi;
    if(key==='dynasty'){goRankings();return}
    if(key==='injuries'){
      page('players');
      $('#playerAdminSearch').value='';
      $('#playerAdminPos').value='ALL';
      if($('#playerAdminDraft'))$('#playerAdminDraft').value='ALL';
      $('#playerAdminInjury').value='CONCERN';
      playerPage=0;
      renderPlayers();
      return;
    }
    if(key==='rookies'){
      page('players');
      $('#playerAdminSearch').value='';
      $('#playerAdminPos').value='ALL';
      if($('#playerAdminDraft'))$('#playerAdminDraft').value='2026';
      $('#playerAdminInjury').value='ALL';
      playerPage=0;
      renderPlayers();
      return;
    }
    if(key==='prospectgrades'){
      page('prospects');
      prospectGradeOnly=true;
      if($('#prospectSearch'))$('#prospectSearch').value='';
      if($('#prospectYear'))$('#prospectYear').value='ALL';
      if($('#prospectPos'))$('#prospectPos').value='ALL';
      if($('#prospectResearch'))$('#prospectResearch').value='ALL';
      if($('#prospectIncludeGraded'))$('#prospectIncludeGraded').checked=true;
      renderProspectLab();
      return;
    }
  }
  const classView=e.target.closest&&e.target.closest('[data-class-view]');
  if(classView){
    e.preventDefault();
    setClassAuditView(classView.dataset.classView);
    return;
  }
  const classKpi=e.target.closest&&e.target.closest('[data-class-kpi]');
  if(classKpi){
    e.preventDefault();
    setClassAuditView(classKpi.dataset.classKpi);
    return;
  }
  const classYear=e.target.closest&&e.target.closest('[data-class-year-jump]');
  if(classYear){
    e.preventDefault();
    if($('#classAuditYear'))$('#classAuditYear').value=classYear.dataset.classYearJump||'ALL';
    setClassAuditView('verified');
    return;
  }
  const classOpen=e.target.closest&&e.target.closest('[data-class-open]');
  if(classOpen){
    e.preventDefault();
    if(window.openBBBPlayerWorkspace)window.openBBBPlayerWorkspace(classOpen.dataset.classOpen,'scouting');
    return;
  }
  const classAction=e.target.closest&&e.target.closest('[data-class-action][data-class-key]');
  if(classAction){
    e.preventDefault();
    void resolveClassAudit(classAction.dataset.classKey,classAction.dataset.classAction,classAction);
    return;
  }
  const owner=e.target.closest&&e.target.closest('.research-owner-tab[data-research-owner]');
  if(owner){
    e.preventDefault();
    setResearchOwner(owner.dataset.researchOwner);
    return;
  }
  const ownerJump=e.target.closest&&e.target.closest('[data-research-owner-jump]');
  if(ownerJump){
    e.preventDefault();
    setResearchOwner(ownerJump.dataset.researchOwnerJump);
    return;
  }
  const issueJump=e.target.closest&&e.target.closest('[data-research-issue-jump]');
  if(issueJump){
    e.preventDefault();
    setResearchOwner('BOBBY');
    if($('#researchIssue'))$('#researchIssue').value=issueJump.dataset.researchIssueJump||'ALL';
    renderResearchQueue();
  }
}
document.addEventListener('click',adminClickRouter,true);

document.addEventListener('DOMContentLoaded',()=>{
  updateAdminClock();setInterval(updateAdminClock,1000);

  bindControlGroup('auth',()=>{
    $$('.auth-tabs').forEach(x=>x.remove());
    $('#authForm').onsubmit=async e=>{e.preventDefault();const btn=$('#authSubmit');btn.disabled=true;msg('');try{const email=$('#authEmail').value.trim().toLowerCase(),password=$('#authPassword').value;const admin=await signIn(email,password);await enterAdmin(admin)}catch(err){msg(err.message)}finally{btn.disabled=false}};
    $('#signOut').onclick=()=>{clearSession();location.reload()};
  });

  bindControlGroup('navigation and command',()=>{
    const globalSearch=$('#adminGlobalSearch');
    if(globalSearch){
      globalSearch.addEventListener('focus',()=>{const seed=globalSearch.value;globalSearch.blur();openCommandPalette(seed)});
      globalSearch.addEventListener('click',()=>openCommandPalette(globalSearch.value));
    }
    $('#missionCommand')?.addEventListener('click',()=>openCommandPalette());
    $('#commandBackdrop')?.addEventListener('click',closeCommandPalette);
    $('#commandPaletteInput')?.addEventListener('input',()=>{commandIndex=0;renderCommandPalette()});
    $('#commandPaletteResults')?.addEventListener('mousemove',e=>{
      const b=e.target.closest('[data-command-index]');if(!b)return;const next=Number(b.dataset.commandIndex);if(next!==commandIndex){commandIndex=next;renderCommandPalette()}
    });
    $('#commandPaletteResults')?.addEventListener('click',e=>{
      const b=e.target.closest('[data-command-index]');if(!b)return;commandIndex=Number(b.dataset.commandIndex);executeActiveCommand()
    });
    document.addEventListener('keydown',e=>{
      if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCommandPalette();return}
      if(!$('#commandPalette')?.classList.contains('hide')){
        if(e.key==='Escape'){e.preventDefault();closeCommandPalette();return}
        if(e.key==='ArrowDown'){e.preventDefault();const items=commandItems($('#commandPaletteInput')?.value||'');commandIndex=Math.min(Math.max(0,items.length-1),commandIndex+1);renderCommandPalette();return}
        if(e.key==='ArrowUp'){e.preventDefault();commandIndex=Math.max(0,commandIndex-1);renderCommandPalette();return}
        if(e.key==='Enter'){e.preventDefault();executeActiveCommand();return}
      }
    });
  });

  bindControlGroup('global refresh',()=>{
    $$('[data-refresh]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await loadAll()}finally{b.disabled=false}});
  });

  bindControlGroup('daily brief',()=>{
    $('#briefRefresh')?.addEventListener('click',async e=>{
      const b=e.currentTarget;b.disabled=true;
      try{await loadCommandBrief(true)}finally{b.disabled=false}
    });
    $('#briefMarkRead')?.addEventListener('click',async e=>{
      const b=e.currentTarget;b.disabled=true;
      localStorage.setItem(BRIEF_SEEN,new Date().toISOString());
      commandBrief=null;
      try{await loadCommandBrief(true)}finally{b.disabled=false}
    });
  });

  bindControlGroup('rankings',()=>{
    ['#rankSearch','#rankPos','#rankMarket'].forEach(s=>$(s)?.addEventListener(s==='#rankSearch'?'input':'change',()=>{rankPage=0;renderRankings()}));
    $('#rankClear')?.addEventListener('click',()=>{$('#rankSearch').value='';$('#rankPos').value='ALL';$('#rankMarket').value='ALL';rankPage=0;renderRankings()});
    $('#rankPrev')?.addEventListener('click',()=>{rankPage=Math.max(0,rankPage-1);renderRankings()});
    $('#rankNext')?.addEventListener('click',()=>{rankPage++;renderRankings()});
    $('#rankBody')?.addEventListener('click',e=>{
      if(e.target.closest('button,input,a'))return;
      const row=e.target.closest('[data-rank-player]');if(row)selectRankPlayer(row.dataset.rankPlayer);
    });
  });

  bindControlGroup('player editor',()=>{
    ['#playerAdminSearch','#playerAdminPos','#playerAdminDraft','#playerAdminInjury'].forEach(s=>$(s)?.addEventListener(s==='#playerAdminSearch'?'input':'change',()=>{playerPage=0;renderPlayers()}));
    $('#playerAdminClear')?.addEventListener('click',()=>{$('#playerAdminSearch').value='';$('#playerAdminPos').value='ALL';if($('#playerAdminDraft'))$('#playerAdminDraft').value='ALL';$('#playerAdminInjury').value='ALL';playerPage=0;renderPlayers()});
    $('#playerAdminPrev')?.addEventListener('click',()=>{playerPage=Math.max(0,playerPage-1);renderPlayers()});
    $('#playerAdminNext')?.addEventListener('click',()=>{playerPage++;renderPlayers()});
    $('#drawerClose')?.addEventListener('click',closeEditor);
    $('#drawerBackdrop')?.addEventListener('click',closeEditor);
    $('#playerForm')?.addEventListener('submit',savePlayer);
  });

  bindControlGroup('prospect lab',()=>{
    ['#prospectSearch','#prospectYear','#prospectPos','#prospectResearch'].forEach(sel=>$(sel)?.addEventListener(sel==='#prospectSearch'?'input':'change',()=>{prospectGradeOnly=false;renderProspectLab()}));
    $('#prospectIncludeGraded')?.addEventListener('change',()=>{prospectGradeOnly=false;renderProspectLab()});
    $('#prospectLabGrid')?.addEventListener('click',e=>{
      const gradeBtn=e.target.closest('[data-grade-prospect]');
      if(gradeBtn){e.preventDefault();e.stopPropagation();startProspectGrade(gradeBtn.dataset.gradeProspect);return}
      const card=e.target.closest('[data-open-prospect]');
      if(card){e.preventDefault();openProspectReport(card.dataset.openProspect)}
    });
    $('#prospectDrawerClose')?.addEventListener('click',closeProspectGrader);
    $('#prospectDrawerBackdrop')?.addEventListener('click',closeProspectGrader);
    $('#prospectApplyRec')?.addEventListener('click',applyProspectRec);
    $('#prospectStartGrade')?.addEventListener('click',()=>startProspectGrade($('#prospectStartGrade').dataset.playerKey));
    $('#prospectBackToReport')?.addEventListener('click',()=>openProspectReport($('#prospectKey').value));
    $('#prospectGradeForm')?.addEventListener('submit',saveProspectGrade);
  });

  bindControlGroup('research queue',()=>{
    ['#researchSearch','#researchScope','#researchIssue','#researchPriority','#researchClass'].forEach(s=>$(s)?.addEventListener(s==='#researchSearch'?'input':'change',renderResearchQueue));
    $('#researchClear')?.addEventListener('click',()=>{$('#researchSearch').value='';$('#researchScope').value='ALL';$('#researchIssue').value='ALL';$('#researchPriority').value='ALL';$('#researchClass').value='ALL';setResearchOwner('BOBBY')});
    $('#researchRefresh')?.addEventListener('click',async e=>{const b=e.currentTarget;b.disabled=true;try{researchLoaded=false;await loadResearchQueue(true)}finally{b.disabled=false}});
  });

  bindControlGroup('class audit',()=>{
    ['#classAuditSearch','#classAuditYear','#classAuditPos','#classAuditConfidence'].forEach(s=>$(s)?.addEventListener(s==='#classAuditSearch'?'input':'change',renderClassAudit));
    $('#classAuditClear')?.addEventListener('click',()=>{
      $('#classAuditSearch').value='';
      $('#classAuditYear').value='ALL';
      $('#classAuditPos').value='ALL';
      $('#classAuditConfidence').value='ALL';
      setClassAuditView('attention');
    });
    $('#classAuditRefresh')?.addEventListener('click',async e=>{
      const b=e.currentTarget;b.disabled=true;
      try{classAuditLoaded=false;await loadClassAudit(true)}finally{b.disabled=false}
    });
  });

  bindControlGroup('weekly performance scanner',()=>{
    ['#scannerSearch','#scannerPos','#scannerSignal','#scannerScope'].forEach(s=>$(s)?.addEventListener(s==='#scannerSearch'?'input':'change',renderWeeklyScanner));
    $('#scannerWeek')?.addEventListener('change',e=>{scannerLoaded=false;void loadWeeklyScanner(true,Number(e.target.value))});
    $('#scannerClear')?.addEventListener('click',()=>{
      $('#scannerSearch').value='';
      $('#scannerPos').value='ALL';
      $('#scannerSignal').value='ALL';
      $('#scannerScope').value='SIGNALS';
      renderWeeklyScanner();
    });
    $('#scannerRefresh')?.addEventListener('click',async e=>{
      const b=e.currentTarget;b.disabled=true;
      try{scannerLoaded=false;await loadWeeklyScanner(true,Number($('#scannerWeek')?.value)||null)}finally{b.disabled=false}
    });
  });

  bindControlGroup('ranking move queue',()=>{
    ['#moveSearch','#movePriority','#moveDirection'].forEach(s=>$(s)?.addEventListener(s==='#moveSearch'?'input':'change',renderRankingMoveQueue));
    $('#moveClear')?.addEventListener('click',()=>{
      $('#moveSearch').value='';
      $('#movePriority').value='ALL';
      $('#moveDirection').value='ALL';
      renderRankingMoveQueue();
    });
  });

  bindControlGroup('review queue',()=>{
    ['#reviewSearch','#reviewPriority','#reviewKind'].forEach(s=>$(s)?.addEventListener(s==='#reviewSearch'?'input':'change',()=>{reviewPage=0;renderReviewQueue()}));
    $('#reviewClear')?.addEventListener('click',()=>{$('#reviewSearch').value='';$('#reviewPriority').value='ALL';$('#reviewKind').value='ALL';reviewPage=0;renderReviewQueue()});
    $('#reviewPrev')?.addEventListener('click',()=>{reviewPage=Math.max(0,reviewPage-1);renderReviewQueue()});
    $('#reviewNext')?.addEventListener('click',()=>{reviewPage++;renderReviewQueue()});
  });

  document.documentElement.dataset.adminControls='ready';
  boot();
});