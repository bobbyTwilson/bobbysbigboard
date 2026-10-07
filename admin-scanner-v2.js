/* BBB Weekly Performance Scanner v2
   UI polish + event binding fix + ESPN player art.
*/
(function(){
  const originalRankingMoveRender = typeof renderRankingMoveQueue === 'function' ? renderRankingMoveQueue : null;

  function bindRankingMoveActionsSafe(){
    $$('[data-move-open]').forEach(b=>b.onclick=()=>window.openBBBPlayerWorkspace?.(b.dataset.moveOpen,'dynasty'));
    $$('[data-move-approve]').forEach(b=>b.onclick=()=>resolveRankingMove(Number(b.dataset.moveApprove),'approve',b));
    $$('[data-move-reject]').forEach(b=>b.onclick=()=>resolveRankingMove(Number(b.dataset.moveReject),'reject',b));
    $$('[data-move-keep]').forEach(b=>b.onclick=()=>{
      const id=Number(b.dataset.moveKeep),input=$('[data-move-target="'+id+'"]');
      if(input)input.value=b.dataset.currentRank;
      resolveRankingMove(id,'approve',b,Number(b.dataset.currentRank));
    });
  }

  if(originalRankingMoveRender){
    renderRankingMoveQueue=function(){
      try{
        return originalRankingMoveRender();
      }catch(err){
        if(String(err?.message||err).includes('forEach is not a function')){
          bindRankingMoveActionsSafe();
          return;
        }
        throw err;
      }
    };
  }

  function scannerArtUrl(id,sport='nfl'){
    if(!id)return '';
    return 'https://a.espncdn.com/i/headshots/'+sport+'/players/full/'+encodeURIComponent(id)+'.png';
  }

  function scannerArt(id,name){
    if(!id)return '<div class="scanner-art scanner-art-fallback"><span>'+esc((name||'?').slice(0,1))+'</span></div>';
    return '<div class="scanner-art"><img src="'+scannerArtUrl(id,'nfl')+'" data-espn-id="'+esc(id)+'" alt="" loading="lazy"></div>';
  }

  function hydrateScannerArt(){
    $$('.scanner-art img').forEach(img=>{
      img.onerror=function(){
        if(img.dataset.fallbackDone==='1'){
          img.closest('.scanner-art')?.classList.add('scanner-art-fallback');
          img.remove();
          return;
        }
        img.dataset.fallbackDone='1';
        img.src=scannerArtUrl(img.dataset.espnId,'college-football');
      };
    });
  }

  function scannerSignalStrength(x){
    const score=Math.abs(Number(x.signal_score)||0);
    return Math.max(8,Math.min(100,score*10));
  }

  function scannerTrendText(x){
    const parts=[];
    if(Number.isFinite(Number(x.target_share_delta))&&Math.abs(Number(x.target_share_delta))>=.01)parts.push(scannerDelta(x.target_share_delta,'pct')+' tgt share');
    if(Number.isFinite(Number(x.snap_pct_delta))&&Math.abs(Number(x.snap_pct_delta))>=.01)parts.push(scannerDelta(x.snap_pct_delta,'pct')+' snaps');
    if(Number.isFinite(Number(x.opportunity_delta))&&Math.abs(Number(x.opportunity_delta))>=1)parts.push(scannerDelta(x.opportunity_delta,'int')+' opp');
    if(Number.isFinite(Number(x.ppr_delta))&&Math.abs(Number(x.ppr_delta))>=1)parts.push(scannerDelta(x.ppr_delta)+' PPR');
    return parts.slice(0,3).join(' · ')||'No major prior-week delta';
  }

  loadWeeklyScanner=async function(force=false,week=null){
    if(scannerLoading)return;
    if(scannerLoaded&&!force&&weeklyScanner){renderWeeklyScanner();return}
    scannerLoading=true;
    if($('#scannerLoadState')){
      $('#scannerLoadState').textContent='SCANNING…';
      $('#scannerLoadState').classList.add('scanner-pulsing');
    }
    try{
      const [scan,media]=await Promise.all([
        rpc('admin_get_weekly_performance_scanner',{p_season:null,p_week:week==null?null:Number(week),p_limit:500}),
        rpc('admin_get_weekly_scanner_media',{})
      ]);
      weeklyScanner=scan||null;
      const map=media||{};
      if(Array.isArray(weeklyScanner?.players)){
        weeklyScanner.players=weeklyScanner.players.map(x=>({...x,espn_id:map[x.player_key]||null}));
      }
      scannerLoaded=true;
      populateScannerWeeks();
      renderWeeklyScanner();
    }catch(e){
      console.error('BBB Weekly Performance Scanner failed',e);
      const grid=$('#scannerGrid');
      if(grid)grid.innerHTML='<div class="scanner-error"><span>!</span><strong>Scanner data failed to load.</strong><small>'+esc(e.message||'Unknown scanner error')+'</small><button id="scannerRetryV2" class="small-btn" type="button">TRY AGAIN</button></div>';
      $('#scannerRetryV2')?.addEventListener('click',()=>{scannerLoaded=false;void loadWeeklyScanner(true,Number($('#scannerWeek')?.value)||null)});
    }finally{
      scannerLoading=false;
      if($('#scannerLoadState')){
        $('#scannerLoadState').textContent='LIVE DATA';
        $('#scannerLoadState').classList.remove('scanner-pulsing');
      }
    }
  };

  scannerPositionStats=function(x){
    if(x.position==='QB'){
      return [
        scannerStat('PASS',''+scannerInt(x.completions)+' / '+scannerInt(x.attempts),scannerInt(x.passing_yards)+' yds · '+scannerInt(x.passing_tds)+' TD'),
        scannerStat('SNAP SHARE',scannerPct(x.offense_snap_pct),'offensive snaps'),
        scannerStat('RUSH',scannerInt(x.carries)+' att',scannerInt(x.rushing_yards)+' yds'),
        scannerStat('PASS AIR YDS',scannerInt(x.passing_air_yards),'downfield volume'),
        scannerStat('CPOE',scannerNum(x.passing_cpoe,1),'> 0 = above expectation',Number(x.passing_cpoe)>0?'good':Number(x.passing_cpoe)<0?'bad':''),
        scannerStat('PASS EPA',scannerNum(x.passing_epa,1),'weekly efficiency',Number(x.passing_epa)>0?'good':Number(x.passing_epa)<0?'bad':''),
        scannerStat('PACR',scannerNum(x.pacr,2),'air-yards conversion'),
        scannerStat('PPR',scannerNum(x.fantasy_points_ppr,1),'Δ '+scannerDelta(x.ppr_delta),Number(x.ppr_delta)>0?'good':Number(x.ppr_delta)<0?'bad':'')
      ].join('');
    }
    if(x.position==='RB'){
      return [
        scannerStat('OPPORTUNITIES',scannerInt(x.opportunities),'Δ '+scannerDelta(x.opportunity_delta,'int'),Number(x.opportunity_delta)>0?'good':Number(x.opportunity_delta)<0?'bad':''),
        scannerStat('SNAP SHARE',scannerPct(x.offense_snap_pct),'Δ '+scannerDelta(x.snap_pct_delta,'pct'),Number(x.snap_pct_delta)>0?'good':Number(x.snap_pct_delta)<0?'bad':''),
        scannerStat('TEAM OPP SHARE',scannerPct(x.opportunity_share),'rush attempts + targets'),
        scannerStat('TOUCHES',scannerInt(x.touches),scannerInt(x.scrimmage_yards)+' scrim yds'),
        scannerStat('TARGET SHARE',scannerPct(x.target_share),'Δ '+scannerDelta(x.target_share_delta,'pct'),Number(x.target_share_delta)>0?'good':Number(x.target_share_delta)<0?'bad':''),
        scannerStat('YPC',scannerNum(x.yards_per_carry,2),scannerInt(x.carries)+' carries'),
        scannerStat('RUSH EPA',scannerNum(x.rushing_epa,1),'weekly efficiency',Number(x.rushing_epa)>0?'good':Number(x.rushing_epa)<0?'bad':''),
        scannerStat('REC EPA',scannerNum(x.receiving_epa,1),scannerInt(x.targets)+' targets',Number(x.receiving_epa)>0?'good':Number(x.receiving_epa)<0?'bad':'')
      ].join('');
    }
    return [
      scannerStat('TARGET SHARE',scannerPct(x.target_share),'Δ '+scannerDelta(x.target_share_delta,'pct'),Number(x.target_share_delta)>0?'good':Number(x.target_share_delta)<0?'bad':''),
      scannerStat('SNAP SHARE',scannerPct(x.offense_snap_pct),'Δ '+scannerDelta(x.snap_pct_delta,'pct'),Number(x.snap_pct_delta)>0?'good':Number(x.snap_pct_delta)<0?'bad':''),
      scannerStat('AIR YARDS SHARE',scannerPct(x.air_yards_share),'Δ '+scannerDelta(x.air_yards_share_delta,'pct'),Number(x.air_yards_share_delta)>0?'good':Number(x.air_yards_share_delta)<0?'bad':''),
      scannerStat('aDOT',scannerNum(x.adot,1),scannerInt(x.receiving_air_yards)+' air yds'),
      scannerStat('WOPR',scannerNum(x.wopr,2),'weighted opportunity'),
      scannerStat('RACR',scannerNum(x.racr,2),'air-yards conversion'),
      scannerStat('YAC / REC',scannerNum(x.yac_per_reception,1),scannerInt(x.receiving_yards_after_catch)+' total YAC'),
      scannerStat('REC EPA',scannerNum(x.receiving_epa,1),scannerInt(x.receiving_first_downs)+' first downs',Number(x.receiving_epa)>0?'good':Number(x.receiving_epa)<0?'bad':'')
    ].join('');
  };

  function scannerSpotlightHtml(rows){
    const stars=rows
      .filter(x=>['BREAKOUT','RISING'].includes(x.signal))
      .sort((a,b)=>(Math.abs(Number(b.signal_score)||0)-Math.abs(Number(a.signal_score)||0))||Number(a.overall_rank)-Number(b.overall_rank))
      .slice(0,3);
    if(!stars.length)return '';
    return '<section id="scannerSpotlight" class="scanner-spotlight">'+
      '<div class="scanner-spotlight-head"><div><span>WEEK '+esc(weeklyScanner.week)+' HOT BOARD</span><strong>Highest-signal dynasty performances</strong></div><small>Usage-weighted, not box-score chasing</small></div>'+
      '<div class="scanner-spotlight-grid">'+stars.map((x,i)=>{
        const sig=scannerSignalClass(x.signal),strength=scannerSignalStrength(x);
        return '<button type="button" class="scanner-spotlight-card '+sig+'" data-scanner-open="'+esc(x.player_key)+'" style="--signal:'+strength+'%">'+
          '<span class="spotlight-number">0'+(i+1)+'</span>'+
          scannerArt(x.espn_id,x.name)+
          '<span class="spotlight-copy"><small>#'+x.overall_rank+' · '+esc(x.position)+' · '+esc(x.team||'FA')+'</small><strong>'+esc(x.name)+'</strong><em>'+esc(x.signal_reason||scannerBoxScore(x))+'</em></span>'+
          '<span class="spotlight-meter"><i></i></span>'+
          '<span class="spotlight-tag">'+esc(x.signal)+'</span>'+
        '</button>';
      }).join('')+'</div>'+
    '</section>';
  }

  renderWeeklyScanner=function(){
    const grid=$('#scannerGrid');if(!grid)return;
    if(!scannerLoaded||!weeklyScanner){
      if(!scannerLoading)void loadWeeklyScanner(false);
      return;
    }

    const rows=scannerRows(),list=filteredScanner();
    const breakout=rows.filter(x=>x.signal==='BREAKOUT').length;
    const rising=rows.filter(x=>x.signal==='RISING').length;
    const falling=rows.filter(x=>x.signal==='FALLING'||x.signal==='CONCERN').length;
    const usage=rows.filter(x=>Math.abs(Number(x.target_share_delta)||0)>=.08||Math.abs(Number(x.opportunity_delta)||0)>=5||Math.abs(Number(x.snap_pct_delta)||0)>=.15).length;

    if($('#scannerBreakout'))$('#scannerBreakout').textContent=breakout;
    if($('#scannerRising'))$('#scannerRising').textContent=rising;
    if($('#scannerConcern'))$('#scannerConcern').textContent=falling;
    if($('#scannerUsage'))$('#scannerUsage').textContent=usage;
    if($('#scannerCount'))$('#scannerCount').textContent=list.length+' players shown';
    if($('#scannerRouteNote'))$('#scannerRouteNote').textContent=weeklyScanner.route_metrics_note||'Live snap share is included; route metrics require a separate source.';
    if($('#scannerSeasonWeek'))$('#scannerSeasonWeek').textContent=weeklyScanner.season+' · WEEK '+weeklyScanner.week;
    if($('#scannerNavCount'))$('#scannerNavCount').textContent='W'+weeklyScanner.week;

    const panel=$('.scanner-panel');
    let spotlight=$('#scannerSpotlight');
    if(spotlight)spotlight.remove();
    panel?.insertAdjacentHTML('beforebegin',scannerSpotlightHtml(rows));

    grid.innerHTML=list.length?list.map(x=>{
      const sig=scannerSignalClass(x.signal),queued=scannerQueued(x),strength=scannerSignalStrength(x);
      const market=x.fp_sf_rank?'MARKET #'+x.fp_sf_rank:'MARKET UR';
      const edge=x.bbb_vs_fp==null?'EDGE —':'EDGE '+(Number(x.bbb_vs_fp)>0?'+':'')+x.bbb_vs_fp;
      return '<article class="scanner-card scanner-card-v2 '+sig+'" style="--signal:'+strength+'%">'+
        '<div class="scanner-card-glow"></div>'+
        '<div class="scanner-card-main-v2">'+
          '<div class="scanner-player-visual">'+scannerArt(x.espn_id,x.name)+'<span class="scanner-rank-chip">BBB #'+x.overall_rank+'</span></div>'+
          '<div class="scanner-player-core">'+
            '<div class="scanner-player-topline"><span>'+esc(x.position)+' · '+esc(x.team||'FA')+' vs '+esc(x.opponent_team||'—')+'</span><span>'+market+' · '+edge+'</span></div>'+
            '<button type="button" class="scanner-name-v2" data-scanner-open="'+esc(x.player_key)+'">'+esc(x.name)+'</button>'+
            '<div class="scanner-boxscore-v2">'+esc(scannerBoxScore(x))+'</div>'+
            '<div class="scanner-signal-meter"><span><i></i></span><small>SIGNAL '+Math.abs(Number(x.signal_score)||0)+'/10</small></div>'+
          '</div>'+
          '<div class="scanner-signal-panel '+sig+'"><span>'+esc(x.signal)+'</span><strong>'+esc(scannerTrendText(x))+'</strong><small>'+esc(x.signal_reason||'No major usage change detected.')+'</small></div>'+
        '</div>'+
        '<div class="scanner-stats scanner-stats-v2">'+scannerPositionStats(x)+'</div>'+
        '<div class="scanner-card-foot scanner-card-foot-v2">'+
          '<div class="scanner-market"><span>'+market+'</span><span class="'+(Number(x.bbb_vs_fp)>0?'good':Number(x.bbb_vs_fp)<0?'bad':'')+'">'+edge+'</span><span class="'+(healthy(x.injury_status)?'':'bad')+'">'+esc(x.injury_status||'Healthy')+'</span><span>PRIOR '+(x.prior_week?'W'+x.prior_week:'—')+'</span></div>'+
          '<div class="scanner-actions"><button type="button" class="small-btn scanner-open-btn" data-scanner-open="'+esc(x.player_key)+'">PLAYER WORKSPACE</button><button type="button" class="queue-action scanner-queue-btn '+(queued?'verified-state':'')+'" data-scanner-queue="'+esc(x.player_key)+'" '+(queued?'disabled':'')+'>'+(queued?'IN RANKING QUEUE ✓':'QUEUE RANK REVIEW')+'</button></div>'+
        '</div>'+
      '</article>';
    }).join(''):'<div class="move-queue-empty"><div class="move-empty-orb">◎</div><strong>No players match this scanner view.</strong><span>Try All Players, another position, or clear the signal filter.</span></div>';

    $$('[data-scanner-open]').forEach(b=>b.onclick=()=>window.openBBBPlayerWorkspace?.(b.dataset.scannerOpen,'stats'));
    $$('[data-scanner-queue]').forEach(b=>b.onclick=()=>queueScannerReview(b.dataset.scannerQueue,b));
    hydrateScannerArt();
  };
})();