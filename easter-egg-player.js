// Bobby's Big Board special searchable player easter eggs.
// Code-only by design: these entries never enter rankings, market data,
// prospect grades, database history, or automated player scans.
(function(){
  const special={key:'daejon-love',name:'Daejon Love',searchLabel:'PLAYER PROFILE'};
  window.BBB_SPECIAL_PLAYERS=Array.isArray(window.BBB_SPECIAL_PLAYERS)?window.BBB_SPECIAL_PLAYERS:[];
  if(!window.BBB_SPECIAL_PLAYERS.some(p=>p.key===special.key))window.BBB_SPECIAL_PLAYERS.push(special);

  function norm(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
  function isDaejon(slug){return String(slug||'').toLowerCase().replace(/^\/player\//,'').replace(/[?#].*$/,'')===special.key;}
  function trait(name,value,max){const pct=Math.max(0,Math.min(100,(value/max)*100));return `<div class="trait-item"><div class="trait-name">${name}</div><div class="trait-track"><div class="trait-fill" style="width:${pct.toFixed(1)}%"></div></div><div class="trait-score">${value} / ${max}</div></div>`;}

  function renderDaejon(){
    if(typeof profileHideOtherViews==='function')profileHideOtherViews();
    const mount=document.querySelector('#profileMount');if(!mount)return;
    mount.innerHTML=`
      <section class="profile-hero">
        <div class="shell">
          <a class="profile-back" href="#rankings">← BACK TO THE BOARD</a>
          <div class="profile-kicker">BBB PLAYER DATABASE</div>
          <h1 class="profile-title">DAEJON <span>LOVE</span></h1>
          <div class="profile-meta"><span class="pos-chip">WR</span> • SF • Age 35</div>
        </div>
      </section>

      <section class="profile-statbar">
        <div class="shell profile-statgrid" style="--profile-stats:5">
          <div class="profile-stat"><span>Prospect Grade</span><strong>91</strong></div>
          <div class="profile-stat"><span>Position Rank</span><strong>WR1</strong></div>
          <div class="profile-stat"><span>Team</span><strong>SF</strong></div>
          <div class="profile-stat"><span>Draft Status</span><strong>UDFA</strong></div>
          <div class="profile-stat"><span>NFL Games</span><strong>0</strong></div>
        </div>
      </section>

      <section class="profile-content">
        <div class="shell profile-grid">
          <section class="profile-card full bbb-v2-snapshot">
            <div class="profile-card-kicker">PROSPECT SNAPSHOT</div>
            <div class="bbb-v2-snapshot-head">
              <div><h2>Current player profile.</h2><p>BBB prospect grade, positional standing and projected role in one view.</p></div>
            </div>
            <div class="bbb-v2-stat-grid">
              <div><span>BBB Prospect Grade</span><strong>91</strong><small>Elite prospect tier</small></div>
              <div><span>Position Rank</span><strong>WR1</strong><small>Top receiver on the board</small></div>
              <div><span>Team</span><strong>SF</strong><small>San Francisco 49ers</small></div>
              <div><span>Draft Status</span><strong>UDFA</strong><small>Unconventional path</small></div>
              <div><span>Age</span><strong>35</strong></div>
              <div><span>NFL Games</span><strong>0</strong></div>
              <div><span>Career Receptions</span><strong>0</strong></div>
              <div><span>Career Yards</span><strong>0</strong></div>
            </div>
          </section>

          <section class="profile-card">
            <div class="profile-card-kicker">SCOUTING OVERVIEW</div>
            <h2>Rare confidence. Unprecedented projection.</h2>
            <p class="bbb-secret-copy">Love enters the BBB database with one of the most unusual résumés we have ever evaluated. The official NFL production is nonexistent, but the self-created professional profile showed veteran-level confidence, a fully developed personal brand and a willingness to sell the route before the ball was ever snapped.</p>
            <div class="profile-note">The 91 grade reflects the complete Daejon Love experience: elite commitment to the bit, advanced improvisation and a prospect profile that somehow existed before the verified football career did.</div>
          </section>

          <section class="profile-card">
            <div class="profile-card-kicker">BACKGROUND</div>
            <h2>The NFL journey.</h2>
            <div class="profile-rows">
              <div class="profile-row"><span>Claimed Position</span><strong>Wide Receiver</strong></div>
              <div class="profile-row"><span>Claimed Team</span><strong>San Francisco 49ers</strong></div>
              <div class="profile-row"><span>Claimed Path</span><strong>Undrafted → NFL roster</strong></div>
              <div class="profile-row"><span>Verified NFL Games</span><strong>0</strong></div>
              <div class="profile-row"><span>Official NFL Employment</span><strong>None</strong></div>
            </div>
            <div class="profile-note">Federal investigators say Love was never employed by the 49ers or the NFL. Public reporting says he nevertheless presented himself online as a San Francisco wide receiver and used an alleged finger injury to help explain the lack of game appearances.</div>
          </section>

          <section class="profile-card full">
            <div class="profile-trait-head">
              <div><div class="profile-card-kicker">FILM GRADE PROFILE</div><h2 style="margin-bottom:0">Top qualities.</h2></div>
              <div class="profile-grade"><span>Overall Prospect Grade</span><strong>91</strong></div>
            </div>
            <div class="trait-list">
              ${trait('Route Running',4.9,5)}
              ${trait('Release',4.8,5)}
              ${trait('Hands',4.7,5)}
              ${trait('YAC Ability',4.6,5)}
              ${trait('Speed',9.1,10)}
            </div>
            <div class="profile-prospect-meta"><span>WR1</span><span>SF Prospect</span><span>UDFA Profile</span><span>BBB Grade: 91</span></div>
          </section>

          <section class="profile-card full bbb-v2-career-card">
            <div class="profile-card-kicker">CAREER FANTASY PRODUCTION</div>
            <div class="bbb-v2-card-head"><div><h2>Regular-season fantasy history.</h2><p>Full PPR scoring • NFL regular season only • Finish is within position.</p></div><span class="bbb-v2-source">NFL</span></div>
            <div class="bbb-v2-career-summary">
              <div><span>NFL Seasons</span><strong>0</strong></div>
              <div><span>Career PPR</span><strong>0.0</strong></div>
              <div><span>PPR / Game</span><strong>—</strong></div>
              <div><span>Best Finish</span><strong>—</strong></div>
              <div><span>Best PPR Season</span><strong>—</strong></div>
            </div>
            <div class="bbb-v2-career-empty"><strong>No NFL regular-season fantasy production.</strong><span>League and team representatives confirmed Love has never played for or been employed by the NFL or San Francisco 49ers.</span></div>
          </section>

          <section class="profile-card full bbb-secret-story-card">
            <div class="profile-card-kicker">THE DAEJON LOVE FILES</div>
            <h2>How the profile became the story.</h2>
            <p class="bbb-secret-copy">Federal prosecutors allege Love spent years presenting himself as a professional football player while using dating apps, social media, luxury imagery and fabricated investment claims as part of a wider fraud scheme. Authorities allege Love and a co-defendant defrauded at least 26 women of roughly $1.3 million. Love has been charged with wire fraud and conspiracy to commit wire fraud; the allegations have not been proven at trial.</p>
            <p class="bbb-secret-copy">The football angle became especially surreal because online search results reportedly began repeating the false NFL biography back as if it were legitimate. That is the joke behind this page: Bobby's Big Board is giving the fictional football résumé the full prospect treatment while keeping it completely isolated from the real rankings and database.</p>
            <div class="bbb-secret-disclaimer"><strong>PARODY PROFILE</strong><span>Daejon Love is not and has never been a San Francisco 49ers or NFL player. This page is satirical commentary based on public reporting and federal court allegations. It is intentionally excluded from Bobby's real dynasty rankings, prospect database, market history and automated player updates.</span></div>
          </section>
        </div>
      </section>`;
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
    row.className='bbb-search-result';
    row.href='/player/daejon-love';
    row.dataset.bbbSpecialPlayer='daejon-love';
    row.innerHTML=`<div class="bbb-search-result-main"><strong>DAEJON LOVE</strong><span>SF • WR • Prospect Grade 91</span><div class="bbb-search-sources"><span class="bbb-search-source">PLAYER PROFILE</span></div></div>`;
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
    .bbb-secret-copy{color:#aebdb5;font-size:12px;line-height:1.75;margin:0 0 14px}.bbb-secret-story-card h2{margin-bottom:14px}.bbb-secret-disclaimer{margin-top:20px;padding:15px 16px;border:1px solid #31483d;background:#09100d;border-radius:10px}.bbb-secret-disclaimer strong{display:block;color:#82968b;font-size:8px;letter-spacing:.13em;margin-bottom:6px}.bbb-secret-disclaimer span{display:block;color:#778a7f;font-size:9px;line-height:1.6}
    @media(max-width:720px){.bbb-secret-copy{font-size:11px}.bbb-secret-disclaimer span{font-size:8px}}
  `;
  document.head.appendChild(style);
})();
