// Bobby's Big Board — Opportunity Feed V2 preview.
// Adds a broader Dynasty Pulse around the existing conservative 14-day role/
// availability signal feed. Existing opportunity classification is untouched.
(function(){
  const STYLE_ID='bbb-opportunity-v2-preview-styles';
  const TEAM_LOGOS={
    ARI:'ari',ATL:'atl',BAL:'bal',BUF:'buf',CAR:'car',CHI:'chi',CIN:'cin',CLE:'cle',
    DAL:'dal',DEN:'den',DET:'det',GB:'gb',HOU:'hou',IND:'ind',JAC:'jax',JAX:'jax',
    KC:'kc',LV:'lv',LAC:'lac',LAR:'lar',LA:'lar',MIA:'mia',MIN:'min',NE:'ne',NO:'no',
    NYG:'nyg',NYJ:'nyj',PHI:'phi',PIT:'pit',SF:'sf',SEA:'sea',TB:'tb',TEN:'ten',
    WAS:'wsh',WSH:'wsh'
  };
  let board=[];
  let movers=[];
  let rookies=[];
  let ready=false;

  function esc(v){
    if(typeof bbbEsc==='function')return bbbEsc(v);
    return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function num(v){const n=Number(v);return Number.isFinite(n)?n:null}
  function keyOf(v){return String(v?.player_key||v?.playerKey||'').trim()}
  function teamLogo(team){const id=TEAM_LOGOS[String(team||'').toUpperCase()];return id?`https://a.espncdn.com/i/teamlogos/nfl/500/${id}.png`:''}
  function health(v){
    const text=String(v||'').trim()||'Healthy';
    return {text,healthy:/^(healthy|active|cleared|no injury)/i.test(text)};
  }
  function marketClass(p){
    const raw=String(p?.view||'').toUpperCase(),gap=num(p?.gap);
    if(raw.includes('BUY')||(gap!=null&&gap>=20))return {cls:'buy',label:'BBB BUY'};
    if(raw.includes('FADE')||(gap!=null&&gap<=-20))return {cls:'fade',label:'BBB FADE'};
    return {cls:'market',label:'MARKET'};
  }
  function moveLabel(v){
    const n=num(v);
    if(n==null||n===0)return {cls:'flat',text:'7D —'};
    return {cls:n>0?'up':'down',text:`7D ${n>0?'↑':'↓'} ${Math.abs(n)}`};
  }
  function tradeValue(rank){const r=num(rank);return r?Math.round(10000*Math.exp(-.012*(r-1))):null}
  function moverMap(){return new Map(movers.map(x=>[keyOf(x),x]))}
  function boardMap(){return new Map(board.map(x=>[keyOf(x),x]))}

  async function db(view,query){
    if(typeof bbbDbCached==='function')return bbbDbCached(view,query);
    if(typeof bbbDb==='function')return bbbDb(view,query);
    return [];
  }
  async function loadData(){
    try{
      const [b,m,r]=await Promise.all([
        db('site_dynasty','select=*&order=rank.asc'),
        db('site_movers','select=*'),
        db('site_rookies','select=*&order=rank.asc')
      ]);
      board=Array.isArray(b)?b:[];
      movers=Array.isArray(m)?m:[];
      rookies=Array.isArray(r)?r:[];
      ready=true;
      renderPulse();
      enhanceCards();
    }catch(err){
      console.warn('BBB Opportunity V2:',err);
      const pulse=document.querySelector('#bbbOpportunityV2Pulse');
      if(pulse)pulse.innerHTML='<div class="bbb-op-v2-unavailable">Dynasty Pulse is temporarily unavailable. The role-and-availability feed below is still live.</div>';
    }
  }

  function marketWindows(){
    const candidates=board.filter(p=>num(p.gap)!=null&&num(p.market)!=null);
    const buys=candidates.filter(p=>num(p.gap)>=20).sort((a,b)=>num(b.gap)-num(a.gap)||num(a.rank)-num(b.rank)).slice(0,3);
    const fades=candidates.filter(p=>num(p.gap)<=-20).sort((a,b)=>num(a.gap)-num(b.gap)||num(a.rank)-num(b.rank)).slice(0,3);
    return [...buys,...fades].sort((a,b)=>Math.abs(num(b.gap))-Math.abs(num(a.gap))||num(a.rank)-num(b.rank)).slice(0,6);
  }
  function momentum(){
    const bm=boardMap();
    return movers.map(m=>({m,p:bm.get(keyOf(m))})).filter(x=>x.p&&num(x.m.bbb_move_7d)!=null&&num(x.m.bbb_move_7d)!==0)
      .sort((a,b)=>Math.abs(num(b.m.bbb_move_7d))-Math.abs(num(a.m.bbb_move_7d))||num(a.p.rank)-num(b.p.rank)).slice(0,6);
  }
  function rookieWindows(){
    return rookies.filter(p=>num(p.gap)!=null&&num(p.gap)>0&&num(p.market)!=null)
      .sort((a,b)=>num(b.gap)-num(a.gap)||num(a.rank)-num(b.rank)).slice(0,6);
  }
  function rowLogo(p){
    const src=teamLogo(p.team),team=String(p.team||'FA').toUpperCase();
    return src?`<span class="bbb-op-v2-row-logo"><img src="${src}" alt="" loading="lazy"></span>`:`<span class="bbb-op-v2-row-logo fallback">${esc(team)}</span>`;
  }
  function pulseRow(p,right,sub,cls=''){return `<button type="button" class="bbb-op-v2-pulse-row ${cls}" data-op-v2-pulse-key="${esc(keyOf(p))}">${rowLogo(p)}<span class="bbb-op-v2-pulse-player"><strong>${esc(p.name)}</strong><small>${esc(p.pos||'')} · BBB #${esc(p.rank??'—')} · ${esc(p.team||'FA')}</small></span><span class="bbb-op-v2-pulse-value"><strong>${esc(right)}</strong><small>${esc(sub)}</small></span></button>`}
  function pulseColumn(kicker,title,copy,rows,empty){
    return `<section class="bbb-op-v2-column"><div class="bbb-op-v2-column-head"><span>${esc(kicker)}</span><h3>${esc(title)}</h3><p>${esc(copy)}</p></div><div class="bbb-op-v2-pulse-list">${rows||`<div class="bbb-op-v2-list-empty">${esc(empty)}</div>`}</div></section>`;
  }
  function renderPulse(){
    const mount=document.querySelector('#bbbOpportunityV2Pulse');if(!mount||!ready)return;
    const marketRows=marketWindows().map(p=>{
      const g=num(p.gap),mc=marketClass(p);return pulseRow(p,`${g>0?'+':''}${g}`,mc.label,mc.cls);
    }).join('');
    const momentumRows=momentum().map(({p,m})=>{
      const mv=num(m.bbb_move_7d);return pulseRow(p,`${mv>0?'↑':'↓'} ${Math.abs(mv)}`,'7D BBB move',mv>0?'up':'down');
    }).join('');
    const rookieRows=rookieWindows().map(p=>pulseRow(p,`+${num(p.gap)}`,'vs rookie market','rookie')).join('');
    mount.innerHTML=`<div class="bbb-op-v2-pulse-head"><div><span>WHAT MATTERS NOW</span><h2>Dynasty Pulse.</h2></div><p>Three live lenses from the current BBB database. These are ranking and market signals — not automatic trade recommendations.</p></div><div class="bbb-op-v2-pulse-grid">
      ${pulseColumn('MARKET WINDOWS','Where BBB disagrees most.','Largest current BBB-vs-consensus gaps, split between buys and fades.',marketRows,'No major market gaps right now.')}
      ${pulseColumn('7-DAY MOMENTUM','Who moved on the board.','Largest absolute BBB ranking changes over the last seven days.',momentumRows,'No 7-day movers are currently logged.')}
      ${pulseColumn('ROOKIE RADAR','BBB above rookie market.','2026 rookies Bobby currently ranks furthest above consensus.',rookieRows,'No positive rookie market gaps are currently logged.')}
    </div>`;
  }

  function cardLogo(p){
    const src=teamLogo(p?.team),team=String(p?.team||'FA').toUpperCase();
    return src?`<span class="bbb-op-v2-logo"><img src="${src}" alt="" loading="lazy"></span>`:`<span class="bbb-op-v2-logo fallback">${esc(team)}</span>`;
  }
  function cardContext(p,m){
    const mc=marketClass(p),mv=moveLabel(m?.bbb_move_7d),h=health(p?.injury_status),tv=tradeValue(p?.rank);
    const marketRank=num(p?.market);
    return `<div class="bbb-op-v2-context">
      <span class="bbb-op-v2-chip ${mc.cls}">${esc(mc.label)}${marketRank!=null?` · #${esc(marketRank)}`:''}</span>
      <span class="bbb-op-v2-chip ${mv.cls}">${esc(mv.text)}</span>
      <span class="bbb-op-v2-chip ${h.healthy?'healthy':'watch'}" title="${esc(h.text)}">${esc(h.text)}</span>
      <span class="bbb-op-v2-chip value">Value ${tv==null?'—':esc(tv.toLocaleString())}</span>
    </div>`;
  }
  function cardActions(key){
    const watching=typeof bbbWatchIs==='function'&&bbbWatchIs(key);
    return `<div class="bbb-op-v2-actions">
      <button type="button" data-op-v2-profile="${esc(key)}">Profile</button>
      <button type="button" data-op-v2-compare="${esc(key)}">Compare</button>
      ${typeof bbbWatchToggle==='function'?`<button type="button" class="${watching?'watching':''}" data-op-v2-watch="${esc(key)}">${watching?'★ Watching':'☆ Watch'}</button>`:''}
    </div>`;
  }
  function enhanceCards(){
    if(!ready)return;
    const bm=boardMap(),mm=moverMap();
    document.querySelectorAll('#opportunityView .bbb-opportunity-card').forEach(card=>{
      if(card.dataset.bbbOpportunityV2==='1')return;
      const key=String(card.dataset.playerKey||'').trim(),p=bm.get(key);if(!p)return;
      card.dataset.bbbOpportunityV2='1';card.classList.add('bbb-op-v2-card');
      const player=card.querySelector('.bbb-opportunity-player');
      if(player&&!player.querySelector('.bbb-op-v2-logo'))player.insertAdjacentHTML('afterbegin',cardLogo(p));
      const text=card.querySelector('p');
      if(text&&!card.querySelector('.bbb-op-v2-context'))text.insertAdjacentHTML('beforebegin',cardContext(p,mm.get(key)));
      const foot=card.querySelector('.bbb-opportunity-foot');
      if(foot){foot.classList.add('bbb-op-v2-foot');foot.innerHTML=`<span>Clear role / availability signal</span>${cardActions(key)}`}
    });
  }

  function goProfile(key){
    if(!key)return;
    history.pushState({},'',`/player/${encodeURIComponent(key)}`);
    document.querySelector('#opportunityView')?.classList.add('hide');
    if(typeof profileRender==='function')profileRender(key);else location.href=`/player/${encodeURIComponent(key)}`;
  }
  function bindActions(){
    document.addEventListener('click',e=>{
      const pulse=e.target.closest('[data-op-v2-pulse-key]');
      const profile=e.target.closest('[data-op-v2-profile]');
      const compare=e.target.closest('[data-op-v2-compare]');
      const watch=e.target.closest('[data-op-v2-watch]');
      const target=pulse||profile||compare||watch;if(!target)return;
      e.preventDefault();e.stopImmediatePropagation();
      const key=String(target.dataset.opV2PulseKey||target.dataset.opV2Profile||target.dataset.opV2Compare||target.dataset.opV2Watch||'').trim();
      if(pulse||profile){goProfile(key);return}
      if(compare){location.href=`/#compare?left=${encodeURIComponent(key)}`;return}
      if(watch&&typeof bbbWatchToggle==='function'){
        bbbWatchToggle(key);
        const on=typeof bbbWatchIs==='function'&&bbbWatchIs(key);
        watch.classList.toggle('watching',on);watch.textContent=on?'★ Watching':'☆ Watch';
      }
    },true);
  }

  function injectUi(){
    const view=document.querySelector('#opportunityView');if(!view||view.dataset.bbbOpportunityV2==='1')return false;
    view.dataset.bbbOpportunityV2='1';view.classList.add('bbb-opportunity-v2');
    const kicker=view.querySelector('.bbb-opportunity-hero .profile-kicker');if(kicker)kicker.textContent='BBB DYNASTY PULSE';
    const copy=view.querySelector('.bbb-opportunity-copy');if(copy)copy.textContent='A live decision board for the biggest market gaps, ranking movement, rookie value windows, and clear role or availability changes across Bobby’s Big Board.';
    const shell=view.querySelector('.bbb-opportunity-content>.shell');
    const controls=view.querySelector('.bbb-opportunity-controls');
    if(shell&&controls&&!document.querySelector('#bbbOpportunityV2Pulse')){
      const pulse=document.createElement('section');pulse.id='bbbOpportunityV2Pulse';pulse.className='bbb-op-v2-pulse';pulse.innerHTML='<div class="bbb-op-v2-pulse-loading">Loading live dynasty pulse…</div>';controls.before(pulse);
      const feedHead=document.createElement('div');feedHead.className='bbb-op-v2-feed-head';feedHead.innerHTML='<div><span>ROLE & AVAILABILITY</span><h2>Clear opportunity changes.</h2></div><p>The original conservative signal feed stays intact: only developments with a clear path to more or fewer meaningful snaps appear here.</p>';controls.before(feedHead);
    }
    const note=view.querySelector('.bbb-opportunity-note');if(note)note.textContent='The signal feed below only includes clear opportunity changes from the last 14 days. General news, uncertain injuries, and minor practice notes remain in Latest Updates.';
    return true;
  }

  function ensureStyles(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      #opportunityView.bbb-opportunity-v2 .bbb-opportunity-hero{padding:46px 0 32px;background:radial-gradient(circle at 80% 10%,rgba(10,143,77,.23),transparent 37%),linear-gradient(180deg,#07110c,#050807)}
      #opportunityView.bbb-opportunity-v2 .bbb-opportunity-hero h1{font-size:clamp(45px,6vw,70px);margin:8px 0 13px}
      #opportunityView.bbb-opportunity-v2 .bbb-opportunity-content{padding-top:30px}
      #opportunityView .bbb-op-v2-pulse{margin-bottom:34px}
      #opportunityView .bbb-op-v2-pulse-head,#opportunityView .bbb-op-v2-feed-head{display:flex;align-items:flex-end;justify-content:space-between;gap:26px;margin-bottom:12px}
      #opportunityView .bbb-op-v2-pulse-head span,#opportunityView .bbb-op-v2-feed-head span,#opportunityView .bbb-op-v2-column-head>span{color:#50ce8e;font-size:8px;font-weight:950;letter-spacing:.12em}
      #opportunityView .bbb-op-v2-pulse-head h2,#opportunityView .bbb-op-v2-feed-head h2{font-size:29px;line-height:1;margin:4px 0 0;letter-spacing:-.035em}
      #opportunityView .bbb-op-v2-pulse-head>p,#opportunityView .bbb-op-v2-feed-head>p{max-width:500px;margin:0;color:#71847a;font-size:10px;line-height:1.55;text-align:right}
      #opportunityView .bbb-op-v2-pulse-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid #193b2d;border-radius:15px;overflow:hidden;background:#07100c}
      #opportunityView .bbb-op-v2-column{min-width:0;border-left:1px solid #173429;padding:15px}#opportunityView .bbb-op-v2-column:first-child{border-left:0}
      #opportunityView .bbb-op-v2-column-head{padding:0 2px 11px;border-bottom:1px solid #173027;margin-bottom:5px}
      #opportunityView .bbb-op-v2-column-head h3{font-size:17px;margin:4px 0 5px;color:#edf4ef}#opportunityView .bbb-op-v2-column-head p{margin:0;color:#6e8176;font-size:8px;line-height:1.45;min-height:24px}
      #opportunityView .bbb-op-v2-pulse-list{display:grid}
      #opportunityView .bbb-op-v2-pulse-row{display:grid;grid-template-columns:30px minmax(0,1fr) auto;gap:9px;align-items:center;width:100%;border:0;border-bottom:1px solid #12271e;background:transparent;color:#eaf1ed;padding:10px 2px;text-align:left;cursor:pointer}#opportunityView .bbb-op-v2-pulse-row:last-child{border-bottom:0}#opportunityView .bbb-op-v2-pulse-row:hover{background:#0a1711}
      #opportunityView .bbb-op-v2-row-logo{width:28px;height:28px;border:1px solid #1c3f30;border-radius:7px;background:#081811;display:grid;place-items:center;overflow:hidden;color:#66dba0;font-size:6px;font-weight:950}#opportunityView .bbb-op-v2-row-logo img{width:22px;height:22px;object-fit:contain}
      #opportunityView .bbb-op-v2-pulse-player{min-width:0}#opportunityView .bbb-op-v2-pulse-player strong{display:block;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#opportunityView .bbb-op-v2-pulse-player small{display:block;color:#687b70;font-size:7px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #opportunityView .bbb-op-v2-pulse-value{text-align:right}#opportunityView .bbb-op-v2-pulse-value strong{display:block;color:#dfe9e4;font-size:11px}#opportunityView .bbb-op-v2-pulse-value small{display:block;color:#64786d;font-size:6px;margin-top:2px;text-transform:uppercase;font-weight:900}#opportunityView .bbb-op-v2-pulse-row.buy .bbb-op-v2-pulse-value strong,#opportunityView .bbb-op-v2-pulse-row.up .bbb-op-v2-pulse-value strong,#opportunityView .bbb-op-v2-pulse-row.rookie .bbb-op-v2-pulse-value strong{color:#70dfa6}#opportunityView .bbb-op-v2-pulse-row.fade .bbb-op-v2-pulse-value strong,#opportunityView .bbb-op-v2-pulse-row.down .bbb-op-v2-pulse-value strong{color:#ee8989}
      #opportunityView .bbb-op-v2-list-empty,#opportunityView .bbb-op-v2-pulse-loading,#opportunityView .bbb-op-v2-unavailable{padding:24px 10px;color:#708178;font-size:9px;text-align:center}.bbb-op-v2-pulse-loading,.bbb-op-v2-unavailable{border:1px dashed #244236;border-radius:12px}
      #opportunityView .bbb-op-v2-feed-head{margin:0 0 12px;padding-top:3px}
      #opportunityView.bbb-opportunity-v2 .bbb-opportunity-controls{margin-bottom:10px}
      #opportunityView.bbb-opportunity-v2 .bbb-opportunity-note{background:#07120d;border-left-color:#295f45;margin-bottom:14px}
      #opportunityView.bbb-opportunity-v2 .bbb-opportunity-grid{gap:10px}
      #opportunityView .bbb-op-v2-card{padding:15px;border-radius:13px;background:linear-gradient(150deg,#0a1510,#060d09)}
      #opportunityView .bbb-op-v2-card .bbb-opportunity-player{display:grid;grid-template-columns:46px minmax(0,1fr) auto;gap:11px;margin-top:13px}
      #opportunityView .bbb-op-v2-logo{width:44px;height:44px;border:1px solid #214936;border-radius:10px;background:#081a12;display:grid;place-items:center;overflow:hidden;color:#65dc9d;font-size:7px;font-weight:950}#opportunityView .bbb-op-v2-logo img{width:35px;height:35px;object-fit:contain}
      #opportunityView .bbb-op-v2-card .bbb-opportunity-player h3{font-size:18px}#opportunityView .bbb-op-v2-card .bbb-opportunity-arrow{grid-column:3}
      #opportunityView .bbb-op-v2-context{display:flex;flex-wrap:wrap;gap:5px;margin-top:12px}
      #opportunityView .bbb-op-v2-chip{display:inline-flex;align-items:center;max-width:240px;border-radius:999px;padding:4px 7px;font-size:7px;font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:#17201c;border:1px solid #30443a;color:#a9bab1}
      #opportunityView .bbb-op-v2-chip.buy,#opportunityView .bbb-op-v2-chip.up,#opportunityView .bbb-op-v2-chip.healthy{background:#09261a;border-color:#176743;color:#74e5a9}#opportunityView .bbb-op-v2-chip.fade,#opportunityView .bbb-op-v2-chip.down{background:#351717;border-color:#713232;color:#ef8c8c}#opportunityView .bbb-op-v2-chip.watch{background:#28210f;border-color:#65521f;color:#e9cd75}#opportunityView .bbb-op-v2-chip.value{background:#101a15;border-color:#263c31;color:#a9bbb1}
      #opportunityView .bbb-op-v2-card>p{margin-top:12px;font-size:11px;line-height:1.65}
      #opportunityView .bbb-op-v2-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:13px;padding-top:10px}#opportunityView .bbb-op-v2-foot>span{color:#60766a;font-size:7px;font-weight:900;letter-spacing:.04em}
      #opportunityView .bbb-op-v2-actions{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}#opportunityView .bbb-op-v2-actions button{border:1px solid #28513e;background:#08130e;color:#9fb2a8;border-radius:7px;padding:6px 8px;font-size:7px;font-weight:950;cursor:pointer}#opportunityView .bbb-op-v2-actions button:hover,#opportunityView .bbb-op-v2-actions button.watching{border-color:#48c982;color:#72dfa6;background:#0a2117}
      @media(max-width:980px){#opportunityView .bbb-op-v2-pulse-grid{grid-template-columns:1fr}#opportunityView .bbb-op-v2-column{border-left:0;border-top:1px solid #173429}#opportunityView .bbb-op-v2-column:first-child{border-top:0}#opportunityView .bbb-op-v2-column-head p{min-height:0}}
      @media(max-width:700px){#opportunityView .bbb-op-v2-pulse-head,#opportunityView .bbb-op-v2-feed-head{display:block}#opportunityView .bbb-op-v2-pulse-head>p,#opportunityView .bbb-op-v2-feed-head>p{text-align:left;margin-top:7px}#opportunityView .bbb-op-v2-pulse{margin-bottom:28px}}
      @media(max-width:560px){#opportunityView.bbb-opportunity-v2 .bbb-opportunity-hero{padding:38px 0 27px}#opportunityView.bbb-opportunity-v2 .bbb-opportunity-content{padding-top:24px}#opportunityView .bbb-op-v2-pulse-head h2,#opportunityView .bbb-op-v2-feed-head h2{font-size:25px}#opportunityView .bbb-op-v2-column{padding:12px}#opportunityView .bbb-op-v2-card{padding:13px}#opportunityView .bbb-op-v2-card .bbb-opportunity-player{grid-template-columns:40px minmax(0,1fr) auto;gap:9px}.bbb-op-v2-logo{width:38px!important;height:38px!important}.bbb-op-v2-logo img{width:30px!important;height:30px!important}#opportunityView .bbb-op-v2-foot{align-items:flex-start;flex-direction:column}#opportunityView .bbb-op-v2-actions{justify-content:flex-start}}
    `;document.head.appendChild(s);
  }

  function init(){
    ensureStyles();bindActions();
    const tryInit=()=>{
      if(!injectUi())return false;
      const grid=document.querySelector('#bbbOpportunityGrid');
      if(grid)new MutationObserver(()=>enhanceCards()).observe(grid,{childList:true,subtree:true});
      loadData();return true;
    };
    if(tryInit())return;
    let tries=0;const timer=setInterval(()=>{tries++;if(tryInit()||tries>40)clearInterval(timer)},100);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
