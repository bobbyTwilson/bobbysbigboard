let bbbProfileV2Token=0;

function bbbV2Num(v){const n=Number(v);return Number.isFinite(n)?n:null}
function bbbV2Int(v){const n=bbbV2Num(v);return n==null?'—':Math.round(n).toLocaleString()}
function bbbV2Dec(v,d=1){const n=bbbV2Num(v);return n==null?'—':n.toFixed(d)}
function bbbV2Date(v){if(!v)return '';return new Date(v+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
function bbbV2TradeValue(rank){const n=bbbV2Num(rank);return n==null?null:Math.round(10000*Math.exp(-.012*(n-1)))}
function bbbV2Move(v){const n=bbbV2Num(v);if(n==null)return '<span class="bbb-v2-move neutral">Baseline</span>';if(n>0)return `<span class="bbb-v2-move up">↑ ${bbbEsc(n)}</span>`;if(n<0)return `<span class="bbb-v2-move down">↓ ${bbbEsc(Math.abs(n))}</span>`;return '<span class="bbb-v2-move neutral">No change</span>'}
function bbbV2MarketBadge(v){const s=String(v||'').toUpperCase();if(s.includes('BUY'))return '<span class="bbb-v2-market buy">BBB BUY</span>';if(s.includes('FADE'))return '<span class="bbb-v2-market fade">BBB FADE</span>';return '<span class="bbb-v2-market market">≈ MARKET</span>'}
function bbbV2UpdateClass(v){const s=String(v||'').toLowerCase();if(s==='injury')return'injury';if(s==='performance')return'performance';if(s==='role')return'role';if(s==='roster')return'roster';return'other'}

async function bbbV2Load(playerKey){
  const key=encodeURIComponent(playerKey);
  const [stats,movers,updates,marketHistory]=await Promise.all([
    bbbDb('site_player_season_stats',`select=*&player_key=eq.${key}&order=season.desc`),
    bbbDb('site_movers',`select=*&player_key=eq.${key}&limit=1`),
    bbbDb('site_updates',`select=id,update_date,update_type,update_text,injury_status,rank_impact&player_key=eq.${key}&order=update_date.desc,id.desc&limit=8`),
    bbbDb('site_market_history',`select=snapshot_date,market_rank,bbb_rank,created_at,snapshot_kind&player_key=eq.${key}&order=snapshot_date.asc,created_at.asc&limit=60`)
  ]);
  return {stats:stats||[],mover:movers?.[0]||null,updates:updates||[],marketHistory:marketHistory||[]};
}

function bbbV2SnapshotHtml(player,profile,mover,rookie,prospect){
  const rank=bbbV2Num(player?.rank),pos=player?.pos||prospect?.pos||'',pr=bbbV2Num(player?.pr);
  const trade=bbbV2TradeValue(rank),gap=bbbV2Num(player?.gap);
  const status=(profile?.injuryStatus||player?.injuryStatus||'Healthy').trim()||'Healthy';
  const healthy=/healthy/i.test(status);
  const latest=(profile?.latestUpdate||profile?.injuryNote||player?.latestUpdate||'').trim();
  const date=profile?.updateDate||profile?.injuryUpdated||player?.updateDate||'';
  const actionKey=profile?.playerKey||'';
  return `
    <div class="profile-card-kicker">DYNASTY SNAPSHOT</div>
    <div class="bbb-v2-snapshot-head">
      <div><h2>Current dynasty value.</h2><p>BBB ranking, market context, health and recent movement in one view.</p></div>
      <div class="bbb-v2-actions">${actionKey?`<a href="/#compare?left=${encodeURIComponent(actionKey)}">Compare Player</a>`:''}<a href="/#trade">Trade Calculator</a></div>
    </div>
    <div class="bbb-v2-stat-grid">
      <div><span>BBB Rank</span><strong>${rank==null?'—':'#'+rank}</strong>${bbbV2Move(mover?.bbb_move_7d)}</div>
      <div><span>Position Rank</span><strong>${pos}${pr??'—'}</strong></div>
      <div><span>BBB Trade Value</span><strong>${trade==null?'—':trade.toLocaleString()}</strong></div>
      <div><span>Market Rank</span><strong>${player?.market==null?'UR':'#'+bbbEsc(player.market)}</strong></div>
      <div><span>BBB vs Market</span><strong class="${gap>0?'bbb-v2-positive':gap<0?'bbb-v2-negative':''}">${gap==null?'—':(gap>0?'+':'')+gap}</strong>${bbbV2MarketBadge(player?.view)}</div>
      <div><span>Age</span><strong>${player?.age??'—'}</strong>${rookie?`<small>Rookie #${bbbEsc(rookie.rank)}</small>`:''}</div>
      <div><span>Injury Status</span><strong class="bbb-v2-health ${healthy?'healthy':'watch'}">${bbbEsc(status)}</strong></div>
      <div><span>Prospect Grade</span><strong>${prospect?.grade??'—'}</strong>${prospect?.comp?`<small>Comp: ${bbbEsc(prospect.comp)}</small>`:''}</div>
    </div>
    ${latest?`<div class="bbb-v2-latest"><div><span>LATEST UPDATE${date?' · '+bbbEsc(bbbV2Date(date)):''}</span><strong>${bbbEsc(status)}</strong></div><p>${bbbEsc(latest)}</p></div>`:''}
  `;
}

function bbbV2MarketRelation(m){
  const cb=bbbV2Num(m?.current_rank),cm=bbbV2Num(m?.current_market_rank),sb=bbbV2Num(m?.tracking_start_rank),sm=bbbV2Num(m?.market_tracking_start_rank);
  if([cb,cm,sb,sm].some(x=>x==null))return 'Market history is still building.';
  const current=Math.abs(cm-cb),start=Math.abs(sm-sb);
  if(current<start)return `The market has moved ${Math.round(start-current)} spot${Math.round(start-current)===1?'':'s'} closer to BBB since tracking began.`;
  if(current>start)return `The market is ${Math.round(current-start)} spot${Math.round(current-start)===1?'':'s'} farther from BBB than when tracking began.`;
  return 'The market-to-BBB gap is unchanged since tracking began.';
}

function bbbV2TrendCard(m,marketHistory){
  if(!m)return '';
  const gap=bbbV2Num(m.current_gap);
  const firstMarket=(marketHistory||[]).find(x=>x.market_rank!=null),lastMarket=[...(marketHistory||[])].reverse().find(x=>x.market_rank!=null);
  const tracked=firstMarket&&lastMarket&&firstMarket!==lastMarket?bbbV2Num(firstMarket.market_rank)-bbbV2Num(lastMarket.market_rank):null;
  return `<section class="profile-card full bbb-v2-trend-card">
    <div class="profile-card-kicker">VALUE & MARKET TREND</div><div class="bbb-v2-card-head"><div><h2>Where the value is moving.</h2><p>BBB movement is independent from the market. Positive movement means the player climbed the ranking.</p></div>${bbbV2MarketBadge(m.market_view)}</div>
    <div class="bbb-v2-trend-grid">
      <div><span>BBB · 7D</span><strong>${bbbV2Move(m.bbb_move_7d)}</strong><small>${m.bbb_7d_ref_rank?`From #${bbbEsc(m.bbb_7d_ref_rank)}`:'Building history'}</small></div>
      <div><span>BBB · 30D</span><strong>${bbbV2Move(m.bbb_move_30d)}</strong><small>${m.bbb_30d_ref_rank?`From #${bbbEsc(m.bbb_30d_ref_rank)}`:'Building history'}</small></div>
      <div><span>Market · 7D</span><strong>${bbbV2Move(m.market_move_7d)}</strong><small>${m.market_7d_ref_rank?`From #${bbbEsc(m.market_7d_ref_rank)}`:'Building history'}</small></div>
      <div><span>Market · 30D</span><strong>${bbbV2Move(m.market_move_30d)}</strong><small>${m.market_30d_ref_rank?`From #${bbbEsc(m.market_30d_ref_rank)}`:'Building history'}</small></div>
      <div><span>Current Gap</span><strong class="${gap>0?'bbb-v2-positive':gap<0?'bbb-v2-negative':''}">${gap==null?'—':(gap>0?'+':'')+gap}</strong><small>${gap>0?'BBB ranks him higher':gap<0?'Market ranks him higher':'Same rank'}</small></div>
      <div><span>Market Tracking</span><strong>${tracked==null?'Baseline':bbbV2Move(tracked)}</strong><small>${bbbEsc(bbbV2MarketRelation(m))}</small></div>
    </div>
  </section>`;
}

function bbbV2CareerSummary(stats,pos){
  if(!stats.length)return '';
  const totalGames=stats.reduce((s,x)=>s+(bbbV2Num(x.games)||0),0);
  const totalPpr=stats.reduce((s,x)=>s+(bbbV2Num(x.fantasy_points_ppr)||0),0);
  const withFinish=stats.filter(x=>bbbV2Num(x.position_finish)!=null);
  const best=withFinish.sort((a,b)=>bbbV2Num(a.position_finish)-bbbV2Num(b.position_finish)||bbbV2Num(b.fantasy_points_ppr)-bbbV2Num(a.fantasy_points_ppr))[0];
  const peak=[...stats].sort((a,b)=>bbbV2Num(b.fantasy_points_ppr)-bbbV2Num(a.fantasy_points_ppr))[0];
  return `<div class="bbb-v2-career-summary">
    <div><span>NFL Seasons</span><strong>${stats.length}</strong></div>
    <div><span>Career PPR</span><strong>${bbbV2Dec(totalPpr,1)}</strong></div>
    <div><span>PPR / Game</span><strong>${totalGames?bbbV2Dec(totalPpr/totalGames,1):'—'}</strong></div>
    <div><span>Best Finish</span><strong>${best?bbbEsc(pos)+'#'+bbbEsc(best.position_finish):'—'}</strong>${best?`<small>${bbbEsc(best.season)}</small>`:''}</div>
    <div><span>Best PPR Season</span><strong>${peak?bbbV2Dec(peak.fantasy_points_ppr,1):'—'}</strong>${peak?`<small>${bbbEsc(peak.season)}</small>`:''}</div>
  </div>`;
}

function bbbV2CareerColumns(pos){
  if(pos==='QB')return [
    ['Season','season'],['Team','team'],['GP','games'],['CMP','completions'],['ATT','attempts'],['Pass Yds','passing_yards'],['Pass TD','passing_tds'],['INT','interceptions'],['Rush Yds','rushing_yards'],['Rush TD','rushing_tds'],['PPR','fantasy_points_ppr'],['Finish','finish']
  ];
  if(pos==='RB')return [
    ['Season','season'],['Team','team'],['GP','games'],['CAR','carries'],['Rush Yds','rushing_yards'],['Rush TD','rushing_tds'],['TGT','targets'],['REC','receptions'],['Rec Yds','receiving_yards'],['Rec TD','receiving_tds'],['PPR','fantasy_points_ppr'],['Finish','finish']
  ];
  return [
    ['Season','season'],['Team','team'],['GP','games'],['TGT','targets'],['REC','receptions'],['Rec Yds','receiving_yards'],['Rec TD','receiving_tds'],['Rush Yds','rushing_yards'],['Rush TD','rushing_tds'],['PPR','fantasy_points_ppr'],['Finish','finish']
  ];
}
function bbbV2CareerValue(row,key,pos){
  if(key==='fantasy_points_ppr')return bbbV2Dec(row[key],1);
  if(key==='finish')return row.position_finish==null?'—':`${bbbEsc(pos)}${bbbEsc(row.position_finish)}`;
  if(key==='season'||key==='team')return bbbEsc(row[key]??'—');
  return bbbV2Int(row[key]);
}
function bbbV2CareerCard(stats,pos){
  const safePos=pos||stats?.[0]?.position||'';
  if(!stats.length)return `<section class="profile-card full bbb-v2-career-card"><div class="profile-card-kicker">CAREER FANTASY PRODUCTION</div><div class="bbb-v2-card-head"><div><h2>Regular-season fantasy history.</h2><p>Full PPR scoring. Positional finish is calculated against the full NFL player pool for that season.</p></div><span class="bbb-v2-source">NFLVERSE</span></div><div class="bbb-v2-career-empty"><strong>No NFL regular-season fantasy production yet.</strong><span>This section will populate automatically once the player records an NFL season.</span></div></section>`;
  const cols=bbbV2CareerColumns(safePos);
  return `<section class="profile-card full bbb-v2-career-card"><div class="profile-card-kicker">CAREER FANTASY PRODUCTION</div><div class="bbb-v2-card-head"><div><h2>Regular-season fantasy history.</h2><p>Full PPR scoring • NFL regular season only • Finish is within position.</p></div><span class="bbb-v2-source">NFLVERSE</span></div>${bbbV2CareerSummary(stats,safePos)}<div class="bbb-v2-career-table-wrap"><table class="bbb-v2-career-table"><thead><tr>${cols.map(c=>`<th>${bbbEsc(c[0])}</th>`).join('')}</tr></thead><tbody>${stats.map(row=>`<tr>${cols.map(c=>`<td class="${c[1]==='fantasy_points_ppr'?'ppr':c[1]==='finish'?'finish':''}">${bbbV2CareerValue(row,c[1],safePos)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="bbb-v2-footnote">Fantasy points use standard full-PPR scoring. Historical team reflects the player's team for that season.</div></section>`;
}

function bbbV2UpdatesCard(updates){
  if(!updates.length)return '';
  return `<section class="profile-card full bbb-v2-updates-card"><div class="profile-card-kicker">PLAYER TIMELINE</div><div class="bbb-v2-card-head"><div><h2>What changed and when.</h2><p>The latest meaningful injury, performance, role and roster notes preserved in BBB.</p></div><span class="bbb-v2-count">${updates.length} RECENT</span></div><div class="bbb-v2-timeline">${updates.map((u,i)=>`<div class="bbb-v2-timeline-item"><div class="bbb-v2-timeline-rail"><span></span></div><div class="bbb-v2-timeline-body"><div class="bbb-v2-timeline-head"><div><span class="bbb-v2-update-type ${bbbV2UpdateClass(u.update_type)}">${bbbEsc(u.update_type||'Update')}</span><time>${bbbEsc(bbbV2Date(u.update_date))}</time></div>${u.injury_status?`<small>${bbbEsc(u.injury_status)}</small>`:''}</div><p>${bbbEsc(u.update_text||'')}</p></div></div>`).join('')}</div></section>`;
}

function bbbV2Arrange(grid,snapshot,trend,career,updates){
  const overview=grid.querySelector('.bbb-overview-card');
  const ranking=grid.querySelector('.bbb-ranking-card');
  const prospect=[...grid.querySelectorAll('.profile-card')].find(c=>/prospect profile/i.test(c.querySelector('.profile-card-kicker')?.textContent||''));
  const rookie=[...grid.querySelectorAll('.profile-card')].find(c=>/rookie/i.test(c.querySelector('.profile-card-kicker')?.textContent||''));
  const ordered=[snapshot,overview,trend,ranking,career,updates,rookie,prospect].filter(Boolean);
  ordered.forEach(n=>grid.appendChild(n));
}

async function bbbProfileV2Enhance(slug){
  const token=++bbbProfileV2Token;
  const found=typeof profileFind==='function'?profileFind(slug):null;
  if(!found)return;
  const profiles=await bbbLoadAllProfiles().catch(()=>null);
  if(token!==bbbProfileV2Token)return;
  const profile=profiles?.get(profileNorm(found.name));
  if(!profile?.playerKey)return;
  const player=(typeof players!=='undefined'?players:[]).find(x=>profileNorm(x.name)===profileNorm(found.name))||null;
  const rookie=(typeof rookies!=='undefined'?rookies:[]).find(x=>profileNorm(x.name)===profileNorm(found.name))||null;
  const prospect=(typeof prospects!=='undefined'?prospects:[]).find(x=>profileNorm(x.name)===profileNorm(found.name))||null;
  const data=await bbbV2Load(profile.playerKey).catch(err=>{console.error('Profile V2 data',err);return {stats:[],mover:null,updates:[],marketHistory:[]}});
  if(token!==bbbProfileV2Token)return;
  const mount=document.querySelector('#profileMount');const grid=mount?.querySelector('.profile-grid');if(!grid)return;

  let snapshot=[...grid.querySelectorAll('.profile-card')].find(c=>/dynasty snapshot/i.test(c.querySelector('.profile-card-kicker')?.textContent||''));
  if(!snapshot){snapshot=document.createElement('section');grid.prepend(snapshot)}
  snapshot.className='profile-card full bbb-v2-snapshot';
  snapshot.innerHTML=bbbV2SnapshotHtml(player,profile,data.mover,rookie,prospect);

  let trend=grid.querySelector('.bbb-v2-trend-card');
  const trendHtml=bbbV2TrendCard(data.mover,data.marketHistory);
  if(trendHtml){if(!trend){const temp=document.createElement('div');temp.innerHTML=trendHtml;trend=temp.firstElementChild}else trend.outerHTML=trendHtml;trend=grid.querySelector('.bbb-v2-trend-card')||trend}

  let career=grid.querySelector('.bbb-v2-career-card');
  const careerHtml=bbbV2CareerCard(data.stats,player?.pos||prospect?.pos||'');
  if(!career){const temp=document.createElement('div');temp.innerHTML=careerHtml;career=temp.firstElementChild}else{career.outerHTML=careerHtml;career=grid.querySelector('.bbb-v2-career-card')||career}

  let updateCard=grid.querySelector('.bbb-v2-updates-card');
  const updateHtml=bbbV2UpdatesCard(data.updates);
  if(updateHtml){if(!updateCard){const temp=document.createElement('div');temp.innerHTML=updateHtml;updateCard=temp.firstElementChild}else updateCard.outerHTML=updateHtml;updateCard=grid.querySelector('.bbb-v2-updates-card')||updateCard}else updateCard?.remove();

  [trend,career,updateCard].filter(n=>n&&!n.isConnected).forEach(n=>grid.appendChild(n));
  bbbV2Arrange(grid,snapshot,trend,career,updateCard);
}

(function bbbV2InjectStyles(){
  if(document.querySelector('#bbb-profile-v2-styles'))return;
  const s=document.createElement('style');s.id='bbb-profile-v2-styles';s.textContent=`
  .bbb-v2-snapshot,.bbb-v2-trend-card,.bbb-v2-career-card,.bbb-v2-updates-card{overflow:hidden}
  .bbb-v2-snapshot-head,.bbb-v2-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:22px;margin-bottom:18px}.bbb-v2-snapshot-head h2,.bbb-v2-card-head h2{margin:2px 0 5px}.bbb-v2-snapshot-head p,.bbb-v2-card-head p{margin:0;color:#7f9087;font-size:11px;line-height:1.55;max-width:640px}
  .bbb-v2-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.bbb-v2-actions a{display:inline-flex;align-items:center;justify-content:center;padding:9px 12px;border:1px solid #27513c;background:#0a1811;color:#9fe3bc;border-radius:9px;font-size:9px;font-weight:950;text-transform:uppercase;letter-spacing:.06em;text-decoration:none}.bbb-v2-actions a:hover{border-color:#50ce8e;color:#fff}
  .bbb-v2-stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.bbb-v2-stat-grid>div,.bbb-v2-trend-grid>div,.bbb-v2-career-summary>div{border:1px solid #193529;background:#08110d;border-radius:11px;padding:13px}.bbb-v2-stat-grid span,.bbb-v2-trend-grid span,.bbb-v2-career-summary span{display:block;color:#6d8075;font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px}.bbb-v2-stat-grid strong{display:block;color:#f0f5f2;font-size:18px;line-height:1.15}.bbb-v2-stat-grid small{display:block;color:#70877a;font-size:8px;margin-top:5px;line-height:1.3}.bbb-v2-positive{color:#71dfa5!important}.bbb-v2-negative{color:#ee8a8a!important}
  .bbb-v2-health{font-size:13px!important}.bbb-v2-health.healthy{color:#74e5a9!important}.bbb-v2-health.watch{color:#e6c66f!important}.bbb-v2-market{display:inline-flex!important;width:max-content!important;margin-top:6px!important;border-radius:999px;padding:4px 7px;font-size:8px!important;font-weight:950!important;letter-spacing:.03em!important}.bbb-v2-market.buy{background:#0a2b1d;color:#74e5a9;border:1px solid #176743}.bbb-v2-market.fade{background:#351717;color:#f08b8b;border:1px solid #743535}.bbb-v2-market.market{background:#18201c;color:#aab8b0;border:1px solid #34443b}
  .bbb-v2-move{display:inline-flex!important;width:max-content;border-radius:999px;padding:4px 7px;font-size:9px!important;font-weight:950!important;letter-spacing:0!important;text-transform:none!important;margin:5px 0 0!important}.bbb-v2-move.up{background:#0a2b1d;color:#74e5a9;border:1px solid #176743}.bbb-v2-move.down{background:#351717;color:#f08b8b;border:1px solid #743535}.bbb-v2-move.neutral{background:#18201c;color:#9cada4;border:1px solid #34443b}
  .bbb-v2-latest{margin-top:12px;border-left:3px solid #0a8f4d;background:#09140f;padding:14px 15px}.bbb-v2-latest>div{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:7px}.bbb-v2-latest span{color:#50d990;font-size:8px;font-weight:950;letter-spacing:.1em}.bbb-v2-latest strong{color:#a9b9b0;font-size:9px}.bbb-v2-latest p{margin:0;color:#ced8d2;font-size:11px;line-height:1.65}
  .bbb-v2-trend-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.bbb-v2-trend-grid strong{display:block;color:#e7efeb;font-size:16px;min-height:26px}.bbb-v2-trend-grid small{display:block;color:#6f8277;font-size:8px;line-height:1.45;margin-top:4px}
  .bbb-v2-source,.bbb-v2-count{flex:none;border:1px solid #24513a;background:#0a1811;color:#73dba4;border-radius:999px;padding:6px 9px;font-size:8px;font-weight:950;letter-spacing:.08em}
  .bbb-v2-career-summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-bottom:15px}.bbb-v2-career-summary strong{display:block;font-size:16px;color:#eef4f0}.bbb-v2-career-summary small{display:block;color:#6f8277;font-size:8px;margin-top:3px}
  .bbb-v2-career-table-wrap{overflow-x:auto;border:1px solid #173127;border-radius:11px}.bbb-v2-career-table{width:100%;border-collapse:collapse;min-width:820px;background:#07100c}.bbb-v2-career-table th{padding:10px 9px;text-align:right;color:#63766c;font-size:8px;text-transform:uppercase;letter-spacing:.07em;background:#09140f;border-bottom:1px solid #173127;white-space:nowrap}.bbb-v2-career-table th:first-child,.bbb-v2-career-table th:nth-child(2){text-align:left}.bbb-v2-career-table td{padding:11px 9px;text-align:right;color:#b7c4bd;font-size:10px;border-bottom:1px solid #10251c;white-space:nowrap}.bbb-v2-career-table td:first-child,.bbb-v2-career-table td:nth-child(2){text-align:left;font-weight:850;color:#e2e9e5}.bbb-v2-career-table tr:last-child td{border-bottom:0}.bbb-v2-career-table td.ppr{color:#79dfa8;font-weight:950}.bbb-v2-career-table td.finish{color:#f1f4f2;font-weight:950}.bbb-v2-footnote{color:#63766c;font-size:8px;margin-top:9px}.bbb-v2-career-empty{border:1px dashed #264437;padding:20px;border-radius:11px;background:#08100c}.bbb-v2-career-empty strong{display:block;color:#dbe4df;font-size:12px;margin-bottom:5px}.bbb-v2-career-empty span{color:#73867a;font-size:10px}
  .bbb-v2-timeline{position:relative}.bbb-v2-timeline-item{display:grid;grid-template-columns:20px 1fr;gap:9px}.bbb-v2-timeline-rail{position:relative;display:flex;justify-content:center}.bbb-v2-timeline-rail:after{content:'';position:absolute;top:15px;bottom:-8px;width:1px;background:#1b392c}.bbb-v2-timeline-item:last-child .bbb-v2-timeline-rail:after{display:none}.bbb-v2-timeline-rail span{position:relative;z-index:1;width:8px;height:8px;margin-top:7px;border-radius:50%;background:#50ce8e;box-shadow:0 0 0 4px #0a1a12}.bbb-v2-timeline-body{padding:0 0 18px}.bbb-v2-timeline-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:6px}.bbb-v2-timeline-head>div{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.bbb-v2-timeline-head time,.bbb-v2-timeline-head small{color:#697c72;font-size:8px}.bbb-v2-timeline-body p{margin:0;color:#c6d1cb;font-size:11px;line-height:1.6}.bbb-v2-update-type{border-radius:999px;padding:4px 7px;font-size:8px;font-weight:950;text-transform:uppercase;letter-spacing:.05em}.bbb-v2-update-type.injury{background:#2c2410;color:#e2c46e;border:1px solid #6a5625}.bbb-v2-update-type.performance{background:#0a2b1d;color:#74e5a9;border:1px solid #176743}.bbb-v2-update-type.role{background:#10243a;color:#82bceb;border:1px solid #28577b}.bbb-v2-update-type.roster{background:#271735;color:#cf9bec;border:1px solid #5e3677}.bbb-v2-update-type.other{background:#18201c;color:#aab8b0;border:1px solid #34443b}
  @media(max-width:900px){.bbb-v2-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.bbb-v2-trend-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.bbb-v2-career-summary{grid-template-columns:repeat(3,minmax(0,1fr))}}
  @media(max-width:560px){.bbb-v2-snapshot-head,.bbb-v2-card-head{display:block}.bbb-v2-actions{justify-content:flex-start;margin-top:12px}.bbb-v2-stat-grid,.bbb-v2-trend-grid{grid-template-columns:1fr 1fr}.bbb-v2-stat-grid>div,.bbb-v2-trend-grid>div{padding:11px}.bbb-v2-stat-grid strong{font-size:15px}.bbb-v2-career-summary{grid-template-columns:1fr 1fr}.bbb-v2-source,.bbb-v2-count{display:inline-flex;margin-top:10px}.bbb-v2-latest>div,.bbb-v2-timeline-head{display:block}.bbb-v2-latest strong,.bbb-v2-timeline-head small{display:block;margin-top:5px}}
  `;document.head.appendChild(s);
})();

if(typeof profileRender==='function'){
  const bbbProfileV2BaseRender=profileRender;
  profileRender=async function(slug){
    await bbbProfileV2BaseRender(slug);
    await bbbProfileV2Enhance(slug);
  };
}
