/* BBB Automation Control Center v1 */
(function(){
  let autoData=null,autoLoaded=false,autoLoading=false,autoHealth=null,jobMetrics=[],autoIntel=null,newsCoverage=null;

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
      const bad=num(s.recent_failures)>0||healthy<total||autoHealth?.status_source_stale===true||newsCoverage?.recent_scan?.status!=='complete';
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


  function renderNewsCoverage(){
    const cards=$('#autoNewsCoverage'),note=$('#autoNewsCoverageNote');
    if(!cards)return;
    const data=newsCoverage||{},scan=data.recent_scan||null;
    const expected=num(data.expected)||500;
    const checked=num(scan?.checked_count),verified=num(scan?.verified_count),changed=num(scan?.changed_count);
    const lastComplete=data.last_complete_scan;
    const windowStatus=scan?.status||'NOT STARTED';
    cards.innerHTML=
      readinessCard(scan?.status==='complete'?'good':'bad',
        'LAST NEWS SCAN',scan?checked+'/'+expected:'0/'+expected+' VERIFIED',
        scan?'Status '+String(windowStatus).toUpperCase()+' · '+centralStamp(scan.started_at):
          'No auditable 500-player news scan has finished')+
      readinessCard(scan?.status==='complete'?'good':'warn',
        'SOURCE-VERIFIED IN RUN',verified+'/'+expected,
        'Individual source-backed verification records; no blanket timestamp refresh')+
      readinessCard('good','MEANINGFUL CHANGES',changed,
        'Last audited run · unchanged facts do not create timeline entries')+
      readinessCard(num(data.ranked_verified_24h)===expected?'good':'warn',
        'PLAYER VERIFICATIONS · 24H',num(data.ranked_verified_24h)+'/'+expected,
        'Last verified dates, including genuine unchanged reviews')+
      readinessCard(lastComplete?'good':'bad',
        'LAST FULL 500',lastComplete?rel(lastComplete):'NEVER VERIFIED',
        lastComplete?centralStamp(lastComplete):'A complete scan requires evidence for every ranked player');
    if(note){
      const fail=scan?.status!=='complete';
      const statusText=fail
        ?'A data refresh is not a full news review. The last news scan has not demonstrated 500/500 source-verified players.'
        :'Every ranked player had an evidence-backed check in the completed news scan.';
      note.innerHTML='<span class="'+(fail?'auto-readiness-warning':'')+'">'+escv(statusText)+'</span>'+
        '<span>Checked and verified are separate from publishing a news update. Rank changes remain manual.</span>';
    }
  }

  function intelligencePlayer(x){
    const gap=num(x.market_gap);
    const line=[];
    if(num(x.targets)>0)line.push(num(x.targets)+' targets');
    if(num(x.carries)>0)line.push(num(x.carries)+' carries');
    if(x.target_share!=null&&num(x.target_share)>0)line.push(Math.round(num(x.target_share)*100)+'% target share');
    if(x.offense_snap_pct!=null&&num(x.offense_snap_pct)>0)line.push(Math.round(num(x.offense_snap_pct)*100)+'% snaps');
    const compared=gap>0?'BBB '+gap+' spots higher':gap<0?'Market '+Math.abs(gap)+' spots higher':'Near market';
    return '<article class="auto-intelligence-player">'+
      '<div class="auto-intelligence-player-rank">#'+escv(x.overall_rank)+'</div>'+
      '<div class="auto-intelligence-player-info"><strong>'+escv(x.name||x.player_key)+'</strong>'+
      '<span>'+escv(x.position||'')+' · '+escv(x.team||'FA')+' · '+escv(compared)+'</span>'+
      '<p>Week '+escv(x.week)+' · '+escv(line.join(' · '))+'</p></div>'+
      '<button class="small-btn" type="button" data-auto-player="'+escv(x.player_key)+'">RESEARCH</button>'+
      '</article>';
  }
  function renderIntelligence(){
    const rows=$('#autoIntelPlayers'),cov=$('#autoIntelCoverage'),content=$('#autoIntelContent');
    if(!rows)return;
    if(!autoIntel){
      rows.innerHTML='<div class="empty">The intelligence query is unavailable. Existing rankings and scouting data remain unchanged.</div>';
      return;
    }
    const a=arr(autoIntel.ranking_watchlist),p=autoIntel.prospects||{},c=autoIntel.content||{};
    if($('#autoIntelWeek'))$('#autoIntelWeek').textContent='2026 WEEK '+escv(autoIntel.latest_verified_week??'—')+' · FC '+escv(autoIntel.market_snapshot_date||'—');
    rows.innerHTML=a.length?a.map(intelligencePlayer).join(''):
      '<div class="empty">No strong market-gap + usage combinations met the current screening thresholds.</div>';
    const ungraded=num(p.recommended_ungraded),conflicts=num(p.class_conflicts),unsourced=num(p.unreferenced_research);
    if(cov)cov.innerHTML='<div class="auto-intelligence-label"><strong>PROSPECT COVERAGE</strong><span>SCOUTING AUDIT</span></div>'+
      '<div class="auto-intel-big">'+escv(p.grades_submitted??'—')+' <small>player grades</small></div>'+
      '<p>'+escv(p.scouting_recommendations??'—')+' researched profiles with recommendations.</p>'+
      '<div class="auto-intel-detail">'+ungraded+' researched but ungraded · '+conflicts+' class disagreements · '+unsourced+' lacking source links</div>'+
      '<button class="small-btn" type="button" data-auto-jump="prospects">OPEN PROSPECT LAB</button>';
    if(content)content.innerHTML='<div class="auto-intelligence-label"><strong>CONTENT PIPELINE</strong><span>PRODUCTION AUDIT</span></div>'+
      '<div class="auto-intel-big">'+escv(c.in_progress??'—')+' <small>in progress</small></div>'+
      '<p>'+escv(c.published??'—')+' published video records currently tracked by BBB.</p>'+
      '<div class="auto-intel-detail">Review breakout candidates and schedule the next film breakdown or Shorts.</div>'+
      '<button class="small-btn" type="button" data-auto-jump="content">OPEN CONTENT INTELLIGENCE</button>';
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
    renderSummary();renderReadiness();renderNewsCoverage();renderIntelligence();renderGuards();renderSources();renderJobs();renderRuns();renderLatestNews();bindActions();
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
        rpc('admin_get_job_run_health',{}),
        rpc('admin_get_ops_intelligence',{}),
        rpc('admin_get_news_scan_coverage',{})
      ]);
      if(results[0].status!=='fulfilled')throw results[0].reason;
      autoData=results[0].value||null;
      autoHealth=results[1].status==='fulfilled'?results[1].value:null;
      jobMetrics=results[2].status==='fulfilled'?arr(results[2].value?.jobs):[];
      autoIntel=results[3].status==='fulfilled'?results[3].value:null;
      newsCoverage=results[4].status==='fulfilled'?results[4].value:null;
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
    $$('[data-auto-player]').forEach(b=>b.onclick=()=>window.openBBBPlayerWorkspace?.(b.dataset.autoPlayer,'activity'));
    $$('[data-auto-jump]').forEach(b=>b.onclick=()=>page(b.dataset.autoJump));
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

/* News Intelligence v3: separate source-evidence lane, no automatic ranking writes. */
(function(){
  'use strict';
  const $=s=>document.querySelector(s);
  const escText=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  let evidence=null,loading=false,loaded=false,filter='all',busy=new Set(),shown=20,selectedApply=null;
  const records=()=>Array.isArray(evidence?.events)?evidence.events:[];
  const fmtTime=x=>{
    if(!x)return 'NOT YET';
    const d=new Date(x);
    return Number.isNaN(d.valueOf())?'—':d.toLocaleString('en-US',{
      timeZone:'America/Chicago',month:'short',day:'numeric',
      hour:'numeric',minute:'2-digit',timeZoneName:'short'
    });
  };
  function selection(){
    const s=($('#newsIntelV3Search')?.value||'').trim().toLowerCase();
    return records().filter(e=>{
      const status=String(e.review_status||'unreviewed');
      if(filter==='reviewed'){if(!['applied','dismissed','verified'].includes(status))return false}
      else if(filter==='needs_research'){if(status!=='needs_research')return false}
      else if(!['unreviewed','needs_research'].includes(status))return false;
      if(['Roster','Injury','News'].includes(filter)&&e.category!==filter)return false;
      return !s||(e.name+' '+e.team+' '+e.signal+' '+e.description).toLowerCase().includes(s);
    });
  }
  function render(){
    const grid=$('#newsIntelV3Grid'),kpis=$('#newsIntelV3Stats'),count=$('#newsIntelV3Count');
    if(!grid)return;
    if(!evidence){
      grid.innerHTML='<div class="bbb-news-v3-empty">The live news feed is not available. Existing player data and ranks were not changed. <button type="button" data-news-retry>Try again</button></div>';
      return;
    }
    document.querySelectorAll('[data-bbb-news-filter]').forEach(b=>{
      const on=b.dataset.bbbNewsFilter===filter;
      b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));
    });
    const run=evidence.recent_run||{},roster=Number(evidence.roster_checked||0);
    if(kpis)kpis.innerHTML=
      '<div><span>ROSTER PRESENCE</span><strong>'+roster+' / '+Number(evidence.tracked_players||500)+'</strong><small>ESPN TEAM ROSTERS IN PAST 26H · NOT COMPLETE NEWS VERIFICATION</small></div>'+
      '<div><span>FEED INGESTION</span><strong>'+escText(run.sources_ok??'—')+' / 3</strong><small>TRANSACTIONS · INJURIES · NEWS</small></div>'+
      '<div><span>NEWS TO REVIEW</span><strong>'+Number(evidence.pending_signals||0)+'</strong><small>'+Number(evidence.needs_research||0)+' REQUIRE MORE RESEARCH · '+Number(evidence.applied_updates||0)+' APPLIED</small></div>'+
      '<div><span>LAST BACKEND SCAN</span><strong style="font-size:14px">'+escText(fmtTime(run.finished_at||run.started_at))+'</strong><small>'+escText((run.status||'unknown').toUpperCase())+' · NO AUTO RANK CHANGES</small></div>';
    const matches=selection(),items=matches.slice(0,shown);
    grid.innerHTML=items.length?items.map(e=>{
      const id=Number(e.id)||0,key=escText(e.player_key),safeUrl=/^https:\/\/(www\.espn\.com|site\.api\.espn\.com)\//i.test(e.source_url||'')?e.source_url:'';
      const refs=Array.isArray(e.related_players)?e.related_players.slice(0,5):[];
      const related=refs.length?
        '<div class="bbb-news-v3-context">Same-position teammates to consider: '+refs.map(x=>escText(x.name)).join(', ')+'. This is opportunity context, not a verified role change.</div>':'';
      const suggestion=Number.isInteger(Number(e.rank_suggestion))&&e.rank_suggestion!==null
        ?Number(e.rank_suggestion):null;
      const official=/^https:\/\/[a-z0-9.-]+\/[a-z0-9/?._%&=+~#-]*$/i.test(e.rank_official_url||'')
        ?e.rank_official_url:null;
      const rankLabel=suggestion===null?'AWAITING VERIFIED RANK TARGET':
        suggestion===Number(e.overall_rank)?'HOLD · #'+suggestion:
        'BBB #'+escText(e.overall_rank)+' → #'+suggestion+
        ' ('+(suggestion<Number(e.overall_rank)?'MOVE UP ':'MOVE DOWN ')+
        Math.abs(Number(e.overall_rank)-suggestion)+' SPOTS)';
      const recommendation=e.in_rank_queue?
        '<div class="bbb-news-v3-rank"><strong>'+rankLabel+'</strong>'+
        '<small>'+escText(String(e.rank_confidence||'source-observed').toUpperCase())+
        ' CONFIDENCE · '+(official?'OFFICIAL-SOURCE SUPPORTED':'OFFICIAL CORROBORATION PENDING')+
        ' · MANUAL APPROVAL REQUIRED</small>'+
        (official?'<a href="'+escText(official)+'" target="_blank" rel="noopener noreferrer">OFFICIAL REPORT ↗</a>':'')+
        '</div>':'';
      const signal=String(e.signal||'unknown').replaceAll('_',' ');
      const busyNow=busy.has(id),state=e.review_status;
      const isTeamChange=e.category==='Roster'&&e.team&&e.current_team&&e.team!==e.current_team;
      const stateText=state==='applied'?'APPLIED TO PROFILE':state==='needs_research'?'NEEDS MORE RESEARCH':
        state==='dismissed'?'DISMISSED':state==='verified'?'OLD REVIEWED FLAG — PROFILE NOT UPDATED':null;
      const teamRow=isTeamChange?
        '<div class="bbb-news-v3-context">PROPOSED TEAM CHANGE · BBB '+escText(e.current_team)+
        ' → '+escText(e.team)+' · '+escText(e.proposed_designation||'Designation requires confirmation')+'</div>':'';
      const statusRow=stateText?'<div class="bbb-news-v3-review-state">'+escText(stateText)+
        (state==='applied'&&e.applied_at?' · '+escText(fmtTime(e.applied_at)):'')+'</div>':'';
      return '<article class="bbb-news-v3-item" data-category="'+escText(e.category)+'" data-status="'+escText(state)+'">'+
        '<div class="bbb-news-v3-item-head"><strong>'+escText(e.name)+' <span style="color:#9bbdab;font-size:11px">#'+escText(e.overall_rank)+'</span></strong>'+
        '<span class="bbb-news-v3-tag '+(e.category==='Injury'?'injury':'')+'">'+escText(signal.toUpperCase())+'</span></div>'+
        '<div class="bbb-news-v3-item-meta">'+escText(e.team||'Team TBD')+' · '+escText(e.category)+' · '+escText(fmtTime(e.published_at))+' · '+escText(e.source.replaceAll('_',' ').toUpperCase())+'</div>'+
        '<p>'+escText(e.description)+'</p>'+teamRow+related+recommendation+statusRow+
        '<div class="bbb-news-v3-actions">'+
          '<button type="button" data-news-player="'+key+'">OPEN PLAYER</button>'+
          (safeUrl?'<a target="_blank" rel="noopener noreferrer" href="'+escText(safeUrl)+'">SOURCE ↗</a>':'')+
          (['unreviewed','needs_research','verified'].includes(state)
           ?'<button type="button" class="bbb-news-v3-apply" data-news-apply="'+id+'" '+(busyNow?'disabled':'')+'>APPLY VERIFIED UPDATE</button>'+
            (state==='needs_research'?
              '<button type="button" data-news-reopen="'+id+'" '+(busyNow?'disabled':'')+'>REOPEN</button>'
              :'<button type="button" data-news-research="'+id+'" '+(busyNow?'disabled':'')+'>NEEDS MORE RESEARCH</button>')+
            '<button type="button" data-news-dismiss="'+id+'" '+(busyNow?'disabled':'')+'>DISMISS</button>'
           :state==='dismissed'?'<button type="button" data-news-reopen="'+id+'" '+(busyNow?'disabled':'')+'>REOPEN</button>':
            '<span class="bbb-news-v3-applied-label">PLAYER RECORD UPDATED</span>')+
          '<button type="button" data-news-queue="'+id+'" '+(e.in_rank_queue||busyNow?'disabled':'')+'>'+
          (e.in_rank_queue?'ALREADY IN MOVES':'QUEUE RANK REVIEW')+'</button>'+
        '</div></article>';
    }).join(''):'<div class="bbb-news-v3-empty">No matching sourced signals in the current result set. This does not mean every player is verified.</div>';
    if(count)count.textContent=items.length+' shown / '+matches.length+' matching (first '+records().length+' fetched). '+
      Number(evidence.roster_conflicts||0)+' roster-team conflicts require verification.';
    if(matches.length>shown){
      grid.insertAdjacentHTML('beforeend','<div class="bbb-news-v3-empty"><button type="button" class="small-btn" data-news-more>SHOW MORE SIGNALS</button></div>');
    }
  }
  async function load(force=false){
    if(loading)return;
    if(loaded&&!force){render();return}
    loading=true;
    const btn=$('#newsIntelV3Refresh');
    if(btn){btn.disabled=true;btn.textContent='CHECKING FEEDS…'}
    try{
      const next=await rpc('admin_get_news_intelligence_v3',{p_limit:100});
      if(!next||!Array.isArray(next.events))throw new Error('Incomplete news response');
      evidence=next;loaded=true;render();
    }catch(e){
      console.error('News Intelligence V3:',e);
      const host=$('#newsIntelV3Grid');
      if(host)host.innerHTML='<div class="bbb-news-v3-empty">Unable to read backend evidence: '+escText(e.message)+'. <button data-news-retry type="button">RETRY</button></div>';
    }finally{
      loading=false;
      if(btn){btn.disabled=false;btn.textContent='REFRESH NEWS'}
    }
  }
  async function review(id,action){
    if(busy.has(id))return;
    busy.add(id);render();
    try{
      await rpc('admin_set_news_signal_state_v3',{p_event_id:id,p_action:action});
      await load(true);
    }catch(e){alert('Could not update source signal: '+e.message)}
    finally{busy.delete(id);render()}
  }
  async function queue(id){
    const e=records().find(x=>Number(x.id)===id);
    if(!e||e.in_rank_queue||busy.has(id))return;
    busy.add(id);render();
    try{
      await rpc('admin_queue_ranking_move',{
        p_player_key:e.player_key,p_recommended_rank:null,
        p_reason:'NEWS SOURCE — confirm official team/NFL report before any rank action. '+e.description+
          '. Source: '+e.source_url+'. No target rank suggested; evaluate dynasty relevance.',
        p_priority:e.signal==='practice_squad_promotion'||e.signal==='injured_reserve'?2:3,
        p_source:'nfl_news_v3_manual_review',p_confidence:'source-observed',p_trigger_update_id:null
      });
      e.in_rank_queue=true;
      await load(true);
    }catch(err){alert('Could not queue ranking review: '+err.message)}
    finally{busy.delete(id);render()}
  }
  function bind(){
    const panel=$('#newsIntelV3');
    if(!panel||panel.dataset.newsIntelBound==='1')return;
    panel.dataset.newsIntelBound='1';
    panel.addEventListener('click',evt=>{
      const b=evt.target.closest('button');
      if(!b||!panel.contains(b))return;
      if(b.id==='newsIntelV3Refresh'||b.hasAttribute('data-news-retry')){void load(true);return}
      if(b.dataset.bbbNewsFilter){filter=b.dataset.bbbNewsFilter;shown=20;render();return}
      if(b.hasAttribute('data-news-more')){shown+=20;render();return}
      if(b.dataset.newsPlayer){window.openBBBPlayerWorkspace?.(b.dataset.newsPlayer,'activity');return}
      for(const [key,action] of [['newsResearch','needs_research'],['newsDismiss','dismiss'],['newsReopen','reopen']]){
        if(b.dataset[key]){void review(Number(b.dataset[key]),action);return}
      }
      if(b.dataset.newsApply){openApply(Number(b.dataset.newsApply));return}
      if(b.dataset.newsQueue){void queue(Number(b.dataset.newsQueue))}
    });
    $('#newsIntelV3Search')?.addEventListener('input',()=>{shown=20;render()});
  }
  const beforePage=page;
  page=function(name){
    beforePage(name);
    if(name==='automations'){
      bind();
      if(!loaded&&!loading)void load(false);
      else render();
    }
  };
  document.addEventListener('DOMContentLoaded',bind,{once:true});
  window.BBBNewsIntelligenceV3={load,render};
})();
