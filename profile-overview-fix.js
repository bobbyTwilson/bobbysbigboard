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
  const list=(history||[]).slice(-12).filter(x=>x.overall_rank!=null);
  if(list.length<2)return '';
  const width=720,height=190,padX=28,padY=24;
  const ranks=list.map(x=>Number(x.overall_rank));
  let min=Math.min(...ranks),max=Math.max(...ranks);
  if(min===max){min-=1;max+=1;}
  const points=list.map((x,i)=>{
    const px=padX+(i/(list.length-1))*(width-padX*2);
    const py=padY+((Number(x.overall_rank)-min)/(max-min))*(height-padY*2);
    return {x:px,y:py,rank:Number(x.overall_rank),date:x.snapshot_date};
  });
  const poly=points.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const dots=points.map((p,i)=>`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${i===points.length-1?5:3.5}" class="bbb-rank-dot${i===points.length-1?' current':''}"><title>${bbbHistoryDate(p.date)} — #${p.rank}</title></circle>`).join('');
  return `<div class="bbb-rank-chart-wrap"><svg class="bbb-rank-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="BBB ranking history"><line x1="${padX}" y1="${padY}" x2="${width-padX}" y2="${padY}" class="bbb-rank-gridline"/><line x1="${padX}" y1="${height-padY}" x2="${width-padX}" y2="${height-padY}" class="bbb-rank-gridline"/><polyline points="${poly}" class="bbb-rank-line"/>${dots}</svg><div class="bbb-rank-chart-dates"><span>${bbbHistoryDate(list[0].snapshot_date)}</span><span>${bbbHistoryDate(list[list.length-1].snapshot_date)}</span></div></div>`;
}

function bbbRankingHistoryHtml(history){
  if(!history || !history.length)return '<div class="bbb-rank-empty">Ranking history is not available for this player yet.</div>';
  const first=history[0],current=history[history.length-1],move=bbbRankMove(history);
  const best=Math.min(...history.filter(x=>x.overall_rank!=null).map(x=>Number(x.overall_rank)));
  const previous=history.length>1?history[history.length-2]:null;
  const chart=bbbRankingChart(history);
  const recent=history.slice(-5).reverse().map(x=>`<div class="bbb-rank-event"><span>${bbbHistoryDate(x.snapshot_date)}</span><strong>#${bbbEsc(x.overall_rank)}</strong></div>`).join('');
  return `<div class="bbb-rank-summary"><div><span>Current BBB Rank</span><strong>#${bbbEsc(current.overall_rank)}</strong></div><div><span>Latest Movement</span><strong>${bbbRankMoveHtml(move)}</strong></div><div><span>${previous?'Previous Rank':'Tracking Since'}</span><strong>${previous?'#'+bbbEsc(previous.overall_rank):bbbHistoryDate(first.snapshot_date)}</strong></div><div><span>Best Tracked Rank</span><strong>#${bbbEsc(best)}</strong></div></div>${history.length===1?`<div class="bbb-rank-baseline"><strong>History starts here.</strong><span>Aug. 31, 2026 is the first preserved BBB ranking snapshot. Real movement will appear automatically when the board changes.</span></div>`:chart}<div class="bbb-rank-events">${recent}</div>`;
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
    .bbb-rank-chart-wrap{margin:6px 0 18px;padding:14px 14px 8px;border:1px solid #1a352a;background:linear-gradient(180deg,#08110d,#060b08);border-radius:12px}
    .bbb-rank-chart{display:block;width:100%;height:auto;overflow:visible}
    .bbb-rank-gridline{stroke:#173127;stroke-width:1}
    .bbb-rank-line{fill:none;stroke:#50ce8e;stroke-width:4;stroke-linejoin:round;stroke-linecap:round}
    .bbb-rank-dot{fill:#0b1711;stroke:#50ce8e;stroke-width:3}.bbb-rank-dot.current{fill:#50ce8e;stroke:#d8f6e6}
    .bbb-rank-chart-dates{display:flex;justify-content:space-between;color:#60766a;font-size:9px;font-weight:800}
    .bbb-rank-baseline{display:flex;gap:10px;align-items:flex-start;padding:15px;border-left:3px solid #0a8f4d;background:#09140f;margin-bottom:17px}.bbb-rank-baseline strong{flex:none;color:#75e1aa;font-size:11px}.bbb-rank-baseline span{color:#9caf a4;font-size:11px;line-height:1.55}.bbb-rank-baseline span{color:#9cafa4}
    .bbb-rank-events{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}.bbb-rank-event{padding:10px;border:1px solid #173027;border-radius:9px;background:#08100c}.bbb-rank-event span{display:block;color:#667b70;font-size:8px;margin-bottom:4px}.bbb-rank-event strong{font-size:13px;color:#dce5e0}
    .bbb-rank-empty{color:#7f9087;font-size:12px}
    .profile-stat .bbb-inline-rank-move{display:inline-flex;margin-left:7px;vertical-align:middle;border-radius:999px;padding:3px 6px;font-size:8px;font-weight:950}.bbb-inline-rank-move.up{background:#0a2b1d;color:#74e5a9}.bbb-inline-rank-move.down{background:#351717;color:#f08b8b}.bbb-inline-rank-move.neutral{background:#18201c;color:#9cada4}
    @media(max-width:850px){.bbb-rank-summary{grid-template-columns:repeat(2,1fr)}.bbb-rank-events{grid-template-columns:repeat(3,1fr)}}
    @media(max-width:560px){.bbb-rank-summary{grid-template-columns:1fr 1fr}.bbb-rank-summary>div{padding:12px}.bbb-rank-summary strong{font-size:15px}.bbb-rank-events{grid-template-columns:1fr 1fr}.bbb-rank-baseline{display:block}.bbb-rank-baseline strong{display:block;margin-bottom:6px}}
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
