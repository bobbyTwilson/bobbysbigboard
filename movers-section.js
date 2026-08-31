const BBB_MOVER_MODES=['RISERS','FALLERS','MARKET'];
let bbbMovers=[],bbbMoverMode='RISERS',bbbMoverPos='ALL',bbbMoverPeriod='TRACKING',bbbMoverQ='',bbbMoverVisible=36;

function bbbMoverPeriodField(kind){
  if(kind==='market')return bbbMoverPeriod==='7D'?'market_move_7d':bbbMoverPeriod==='30D'?'market_move_30d':'market_move_tracking';
  return bbbMoverPeriod==='7D'?'bbb_move_7d':bbbMoverPeriod==='30D'?'bbb_move_30d':'bbb_move_tracking';
}
function bbbMoverValue(m,kind='bbb'){
  const v=Number(m?.[bbbMoverPeriodField(kind)]);
  return Number.isFinite(v)?v:null;
}
function bbbMoverStartRank(m,kind='bbb'){
  if(kind==='market')return bbbMoverPeriod==='7D'?m.market_7d_ref_rank:bbbMoverPeriod==='30D'?m.market_30d_ref_rank:m.market_tracking_start_rank;
  return bbbMoverPeriod==='7D'?m.bbb_7d_ref_rank:bbbMoverPeriod==='30D'?m.bbb_30d_ref_rank:m.tracking_start_rank;
}
function bbbMoverArrow(v){
  if(v>0)return `<span class="bbb-move-pill up">↑ ${bbbEsc(v)}</span>`;
  if(v<0)return `<span class="bbb-move-pill down">↓ ${bbbEsc(Math.abs(v))}</span>`;
  return '<span class="bbb-move-pill flat">No change</span>';
}
function bbbMoverViewClass(v){
  const s=String(v||'').toUpperCase();
  return s.includes('BUY')?'buy':s.includes('FADE')?'fade':'market';
}
function bbbMoverViewLabel(v){
  const s=String(v||'').toUpperCase();
  return s.includes('BUY')?'BBB BUY':s.includes('FADE')?'BBB FADE':'≈ MARKET';
}
function bbbMoverDate(v){
  if(!v)return '';
  return new Date(v+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}
function bbbMoverHomeCard(m,kind){
  if(kind==='market'){
    const gap=Number(m.current_gap),cls=bbbMoverViewClass(m.market_view);
    return `<article class="bbb-mover-row" data-player-key="${bbbEsc(m.player_key)}"><div class="bbb-mover-rank">#${bbbEsc(m.current_rank)}</div><div class="bbb-mover-person"><strong>${bbbEsc(m.name)}</strong><span>${bbbEsc(m.pos||'')} • ${bbbEsc(m.team||'FA')} • Market #${bbbEsc(m.current_market_rank??'—')}</span></div><div class="bbb-mover-right"><span class="bbb-market-pill ${cls}">${bbbEsc(bbbMoverViewLabel(m.market_view))}</span><small>${gap==null||!Number.isFinite(gap)?'No market rank':`BBB ${gap>0?'+':''}${gap}`}</small></div></article>`;
  }
  const v=Number(m.bbb_move_tracking)||0,start=m.tracking_start_rank;
  return `<article class="bbb-mover-row" data-player-key="${bbbEsc(m.player_key)}"><div class="bbb-mover-rank">#${bbbEsc(m.current_rank)}</div><div class="bbb-mover-person"><strong>${bbbEsc(m.name)}</strong><span>${bbbEsc(m.pos||'')} • ${bbbEsc(m.team||'FA')} • #${bbbEsc(start)} → #${bbbEsc(m.current_rank)}</span></div><div class="bbb-mover-right">${bbbMoverArrow(v)}<small>since tracking began</small></div></article>`;
}
function bbbMoverFullCard(m){
  const marketMode=bbbMoverMode==='MARKET';
  const move=bbbMoverValue(m,marketMode?'market':'bbb');
  const start=bbbMoverStartRank(m,marketMode?'market':'bbb');
  const gap=Number(m.current_gap),cls=bbbMoverViewClass(m.market_view);
  const movementText=marketMode
    ? `${start!=null?'Market #'+bbbEsc(start)+' → ':''}Market #${bbbEsc(m.current_market_rank??'—')}`
    : `${start!=null?'BBB #'+bbbEsc(start)+' → ':''}BBB #${bbbEsc(m.current_rank)}`;
  return `<article class="bbb-mover-card" data-player-key="${bbbEsc(m.player_key)}"><div class="bbb-mover-card-top"><div><span class="bbb-mover-pos">${bbbEsc(m.pos||'')}</span><span class="bbb-mover-team">${bbbEsc(m.team||'FA')}</span></div>${marketMode&&move===0?`<span class="bbb-market-pill ${cls}">${bbbEsc(bbbMoverViewLabel(m.market_view))}</span>`:bbbMoverArrow(move||0)}</div><h3>${bbbEsc(m.name)}</h3><div class="bbb-mover-route">${movementText}</div><div class="bbb-mover-card-grid"><div><span>BBB Rank</span><strong>#${bbbEsc(m.current_rank)}</strong></div><div><span>Market Rank</span><strong>${m.current_market_rank==null?'—':'#'+bbbEsc(m.current_market_rank)}</strong></div><div><span>BBB vs Market</span><strong class="${gap>0?'positive':gap<0?'negative':'neutral'}">${Number.isFinite(gap)?(gap>0?'+':'')+gap:'—'}</strong></div></div></article>`;
}
function bbbMarketMovementReady(){
  return bbbMovers.some(m=>Math.abs(bbbMoverValue(m,'market')||0)>0);
}
function bbbMoverFiltered(){
  let list=bbbMovers.filter(m=>(bbbMoverPos==='ALL'||m.pos===bbbMoverPos)&&(!bbbMoverQ||(`${m.name} ${m.team} ${m.pos}`).toLowerCase().includes(bbbMoverQ)));
  if(bbbMoverMode==='RISERS')return list.filter(m=>(bbbMoverValue(m,'bbb')||0)>0).sort((a,b)=>(bbbMoverValue(b,'bbb')||0)-(bbbMoverValue(a,'bbb')||0));
  if(bbbMoverMode==='FALLERS')return list.filter(m=>(bbbMoverValue(m,'bbb')||0)<0).sort((a,b)=>(bbbMoverValue(a,'bbb')||0)-(bbbMoverValue(b,'bbb')||0));
  if(bbbMarketMovementReady())return list.filter(m=>m.current_market_rank!=null).sort((a,b)=>Math.abs(bbbMoverValue(b,'market')||0)-Math.abs(bbbMoverValue(a,'market')||0));
  return list.filter(m=>m.current_market_rank!=null&&m.current_gap!=null).sort((a,b)=>Math.abs(Number(b.current_gap))-Math.abs(Number(a.current_gap)));
}
function bbbMoverNotice(){
  const first=bbbMovers.map(x=>x.tracking_start_date).filter(Boolean).sort()[0];
  const marketFirst=bbbMovers.map(x=>x.market_tracking_start_date).filter(Boolean).sort()[0];
  if(bbbMoverMode==='MARKET'&&!bbbMarketMovementReady())return `Market history starts ${bbbMoverDate(marketFirst)}. Until a second market snapshot arrives, Market Watch is showing the biggest current BBB-vs-market gaps.`;
  if(bbbMoverPeriod==='TRACKING')return `BBB ranking history starts ${bbbMoverDate(first)}. Movement shown is from the first preserved snapshot to the current board.`;
  const days=bbbMoverPeriod==='7D'?7:30;
  if(first&&((Date.now()-new Date(first+'T12:00:00').getTime())/86400000)<days)return `${bbbMoverPeriod} history is still building. For now, this view uses the earliest preserved snapshot from ${bbbMoverDate(first)}.`;
  return `${bbbMoverPeriod} movement compares the current board to the closest preserved snapshot at least ${days} days ago.`;
}
function bbbRenderMoversHome(){
  const box=document.querySelector('#bbbMoversHomeGrid');if(!box)return;
  const risers=[...bbbMovers].filter(x=>(Number(x.bbb_move_tracking)||0)>0).sort((a,b)=>Number(b.bbb_move_tracking)-Number(a.bbb_move_tracking)).slice(0,3);
  const fallers=[...bbbMovers].filter(x=>(Number(x.bbb_move_tracking)||0)<0).sort((a,b)=>Number(a.bbb_move_tracking)-Number(b.bbb_move_tracking)).slice(0,3);
  const market=[...bbbMovers].filter(x=>x.current_market_rank!=null&&x.current_gap!=null).sort((a,b)=>Math.abs(Number(b.current_gap))-Math.abs(Number(a.current_gap))).slice(0,3);
  const group=(title,kicker,list,kind)=>`<section class="bbb-mover-group"><div class="bbb-mover-group-head"><div><span>${kicker}</span><h3>${title}</h3></div></div><div class="bbb-mover-list">${list.map(x=>bbbMoverHomeCard(x,kind)).join('')||'<div class="bbb-mover-empty">Movement is still building.</div>'}</div></section>`;
  box.innerHTML=group('Biggest Risers','BOARD UP',risers,'bbb')+group('Biggest Fallers','BOARD DOWN',fallers,'bbb')+group('Market Watch','BBB VS MARKET',market,'market');
}
function bbbRenderMoversPage(){
  const grid=document.querySelector('#bbbMoverGrid');if(!grid)return;
  const list=bbbMoverFiltered(),shown=list.slice(0,bbbMoverVisible);
  grid.innerHTML=shown.length?shown.map(bbbMoverFullCard).join(''):'<div class="bbb-mover-empty page">No players match these filters yet.</div>';
  const count=document.querySelector('#bbbMoverCount');if(count)count.textContent=`Showing ${Math.min(shown.length,list.length)} of ${list.length} players`;
  const more=document.querySelector('#bbbMoverMore');if(more)more.classList.toggle('hide',shown.length>=list.length);
  const note=document.querySelector('#bbbMoverNotice');if(note)note.textContent=bbbMoverNotice();
}
function bbbInjectMoversStyles(){
  if(document.querySelector('#bbb-movers-styles'))return;
  const s=document.createElement('style');s.id='bbb-movers-styles';s.textContent=`
  .bbb-movers-home{padding:64px 0;border-bottom:1px solid #13271f;background:#050807}.bbb-movers-head,.bbb-movers-page-head{display:flex;justify-content:space-between;gap:24px;align-items:end;margin-bottom:24px}.bbb-movers-head h2,.bbb-movers-page-head h1{margin:6px 0 0;letter-spacing:-.045em;line-height:1}.bbb-movers-head h2{font-size:clamp(32px,4.4vw,50px)}.bbb-movers-page-head h1{font-size:clamp(42px,6vw,70px)}.bbb-movers-copy{max-width:545px;color:#87978e;font-size:13px}.bbb-movers-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.bbb-mover-group{border:1px solid #193127;background:linear-gradient(160deg,#0c1511,#070b09);border-radius:16px;padding:17px}.bbb-mover-group-head span{color:#50ce8e;font-size:8px;font-weight:950;letter-spacing:.12em}.bbb-mover-group-head h3{font-size:19px;margin:4px 0 14px}.bbb-mover-list{display:grid;gap:7px}.bbb-mover-row{display:grid;grid-template-columns:42px 1fr auto;gap:10px;align-items:center;border:1px solid #183027;background:#08100c;border-radius:10px;padding:10px;cursor:pointer}.bbb-mover-row:hover,.bbb-mover-card:hover{border-color:#2c5944}.bbb-mover-rank{font-size:14px;font-weight:950;color:#64d697}.bbb-mover-person strong{display:block;color:#fff;font-size:11px}.bbb-mover-person span{display:block;color:#71847a;font-size:8px;margin-top:2px}.bbb-mover-right{text-align:right}.bbb-mover-right small{display:block;color:#60746a;font-size:7px;margin-top:4px}.bbb-move-pill,.bbb-market-pill{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:8px;font-weight:950}.bbb-move-pill.up{background:#0a2b1d;border:1px solid #176743;color:#74e5a9}.bbb-move-pill.down{background:#351717;border:1px solid #743535;color:#f08b8b}.bbb-move-pill.flat{background:#18201c;border:1px solid #34443b;color:#aab8b0}.bbb-market-pill.buy{background:#0b4229;border:1px solid #197847;color:#67e29d}.bbb-market-pill.fade{background:#3b1717;border:1px solid #713232;color:#f08f8f}.bbb-market-pill.market{background:#1a211e;border:1px solid #313d37;color:#b6c0ba}.bbb-movers-actions{display:flex;justify-content:flex-end;margin-top:19px}.bbb-movers-view{background:#050807;min-height:70vh}.bbb-movers-hero{padding:56px 0 34px;border-bottom:1px solid #173328;background:radial-gradient(circle at 78% 12%,rgba(10,143,77,.19),transparent 38%),linear-gradient(180deg,#07100c,#050807)}.bbb-movers-content{padding:50px 0 70px}.bbb-mover-toolbar{display:grid;grid-template-columns:auto auto minmax(180px,1fr) 150px;gap:10px;margin-bottom:12px}.bbb-mover-tabs,.bbb-mover-periods{display:flex;gap:6px;flex-wrap:wrap}.bbb-mover-tab,.bbb-mover-period{border:1px solid #264638;background:#0a120e;color:#9caaa3;padding:9px 11px;border-radius:9px;font-size:10px;font-weight:900}.bbb-mover-tab.active,.bbb-mover-period.active{background:#0a8f4d;border-color:#0a8f4d;color:#fff}.bbb-mover-search,.bbb-mover-pos{width:100%;background:#050a08;border:1px solid #274539;color:#edf3ef;border-radius:9px;padding:10px 12px}.bbb-mover-notice{margin:0 0 17px;padding:11px 13px;border-left:3px solid #0a8f4d;background:#09140f;color:#94a79d;font-size:10px;line-height:1.55}.bbb-mover-page-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.bbb-mover-card{border:1px solid #193127;background:linear-gradient(160deg,#0c1511,#070b09);border-radius:15px;padding:17px;cursor:pointer}.bbb-mover-card-top{display:flex;justify-content:space-between;gap:12px;align-items:center}.bbb-mover-pos{color:#9fd8b8;border:1px solid #2b5a44;background:#0c2118;padding:4px 7px;border-radius:999px;font-size:8px;font-weight:950}.bbb-mover-team{color:#72857a;font-size:9px;margin-left:7px}.bbb-mover-card h3{font-size:20px;margin:15px 0 3px}.bbb-mover-route{color:#9aaea3;font-size:10px;font-weight:850}.bbb-mover-card-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:15px}.bbb-mover-card-grid div{padding:9px;border:1px solid #183027;background:#08100c;border-radius:8px}.bbb-mover-card-grid span{display:block;color:#65786e;font-size:7px;text-transform:uppercase;font-weight:900}.bbb-mover-card-grid strong{display:block;margin-top:3px;font-size:12px}.bbb-mover-count{margin:14px 0;color:#71847a;font-size:10px}.bbb-mover-more{display:block;margin:22px auto 0;border:1px solid #2e503f;background:#0d1a14;color:#d7e2dc;border-radius:9px;padding:10px 15px;font-size:11px;font-weight:900}.bbb-mover-more.hide{display:none}.bbb-mover-empty{padding:24px 12px;text-align:center;color:#71847a;font-size:10px}.bbb-mover-empty.page{grid-column:1/-1;border:1px dashed #244236;border-radius:12px;padding:50px 20px}
  @media(max-width:1050px){.bbb-movers-grid{grid-template-columns:1fr}.bbb-mover-toolbar{grid-template-columns:1fr 1fr}.bbb-mover-search,.bbb-mover-pos{grid-column:auto}}
  @media(max-width:800px){.bbb-movers-head,.bbb-movers-page-head{align-items:flex-start;flex-direction:column}.bbb-mover-page-grid{grid-template-columns:1fr}}
  @media(max-width:600px){.bbb-movers-home{padding:46px 0}.bbb-mover-toolbar{grid-template-columns:1fr}.bbb-mover-card-grid{grid-template-columns:1fr 1fr}.bbb-mover-row{grid-template-columns:38px 1fr auto}.bbb-mover-person span{font-size:7px}}
  `;document.head.appendChild(s);
}
function bbbInjectMoversUi(){
  if(document.querySelector('#bbbMoversHome'))return;
  bbbInjectMoversStyles();
  const market=document.querySelector('#market');
  if(market){const sec=document.createElement('section');sec.id='bbbMoversHome';sec.className='bbb-movers-home';sec.innerHTML=`<div class="shell"><div class="bbb-movers-head"><div><div class="kicker">BOARD MOVEMENT</div><h2>Who moved — and why it matters.</h2></div><p class="bbb-movers-copy">Track the biggest changes in Bobby's rankings, then compare the board to the dynasty market as both evolve over time.</p></div><div id="bbbMoversHomeGrid" class="bbb-movers-grid"><div class="empty">Loading board movement…</div></div><div class="bbb-movers-actions"><a class="btn btn-primary" href="#movers">View All Movers</a></div></div>`;market.parentNode.insertBefore(sec,market);}
  const main=document.createElement('main');main.id='moversView';main.className='bbb-movers-view hide';main.innerHTML=`<section class="bbb-movers-hero"><div class="shell"><div class="profile-kicker">BBB BOARD MOVEMENT</div><div class="bbb-movers-page-head"><div><h1>Movers.</h1></div><p class="bbb-movers-copy">Every meaningful rise and fall in Bobby's Top 500, plus a daily record of where the dynasty market stands relative to BBB.</p></div></div></section><section class="bbb-movers-content"><div class="shell"><div class="bbb-mover-toolbar"><div id="bbbMoverTabs" class="bbb-mover-tabs"></div><div id="bbbMoverPeriods" class="bbb-mover-periods"></div><input id="bbbMoverSearch" class="bbb-mover-search" placeholder="Search player, team or position…"><select id="bbbMoverPos" class="bbb-mover-pos"><option value="ALL">All positions</option><option>QB</option><option>RB</option><option>WR</option><option>TE</option></select></div><div id="bbbMoverNotice" class="bbb-mover-notice"></div><div id="bbbMoverCount" class="bbb-mover-count"></div><div id="bbbMoverGrid" class="bbb-mover-page-grid"></div><button id="bbbMoverMore" class="bbb-mover-more">Show More Movers</button></div></section>`;
  const profile=document.querySelector('#profileView');profile.parentNode.insertBefore(main,profile);
  document.querySelectorAll('.nav-links').forEach(nav=>{if(!nav.querySelector('a[href="#movers"]')){const a=document.createElement('a');a.href='#movers';a.textContent='Movers';const yt=[...nav.querySelectorAll('a')].find(x=>x.href.includes('youtube'));nav.insertBefore(a,yt||null)}});
  const mobile=document.querySelector('.mobile-subnav');if(mobile&&!mobile.querySelector('a[href="#movers"]')){const a=document.createElement('a');a.href='#movers';a.textContent='Movers';mobile.appendChild(a)}
  const tabs=document.querySelector('#bbbMoverTabs');tabs.innerHTML=BBB_MOVER_MODES.map(t=>`<button class="bbb-mover-tab ${t==='RISERS'?'active':''}" data-mode="${t}">${t==='RISERS'?'Risers':t==='FALLERS'?'Fallers':'Market'}</button>`).join('');
  tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{bbbMoverMode=b.dataset.mode;bbbMoverVisible=36;tabs.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));bbbRenderMoversPage()});
  const periods=document.querySelector('#bbbMoverPeriods');periods.innerHTML=[['TRACKING','Since Tracking'],['7D','7D'],['30D','30D']].map(([v,l])=>`<button class="bbb-mover-period ${v==='TRACKING'?'active':''}" data-period="${v}">${l}</button>`).join('');
  periods.querySelectorAll('button').forEach(b=>b.onclick=()=>{bbbMoverPeriod=b.dataset.period;bbbMoverVisible=36;periods.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));bbbRenderMoversPage()});
  document.querySelector('#bbbMoverSearch').oninput=e=>{bbbMoverQ=e.target.value.trim().toLowerCase();bbbMoverVisible=36;bbbRenderMoversPage()};
  document.querySelector('#bbbMoverPos').onchange=e=>{bbbMoverPos=e.target.value;bbbMoverVisible=36;bbbRenderMoversPage()};
  document.querySelector('#bbbMoverMore').onclick=()=>{bbbMoverVisible+=36;bbbRenderMoversPage()};
  document.addEventListener('click',e=>{const card=e.target.closest('.bbb-mover-row,.bbb-mover-card');if(!card)return;const m=bbbMovers.find(x=>x.player_key===card.dataset.playerKey);if(m&&typeof profileGo==='function')profileGo(m.name)});
}
async function bbbLoadMovers(){
  const data=await bbbDb('site_movers','select=*');bbbMovers=data||[];bbbRenderMoversHome();bbbRenderMoversPage();
}
function bbbMoversRoute(){
  const show=location.hash==='#movers'&&!location.pathname.startsWith('/player/');
  const mv=document.querySelector('#moversView');if(!mv)return;mv.classList.toggle('hide',!show);
  if(show){['rankingsView','rookieView','prospectView','tradeView','profileView','updatesView'].forEach(id=>document.querySelector('#'+id)?.classList.add('hide'));window.scrollTo(0,0)}
}
function bbbMoversInit(){
  bbbInjectMoversUi();bbbLoadMovers().catch(e=>{console.error('BBB movers:',e);const h=document.querySelector('#bbbMoversHomeGrid');if(h)h.innerHTML='<div class="bbb-mover-empty">Board movement is temporarily unavailable.</div>'});bbbMoversRoute();window.addEventListener('hashchange',()=>setTimeout(bbbMoversRoute,0));window.addEventListener('popstate',()=>setTimeout(bbbMoversRoute,0));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bbbMoversInit);else bbbMoversInit();
