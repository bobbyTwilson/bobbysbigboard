/* BBB Top 500 Coverage Tracker — private Admin workspace. */
(function(){
'use strict';
const $=(s,host=document)=>host.querySelector(s);
const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const list=v=>Array.isArray(v)?v:[];
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const fmt=v=>v==null?'—':num(v).toLocaleString();
const d=v=>{if(!v)return 'Not recorded';const x=new Date(v);return Number.isNaN(x.valueOf())?'Not recorded':x.toLocaleDateString(undefined,{month:'short',day:'numeric'})};
const time=v=>{if(!v)return 'Not recorded';const x=new Date(v);return Number.isNaN(x.valueOf())?'Not recorded':x.toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})};
const STATES={urgent:['Team conflict','bad'],review:['Needs review','amber'],check:['Check freshness','blue'],tracked:['No immediate flags','good']};
const GAME={sourced:['Sourced game line','good'],bye:['Team bye','muted'],game_pending:['Team feed pending','blue'],free_agent:['No NFL team','muted'],no_individual_line:['Team feed / no player line','muted'],inactive_or_unrecorded:['Inactive or not recorded','muted'],not_in_feed:['No player line','muted']};
const ROSTER={checked:['Recently checked','good'],not_checked:['Not checked','amber'],stale_check:['Stale check','amber'],team_conflict:['Team conflict','bad'],not_applicable:['Free agent','muted']};
let data=null,loaded=false,loading=false,busy=false,filter='ALL',gameFilter='ALL',position='ALL',query='',shown=35;
const host=()=>$('#pageCoverage');
function badge(name,tone){return '<span class="cov-chip cov-chip--'+esc(tone||'muted')+'">'+esc(name)+'</span>'}
function options(map){return Object.keys(map).map(k=>'<option value="'+esc(k)+'">'+esc(map[k][0])+'</option>').join('')}
function init(){
 const node=host();if(!node||node.dataset.coverageBound)return;
 node.dataset.coverageBound='yes';
 node.innerHTML=
 '<header class="cov-hero"><div><div class="cov-eyebrow">BBB ADMIN / PLAYER INTELLIGENCE</div><h1>Top 500 <em>Coverage Tracker</em></h1><p>Every player accounted for. Source evidence, roster freshness, player notes, and outstanding reviews in one place.</p></div>'+
 '<div class="cov-hero-right"><span id="covUpdateTime">LIVE COVERAGE QUERY</span><button type="button" id="covRefresh" class="cov-btn cov-btn--primary">Refresh coverage ↻</button></div></header>'+
 '<div id="covFlash" class="cov-flash" role="status" hidden></div>'+
 '<div id="covStats" class="cov-stats"><div class="cov-empty">Loading the complete board…</div></div>'+
 '<section class="cov-panel"><div class="cov-heading"><div><h2>Player coverage</h2><p>Game-feed absence is not automatically an injury or a missing import.</p></div><span id="covTotal">500 ranked players</span></div>'+
 '<div class="cov-filters"><input type="search" id="covSearch" placeholder="Search player, team or issue…" aria-label="Find player">'+
 '<select id="covStatus" aria-label="Filter review priority"><option value="ALL">All review states</option>'+options(STATES)+'</select>'+
 '<select id="covGame" aria-label="Filter game source"><option value="ALL">All game statuses</option>'+options(GAME)+'</select>'+
 '<select id="covPosition" aria-label="Filter position"><option value="ALL">All positions</option><option>QB</option><option>RB</option><option>WR</option><option>TE</option></select></div>'+
 '<div class="cov-colheads"><span>Player and priority</span><span>Game-feed coverage</span><span>Supporting evidence</span><span>Actions</span></div>'+
 '<div id="covRows" class="cov-rows" aria-live="polite"></div><div class="cov-footer"><span id="covShown"></span><button id="covMore" type="button" class="cov-btn" hidden>Show 35 more</button></div></section>'+
 '<div class="cov-lower"><section class="cov-panel"><div class="cov-heading"><div><h2>Targeted research</h2><p>Open manual research tickets and requests requiring a source check.</p></div></div><div id="covQueue"></div></section>'+
 '<section class="cov-panel"><div class="cov-heading"><div><h2>Daily quality trend</h2><p>Source-based snapshots refreshed hourly, one entry per day.</p></div></div><div id="covHistory"></div></section></div>'+
 '<div class="cov-method">No immediate flags does not mean medically cleared or fully researched. BBB never automatically changes your Top 500 rankings.</div>';
 node.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.id==='covRefresh'){void load(true);return}
  if(b.id==='covMore'){shown+=35;renderRows();return}
  if(b.dataset.covPlayer){openPlayer(b.dataset.covPlayer);return}
  if(b.dataset.covResearch){void research(b.dataset.covResearch);return}
  if(b.dataset.covRequest){void resolve(Number(b.dataset.covRequest),b.dataset.covAct);return}
  if(b.dataset.covGo){page(b.dataset.covGo)}
 });
 [['#covSearch','input',v=>query=v.toLowerCase().trim()],['#covStatus','change',v=>filter=v],
  ['#covGame','change',v=>gameFilter=v],['#covPosition','change',v=>position=v]].forEach(set=>{
  $(set[0],node).addEventListener(set[1],e=>{set[2](e.target.value);shown=35;renderRows()});
 });
}
function notify(s,error=false){const el=$('#covFlash',host());el.hidden=false;el.classList.toggle('cov-flash--error',error);el.textContent=s}
function openPlayer(key){if(typeof window.openBBBPlayerWorkspace==='function')window.openBBBPlayerWorkspace(key,'activity');else page('players')}
function metric(label,value,sub,tone){
 return '<div class="cov-metric"><span>'+esc(label)+'</span><strong class="cov-metric--'+esc(tone||'white')+'">'+fmt(value)+'</strong><small>'+esc(sub)+'</small></div>';
}
function renderHeader(){
 const a=data.summary,w=data.week_source||{};
 $('#covStats',host()).innerHTML=
 metric('Players accounted for',a.total,'Current dynasty Top 500')+
 metric('No immediate flags',a.tracked,'Operational checks current','teal')+
 metric('Needs owner review',num(a.urgent)+num(a.review_needed),'News / ranking decisions','amber')+
 metric('Freshness checks',a.check_needed,'Roster / notes / scan evidence','blue')+
 metric('Week '+(w.week||'?')+' sourced lines',a.sourced,'Player game lines available')+
 metric('Team game pending',a.game_pending,'Not considered a broken import','blue');
 $('#covUpdateTime',host()).textContent='UPDATED '+time(data.generated_at);
 $('#covTotal',host()).textContent=fmt(a.total)+' ranked · '+fmt(a.bye)+' byes · '+fmt(a.free_agent)+' free agents';
 const nav=$('#coverageNavCount');if(nav)nav.textContent=String(num(a.urgent)+num(a.review_needed)+num(a.check_needed));
}
function selectedPlayers(){
 const order={urgent:0,review:1,check:2,tracked:3};
 return list(data&&data.players).filter(p=>
  (filter==='ALL'||p.attention_state===filter)&&
  (gameFilter==='ALL'||p.stats_state===gameFilter)&&
  (position==='ALL'||p.position===position)&&
  (!query||[p.name,p.team,p.player_key,p.injury_status,p.news_description,
    list(p.attention_reasons).join(' '),p.observed_status].join(' ').toLowerCase().includes(query))
 ).sort((a,b)=>(order[a.attention_state]??5)-(order[b.attention_state]??5)||num(a.overall_rank)-num(b.overall_rank));
}
function renderRow(p){
 const status=STATES[p.attention_state]||STATES.tracked;
 const game=GAME[p.stats_state]||GAME.not_in_feed;
 const roster=ROSTER[p.roster_state]||ROSTER.not_checked;
 const w=p.current_week||'?';
 let line='No individual Week '+w+' stat line verified';
 if(p.stats_state==='sourced'){
  line=p.position==='QB'?fmt(p.passing_yards)+' passing yards':
    p.position==='RB'?fmt(p.carries)+' carries · '+fmt(p.targets)+' targets':
    fmt(p.targets)+' targets · '+fmt(p.receptions)+' catches';
 }
 const reasons=list(p.attention_reasons).slice(0,3);
 return '<article class="cov-row cov-row--'+esc(p.attention_state)+'">'+
 '<div class="cov-identity"><span class="cov-rank">#'+fmt(p.overall_rank)+'</span><div>'+
 '<button class="cov-name" type="button" data-cov-player="'+esc(p.player_key)+'">'+esc(p.name)+'</button>'+
 '<div class="cov-sub">'+esc(p.position)+' · '+esc(p.team||'Unknown')+' · Pos #'+fmt(p.position_rank)+'</div>'+badge(status[0],status[1])+'</div></div>'+
 '<div class="cov-cell">'+badge(game[0],game[1])+'<p>'+esc(line)+'</p></div>'+
 '<div class="cov-cell">'+badge(roster[0],roster[1])+
 '<p>Note: '+esc(d(p.weekly_update_date))+' · '+esc(p.injury_status||'No status listed')+'</p>'+
 (reasons.length?'<div class="cov-issues">'+reasons.map(x=>'<span>'+esc(x)+'</span>').join('')+'</div>':'')+
 (p.open_reports?'<small>'+fmt(p.open_reports)+' unverified report(s)</small>':'')+'</div>'+
 '<div class="cov-actions"><button type="button" data-cov-player="'+esc(p.player_key)+'" class="cov-btn">Player workspace</button>'+
 '<button type="button" data-cov-research="'+esc(p.player_key)+'" class="cov-btn cov-btn--outline">'+(p.event_id?'Check news source':'Request research')+'</button>'+
 (p.pending_moves?'<button type="button" data-cov-go="moves" class="cov-text-action">'+fmt(p.pending_moves)+' rank review(s) ↗</button>':'')+'</div></article>';
}
function renderRows(){
 if(!data)return;
 const rows=selectedPlayers(),visible=rows.slice(0,shown);
 $('#covRows',host()).innerHTML=visible.length?visible.map(renderRow).join(''):
 '<div class="cov-empty">No matching players. Try clearing a filter or search.</div>';
 $('#covShown',host()).textContent='Showing '+fmt(visible.length)+' of '+fmt(rows.length)+' matching players';
 $('#covMore',host()).hidden=visible.length>=rows.length;
}
function renderQueue(){
 const rows=list(data.requests);
 $('#covQueue',host()).innerHTML=rows.length?rows.slice(0,30).map(r=>
 '<div class="cov-ticket"><div><strong>'+esc(r.name)+'</strong> '+badge(r.state,r.state==='reviewing'?'blue':'amber')+
 '<p>'+esc(r.reason)+'</p><small>Since '+time(r.created_at)+' · requested '+fmt(r.request_count)+' time(s)</small></div>'+
 '<div class="cov-ticket-actions"><button type="button" class="cov-btn" data-cov-player="'+esc(r.player_key)+'">View</button>'+
 (r.state==='queued'?'<button type="button" class="cov-btn" data-cov-request="'+num(r.id)+'" data-cov-act="reviewing">Start</button>':'')+
 '<button type="button" class="cov-btn" data-cov-request="'+num(r.id)+'" data-cov-act="resolved">Resolve</button></div></div>').join(''):
 '<div class="cov-empty">No manual source-review tickets are open. This does not imply every player is fully verified.</div>';
}
function renderHistory(){
 const hist=list(data.history).slice().reverse();
 $('#covHistory',host()).innerHTML=hist.length?hist.map(h=>{
  const percent=Math.min(100,Math.max(0,num(h.tracked_ok)/Math.max(1,num(h.tracked))*100));
  return '<div class="cov-day"><div><strong>'+esc(d(h.snapshot_date))+'</strong><span>'+fmt(h.tracked_ok)+' without flags · '+
   fmt(num(h.urgent)+num(h.review_needed)+num(h.source_checks))+' to check</span></div>'+
   '<div class="cov-meter"><i style="width:'+percent.toFixed(1)+'%"></i></div></div>';
 }).join('')+'<p class="cov-legend">Daily operational coverage — not a medical clearance or performance grade.</p>':
 '<div class="cov-empty">Coverage history begins with today’s first snapshot.</div>';
}
function render(){if(!data||!host())return;renderHeader();renderRows();renderQueue();renderHistory()}
async function load(force=false){
 init();if(loading)return;if(loaded&&!force){render();return}
 loading=true;const b=$('#covRefresh',host());if(b){b.disabled=true;b.textContent='Checking sources…'}
 try{
  if(typeof rpc!=='function')throw Error('Admin session not initialized');
  const incoming=await rpc('admin_get_top500_coverage_v1',{});
  if(!incoming||!Array.isArray(incoming.players)||incoming.players.length!==500)
    throw Error('Coverage response incomplete. Refusing to display a partial Top 500.');
  data=incoming;loaded=true;render();
 }catch(err){
  console.error('BBB Coverage Tracker:',err);
  notify('Coverage request failed: '+(err&&err.message||'Please retry'),true);
  if(!loaded)$('#covRows',host()).innerHTML='<div class="cov-empty">Coverage unavailable. Click Refresh coverage to reconnect.</div>';
 }finally{loading=false;if(b){b.disabled=false;b.textContent='Refresh coverage ↻'}}
}
async function research(key){
 if(busy)return;
 const p=list(data&&data.players).find(x=>x.player_key===key);if(!p)return;
 busy=true;
 try{
  const result=await rpc('admin_request_top500_coverage_research_v1',{p_player_key:key,p_reason:null});
  if(result.status==='source_research_requested')
    notify(p.name+': source research requested. No player note or ranking has changed.');
  else
    notify(p.name+': added to the manual research queue. This is an editorial ticket, not an automatically completed verification.');
  await load(true);
 }catch(err){notify('Unable to start '+p.name+' research: '+(err&&err.message||'Unknown error'),true)}
 finally{busy=false}
}
async function resolve(id,action){
 if(busy)return;let note=null;
 if(action==='resolved'){
  note=window.prompt('What source or check resolved this ticket? Closing it does not update the player profile.');
  if(note===null)return;
  if(note.trim().length<10){notify('Please describe your verification in at least ten characters.',true);return}
 }
 busy=true;
 try{
  await rpc('admin_resolve_top500_coverage_request_v1',{p_request_id:id,p_action:action,p_note:note});
  notify(action==='resolved'?'Research ticket resolved. Player data and rankings unchanged.':'Ticket marked in review.');
  await load(true);
 }catch(err){notify('Could not update research ticket: '+(err&&err.message||'Unknown error'),true)}
 finally{busy=false}
}
function attach(){
 init();if(typeof page!=='function')return;if(page.__bbbCoverageTracker)return;
 const prev=page;
 page=function(name){const result=prev.apply(this,arguments);if(name==='coverage')void load(false);return result};
 page.__bbbCoverageTracker=true;
 try{if(typeof ADMIN_COMMANDS!=='undefined'&&!ADMIN_COMMANDS.some(x=>x.id==='coverage')){
  const i=ADMIN_COMMANDS.findIndex(x=>x.id==='automations');
  ADMIN_COMMANDS.splice(i<0?5:i+1,0,{id:'coverage',icon:'▤',label:'Top 500 Coverage',sub:'Player checks, unresolved research, freshness',tag:'PAGE'});
 }}catch(_){}
 if(host()&&!host().classList.contains('hide'))void load(false);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
window.BBBCoverageTracker={load,refresh:()=>load(true)};
})();