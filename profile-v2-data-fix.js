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

// Make it visually obvious whether Bobby moved a player or consensus moved.
(function(){
  if(typeof bbbV2TrendCard!=='function')return;

  if(!document.querySelector('#bbb-profile-trend-clarity-styles')){
    const style=document.createElement('style');
    style.id='bbb-profile-trend-clarity-styles';
    style.textContent=`
      .bbb-v2-clarity-card .bbb-v2-card-head{margin-bottom:18px}
      .bbb-v2-clarity-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .bbb-v2-clarity-panel{border:1px solid #1b392d;background:#08110d;border-radius:14px;padding:18px;min-width:0}
      .bbb-v2-clarity-panel>span{display:block;color:#75887d;font-size:9px;font-weight:950;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px}
      .bbb-v2-clarity-current{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;padding-bottom:14px;border-bottom:1px solid #173027}
      .bbb-v2-clarity-current strong{font-size:30px;line-height:1;color:#f3f7f4}
      .bbb-v2-clarity-current small{color:#6c8075;font-size:9px;text-align:right}
      .bbb-v2-clarity-moves{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:13px}
      .bbb-v2-clarity-move{min-width:0}
      .bbb-v2-clarity-move>span:first-child{display:block;color:#63786c;font-size:8px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px}
      .bbb-v2-clarity-move .bbb-v2-move{margin:0!important}
      .bbb-v2-clarity-gap{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:18px;border-color:#24513a;background:linear-gradient(135deg,#09150f,#08100c)}
      .bbb-v2-clarity-gap-copy{min-width:0}
      .bbb-v2-clarity-gap-copy>span{display:block;color:#75887d;font-size:9px;font-weight:950;letter-spacing:.1em;text-transform:uppercase;margin-bottom:7px}
      .bbb-v2-clarity-gap-copy strong{display:block;font-size:30px;line-height:1;color:#eef5f1;margin-bottom:7px}
      .bbb-v2-clarity-gap-copy strong.positive{color:#79dfa8}.bbb-v2-clarity-gap-copy strong.negative{color:#ef8c8c}
      .bbb-v2-clarity-gap-copy p{margin:0;color:#7f9288;font-size:10px;line-height:1.5}
      .bbb-v2-clarity-explainer{margin-top:12px;padding:11px 13px;border-left:3px solid #2f7753;background:#08120d;color:#81938a;font-size:9px;line-height:1.55}
      @media(max-width:560px){
        .bbb-v2-clarity-panel{padding:14px}
        .bbb-v2-clarity-current{display:block}
        .bbb-v2-clarity-current strong{font-size:25px}
        .bbb-v2-clarity-current small{display:block;text-align:left;margin-top:6px}
        .bbb-v2-clarity-moves{grid-template-columns:1fr;gap:9px}
        .bbb-v2-clarity-gap{display:block}
        .bbb-v2-clarity-gap-copy strong{font-size:27px}
        .bbb-v2-clarity-gap .bbb-v2-market{display:inline-flex;margin-top:12px}
      }
    `;
    document.head.appendChild(style);
  }

  bbbV2TrendCard=function(m){
    if(!m)return '';
    const bbbRank=bbbV2Num(m.current_rank);
    const consensusRank=bbbV2Num(m.current_market_rank);
    const gap=bbbV2Num(m.current_gap);
    const absGap=gap==null?null:Math.abs(gap);
    const gapText=gap==null
      ? 'Consensus comparison is still building.'
      : gap>0
        ? `BBB ranks him ${absGap} spot${absGap===1?'':'s'} higher than consensus.`
        : gap<0
          ? `Consensus ranks him ${absGap} spot${absGap===1?'':'s'} higher than BBB.`
          : 'BBB and consensus currently have the same rank.';

    return `<section class="profile-card full bbb-v2-trend-card bbb-v2-clarity-card">
      <div class="profile-card-kicker">VALUE & CONSENSUS</div>
      <div class="bbb-v2-card-head">
        <div><h2>Your rank vs. consensus.</h2><p>BBB movement shows changes Bobby made to the board. Consensus movement shows changes in the FantasyCalc market ranking.</p></div>
        ${bbbV2MarketBadge(m.market_view)}
      </div>
      <div class="bbb-v2-clarity-grid">
        <div class="bbb-v2-clarity-panel">
          <span>BOBBY'S BIG BOARD</span>
          <div class="bbb-v2-clarity-current"><strong>${bbbRank==null?'—':'#'+bbbEsc(bbbRank)}</strong><small>Current BBB rank</small></div>
          <div class="bbb-v2-clarity-moves">
            <div class="bbb-v2-clarity-move"><span>7D movement</span>${bbbV2Move(m.bbb_move_7d)}</div>
            <div class="bbb-v2-clarity-move"><span>30D movement</span>${bbbV2Move(m.bbb_move_30d)}</div>
          </div>
        </div>
        <div class="bbb-v2-clarity-panel">
          <span>CONSENSUS · FANTASYCALC</span>
          <div class="bbb-v2-clarity-current"><strong>${consensusRank==null?'UR':'#'+bbbEsc(consensusRank)}</strong><small>Current consensus rank</small></div>
          <div class="bbb-v2-clarity-moves">
            <div class="bbb-v2-clarity-move"><span>7D movement</span>${bbbV2Move(m.market_move_7d)}</div>
            <div class="bbb-v2-clarity-move"><span>30D movement</span>${bbbV2Move(m.market_move_30d)}</div>
          </div>
        </div>
        <div class="bbb-v2-clarity-panel bbb-v2-clarity-gap">
          <div class="bbb-v2-clarity-gap-copy">
            <span>BBB VS CONSENSUS</span>
            <strong class="${gap>0?'positive':gap<0?'negative':''}">${gap==null?'—':(gap>0?'+':'')+bbbEsc(gap)}</strong>
            <p>${bbbEsc(gapText)}</p>
          </div>
          ${bbbV2MarketBadge(m.market_view)}
        </div>
      </div>
      <div class="bbb-v2-clarity-explainer">Red or green movement inside the consensus panel only reflects consensus changing. It does not mean Bobby moved the player on the Big Board.</div>
    </section>`;
  };
})();
