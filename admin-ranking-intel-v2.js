/* BBB Ranking Intelligence V2 — research only. No rankings or content are auto-edited. */
(function(){
  'use strict';
  let intel=null,loaded=false,loading=false,filter='ALL',visibleCount=12,busyKeys=new Set();

  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const safe=v=>esc(String(v==null?'':v));
  const list=v=>Array.isArray(v)?v:[];
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
  const showNum=(n,suffix='')=>n==null?'—':num(n).toFixed(1).replace(/\.0$/,'')+suffix;
  const percent=n=>n==null?'—':Math.round(num(n)*100)+'%';

  function category(item){
    const s=String(item.signal||'MONITOR');
    if(s==='RISING WORKLOAD')return 'RISING';
    if(s==='ROLE DECLINE')return 'DECLINE';
    return 'OTHER';
  }
  function updateFilterButtons(){
    $$('[data-rintel-filter]').forEach(btn=>{
      const on=btn.dataset.rintelFilter===filter;
      btn.classList.toggle('active',on);btn.setAttribute('aria-pressed',String(on));
    });
  }
  function dataRows(){
    const query=($('#rankIntelSearch')?.value||'').trim().toLowerCase();
    return list(intel?.signals).filter(row=>{
      if(filter==='DISMISSED'&&row.disposition!=='dismiss')return false;
      if(filter==='WATCH'&&row.disposition!=='watch')return false;
      if(filter==='ALL'&&row.disposition==='dismiss')return false;
      if(filter==='RISING'&&(category(row)!=='RISING'||row.disposition==='dismiss'))return false;
      if(filter==='DECLINE'&&(category(row)!=='DECLINE'||row.disposition==='dismiss'))return false;
      return !query||(row.name+' '+row.player_key+' '+row.position+' '+(row.team||'')).toLowerCase().includes(query);
    });
  }
  function workloadBars(row){
    if(row.previous_usage==null)return '<span class="rank-intel-missing">Previous sourced games unavailable</span>';
    const previous=num(row.previous_usage),recent=num(row.recent_usage);
    const ceiling=Math.max(1,previous,recent)*1.08;
    const width=n=>Math.max(1,Math.min(100,Math.round(n/ceiling*100)));
    return '<div class="rank-intel-trend" aria-label="Earlier game average '+safe(showNum(previous))+
      ', latest two-game average '+safe(showNum(recent))+'">'+
      '<div><span>EARLIER</span><i><b style="width:'+width(previous)+'%"></b></i><strong>'+safe(showNum(previous))+'</strong></div>'+
      '<div><span>LATEST 2</span><i class="recent"><b style="width:'+width(recent)+'%"></b></i><strong>'+safe(showNum(recent))+'</strong></div></div>';
  }
  function detailCopy(row){
    const unit=row.position==='QB'?'dropbacks attempted + carries':row.position==='RB'?'carries + targets':'targets';
    const delta=row.delta_usage==null?'No sourced baseline':(num(row.delta_usage)>=0?'+':'')+showNum(row.delta_usage)+' '+unit+' per game vs earlier sample';
    const gaps=num(row.market_gap);
    const market=gaps>0?'BBB '+gaps+' spots above market':
      gaps<0?'Market '+Math.abs(gaps)+' spots above BBB':'Ranked at market';
    const status=row.injury_status&&!/^healthy$/i.test(row.injury_status)
      ?' · Profile injury: '+row.injury_status:'';
    return {unit,delta,market,status};
  }
  function card(row){
    const k=safe(row.player_key),d=detailCopy(row),trend=category(row);
    const watching=row.disposition==='watch',dismissed=row.disposition==='dismiss';
    const queued=row.already_queued===true,busy=busyKeys.has(row.player_key);
    const status=String(row.signal||'MONITOR');
    const confidence=String(row.evidence_confidence||'LOW');
    return '<article class="rank-intel-card '+trend.toLowerCase()+(watching?' watched':'')+(dismissed?' dismissed':'')+'">'+
      '<header class="rank-intel-card-head">'+
        '<span class="rank-intel-rank">#'+safe(row.overall_rank)+'</span>'+
        '<div class="rank-intel-player"><strong>'+safe(row.name||row.player_key)+'</strong>'+
          '<span>'+safe(row.position)+' · '+safe(row.team||'FA')+' · MARKET #'+safe(row.market_rank)+'</span></div>'+
        '<span class="rank-intel-signal '+trend.toLowerCase()+'">'+safe(status)+'</span>'+
      '</header>'+
      '<div class="rank-intel-card-body">'+
        '<p class="rank-intel-reason">'+safe(d.market)+' · '+safe(d.delta)+safe(d.status)+'</p>'+
        '<div class="rank-intel-details">'+
          '<div><span>RECENT WORKLOAD</span><strong>'+safe(showNum(row.recent_usage))+'</strong><small>'+safe(d.unit)+'/game</small></div>'+
          '<div><span>SNAP SHARE</span><strong>'+safe(percent(row.recent_snap_share))+'</strong><small>latest sourced games</small></div>'+
          '<div><span>TARGET SHARE</span><strong>'+safe(percent(row.recent_target_share))+'</strong><small>available source only</small></div>'+
          '<div><span>DATA CONFIDENCE</span><strong>'+safe(confidence)+'</strong><small>'+safe(row.sourced_games)+' sourced games</small></div>'+
        '</div>'+
        workloadBars(row)+
        '<div class="rank-intel-evidence">Based on sourced NFL stats through Week '+safe(row.latest_game_week)+
        '. Film, injury context and depth chart must still be reviewed.</div>'+
      '</div>'+
      '<footer class="rank-intel-card-actions">'+
        '<button type="button" class="small-btn" data-rintel-open="'+k+'">OPEN PLAYER</button>'+
        '<button type="button" class="rank-intel-primary" data-rintel-queue="'+k+'" '+(queued||busy?'disabled':'')+'>'+
           (queued?'IN REVIEW QUEUE ✓':busy?'SAVING…':'QUEUE REVIEW')+'</button>'+
        '<button type="button" class="small-btn '+(watching?'selected':'')+'" data-rintel-watch="'+k+'" '+(busy?'disabled':'')+'>'+
          (watching?'WATCHING ✓':'WATCH')+'</button>'+
        '<button type="button" class="small-btn" data-rintel-dismiss="'+k+'" '+(busy?'disabled':'')+'>'+
          (dismissed?'RESTORE':'DISMISS')+'</button>'+
      '</footer>'+
    '</article>';
  }
  function render(){
    const host=$('#rankIntelGrid'),over=$('#rankIntelOverview'),count=$('#rankIntelCount');
    if(!host)return;
    updateFilterButtons();
    if(!intel){
      host.innerHTML='<div class="empty">Ranking research is not available right now. No ranks were changed.</div>';
      return;
    }
    const matches=dataRows(),rows=matches.slice(0,visibleCount),all=list(intel.signals);
    if(over){
      const rising=all.filter(x=>category(x)==='RISING'&&x.disposition!=='dismiss').length;
      const falling=all.filter(x=>category(x)==='DECLINE'&&x.disposition!=='dismiss').length;
      const watch=all.filter(x=>x.disposition==='watch').length;
      over.innerHTML='<span><strong>'+safe(intel.season||'—')+' · WEEK '+safe(intel.latest_week||'—')+'</strong> sourced games</span>'+
        '<span><strong>'+rising+'</strong> rising workload</span>'+
        '<span><strong>'+falling+'</strong> declining role</span>'+
        '<span><strong>'+watch+'</strong> watched players</span>'+
        '<span><strong>'+safe(intel.market_snapshot_date||'—')+'</strong> market snapshot</span>';
    }
    host.innerHTML=rows.length?rows.map(card).join(''):
      '<div class="empty">No players match this filter. Try another signal or clear the search.</div>';
    if(count)count.textContent=rows.length+' of '+matches.length+' filtered research signals · '+all.length+' total · no auto-rank moves';
    const more=$('#rankIntelMore');
    if(more){
      more.classList.toggle('hide',matches.length<=visibleCount);
      more.textContent='SHOW MORE ('+(matches.length-visibleCount)+' LEFT)';
    }
  }
  async function load(force=false){
    if(loading)return;
    if(loaded&&!force){render();return}
    loading=true;
    const btn=$('#rankIntelRefresh');
    if(btn){btn.disabled=true;btn.textContent='REFRESHING…'}
    try{
      const result=await rpc('admin_get_ranking_intelligence_v2',{p_limit:95});
      if(!result||!Array.isArray(result.signals))throw new Error('Invalid Ranking Intelligence response');
      intel=result;loaded=true;render();
    }catch(err){
      console.error('BBB Ranking Intelligence v2 failed',err);
      const host=$('#rankIntelGrid');
      if(host)host.innerHTML='<div class="empty">Could not load Ranking Intelligence. '+safe(err.message)+
        ' <button type="button" data-rintel-retry class="small-btn">TRY AGAIN</button></div>';
    }finally{
      loading=false;
      if(btn){btn.disabled=false;btn.textContent='REFRESH RESEARCH'}
    }
  }
  function openPlayer(key){
    if(typeof window.openBBBPlayerWorkspace==='function'){
      window.openBBBPlayerWorkspace(key,'dynasty');return;
    }
    page('players');
    const input=$('#playerAdminSearch');
    if(input){input.value=key.replaceAll('-',' ');input.dispatchEvent(new Event('input',{bubbles:true}))}
  }
  async function triage(key,action){
    const row=list(intel?.signals).find(x=>x.player_key===key);
    if(!row||busyKeys.has(key))return;
    busyKeys.add(key);render();
    try{
      const result=await rpc('admin_set_ranking_intel_triage',{p_player_key:key,p_action:action});
      row.disposition=result?.disposition||'new';
      render();
    }catch(err){alert('Could not save your research triage: '+err.message)}
    finally{busyKeys.delete(key);render()}
  }
  async function queue(key){
    const row=list(intel?.signals).find(x=>x.player_key===key);
    if(!row||row.already_queued||busyKeys.has(key))return;
    busyKeys.add(key);render();
    const d=detailCopy(row);
    const why='Four-week Ranking Intelligence v2 research: '+row.signal+
      '. '+d.market+'. '+d.delta+'. '+row.sourced_games+
      ' sourced games through 2026 W'+row.latest_game_week+
      '. Review injuries, film and context before selecting a target.';
    try{
      await rpc('admin_queue_ranking_move',{
        p_player_key:key,p_recommended_rank:null,p_reason:why,
        p_priority:num(row.evidence_score)>=70?2:3,
        p_source:'ranking_intelligence_v2',
        p_confidence:String(row.evidence_confidence||'LOW').toLowerCase(),
        p_trigger_update_id:null
      });
      row.already_queued=true;
      render();
      if(typeof loadRankingMoveQueue==='function'){
        await loadRankingMoveQueue();
        if(typeof renderRankingMoveQueue==='function')renderRankingMoveQueue();
      }
    }catch(err){alert('Ranking review could not be queued or refreshed: '+err.message)}
    finally{busyKeys.delete(key);render()}
  }
  function bind(){
    const panel=$('#rankIntelPanel');
    if(!panel||panel.dataset.rankIntelBound==='1')return;
    panel.dataset.rankIntelBound='1';
    panel.addEventListener('click',event=>{
      const b=event.target.closest('button');
      if(!b||!panel.contains(b))return;
      if(b.id==='rankIntelRefresh'||b.matches('[data-rintel-retry]')){void load(true);return}
      if(b.id==='rankIntelMore'){visibleCount+=12;render();return}
      if(b.hasAttribute('data-rintel-filter')){
        filter=b.dataset.rintelFilter;visibleCount=12;render();return;
      }
      if(b.dataset.rintelOpen){openPlayer(b.dataset.rintelOpen);return}
      if(b.dataset.rintelQueue){void queue(b.dataset.rintelQueue);return}
      if(b.dataset.rintelWatch){
        const x=list(intel?.signals).find(x=>x.player_key===b.dataset.rintelWatch);
        void triage(b.dataset.rintelWatch,x?.disposition==='watch'?'reset':'watch');return;
      }
      if(b.dataset.rintelDismiss){
        const x=list(intel?.signals).find(x=>x.player_key===b.dataset.rintelDismiss);
        void triage(b.dataset.rintelDismiss,x?.disposition==='dismiss'?'reset':'dismiss');
      }
    });
    $('#rankIntelSearch')?.addEventListener('input',()=>{visibleCount=12;render()});
    // No network work until the owner deliberately opens the optional explorer.
    const disclosure=$('#rankIntelDisclosure');
    if(disclosure && disclosure.dataset.rankIntelToggleBound!=='1'){
      disclosure.dataset.rankIntelToggleBound='1';
      disclosure.addEventListener('toggle',()=>{
        if(!disclosure.open)return;
        if(!loaded&&!loading)void load(false);
        else render();
      });
    }
  }
  const previousPage=page;
  page=function(name){
    previousPage(name);
    if(name==='research'){
      bind();
      if($('#rankIntelDisclosure')?.open){
        if(!loaded&&!loading)void load(false);
        else render();
      }
    }
  };
  document.addEventListener('DOMContentLoaded',bind,{once:true});
  window.BBBRankingIntelligence={load,render};
})();
