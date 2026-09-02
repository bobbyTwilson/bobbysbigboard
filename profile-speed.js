// Faster player-profile navigation: preload profile metadata and collapse the
// expensive profile detail requests into one cached Supabase RPC per player.
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

  // The previous renderer downloaded all profiles on every click. Keep one
  // preloaded in-memory index for the entire browsing session instead.
  if(originalLoadAllProfiles){
    bbbLoadAllProfiles=async function(){return profileIndexPromise};
  }

  // Profile V2 and ranking history used to hit separate endpoints in sequence.
  // Both now share one bundle request, so the second stage is already resolved.
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

  // College is already included in the preloaded profile index. Intercept the
  // one narrow lookup used by profile-college.js so it does not add another RTT.
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
    if(!key)return;
    loadBundle(key).catch(()=>{});
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

  // Start the request on touch/mouse-down before the click handler begins the
  // transition. Desktop hover gets a short delay so casual pointer movement does
  // not fan out requests across the whole table.
  document.addEventListener('pointerdown',e=>prefetchTarget(e.target),true);
  let hoverTimer=null;
  document.addEventListener('pointerover',e=>{
    if(e.pointerType&&e.pointerType!=='mouse')return;
    clearTimeout(hoverTimer);
    const target=e.target;
    hoverTimer=setTimeout(()=>prefetchTarget(target),120);
  },true);
  document.addEventListener('pointerout',()=>clearTimeout(hoverTimer),true);

  // Direct /player/{player_key} loads can start the bundle immediately while
  // the rest of the page data is still finishing its own initialization.
  const direct=location.pathname.match(/^\/player\/([^/]+)/);
  if(direct)prefetchKey(decodeURIComponent(direct[1]));
})();
