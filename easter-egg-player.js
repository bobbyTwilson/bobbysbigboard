// Bobby's Big Board special searchable player easter eggs.
// Code-only by design: these entries never enter rankings, market data,
// prospect grades, database history, or automated player scans.
(function(){
  const special={key:'daejon-love',name:'Daejon Love',searchLabel:'BBB SPECIAL ENTRY'};
  window.BBB_SPECIAL_PLAYERS=Array.isArray(window.BBB_SPECIAL_PLAYERS)?window.BBB_SPECIAL_PLAYERS:[];
  if(!window.BBB_SPECIAL_PLAYERS.some(p=>p.key===special.key))window.BBB_SPECIAL_PLAYERS.push(special);

  function norm(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
  function isDaejon(slug){return String(slug||'').toLowerCase().replace(/^\/player\//,'').replace(/[?#].*$/,'')===special.key;}

  function renderDaejon(){
    if(typeof profileHideOtherViews==='function')profileHideOtherViews();
    const mount=document.querySelector('#profileMount');if(!mount)return;
    mount.innerHTML=`<section class="profile-hero bbb-secret-profile-hero"><div class="shell"><a class="profile-back" href="#rankings">← BACK TO THE BOARD</a><div class="profile-kicker">BBB SPECIAL PLAYER DATABASE</div><h1 class="profile-title">DAEJON <span>LOVE</span></h1><div class="profile-meta"><span class="bbb-secret-chip">UNRANKED • BY DESIGN</span></div></div></section><section class="profile-content bbb-secret-profile-content"><div class="shell profile-grid"><section class="profile-card full bbb-secret-main-card"><div class="profile-card-kicker">OFFICIAL BBB SCOUTING REPORT</div><h2>The board wasn't ready.</h2><p class="bbb-secret-lead">Some players get a dynasty rank. Some players get a market value. Daejon Love has been placed in a separate category entirely.</p><div class="bbb-secret-grid"><div><span>BBB Rank</span><strong>CLASSIFIED</strong></div><div><span>Market Rank</span><strong>COWARDS</strong></div><div><span>Trade Value</span><strong>UNTOUCHABLE</strong></div><div><span>Tier</span><strong>DAEJON</strong></div></div><div class="bbb-secret-note"><strong>Why isn't he in the Top 500?</strong><span>Because rankings require comparison, and that would be unfair to the other 500 players.</span></div></section></div></section>`;
    window.scrollTo(0,0);
  }

  if(typeof profileRender==='function'){
    const originalProfileRender=profileRender;
    profileRender=function(slug){if(isDaejon(slug)){renderDaejon();return Promise.resolve();}return originalProfileRender.apply(this,arguments);};
  }

  function shouldShowSearchResult(q){
    const query=norm(q),name=norm(special.name);
    return !!query&&(name.includes(query)||query.includes(name));
  }
  function injectSearchResult(){
    const input=document.querySelector('#bbbGlobalSearchInput');
    const results=document.querySelector('#bbbGlobalSearchResults');
    if(!input||!results)return;
    results.querySelector('[data-bbb-special-player="daejon-love"]')?.remove();
    if(!shouldShowSearchResult(input.value))return;
    const row=document.createElement('a');
    row.className='bbb-search-result bbb-secret-search-result';
    row.href='/player/daejon-love';
    row.dataset.bbbSpecialPlayer='daejon-love';
    row.innerHTML=`<div class="bbb-search-result-main"><strong>DAEJON LOVE</strong><span>Unranked • by design</span><div class="bbb-search-sources"><span class="bbb-search-source special">BBB SPECIAL ENTRY</span></div></div><div class="bbb-secret-search-mark">?</div>`;
    results.prepend(row);
  }

  document.addEventListener('input',e=>{
    if(e.target?.id==='bbbGlobalSearchInput')queueMicrotask(injectSearchResult);
  });
  document.addEventListener('click',e=>{
    const link=e.target.closest('[data-bbb-special-player="daejon-love"]');
    if(!link)return;
    e.preventDefault();e.stopImmediatePropagation();
    history.pushState({},'', '/player/daejon-love');
    if(typeof profileRoute==='function')profileRoute(true);else location.href='/player/daejon-love';
  },true);
  document.addEventListener('DOMContentLoaded',()=>{
    let tries=0;
    const timer=setInterval(()=>{
      const results=document.querySelector('#bbbGlobalSearchResults');
      if(results){
        clearInterval(timer);
        new MutationObserver(()=>{if(!results.querySelector('[data-bbb-special-player="daejon-love"]'))queueMicrotask(injectSearchResult);}).observe(results,{childList:true});
      }else if(++tries>40)clearInterval(timer);
    },100);
  });

  const style=document.createElement('style');style.id='bbb-secret-player-styles';style.textContent=`
    .bbb-secret-profile-hero{background:radial-gradient(circle at 78% 12%,rgba(80,206,142,.28),transparent 38%),linear-gradient(180deg,#07100c,#050807)}
    .bbb-secret-chip{display:inline-flex;padding:6px 10px;border:1px solid #3e7b5f;background:#0b2418;color:#72e2a8;border-radius:999px;font-size:9px;font-weight:950;letter-spacing:.1em}
    .bbb-secret-main-card h2{font-size:clamp(30px,4vw,48px);margin-bottom:12px}.bbb-secret-lead{max-width:760px;color:#aebdb5;font-size:14px;line-height:1.7;margin:0 0 24px}
    .bbb-secret-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.bbb-secret-grid>div{padding:18px;border:1px solid #1e4333;background:#08130e;border-radius:12px}.bbb-secret-grid span{display:block;color:#6d8377;font-size:8px;font-weight:950;letter-spacing:.1em;text-transform:uppercase}.bbb-secret-grid strong{display:block;color:#63dc9c;font-size:18px;margin-top:6px}
    .bbb-secret-note{margin-top:18px;padding:17px 18px;border-left:3px solid #50ce8e;background:#0a1711;border-radius:0 10px 10px 0}.bbb-secret-note strong,.bbb-secret-note span{display:block}.bbb-secret-note strong{color:#eef5f1;font-size:11px}.bbb-secret-note span{color:#94a79d;font-size:11px;margin-top:5px;line-height:1.6}
    .bbb-search-source.special{background:#271d0c;border:1px solid #765a22;color:#f0cc79}.bbb-secret-search-result{border-color:#4c3b19!important;background:linear-gradient(90deg,#151006,#0b1711)!important}.bbb-secret-search-mark{flex:none;width:30px;height:30px;display:grid;place-items:center;border:1px solid #765a22;border-radius:50%;color:#f0cc79;font-size:14px;font-weight:950}
    @media(max-width:720px){.bbb-secret-grid{grid-template-columns:1fr 1fr}.bbb-secret-grid strong{font-size:15px}}
  `;
  document.head.appendChild(style);
})();
