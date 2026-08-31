// Profile V2 data resilience: keep independent feeds from blanking one another.
(function(){
  const wait=ms=>new Promise(r=>setTimeout(r,ms));

  async function bbbV2FetchSafe(table,query,fallback){
    try{return await bbbDb(table,query)}
    catch(first){
      console.warn('BBB Profile V2 retry',table,first);
      await wait(250);
      try{return await bbbDb(table,query)}
      catch(second){console.error('BBB Profile V2 data unavailable',table,second);return fallback}
    }
  }

  bbbV2Load=async function(playerKey){
    const key=encodeURIComponent(playerKey);
    const [stats,movers,updates,marketHistory]=await Promise.all([
      bbbV2FetchSafe('site_player_season_stats',`select=*&player_key=eq.${key}&order=season.desc`,[]),
      bbbV2FetchSafe('site_movers',`select=*&player_key=eq.${key}&limit=1`,[]),
      bbbV2FetchSafe('site_updates',`select=id,update_date,update_type,update_text,injury_status,rank_impact&player_key=eq.${key}&order=update_date.desc,id.desc&limit=8`,[]),
      bbbV2FetchSafe('site_market_history',`select=snapshot_date,market_rank,bbb_rank,created_at,snapshot_kind&player_key=eq.${key}&order=snapshot_date.asc,created_at.asc&limit=60`,[])
    ]);
    return {stats:stats||[],mover:movers?.[0]||null,updates:updates||[],marketHistory:marketHistory||[]};
  };

  bbbLoadRankingHistory=async function(playerKey){
    if(!playerKey)return [];
    const key=encodeURIComponent(playerKey);
    return bbbV2FetchSafe('site_ranking_history',`select=snapshot_date,overall_rank,position_rank,fp_sf_rank,bbb_vs_fp,market_view,created_at,snapshot_kind&player_key=eq.${key}&order=snapshot_date.asc,created_at.asc`,[]);
  };
})();
