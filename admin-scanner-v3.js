/* BBB Weekly Performance Scanner v3
   Readability pass: directional deltas + clickable KPI filters.
*/
(function(){
  let scannerKpiPreset='';

  function deltaParts(v,kind='pct'){
    const n=Number(v);
    if(!Number.isFinite(n)||Math.abs(n)<0.0001)return {text:'—',cls:'delta-flat'};
    const down=n<0;
    let amount;
    if(kind==='pct')amount=(Math.abs(n)*100).toFixed(1)+'%';
    else if(kind==='int')amount=Math.abs(n).toFixed(0);
    else amount=Math.abs(n).toFixed(1);
    return {text:(down?'▼ ':'▲ ')+amount,cls:down?'delta-down':'delta-up'};
  }

  function deltaHtml(v,kind='pct',suffix=''){
    const d=deltaParts(v,kind);
    return '<small class="scanner-delta '+d.cls+'">'+d.text+(suffix?' '+esc(suffix):'')+'</small>';
  }

  function currentValueClass(value,{good=null,bad=null}={}){
    const n=Number(value);
    if(!Number.isFinite(n))return '';
    if(good!=null&&n>=good)return 'value-strong';
    if(bad!=null&&n<=bad)return 'value-weak';
    return '';
  }

  function metricWithDelta(label,value,currentRaw,delta,deltaKind='pct',thresholds={}){
    const cls=currentValueClass(currentRaw,thresholds);
    return '<div class="scanner-stat '+cls+'"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong>'+deltaHtml(delta,deltaKind)+'</div>';
  }

  function normalMetric(label,value,sub='',cls=''){
    return '<div class="scanner-stat '+cls+'"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong>'+(sub?'<small>'+esc(sub)+'</small>':'')+'</div>';
  }

  function trendToken(v,kind,label){
    const d=deltaParts(v,kind);
    if(d.text==='—')return '';
    return d.text+' '+label;
  }

  scannerTrendText=function(x){
    const parts=[];
    if(Math.abs(Number(x.target_share_delta)||0)>=.01)parts.push(trendToken(x.target_share_delta,'pct','target share'));
    if(Math.abs(Number(x.snap_pct_delta)||0)>=.01)parts.push(trendToken(x.snap_pct_delta,'pct','snaps'));
    if(Math.abs(Number(x.opportunity_delta)||0)>=1)parts.push(trendToken(x.opportunity_delta,'int','opportunities'));
    if(Math.abs(Number(x.ppr_delta)||0)>=1)parts.push(trendToken(x.ppr_delta,'num','PPR'));
    return parts.filter(Boolean).slice(0,3).join(' · ')||'No major prior-week change';
  };

  scannerPositionStats=function(x){
    if(x.position==='QB'){
      return [
        normalMetric('PASS',scannerInt(x.completions)+' / '+scannerInt(x.attempts),scannerInt(x.passing_yards)+' yds · '+scannerInt(x.passing_tds)+' TD'),
        metricWithDelta('SNAP SHARE',scannerPct(x.offense_snap_pct),x.offense_snap_pct,x.snap_pct_delta,'pct',{good:.90,bad:.65}),
        normalMetric('RUSH',scannerInt(x.carries)+' att',scannerInt(x.rushing_yards)+' yds'),
        normalMetric('PASS AIR YDS',scannerInt(x.passing_air_yards),'downfield volume'),
        normalMetric('CPOE',scannerNum(x.passing_cpoe,1),'> 0 = above expectation',Number(x.passing_cpoe)>0?'good':Number(x.passing_cpoe)<0?'bad':''),
        normalMetric('PASS EPA',scannerNum(x.passing_epa,1),'weekly efficiency',Number(x.passing_epa)>0?'good':Number(x.passing_epa)<0?'bad':''),
        normalMetric('PACR',scannerNum(x.pacr,2),'air-yards conversion'),
        metricWithDelta('PPR',scannerNum(x.fantasy_points_ppr,1),x.fantasy_points_ppr,x.ppr_delta,'num',{})
      ].join('');
    }

    if(x.position==='RB'){
      return [
        metricWithDelta('OPPORTUNITIES',scannerInt(x.opportunities),x.opportunities,x.opportunity_delta,'int',{good:18,bad:8}),
        metricWithDelta('SNAP SHARE',scannerPct(x.offense_snap_pct),x.offense_snap_pct,x.snap_pct_delta,'pct',{good:.60,bad:.35}),
        normalMetric('TEAM OPP SHARE',scannerPct(x.opportunity_share),'rush attempts + targets',currentValueClass(x.opportunity_share,{good:.40,bad:.20})),
        normalMetric('TOUCHES',scannerInt(x.touches),scannerInt(x.scrimmage_yards)+' scrim yds'),
        metricWithDelta('TARGET SHARE',scannerPct(x.target_share),x.target_share,x.target_share_delta,'pct',{good:.12,bad:.05}),
        normalMetric('YPC',scannerNum(x.yards_per_carry,2),scannerInt(x.carries)+' carries'),
        normalMetric('RUSH EPA',scannerNum(x.rushing_epa,1),'weekly efficiency',Number(x.rushing_epa)>0?'good':Number(x.rushing_epa)<0?'bad':''),
        normalMetric('REC EPA',scannerNum(x.receiving_epa,1),scannerInt(x.targets)+' targets',Number(x.receiving_epa)>0?'good':Number(x.receiving_epa)<0?'bad':'')
      ].join('');
    }

    return [
      metricWithDelta('TARGET SHARE',scannerPct(x.target_share),x.target_share,x.target_share_delta,'pct',{good:.20,bad:.10}),
      metricWithDelta('SNAP SHARE',scannerPct(x.offense_snap_pct),x.offense_snap_pct,x.snap_pct_delta,'pct',{good:.70,bad:.45}),
      metricWithDelta('AIR YARDS SHARE',scannerPct(x.air_yards_share),x.air_yards_share,x.air_yards_share_delta,'pct',{good:.25,bad:.10}),
      normalMetric('aDOT',scannerNum(x.adot,1),scannerInt(x.receiving_air_yards)+' air yds'),
      normalMetric('WOPR',scannerNum(x.wopr,2),'weighted opportunity',currentValueClass(x.wopr,{good:.60,bad:.25})),
      normalMetric('RACR',scannerNum(x.racr,2),'air-yards conversion'),
      normalMetric('YAC / REC',scannerNum(x.yac_per_reception,1),scannerInt(x.receiving_yards_after_catch)+' total YAC'),
      normalMetric('REC EPA',scannerNum(x.receiving_epa,1),scannerInt(x.receiving_first_downs)+' first downs',Number(x.receiving_epa)>0?'good':Number(x.receiving_epa)<0?'bad':'')
    ].join('');
  };

  const baseFilteredScanner=filteredScanner;
  filteredScanner=function(){
    const base=baseFilteredScanner();
    if(scannerKpiPreset==='BREAKOUT')return base.filter(x=>x.signal==='BREAKOUT');
    if(scannerKpiPreset==='RISING')return base.filter(x=>x.signal==='RISING');
    if(scannerKpiPreset==='CONCERNS')return base.filter(x=>x.signal==='FALLING'||x.signal==='CONCERN');
    if(scannerKpiPreset==='USAGE')return base.filter(x=>
      Math.abs(Number(x.target_share_delta)||0)>=.08||
      Math.abs(Number(x.opportunity_delta)||0)>=5||
      Math.abs(Number(x.snap_pct_delta)||0)>=.15
    );
    return base;
  };

  function syncKpiActiveState(){
    const map={
      scannerBreakout:'BREAKOUT',
      scannerRising:'RISING',
      scannerConcern:'CONCERNS',
      scannerUsage:'USAGE'
    };
    Object.entries(map).forEach(([id,preset])=>{
      const card=$('#'+id)?.closest('.metric');
      if(!card)return;
      card.classList.add('scanner-kpi-btn');
      card.setAttribute('role','button');
      card.setAttribute('tabindex','0');
      card.classList.toggle('active',scannerKpiPreset===preset);
      card.dataset.scannerPreset=preset;
    });
  }

  function activatePreset(preset){
    scannerKpiPreset=scannerKpiPreset===preset?'':preset;
    const signal=$('#scannerSignal'),scope=$('#scannerScope');
    if(signal)signal.value='ALL';
    if(scope)scope.value=scannerKpiPreset==='USAGE'?'ALL':'SIGNALS';
    renderWeeklyScanner();
    syncKpiActiveState();
  }

  function bindKpiButtons(){
    syncKpiActiveState();
    $$('.scanner-kpi-btn').forEach(card=>{
      card.onclick=()=>activatePreset(card.dataset.scannerPreset);
      card.onkeydown=e=>{
        if(e.key==='Enter'||e.key===' '){e.preventDefault();activatePreset(card.dataset.scannerPreset)}
      };
    });
  }

  function bindFilterReset(){
    ['#scannerSearch','#scannerPos','#scannerSignal','#scannerScope','#scannerWeek'].forEach(sel=>{
      const el=$(sel);if(!el||el.dataset.kpiResetBound==='1')return;
      el.dataset.kpiResetBound='1';
      el.addEventListener(sel==='#scannerSearch'?'input':'change',()=>{
        if(scannerKpiPreset){scannerKpiPreset='';syncKpiActiveState()}
      });
    });
    const clear=$('#scannerClear');
    if(clear&&clear.dataset.kpiResetBound!=='1'){
      clear.dataset.kpiResetBound='1';
      clear.addEventListener('click',()=>{scannerKpiPreset='';syncKpiActiveState()});
    }
  }

  const previousRender=renderWeeklyScanner;
  renderWeeklyScanner=function(){
    previousRender();
    bindKpiButtons();
    bindFilterReset();

    $$('.scanner-signal-meter small').forEach(el=>{
      const card=el.closest('.scanner-card-v2');
      if(!card)return;
      const name=card.querySelector('.scanner-name-v2')?.textContent;
      const player=scannerRows().find(x=>x.name===name);
      if(!player)return;
      const raw=Math.abs(Number(player.signal_score)||0);
      el.textContent='SIGNAL '+Math.min(10,raw)+'/10';
      if(raw>10)el.title='Raw scanner score: '+raw;
    });
  };
})();