(function(){
  if(typeof profileRender!=='function')return;

  if(!document.querySelector('#bbb-profile-render-gate-styles')){
    const style=document.createElement('style');
    style.id='bbb-profile-render-gate-styles';
    style.textContent=`
      #profileView.bbb-profile-v2-rendering #profileMount{visibility:hidden!important;pointer-events:none!important}
      #profileView:not(.bbb-profile-v2-rendering) #profileMount{visibility:visible}

      /* The site's generic mobile table rules turn every table into ranking cards.
         Career production is a true data table, so keep it tabular and horizontally
         scrollable on phones instead of letting each season break into malformed cards. */
      @media(max-width:640px){
        .bbb-v2-career-card{overflow:hidden}
        .bbb-v2-career-table-wrap{
          overflow-x:auto!important;
          overflow-y:hidden;
          -webkit-overflow-scrolling:touch;
          overscroll-behavior-inline:contain;
          scrollbar-width:thin;
          border-radius:11px;
        }
        .bbb-v2-career-table-wrap:before{
          content:'Swipe to see more stats →';
          display:block;
          position:sticky;
          left:0;
          width:max-content;
          padding:8px 10px 7px;
          color:#6f8277;
          font-size:8px;
          font-weight:850;
          letter-spacing:.04em;
          text-transform:uppercase;
          background:#09140f;
          border-bottom:1px solid #173127;
          z-index:6;
        }
        .bbb-v2-career-table{
          display:table!important;
          width:100%!important;
          min-width:820px!important;
          border-collapse:collapse!important;
          table-layout:auto!important;
        }
        .bbb-v2-career-table thead{display:table-header-group!important}
        .bbb-v2-career-table tbody{
          display:table-row-group!important;
          padding:0!important;
        }
        .bbb-v2-career-table tbody tr{
          display:table-row!important;
          grid-template-columns:none!important;
          gap:0!important;
          padding:0!important;
          border:0!important;
          border-radius:0!important;
          background:#07100c!important;
        }
        .bbb-v2-career-table th,
        .bbb-v2-career-table td{
          display:table-cell!important;
          width:auto!important;
          padding:10px 9px!important;
          white-space:nowrap!important;
          vertical-align:middle!important;
        }
        .bbb-v2-career-table th:first-child,
        .bbb-v2-career-table td:first-child{
          position:sticky;
          left:0;
          min-width:72px;
          z-index:4;
          background:#09140f!important;
          box-shadow:1px 0 0 #173127;
        }
        .bbb-v2-career-table td:first-child{background:#07100c!important}
        .bbb-v2-career-table th:nth-child(2),
        .bbb-v2-career-table td:nth-child(2){
          position:sticky;
          left:72px;
          min-width:64px;
          z-index:3;
          background:#09140f!important;
          box-shadow:1px 0 0 #173127;
        }
        .bbb-v2-career-table td:nth-child(2){background:#07100c!important}
        .bbb-v2-career-table th:first-child,
        .bbb-v2-career-table th:nth-child(2){z-index:5}
      }
    `;
    document.head.appendChild(style);
  }

  function bbbProfileRenderGate(on){
    const view=document.querySelector('#profileView');
    if(!view)return;
    view.classList.toggle('bbb-profile-v2-rendering',!!on);
    view.setAttribute('aria-busy',on?'true':'false');
  }

  if(location.pathname.startsWith('/player/'))bbbProfileRenderGate(true);

  async function bbbProfileCollegeData(slug){
    const found=typeof profileFind==='function'?profileFind(slug):null;
    if(!found)return null;

    const rows=await bbbDb('site_profiles',`select=college&name=eq.${encodeURIComponent(found.name)}&limit=1`).catch(()=>[]);
    const college=(rows?.[0]?.college||'').trim();
    return college?{found,college}:null;
  }

  function bbbApplyProfileCollege(data){
    if(!data)return;
    const {found,college}=data;
    const norm=typeof profileNorm==='function'?profileNorm(found.name):String(found.name||'').toLowerCase();
    const dynasty=(typeof players!=='undefined'?players:[]).find(x=>(typeof profileNorm==='function'?profileNorm(x.name):String(x.name||'').toLowerCase())===norm)||null;
    const rookie=(typeof rookies!=='undefined'?rookies:[]).find(x=>(typeof profileNorm==='function'?profileNorm(x.name):String(x.name||'').toLowerCase())===norm)||null;
    const prospect=(typeof prospects!=='undefined'?prospects:[]).find(x=>(typeof profileNorm==='function'?profileNorm(x.name):String(x.name||'').toLowerCase())===norm)||null;

    const pos=dynasty?.pos||rookie?.pos||prospect?.pos||found.pos||'';
    const team=dynasty?.team||rookie?.team||'';
    const age=dynasty?.age??rookie?.age;
    const meta=document.querySelector('#profileMount .profile-meta');
    if(!meta)return;

    meta.innerHTML=[
      pos?`<span class="pos-chip">${bbbEsc(pos)}</span>`:'',
      team?bbbEsc(team):'',
      bbbEsc(college),
      age!=null?`Age ${bbbEsc(age)}`:''
    ].filter(Boolean).join(' • ');
  }

  const bbbProfileRenderWithCollege=profileRender;
  profileRender=async function(slug){
    bbbProfileRenderGate(true);
    const collegePromise=bbbProfileCollegeData(slug);
    try{
      await bbbProfileRenderWithCollege(slug);
      bbbApplyProfileCollege(await collegePromise);
    }finally{
      requestAnimationFrame(()=>requestAnimationFrame(()=>bbbProfileRenderGate(false)));
    }
  };
})();

// Fast profile data layer. The previous profile pipeline fetched the full profile
// table more than once and then waited on ranking history before starting four
// additional profile requests. Keep one metadata index in memory and load all
// player-specific detail in one cached Supabase RPC instead.
(function(){
  if(typeof bbbDb!=='function')return;

  const rawDb=bbbDb;
  const originalLoadAllProfiles=typeof bbbLoadAllProfiles==='function'?bbbLoadAllProfiles:null;
  const bundleCache=new Map();

  const profileIndexPromise=rawDb(
    'site_profiles',
    'select=player_key,name,overall_breakdown,injury_status,injury_note,injury_updated,latest_weekly_update,weekly_update_date,college'
  ).then(rows=>{
    const map=new Map();
    (rows||[]).forEach(r=>{
      const key=typeof profileNorm==='function'?profileNorm(r.name):String(r.name||'').toLowerCase();
      const item={
        playerKey:r.player_key||'',
        name:r.name||'',
        overview:r.overall_breakdown||'',
        injuryStatus:r.injury_status||'',
        injuryNote:r.injury_note||'',
        injuryUpdated:r.injury_updated||'',
        latestUpdate:r.latest_weekly_update||'',
        updateDate:r.weekly_update_date||'',
        college:r.college||''
      };
      const existing=map.get(key);
      if(!existing||(!existing.overview&&item.overview))map.set(key,item);
    });
    return map;
  }).catch(async err=>{
    console.warn('BBB profile metadata preload failed',err);
    if(originalLoadAllProfiles)return originalLoadAllProfiles();
    return new Map();
  });

  async function loadBundle(playerKey){
    const key=String(playerKey||'').trim();
    if(!key)return {profile:null,stats:[],mover:null,updates:[],marketHistory:[],rankingHistory:[]};
    if(!bundleCache.has(key)){
      bundleCache.set(key,rawDb('rpc/site_player_profile_bundle',`p_player_key=${encodeURIComponent(key)}`)
        .then(raw=>{
          const b=Array.isArray(raw)?(raw[0]||{}):(raw||{});
          return {
            profile:b.profile||null,
            stats:Array.isArray(b.stats)?b.stats:[],
            mover:b.mover||null,
            updates:Array.isArray(b.updates)?b.updates:[],
            marketHistory:Array.isArray(b.marketHistory)?b.marketHistory:[],
            rankingHistory:Array.isArray(b.rankingHistory)?b.rankingHistory:[]
          };
        })
        .catch(err=>{
          bundleCache.delete(key);
          throw err;
        }));
    }
    return bundleCache.get(key);
  }

  if(originalLoadAllProfiles){
    bbbLoadAllProfiles=async function(){return profileIndexPromise};
  }

  if(typeof bbbV2Load==='function'){
    bbbV2Load=async function(playerKey){
      const b=await loadBundle(playerKey);
      return {stats:b.stats,mover:b.mover,updates:b.updates,marketHistory:b.marketHistory};
    };
  }
  if(typeof bbbLoadRankingHistory==='function'){
    bbbLoadRankingHistory=async function(playerKey){
      const b=await loadBundle(playerKey);
      return b.rankingHistory;
    };
  }

  // profile-college.js asks for a separate college query while the page is gated.
  // Serve that lookup from the in-memory profile index so it cannot hold up paint.
  bbbDb=async function(table,query=''){
    if(table==='site_profiles'&&query.startsWith('select=college&name=eq.')){
      try{
        const match=query.match(/name=eq\.([^&]+)/);
        const name=match?decodeURIComponent(match[1]):'';
        const map=await profileIndexPromise;
        const norm=typeof profileNorm==='function'?profileNorm(name):String(name||'').toLowerCase();
        const p=map.get(norm);
        if(p)return [{college:p.college||''}];
      }catch(err){console.warn('BBB cached college lookup failed',err)}
    }
    return rawDb(table,query);
  };

  function prefetchKey(key){
    if(key)loadBundle(key).catch(()=>{});
  }
  function prefetchTarget(target){
    if(!(target instanceof Element))return;
    const keyed=target.closest('[data-player-key]');
    if(keyed?.dataset?.playerKey){prefetchKey(keyed.dataset.playerKey);return;}
    const named=target.closest('[data-player]');
    const name=named?.dataset?.player;
    if(!name)return;
    profileIndexPromise.then(map=>{
      const norm=typeof profileNorm==='function'?profileNorm(name):String(name||'').toLowerCase();
      prefetchKey(map.get(norm)?.playerKey);
    }).catch(()=>{});
  }

  // Start the profile request just before a tap/click. Intentional desktop hover
  // starts it even earlier, making many opens feel immediate.
  document.addEventListener('pointerdown',e=>prefetchTarget(e.target),true);
  let hoverTimer=null;
  document.addEventListener('pointerover',e=>{
    if(e.pointerType&&e.pointerType!=='mouse')return;
    clearTimeout(hoverTimer);
    const target=e.target;
    hoverTimer=setTimeout(()=>prefetchTarget(target),120);
  },true);
  document.addEventListener('pointerout',()=>clearTimeout(hoverTimer),true);

  const direct=location.pathname.match(/^\/player\/([^/]+)/);
  if(direct)prefetchKey(decodeURIComponent(direct[1]));
})();
