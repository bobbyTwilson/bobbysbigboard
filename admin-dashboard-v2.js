/* BBB Admin Dashboard Command Nexus v2 */
(function(){
  let adminNexus=null,nexusLoaded=false,nexusLoading=false;

  function arr(v){return Array.isArray(v)?v:[]}
  function val(v,f='—'){return v==null||v===''?f:v}
  function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
  function pct(v){const n=Number(v);return Number.isFinite(n)?(n*100).toFixed(1)+'%':'—'}
  function artUrl(id,sport='nfl'){return id?'https://a.espncdn.com/i/headshots/'+sport+'/players/full/'+encodeURIComponent(id)+'.png':''}
  function art(id,name,cls=''){
    if(!id)return '<div class="nexus-art fallback '+cls+'"><span>'+esc((name||'?').slice(0,1))+'</span></div>';
    return '<div class="nexus-art '+cls+'"><img src="'+artUrl(id)+'" data-nexus-espn="'+esc(id)+'" alt="" loading="lazy"></div>';
  }
  function hydrateArt(){
    $$('.nexus-art img').forEach(img=>{
      img.onerror=function(){
        if(img.dataset.fallbackDone==='1'){
          const w=img.closest('.nexus-art');if(w){w.classList.add('fallback');w.innerHTML='<span>?</span>'}
          return;
        }
        img.dataset.fallbackDone='1';
        img.src=artUrl(img.dataset.nexusEspn,'college-football');
      };
    });
  }
  function dateText(v){
    if(!v)return '—';
    const d=new Date(v);
    if(Number.isNaN(d.getTime()))return String(v);
    return d.toLocaleDateString([],{month:'short',day:'numeric'});
  }
  function relativeTime(v){
    if(!v)return '—';
    const d=new Date(v),diff=Date.now()-d.getTime();
    if(!Number.isFinite(diff))return '—';
    const m=Math.max(0,Math.round(diff/60000));
    if(m<2)return 'JUST NOW';
    if(m<60)return m+'M AGO';
    const h=Math.round(m/60);if(h<24)return h+'H AGO';
    return Math.round(h/24)+'D AGO';
  }

  function topMove(){return arr(adminNexus?.moves?.top)[0]||null}
  function topInjury(){return arr(adminNexus?.injuries?.top)[0]||null}
  function topScanner(){return arr(adminNexus?.scanner?.top)[0]||null}
  function topContent(){return arr(adminNexus?.content?.top)[0]||null}

  function nextAction(){
    const move=topMove(),inj=topInjury(),scan=topScanner(),content=topContent();
    if(move)return{
      kind:'ranking',eyebrow:'APPROVAL GATE',title:'Ranking decision waiting on you',
      player:move.name||move.player_name,detail:move.reason||'A ranking recommendation is waiting for approval.',
      page:'moves',action:'OPEN RANKING MOVES',score:'P'+val(move.priority,'—'),key:move.player_key
    };
    if(inj&&num(adminNexus?.injuries?.updated_today)>0)return{
      kind:'injury',eyebrow:'MEDICAL INTEL',title:(inj.name||'Player')+' has new injury information',
      player:inj.name,detail:inj.latest_update_text||inj.injury_note||inj.current_status||'Updated injury status.',
      page:'injuries',action:'OPEN INJURY CENTER',score:inj.current_status||'UPDATED',key:inj.player_key,espn:inj.espn_id
    };
    if(scan)return{
      kind:'scanner',eyebrow:'WEEKLY SIGNAL',title:(scan.name||'Player')+' is the strongest role signal',
      player:scan.name,detail:scan.signal_reason||'Weekly role signal requires review.',
      page:'scanner',action:'OPEN WEEKLY SCANNER',score:(scan.signal||'SIGNAL')+' '+Math.abs(num(scan.signal_score)),key:scan.player_key
    };
    if(content)return{
      kind:'content',eyebrow:'CREATOR OPS',title:(content.name||'Player')+' is the best content opportunity',
      player:content.name,detail:content.recommended_title||content.primary_signal||'High-priority creator opportunity.',
      page:'content',action:'OPEN CONTENT INTELLIGENCE',score:num(content.content_score)+'/100',key:content.player_key,espn:content.espn_id
    };
    return{kind:'clear',eyebrow:'COMMAND STATUS',title:'No urgent action is waiting',detail:'The board is clear enough to work proactively.',page:'dashboard',action:'STAY HERE',score:'CLEAR'};
  }

  function renderHero(){
    const host=$('#nexusNextAction');if(!host)return;
    const x=nextAction();
    host.className='nexus-next-action '+x.kind;
    host.innerHTML=
      '<div class="nexus-next-left">'+
        (x.espn?art(x.espn,x.player,'hero-art'):'<div class="nexus-kind-orb">'+({ranking:'↕',injury:'＋',scanner:'⌁',content:'▶',clear:'✓'}[x.kind]||'◈')+'</div>')+
        '<div class="nexus-next-copy"><span>'+esc(x.eyebrow)+'</span><h3>'+esc(x.title)+'</h3><p>'+esc(x.detail)+'</p></div>'+
      '</div>'+
      '<div class="nexus-next-right"><div class="nexus-next-score"><small>PRIORITY SIGNAL</small><strong>'+esc(x.score)+'</strong></div><button type="button" data-nexus-page="'+esc(x.page)+'">'+esc(x.action)+' ↗</button></div>';
  }

  function renderKpis(){
    const map={
      nexusPendingMoves:num(adminNexus?.moves?.pending),
      nexusInjuryToday:num(adminNexus?.injuries?.updated_today),
      nexusBreakouts:num(adminNexus?.scanner?.breakouts),
      nexusContentTop:num(adminNexus?.content?.top_opportunities)
    };
    Object.entries(map).forEach(([id,v])=>{const el=$('#'+id);if(el)el.textContent=v});
    if($('#nexusScannerWeek'))$('#nexusScannerWeek').textContent='W'+val(adminNexus?.scanner?.week,'—');
    if($('#nexusGenerated'))$('#nexusGenerated').textContent='UPDATED '+relativeTime(adminNexus?.generated_at);
  }

  function signalCard(kind,x){
    if(!x){
      const labels={ranking:['RANKING GATE','No pending moves'],injury:['INJURY WATCH','No active update'],scanner:['WEEKLY SCANNER','No signal'],content:['CONTENT RADAR','No opportunity']};
      return '<article class="nexus-signal-card '+kind+' empty-state"><div class="nexus-signal-icon">'+({ranking:'↕',injury:'＋',scanner:'⌁',content:'▶'}[kind])+'</div><div><span>'+labels[kind][0]+'</span><strong>'+labels[kind][1]+'</strong><p>Nothing urgent in this lane.</p></div></article>';
    }
    if(kind==='ranking')return '<article class="nexus-signal-card ranking" data-nexus-page="moves"><div class="nexus-signal-icon">↕</div><div><span>RANKING GATE · P'+val(x.priority,'—')+'</span><strong>'+esc(x.name||x.player_name||'Player')+'</strong><p>'+esc(x.reason||'Ranking decision waiting.')+'</p><small>#'+val(x.current_rank,'—')+(x.recommended_rank?' → #'+x.recommended_rank:' · TARGET NEEDED')+'</small></div></article>';
    if(kind==='injury')return '<article class="nexus-signal-card injury" data-nexus-page="injuries">'+art(x.espn_id,x.name)+'<div><span>INJURY · '+esc(x.trend||'WATCH')+'</span><strong>'+esc(x.name||'Player')+'</strong><p>'+esc(x.latest_update_text||x.current_status||x.injury_note||'Availability update')+'</p><small>BBB #'+val(x.overall_rank,'—')+' · '+esc(x.return_window||'RETURN TBD')+'</small></div></article>';
    if(kind==='scanner')return '<article class="nexus-signal-card scanner" data-nexus-page="scanner"><div class="nexus-signal-icon">⌁</div><div><span>'+esc(x.signal||'WEEKLY SIGNAL')+' · SCORE '+Math.abs(num(x.signal_score))+'</span><strong>'+esc(x.name||'Player')+'</strong><p>'+esc(x.signal_reason||'Weekly usage signal')+'</p><small>BBB #'+val(x.overall_rank,'—')+' · '+pct(x.target_share)+' TARGET SHARE</small></div></article>';
    return '<article class="nexus-signal-card content" data-nexus-page="content">'+art(x.espn_id,x.name)+'<div><span>'+esc(x.recommended_format||'CONTENT')+' · '+val(x.content_score,'—')+'/100</span><strong>'+esc(x.name||'Player')+'</strong><p>'+esc(x.recommended_title||x.primary_signal||'Creator opportunity')+'</p><small>'+esc(x.coverage_status||'')+'</small></div></article>';
  }

  function renderLanes(){
    const moves=arr(adminNexus?.moves?.top);
    const injuries=arr(adminNexus?.injuries?.top);
    const scanner=arr(adminNexus?.scanner?.top);
    const content=arr(adminNexus?.content?.top);
    const host=$('#nexusSignalGrid');if(!host)return;
    host.innerHTML=[
      signalCard('ranking',moves[0]),
      signalCard('injury',injuries[0]),
      signalCard('scanner',scanner[0]),
      signalCard('content',content[0]),
      signalCard('injury',injuries[1]),
      signalCard('scanner',scanner[1]),
      signalCard('content',content[1])
    ].join('');
  }

  function renderSystems(){
    const host=$('#nexusSystems');if(!host)return;
    const practice=adminNexus?.injuries?.practice_feed_freshness;
    host.innerHTML=
      '<button type="button" class="nexus-system" data-nexus-page="moves"><span>RANKING MOVES</span><strong>'+num(adminNexus?.moves?.pending)+'</strong><small>'+(num(adminNexus?.moves?.pending)?'WAITING ON YOU':'QUEUE CLEAR')+'</small><i class="'+(num(adminNexus?.moves?.pending)?'warn':'good')+'"></i></button>'+
      '<button type="button" class="nexus-system" data-nexus-page="scanner"><span>WEEKLY SCANNER</span><strong>'+num(adminNexus?.scanner?.breakouts)+'</strong><small>'+num(adminNexus?.scanner?.concerns)+' CONCERNS · WEEK '+val(adminNexus?.scanner?.week,'—')+'</small><i class="good"></i></button>'+
      '<button type="button" class="nexus-system" data-nexus-page="injuries"><span>INJURY CENTER</span><strong>'+num(adminNexus?.injuries?.active)+'</strong><small>'+num(adminNexus?.injuries?.updated_today)+' UPDATED TODAY</small><i class="warn"></i></button>'+
      '<button type="button" class="nexus-system" data-nexus-page="content"><span>CONTENT INTEL</span><strong>'+num(adminNexus?.content?.top_opportunities)+'</strong><small>'+num(adminNexus?.content?.queue_count)+' IN CREATOR QUEUE</small><i class="good"></i></button>'+
      '<button type="button" class="nexus-system" data-nexus-page="review"><span>BOARD REVIEW</span><strong>'+num(adminNexus?.brief_counts?.ranking_decisions)+'</strong><small>'+num(adminNexus?.brief_counts?.market_movers)+' MARKET MOVERS</small><i class="'+(num(adminNexus?.brief_counts?.ranking_decisions)?'warn':'good')+'"></i></button>'+
      '<div class="nexus-system freshness"><span>DATA FRESHNESS</span><strong>'+dateText(adminNexus?.injuries?.profile_freshness)+'</strong><small>PRACTICE FEED '+dateText(practice)+'</small><i class="'+(practice&&Date.now()-new Date(practice).getTime()>36*3600000?'warn':'good')+'"></i></div>';
  }

  function renderCommandPath(){
    const host=$('#nexusCommandPath');if(!host)return;
    const steps=[
      {n:1,page:'moves',title:'Approve ranking decisions',meta:num(adminNexus?.moves?.pending)+' pending',ready:num(adminNexus?.moves?.pending)>0},
      {n:2,page:'injuries',title:'Review fresh injury intel',meta:num(adminNexus?.injuries?.updated_today)+' updated today',ready:num(adminNexus?.injuries?.updated_today)>0},
      {n:3,page:'scanner',title:'Check role changes',meta:num(adminNexus?.scanner?.breakouts)+' breakouts · '+num(adminNexus?.scanner?.concerns)+' concerns',ready:num(adminNexus?.scanner?.breakouts)+num(adminNexus?.scanner?.concerns)>0},
      {n:4,page:'content',title:'Choose what to make',meta:num(adminNexus?.content?.top_opportunities)+' high-priority ideas',ready:num(adminNexus?.content?.top_opportunities)>0}
    ];
    host.innerHTML=steps.map(s=>'<button type="button" class="nexus-path-step '+(s.ready?'ready':'clear')+'" data-nexus-page="'+s.page+'"><b>0'+s.n+'</b><span><strong>'+esc(s.title)+'</strong><small>'+esc(s.meta)+'</small></span><em>'+(s.ready?'OPEN →':'CLEAR ✓')+'</em></button>').join('');
  }

  function render(){
    if(!nexusLoaded||!adminNexus)return;
    renderKpis();renderHero();renderLanes();renderSystems();renderCommandPath();
    bindActions();hydrateArt();
  }

  async function load(force=false){
    if(nexusLoading)return;
    if(nexusLoaded&&!force){render();return}
    nexusLoading=true;
    const state=$('#nexusState');
    if(state){state.textContent='SYNCING…';state.classList.add('nexus-pulsing')}
    try{
      adminNexus=await rpc('admin_get_admin_nexus',{})||null;
      nexusLoaded=true;
      render();
    }catch(e){
      console.error('BBB Admin Command Nexus failed',e);
      const host=$('#nexusSignalGrid');
      if(host)host.innerHTML='<div class="scanner-error"><span>!</span><strong>Command Nexus failed to load.</strong><small>'+esc(e.message||'Unknown error')+'</small><button id="nexusRetry" class="small-btn">TRY AGAIN</button></div>';
      $('#nexusRetry')?.addEventListener('click',()=>load(true));
    }finally{
      nexusLoading=false;
      if(state){state.textContent='ALL SYSTEMS';state.classList.remove('nexus-pulsing')}
    }
  }

  function bindActions(){
    $$('[data-nexus-page]').forEach(el=>{
      el.onclick=()=>page(el.dataset.nexusPage);
    });
    $$('[data-nexus-player]').forEach(el=>{
      el.onclick=()=>window.openBBBPlayerWorkspace?.(el.dataset.nexusPlayer,'activity');
    });
  }

  $('#nexusRefresh')?.addEventListener('click',()=>load(true));

  const priorRender=renderCommandDashboard;
  renderCommandDashboard=function(){
    priorRender();
    if(activeAdminPage==='dashboard'&&!$('#appView')?.classList.contains('hide')){
      if(!nexusLoaded&&!nexusLoading)void load(false);else render();
    }
  };

  const priorPage=page;
  page=function(name){
    priorPage(name);
    if(name==='dashboard'){
      if(!nexusLoaded&&!nexusLoading)void load(false);else render();
    }
  };

  document.addEventListener('DOMContentLoaded',()=>{bindActions()},{once:true});
  window.BBBAdminNexus={load,render};
})();