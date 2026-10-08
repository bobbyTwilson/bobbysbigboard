/* BBB Injury Command Center v1 */
(function(){
  let injuryCenter=null,injuryLoaded=false,injuryLoading=false,injuryPreset='ACTIVE';
  let reconData=null,reconLoaded=false,reconLoading=false,reconExpanded=false;

  function artUrl(id,sport='nfl'){
    if(!id)return '';
    return 'https://a.espncdn.com/i/headshots/'+sport+'/players/full/'+encodeURIComponent(id)+'.png';
  }
  function art(id,name){
    if(!id)return '<div class="inj-art inj-art-fallback"><span>'+esc((name||'?').slice(0,1))+'</span></div>';
    return '<div class="inj-art"><img src="'+artUrl(id)+'" data-inj-espn="'+esc(id)+'" alt="" loading="lazy"></div>';
  }
  function hydrateArt(){
    $$('.inj-art img').forEach(img=>{
      img.onerror=function(){
        if(img.dataset.fallbackDone==='1'){
          const wrap=img.closest('.inj-art');if(wrap){wrap.classList.add('inj-art-fallback');wrap.innerHTML='<span>?</span>'}
          return;
        }
        img.dataset.fallbackDone='1';
        img.src=artUrl(img.dataset.injEspn,'college-football');
      };
    });
  }
  function rows(){return Array.isArray(injuryCenter?.players)?injuryCenter.players:[]}
  function dateText(v){
    if(!v)return '—';
    const d=new Date(String(v).length===10?v+'T12:00:00':v);
    if(Number.isNaN(d.getTime()))return String(v);
    return d.toLocaleDateString(undefined,{month:'short',day:'numeric'});
  }
  function daysOld(v){
    if(!v)return null;
    const d=new Date(v),now=new Date();
    if(Number.isNaN(d.getTime()))return null;
    return Math.max(0,Math.floor((now-d)/86400000));
  }

  // Never equate a historical practice snapshot with a current injury report.
  function practiceStale(x){
    if(!x.practice_refreshed_at)return true;
    const t=new Date(x.practice_refreshed_at).getTime();
    return !Number.isFinite(t)||Date.now()-t>48*60*60*1000||
      x.practice_is_stale===true||String(x.practice_is_stale)==='true';
  }
  function centralTime(v){
    if(!v)return 'NEVER';
    const d=new Date(v);
    return Number.isNaN(d.getTime())?'UNKNOWN':
      d.toLocaleString('en-US',{
        timeZone:'America/Chicago',month:'short',day:'numeric',
        hour:'numeric',minute:'2-digit',timeZoneName:'short'
      });
  }
  function trustedSourceUrl(value){
    if(typeof value!=='string')return '';
    try{
      const url=new URL(value);
      return url.protocol==='https:' && url.hostname ? url.href : '';
    }catch(_){return ''}
  }

  function statusGroup(x){
    const s=String(x.current_status||'').toLowerCase();
    if(x.recent_return||Number(x.current_score)===0)return 'RETURNING';
    if(/ir|pup|nfi|reserve/.test(s)||Number(x.current_score)>=4)return 'RESERVE';
    if(/out/.test(s)||Number(x.current_score)===3)return 'OUT';
    if(/doubtful|week-to-week|week to week/.test(s)||Number(x.current_score)===2)return 'DOUBTFUL';
    return 'QUESTIONABLE';
  }
  function trendClass(x){return String(x.trend||'UNCHANGED').toLowerCase().replaceAll(' / ','-').replaceAll(' ','-')}
  function queued(x){return Array.isArray(rankingMoveQueue)&&rankingMoveQueue.some(q=>q.status==='pending'&&q.player_key===x.player_key)}
  function severityClass(v){return String(v||'low').toLowerCase().replaceAll(' / ','-').replaceAll(' ','-')}
  function barPct(level,type){
    if(type==='availability'){
      if(level==='OUT / RESERVE')return 100;if(level==='OUT')return 88;if(level==='HIGH')return 68;if(level==='WATCH')return 42;return 12;
    }
    if(level==='HIGH')return 94;if(level==='MEDIUM')return 60;return 22;
  }
  function impactGauge(label,level,type){
    const pct=barPct(level,type),cls=severityClass(level);
    return '<div class="inj-impact '+cls+'"><span>'+esc(label)+'</span><strong>'+esc(level)+'</strong><i><b style="width:'+pct+'%"></b></i></div>';
  }
  function practiceBlock(x){
    const history=Array.isArray(x.practice_history)?x.practice_history:[];
    const stale=practiceStale(x);
    const current=x.practice_participation||'—';
    const age=daysOld(x.practice_refreshed_at);
    const freshness=!x.practice_refreshed_at?'NO FEED':stale?'STALE '+(age==null?'':age+'D'):'CURRENT';
    const timeline=history.slice(0,4).reverse().map(h=>{
      const p=h.practice_participation||h.injury_status||'—';
      return '<span class="inj-practice-pill '+String(p).toLowerCase().replaceAll(' ','-')+'"><small>'+dateText(h.observed_at)+'</small><b>'+esc(p)+'</b></span>';
    }).join('');
    return '<div class="inj-practice">'+
      '<div class="inj-section-label"><span>PRACTICE / AVAILABILITY FEED</span><em class="'+(stale?'stale':'')+'">'+freshness+'</em></div>'+
      '<div class="inj-practice-current"><strong>'+esc(current)+'</strong><p>'+esc(x.practice_description||'No structured practice description available yet.')+'</p></div>'+
      (timeline?'<div class="inj-practice-timeline">'+timeline+'</div>':'')+
    '</div>';
  }
  function opportunityWatch(x){
    const w=Array.isArray(x.opportunity_watch)?x.opportunity_watch:[];
    if(!w.length)return '<span class="inj-no-watch">No same-team watchlist match.</span>';
    return w.map(p=>'<button type="button" class="inj-watch-chip" data-inj-open="'+esc(p.player_key)+'"><b>#'+p.overall_rank+'</b><span>'+esc(p.name)+'</span><small>'+esc(p.position||'')+'</small></button>').join('');
  }
  function filtered(){
    const q=($('#injurySearch')?.value||'').trim().toLowerCase();
    const pos=$('#injuryPos')?.value||'ALL';
    const status=$('#injuryStatus')?.value||'ALL';
    const trend=$('#injuryTrend')?.value||'ALL';
    const scope=$('#injuryScope')?.value||'TOP500';
    return rows().filter(x=>{
      if(pos!=='ALL'&&x.position!==pos)return false;
      if(status!=='ALL'&&statusGroup(x)!==status)return false;
      if(trend!=='ALL'&&x.trend!==trend)return false;
      if(scope==='TOP100'&&Number(x.overall_rank)>100)return false;
      if(scope==='TOP250'&&Number(x.overall_rank)>250)return false;
      if(injuryPreset==='UPDATED'&&!x.updated_today)return false;
      if(injuryPreset==='TOP100'&&(Number(x.current_score)<=0||Number(x.overall_rank)>100))return false;
      if(injuryPreset==='RESERVE'&&statusGroup(x)!=='RESERVE')return false;
      if(injuryPreset==='RETURNING'&&!x.recent_return)return false;
      if(injuryPreset==='DNP'&&!(String(x.practice_participation||'').toLowerCase()==='dnp'&&!practiceStale(x)))return false;
      if(injuryPreset==='ACTIVE'&&Number(x.current_score)<=0)return false;
      const hay=(x.name+' '+(x.team||'')+' '+(x.position||'')+' '+(x.current_status||'')+' '+(x.injury_note||'')+' '+(x.latest_update_text||'')).toLowerCase();
      return !q||hay.includes(q);
    });
  }
  function priorityRows(){
    return rows().filter(x=>Number(x.current_score)>0&&statusGroup(x)!=='RESERVE'&&Number(x.overall_rank)<=150)
      .sort((a,b)=>(Number(b.updated_today)-Number(a.updated_today))||(Number(b.current_score)-Number(a.current_score))||(Number(a.overall_rank)-Number(b.overall_rank)))
      .slice(0,4);
  }
  function renderPriorityBoard(){
    const el=$('#injuryPriorityBoard');if(!el)return;
    const list=priorityRows();
    el.innerHTML=list.length?list.map((x,i)=>{
      const trend=trendClass(x),st=statusGroup(x).toLowerCase();
      return '<button type="button" class="inj-priority-card '+st+'" data-inj-open="'+esc(x.player_key)+'">'+

        art(x.espn_id,x.name)+
        '<span class="inj-priority-copy"><small>BBB #'+x.overall_rank+' · '+esc(x.position)+' · '+esc(x.team||'FA')+'</small><strong>'+esc(x.name)+'</strong><em>'+esc(x.current_status||'Injury watch')+'</em></span>'+
        '<span class="inj-trend '+trend+'">'+esc(x.trend||'UNCHANGED')+'</span>'+
        '<span class="inj-priority-return">'+esc(x.return_window||'TBD')+'</span>'+
      '</button>';
    }).join(''):'<div class="empty">No immediate injury priorities.</div>';
  }
  function renderCards(){
    const grid=$('#injuryGrid');if(!grid)return;
    const list=filtered();
    if($('#injuryResultCount'))$('#injuryResultCount').textContent=list.length+' players shown';
    grid.innerHTML=list.length?list.map(x=>{
      const st=statusGroup(x),stCls=st.toLowerCase(),trend=trendClass(x),isQueued=queued(x),stale=practiceStale(x);
      return '<article class="inj-card '+stCls+'">'+
        '<div class="inj-card-accent"></div>'+
        '<div class="inj-card-head">'+
          '<div class="inj-player">'+art(x.espn_id,x.name)+'<div class="inj-player-copy"><div class="inj-eyeline"><span>BBB #'+x.overall_rank+'</span><span>'+esc(x.position)+' · '+esc(x.team||'FA')+'</span><span>'+(x.market_rank?'MARKET #'+x.market_rank:'MARKET UR')+'</span></div><button type="button" data-inj-open="'+esc(x.player_key)+'">'+esc(x.name)+'</button><p>'+esc(x.current_status||'Injury watch')+'</p></div></div>'+
          '<div class="inj-status-stack"><span class="inj-status '+stCls+'">'+esc(st)+'</span><span class="inj-trend '+trend+'">'+esc(x.trend||'UNCHANGED')+'</span>'+(x.updated_today?'<span class="inj-new">UPDATED TODAY</span>':'')+'</div>'+
        '</div>'+
        '<div class="inj-card-body">'+
          '<section class="inj-intel">'+
            '<div class="inj-section-label"><span>LATEST INJURY INTEL</span><em>'+dateText(x.latest_update_date||x.injury_updated)+'</em></div>'+
            '<p class="inj-latest">'+esc(x.latest_update_text||x.injury_note||x.feed_injury_notes||'No detailed injury note available.')+'</p>'+
            '<div class="inj-meta-row"><span><b>RETURN</b>'+esc(x.return_window||'TBD')+'</span><span><b>BODY AREA</b>'+esc(x.injury_body_part||'See note')+'</span><span><b>RANK IMPACT</b>'+esc(x.latest_rank_impact||'No change logged')+'</span></div>'+
          '</section>'+
          '<section class="inj-impact-panel">'+impactGauge('SHORT-TERM AVAILABILITY',x.availability_level,'availability')+impactGauge('DYNASTY SEVERITY',x.dynasty_severity,'dynasty')+'</section>'+
          practiceBlock(x)+
          '<section class="inj-opportunity"><div class="inj-section-label"><span>OPPORTUNITY WATCH</span><em>Same-team assets</em></div><div class="inj-watch-list">'+opportunityWatch(x)+'</div></section>'+
        '</div>'+
        '<div class="inj-card-foot">'+
          '<div class="inj-source-health"><span class="'+(stale?'stale':'')+'">'+(stale?'PRACTICE FEED STALE':'PRACTICE FEED CURRENT')+'</span><small>Profile updated '+dateText(x.injury_updated)+'</small></div>'+
          '<div class="inj-actions"><button type="button" class="small-btn" data-inj-open="'+esc(x.player_key)+'">PLAYER WORKSPACE</button><button type="button" class="queue-action '+(isQueued?'verified-state':'')+'" data-inj-queue="'+esc(x.player_key)+'" '+(isQueued?'disabled':'')+'>'+(isQueued?'IN RANKING QUEUE ✓':'QUEUE RANK REVIEW')+'</button></div>'+
        '</div>'+
      '</article>';
    }).join(''):'<div class="move-queue-empty"><div class="move-empty-orb">✓</div><strong>No players match this injury view.</strong><span>Change the filters or switch the triage preset.</span></div>';
    bindCardActions();
    hydrateArt();
  }
  function renderSummary(){
    const s=injuryCenter?.summary||{};
    const map={injuryActive:s.active_injuries,injuryToday:s.updated_today,injuryTop100:s.top_100,injuryReserve:s.reserve,injuryReturning:s.returning};
    Object.entries(map).forEach(([id,v])=>{if($('#'+id))$('#'+id).textContent=v??'—'});
    if($('#injuryNavCount'))$('#injuryNavCount').textContent=s.active_injuries??'—';
    if($('#injuryProfileFresh'))$('#injuryProfileFresh').textContent=s.profile_freshness?'PLAYER INTEL '+dateText(s.profile_freshness).toUpperCase():'PLAYER INTEL —';
    if($('#injuryPracticeFresh')){
      const age=daysOld(s.practice_feed_freshness);
      $('#injuryPracticeFresh').textContent=s.practice_feed_freshness?'PRACTICE FEED '+dateText(s.practice_feed_freshness).toUpperCase()+(age?' · '+age+'D OLD':''):'PRACTICE FEED —';
      $('#injuryPracticeFresh').classList.toggle('stale',age!=null&&age>1);
    }
    if($('#injuryDnpCount'))$('#injuryDnpCount').textContent=rows().filter(x=>Number(x.current_score)>0&&String(x.practice_participation||'').toLowerCase()==='dnp'&&!practiceStale(x)).length+' VERIFIED CURRENT DNP';
  }
  function syncPreset(){
    $$('[data-inj-preset]').forEach(el=>el.classList.toggle('active',el.dataset.injPreset===injuryPreset));
  }

  function reconStatistic(label,value,sub,type){
    return '<div class="inj-recon-stat '+(type||'')+'"><span>'+esc(label)+'</span>'+
      '<strong>'+esc(String(value??'—'))+'</strong><small>'+esc(sub)+'</small></div>';
  }
  function renderRecon(){
    const stats=$('#injuryReconStats'),rowsHost=$('#injuryReconRows'),count=$('#injuryReconCount'),expand=$('#injuryReconExpand');
    if(!stats||!rowsHost)return;
    if(!reconData){
      stats.innerHTML='<div class="empty">Snapshot reconciliation is temporarily unavailable. Your current player notes have not been changed.</div>';
      rowsHost.innerHTML='';
      return;
    }
    const a=reconData.summary||{},c=Array.isArray(reconData.candidates)?reconData.candidates:[];
    const stale=Number(a.stale_snapshots||0),total=Number(a.ranked||0);
    stats.innerHTML=
      reconStatistic('STALE / MISSING SNAPSHOTS',stale+'/'+total,'Older than 48 hours or absent',stale?'bad':'good')+
      reconStatistic('AVAILABILITY DIFFERENCES',a.availability_disagreements,'Profile severity vs. old feed','warn')+
      reconStatistic('TEAM DIFFERENCES',a.team_disagreements,'Confirm transaction before editing','warn')+
      reconStatistic('NEWER EDITORIAL NOTES',a.editorial_newer,'Do not overwrite these updates','good')+
      reconStatistic('LATEST HISTORICAL SNAPSHOT',a.snapshot_last_refreshed?centralTime(a.snapshot_last_refreshed):'NEVER','Historical status source · not a live injury report',stale?'bad':'good');
    const subset=reconExpanded?c:c.slice(0,12);
    rowsHost.innerHTML=subset.length?subset.map(x=>{
      const kind=String(x.issue_type||'EDITORIAL UPDATE NEWER');
      const important=kind==='AVAILABILITY DISAGREEMENT'||kind==='TEAM DISAGREEMENT'||kind==='MISSING SNAPSHOT';
      const href=trustedSourceUrl(x.latest_source_url)||trustedSourceUrl(x.alternate_source_url);
      const source=href?'<a class="inj-recon-source" href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">VIEW LOGGED SOURCE ↗</a>':'';
      return '<article class="inj-recon-item '+(important?'attention':'informational')+'">'+
        '<div class="inj-recon-player"><strong>#'+esc(String(x.overall_rank))+' '+esc(x.name||x.player_key)+'</strong>'+
          '<span>'+esc(x.position||'')+' · '+esc(x.bbb_team||'FA')+' · '+esc(kind)+'</span>'+
          '<div class="inj-recon-compare">'+
            '<div><small>BBB EDITORIAL STATUS</small><b>'+esc(x.bbb_status||'Healthy')+'</b><em>'+esc(x.bbb_injury_updated||'No dated edit')+'</em></div>'+
            '<div><small>OLDER SNAPSHOT STATUS</small><b>'+esc(x.snapshot_status||'Not reported')+'</b><em>'+esc(centralTime(x.snapshot_refreshed_at))+'</em></div>'+
          '</div>'+
          (x.team_disagreement?'<p class="inj-recon-note">Team review: BBB '+esc(x.bbb_team||'FA')+' vs source '+esc(x.snapshot_team||'FA')+'</p>':'')+
          (x.latest_logged_text?'<p class="inj-recon-note"><b>Latest linked player update:</b> '+esc(String(x.latest_logged_text).slice(0,250))+'</p>':'')+
        '</div>'+
        '<div class="inj-recon-buttons">'+source+
          '<button type="button" class="small-btn" data-recon-open="'+esc(x.player_key)+'">OPEN PLAYER</button>'+
        '</div></article>';
    }).join(''):'<div class="empty">No discrepancies or newer editorial updates currently qualify for review.</div>';
    if(count)count.textContent=c.length+' prioritized players · '+(reconExpanded?c.length:Math.min(12,c.length))+' shown · review only';
    if(expand){
      expand.classList.toggle('hide',c.length<=12);
      expand.textContent=reconExpanded?'SHOW LESS':'SHOW ALL ('+c.length+')';
    }
    // Click handlers live on the stable page root; do not rebind rendered nodes.
    // The old single-element $ selector here threw TypeError and aborted rendering.
  }
  async function loadRecon(force=false){
    if(reconLoading)return;
    if(reconLoaded&&!force){renderRecon();return}
    reconLoading=true;
    try{
      reconData=await rpc('admin_get_status_reconciliation',{p_limit:75});
      reconLoaded=true;renderRecon();
    }catch(e){
      console.error('Status Reconciliation failed',e);
      const h=$('#injuryReconRows');
      if(h)h.innerHTML='<div class="empty">Reconciliation could not be loaded. No player data was changed. '+esc(e.message||'')+'</div>';
    }finally{reconLoading=false}
  }

  function render(){
    if(!injuryLoaded||!injuryCenter)return;
    renderSummary();renderPriorityBoard();renderCards();renderRecon();syncPreset();
  }
  async function load(force=false){
    if(injuryLoading)return;
    if(injuryLoaded&&!force){render();return}
    injuryLoading=true;
    if($('#injuryLoadState')){$('#injuryLoadState').textContent='TRIAGING…';$('#injuryLoadState').classList.add('inj-pulsing')}
    try{
      injuryCenter=await rpc('admin_get_injury_command_center',{p_limit:500})||null;
      injuryLoaded=true;
      render();
      void loadRecon(force);
    }catch(e){
      console.error('BBB Injury Command Center failed',e);
      const grid=$('#injuryGrid');if(grid)grid.innerHTML='<div class="scanner-error"><span>!</span><strong>Injury Command Center failed to load.</strong><small>'+esc(e.message||'Unknown error')+'</small><button id="injuryRetry" class="small-btn">TRY AGAIN</button></div>';
      $('#injuryRetry')?.addEventListener('click',()=>load(true));
    }finally{
      injuryLoading=false;
      if($('#injuryLoadState')){$('#injuryLoadState').textContent='LIVE INTEL';$('#injuryLoadState').classList.remove('inj-pulsing')}
    }
  }
  async function queueReview(key,btn){
    const x=rows().find(v=>v.player_key===key);if(!x)return;
    const reason='Injury Command Center: '+(x.current_status||'injury review')+'. '+(x.latest_update_text||x.injury_note||'Availability requires review.');
    const priority=x.dynasty_severity==='HIGH'||x.current_score>=3?2:3;
    const old=btn.textContent;btn.disabled=true;btn.textContent='QUEUING…';
    try{
      await rpc('admin_queue_ranking_move',{
        p_player_key:key,p_recommended_rank:null,p_reason:reason,p_priority:priority,
        p_source:'injury_command_center',p_confidence:x.updated_today?'high':'medium',p_trigger_update_id:null
      });
      await Promise.all([loadRankingMoveQueue(),loadReviewQueue()]);
      render();renderRankingMoveQueue();renderReviewQueue();renderCommandDashboard();
    }catch(e){alert(e.message);btn.disabled=false;btn.textContent=old}
  }
  function bindCardActions(){
    $$('[data-inj-open]').forEach(b=>b.onclick=()=>window.openBBBPlayerWorkspace?.(b.dataset.injOpen,'activity'));
    $$('[data-inj-queue]').forEach(b=>b.onclick=()=>queueReview(b.dataset.injQueue,b));
  }
  // Event delegation survives every reconciliation and filter re-render.
  function bindReconActions(){
    const host=$('#pageInjuries');
    if(!host||host.dataset.reconActionsBound==='1')return;
    host.dataset.reconActionsBound='1';
    host.addEventListener('click',event=>{
      const target=event.target.closest('button,a');
      if(!target||!host.contains(target))return;
      if(target.id==='injuryReconRefresh'){
        event.preventDefault();void loadRecon(true);return;
      }
      if(target.id==='injuryReconExpand'){
        event.preventDefault();reconExpanded=!reconExpanded;renderRecon();return;
      }
      if(target.matches('[data-recon-open]')){
        event.preventDefault();
        const key=target.dataset.reconOpen;
        if(typeof window.openBBBPlayerWorkspace==='function'){
          window.openBBBPlayerWorkspace(key,'activity');
        }else{
          // Existing native player editor is the fallback if the workspace is not ready.
          page('players');
          const search=$('#playerAdminSearch');
          if(search){search.value=key.replaceAll('-',' ');search.dispatchEvent(new Event('input',{bubbles:true}))}
        }
      }
    });
  }
  function bindControls(){
    bindReconActions();
    ['#injurySearch','#injuryPos','#injuryStatus','#injuryTrend','#injuryScope'].forEach(sel=>{
      const el=$(sel);if(!el||el.dataset.injBound==='1')return;
      el.dataset.injBound='1';
      el.addEventListener(sel==='#injurySearch'?'input':'change',renderCards);
    });
    $('#injuryClear')?.addEventListener('click',()=>{
      $('#injurySearch').value='';$('#injuryPos').value='ALL';$('#injuryStatus').value='ALL';$('#injuryTrend').value='ALL';$('#injuryScope').value='TOP500';injuryPreset='ACTIVE';render();
    });
    $('#injuryRefresh')?.addEventListener('click',()=>load(true));
    $$('[data-inj-preset]').forEach(el=>{
      el.onclick=()=>{injuryPreset=el.dataset.injPreset;render()};
      el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();injuryPreset=el.dataset.injPreset;render()}};
    });
  }

  const originalPage=page;
  page=function(name){
    originalPage(name);
    if(name==='injuries'){
      if($('#missionPageTitle'))$('#missionPageTitle').textContent='Injury Command Center';
      bindControls();
      if(!injuryLoaded&&!injuryLoading)void load(false); else render();
      if(!reconLoaded&&!reconLoading)void loadRecon(false);
    }
  };

  const originalExecuteCommand=executeCommandItem;
  executeCommandItem=function(item){
    if(item?.id==='injuries'){closeCommandPalette();page('injuries');return}
    return originalExecuteCommand(item);
  };

  try{
    if(typeof ADMIN_COMMANDS!=='undefined'){
      const item=ADMIN_COMMANDS.find(x=>x.id==='injuries');
      if(item){
        item.icon='✚';
        item.label='Injury Command Center';
        item.sub='Availability, practice and dynasty injury triage';
        item.tag='PAGE';
      }
    }
  }catch(_){}

  document.addEventListener('DOMContentLoaded',bindControls,{once:true});
  window.BBBInjuryCenter={load,render};
})();