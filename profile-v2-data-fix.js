// Profile V2 data resilience now routes through the shared BBB core data layer.
(function(){
  bbbV2Load=async function(playerKey){
    const key=encodeURIComponent(playerKey);
    const [stats,movers,updates,marketHistory]=await Promise.all([
      bbbDbSafe('site_player_season_stats',`select=*&player_key=eq.${key}&order=season.desc`,[]),
      bbbDbSafe('site_movers',`select=*&player_key=eq.${key}&limit=1`,[]),
      bbbDbSafe('site_updates',`select=id,update_date,update_type,update_text,injury_status,rank_impact&player_key=eq.${key}&order=update_date.desc,id.desc&limit=8`,[]),
      bbbDbSafe('site_market_history',`select=snapshot_date,market_rank,bbb_rank,created_at,snapshot_kind&player_key=eq.${key}&order=snapshot_date.asc,created_at.asc&limit=60`,[])
    ]);
    return {stats:stats||[],mover:movers?.[0]||null,updates:updates||[],marketHistory:marketHistory||[]};
  };

  bbbLoadRankingHistory=async function(playerKey){
    if(!playerKey)return [];
    const key=encodeURIComponent(playerKey);
    return bbbDbSafe('site_ranking_history',`select=snapshot_date,overall_rank,position_rank,fp_sf_rank,bbb_vs_fp,market_view,created_at,snapshot_kind&player_key=eq.${key}&order=snapshot_date.asc,created_at.asc`,[]);
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

// Player Timeline V2: merge meaningful BBB ranking changes with preserved player news.
(function(){
  if(typeof bbbV2UpdatesCard!=='function'||typeof bbbDbSafe!=='function')return;

  function timelineNum(v){const n=Number(v);return Number.isFinite(n)?n:null}
  function timelineStamp(v,fallback){const n=Date.parse(v||'');return Number.isFinite(n)?n:fallback||0}

  function buildRankingEvents(rows){
    const byDay=new Map();
    (rows||[]).forEach(row=>{
      const rank=timelineNum(row.overall_rank);
      const date=String(row.snapshot_date||'');
      if(rank==null||!date)return;
      const stamp=timelineStamp(row.created_at,timelineStamp(date+'T23:59:59Z'));
      const existing=byDay.get(date);
      if(!existing||stamp>=existing._stamp)byDay.set(date,{...row,_stamp:stamp,_rank:rank});
    });

    const days=[...byDay.values()].sort((a,b)=>a._stamp-b._stamp||String(a.snapshot_date).localeCompare(String(b.snapshot_date)));
    const events=[];
    let previous=null;
    days.forEach(row=>{
      const rank=row._rank;
      if(previous!=null&&rank!==previous){
        const move=previous-rank;
        const amount=Math.abs(move);
        events.push({
          id:`ranking-${row.snapshot_date}-${previous}-${rank}`,
          update_date:row.snapshot_date,
          update_type:'Ranking',
          update_text:`BBB moved ${move>0?'up':'down'} ${amount} spot${amount===1?'':'s'}, from #${previous} to #${rank}.`,
          injury_status:null,
          rank_impact:`#${previous} → #${rank}`,
          _timeline_kind:'ranking',
          _from_rank:previous,
          _to_rank:rank,
          _move:move,
          _sort:row._stamp
        });
      }
      previous=rank;
    });
    return events;
  }

  function mergeTimeline(updates,history){
    const news=(updates||[]).map(u=>({
      ...u,
      _timeline_kind:'news',
      _sort:timelineStamp(String(u.update_date||'')+'T12:00:00Z')+(timelineNum(u.id)||0)/1000
    }));
    return [...news,...buildRankingEvents(history)]
      .sort((a,b)=>b._sort-a._sort||String(b.update_date||'').localeCompare(String(a.update_date||'')));
  }

  bbbV2Load=async function(playerKey){
    const key=encodeURIComponent(playerKey);
    const [stats,movers,updates,marketHistory,rankingHistory]=await Promise.all([
      bbbDbSafe('site_player_season_stats',`select=*&player_key=eq.${key}&order=season.desc`,[]),
      bbbDbSafe('site_movers',`select=*&player_key=eq.${key}&limit=1`,[]),
      bbbDbSafe('site_updates',`select=id,update_date,update_type,update_text,injury_status,rank_impact&player_key=eq.${key}&order=update_date.desc,id.desc&limit=40`,[]),
      bbbDbSafe('site_market_history',`select=snapshot_date,market_rank,bbb_rank,created_at,snapshot_kind&player_key=eq.${key}&order=snapshot_date.asc,created_at.asc&limit=60`,[]),
      bbbLoadRankingHistory(playerKey)
    ]);
    return {
      stats:stats||[],
      mover:movers?.[0]||null,
      updates:mergeTimeline(updates||[],rankingHistory||[]),
      marketHistory:marketHistory||[],
      rankingHistory:rankingHistory||[]
    };
  };

  const originalUpdateClass=bbbV2UpdateClass;
  bbbV2UpdateClass=function(v){
    if(String(v||'').toLowerCase()==='ranking')return'ranking';
    return originalUpdateClass(v);
  };

  bbbV2UpdatesCard=function(events){
    if(!events.length)return '';
    const visible=6;
    const newsCount=events.filter(e=>e._timeline_kind!=='ranking').length;
    const rankCount=events.filter(e=>e._timeline_kind==='ranking').length;
    const rows=events.map((u,i)=>{
      const ranking=u._timeline_kind==='ranking';
      const movement=timelineNum(u._move);
      const movementLabel=ranking&&movement!=null
        ? `${movement>0?'↑':'↓'} ${Math.abs(movement)}`
        : '';
      const right=ranking
        ? `<small class="bbb-timeline-rank-change">#${bbbEsc(u._from_rank)} → #${bbbEsc(u._to_rank)}${movementLabel?` · ${bbbEsc(movementLabel)}`:''}</small>`
        : u.injury_status?`<small>${bbbEsc(u.injury_status)}</small>`:'';
      return `<div class="bbb-v2-timeline-item ${ranking?'ranking-event':''}${i>=visible?' bbb-v2-timeline-more':''}">
        <div class="bbb-v2-timeline-rail"><span></span></div>
        <div class="bbb-v2-timeline-body">
          <div class="bbb-v2-timeline-head"><div><span class="bbb-v2-update-type ${bbbV2UpdateClass(u.update_type)}">${bbbEsc(ranking?'BBB Ranking':u.update_type||'Update')}</span><time>${bbbEsc(bbbV2Date(u.update_date))}</time></div>${right}</div>
          <p>${bbbEsc(u.update_text||'')}</p>
        </div>
      </div>`;
    }).join('');
    const more=events.length-visible;
    return `<section class="profile-card full bbb-v2-updates-card bbb-timeline-card">
      <div class="profile-card-kicker">PLAYER TIMELINE</div>
      <div class="bbb-v2-card-head">
        <div><h2>What changed and when.</h2><p>Meaningful player news and Bobby's Big Board ranking moves together in one chronological history.</p></div>
        <span class="bbb-v2-count">${events.length} EVENT${events.length===1?'':'S'}</span>
      </div>
      <div class="bbb-timeline-summary"><span>${newsCount} NEWS</span><span>${rankCount} BBB RANK MOVE${rankCount===1?'':'S'}</span></div>
      <div class="bbb-v2-timeline">${rows}</div>
      ${more>0?`<button type="button" class="bbb-timeline-toggle" aria-expanded="false"><span>Show full timeline</span><small>${more} more event${more===1?'':'s'}</small></button>`:''}
    </section>`;
  };

  if(!document.querySelector('#bbb-player-timeline-v2-styles')){
    const style=document.createElement('style');
    style.id='bbb-player-timeline-v2-styles';
    style.textContent=`
      .bbb-timeline-summary{display:flex;gap:7px;flex-wrap:wrap;margin:-7px 0 16px 29px}
      .bbb-timeline-summary span{display:inline-flex;border:1px solid #1d3d30;background:#08120e;color:#70877a;border-radius:999px;padding:5px 8px;font-size:7px;font-weight:950;letter-spacing:.07em}
      .bbb-v2-update-type.ranking{background:#0d2924;color:#79dfc1;border:1px solid #22695b}
      .bbb-v2-timeline-item.ranking-event .bbb-v2-timeline-rail span{background:#68d8ba;box-shadow:0 0 0 4px #0a1a12}
      .bbb-timeline-rank-change{color:#91d7be!important;font-weight:900;white-space:nowrap}
      .bbb-v2-timeline-more{display:none}
      .bbb-timeline-card.is-expanded .bbb-v2-timeline-more{display:grid}
      .bbb-timeline-toggle{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:2px;padding:10px 12px;border:1px solid #24483a;background:#09150f;color:#95d8b2;border-radius:10px;cursor:pointer;font:inherit}
      .bbb-timeline-toggle:hover{border-color:#50ce8e;color:#fff}
      .bbb-timeline-toggle span{font-size:9px;font-weight:950;text-transform:uppercase;letter-spacing:.06em}
      .bbb-timeline-toggle small{font-size:8px;color:#657a6f}
      @media(max-width:560px){
        .bbb-timeline-summary{margin-left:0}
        .bbb-timeline-rank-change{display:block;margin-top:5px;white-space:normal}
        .bbb-timeline-toggle{display:block}
        .bbb-timeline-toggle small{display:block;margin-top:4px}
      }
    `;
    document.head.appendChild(style);
  }

  document.addEventListener('click',e=>{
    const button=e.target.closest('.bbb-timeline-toggle');
    if(!button)return;
    const card=button.closest('.bbb-timeline-card');
    if(!card)return;
    const expanded=card.classList.toggle('is-expanded');
    button.setAttribute('aria-expanded',String(expanded));
    const label=button.querySelector('span');
    if(label)label.textContent=expanded?'Show recent only':'Show full timeline';
  });
})();