const BBB_UPDATE_TYPES=['ALL','INJURY','PERFORMANCE','ROLE','ROSTER'];
let bbbUpdates=[],bbbUpdateType='ALL',bbbUpdatePos='ALL',bbbUpdateQ='',bbbUpdateVisible=30;

function bbbUpdateTypeClass(type){
  const t=String(type||'').toLowerCase();
  if(t.includes('injury'))return 'injury';
  if(t.includes('performance')||t.includes('practice'))return 'performance';
  if(t.includes('role')||t.includes('depth'))return 'role';
  if(t.includes('roster')||t.includes('trade')||t.includes('transaction'))return 'roster';
  return 'other';
}
function bbbUpdateTypeLabel(type){
  const c=bbbUpdateTypeClass(type);
  return c==='injury'?'Injury':c==='performance'?'Performance':c==='role'?'Role':c==='roster'?'Roster':String(type||'Update');
}
function bbbFormatUpdateDate(v){
  if(!v)return '';
  const d=new Date(v+'T12:00:00');
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}
function bbbUpdateCard(u){
  const tc=bbbUpdateTypeClass(u.update_type),status=(u.injury_status||'').trim();
  return `<article class="bbb-update-card" data-player-key="${bbbEsc(u.player_key)}">
    <div class="bbb-update-top"><div class="bbb-update-tags"><span class="bbb-update-type ${tc}">${bbbEsc(bbbUpdateTypeLabel(u.update_type))}</span>${status&&tc==='injury'?`<span class="bbb-update-status">${bbbEsc(status)}</span>`:''}</div><span class="bbb-update-date">${bbbEsc(bbbFormatUpdateDate(u.update_date))}</span></div>
    <div class="bbb-update-player"><div><h3>${bbbEsc(u.name)}</h3><div class="bbb-update-meta">${bbbEsc(u.pos||'')} ${u.rank?`• BBB #${bbbEsc(u.rank)}`:''} ${u.team?`• ${bbbEsc(u.team)}`:''}</div></div></div>
    <p>${bbbEsc(u.update_text)}</p>
  </article>`;
}
function bbbInjectUpdatesStyles(){
  if(document.querySelector('#bbb-updates-styles'))return;
  const s=document.createElement('style');s.id='bbb-updates-styles';s.textContent=`
  .bbb-updates-home{padding:62px 0;border-top:1px solid #13271f;border-bottom:1px solid #13271f;background:linear-gradient(180deg,#07100c,#050807)}
  .bbb-updates-home-head,.bbb-updates-page-head{display:flex;justify-content:space-between;gap:24px;align-items:end;margin-bottom:24px}.bbb-updates-home h2,.bbb-updates-page-head h1{margin:6px 0 0;letter-spacing:-.045em;line-height:1}.bbb-updates-home h2{font-size:clamp(32px,4.4vw,50px)}.bbb-updates-page-head h1{font-size:clamp(42px,6vw,70px)}
  .bbb-updates-home-copy,.bbb-updates-page-copy{max-width:540px;color:#87978e;font-size:13px}.bbb-updates-home-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:1fr;gap:12px}.bbb-update-card{height:100%;border:1px solid #193127;background:linear-gradient(160deg,#0c1511,#070b09);border-radius:15px;padding:18px;cursor:pointer;transition:.16s ease}.bbb-update-card:hover{transform:translateY(-1px);border-color:#28523f}.bbb-update-top,.bbb-update-player{display:flex;justify-content:space-between;align-items:flex-start;gap:14px}.bbb-update-tags{display:flex;gap:7px;flex-wrap:wrap}.bbb-update-type,.bbb-update-status{display:inline-flex;border-radius:999px;padding:4px 8px;font-size:8px;font-weight:950;letter-spacing:.06em;text-transform:uppercase;border:1px solid #2b4b3d}.bbb-update-type.injury{background:#2c2210;border-color:#66511c;color:#f0d16f}.bbb-update-type.performance{background:#0a2b1d;border-color:#176743;color:#74e5a9}.bbb-update-type.role{background:#102232;border-color:#28506d;color:#8ec9f0}.bbb-update-type.roster{background:#21192f;border-color:#523d72;color:#c4a7eb}.bbb-update-type.other{background:#1a211e;color:#b6c0ba}.bbb-update-status{background:#231f10;border-color:#6c5c29;color:#e8cd74}.bbb-update-date{font-size:9px;color:#708178}.bbb-update-player{margin-top:16px;align-items:center}.bbb-update-player h3{margin:0;color:#fff;font-size:18px}.bbb-update-meta{margin-top:4px;color:#71847a;font-size:9px;font-weight:850}.bbb-update-card p{margin:14px 0 0;color:#bac7c0;font-size:12px;line-height:1.7}.bbb-updates-home-actions{margin-top:20px;display:flex;justify-content:flex-end}.bbb-updates-view{background:#050807;min-height:70vh}.bbb-updates-hero{padding:56px 0 34px;border-bottom:1px solid #173328;background:radial-gradient(circle at 78% 12%,rgba(10,143,77,.19),transparent 38%),linear-gradient(180deg,#07100c,#050807)}.bbb-updates-content{padding:54px 0 70px}.bbb-update-controls{display:grid;grid-template-columns:auto minmax(220px,1fr) 150px;gap:12px;margin-bottom:18px}.bbb-update-tabs{display:flex;gap:6px;flex-wrap:wrap}.bbb-update-tab{border:1px solid #264638;background:#0a120e;color:#9caaa3;padding:9px 11px;border-radius:9px;font-size:10px;font-weight:900}.bbb-update-tab.active{background:#0a8f4d;border-color:#0a8f4d;color:#fff}.bbb-update-search,.bbb-update-pos{width:100%;background:#050a08;border:1px solid #274539;color:#edf3ef;border-radius:9px;padding:10px 12px}.bbb-update-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:1fr;gap:12px}.bbb-update-count{margin:15px 0;color:#71847a;font-size:10px}.bbb-update-more{display:block;margin:22px auto 0;border:1px solid #2e503f;background:#0d1a14;color:#d7e2dc;border-radius:9px;padding:10px 15px;font-size:11px;font-weight:900}.bbb-update-more.hide{display:none}.bbb-updates-empty{padding:50px 20px;text-align:center;color:#7f8d85;border:1px dashed #244236;border-radius:12px}
  @media(max-width:1000px){.bbb-updates-home-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:850px){.bbb-update-grid{grid-template-columns:1fr}.bbb-update-controls{grid-template-columns:1fr}.bbb-updates-home-head,.bbb-updates-page-head{align-items:flex-start;flex-direction:column}}
  @media(max-width:640px){.bbb-updates-home-grid{grid-template-columns:1fr}}
  @media(max-width:560px){.bbb-updates-home{padding:45px 0}.bbb-updates-content{padding:38px 0 55px}.bbb-update-card{padding:16px}}
  `;document.head.appendChild(s);
}
function bbbInjectUpdatesUi(){
  if(document.querySelector('#bbbUpdatesHome'))return;
  bbbInjectUpdatesStyles();
  const market=document.querySelector('#market');
  if(market){const sec=document.createElement('section');sec.id='bbbUpdatesHome';sec.className='bbb-updates-home';sec.innerHTML=`<div class="shell"><div class="bbb-updates-home-head"><div><div class="kicker">LATEST FROM THE BOARD</div><h2>This week in dynasty.</h2></div><p class="bbb-updates-home-copy">Meaningful injuries, performances, role changes, and roster movement from players on Bobby's board.</p></div><div id="bbbUpdatesHomeGrid" class="bbb-updates-home-grid"><div class="empty">Loading player updates…</div></div><div class="bbb-updates-home-actions"><a class="btn btn-primary" href="#updates">View All Updates</a></div></div>`;market.parentNode.insertBefore(sec,market);}
  const main=document.createElement('main');main.id='updatesView';main.className='bbb-updates-view hide';main.innerHTML=`<section class="bbb-updates-hero"><div class="shell"><div class="profile-kicker">BBB PLAYER NEWS</div><div class="bbb-updates-page-head"><div><h1>Latest Updates.</h1></div><p class="bbb-updates-page-copy">A running feed of meaningful developments for players on the dynasty board. Healthy players stay tracked, but only real news makes the feed.</p></div></div></section><section class="bbb-updates-content"><div class="shell"><div class="bbb-update-controls"><div id="bbbUpdateTabs" class="bbb-update-tabs"></div><input id="bbbUpdateSearch" class="bbb-update-search" placeholder="Search player, team or update…"><select id="bbbUpdatePos" class="bbb-update-pos"><option value="ALL">All positions</option><option>QB</option><option>RB</option><option>WR</option><option>TE</option></select></div><div id="bbbUpdateCount" class="bbb-update-count"></div><div id="bbbUpdateGrid" class="bbb-update-grid"></div><button id="bbbUpdateMore" class="bbb-update-more">Show More Updates</button></div></section>`;
  const profile=document.querySelector('#profileView');profile.parentNode.insertBefore(main,profile);
  document.querySelectorAll('.nav-links').forEach(nav=>{if(!nav.querySelector('a[href="#updates"]')){const a=document.createElement('a');a.href='#updates';a.textContent='Updates';nav.insertBefore(a,nav.lastElementChild)}});
  const mobile=document.querySelector('.mobile-subnav');if(mobile&&!mobile.querySelector('a[href="#updates"]')){const a=document.createElement('a');a.href='#updates';a.textContent='Updates';mobile.appendChild(a)}
  const tabs=document.querySelector('#bbbUpdateTabs');tabs.innerHTML=BBB_UPDATE_TYPES.map(t=>`<button class="bbb-update-tab ${t==='ALL'?'active':''}" data-type="${t}">${t==='ALL'?'All':t[0]+t.slice(1).toLowerCase()}</button>`).join('');
  tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{bbbUpdateType=b.dataset.type;bbbUpdateVisible=30;tabs.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));bbbRenderUpdatesPage()});
  document.querySelector('#bbbUpdateSearch').oninput=e=>{bbbUpdateQ=e.target.value.trim().toLowerCase();bbbUpdateVisible=30;bbbRenderUpdatesPage()};
  document.querySelector('#bbbUpdatePos').onchange=e=>{bbbUpdatePos=e.target.value;bbbUpdateVisible=30;bbbRenderUpdatesPage()};
  document.querySelector('#bbbUpdateMore').onclick=()=>{bbbUpdateVisible+=30;bbbRenderUpdatesPage()};
  document.addEventListener('click',e=>{const card=e.target.closest('.bbb-update-card');if(card){const u=bbbUpdates.find(x=>x.player_key===card.dataset.playerKey);if(u&&typeof profileGo==='function')profileGo(u.name)}});
}
function bbbRenderUpdatesHome(){
  const box=document.querySelector('#bbbUpdatesHomeGrid');if(!box)return;
  if(!bbbUpdates.length){box.innerHTML='<div class="bbb-updates-empty">No meaningful player updates are available yet.</div>';return}
  box.innerHTML=bbbUpdates.slice(0,6).map(x=>bbbUpdateCard(x)).join('');
}
function bbbFilteredUpdates(){return bbbUpdates.filter(u=>{
  const type=bbbUpdateTypeClass(u.update_type).toUpperCase();
  return (bbbUpdateType==='ALL'||type===bbbUpdateType)&&(bbbUpdatePos==='ALL'||u.pos===bbbUpdatePos)&&(!bbbUpdateQ||(`${u.name} ${u.team} ${u.update_type} ${u.update_text} ${u.injury_status}`).toLowerCase().includes(bbbUpdateQ));
})}
function bbbRenderUpdatesPage(){
  const grid=document.querySelector('#bbbUpdateGrid');if(!grid)return;const list=bbbFilteredUpdates();const shown=list.slice(0,bbbUpdateVisible);
  grid.innerHTML=shown.length?shown.map(x=>bbbUpdateCard(x)).join(''):'<div class="bbb-updates-empty">No updates match those filters.</div>';
  document.querySelector('#bbbUpdateCount').textContent=`Showing ${Math.min(shown.length,list.length)} of ${list.length} updates`;
  document.querySelector('#bbbUpdateMore').classList.toggle('hide',shown.length>=list.length);
}
async function bbbLoadUpdates(){
  const data=await bbbDb('site_updates','select=*&order=update_date.desc,id.desc&limit=500');
  bbbUpdates=data||[];bbbRenderUpdatesHome();bbbRenderUpdatesPage();
}
function bbbUpdatesRoute(){
  const show=location.hash==='#updates'&&!location.pathname.startsWith('/player/');
  const uv=document.querySelector('#updatesView');if(!uv)return;
  uv.classList.toggle('hide',!show);
  if(show){['rankingsView','rookieView','prospectView','tradeView','profileView'].forEach(id=>document.querySelector('#'+id)?.classList.add('hide'));window.scrollTo(0,0)}
}
document.addEventListener('DOMContentLoaded',()=>{bbbInjectUpdatesUi();bbbLoadUpdates().catch(e=>{console.error('BBB updates:',e);const h=document.querySelector('#bbbUpdatesHomeGrid');if(h)h.innerHTML='<div class="bbb-updates-empty">Updates are temporarily unavailable.</div>'});bbbUpdatesRoute();window.addEventListener('hashchange',()=>setTimeout(bbbUpdatesRoute,0));window.addEventListener('popstate',()=>setTimeout(bbbUpdatesRoute,0));});
