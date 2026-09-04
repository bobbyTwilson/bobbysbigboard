const BBB_WATCH_STORAGE='bbb_watchlist_v1';
let bbbWatchKeys=new Set();
let bbbWatchBoard=[];
let bbbWatchMovers=[];
let bbbWatchUpdates=[];
let bbbWatchPeriod='7D';
let bbbWatchQ='';

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
function bbbWatchMove(row){
  if(!row)return null;
  const field=bbbWatchPeriod==='30D'?'bbb_move_30d':'bbb_move_7d';
  const v=Number(row[field]);return Number.isFinite(v)?v:null;
}
function bbbWatchMoveHtml(v){
  if(v>0)return `<span class="bbb-watch-move up">↑ ${bbbEsc(v)}</span>`;
  if(v<0)return `<span class="bbb-watch-move down">↓ ${bbbEsc(Math.abs(v))}</span>`;
  return '<span class="bbb-watch-move flat">—</span>';
}
function bbbWatchHealth(status){
  const s=String(status||'Healthy').trim()||'Healthy';
  const healthy=/healthy|active|cleared/i.test(s);
  return `<span class="bbb-watch-health ${healthy?'healthy':'watch'}">${bbbEsc(s)}</span>`;
}
function bbbWatchDate(v){
  if(!v)return '';
  const d=new Date(String(v).slice(0,10)+'T12:00:00');
  return Number.isNaN(d.getTime())?'':d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
}
function bbbWatchLatestMap(){
  const map=new Map();
  bbbWatchUpdates.forEach(u=>{const key=String(u.player_key||'');if(key&&!map.has(key))map.set(key,u)});
  return map;
}
function bbbWatchFiltered(){
  return bbbWatchBoard.filter(p=>bbbWatchKeys.has(String(p.player_key||''))&&(!bbbWatchQ||(`${p.name} ${p.team} ${p.pos}`).toLowerCase().includes(bbbWatchQ)));
}
function bbbWatchRender(){
  const grid=document.querySelector('#bbbWatchGrid'),count=document.querySelector('#bbbWatchCount'),heroCount=document.querySelector('#bbbWatchHeroCount');
  if(!grid)return;
  const all=bbbWatchBoard.filter(p=>bbbWatchKeys.has(String(p.player_key||'')));
  const list=bbbWatchFiltered();
  if(heroCount)heroCount.textContent=all.length;
  if(count)count.textContent=`${all.length} watched player${all.length===1?'':'s'}${bbbWatchQ?` • ${list.length} matching search`:''}`;
  if(!all.length){
    grid.innerHTML=`<div class="bbb-watch-empty"><div class="bbb-watch-empty-star">☆</div><h2>Your watchlist is empty.</h2><p>Open any current player profile and tap <strong>Watch Player</strong>. Your list stays saved in this browser with no account required.</p><a class="btn btn-primary" href="#rankings">Explore the Rankings</a></div>`;
    return;
  }
  if(!list.length){grid.innerHTML='<div class="bbb-watch-empty"><h2>No watched players match that search.</h2></div>';return}
  const moverMap=new Map(bbbWatchMovers.map(m=>[String(m.player_key||''),m]));
  const latestMap=bbbWatchLatestMap();
  grid.innerHTML=`<div class="bbb-watch-table-wrap"><table class="bbb-watch-table"><thead><tr><th></th><th>Player</th><th>BBB Rank</th><th>${bbbWatchPeriod} Move</th><th>Market</th><th>Health</th><th>Latest Update</th></tr></thead><tbody>${list.map(p=>{
    const key=String(p.player_key||''),m=moverMap.get(key),u=latestMap.get(key),move=bbbWatchMove(m);
    const market=p.market==null?'—':'#'+p.market;
    const gap=Number(p.gap),gapText=Number.isFinite(gap)?`BBB ${gap>0?'+':''}${gap}`:'No market rank';
    const updateText=String(u?.update_text||p.latest_update||p.injury_note||'No new meaningful update.').trim();
    const updateDate=bbbWatchDate(u?.update_date||p.weekly_update_date||p.injury_updated);
    return `<tr class="bbb-watch-row" data-player-key="${bbbEsc(key)}"><td class="bbb-watch-star-cell"><button class="bbb-watch-toggle watching" data-watch-key="${bbbEsc(key)}" aria-label="Remove ${bbbEsc(p.name)} from watchlist">★</button></td><td><div class="bbb-watch-player"><strong>${bbbEsc(p.name)}</strong><span>${bbbEsc(p.pos||'')} • ${bbbEsc(p.team||'FA')}</span></div></td><td class="bbb-watch-rank">#${bbbEsc(p.rank)}</td><td>${bbbWatchMoveHtml(move)}</td><td><div class="bbb-watch-market"><strong>${bbbEsc(market)}</strong><span class="${gap>0?'positive':gap<0?'negative':'neutral'}">${bbbEsc(gapText)}</span></div></td><td>${bbbWatchHealth(p.injury_status)}</td><td><div class="bbb-watch-update">${updateDate?`<span>${bbbEsc(updateDate)}</span>`:''}<p>${bbbEsc(updateText)}</p></div></td></tr>`;
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
  const key=String(slug||profileNameFromPath?.()||'').trim();
  if(!key)return;
  const dynasty=(players||[]).find(p=>String(p.playerKey||'')===key);
  if(!dynasty)return;
  const meta=document.querySelector('#profileMount .profile-meta');if(!meta)return;
  let wrap=document.querySelector('#profileMount .bbb-profile-watch-wrap');
  if(!wrap){wrap=document.createElement('div');wrap.className='bbb-profile-watch-wrap';meta.insertAdjacentElement('afterend',wrap)}
  wrap.innerHTML=`<button type="button" class="bbb-profile-watch bbb-watch-toggle ${bbbWatchIs(key)?'watching':''}" data-watch-key="${bbbEsc(key)}" aria-pressed="${bbbWatchIs(key)?'true':'false'}">${bbbWatchIs(key)?'★ WATCHING':'☆ WATCH PLAYER'}</button><span>Saved only in this browser.</span>`;
}
function bbbWatchInjectStyles(){
  if(document.querySelector('#bbb-watchlist-styles'))return;
  const s=document.createElement('style');s.id='bbb-watchlist-styles';s.textContent=`
  .bbb-profile-watch-wrap{display:flex;align-items:center;gap:10px;margin-top:18px}.bbb-profile-watch-wrap>span{color:#708178;font-size:9px}.bbb-profile-watch{border:1px solid #315342;background:#0a1511;color:#aabbb1;border-radius:999px;padding:9px 13px;font-size:9px;font-weight:950;letter-spacing:.06em;cursor:pointer}.bbb-profile-watch:hover,.bbb-profile-watch.watching{border-color:#47ca83;color:#7ee2aa;background:#0b2117}.bbb-watch-view{background:#050807;min-height:72vh}.bbb-watch-hero{padding:56px 0 38px;border-bottom:1px solid #173328;background:radial-gradient(circle at 78% 12%,rgba(10,143,77,.19),transparent 38%),linear-gradient(180deg,#07100c,#050807)}.bbb-watch-hero-grid{display:grid;grid-template-columns:1fr auto;gap:30px;align-items:end}.bbb-watch-hero h1{font-size:clamp(46px,7vw,78px);line-height:.94;letter-spacing:-.055em;text-transform:uppercase;margin:10px 0 13px}.bbb-watch-hero h1 span{color:#42c883}.bbb-watch-copy{max-width:670px;color:#93a49b;font-size:14px}.bbb-watch-count-card{min-width:170px;border:1px solid #1d3b2e;background:#09130f;border-radius:15px;padding:18px}.bbb-watch-count-card span{display:block;color:#6f8278;font-size:8px;font-weight:950;letter-spacing:.12em;text-transform:uppercase}.bbb-watch-count-card strong{display:block;color:#65dc9d;font-size:38px;line-height:1;margin:7px 0 4px}.bbb-watch-count-card small{color:#788b80;font-size:9px}.bbb-watch-content{padding:46px 0 72px}.bbb-watch-toolbar{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:15px}.bbb-watch-periods{display:flex;gap:6px}.bbb-watch-period{border:1px solid #264638;background:#0a120e;color:#9caaa3;padding:9px 11px;border-radius:9px;font-size:10px;font-weight:900;cursor:pointer}.bbb-watch-period.active{background:#0a8f4d;border-color:#0a8f4d;color:#fff}.bbb-watch-search{width:min(390px,100%);background:#050a08;border:1px solid #274539;color:#edf3ef;border-radius:9px;padding:10px 12px}.bbb-watch-meta{color:#71847a;font-size:10px;margin-bottom:14px}.bbb-watch-table-wrap{overflow-x:auto;border:1px solid #193127;border-radius:15px;background:#07100c}.bbb-watch-table{min-width:1000px}.bbb-watch-table tbody tr{cursor:pointer}.bbb-watch-table td{vertical-align:middle}.bbb-watch-star-cell{width:42px}.bbb-watch-toggle{border:0;background:transparent;color:#708178;font-size:18px;cursor:pointer;padding:4px}.bbb-watch-toggle.watching{color:#63d997}.bbb-watch-player strong{display:block;color:#fff;font-size:13px}.bbb-watch-player span{display:block;margin-top:3px;color:#71847a;font-size:9px}.bbb-watch-rank{color:#64d697;font-size:16px;font-weight:950}.bbb-watch-move{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:8px;font-weight:950}.bbb-watch-move.up{background:#0a2b1d;border:1px solid #176743;color:#74e5a9}.bbb-watch-move.down{background:#351717;border:1px solid #743535;color:#f08b8b}.bbb-watch-move.flat{background:#18201c;border:1px solid #34443b;color:#aab8b0}.bbb-watch-market strong{display:block;color:#d8e3dd}.bbb-watch-market span{display:block;font-size:9px;margin-top:3px;font-weight:850}.bbb-watch-health{display:inline-flex;border-radius:999px;padding:4px 8px;font-size:8px;font-weight:900;max-width:130px;white-space:normal;line-height:1.2}.bbb-watch-health.healthy{border:1px solid #176743;background:#0a2b1d;color:#74e5a9}.bbb-watch-health.watch{border:1px solid #6c5c29;background:#231f10;color:#e8cd74}.bbb-watch-update{max-width:380px}.bbb-watch-update span{display:block;color:#62d99b;font-size:8px;font-weight:900;margin-bottom:4px}.bbb-watch-update p{margin:0;color:#aebcb4;font-size:10px;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.bbb-watch-empty{padding:70px 22px;text-align:center;border:1px dashed #244236;border-radius:15px;background:#07100c}.bbb-watch-empty-star{font-size:44px;color:#4acb86}.bbb-watch-empty h2{font-size:27px;margin:8px 0}.bbb-watch-empty p{max-width:560px;margin:0 auto 22px;color:#87978e;font-size:12px;line-height:1.7}
  @media(max-width:850px){.bbb-watch-hero-grid{grid-template-columns:1fr}.bbb-watch-count-card{width:180px}.bbb-watch-toolbar{align-items:stretch;flex-direction:column}.bbb-watch-search{width:100%;max-width:none}}
  @media(max-width:640px){.bbb-profile-watch-wrap{align-items:flex-start;flex-direction:column;gap:7px}.bbb-watch-hero{padding:42px 0 31px}.bbb-watch-content{padding:34px 0 55px}.bbb-watch-table-wrap{overflow:visible;border:0;background:transparent}.bbb-watch-table{min-width:0;display:block}.bbb-watch-table thead{display:none}.bbb-watch-table tbody{display:grid;gap:9px;padding:0}.bbb-watch-table tbody tr{display:grid;grid-template-columns:32px 1fr auto;gap:8px 10px;padding:13px;border:1px solid #193127;border-radius:12px;background:#08100c}.bbb-watch-table td{padding:0}.bbb-watch-star-cell{grid-column:1;grid-row:1/3}.bbb-watch-table td:nth-child(2){grid-column:2;grid-row:1}.bbb-watch-table td:nth-child(3){grid-column:3;grid-row:1}.bbb-watch-table td:nth-child(4){grid-column:3;grid-row:2}.bbb-watch-table td:nth-child(5){grid-column:2;grid-row:2}.bbb-watch-table td:nth-child(6){grid-column:2/4;grid-row:3;padding-top:9px;border-top:1px solid #172a22}.bbb-watch-table td:nth-child(7){grid-column:1/4;grid-row:4}.bbb-watch-update{max-width:none}}
  `;document.head.appendChild(s);
}
function bbbWatchInjectUi(){
  if(document.querySelector('#watchlistView'))return;
  bbbWatchInjectStyles();
  const main=document.createElement('main');main.id='watchlistView';main.className='bbb-watch-view hide';main.innerHTML=`<section class="bbb-watch-hero"><div class="shell bbb-watch-hero-grid"><div><div class="profile-kicker">MY BBB</div><h1>My <span>Players.</span></h1><p class="bbb-watch-copy">Keep the players you care about in one place. Rank, BBB movement, market value, health, and the latest meaningful update stay together here.</p></div><aside class="bbb-watch-count-card"><span>Watching</span><strong id="bbbWatchHeroCount">0</strong><small>Saved locally • no account required</small></aside></div></section><section class="bbb-watch-content"><div class="shell"><div class="bbb-watch-toolbar"><div class="bbb-watch-periods"><button class="bbb-watch-period active" data-watch-period="7D">7D Movement</button><button class="bbb-watch-period" data-watch-period="30D">30D Movement</button></div><input id="bbbWatchSearch" class="bbb-watch-search" placeholder="Search your watched players…"></div><div id="bbbWatchCount" class="bbb-watch-meta"></div><div id="bbbWatchGrid"><div class="bbb-watch-empty">Loading your players…</div></div></div></section>`;
  const profile=document.querySelector('#profileView');profile.parentNode.insertBefore(main,profile);
  document.querySelectorAll('.nav-links').forEach(nav=>{if(!nav.querySelector('a[href="#watchlist"]')){const a=document.createElement('a');a.href='#watchlist';a.textContent='My Players ☆';nav.insertBefore(a,nav.lastElementChild)}});
  const mobile=document.querySelector('.mobile-subnav');if(mobile&&!mobile.querySelector('a[href="#watchlist"]')){const a=document.createElement('a');a.href='#watchlist';a.textContent='My Players ☆';mobile.appendChild(a)}
  document.querySelectorAll('[data-watch-period]').forEach(b=>b.onclick=()=>{bbbWatchPeriod=b.dataset.watchPeriod;document.querySelectorAll('[data-watch-period]').forEach(x=>x.classList.toggle('active',x===b));bbbWatchRender()});
  document.querySelector('#bbbWatchSearch').oninput=e=>{bbbWatchQ=e.target.value.trim().toLowerCase();bbbWatchRender()};
}
async function bbbWatchLoadData(){
  const [board,movers,updates]=await Promise.all([
    bbbDbCached('site_dynasty','select=*&order=rank.asc'),
    bbbDbCached('site_movers','select=*'),
    bbbDbCached('site_updates','select=*&order=update_date.desc,id.desc&limit=500')
  ]);
  bbbWatchBoard=(board||[]).filter(x=>x.player_key&&x.rank).sort((a,b)=>Number(a.rank)-Number(b.rank));
  bbbWatchMovers=movers||[];bbbWatchUpdates=updates||[];bbbWatchRender();
}
function bbbWatchRoute(){
  const show=location.hash==='#watchlist'&&!location.pathname.startsWith('/player/');
  const w=document.querySelector('#watchlistView');if(!w)return;w.classList.toggle('hide',!show);
  if(show){['rankingsView','rookieView','prospectView','tradeView','profileView','updatesView','moversView','compareView'].forEach(id=>document.querySelector('#'+id)?.classList.add('hide'));window.scrollTo(0,0);bbbWatchRender()}
}
function bbbWatchOpenPlayer(key){
  if(!key)return;document.querySelector('#watchlistView')?.classList.add('hide');history.pushState({},'',`/player/${encodeURIComponent(key)}`);if(typeof profileRoute==='function')profileRoute(true);else location.href=`/player/${encodeURIComponent(key)}`;
}
function bbbWatchInit(){
  bbbWatchRead();bbbWatchInjectUi();bbbWatchRoute();
  bbbWatchLoadData().catch(e=>{console.error('BBB watchlist:',e);const g=document.querySelector('#bbbWatchGrid');if(g)g.innerHTML='<div class="bbb-watch-empty"><h2>My Players is temporarily unavailable.</h2><p>Your saved players are still stored in this browser.</p></div>'});
  window.addEventListener('hashchange',()=>setTimeout(bbbWatchRoute,0));window.addEventListener('popstate',()=>setTimeout(bbbWatchRoute,0));
  window.addEventListener('storage',e=>{if(e.key===BBB_WATCH_STORAGE){bbbWatchRead();bbbWatchRefreshButtons();bbbWatchRender()}});
}

document.addEventListener('click',e=>{
  const toggle=e.target.closest('.bbb-watch-toggle');if(toggle){e.preventDefault();e.stopPropagation();bbbWatchToggle(toggle.dataset.watchKey);return}
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
