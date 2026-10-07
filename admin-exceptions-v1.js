/* BBB Actionable Exception Manager v2 · readable player-art pass */
(function(){
  let exceptionData=null,exceptionLoaded=false,exceptionLoading=false,exceptionMedia=new Map();
  let exceptionView='ACTIONABLE',exceptionSearch='';

  function arr(v){return Array.isArray(v)?v:[]}
  function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
  function escv(v){return esc(v==null?'':v)}
  function dt(v){if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d}
  function stamp(v){const d=dt(v);return d?d.toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'—'}
  function age(v){
    const h=num(v);if(!Number.isFinite(h))return'—';
    if(h<1)return'<1H';
    if(h<24)return Math.round(h)+'H';
    return (h/24).toFixed(h<48?1:0)+'D';
  }
  function kindLabel(k){return k==='TEAM_MISMATCH'?'TEAM':'INJURY'}
  function mediaId(key){return exceptionMedia.get(key)||null}
  function initials(name){return String(name||'?').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'?'}
  function playerArt(x){
    const id=mediaId(x.player_key),name=x.name||'Player';
    if(!id)return '<div class="exception-player-art fallback"><span>'+escv(initials(name))+'</span></div>';
    return '<div class="exception-player-art"><img src="https://a.espncdn.com/i/headshots/nfl/players/full/'+encodeURIComponent(id)+'.png" data-exception-espn="'+escv(id)+'" data-exception-name="'+escv(name)+'" alt="" loading="lazy"></div>';
  }
  function hydratePlayerArt(){
    $('.exception-player-art img').forEach(img=>{
      img.onerror=function(){
        if(img.dataset.fallbackDone==='1'){
          const wrap=img.closest('.exception-player-art');
          if(wrap){wrap.classList.add('fallback');wrap.innerHTML='<span>'+escv(initials(img.dataset.exceptionName||'?'))+'</span>'}
          return;
        }
        img.dataset.fallbackDone='1';
        img.src='https://a.espncdn.com/i/headshots/college-football/players/full/'+encodeURIComponent(img.dataset.exceptionEspn||'')+'.png';
      };
    });
  }
  function sourceLinks(x){
    const out=[];
    if(/^https?:\/\//i.test(x.source_1||''))out.push('<a href="'+escv(x.source_1)+'" target="_blank" rel="noopener">PRIMARY SOURCE ↗</a>');
    if(/^https?:\/\//i.test(x.source_2||''))out.push('<a href="'+escv(x.source_2)+'" target="_blank" rel="noopener">SECOND SOURCE ↗</a>');
    return out.join('');
  }
  function statusClass(x){return x.source_is_stale?'stale':'actionable'}
  function filtered(){
    const source=exceptionView==='RESOLVED'?arr(exceptionData?.resolved):arr(exceptionData?.exceptions);
    const q=exceptionSearch.trim().toLowerCase();
    return source.filter(x=>{
      if(exceptionView==='ACTIONABLE'&&x.source_is_stale)return false;
      if(exceptionView==='STALE'&&!x.source_is_stale)return false;
      if(exceptionView==='TEAM'&&x.kind!=='TEAM_MISMATCH')return false;
      if(exceptionView==='INJURY'&&x.kind!=='INJURY_MISMATCH')return false;
      if(q){
        const hay=[x.name,x.player_key,x.position,x.team,x.bbb_value,x.source_value,x.latest_update_text,x.structured_note,x.action,x.note].filter(Boolean).join(' ').toLowerCase();
        if(!hay.includes(q))return false;
      }
      return true;
    });
  }

  function decorateLegacyHealth(){
    const host=$('#healthGrid');if(!host)return;
    [...host.children].forEach(chip=>{
      const label=chip.querySelector('span')?.textContent?.trim();
      if(label==='Team Sync'){chip.dataset.exceptionJump='TEAM';chip.classList.add('exception-clickable')}
      if(label==='Injury Sync'){chip.dataset.exceptionJump='INJURY';chip.classList.add('exception-clickable')}
    });
    $$('[data-exception-jump]').forEach(b=>b.onclick=()=>{
      exceptionView=b.dataset.exceptionJump||'ACTIONABLE';
      renderTabs();renderList();
      $('#exceptionWorkbench')?.scrollIntoView({behavior:'smooth',block:'start'});
    });
  }

  function renderSummary(){
    const s=exceptionData?.summary||{};
    if($('#exceptionIntegrityScore'))$('#exceptionIntegrityScore').textContent=num(s.integrity_score)+'%';
    if($('#exceptionActionable'))$('#exceptionActionable').textContent=num(s.actionable);
    if($('#exceptionStale'))$('#exceptionStale').textContent=num(s.stale_source);
    if($('#exceptionReviewReminders'))$('#exceptionReviewReminders').textContent=num(s.profile_freshness_reminders);
    if($('#exceptionResolved'))$('#exceptionResolved').textContent=num(s.resolved);
    if($('#exceptionLabelNoise'))$('#exceptionLabelNoise').textContent=num(s.label_only_injury_differences);
    if($('#exceptionSourceAge'))$('#exceptionSourceAge').textContent=age(s.status_source_age_hours);
    if($('#exceptionSourceStamp'))$('#exceptionSourceStamp').textContent=stamp(s.status_source_last_refresh);
    const state=$('#exceptionState');
    if(state){
      state.className='hud-badge '+(num(s.actionable)>0?'warn':'good');
      state.textContent=num(s.actionable)>0?num(s.actionable)+' ACTIONABLE':'BOARD CLEAN';
    }
    const banner=$('#exceptionSourceBanner');
    if(banner){
      if(s.status_source_stale){
        banner.classList.remove('hide');
        banner.innerHTML='<div class="exception-source-orb">!</div><div><span>LEGACY STATUS FEED IS STALE</span><strong>Last refresh '+escv(stamp(s.status_source_last_refresh))+' · '+escv(age(s.status_source_age_hours))+' old</strong><p>'+num(s.stale_source)+' semantic disagreements are quarantined as stale-source noise and do <b>not</b> lower Board Integrity. '+num(s.label_only_injury_differences)+' additional injury label differences have equivalent severity and are suppressed entirely.</p></div><button type="button" data-exception-page="automations">OPEN AUTOMATION CENTER ↗</button>';
      }else{
        banner.classList.add('hide');banner.innerHTML='';
      }
    }
  }

  function renderChecks(){
    const host=$('#exceptionChecks');if(!host)return;
    host.innerHTML=arr(exceptionData?.checks).map(x=>'<div class="exception-check '+(x.ok?'good':'bad')+'"><i>'+ (x.ok?'✓':'!') +'</i><div><span>'+escv(x.label)+'</span><strong>'+escv(x.value)+'</strong></div></div>').join('');
  }

  function tabCount(view){
    const ex=arr(exceptionData?.exceptions),resolved=arr(exceptionData?.resolved);
    if(view==='ACTIONABLE')return ex.filter(x=>!x.source_is_stale).length;
    if(view==='STALE')return ex.filter(x=>x.source_is_stale).length;
    if(view==='TEAM')return ex.filter(x=>x.kind==='TEAM_MISMATCH').length;
    if(view==='INJURY')return ex.filter(x=>x.kind==='INJURY_MISMATCH').length;
    if(view==='RESOLVED')return resolved.length;
    return ex.length;
  }
  function renderTabs(){
    $$('[data-exception-view]').forEach(b=>{
      const v=b.dataset.exceptionView;
      b.classList.toggle('active',v===exceptionView);
      const n=b.querySelector('span');if(n)n.textContent=tabCount(v);
    });
  }

  function resolvedCard(x){
    return '<article class="exception-card resolved">'+
      '<header><div class="exception-player-main">'+playerArt(x)+'<div class="exception-id"><div class="exception-id-meta"><span class="exception-kind '+(x.kind==='TEAM_MISMATCH'?'team':'injury')+'">'+kindLabel(x.kind)+'</span><span>BBB #'+escv(x.overall_rank??'UR')+' · '+escv(x.position||'')+' · '+escv(x.team||'FA')+'</span></div><h3>'+escv(x.name)+'</h3></div></div><em class="resolved">RESOLVED</em></header>'+
      '<div class="exception-compare"><div class="bbb"><span>BBB VALUE</span><strong>'+escv(x.bbb_value||'—')+'</strong><small>Current BBB snapshot</small></div><div class="source"><span>SOURCE SNAPSHOT</span><strong>'+escv(x.source_value||'—')+'</strong><small>Compared source value</small></div></div>'+
      '<div class="exception-resolution"><span>'+escv(String(x.action||'RESOLVED').replaceAll('_',' '))+'</span><strong>'+escv(x.note||'Snapshot accepted until either side changes.')+'</strong><small>Resolved '+escv(stamp(x.resolved_at))+'</small></div>'+
      '<footer><button type="button" data-exception-player="'+escv(x.player_key)+'">OPEN PLAYER</button><button type="button" class="muted" data-exception-reopen="'+escv(x.player_key)+'" data-exception-kind="'+escv(x.kind)+'">REOPEN</button></footer>'+
    '</article>';
  }

  function exceptionCard(x){
    const stale=!!x.source_is_stale;
    const links=sourceLinks(x);
    const team=x.kind==='TEAM_MISMATCH';
    return '<article class="exception-card '+statusClass(x)+'">'+
      '<header><div class="exception-player-main">'+playerArt(x)+'<div class="exception-id"><div class="exception-id-meta"><span class="exception-kind '+(team?'team':'injury')+'">'+kindLabel(x.kind)+'</span><span>BBB #'+escv(x.overall_rank??'UR')+' · '+escv(x.position||'')+' · '+escv(x.team||'FA')+'</span></div><h3>'+escv(x.name)+'</h3><p>'+(team?'Team data disagreement':'Availability data disagreement')+'</p></div></div><em class="'+(stale?'stale':'actionable')+'">'+(stale?'STALE SOURCE':'ACTION NEEDED')+'</em></header>'+
      '<div class="exception-compare">'+
        '<div class="bbb"><span>BBB CURRENT</span><strong>'+escv(x.bbb_value||'—')+'</strong><small>Updated '+escv(stamp(x.bbb_updated_at))+'</small></div>'+
        '<div class="source"><span>'+escv(x.source_label||'SOURCE SNAPSHOT')+'</span><strong>'+escv(x.source_value||'—')+'</strong><small>Refreshed '+escv(stamp(x.source_refreshed_at))+' · '+escv(age(x.source_age_hours))+' old</small></div>'+
      '</div>'+
      (x.structured_value?'<div class="exception-third-source"><div><span>WEEKLY ROSTER HISTORY</span><strong>'+escv(x.structured_value)+'</strong></div><p>'+escv(x.structured_note||'')+'</p></div>':'<div class="exception-context"><span>WHAT THIS MEANS</span><p>'+escv(x.structured_note||'')+'</p></div>')+
      (x.latest_update_text?'<div class="exception-latest"><span>LATEST BBB INTEL · '+escv(x.latest_update_date||'')+'</span><p>'+escv(x.latest_update_text)+'</p><div class="exception-source-links">'+links+'</div></div>':'')+
      '<footer>'+
        '<button type="button" data-exception-player="'+escv(x.player_key)+'">OPEN PLAYER</button>'+
        (team?'<button type="button" data-exception-refresh-team="'+escv(x.player_key)+'">CHECK ROSTERS NOW</button>':'<button type="button" data-exception-injury="'+escv(x.player_key)+'">OPEN INJURY CENTER</button>')+
        '<button type="button" class="accept" data-exception-resolve="'+escv(x.player_key)+'" data-exception-kind="'+escv(x.kind)+'" data-exception-action="ACCEPT_BBB">ACCEPT BBB</button>'+
        (stale?'<button type="button" class="muted" data-exception-resolve="'+escv(x.player_key)+'" data-exception-kind="'+escv(x.kind)+'" data-exception-action="MARK_SOURCE_STALE">MARK SOURCE STALE</button>':'')+
      '</footer>'+
    '</article>';
  }

  function renderList(){
    const host=$('#exceptionList');if(!host)return;
    const list=filtered();
    const s=exceptionData?.summary||{};
    if($('#exceptionListCount'))$('#exceptionListCount').textContent=list.length+' item'+(list.length===1?'':'s');
    if(!list.length){
      if(exceptionView==='ACTIONABLE'){
        host.innerHTML='<div class="exception-empty"><div>✓</div><strong>No actionable data exceptions.</strong><p>The board is internally clean. '+num(s.stale_source)+' stale-source disagreement'+(num(s.stale_source)===1?' is':'s are')+' quarantined in the Stale Source tab instead of being treated as bad BBB data.</p><button type="button" data-exception-switch="STALE">VIEW STALE SOURCE ITEMS</button></div>';
      }else{
        host.innerHTML='<div class="exception-empty"><div>✓</div><strong>Nothing in this bucket.</strong><p>No current exception matches this view.</p></div>';
      }
      bindActions();return;
    }
    host.innerHTML=list.map(x=>exceptionView==='RESOLVED'?resolvedCard(x):exceptionCard(x)).join('');
    hydratePlayerArt();bindActions();
  }

  function render(){
    if(!exceptionLoaded||!exceptionData)return;
    renderSummary();renderChecks();renderTabs();renderList();decorateLegacyHealth();bindActions();
  }

  async function load(force=false){
    if(exceptionLoading)return;
    if(exceptionLoaded&&!force){render();return}
    exceptionLoading=true;
    const state=$('#exceptionState');if(state){state.textContent='SCANNING…';state.classList.add('exception-pulsing')}
    try{
      const [data,media]=await Promise.all([rpc('admin_get_exception_manager',{p_include_resolved:false}),rpc('admin_get_exception_media',{})]);
      exceptionData=data||null;
      exceptionMedia=new Map(arr(media).filter(x=>x?.player_key&&x?.espn_id).map(x=>[x.player_key,String(x.espn_id)]));
      exceptionLoaded=true;render();
    }catch(e){
      console.error('BBB Exception Manager failed',e);
      const host=$('#exceptionList');if(host)host.innerHTML='<div class="scanner-error"><span>!</span><strong>Exception Manager failed to load.</strong><small>'+escv(e.message||'Unknown error')+'</small><button id="exceptionRetry" class="small-btn">TRY AGAIN</button></div>';
      $('#exceptionRetry')?.addEventListener('click',()=>load(true));
    }finally{
      exceptionLoading=false;
      if(state)state.classList.remove('exception-pulsing');
    }
  }

  async function resolveException(kind,key,action,btn){
    const row=arr(exceptionData?.exceptions).find(x=>x.kind===kind&&x.player_key===key);
    if(!row)return;
    const wording=action==='ACCEPT_BBB'
      ?'Accept BBB as authoritative for this '+kindLabel(kind).toLowerCase()+' snapshot?'
      :'Mark this source snapshot stale until the source changes?';
    if(!confirm(wording+' This does not change rankings or overwrite the external source.'))return;
    const old=btn.textContent;btn.disabled=true;btn.textContent='SAVING…';
    try{
      await rpc('admin_resolve_data_exception',{p_exception_kind:kind,p_player_key:key,p_action:action,p_note:null});
      await Promise.all([load(true),loadDataHealth()]);
      renderDataHealth();decorateLegacyHealth();
    }catch(e){alert(e.message);btn.disabled=false;btn.textContent=old}
  }

  async function reopen(kind,key,btn){
    const old=btn.textContent;btn.disabled=true;btn.textContent='…';
    try{
      await rpc('admin_resolve_data_exception',{p_exception_kind:kind,p_player_key:key,p_action:'REOPEN',p_note:null});
      await Promise.all([load(true),loadDataHealth()]);
      renderDataHealth();decorateLegacyHealth();
    }catch(e){alert(e.message);btn.disabled=false;btn.textContent=old}
  }

  async function refreshTeam(btn){
    const old=btn.textContent;btn.disabled=true;btn.textContent='CHECKING…';
    try{
      await rpc('admin_run_automation_source',{p_source:'rosters'});
      await rpc('admin_run_automation_source',{p_source:'metadata'});
      await Promise.all([load(true),loadDataHealth(),loadBoard(),loadProfiles()]);
      renderDataHealth();decorateLegacyHealth();
    }catch(e){alert(e.message)}
    finally{btn.disabled=false;btn.textContent=old}
  }

  function bindActions(){
    $$('[data-exception-view]').forEach(b=>b.onclick=()=>{exceptionView=b.dataset.exceptionView||'ACTIONABLE';renderTabs();renderList()});
    $$('[data-exception-switch]').forEach(b=>b.onclick=()=>{exceptionView=b.dataset.exceptionSwitch||'STALE';renderTabs();renderList()});
    $$('[data-exception-player]').forEach(b=>b.onclick=()=>window.openBBBPlayerWorkspace?.(b.dataset.exceptionPlayer,'activity'));
    $$('[data-exception-injury]').forEach(b=>b.onclick=()=>page('injuries'));
    $$('[data-exception-refresh-team]').forEach(b=>b.onclick=()=>refreshTeam(b));
    $$('[data-exception-resolve]').forEach(b=>b.onclick=()=>resolveException(b.dataset.exceptionKind,b.dataset.exceptionResolve,b.dataset.exceptionAction,b));
    $$('[data-exception-reopen]').forEach(b=>b.onclick=()=>reopen(b.dataset.exceptionKind,b.dataset.exceptionReopen,b));
    $$('[data-exception-page]').forEach(b=>b.onclick=()=>page(b.dataset.exceptionPage));
  }

  $('#exceptionRefresh')?.addEventListener('click',()=>load(true));
  $('#exceptionSearch')?.addEventListener('input',e=>{exceptionSearch=e.target.value||'';renderList()});
  $('#exceptionClear')?.addEventListener('click',()=>{exceptionSearch='';if($('#exceptionSearch'))$('#exceptionSearch').value='';renderList()});

  const priorRenderHealth=renderDataHealth;
  renderDataHealth=function(){
    priorRenderHealth();
    decorateLegacyHealth();
    if(exceptionLoaded)renderSummary();
  };

  const priorPage=page;
  page=function(name){
    priorPage(name);
    if(name==='review'){
      if($('#missionPageTitle'))$('#missionPageTitle').textContent='Review Queue · Exception Manager';
      if(!exceptionLoaded&&!exceptionLoading)void load(false);else render();
    }
  };

  window.BBBExceptionManager={load,render};
})();