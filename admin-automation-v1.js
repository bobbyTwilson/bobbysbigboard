/* BBB Automation Control Center v1 */
(function(){
  let autoData=null,autoLoaded=false,autoLoading=false,autoHealth=null,jobMetrics=[];

  function arr(v){return Array.isArray(v)?v:[]}
  function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
  function escv(v){return esc(v==null?'':v)}
  function dt(v){
    if(!v)return null;
    const d=new Date(v);return Number.isNaN(d.getTime())?null:d;
  }
  function rel(v){
    const d=dt(v);if(!d)return 'NEVER';
    const diff=Math.max(0,Date.now()-d.getTime());
    const m=Math.round(diff/60000);
    if(m<2)return 'JUST NOW';
    if(m<60)return m+'M AGO';
    const h=Math.round(m/60);
    if(h<24)return h+'H AGO';
    return Math.round(h/24)+'D AGO';
  }
  function localStamp(v){
    const d=dt(v);if(!d)return '—';
    return d.toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
  }
  function healthClass(v){
    v=String(v||'').toUpperCase();
    if(v==='HEALTHY'||v==='SUCCEEDED'||v==='IMPORTED'||v==='NO CHANGE SINCE IMPORT')return 'good';
    if(v==='CHANGED'||v==='STALE')return 'warn';
    if(v==='ERROR'||v==='FAILED')return 'bad';
    return 'neutral';
  }
  function scheduleLabel(job){
    const map={
      bbb_intraday_weekly:'7 AM · 11 AM · 3 PM · 7 PM · 11 PM CT',
      bbb_intraday_season:'7:05 AM · 11:05 AM · 3:05 PM · 7:05 PM · 11:05 PM CT',
      bbb_intraday_snaps:'7:10 AM · 11:10 AM · 3:10 PM · 7:10 PM · 11:10 PM CT',
      bbb_intraday_rosters:'7:15 AM · 11:15 AM · 3:15 PM · 7:15 PM · 11:15 PM CT',
      bbb_intraday_metadata:'7:20 AM · 11:20 AM · 3:20 PM · 7:20 PM · 11:20 PM CT',
      bbb_daily_maintenance:'11:30 AM CT'
    };
    return map[job.jobname]||job.schedule||'—';
  }
  // pg_cron runs in UTC. Our production schedule has a DST-aware
  // America/Chicago hour gate, so its next attempted UTC tick can be a no-write
  // skip. Calculate the next REAL local refresh rather than displaying it.
  const centralClock = new Intl.DateTimeFormat('en-US',{
    timeZone:'America/Chicago',hour:'2-digit',hourCycle:'h23'
  });
  function centralHour(d){
    const h=centralClock.formatToParts(d).find(x=>x.type==='hour');
    return Number(h?.value);
  }
  function nextActualRun(job){
    if(!job?.active)return null;
    const market=job.jobname==='bbb_daily_maintenance';
    const parts=String(job.schedule||'').split(/\s+/);
    const minute=Number(parts[0]);
    if(!Number.isInteger(minute)||minute<0||minute>59)return null;
    const targetHours=market?[11]:[7,11,15,19,23];
    const candidateHours=market?[16,17]:[0,1,4,5,12,13,16,17,20,21];
    const now=new Date();
    let best=null;
    for(let day=0;day<3;day++){
      for(const hour of candidateHours){
        const d=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+day,hour,minute));
        if(d<=now||!targetHours.includes(centralHour(d)))continue;
        if(!best||d<best)best=d;
      }
    }
    return best;
  }
  function centralStamp(v){
    const d=dt(v);if(!d)return '—';
    return d.toLocaleString('en-US',{
      timeZone:'America/Chicago',month:'short',day:'numeric',
      hour:'numeric',minute:'2-digit',timeZoneName:'short'
    });
  }

  function runDetail(d){
    if(!d)return 'No result payload.';
    const status=String(d.status||'').toLowerCase();
    if(status==='skipped_no_change')return 'Source checked · no upstream change · zero import writes.';
    if(d.advanced?.updated_rows||d.basic?.stored_rows){
      return [d.basic?.stored_rows?d.basic.stored_rows+' weekly rows':null,d.advanced?.updated_rows?d.advanced.updated_rows+' advanced rows':null].filter(Boolean).join(' · ');
    }
    if(d.updated_rows!=null)return d.updated_rows+' rows updated.';
    if(d.result?.updated_rows!=null)return d.result.updated_rows+' rows updated.';
    if(d.result?.stored_rows!=null)return d.result.stored_rows+' rows stored.';
    if(d.result?.updated_players!=null)return d.result.updated_players+' players refreshed.';
    if(d.changes_made!=null)return d.changes_made+' news changes · '+num(d.ranking_reviews)+' ranking reviews.';
    if(d.market_refresh?.matched_top500!=null)return d.market_refresh.matched_top500+' Top 500 market matches.';
    if(d.error)return String(d.error);
    return 'Completed successfully.';
  }
  function sourceRows(s){
    const d=s.last_result||{};
    if(s.source_code==='weekly'){
      const a=d.advanced||{},b=d.basic||{};
      return [
        a.updated_rows!=null?'<span><b>'+a.updated_rows+'</b> ADVANCED ROWS</span>':'',
        b.stored_rows!=null?'<span><b>'+b.stored_rows+'</b> WEEKLY ROWS</span>':''
      ].join('');
    }
    const r=d.result||d;
    if(r.updated_rows!=null)return '<span><b>'+r.updated_rows+'</b> UPDATED</span>';
    if(r.stored_rows!=null)return '<span><b>'+r.stored_rows+'</b> STORED</span>';
    if(r.updated_players!=null)return '<span><b>'+r.updated_players+'</b> PLAYERS</span>';
    return '<span><b>—</b> LAST IMPORT</span>';
  }

  function renderSummary(){
    const s=autoData?.summary||{};
    const healthy=num(s.sources_healthy),total=num(s.sources_total);
    if($('#autoHealthScore'))$('#autoHealthScore').textContent=total?Math.round((healthy/total)*100)+'%':'—';
    if($('#autoSourcesHealthy'))$('#autoSourcesHealthy').textContent=healthy+'/'+total;
    if($('#autoActiveJobs'))$('#autoActiveJobs').textContent=num(s.active_jobs);
    if($('#autoFailures'))$('#autoFailures').textContent=num(s.recent_failures);
    if($('#autoRankLock'))$('#autoRankLock').textContent=s.ranking_policy||'MANUAL ONLY';
    if($('#autoNavCount'))$('#autoNavCount').textContent=healthy+'/'+total;
    const state=$('#autoHealthState');
    if(state){
      const bad=num(s.recent_failures)>0||healthy<total||autoHealth?.status_source_stale===true;
      state.className='hud-badge '+(bad?'warn':'good');
      state.textContent=bad?'ATTENTION':'ALL SYSTEMS HEALTHY';
    }
  }

  function readinessCard(kind,label,value,detail){
    return '<article class="auto-readiness-card '+kind+'">'+
      '<span>'+escv(label)+'</span><strong>'+escv(value)+'</strong><p>'+escv(detail)+'</p></article>';
  }
  function renderReadiness(){
    const host=$('#autoReadinessGrid'),actions=$('#autoReadinessActions');
    if(!host)return;
    const s=autoData?.summary||{},h=autoHealth||{},news=autoData?.news_pulse?.last_logged_run||{};
    const total=num(s.sources_total),good=num(s.sources_healthy);
    const statusKnown=h.status_source_stale!=null;
    const stale=statusKnown&&h.status_source_stale===true;
    const statusValue=!statusKnown?'UNKNOWN':stale?'STALE':'CURRENT';
    const statusText=!statusKnown
      ?'Could not verify the status-source timestamp.'
      :'Last refresh '+centralStamp(h.status_source_last_refresh)
        +' · '+Math.round(num(h.status_source_age_hours))+'h old';
    const staleInj=num(h.stale_injury_source_mismatches),staleTeam=num(h.stale_team_source_mismatches);
    const ranks=num(h.ranked_players),slots=num(h.unique_rank_slots),dups=num(h.duplicate_ranking_history_groups);
    const rankOK=ranks===500&&slots===500&&dups===0;
    const pulseRecent=news.run_at&&Date.now()-new Date(news.run_at).getTime()<10*60*60*1000;
    const jobsFail=arr(jobMetrics).reduce((n,j)=>n+num(j.failed_runs_7d),0);
    host.innerHTML=
      readinessCard(total&&good===total?'good':'warn',
        'AUTOMATED DATA SOURCES',good+'/'+total+' healthy',
        'Stats, snaps, player metadata and roster history · checked independently of player-status feed')+
      readinessCard(stale?'bad':statusKnown?'good':'warn',
        'INJURY / PLAYER STATUS SOURCE',statusValue,
        statusText+(stale?' · '+staleInj+' injury and '+staleTeam+' team discrepancies need review':'') )+
      readinessCard(pulseRecent&&news.success!==false?'good':'warn',
        'NEWS PULSE · SEPARATE SCAN',news.run_at?rel(news.run_at):'NOT LOGGED',
        news.run_at?'Last verified-news scan: '+centralStamp(news.run_at)+'. This does not refresh the whole status-source snapshot.':'No recent run recorded.')+
      readinessCard(rankOK?'good':'bad','MANUAL RANKING INTEGRITY',
        ranks+'/'+500+' slots',rankOK?'All rank slots unique · no duplicate history groups':'Inspect ranking integrity before applying moves')+
      readinessCard(jobsFail?'bad':'good','CRON ERRORS · 7 DAYS',
        jobsFail+' errors','Counts real Central-time windows, excluding no-write DST alignment checks');
    if(actions)actions.innerHTML=(stale
      ?'<span class="auto-readiness-warning">The old status source is stale. Do not treat its injury labels as current NFL verification.</span>'
      :'<span>All status-source timestamps are within the configured freshness threshold.</span>')+
      '<div><button class="small-btn" type="button" data-auto-jump="injuries">OPEN INJURY CENTER</button>'+
      '<button class="small-btn" type="button" data-auto-jump="review">REVIEW EXCEPTIONS</button>'+
      '<button class="small-btn" type="button" data-auto-jump="prospects">PROSPECT LAB</button></div>';
  }

  function renderGuards(){
    const g=autoData?.guards||{},host=$('#autoGuardGrid');if(!host)return;
    const guards=[
      ['RANKINGS',g.ranking_lock,'MANUAL ONLY','No scheduled process can alter overall_rank.'],
      ['NEWS DEDUPE',g.news_dedupe_active,'ENFORCED','Same source/event is blocked before timeline insert.'],
      ['REVIEW DEDUPE',g.queue_dedupe_active,'ENFORCED','Only one pending ranking review per player.'],
      ['UNCHANGED SOURCES',g.unchanged_source_skip,'SKIP WRITES','Source hashes are checked before imports run.']
    ];
    host.innerHTML=guards.map(x=>'<div class="auto-guard '+(x[1]?'good':'bad')+'"><i></i><span>'+escv(x[0])+'</span><strong>'+escv(x[2])+'</strong><p>'+escv(x[3])+'</p></div>').join('');
  }

  function sourceCard(s){
    const hc=healthClass(s.health_status);
    return '<article class="auto-source-card '+hc+'">'+
      '<header><div class="auto-source-icon">'+({weekly:'Σ',season:'∑',snaps:'%',rosters:'↔',metadata:'ID'}[s.source_code]||'•')+'</div><div><span>'+escv(String(s.source_code||'').toUpperCase())+'</span><h3>'+escv(s.label)+'</h3></div><em class="'+hc+'">'+escv(s.health_status)+'</em></header>'+
      '<div class="auto-source-state"><span>SOURCE STATE</span><strong>'+escv(s.change_status)+'</strong></div>'+
      '<div class="auto-source-times"><div><span>LAST CHECKED</span><strong>'+rel(s.last_checked_at)+'</strong><small>'+localStamp(s.last_checked_at)+'</small></div><div><span>LAST IMPORT</span><strong>'+rel(s.last_imported_at)+'</strong><small>'+localStamp(s.last_imported_at)+'</small></div></div>'+
      '<div class="auto-source-rows">'+sourceRows(s)+'</div>'+
      '<footer><span>HASH-GATED · WRITES ONLY ON CHANGE</span><button type="button" data-auto-run="'+escv(s.source_code)+'">CHECK NOW</button></footer>'+
    '</article>';
  }
  function renderSources(){
    const host=$('#autoSourceGrid');if(!host)return;
    const list=arr(autoData?.sources);
    host.innerHTML=list.length?list.map(sourceCard).join(''):'<div class="empty">No source fingerprints are available yet.</div>';
  }

  function jobCard(j){
    const lr=j.last_run||{},next=nextActualRun(j),status=String(lr.status||'scheduled').toUpperCase();
    const metrics=arr(jobMetrics).find(m=>m.jobname===j.jobname)||{};
    const lastReal=metrics.last_eligible_run;
    const hc=lr.status==='failed'?'bad':j.active?'good':'neutral';
    return '<article class="auto-job-card '+hc+'">'+
      '<div class="auto-job-state"><i></i><span>'+escv(j.active?'ACTIVE':'PAUSED')+'</span></div>'+
      '<div class="auto-job-copy"><small>'+escv(j.jobname)+'</small><h3>'+escv(j.label)+'</h3><p>'+escv(scheduleLabel(j))+'</p></div>'+
      '<div class="auto-job-times"><div><span>LAST REAL WINDOW</span><strong>'+escv(lastReal?rel(lastReal):'NOT YET')+'</strong></div><div><span>NEXT REAL CHECK</span><strong>'+escv(next?centralStamp(next):'PAUSED')+'</strong></div></div>'+
      '<div class="auto-run-metrics"><span>'+escv(metrics.successful_runs_7d??'—')+'/'+escv(metrics.eligible_runs_7d??'—')+' successful eligible runs · 7d</span>'+(num(metrics.failed_runs_7d)?'<strong>'+escv(metrics.failed_runs_7d)+' failed</strong>':'<small>Central-time aware</small>')+'</div>'+
      '<div class="auto-job-result '+healthClass(status)+'"><span>'+escv(status)+'</span>'+(lr.duration_seconds!=null?'<small>'+Math.round(num(lr.duration_seconds))+'s</small>':'')+'</div>'+
    '</article>';
  }
  function newsJobCard(){
    const n=autoData?.news_pulse||{},lr=n.last_logged_run||{};
    return '<article class="auto-job-card news '+(lr.success===false?'bad':'good')+'">'+
      '<div class="auto-job-state"><i></i><span>ACTIVE</span></div>'+
      '<div class="auto-job-copy"><small>chatgpt_news_pulse</small><h3>BBB News Pulse</h3><p>'+escv(n.schedule_local||'5× daily')+'</p></div>'+
      '<div class="auto-job-times"><div><span>LAST LOGGED RUN</span><strong>'+escv(lr.run_at?rel(lr.run_at):'AWAITING FIRST RUN')+'</strong></div><div><span>MANAGED BY</span><strong>'+escv(n.managed_by||'ChatGPT')+'</strong></div></div>'+
      '<div class="auto-job-result '+(lr.success===false?'bad':'good')+'"><span>'+(lr.run_at?(lr.success===false?'FAILED':'READY'):'SCHEDULED')+'</span></div>'+
    '</article>';
  }
  function renderJobs(){
    const host=$('#autoJobGrid');if(!host)return;
    host.innerHTML=arr(autoData?.jobs).map(jobCard).join('')+newsJobCard();
  }

  function renderRuns(){
    const host=$('#autoRunList');if(!host)return;
    const list=arr(autoData?.recent_runs).slice(0,24);
    host.innerHTML=list.length?list.map(r=>{
      const d=r.details||{},status=d.status||((r.success)?'completed':'failed'),hc=r.success?healthClass(status):'bad';
      return '<article class="auto-run-row '+hc+'"><div class="auto-run-dot"></div><div class="auto-run-main"><div><span>'+escv(r.label||r.run_kind)+'</span><strong>'+escv(String(status).replaceAll('_',' ').toUpperCase())+'</strong></div><p>'+escv(runDetail(d))+'</p></div><time>'+escv(localStamp(r.run_at))+'</time></article>';
    }).join(''):'<div class="empty">No automation run history yet.</div>';
  }

  function renderLatestNews(){
    const x=autoData?.latest_news||{},host=$('#autoLatestNews');if(!host)return;
    if(!x.player_key){
      host.innerHTML='<div class="move-queue-empty"><div class="move-empty-orb">✓</div><strong>No recent meaningful player update.</strong><span>The news pulse has nothing new to surface.</span></div>';
      return;
    }
    host.innerHTML='<div class="auto-news-badge">'+escv(String(x.update_type||'UPDATE').toUpperCase())+'</div><h3>'+escv(x.name||x.player_key)+'</h3><div class="auto-news-meta"><span>BBB #'+escv(x.overall_rank??'UR')+'</span><span>'+escv(x.position||'')+' · '+escv(x.team||'FA')+'</span><span>'+escv(x.review_status||'')+'</span></div><p>'+escv(x.update_text||'')+'</p><div class="auto-news-foot"><span>'+escv(localStamp(x.created_at))+'</span><strong>'+escv(x.rank_impact||'No rank impact logged')+'</strong></div><button type="button" class="small-btn" data-auto-player="'+escv(x.player_key)+'">OPEN PLAYER WORKSPACE</button>';
  }

  function render(){
    if(!autoLoaded||!autoData)return;
    renderSummary();renderReadiness();renderGuards();renderSources();renderJobs();renderRuns();renderLatestNews();bindActions();
  }

  async function load(force=false){
    if(autoLoading)return;
    if(autoLoaded&&!force){render();return}
    autoLoading=true;
    const state=$('#autoLoadState');if(state){state.textContent='SYNCING…';state.classList.add('auto-pulsing')}
    try{
      const results=await Promise.allSettled([
        rpc('admin_get_automation_control_center',{}),
        rpc('admin_get_data_health',{}),
        rpc('admin_get_job_run_health',{})
      ]);
      if(results[0].status!=='fulfilled')throw results[0].reason;
      autoData=results[0].value||null;
      autoHealth=results[1].status==='fulfilled'?results[1].value:null;
      jobMetrics=results[2].status==='fulfilled'?arr(results[2].value?.jobs):[];
      autoLoaded=true;render();
    }catch(e){
      console.error('Automation Control Center failed',e);
      const host=$('#autoSourceGrid');
      if(host)host.innerHTML='<div class="scanner-error"><span>!</span><strong>Automation Center failed to load.</strong><small>'+escv(e.message||'Unknown error')+'</small><button id="autoRetry" class="small-btn">TRY AGAIN</button></div>';
      $('#autoRetry')?.addEventListener('click',()=>load(true));
    }finally{
      autoLoading=false;
      if(state){state.textContent='LIVE CONTROL';state.classList.remove('auto-pulsing')}
    }
  }

  async function runSource(code,btn){
    const old=btn.textContent;btn.disabled=true;btn.textContent='CHECKING…';
    try{
      const result=await rpc('admin_run_automation_source',{p_source:code});
      const st=String(result?.status||'completed').replaceAll('_',' ').toUpperCase();
      btn.textContent=st;
      await load(true);
    }catch(e){
      alert(e.message);btn.textContent='FAILED';
    }finally{
      setTimeout(()=>{btn.disabled=false;if(btn.textContent!=='CHECK NOW')btn.textContent=old},1800);
    }
  }

  function bindActions(){
    $$('[data-auto-run]').forEach(b=>b.onclick=()=>runSource(b.dataset.autoRun,b));
    $('[data-auto-player]').forEach(b=>b.onclick=()=>window.openBBBPlayerWorkspace?.(b.dataset.autoPlayer,'activity'));
    $('[data-auto-jump]').forEach(b=>b.onclick=()=>page(b.dataset.autoJump));
  }

  $('#autoRefresh')?.addEventListener('click',()=>load(true));

  const priorPage=page;
  page=function(name){
    priorPage(name);
    if(name==='automations'){
      if($('#missionPageTitle'))$('#missionPageTitle').textContent='Automation Control Center';
      if(!autoLoaded&&!autoLoading)void load(false);else render();
    }
  };

  try{
    if(typeof ADMIN_COMMANDS!=='undefined'&&!ADMIN_COMMANDS.some(x=>x.id==='automations')){
      const idx=ADMIN_COMMANDS.findIndex(x=>x.id==='content');
      ADMIN_COMMANDS.splice(idx>=0?idx+1:5,0,{id:'automations',icon:'⟳',label:'Automation Control Center',sub:'Health, schedules, freshness + safeguards',tag:'PAGE'});
    }
  }catch(_){}

  window.BBBAutomationCenter={load,render};
})();