/* BBB Content Intelligence v2 · vidIQ Channel DNA */
(function(){
  let contentIntel=null;
  let contentLoaded=false;
  let contentLoading=false;
  let contentView='opportunities';
  let contentPreset='TOP';

  function artUrl(id,sport='nfl'){
    if(!id)return '';
    return 'https://a.espncdn.com/i/headshots/'+sport+'/players/full/'+encodeURIComponent(id)+'.png';
  }
  function playerArt(id,name){
    if(!id)return '<div class="content-art content-art-fallback"><span>'+esc((name||'?').slice(0,1))+'</span></div>';
    return '<div class="content-art"><img src="'+artUrl(id,'nfl')+'" data-content-espn="'+esc(id)+'" alt="" loading="lazy"></div>';
  }
  function hydrateArt(){
    $$('.content-art img').forEach(img=>{
      img.onerror=function(){
        if(img.dataset.fallbackDone==='1'){
          const wrap=img.closest('.content-art');
          if(wrap){wrap.classList.add('content-art-fallback');wrap.innerHTML='<span>?</span>'}
          return;
        }
        img.dataset.fallbackDone='1';
        img.src=artUrl(img.dataset.contentEspn,'college-football');
      };
    });
  }

  function ops(){return Array.isArray(contentIntel?.opportunities)?contentIntel.opportunities:[]}
  function youtube(){return contentIntel?.youtube||{}}
  function prospects(){return Array.isArray(contentIntel?.prospects)?contentIntel.prospects:[]}
  function noise(){return Array.isArray(contentIntel?.noise)?contentIntel.noise:[]}
  function queue(){return Array.isArray(contentIntel?.queue)?contentIntel.queue:[]}

  function n(v,d=1){
    const x=Number(v);return Number.isFinite(x)?x.toFixed(d):'—';
  }
  function pct(v,d=1){
    const x=Number(v);return Number.isFinite(x)?(x*100).toFixed(d)+'%':'—';
  }
  function int(v){
    const x=Number(v);return Number.isFinite(x)?Math.round(x):'—';
  }
  function scoreClass(score){
    const s=Number(score)||0;
    if(s>=90)return 'nuclear';
    if(s>=80)return 'hot';
    if(s>=70)return 'strong';
    if(s>=55)return 'watch';
    return 'low';
  }
  function scoreLabel(score){
    const s=Number(score)||0;
    if(s>=90)return 'DROP EVERYTHING';
    if(s>=80)return 'HIGH PRIORITY';
    if(s>=70)return 'STRONG OPPORTUNITY';
    if(s>=55)return 'WATCH';
    return 'LOW PRIORITY';
  }
  function formatClass(v){
    return String(v||'watch').toLowerCase().replaceAll(' / ','-').replaceAll(' ','-');
  }
  function formatToDb(v){
    const x=String(v||'').toUpperCase();
    if(x.includes('SHORT'))return 'short';
    if(x.includes('NEWS'))return 'news';
    if(x.includes('PROSPECT'))return 'prospect';
    if(x.includes('RANKING'))return 'ranking';
    return 'long_form';
  }
  function dateText(v){
    if(!v)return '—';
    const d=new Date(v);
    if(Number.isNaN(d.getTime()))return String(v);
    return d.toLocaleDateString(undefined,{month:'short',day:'numeric'});
  }
  function timeText(v){
    if(!v)return '—';
    const d=new Date(v);
    if(Number.isNaN(d.getTime()))return String(v);
    return d.toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
  }
  function compactViews(v){
    const x=Number(v);if(!Number.isFinite(x))return '—';
    if(x>=1000000)return (x/1000000).toFixed(x>=10000000?0:1)+'M';
    if(x>=1000)return (x/1000).toFixed(x>=10000?0:1)+'K';
    return Math.round(x).toLocaleString();
  }
  function breakout(v){
    const x=Number(v);return Number.isFinite(x)?x.toFixed(1)+'×':'—';
  }

  function currentWeeklyStats(x){
    if(x.position==='WR'||x.position==='TE'){
      return [
        ['TARGET SHARE',pct(x.target_share)],
        ['AIR SHARE',pct(x.air_yards_share)],
        ['SNAPS',pct(x.offense_snap_pct)],
        ['TARGETS',int(x.targets)]
      ];
    }
    if(x.position==='RB'){
      return [
        ['OPPORTUNITIES',int(x.opportunities)],
        ['SNAPS',pct(x.offense_snap_pct)],
        ['SCRIM YDS',int(x.scrimmage_yards)],
        ['TARGET SHARE',pct(x.target_share)]
      ];
    }
    if(x.position==='QB'){
      return [
        ['PASS YDS',int(x.passing_yards)],
        ['RUSH ATT',int(x.carries)],
        ['CPOE',n(x.passing_cpoe,1)],
        ['PPR',n(x.fantasy_points_ppr,1)]
      ];
    }
    return [];
  }

  function signalBars(x){
    const parts=[
      ['PERFORMANCE',Number(x.performance_points)||0,50],
      ['MARKET',Number(x.market_points)||0,20],
      ['RANK MOVE',Number(x.movement_points)||0,15],
      ['NEWS',Number(x.news_points)||0,28],
      ['YOUTUBE FIT',Number(x.youtube_points)||0,14],
      ['DYNASTY RELEVANCE',Number(x.dynasty_relevance_adjustment)||0,8]
    ];
    return parts.map(([label,val,max])=>{
      const abs=Math.abs(val),pct=Math.max(0,Math.min(100,(abs/max)*100));
      const cls=val<0?'negative':'';
      return '<div class="content-signal-bar '+cls+'"><span><b>'+esc(label)+'</b><em>'+(val>0?'+':'')+val+'</em></span><i><u style="width:'+pct+'%"></u></i></div>';
    }).join('')+
    (Number(x.youtube_penalty)>0?'<div class="content-signal-penalty"><span>YOUTUBE COVERAGE PENALTY</span><strong>-'+int(x.youtube_penalty)+'</strong></div>':'');
  }

  function filteredOps(){
    const q=($('#contentSearch')?.value||'').trim().toLowerCase();
    const pos=$('#contentPos')?.value||'ALL';
    const format=$('#contentFormat')?.value||'ALL';
    const coverage=$('#contentCoverage')?.value||'ALL';
    const youtubeState=$('#contentYoutube')?.value||'ALL';

    return ops().filter(x=>{
      if(pos!=='ALL'&&x.position!==pos)return false;
      if(format!=='ALL'&&x.recommended_format!==format)return false;
      if(coverage!=='ALL'&&x.coverage_status!==coverage)return false;
      if(youtubeState!=='ALL'&&x.youtube_coverage_status!==youtubeState)return false;
      if(contentPreset==='TOP'&&Number(x.content_score)<70)return false;
      if(contentPreset==='FILM'&&x.recommended_format!=='FILM BREAKDOWN')return false;
      if(contentPreset==='NEWS'&&x.recommended_format!=='NEWS / REACTION')return false;
      if(contentPreset==='MARKET'&&x.recommended_format!=='RANKING DEBATE')return false;
      const hay=(x.name+' '+(x.team||'')+' '+(x.position||'')+' '+(x.recommended_title||'')+' '+(x.primary_signal||'')+' '+(x.secondary_signal||'')).toLowerCase();
      return !q||hay.includes(q);
    });
  }

  function renderSummary(){
    const s=contentIntel?.summary||{};
    const map={
      contentTop:s.top_opportunities,
      contentFilm:s.film_candidates,
      contentNews:s.news_candidates,
      contentMarket:s.market_debates,
      contentProspects:s.prospect_spotlights,
      contentQueueCount:s.queue_count
    };
    Object.entries(map).forEach(([id,v])=>{const el=$('#'+id);if(el)el.textContent=v??'—'});
    const nav=$('#contentNavCount');if(nav)nav.textContent=s.top_opportunities??'—';
    if($('#contentWeek'))$('#contentWeek').textContent='WEEK '+(contentIntel?.week??'—');
  }

  function renderYoutubeDNA(){
    const y=youtube();
    if($('#contentYoutubeSync'))$('#contentYoutubeSync').textContent=timeText(y.synced_at);
    if($('#contentYTLongMedian'))$('#contentYTLongMedian').textContent=compactViews(y.long_median_views);
    if($('#contentYTShortMedian'))$('#contentYTShortMedian').textContent=compactViews(y.short_median_views);
    if($('#contentYT7Day'))$('#contentYT7Day').textContent=compactViews(y.median_views_7d);
    if($('#contentYTSynced'))$('#contentYTSynced').textContent=(y.player_matched??0)+' / '+(y.videos_synced??0);
    if($('#contentYTScheduled'))$('#contentYTScheduled').textContent=y.scheduled_count??0;

    const row=v=>'<article class="content-youtube-row">'+
      '<div class="content-youtube-thumb">'+(v.thumbnail_url?'<img src="'+esc(v.thumbnail_url)+'" alt="" loading="lazy">':'<span>▶</span>')+'</div>'+
      '<div><strong>'+esc(v.title||'Untitled video')+'</strong><span>'+compactViews(v.view_count)+' views · '+breakout(v.breakout_score)+' breakout</span></div>'+
    '</article>';
    const long=$('#contentYTTopLong');if(long)long.innerHTML=(Array.isArray(y.top_long)&&y.top_long.length)?y.top_long.slice(0,4).map(row).join(''):'<div class="empty">No long-form history synced.</div>';
    const short=$('#contentYTTopShort');if(short)short.innerHTML=(Array.isArray(y.top_short)&&y.top_short.length)?y.top_short.slice(0,4).map(row).join(''):'<div class="empty">No Shorts history synced.</div>';
    const sched=$('#contentYTScheduleList');
    if(sched)sched.innerHTML=(Array.isArray(y.scheduled)&&y.scheduled.length)?y.scheduled.slice(0,5).map(v=>
      '<article class="content-youtube-row scheduled"><div class="content-youtube-thumb">'+(v.thumbnail_url?'<img src="'+esc(v.thumbnail_url)+'" alt="" loading="lazy">':'<span>◷</span>')+'</div><div><strong>'+esc(v.title||'Scheduled upload')+'</strong><span>'+esc(String(v.video_type||'').toUpperCase())+' · '+timeText(v.scheduled_publish_at)+'</span></div></article>'
    ).join(''):'<div class="content-youtube-clear">✓ Nothing scheduled in the synced window.</div>';
  }

  function renderRightNow(){
    const el=$('#contentRightNow');if(!el)return;
    const list=ops().filter(x=>Number(x.content_score)>=60).slice(0,3);
    el.innerHTML=list.length?list.map((x,i)=>{
      const cls=scoreClass(x.content_score);
      return '<article class="content-now-card '+cls+'">'+
        '<span class="content-now-num">0'+(i+1)+'</span>'+
        '<div class="content-now-art">'+playerArt(x.espn_id,x.name)+'</div>'+
        '<div class="content-now-copy">'+
          '<div class="content-now-meta"><span>BBB #'+x.overall_rank+'</span><span>'+esc(x.position)+' · '+esc(x.team||'FA')+'</span><span>'+esc(x.coverage_status||'')+'</span></div>'+
          '<strong>'+esc(x.name)+'</strong>'+
          '<h3>'+esc(x.recommended_title||x.name)+'</h3>'+
          '<p>'+esc(x.primary_signal||'')+'</p>'+
        '</div>'+
        '<div class="content-now-score"><small>CONTENT SCORE</small><b>'+int(x.content_score)+'</b><span>'+esc(scoreLabel(x.content_score))+'</span></div>'+
        '<div class="content-now-actions"><button type="button" data-content-queue="'+esc(x.player_key)+'" data-content-mode="long_form">QUEUE VIDEO</button><button type="button" data-content-open="'+esc(x.player_key)+'">OPEN PLAYER</button></div>'+
      '</article>';
    }).join(''):'<div class="empty">No high-priority content opportunities right now.</div>';
  }

  function opportunityCard(x){
    const cls=scoreClass(x.content_score),fmt=formatClass(x.recommended_format);
    const stats=currentWeeklyStats(x).map(([l,v])=>'<div class="content-stat"><span>'+esc(l)+'</span><strong>'+esc(v)+'</strong></div>').join('');
    const covered=x.coverage_status&&x.coverage_status!=='NEVER LOGGED';
    const scheduled=x.youtube_coverage_status==='SCHEDULED';
    const ytFit=Number(x.youtube_fit_score)||0;
    return '<article class="content-card '+cls+(scheduled?' content-scheduled':'')+'">'+
      '<div class="content-card-glow"></div>'+
      '<header class="content-card-head">'+
        '<div class="content-player">'+playerArt(x.espn_id,x.name)+
          '<div><div class="content-player-meta"><span>BBB #'+x.overall_rank+'</span><span>'+esc(x.position)+' · '+esc(x.team||'FA')+'</span><span>'+(x.market_rank?'MARKET #'+x.market_rank:'MARKET UR')+'</span></div>'+
          '<button type="button" data-content-open="'+esc(x.player_key)+'">'+esc(x.name)+'</button>'+
          '<p>'+esc(x.recommended_title||'')+'</p></div>'+
        '</div>'+
        '<div class="content-score-ring '+cls+'"><span>CONTENT</span><strong>'+int(x.content_score)+'</strong><small>/100</small></div>'+
      '</header>'+
      '<div class="content-format-row"><span class="content-format '+fmt+'">'+esc(x.recommended_format||'WATCH')+'</span><span class="content-priority '+cls+'">'+esc(scoreLabel(x.content_score))+'</span><span class="content-coverage '+(covered?'covered':'fresh')+'">'+esc(x.coverage_status||'NEVER LOGGED')+'</span><span class="content-yt-fit '+(ytFit>=80?'hot':ytFit>=65?'good':'neutral')+'">CHANNEL FIT '+int(ytFit)+'</span><span class="content-yt-state '+(scheduled?'scheduled':'')+'">'+esc(x.youtube_coverage_status||'FRESH')+'</span>'+(x.last_published_at?'<span class="content-last">BBB LAST '+dateText(x.last_published_at).toUpperCase()+'</span>':'')+'</div>'+
      '<div class="content-card-grid">'+
        '<section class="content-why"><div class="content-label">WHY NOW</div><strong>'+esc(x.primary_signal||'')+'</strong><p>'+esc(x.secondary_signal||'')+'</p><div class="content-stats">'+stats+'</div></section>'+
        '<section class="content-score-build"><div class="content-label">SCORE BUILD</div>'+signalBars(x)+'</section>'+
        '<section class="content-angle"><div class="content-label">WHY THIS VIDEO?</div><h4>'+esc(x.recommended_title||'')+'</h4><p>'+esc(x.youtube_signal||'No YouTube fit signal yet.')+'</p><div class="content-why-tags"><span>FOOTBALL '+int(x.football_score)+'</span><span>YT FIT '+int(x.youtube_fit_score)+'</span><span>RELEVANCE '+(Number(x.dynasty_relevance_adjustment)>0?'+':'')+int(x.dynasty_relevance_adjustment)+'</span>'+(Number(x.youtube_penalty)>0?'<span class="penalty">COVERAGE -'+int(x.youtube_penalty)+'</span>':'')+'</div>'+(x.youtube_best_video_title?'<div class="content-history-proof"><span>BEST MATCHED CHANNEL RESULT</span><strong>'+esc(x.youtube_best_video_title)+'</strong><small>'+compactViews(x.youtube_best_video_views)+' views · '+breakout(x.youtube_best_video_breakout)+' breakout</small></div>':'')+'</section>'+
      '</div>'+
      '<footer class="content-card-foot"><div class="content-rank-movement"><span>7D RANK MOVE</span><strong class="'+(Number(x.rank_move_7d)>0?'up':Number(x.rank_move_7d)<0?'down':'')+'">'+(Number(x.rank_move_7d)>0?'▲ ':Number(x.rank_move_7d)<0?'▼ ':'')+Math.abs(Number(x.rank_move_7d)||0)+'</strong><small>MARKET EDGE '+(x.market_gap==null?'—':(Number(x.market_gap)>0?'+':'')+x.market_gap)+'</small></div><div class="content-actions"><button type="button" class="small-btn" data-content-open="'+esc(x.player_key)+'">PLAYER WORKSPACE</button>'+(scheduled?'<button type="button" class="content-action scheduled" disabled>ALREADY SCHEDULED</button>':'<button type="button" class="content-action secondary" data-content-queue="'+esc(x.player_key)+'" data-content-mode="short">QUEUE SHORT</button><button type="button" class="content-action primary" data-content-queue="'+esc(x.player_key)+'" data-content-mode="long_form">QUEUE VIDEO</button>')+'</div></footer>'+
    '</article>';
  }

  function renderOpportunities(){
    const grid=$('#contentOpportunityGrid');if(!grid)return;
    const list=filteredOps();
    if($('#contentResultCount'))$('#contentResultCount').textContent=list.length+' opportunities shown';
    grid.innerHTML=list.length?list.map(opportunityCard).join(''):'<div class="move-queue-empty"><div class="move-empty-orb">◎</div><strong>No opportunities match this view.</strong><span>Change the score preset or clear a filter.</span></div>';
  }

  function renderProspects(){
    const grid=$('#contentProspectGrid');if(!grid)return;
    const list=prospects();
    grid.innerHTML=list.length?list.map(x=>{
      const cls=scoreClass(x.content_score);
      const title=(x.name||'Prospect')+': '+x.class_year+' Dynasty Prospect Breakdown';
      return '<article class="content-prospect-card '+cls+'">'+
        '<div class="content-prospect-art">'+playerArt(x.espn_id,x.name)+'</div>'+
        '<div class="content-prospect-main"><div class="content-prospect-meta"><span>'+x.class_year+'</span><span>'+esc(x.position||'')+'</span><span>'+esc(x.college||'SCHOOL TBD')+'</span><span>'+esc(String(x.research_confidence||'').toUpperCase())+' CONFIDENCE</span></div><h3>'+esc(x.name)+'</h3><p>'+esc(x.summary||x.recommendation_notes||'Prospect research is ready for content development.')+'</p><div class="content-prospect-bottom"><span>GRADE <b>'+n(x.grade,1)+'</b></span><span>COMP <b>'+esc(x.pro_comp||'TBD')+'</b></span></div></div>'+
        '<div class="content-prospect-score"><small>CONTENT SCORE</small><strong>'+int(x.content_score)+'</strong><span>'+esc(scoreLabel(x.content_score))+'</span></div>'+
        '<div class="content-prospect-actions"><button type="button" class="content-action secondary" data-content-prospect="'+esc(x.player_key)+'" data-content-mode="short" data-content-title="'+esc(title)+'">QUEUE SHORT</button><button type="button" class="content-action primary" data-content-prospect="'+esc(x.player_key)+'" data-content-mode="prospect" data-content-title="'+esc(title)+'">QUEUE SPOTLIGHT</button><button type="button" class="small-btn" data-content-open="'+esc(x.player_key)+'">OPEN PLAYER</button></div>'+
      '</article>';
    }).join(''):'<div class="empty">No researched prospect spotlights are ready.</div>';
  }

  function renderNoise(){
    const grid=$('#contentNoiseGrid');if(!grid)return;
    const list=noise();
    grid.innerHTML=list.length?list.map(x=>{
      return '<article class="content-noise-card">'+
        '<div class="content-noise-icon">!</div>'+
        '<div class="content-noise-player">'+playerArt(x.espn_id,x.name)+'<div><small>BBB #'+x.overall_rank+' · '+esc(x.position)+' · '+esc(x.team||'FA')+'</small><strong>'+esc(x.name)+'</strong><span>'+n(x.fantasy_points_ppr,1)+' PPR</span></div></div>'+
        '<div class="content-noise-copy"><span>BOX SCORE &gt; ROLE</span><p>'+esc(x.noise_reason||'The production may be running ahead of the underlying role.')+'</p></div>'+
        '<div class="content-noise-score"><small>NOISE RISK</small><strong>'+int(x.noise_score)+'</strong></div>'+
        '<div class="content-noise-actions"><button type="button" class="small-btn" data-content-open="'+esc(x.player_key)+'">OPEN PLAYER</button><button type="button" class="content-action secondary" data-content-noise="'+esc(x.player_key)+'">OVERRIDE + QUEUE SHORT</button></div>'+
      '</article>';
    }).join(''):'<div class="move-queue-empty"><div class="move-empty-orb">✓</div><strong>No obvious box-score traps this week.</strong><span>The strongest production is mostly supported by role and usage.</span></div>';
  }

  function queueItemCard(x){
    const status=String(x.status||'planned').toLowerCase();
    return '<article class="content-queue-card '+status+'">'+
      '<div class="content-queue-art">'+playerArt(x.espn_id,x.name)+'</div>'+
      '<div class="content-queue-main"><div class="content-queue-meta"><span>'+esc(String(x.format||'').replaceAll('_',' ').toUpperCase())+'</span><span>'+esc(String(x.status||'').replaceAll('_',' ').toUpperCase())+'</span><span>ADDED '+dateText(x.created_at).toUpperCase()+'</span>'+(x.source_score!=null?'<span>SCORE '+x.source_score+'</span>':'')+'</div><h3>'+esc(x.title||'Untitled content')+'</h3><p>'+esc(x.angle||'No angle note yet.')+'</p><small>'+esc(x.name||'General BBB content')+'</small></div>'+
      '<div class="content-queue-actions">'+(status!=='in_progress'?'<button type="button" class="content-action secondary" data-content-start="'+x.id+'">START</button>':'<span class="content-working">IN PROGRESS</span>')+'<button type="button" class="content-action primary" data-content-publish="'+x.id+'">PUBLISHED</button><button type="button" class="small-btn" data-content-skip="'+x.id+'">SKIP</button></div>'+
    '</article>';
  }

  function renderQueue(){
    const grid=$('#contentQueueGrid');if(!grid)return;
    const list=queue();
    grid.innerHTML=list.length?list.map(queueItemCard).join(''):'<div class="move-queue-empty"><div class="move-empty-orb">◇</div><strong>Content queue is empty.</strong><span>Queue a video or short from an opportunity card and it will appear here.</span></div>';
  }

  function renderView(){
    $$('.content-view').forEach(el=>el.classList.add('hide'));
    const id=contentView==='opportunities'?'contentViewOpportunities':contentView==='prospects'?'contentViewProspects':contentView==='noise'?'contentViewNoise':'contentViewQueue';
    $('#'+id)?.classList.remove('hide');
    $$('[data-content-view]').forEach(b=>b.classList.toggle('active',b.dataset.contentView===contentView));
    if(contentView==='opportunities')renderOpportunities();
    if(contentView==='prospects')renderProspects();
    if(contentView==='noise')renderNoise();
    if(contentView==='queue')renderQueue();
  }

  function syncPreset(){
    $$('[data-content-preset]').forEach(el=>el.classList.toggle('active',el.dataset.contentPreset===contentPreset&&contentView==='opportunities'));
  }

  function render(){
    if(!contentLoaded||!contentIntel)return;
    renderSummary();
    renderYoutubeDNA();
    renderRightNow();
    renderView();
    syncPreset();
    bindActions();
    hydrateArt();
  }

  async function load(force=false){
    if(contentLoading)return;
    if(contentLoaded&&!force){render();return}
    contentLoading=true;
    const state=$('#contentLoadState');
    if(state){state.textContent='ANALYZING…';state.classList.add('content-pulsing')}
    try{
      contentIntel=await rpc('admin_get_content_intelligence',{p_limit:120})||null;
      contentLoaded=true;
      render();
    }catch(e){
      console.error('BBB Content Intelligence failed',e);
      const grid=$('#contentOpportunityGrid');
      if(grid)grid.innerHTML='<div class="scanner-error"><span>!</span><strong>Content Intelligence failed to load.</strong><small>'+esc(e.message||'Unknown error')+'</small><button id="contentRetry" class="small-btn">TRY AGAIN</button></div>';
      $('#contentRetry')?.addEventListener('click',()=>load(true));
    }finally{
      contentLoading=false;
      if(state){state.textContent='LIVE SIGNALS';state.classList.remove('content-pulsing')}
    }
  }

  function findOpportunity(key){return ops().find(x=>x.player_key===key)}
  function findProspect(key){return prospects().find(x=>x.player_key===key)}

  async function addToQueue(key,mode,btn,source='pro'){
    const x=source==='prospect'?findProspect(key):findOpportunity(key);
    if(!x)return;
    const isProspect=source==='prospect';
    const dbFormat=mode==='prospect'?'prospect':mode;
    const title=isProspect
      ? (x.name+': '+x.class_year+' Dynasty Prospect Breakdown')
      : (x.recommended_title||x.name);
    const angle=isProspect
      ? [x.summary,x.pro_comp?'Pro comp: '+x.pro_comp:null].filter(Boolean).join(' · ')
      : [x.primary_signal,x.secondary_signal].filter(Boolean).join(' · ');
    const old=btn?.textContent;
    if(btn){btn.disabled=true;btn.textContent='QUEUING…'}
    try{
      await rpc('admin_add_content_item',{
        p_player_key:key,
        p_format:dbFormat,
        p_title:title,
        p_angle:angle,
        p_source_kind:isProspect?'prospect_intelligence':'content_intelligence',
        p_source_score:Number(x.content_score)||null,
        p_status:'planned',
        p_video_url:null,
        p_notes:null,
        p_published_at:null
      });
      await load(true);
      contentView='queue';renderView();syncPreset();
    }catch(e){
      alert(e.message);
      if(btn){btn.disabled=false;btn.textContent=old}
    }
  }

  async function updateQueueItem(id,status,btn){
    const item=queue().find(x=>Number(x.id)===Number(id));if(!item)return;
    let url=null;
    if(status==='published'){
      url=prompt('YouTube URL (optional):',item.video_url||'');
      if(url===null)return;
    }
    if(status==='skipped'&&!confirm('Skip this content idea?'))return;
    const old=btn?.textContent;
    if(btn){btn.disabled=true;btn.textContent='SAVING…'}
    try{
      await rpc('admin_update_content_item',{
        p_id:Number(id),p_status:status,p_title:null,p_angle:null,
        p_video_url:url,p_notes:null
      });
      await load(true);
      contentView='queue';renderView();
    }catch(e){
      alert(e.message);
      if(btn){btn.disabled=false;btn.textContent=old}
    }
  }

  async function overrideNoise(key,btn){
    const x=noise().find(v=>v.player_key===key);if(!x)return;
    const title=x.name+': The Box Score vs. The Role';
    const old=btn.textContent;btn.disabled=true;btn.textContent='QUEUING…';
    try{
      await rpc('admin_add_content_item',{
        p_player_key:key,p_format:'short',p_title:title,
        p_angle:'Contrarian short: '+(x.noise_reason||'Production may be ahead of role.'),
        p_source_kind:'box_score_noise_override',p_source_score:Number(x.noise_score)||null,
        p_status:'planned',p_video_url:null,p_notes:null,p_published_at:null
      });
      await load(true);contentView='queue';renderView();
    }catch(e){alert(e.message);btn.disabled=false;btn.textContent=old}
  }

  function bindActions(){
    $$('[data-content-open]').forEach(b=>b.onclick=()=>window.openBBBPlayerWorkspace?.(b.dataset.contentOpen,'stats'));
    $$('[data-content-queue]').forEach(b=>b.onclick=()=>addToQueue(b.dataset.contentQueue,b.dataset.contentMode||'long_form',b,'pro'));
    $$('[data-content-prospect]').forEach(b=>b.onclick=()=>addToQueue(b.dataset.contentProspect,b.dataset.contentMode||'prospect',b,'prospect'));
    $$('[data-content-noise]').forEach(b=>b.onclick=()=>overrideNoise(b.dataset.contentNoise,b));
    $$('[data-content-start]').forEach(b=>b.onclick=()=>updateQueueItem(b.dataset.contentStart,'in_progress',b));
    $$('[data-content-publish]').forEach(b=>b.onclick=()=>updateQueueItem(b.dataset.contentPublish,'published',b));
    $$('[data-content-skip]').forEach(b=>b.onclick=()=>updateQueueItem(b.dataset.contentSkip,'skipped',b));
  }

  function bindControls(){
    ['#contentSearch','#contentPos','#contentFormat','#contentCoverage','#contentYoutube'].forEach(sel=>{
      const el=$(sel);if(!el||el.dataset.contentBound==='1')return;
      el.dataset.contentBound='1';
      el.addEventListener(sel==='#contentSearch'?'input':'change',()=>{contentPreset='ALL';syncPreset();renderOpportunities();bindActions();hydrateArt()});
    });
    $('#contentClear')?.addEventListener('click',()=>{
      $('#contentSearch').value='';$('#contentPos').value='ALL';$('#contentFormat').value='ALL';$('#contentCoverage').value='ALL';if($('#contentYoutube'))$('#contentYoutube').value='ALL';contentPreset='TOP';contentView='opportunities';render();
    });
    $('#contentRefresh')?.addEventListener('click',()=>load(true));
    $$('[data-content-preset]').forEach(el=>{
      el.onclick=()=>{
        const p=el.dataset.contentPreset;
        if(p==='PROSPECTS'){contentView='prospects';contentPreset='ALL'}
        else if(p==='QUEUE'){contentView='queue';contentPreset='ALL'}
        else{contentView='opportunities';contentPreset=p}
        render();
      };
    });
    $$('[data-content-view]').forEach(el=>el.onclick=()=>{contentView=el.dataset.contentView;renderView();bindActions();hydrateArt()});
  }

  const originalPage=page;
  page=function(name){
    originalPage(name);
    if(name==='content'){
      if($('#missionPageTitle'))$('#missionPageTitle').textContent='Content Intelligence';
      bindControls();
      if(!contentLoaded&&!contentLoading)void load(false); else render();
    }
  };

  try{
    if(typeof ADMIN_COMMANDS!=='undefined'&&!ADMIN_COMMANDS.some(x=>x.id==='content')){
      ADMIN_COMMANDS.splice(4,0,{id:'content',icon:'▶',label:'Content Intelligence',sub:'What should Bobby make next?',tag:'PAGE'});
    }
  }catch(_){}

  document.addEventListener('DOMContentLoaded',bindControls,{once:true});
  window.BBBContentIntelligence={load,render};
})();