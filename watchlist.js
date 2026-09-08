const BBB_WATCH_STORAGE='bbb_watchlist_v1';
let bbbWatchKeys=new Set();
let bbbWatchBoard=[];
let bbbWatchMovers=[];
let bbbWatchUpdates=[];
let bbbWatchQ='';
let bbbWatchSort='rank';
let bbbWatchPosition='ALL';

function bbbWatchRead(){
  try{
    const raw=JSON.parse(localStorage.getItem(BBB_WATCH_STORAGE)||'[]');
    bbbWatchKeys=new Set(Array.isArray(raw)?raw.map(String).filter(Boolean):[]);
  }catch(_){bbbWatchKeys=new Set()}
}
function bbbWatchSave(){
  try{localStorage.setItem(BBB_WATCH_STORAGE,JSON.stringify([...bbbWatchKeys]))}catch(_){ }
}
function bbbWatchKey(v){return String(v?.player_key||v?.playerKey||'').trim()}
function bbbWatchIs(key){return bbbWatchKeys.has(String(key||''))}
function bbbWatchToggle(key){
  key=String(key||'').trim();if(!key)return;
  if(bbbWatchKeys.has(key))bbbWatchKeys.delete(key);else bbbWatchKeys.add(key);
  bbbWatchSave();bbbWatchRefreshButtons();bbbWatchRender();
}
function bbbWatchNum(v){const n=Number(v);return Number.isFinite(n)?n:null}
function bbbWatchMoveValue(row,period){
  if(!row)return null;
  return bbbWatchNum(row[period==='30D'?'bbb_move_30d':'bbb_move_7d']);
}
function bbbWatchMoveHtml(v,label){
  const value=bbbWatchNum(v);
  const cls=value>0?'up':value<0?'down':'flat';
  const text=value>0?`↑ ${value}`:value<0?`↓ ${Math.abs(value)}`:'No change';
  return `<span class="bbb-watch-trend"><small>${bbbEsc(label)}</small><span class="bbb-watch-move ${cls}">${bbbEsc(text)}</span></span>`;
}
function bbbWatchHealthStatus(status){
  const text=String(status||'Healthy').trim()||'Healthy';
  const healthy=/healthy|active|cleared/i.test(text);
  return {text,healthy};
}
function bbbWatchHealth(status){
  const health=bbbWatchHealthStatus(status);
  return `<span class="bbb-watch-health ${health.healthy?'healthy':'watch'}">${bbbEsc(health.text)}</span>`;
}
function bbbWatchDate(v){
  if(!v)return '';
  const d=new Date(String(v).slice(0,10)+'T12:00:00');
  return Number.isNaN(d.getTime())?'':d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
}
function bbbWatchMarketClass(view,gap){
  const v=String(view||'').toUpperCase();
  if(v.includes('BUY'))return 'BUY';
  if(v.includes('FADE'))return 'FADE';
  const g=bbbWatchNum(gap);
  if(g!=null&&g>=20)return 'BUY';
  if(g!=null&&g<=-20)return 'FADE';
  return 'MARKET';
}
function bbbWatchMarketBadge(view,gap){
  const cls=bbbWatchMarketClass(view,gap);
  if(cls==='BUY')return '<span class="bbb-watch-market-badge buy">BBB BUY</span>';
  if(cls==='FADE')return '<span class="bbb-watch-market-badge fade">BBB FADE</span>';
  return '<span class="bbb-watch-market-badge market">MARKET</span>';
}
function bbbWatchLatestMap(){
  const map=new Map();
  bbbWatchUpdates.forEach(u=>{const key=String(u.player_key||'');if(key&&!map.has(key))map.set(key,u)});
  return map;
}
function bbbWatchMoverMap(){return new Map(bbbWatchMovers.map(m=>[String(m.player_key||''),m]))}
function bbbWatchRows(){
  const moverMap=bbbWatchMoverMap();
  const latestMap=bbbWatchLatestMap();
  return bbbWatchBoard
    .filter(p=>bbbWatchKeys.has(String(p.player_key||'')))
    .map(p=>{
      const key=String(p.player_key||'');
      const mover=moverMap.get(key)||null;
      const update=latestMap.get(key)||null;
      return {p,key,mover,update,move7:bbbWatchMoveValue(mover,'7D'),move30:bbbWatchMoveValue(mover,'30D'),gap:bbbWatchNum(p.gap)};
    });
}
function bbbWatchSortRows(rows){
  const posOrder={QB:0,RB:1,WR:2,TE:3};
  return [...rows].sort((a,b)=>{
    if(bbbWatchSort==='move7')return (b.move7??-9999)-(a.move7??-9999)||Number(a.p.rank)-Number(b.p.rank);
    if(bbbWatchSort==='move30')return (b.move30??-9999)-(a.move30??-9999)||Number(a.p.rank)-Number(b.p.rank);
    if(bbbWatchSort==='gap')return Math.abs(b.gap??-1)-Math.abs(a.gap??-1)||Number(a.p.rank)-Number(b.p.rank);
    if(bbbWatchSort==='position')return (posOrder[a.p.pos]??9)-(posOrder[b.p.pos]??9)||Number(a.p.rank)-Number(b.p.rank);
    if(bbbWatchSort==='name')return String(a.p.name||'').localeCompare(String(b.p.name||''));
    return Number(a.p.rank)-Number(b.p.rank);
  });
}
function bbbWatchFilteredRows(){
  const rows=bbbWatchRows().filter(row=>{
    if(bbbWatchPosition!=='ALL'&&row.p.pos!==bbbWatchPosition)return false;
    if(!bbbWatchQ)return true;
    return `${row.p.name} ${row.p.team} ${row.p.pos}`.toLowerCase().includes(bbbWatchQ);
  });
  return bbbWatchSortRows(rows);
}
function bbbWatchSummary(rows){
  return {
    watching:rows.length,
    risers:rows.filter(r=>(r.move7??0)>0).length,
    fallers:rows.filter(r=>(r.move7??0)<0).length,
    injuries:rows.filter(r=>!bbbWatchHealthStatus(r.p.injury_status).healthy).length,
    buys:rows.filter(r=>bbbWatchMarketClass(r.p.view,r.gap)==='BUY').length
  };
}
function bbbWatchSummaryHtml(summary){
  const cards=[
    ['Watching',summary.watching,'Your saved players','watching'],
    ['7D Risers',summary.risers,'Moved up on BBB','up'],
    ['7D Fallers',summary.fallers,'Moved down on BBB','down'],
    ['Health Watch',summary.injuries,'Needs attention','watch'],
    ['BBB Buys',summary.buys,'Above market','buy']
  ];
  return cards.map(([label,value,copy,cls])=>`<div class="bbb-watch-summary-card ${cls}"><span>${bbbEsc(label)}</span><strong>${bbbEsc(value)}</strong><small>${bbbEsc(copy)}</small></div>`).join('');
}
function bbbWatchRender(){
  const grid=document.querySelector('#bbbWatchGrid');
  const count=document.querySelector('#bbbWatchCount');
  const heroCount=document.querySelector('#bbbWatchHeroCount');
  const summaryEl=document.querySelector('#bbbWatchSummary');
  if(!grid)return;

  const all=bbbWatchRows();
  const list=bbbWatchFilteredRows();
  const summary=bbbWatchSummary(all);
  if(heroCount)heroCount.textContent=summary.watching;
  if(summaryEl)summaryEl.innerHTML=bbbWatchSummaryHtml(summary);
  if(count){
    const filtered=list.length!==all.length;
    count.textContent=`${all.length} watched player${all.length===1?'':'s'}${filtered?` • ${list.length} shown`:''}`;
  }

  if(!all.length){
    grid.innerHTML=`<div class="bbb-watch-empty"><div class="bbb-watch-empty-star">☆</div><h2>Your watchlist is empty.</h2><p>Open any current player profile and tap <strong>Watch Player</strong>. My Players will keep their rank, movement, market context, health, and latest BBB update together in one dashboard.</p><a class="btn btn-primary" href="#rankings">Explore the Rankings</a></div>`;
    return;
  }
  if(!list.length){grid.innerHTML='<div class="bbb-watch-empty"><h2>No watched players match these filters.</h2><p>Try another position or clear your search.</p></div>';return}

  grid.innerHTML=`<div class="bbb-watch-table-wrap"><table class="bbb-watch-table"><thead><tr><th></th><th>Player</th><th>BBB</th><th>Movement</th><th>Market</th><th>Health</th><th>Latest BBB Update</th><th></th></tr></thead><tbody>${list.map(row=>{
    const {p,key,update,move7,move30,gap}=row;
    const market=p.market==null?'UR':'#'+p.market;
    const gapText=gap==null?'No market rank':`Gap ${gap>0?'+':''}${gap}`;
    const updateText=String(update?.update_text||p.latest_update||p.injury_note||'No new meaningful update.').trim();
    const updateDate=bbbWatchDate(update?.update_date||p.weekly_update_date||p.injury_updated);
    return `<tr class="bbb-watch-row" data-player-key="${bbbEsc(key)}">
      <td class="bbb-watch-star-cell"><button class="bbb-watch-toggle watching" data-watch-key="${bbbEsc(key)}" aria-label="Remove ${bbbEsc(p.name)} from watchlist">★</button></td>
      <td><div class="bbb-watch-player"><strong>${bbbEsc(p.name)}</strong><span>${bbbEsc(p.pos||'')} • ${bbbEsc(p.team||'FA')}</span></div></td>
      <td><div class="bbb-watch-rank"><strong>#${bbbEsc(p.rank)}</strong><span>${bbbEsc(p.pos||'')}${p.pr??'N/A'}</span></div></td>
      <td><div class="bbb-watch-trends">${bbbWatchMoveHtml(move7,'7D')}${bbbWatchMoveHtml(move30,'30D')}</div></td>
      <td><div class="bbb-watch-market"><div><strong>${bbbEsc(market)}</strong><span class="${gap>0?'positive':gap<0?'negative':'neutral'}">${bbbEsc(gapText)}</span></div>${bbbWatchMarketBadge(p.view,gap)}</div></td>
      <td>${bbbWatchHealth(p.injury_status)}</td>
      <td><div class="bbb-watch-update">${updateDate?`<span>${bbbEsc(updateDate)}</span>`:''}<p>${bbbEsc(updateText)}</p></div></td>
      <td><div class="bbb-watch-actions"><button type="button" class="bbb-watch-action" data-watch-profile="${bbbEsc(key)}">Profile</button><a class="bbb-watch-action" data-watch-action href="/#compare?left=${encodeURIComponent(key)}">Compare</a></div></td>
    </tr>`;
  }).join('')}</tbody></table></div>`;
}
function bbbWatchRefreshButtons(){
  document.querySelectorAll('[data-watch-key]').forEach(btn=>{
    const on=bbbWatchIs(btn.dataset.watchKey);
    btn.classList.toggle('watching',on);
    if(btn.classList.contains('bbb-profile-watch'))btn.innerHTML=on?'★ WATCHING':'☆ WATCH PLAYER';
    btn.setAttribute('aria-pressed',on?'true':'false');
  });
}
function bbbWatchInjectProfileButton(slug){
  const pathKey=typeof profileNameFromPath==='function'?profileNameFromPath():'';
  const key=String(slug||pathKey||'').trim();
  if(!key)return;
  const dynasty=(typeof players!=='undefined'?players:[]).find(p=>String(p.playerKey||'')===key);
  if(!dynasty)return;
  const meta=document.querySelector('#profileMount .profile-meta');if(!meta)return;
  let wrap=document.querySelector('#profileMount .bbb-profile-watch-wrap');
  if(!wrap){wrap=document.createElement('div');wrap.className='bbb-profile-watch-wrap';meta.insertAdjacentElement('afterend',wrap)}
  wrap.innerHTML=`<button type="button" class="bbb-profile-watch bbb-watch-toggle ${bbbWatchIs(key)?'watching':''}" data-watch-key="${bbbEsc(key)}" aria-pressed="${bbbWatchIs(key)?'true':'false'}">${bbbWatchIs(key)?'★ WATCHING':'☆ WATCH PLAYER'}</button><span>Saved only in this browser.</span>`;
}
function bbbWatchInjectStyles(){
  if(document.querySelector('#bbb-watchlist-styles'))return;
  const s=document.createElement('style');s.id='bbb-watchlist-styles';s.textContent=`
  .bbb-profile-watch-wrap{display:flex;align-items:center;gap:10px;margin-top:18px}.bbb-profile-watch-wrap>span{color:#708178;font-size:9px}.bbb-profile-watch{border:1px solid #315342;background:#0a1511;color:#aabbb1;border-radius:999px;padding:9px 13px;font-size:9px;font-weight:950;letter-spacing:.06em;cursor:pointer}.bbb-profile-watch:hover,.bbb-profile-watch.watching{border-color:#47ca83;color:#7ee2aa;background:#0b2117}
  .bbb-watch-view{background:#050807;min-height:72vh}.bbb-watch-hero{padding:56px 0 34px;border-bottom:1px solid #173328;background:radial-gradient(circle at 78% 12%,rgba(10,143,77,.19),transparent 38%),linear-gradient(180deg,#07100c,#050807)}.bbb-watch-hero-grid{display:grid;grid-template-columns:1fr auto;gap:30px;align-items:end}.bbb-watch-hero h1{font-size:clamp(46px,7vw,78px);line-height:.94;letter-spacing:-.055em;text-transform:uppercase;margin:10px 0 13px}.bbb-watch-hero h1 span{color:#42c883}.bbb-watch-copy{max-width:710px;color:#93a49b;font-size:14px;line-height:1.65}.bbb-watch-count-card{min-width:170px;border:1px solid #1d3b2e;background:#09130f;border-radius:15px;padding:18px}.bbb-watch-count-card span{display:block;color:#6f8278;font-size:8px;font-weight:950;letter-spacing:.12em;text-transform:uppercase}.bbb-watch-count-card strong{display:block;color:#65dc9d;font-size:38px;line-height:1;margin:7px 0 4px}.bbb-watch-count-card small{color:#788b80;font-size:9px}.bbb-watch-content{padding:34px 0 72px}
  .bbb-watch-summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-bottom:22px}.bbb-watch-summary-card{border:1px solid #1a352a;background:#08110d;border-radius:12px;padding:13px}.bbb-watch-summary-card span{display:block;color:#6e8176;font-size:8px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}.bbb-watch-summary-card strong{display:block;color:#eef4f1;font-size:25px;line-height:1;margin:7px 0 5px}.bbb-watch-summary-card small{display:block;color:#708279;font-size:8px}.bbb-watch-summary-card.up strong,.bbb-watch-summary-card.buy strong{color:#73dfa6}.bbb-watch-summary-card.down strong{color:#ef8a8a}.bbb-watch-summary-card.watch strong{color:#e6c66f}
  .bbb-watch-toolbar{display:grid;grid-template-columns:minmax(200px,1fr) 160px 220px;gap:9px;align-items:center;margin-bottom:12px}.bbb-watch-search,.bbb-watch-select{width:100%;background:#050a08;border:1px solid #274539;color:#edf3ef;border-radius:9px;padding:10px 12px;font-size:10px}.bbb-watch-select{appearance:auto}.bbb-watch-meta{color:#71847a;font-size:10px;margin-bottom:14px}
  .bbb-watch-table-wrap{overflow-x:auto;border:1px solid #193127;border-radius:15px;background:#07100c}.bbb-watch-table{width:100%;min-width:1250px;border-collapse:collapse}.bbb-watch-table th{padding:10px 11px;text-align:left;color:#63776c;background:#09140f;border-bottom:1px solid #173127;font-size:8px;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap}.bbb-watch-table td{padding:12px 11px;border-bottom:1px solid #11261d;vertical-align:middle}.bbb-watch-table tr:last-child td{border-bottom:0}.bbb-watch-table tbody tr{cursor:pointer}.bbb-watch-table tbody tr:hover{background:#09140f}.bbb-watch-star-cell{width:40px}.bbb-watch-toggle{border:0;background:transparent;color:#708178;font-size:18px;cursor:pointer;padding:4px}.bbb-watch-toggle.watching{color:#63d997}.bbb-watch-player strong{display:block;color:#fff;font-size:13px}.bbb-watch-player span{display:block;margin-top:3px;color:#71847a;font-size:9px}.bbb-watch-rank strong{display:block;color:#64d697;font-size:17px;font-weight:950}.bbb-watch-rank span{display:block;color:#73867b;font-size:8px;font-weight:900;margin-top:3px}.bbb-watch-trends{display:flex;gap:7px;align-items:center}.bbb-watch-trend small{display:block;color:#62766b;font-size:7px;font-weight:900;margin-bottom:3px}.bbb-watch-move{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:8px;font-weight:950;white-space:nowrap}.bbb-watch-move.up{background:#0a2b1d;border:1px solid #176743;color:#74e5a9}.bbb-watch-move.down{background:#351717;border:1px solid #743535;color:#f08b8b}.bbb-watch-move.flat{background:#18201c;border:1px solid #34443b;color:#aab8b0}.bbb-watch-market{display:flex;align-items:center;gap:9px}.bbb-watch-market>div>strong{display:block;color:#d8e3dd}.bbb-watch-market>div>span{display:block;font-size:8px;margin-top:3px;font-weight:850}.bbb-watch-market-badge{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:7px;font-weight:950;white-space:nowrap}.bbb-watch-market-badge.buy{background:#0a2b1d;border:1px solid #176743;color:#74e5a9}.bbb-watch-market-badge.fade{background:#351717;border:1px solid #743535;color:#f08b8b}.bbb-watch-market-badge.market{background:#18201c;border:1px solid #34443b;color:#aab8b0}.bbb-watch-health{display:inline-flex;border-radius:999px;padding:4px 8px;font-size:8px;font-weight:900;max-width:145px;white-space:normal;line-height:1.25}.bbb-watch-health.healthy{border:1px solid #176743;background:#0a2b1d;color:#74e5a9}.bbb-watch-health.watch{border:1px solid #6c5c29;background:#231f10;color:#e8cd74}.bbb-watch-update{max-width:350px}.bbb-watch-update span{display:block;color:#62d99b;font-size:8px;font-weight:900;margin-bottom:4px}.bbb-watch-update p{margin:0;color:#aebcb4;font-size:10px;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.bbb-watch-actions{display:flex;gap:6px}.bbb-watch-action{display:inline-flex;align-items:center;justify-content:center;border:1px solid #294739;background:#08120e;color:#9fb1a8;border-radius:8px;padding:7px 8px;font-size:8px;font-weight:950;text-transform:uppercase;letter-spacing:.04em;cursor:pointer;text-decoration:none;white-space:nowrap}.bbb-watch-action:hover{border-color:#49c984;color:#fff}.bbb-watch-empty{padding:70px 22px;text-align:center;border:1px dashed #244236;border-radius:15px;background:#07100c}.bbb-watch-empty-star{font-size:44px;color:#4acb86}.bbb-watch-empty h2{font-size:27px;margin:8px 0}.bbb-watch-empty p{max-width:600px;margin:0 auto 22px;color:#87978e;font-size:12px;line-height:1.7}
  @media(max-width:1000px){.bbb-watch-summary{grid-template-columns:repeat(3,minmax(0,1fr))}.bbb-watch-toolbar{grid-template-columns:1fr 150px 200px}}
  @media(max-width:850px){.bbb-watch-hero-grid{grid-template-columns:1fr}.bbb-watch-count-card{width:180px}.bbb-watch-toolbar{grid-template-columns:1fr 1fr}.bbb-watch-search{grid-column:1/-1}.bbb-watch-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:640px){.bbb-profile-watch-wrap{align-items:flex-start;flex-direction:column;gap:7px}.bbb-watch-hero{padding:42px 0 31px}.bbb-watch-content{padding:28px 0 55px}.bbb-watch-summary{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.bbb-watch-summary-card{padding:11px}.bbb-watch-summary-card strong{font-size:22px}.bbb-watch-toolbar{grid-template-columns:1fr}.bbb-watch-search{grid-column:auto}.bbb-watch-table-wrap{overflow:visible;border:0;background:transparent}.bbb-watch-table{min-width:0;display:block}.bbb-watch-table thead{display:none}.bbb-watch-table tbody{display:grid;gap:10px;padding:0}.bbb-watch-table tbody tr{display:grid;grid-template-columns:30px minmax(0,1fr) auto;gap:9px 10px;padding:14px;border:1px solid #193127;border-radius:13px;background:#08100c}.bbb-watch-table td{padding:0;border:0}.bbb-watch-star-cell{grid-column:1;grid-row:1/3}.bbb-watch-table td:nth-child(2){grid-column:2;grid-row:1}.bbb-watch-table td:nth-child(3){grid-column:3;grid-row:1}.bbb-watch-table td:nth-child(4){grid-column:2/4;grid-row:2}.bbb-watch-table td:nth-child(5){grid-column:2/4;grid-row:3;padding-top:9px;border-top:1px solid #172a22}.bbb-watch-table td:nth-child(6){grid-column:2/4;grid-row:4}.bbb-watch-table td:nth-child(7){grid-column:1/4;grid-row:5;padding-top:9px;border-top:1px solid #172a22}.bbb-watch-table td:nth-child(8){grid-column:1/4;grid-row:6}.bbb-watch-market{justify-content:space-between}.bbb-watch-update{max-width:none}.bbb-watch-actions{justify-content:flex-end}.bbb-watch-action{flex:1}.bbb-watch-trends{justify-content:flex-start}}
  @media(max-width:430px){.bbb-watch-summary{grid-template-columns:1fr 1fr}.bbb-watch-trends{gap:5px}.bbb-watch-move{padding:4px 6px}.bbb-watch-market{align-items:flex-start;flex-direction:column;gap:6px}}
  `;document.head.appendChild(s);
}
function bbbWatchInjectUi(){
  if(document.querySelector('#watchlistView'))return;
  bbbWatchInjectStyles();
  const main=document.createElement('main');
  main.id='watchlistView';main.className='bbb-watch-view hide';
  main.innerHTML=`<section class="bbb-watch-hero"><div class="shell bbb-watch-hero-grid"><div><div class="profile-kicker">MY BBB</div><h1>My <span>Players.</span></h1><p class="bbb-watch-copy">Your personal dynasty dashboard. Follow the players you care about and see BBB rank movement, market disagreement, health, and the newest meaningful update without hunting through the full board.</p></div><aside class="bbb-watch-count-card"><span>Watching</span><strong id="bbbWatchHeroCount">0</strong><small>Saved locally • no account required</small></aside></div></section><section class="bbb-watch-content"><div class="shell"><div id="bbbWatchSummary" class="bbb-watch-summary"></div><div class="bbb-watch-toolbar"><input id="bbbWatchSearch" class="bbb-watch-search" placeholder="Search your watched players..."><select id="bbbWatchPosition" class="bbb-watch-select" aria-label="Filter by position"><option value="ALL">All positions</option><option value="QB">QB</option><option value="RB">RB</option><option value="WR">WR</option><option value="TE">TE</option></select><select id="bbbWatchSort" class="bbb-watch-select" aria-label="Sort watched players"><option value="rank">Sort: BBB rank</option><option value="move7">Sort: 7D movement</option><option value="move30">Sort: 30D movement</option><option value="gap">Sort: largest market gap</option><option value="position">Sort: position</option><option value="name">Sort: name</option></select></div><div id="bbbWatchCount" class="bbb-watch-meta"></div><div id="bbbWatchGrid"><div class="bbb-watch-empty">Loading your players...</div></div></div></section>`;
  const profile=document.querySelector('#profileView');
  if(profile?.parentNode)profile.parentNode.insertBefore(main,profile);else document.body.appendChild(main);
  document.querySelectorAll('.nav-links').forEach(nav=>{if(!nav.querySelector('a[href="#watchlist"]')){const a=document.createElement('a');a.href='#watchlist';a.textContent='My Players ☆';nav.insertBefore(a,nav.lastElementChild)}});
  const mobile=document.querySelector('.mobile-subnav');if(mobile&&!mobile.querySelector('a[href="#watchlist"]')){const a=document.createElement('a');a.href='#watchlist';a.textContent='My Players ☆';mobile.appendChild(a)}
  document.querySelector('#bbbWatchSearch').oninput=e=>{bbbWatchQ=e.target.value.trim().toLowerCase();bbbWatchRender()};
  document.querySelector('#bbbWatchPosition').onchange=e=>{bbbWatchPosition=e.target.value;bbbWatchRender()};
  document.querySelector('#bbbWatchSort').onchange=e=>{bbbWatchSort=e.target.value;bbbWatchRender()};
}
async function bbbWatchLoadData(){
  const [board,movers,updates]=await Promise.all([
    bbbDbCached('site_dynasty','select=*&order=rank.asc'),
    bbbDbCached('site_movers','select=*'),
    bbbDbCached('site_updates','select=player_key,update_date,update_text,update_type,injury_status&id=not.is.null&order=update_date.desc,id.desc&limit=2000')
  ]);
  bbbWatchBoard=(board||[]).filter(x=>x.player_key&&x.rank).sort((a,b)=>Number(a.rank)-Number(b.rank));
  bbbWatchMovers=movers||[];
  bbbWatchUpdates=updates||[];
  bbbWatchRender();
}
function bbbWatchRoute(){
  const show=location.hash==='#watchlist'&&!location.pathname.startsWith('/player/');
  const w=document.querySelector('#watchlistView');if(!w)return;w.classList.toggle('hide',!show);
  if(show){['rankingsView','rookieView','prospectView','tradeView','profileView','updatesView','moversView','compareView','opportunityView'].forEach(id=>document.querySelector('#'+id)?.classList.add('hide'));window.scrollTo(0,0);bbbWatchRender()}
}
function bbbWatchOpenPlayer(key){
  if(!key)return;
  document.querySelector('#watchlistView')?.classList.add('hide');
  history.pushState({},'',`/player/${encodeURIComponent(key)}`);
  if(typeof profileRoute==='function')profileRoute(true);else location.href=`/player/${encodeURIComponent(key)}`;
}
function bbbWatchInit(){
  bbbWatchRead();bbbWatchInjectUi();bbbWatchRoute();
  bbbWatchLoadData().catch(e=>{console.error('BBB watchlist:',e);const g=document.querySelector('#bbbWatchGrid');if(g)g.innerHTML='<div class="bbb-watch-empty"><h2>My Players is temporarily unavailable.</h2><p>Your saved players are still stored in this browser.</p></div>'});
  window.addEventListener('hashchange',()=>setTimeout(bbbWatchRoute,0));
  window.addEventListener('popstate',()=>setTimeout(bbbWatchRoute,0));
  window.addEventListener('storage',e=>{if(e.key===BBB_WATCH_STORAGE){bbbWatchRead();bbbWatchRefreshButtons();bbbWatchRender()}});
}

document.addEventListener('click',e=>{
  const toggle=e.target.closest('.bbb-watch-toggle');if(toggle){e.preventDefault();e.stopPropagation();bbbWatchToggle(toggle.dataset.watchKey);return}
  const profileButton=e.target.closest('[data-watch-profile]');if(profileButton){e.preventDefault();e.stopPropagation();bbbWatchOpenPlayer(profileButton.dataset.watchProfile);return}
  if(e.target.closest('[data-watch-action]')){e.stopPropagation();return}
  const row=e.target.closest('.bbb-watch-row');if(row)bbbWatchOpenPlayer(row.dataset.playerKey);
});
document.addEventListener('click',e=>{
  const a=e.target.closest('a[href="#watchlist"]');if(!a||!location.pathname.startsWith('/player/'))return;
  e.preventDefault();e.stopImmediatePropagation();history.pushState({},'', '/#watchlist');document.querySelector('#profileView')?.classList.add('hide');if(typeof profileShowSite==='function')profileShowSite();bbbWatchRoute();
},true);

if(typeof profileHideOtherViews==='function'){
  const bbbWatchOriginalHideOtherViews=profileHideOtherViews;
  profileHideOtherViews=function(){bbbWatchOriginalHideOtherViews();document.querySelector('#watchlistView')?.classList.add('hide')};
}
if(typeof profileRender==='function'){
  const bbbWatchOriginalProfileRender=profileRender;
  profileRender=async function(slug){const result=await bbbWatchOriginalProfileRender(slug);bbbWatchInjectProfileButton(slug);return result};
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bbbWatchInit);else bbbWatchInit();
