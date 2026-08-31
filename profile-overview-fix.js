let bbbAllProfilesPromise=null;
const bbbRankingHistoryCache=new Map();

async function bbbLoadAllProfiles(){
  if(!bbbAllProfilesPromise){
    bbbAllProfilesPromise=bbbDb('site_profiles','select=player_key,name,overall_breakdown,injury_status,injury_note,injury_updated,latest_weekly_update,weekly_update_date').then(rows=>{
      const map=new Map();
      rows.forEach(r=>{
        const key=profileNorm(r.name);
        const item={
          playerKey:r.player_key||'',
          name:r.name||'',
          overview:r.overall_breakdown||'',
          injuryStatus:r.injury_status||'',
          injuryNote:r.injury_note||'',
          injuryUpdated:r.injury_updated||'',
          latestUpdate:r.latest_weekly_update||'',
          updateDate:r.weekly_update_date||''
        };
        const existing=map.get(key);
        if(!existing || (!existing.overview && item.overview)) map.set(key,item);
      });
      return map;
    });
  }
  return bbbAllProfilesPromise;
}

function bbbHistoryDate(v){
  if(!v)return '';
  const d=new Date(v+'T12:00:00');
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}

async function bbbLoadRankingHistory(playerKey){
  if(!playerKey)return [];
  if(!bbbRankingHistoryCache.has(playerKey)){
    bbbRankingHistoryCache.set(playerKey,bbbDb('site_ranking_history',`select=snapshot_date,overall_rank,position_rank,fp_sf_rank,bbb_vs_fp,market_view&player_key=eq.${encodeURIComponent(playerKey)}&order=snapshot_date.asc`));
  }
  return bbbRankingHistoryCache.get(playerKey);
}

function bbbRankMove(history){
  if(!history || history.length<2)return null;
  const current=history[history.length-1],previous=history[history.length-2];
  if(current.overall_rank==null || previous.overall_rank==null)return null;
  return previous.overall_rank-current.overall_rank;
}

function bbbRankMoveHtml(move){
  if(move==null)return '<span class="bbb-rank-move neutral">Baseline</span>';
  if(move>0)return `<span class="bbb-rank-move up">↑ ${move}</span>`;
  if(move<0)return `<span class="bbb-rank-move down">↓ ${Math.abs(move)}</span>`;
  return '<span class="bbb-rank-move neutral">No change</span>';
}

function bbbRankingChart(history){
  const list=(history||[]).slice(-30).filter(x=>x.overall_rank!=null);
  if(!list.length)return '';

  const width=760,height=230,padLeft=54,padRight=24,padTop=28,padBottom=36;
  const ranks=list.map(x=>Number(x.overall_rank));
  const observedMin=Math.min(...ranks),observedMax=Math.max(...ranks);
  let min,max;

  if(observedMin===observedMax){
    const spread=Math.max(4,Math.ceil(observedMin*.08));
    min=Math.max(1,observedMin-spread);
    max=Math.min(500,observedMax+spread);
    if(min===max){min=Math.max(1,observedMin-1);max=Math.min(500,observedMax+1);}
  }else{
    const pad=Math.max(2,Math.ceil((observedMax-observedMin)*.22));
    min=Math.max(1,observedMin-pad);
    max=Math.min(500,observedMax+pad);
  }

  const chartW=width-padLeft-padRight,chartH=height-padTop-padBottom;
  const xFor=i=>list.length===1?padLeft+chartW/2:padLeft+(i/(list.length-1))*chartW;
  const yFor=rank=>padTop+((rank-min)/(max-min))*chartH;
  const points=list.map((x,i)=>({x:xFor(i),y:yFor(Number(x.overall_rank)),rank:Number(x.overall_rank),date:x.snapshot_date}));

  const tickCount=4;
  const ticks=Array.from({length:tickCount+1},(_,i)=>{
    const value=Math.round(min+((max-min)*i/tickCount));
    return {value,y:yFor(value)};
  }).filter((t,i,a)=>i===0||t.value!==a[i-1].value);

  const grid=ticks.map(t=>`<g><line x1="${padLeft}" y1="${t.y.toFixed(1)}" x2="${width-padRight}" y2="${t.y.toFixed(1)}" class="bbb-rank-gridline"/><text x="${padLeft-10}" y="${(t.y+3).toFixed(1)}" text-anchor="end" class="bbb-rank-axis-label">#${t.value}</text></g>`).join('');
  const poly=points.length>1?`<polyline points="${points.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}" class="bbb-rank-line"/>`:'';
  const dots=points.map((p,i)=>`<g><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${i===points.length-1?6:4}" class="bbb-rank-dot${i===points.length-1?' current':''}"><title>${bbbHistoryDate(p.date)} — BBB #${p.rank}</title></circle>${i===points.length-1?`<text x="${p.x.toFixed(1)}" y="${Math.max(14,p.y-13).toFixed(1)}" text-anchor="middle" class="bbb-rank-point-label">#${p.rank}</text>`:''}</g>`).join('');
  const firstDate=bbbHistoryDate(list[0].snapshot_date),lastDate=bbbHistoryDate(list[list.length-1].snapshot_date);

  return `<div class="bbb-rank-chart-wrap"><div class="bbb-rank-chart-head"><span>BBB rank over time</span><span>Rank #1 is best</span></div><svg class="bbb-rank-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="BBB ranking history over time">${grid}${poly}${dots}</svg><div class="bbb-rank-chart-dates"><span>${firstDate}</span><span>${list.length>1?lastDate:'Tracking begins here'}</span></div></div>`;
}

function bbbRankingHistoryHtml(history){
  if(!history || !history.length)return '<div class="bbb-rank-empty">Ranking history is not available for this player yet.</div>';
  const first=history[0],current=history[history.length-1],move=bbbRankMove(history);
  const best=Math.min(...history.filter(x=>x.overall_rank!=null).map(x=>Number(x.overall_rank)));
  const previous=history.length>1?history[history.length-2]:null;
  const chart=bbbRankingChart(history);
  const recent=history.slice(-5).reverse().map(x=>`<div class="bbb-rank-event"><span>${bbbHistoryDate(x.snapshot_date)}</span><strong>#${bbbEsc(x.overall_rank)}</strong></div>`).join('');
  const baseline=history.length===1?`<div class="bbb-rank-baseline"><strong>History starts here.</strong><span>Aug. 31, 2026 is the first preserved BBB ranking snapshot. The graph will build automatically as daily snapshots are added and the board moves.</span></div>`:'';
  return `<div class="bbb-rank-summary"><div><span>Current BBB Rank</span><strong>#${bbbEsc(current.overall_rank)}</strong></div><div><span>Latest Movement</span><strong>${bbbRankMoveHtml(move)}</strong></div><div><span>${previous?'Previous Rank':'Tracking Since'}</span><strong>${previous?'#'+bbbEsc(previous.overall_rank):bbbHistoryDate(first.snapshot_date)}</strong></div><div><span>Best Tracked Rank</span><strong>#${bbbEsc(best)}</strong></div></div>${chart}${baseline}<div class="bbb-rank-events">${recent}</div>`;
}

function bbbInjectRankingHistoryStyles(){
  if(document.querySelector('#bbb-ranking-history-styles'))return;
  const style=document.createElement('style');
  style.id='bbb-ranking-history-styles';
  style.textContent=`
    .bbb-ranking-card{overflow:hidden}
    .bbb-rank-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-bottom:18px}
    .bbb-rank-summary>div{padding:14px;border:1px solid #1c392d;background:#09120e;border-radius:11px}
    .bbb-rank-summary span{display:block;color:#71867a;font-size:8px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;margin-bottom:7px}
    .bbb-rank-summary strong{display:block;color:#f2f6f3;font-size:18px;line-height:1.1}
    .bbb-rank-move{display:inline-flex!important;width:max-content;border-radius:999px;padding:5px 8px;font-size:10px!important;font-weight:950!important;letter-spacing:0!important;text-transform:none!important;margin:0!important}
    .bbb-rank-move.up{background:#0a2b1d;border:1px solid #176743;color:#74e5a9}
    .bbb-rank-move.down{background:#351717;border:1px solid #743535;color:#f08b8b}
    .bbb-rank-move.neutral{background:#18201c;border:1px solid #34443b;color:#aab8b0}
    .bbb-rank-chart-wrap{margin:6px 0 18px;padding:14px 14px 10px;border:1px solid #1a352a;background:linear-gradient(180deg,#08110d,#060b08);border-radius:12px}
    .bbb-rank-chart-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:0 4px 2px;color:#667b70;font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.07em}
    .bbb-rank-chart-head span:first-child{color:#9bb0a4}
    .bbb-rank-chart{display:block;width:100%;height:auto;overflow:visible}
    .bbb-rank-gridline{stroke:#173127;stroke-width:1}
    .bbb-rank-axis-label{fill:#60766a;font-size:10px;font-weight:800}
    .bbb-rank-line{fill:none;stroke:#50ce8e;stroke-width:4;stroke-linejoin:round;stroke-linecap:round}
    .bbb-rank-dot{fill:#0b1711;stroke:#50ce8e;stroke-width:3}.bbb-rank-dot.current{fill:#50ce8e;stroke:#d8f6e6}
    .bbb-rank-point-label{fill:#d9f4e5;font-size:11px;font-weight:950}
    .bbb-rank-chart-dates{display:flex;justify-content:space-between;color:#60766a;font-size:9px;font-weight:800;padding:0 5px}
    .bbb-rank-baseline{display:flex;gap:10px;align-items:flex-start;padding:15px;border-left:3px solid #0a8f4d;background:#09140f;margin-bottom:17px}.bbb-rank-baseline strong{flex:none;color:#75e1aa;font-size:11px}.bbb-rank-baseline span{color:#9cafa4;font-size:11px;line-height:1.55}
    .bbb-rank-events{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}.bbb-rank-event{padding:10px;border:1px solid #173027;border-radius:9px;background:#08100c}.bbb-rank-event span{display:block;color:#667b70;font-size:8px;margin-bottom:4px}.bbb-rank-event strong{font-size:13px;color:#dce5e0}
    .bbb-rank-empty{color:#7f9087;font-size:12px}
    .profile-stat .bbb-inline-rank-move{display:inline-flex;margin-left:7px;vertical-align:middle;border-radius:999px;padding:3px 6px;font-size:8px;font-weight:950}.bbb-inline-rank-move.up{background:#0a2b1d;color:#74e5a9}.bbb-inline-rank-move.down{background:#351717;color:#f08b8b}.bbb-inline-rank-move.neutral{background:#18201c;color:#9cada4}
    @media(max-width:850px){.bbb-rank-summary{grid-template-columns:repeat(2,1fr)}.bbb-rank-events{grid-template-columns:repeat(3,1fr)}}
    @media(max-width:560px){.bbb-rank-summary{grid-template-columns:1fr 1fr}.bbb-rank-summary>div{padding:12px}.bbb-rank-summary strong{font-size:15px}.bbb-rank-events{grid-template-columns:1fr 1fr}.bbb-rank-baseline{display:block}.bbb-rank-baseline strong{display:block;margin-bottom:6px}.bbb-rank-chart-wrap{padding:10px 7px 8px}.bbb-rank-chart-head{font-size:8px}.bbb-rank-axis-label{font-size:9px}}
  `;
  document.head.appendChild(style);
}

function bbbAddInlineMovement(mount,move){
  if(move==null||move===0)return;
  const stats=[...mount.querySelectorAll('.profile-stat')];
  const rankStat=stats.find(s=>s.querySelector('span')?.textContent.trim().toLowerCase()==='overall rank');
  const strong=rankStat?.querySelector('strong');
  if(!strong||strong.querySelector('.bbb-inline-rank-move'))return;
  const cls=move>0?'up':'down',label=move>0?`↑ ${move}`:`↓ ${Math.abs(move)}`;
  strong.insertAdjacentHTML('beforeend',`<span class="bbb-inline-rank-move ${cls}">${label}</span>`);
}

async function bbbAddRankingHistory(profile,mount){
  const history=await bbbLoadRankingHistory(profile.playerKey).catch(()=>[]);
  const grid=mount.querySelector('.profile-grid');
  if(!grid)return;
  const existing=grid.querySelector('.bbb-ranking-card');
  const body=bbbRankingHistoryHtml(history);
  if(existing){existing.querySelector('.bbb-ranking-body').innerHTML=body;}
  else{
    const card=document.createElement('section');
    card.className='profile-card full bbb-ranking-card';
    card.innerHTML=`<div class="profile-card-kicker">BBB RANKING HISTORY</div><h2>How the board has moved.</h2><div class="bbb-ranking-body">${body}</div>`;
    grid.appendChild(card);
  }
  bbbAddInlineMovement(mount,bbbRankMove(history));
}

bbbInjectRankingHistoryStyles();

if(typeof profileRender==='function'){
  const bbbProfileRenderWithAllOverviews=profileRender;
  profileRender=async function(slug){
    await bbbProfileRenderWithAllOverviews(slug);
    const found=typeof profileFind==='function'?profileFind(slug):null;
    if(!found)return;

    const profiles=await bbbLoadAllProfiles().catch(()=>null);
    const profile=profiles?.get(profileNorm(found.name));
    if(!profile)return;

    const mount=document.querySelector('#profileMount');
    if(!mount)return;
    const grid=mount.querySelector('.profile-grid');
    if(!grid)return;

    const summary=bbbProfileSummaryHtml(profile);
    if(summary){
      const existing=mount.querySelector('.bbb-profile-summary');
      if(existing)existing.innerHTML=summary;
      else{
        const card=document.createElement('section');
        card.className='profile-card full bbb-overview-card';
        card.innerHTML=`<div class="profile-card-kicker">Player Profile</div><h2>Scouting overview.</h2><div class="profile-note bbb-profile-summary">${summary}</div>`;
        grid.insertBefore(card,grid.firstChild);
      }
    }

    await bbbAddRankingHistory(profile,mount);
  };
}
