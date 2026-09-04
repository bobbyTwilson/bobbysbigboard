// Bobby's Big Board Opportunity Feed V1.
// A conservative, recent feed of clear dynasty opportunity gains/losses derived
// from existing player update records. Ambiguous news stays in Latest Updates.

(function(){
  const BBB_OPPORTUNITY_DAYS=14;
  let bbbOpportunityRows=[];
  let bbbOpportunityMode='ALL';
  let bbbOpportunityPos='ALL';
  let bbbOpportunityQ='';
  let bbbOpportunityVisible=30;

  function bbbOpportunityEsc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function bbbOpportunityDate(v){if(!v)return '';return new Date(v+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
  function bbbOpportunityNorm(v){return String(v||'').toLowerCase().replace(/[’]/g,"'").trim()}

  function bbbOpportunityRankImpactSignal(u){
    const impact=bbbOpportunityNorm(u?.rank_impact);
    if(!impact||/^(none|neutral)$/i.test(impact)||impact.includes('no ranking change'))return null;
    if(/\b(added|up|moved up|raised|rise|riser)\b/.test(impact))return 'GAIN';
    if(/\b(down|moved down|lowered|fall|faller)\b/.test(impact))return 'LOSS';
    const ranks=[...impact.matchAll(/#(\d+)/g)].map(m=>Number(m[1]));
    if(ranks.length>=2&&Number.isFinite(ranks[0])&&Number.isFinite(ranks[1]))return ranks[1]<ranks[0]?'GAIN':ranks[1]>ranks[0]?'LOSS':null;
    return null;
  }

  function bbbOpportunitySignal(u){
    const explicit=bbbOpportunityRankImpactSignal(u);
    if(explicit)return explicit;
    const type=bbbOpportunityNorm(u?.update_type);
    const text=bbbOpportunityNorm(u?.update_text);
    if(!text)return null;

    // Clear negative opportunity events. Injury news only qualifies when the
    // absence/role loss is concrete, not when a player is merely questionable.
    const losses=[
      /season[- ]ending/,/out for (the )?2026/,/placed .* injured reserve/,/on injured reserve/,/reserve\/pup/,/opens? .* on ir/,
      /will miss at least/,/cannot practice or play/,/commissioner'?s exempt list/,/practice squad/,/waived/,/released/,
      /\bqb3\b/,/third in the quarterback room/,/behind .* in the .* order/,/behind .* on .* depth chart/,/outside the first[- ]team/,
      /reducing .* path to playing time/,/reducing .* path to snaps/,/lost .* starting/,/no roster spot/
    ];
    if(losses.some(r=>r.test(text)))return 'LOSS';

    // Clear positive opportunity events. Avoid generic "made the roster" unless
    // the update itself establishes a real role or explicit rank impact.
    const gains=[
      /starting quarterback/,/starting (outside )?receiver/,/starting tight end/,/with the first[- ]team offense/,/first[- ]team wide receiver/,
      /primary backup/,/direct backup/,/no\. 2 quarterback/,/\bqb2\b/,/clear backup role/,/lead .* backfield/,/lead .* room/,
      /larger workload/,/substantially larger workload/,/expanded workload/,/substantial .* role/,/meaningful .* role/,
      /clear path to early[- ]season snaps/,/expected to handle .* goal[- ]line role/,/expected to handle .* short[- ]yardage/,
      /primary kick and punt returner/,/primary punt returner/,/promoted to .* active roster/,/elevated to .* active roster/
    ];
    if(gains.some(r=>r.test(text)))return 'GAIN';

    // Recovery-only injury blurbs stay in Updates unless the stored rank impact
    // explicitly says the dynasty opportunity changed.
    if(type.includes('injury')||type.includes('practice'))return null;
    return null;
  }

  function bbbOpportunityRecentRows(){
    const cutoff=Date.now()-BBB_OPPORTUNITY_DAYS*86400000;
    const latestByPlayer=new Map();
    [...bbbOpportunityRows]
      .filter(u=>u?.rank!=null&&u?.player_key&&u?.update_date)
      .sort((a,b)=>String(b.update_date).localeCompare(String(a.update_date))||Number(b.id||0)-Number(a.id||0))
      .forEach(u=>{
        const ts=Date.parse(String(u.update_date)+'T12:00:00');
        if(!Number.isFinite(ts)||ts<cutoff)return;
        const signal=bbbOpportunitySignal(u);
        if(!signal||latestByPlayer.has(u.player_key))return;
        latestByPlayer.set(u.player_key,{...u,opportunity_signal:signal});
      });
    return [...latestByPlayer.values()].sort((a,b)=>String(b.update_date).localeCompare(String(a.update_date))||Number(a.rank||9999)-Number(b.rank||9999));
  }

  function bbbOpportunityFiltered(){
    return bbbOpportunityRecentRows().filter(u=>
      (bbbOpportunityMode==='ALL'||u.opportunity_signal===bbbOpportunityMode)&&
      (bbbOpportunityPos==='ALL'||u.pos===bbbOpportunityPos)&&
      (!bbbOpportunityQ||(`${u.name} ${u.team} ${u.pos} ${u.update_type} ${u.update_text}`).toLowerCase().includes(bbbOpportunityQ))
    );
  }

  function bbbOpportunityCard(u){
    const gain=u.opportunity_signal==='GAIN';
    const signalLabel=gain?'OPPORTUNITY ↑':'OPPORTUNITY ↓';
    const type=typeof bbbUpdateTypeLabel==='function'?bbbUpdateTypeLabel(u.update_type):String(u.update_type||'Update');
    return `<article class="bbb-opportunity-card ${gain?'gain':'loss'}" data-player-key="${bbbOpportunityEsc(u.player_key)}">
      <div class="bbb-opportunity-top"><div class="bbb-opportunity-tags"><span class="bbb-opportunity-signal ${gain?'gain':'loss'}">${signalLabel}</span><span class="bbb-opportunity-type">${bbbOpportunityEsc(type)}</span></div><span class="bbb-opportunity-date">${bbbOpportunityEsc(bbbOpportunityDate(u.update_date))}</span></div>
      <div class="bbb-opportunity-player"><div><h3>${bbbOpportunityEsc(u.name)}</h3><span>${bbbOpportunityEsc(u.pos||'')} ${u.rank!=null?`• BBB #${bbbOpportunityEsc(u.rank)}`:''} ${u.team?`• ${bbbOpportunityEsc(u.team)}`:''}</span></div><span class="bbb-opportunity-arrow ${gain?'gain':'loss'}">${gain?'↑':'↓'}</span></div>
      <p>${bbbOpportunityEsc(u.update_text)}</p>
      <div class="bbb-opportunity-foot">Open player profile →</div>
    </article>`;
  }

  function bbbOpportunityRender(){
    const grid=document.querySelector('#bbbOpportunityGrid');if(!grid)return;
    const all=bbbOpportunityRecentRows();
    const gains=all.filter(x=>x.opportunity_signal==='GAIN').length;
    const losses=all.filter(x=>x.opportunity_signal==='LOSS').length;
    const list=bbbOpportunityFiltered();
    const shown=list.slice(0,bbbOpportunityVisible);
    document.querySelector('#bbbOpportunityGainCount').textContent=gains;
    document.querySelector('#bbbOpportunityLossCount').textContent=losses;
    document.querySelector('#bbbOpportunityTotalCount').textContent=all.length;
    document.querySelector('#bbbOpportunityCount').textContent=`Showing ${Math.min(shown.length,list.length)} of ${list.length} opportunity changes`;
    grid.innerHTML=shown.length?shown.map(bbbOpportunityCard).join(''):'<div class="bbb-opportunity-empty">No clear opportunity changes match those filters right now.</div>';
    document.querySelector('#bbbOpportunityMore').classList.toggle('hide',shown.length>=list.length);
  }

  function bbbOpportunityInjectStyles(){
    if(document.querySelector('#bbb-opportunity-styles'))return;
    const s=document.createElement('style');s.id='bbb-opportunity-styles';s.textContent=`
      .bbb-opportunity-view{background:#050807;min-height:72vh}.bbb-opportunity-hero{padding:58px 0 38px;border-bottom:1px solid #173328;background:radial-gradient(circle at 79% 15%,rgba(10,143,77,.20),transparent 38%),linear-gradient(180deg,#07100c,#050807)}.bbb-opportunity-hero-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(310px,.8fr);gap:42px;align-items:end}.bbb-opportunity-hero h1{font-size:clamp(46px,6.5vw,76px);line-height:.94;letter-spacing:-.055em;text-transform:uppercase;margin:10px 0 16px}.bbb-opportunity-hero h1 span{color:#42c883}.bbb-opportunity-copy{max-width:650px;color:#92a39a;font-size:14px;line-height:1.65}.bbb-opportunity-summary{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #204233;background:#08120d;border-radius:15px;overflow:hidden}.bbb-opportunity-summary div{padding:16px;border-left:1px solid #18362a}.bbb-opportunity-summary div:first-child{border:0}.bbb-opportunity-summary span{display:block;color:#6d8176;font-size:7px;font-weight:950;letter-spacing:.09em;text-transform:uppercase}.bbb-opportunity-summary strong{display:block;margin-top:5px;font-size:22px}.bbb-opportunity-summary .gain strong{color:#65dc9d}.bbb-opportunity-summary .loss strong{color:#ec8585}.bbb-opportunity-content{padding:48px 0 72px}.bbb-opportunity-controls{display:grid;grid-template-columns:auto minmax(220px,1fr) 150px;gap:11px;margin-bottom:14px}.bbb-opportunity-tabs{display:flex;gap:6px}.bbb-opportunity-tab{border:1px solid #264638;background:#0a120e;color:#9caaa3;padding:9px 12px;border-radius:9px;font-size:10px;font-weight:900}.bbb-opportunity-tab.active{background:#0a8f4d;border-color:#0a8f4d;color:#fff}.bbb-opportunity-search,.bbb-opportunity-pos{width:100%;background:#050a08;border:1px solid #274539;color:#edf3ef;border-radius:9px;padding:10px 12px;outline:0}.bbb-opportunity-note{margin:0 0 18px;padding:11px 13px;border-left:3px solid #0a8f4d;background:#09140f;color:#8fa198;font-size:10px;line-height:1.55}.bbb-opportunity-count{margin:0 0 12px;color:#71847a;font-size:10px}.bbb-opportunity-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.bbb-opportunity-card{border:1px solid #193127;background:linear-gradient(160deg,#0c1511,#070b09);border-radius:15px;padding:18px;cursor:pointer;transition:.15s ease}.bbb-opportunity-card.gain{border-top-color:#236743}.bbb-opportunity-card.loss{border-top-color:#713838}.bbb-opportunity-card:hover{transform:translateY(-1px);border-color:#315b47}.bbb-opportunity-top,.bbb-opportunity-player{display:flex;justify-content:space-between;gap:13px;align-items:flex-start}.bbb-opportunity-tags{display:flex;gap:6px;flex-wrap:wrap}.bbb-opportunity-signal,.bbb-opportunity-type{display:inline-flex;border-radius:999px;padding:4px 8px;font-size:8px;font-weight:950;letter-spacing:.05em}.bbb-opportunity-signal.gain{background:#0a2b1d;border:1px solid #176743;color:#74e5a9}.bbb-opportunity-signal.loss{background:#351717;border:1px solid #743535;color:#f08b8b}.bbb-opportunity-type{background:#17211c;border:1px solid #30443a;color:#a9bab1}.bbb-opportunity-date{color:#6c8075;font-size:9px}.bbb-opportunity-player{align-items:center;margin-top:16px}.bbb-opportunity-player h3{margin:0;font-size:20px;color:#fff}.bbb-opportunity-player>div>span{display:block;margin-top:3px;color:#71847a;font-size:9px;font-weight:850}.bbb-opportunity-arrow{width:34px;height:34px;display:grid;place-items:center;border-radius:50%;font-size:17px;font-weight:950}.bbb-opportunity-arrow.gain{background:#0a2b1d;color:#74e5a9}.bbb-opportunity-arrow.loss{background:#351717;color:#f08b8b}.bbb-opportunity-card p{margin:15px 0 0;color:#bac7c0;font-size:12px;line-height:1.7}.bbb-opportunity-foot{margin-top:15px;padding-top:11px;border-top:1px solid #172a22;color:#5fd495;font-size:8px;font-weight:900;letter-spacing:.04em}.bbb-opportunity-more{display:block;margin:22px auto 0;border:1px solid #2e503f;background:#0d1a14;color:#d7e2dc;border-radius:9px;padding:10px 15px;font-size:11px;font-weight:900}.bbb-opportunity-more.hide{display:none}.bbb-opportunity-empty{grid-column:1/-1;padding:50px 20px;text-align:center;color:#7f8d85;border:1px dashed #244236;border-radius:12px}
      @media(max-width:850px){.bbb-opportunity-hero-grid{grid-template-columns:1fr}.bbb-opportunity-grid{grid-template-columns:1fr}.bbb-opportunity-controls{grid-template-columns:1fr}}
      @media(max-width:560px){.bbb-opportunity-hero{padding:42px 0 30px}.bbb-opportunity-content{padding:36px 0 54px}.bbb-opportunity-summary div{padding:12px}.bbb-opportunity-summary strong{font-size:18px}.bbb-opportunity-card{padding:16px}.bbb-opportunity-tabs{overflow:auto}}
    `;document.head.appendChild(s);
  }

  function bbbOpportunityInjectUi(){
    if(document.querySelector('#opportunityView'))return;
    bbbOpportunityInjectStyles();
    const main=document.createElement('main');main.id='opportunityView';main.className='bbb-opportunity-view hide';
    main.innerHTML=`<section class="bbb-opportunity-hero"><div class="shell bbb-opportunity-hero-grid"><div><div class="profile-kicker">BBB OPPORTUNITY TRACKER</div><h1>Opportunity<br><span>Feed.</span></h1><p class="bbb-opportunity-copy">The clearest role and availability changes affecting dynasty opportunity right now. This feed intentionally skips ambiguous news and only flags developments with a real path to more — or fewer — meaningful snaps.</p></div><div class="bbb-opportunity-summary"><div class="gain"><span>Gains</span><strong id="bbbOpportunityGainCount">—</strong></div><div class="loss"><span>Losses</span><strong id="bbbOpportunityLossCount">—</strong></div><div><span>14-Day Signals</span><strong id="bbbOpportunityTotalCount">—</strong></div></div></div></section><section class="bbb-opportunity-content"><div class="shell"><div class="bbb-opportunity-controls"><div class="bbb-opportunity-tabs"><button class="bbb-opportunity-tab active" data-opportunity-mode="ALL">All</button><button class="bbb-opportunity-tab" data-opportunity-mode="GAIN">Gains ↑</button><button class="bbb-opportunity-tab" data-opportunity-mode="LOSS">Losses ↓</button></div><input id="bbbOpportunitySearch" class="bbb-opportunity-search" placeholder="Search player, team or opportunity…"><select id="bbbOpportunityPos" class="bbb-opportunity-pos"><option value="ALL">All positions</option><option>QB</option><option>RB</option><option>WR</option><option>TE</option></select></div><div class="bbb-opportunity-note">Only clear opportunity changes from the last ${BBB_OPPORTUNITY_DAYS} days are shown. General news, minor practice updates, and uncertain injury reports remain in Latest Updates.</div><div id="bbbOpportunityCount" class="bbb-opportunity-count"></div><div id="bbbOpportunityGrid" class="bbb-opportunity-grid"><div class="bbb-opportunity-empty">Loading opportunity changes…</div></div><button id="bbbOpportunityMore" class="bbb-opportunity-more">Show More</button></div></section>`;
    const profile=document.querySelector('#profileView');profile.parentNode.insertBefore(main,profile);

    document.querySelectorAll('[data-opportunity-mode]').forEach(b=>b.onclick=()=>{bbbOpportunityMode=b.dataset.opportunityMode;bbbOpportunityVisible=30;document.querySelectorAll('[data-opportunity-mode]').forEach(x=>x.classList.toggle('active',x===b));bbbOpportunityRender()});
    document.querySelector('#bbbOpportunitySearch').oninput=e=>{bbbOpportunityQ=e.target.value.trim().toLowerCase();bbbOpportunityVisible=30;bbbOpportunityRender()};
    document.querySelector('#bbbOpportunityPos').onchange=e=>{bbbOpportunityPos=e.target.value;bbbOpportunityVisible=30;bbbOpportunityRender()};
    document.querySelector('#bbbOpportunityMore').onclick=()=>{bbbOpportunityVisible+=30;bbbOpportunityRender()};

    const mobile=document.querySelector('.mobile-subnav');
    if(mobile&&!mobile.querySelector('a[href="#opportunity"]')){const a=document.createElement('a');a.href='#opportunity';a.textContent='Opportunity';mobile.appendChild(a)}

    document.addEventListener('click',e=>{const card=e.target.closest('.bbb-opportunity-card');if(!card)return;const key=String(card.dataset.playerKey||'').trim();if(!key)return;history.pushState({},'',`/player/${encodeURIComponent(key)}`);document.querySelector('#opportunityView')?.classList.add('hide');if(typeof profileRender==='function')profileRender(key);else location.href=`/player/${encodeURIComponent(key)}`});
  }

  async function bbbOpportunityLoad(){
    const data=await bbbDb('site_updates','select=*&order=update_date.desc,id.desc&limit=500');
    bbbOpportunityRows=data||[];bbbOpportunityRender();
  }

  function bbbOpportunityRoute(){
    const show=location.hash==='#opportunity'&&!location.pathname.startsWith('/player/');
    const view=document.querySelector('#opportunityView');if(!view)return;
    view.classList.toggle('hide',!show);
    if(show){['rankingsView','rookieView','prospectView','tradeView','profileView','updatesView','moversView','compareView','watchlistView'].forEach(id=>document.querySelector('#'+id)?.classList.add('hide'));window.scrollTo(0,0)}
  }

  function bbbOpportunityInit(){
    bbbOpportunityInjectUi();
    bbbOpportunityLoad().catch(e=>{console.error('BBB opportunity feed:',e);const grid=document.querySelector('#bbbOpportunityGrid');if(grid)grid.innerHTML='<div class="bbb-opportunity-empty">Opportunity Feed is temporarily unavailable.</div>'});
    bbbOpportunityRoute();
    window.addEventListener('hashchange',()=>setTimeout(bbbOpportunityRoute,0));
    window.addEventListener('popstate',()=>setTimeout(bbbOpportunityRoute,0));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bbbOpportunityInit);else bbbOpportunityInit();
})();
