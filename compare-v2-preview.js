// Bobby's Big Board — Compare V2 preview.
// Presentation-first enhancement of the existing comparison tool. The underlying
// BBB ranks, market values, player selection, and comparison logic are unchanged.
(function(){
  const STYLE_ID='bbb-compare-v2-preview-styles';
  const TEAM_LOGOS={
    ARI:'ari',ATL:'atl',BAL:'bal',BUF:'buf',CAR:'car',CHI:'chi',CIN:'cin',CLE:'cle',
    DAL:'dal',DEN:'den',DET:'det',GB:'gb',HOU:'hou',IND:'ind',JAC:'jax',JAX:'jax',
    KC:'kc',LV:'lv',LAC:'lac',LAR:'lar',LA:'lar',MIA:'mia',MIN:'min',NE:'ne',NO:'no',
    NYG:'nyg',NYJ:'nyj',PHI:'phi',PIT:'pit',SF:'sf',SEA:'sea',TB:'tb',TEN:'ten',
    WAS:'wsh',WSH:'wsh'
  };
  const productionCache=new Map();
  let productionToken=0;

  function esc(v){
    if(typeof bbbEsc==='function')return bbbEsc(v);
    return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function num(v){const n=Number(v);return Number.isFinite(n)?n:null}
  function keyOf(p){return String(p?.player_key||p?.playerKey||'').trim()}
  function currentPlayers(){
    if(typeof bbbComparePlayer!=='function')return {left:null,right:null};
    return {left:bbbComparePlayer(bbbCompareLeft),right:bbbComparePlayer(bbbCompareRight)};
  }
  function logoUrl(team){
    const id=TEAM_LOGOS[String(team||'').toUpperCase()];
    return id?`https://a.espncdn.com/i/teamlogos/nfl/500/${id}.png`:'';
  }
  function health(p){
    const text=String(p?.injury_status||'').trim()||'Healthy';
    return {text,healthy:/healthy|active|cleared|no injury/i.test(text)};
  }
  function leanByRank(a,b,field){
    const av=num(a?.[field]),bv=num(b?.[field]);
    if(av==null||bv==null)return {name:'No data',detail:'Not enough data'};
    if(av===bv)return {name:'Even',detail:`Both at #${av}`};
    const p=av<bv?a:b,d=Math.abs(av-bv);
    return {name:p.name,detail:`${d} spot${d===1?'':'s'} higher`};
  }
  function ageEdge(a,b){
    const av=num(a?.age),bv=num(b?.age);
    if(av==null||bv==null)return {name:'No data',detail:'Age unavailable'};
    if(av===bv)return {name:'Even',detail:`Both age ${av}`};
    const p=av<bv?a:b,d=Math.abs(av-bv);
    return {name:p.name,detail:`${d.toFixed(1)} yr${d<1.05?'':'s'} younger`};
  }
  function healthEdge(a,b){
    const ah=health(a),bh=health(b);
    if(ah.healthy&&bh.healthy)return {name:'Both clear',detail:'No active health edge'};
    if(ah.healthy!==bh.healthy){const p=ah.healthy?a:b;return {name:p.name,detail:'Cleaner current status'}}
    return {name:'Both watch',detail:'Health context matters'};
  }
  function lensCard(label,data,cls=''){
    return `<div class="bbb-compare-v2-lens ${cls}"><span>${esc(label)}</span><strong>${esc(data.name)}</strong><small>${esc(data.detail)}</small></div>`;
  }
  function decisionSummary(a,b){
    const bbb=leanByRank(a,b,'rank');
    const market=leanByRank(a,b,'market');
    const age=ageEdge(a,b);
    const h=healthEdge(a,b);
    const rankGap=Math.abs((num(a.rank)||0)-(num(b.rank)||0));
    const intro=rankGap===0
      ? `BBB currently has ${a.name} and ${b.name} even on the board.`
      : `BBB currently leans ${bbb.name} by ${rankGap} spot${rankGap===1?'':'s'}.`;
    const marketSentence=market.name==='No data'
      ? 'Consensus does not currently give us a complete two-player read.'
      : market.name==='Even'
        ? 'Consensus has them even.'
        : `Consensus leans ${market.name}.`;
    const healthSentence=h.name==='Both clear'
      ? 'Both carry clean current health statuses.'
      : h.name==='Both watch'
        ? 'Both have health context worth monitoring.'
        : `${h.name} carries the cleaner current health status.`;
    return `<div class="bbb-compare-v2-verdict-copy">
      <div><span>DECISION SNAPSHOT</span><h2>${esc(intro)}</h2></div>
      <p>${esc(marketSentence)} ${esc(age.name==='Even'?'They are the same age.':age.name==='No data'?'Age is unavailable for one side.':age.name+' has the age edge.')} ${esc(healthSentence)}</p>
      <div class="bbb-compare-v2-lenses">
        ${lensCard('BBB Board Lean',bbb,'bbb')}
        ${lensCard('Consensus Lean',market,'market')}
        ${lensCard('Age Edge',age,'age')}
        ${lensCard('Health Edge',h,'health')}
      </div>
    </div>`;
  }

  function addPlayerIdentity(picker,p){
    const head=picker?.querySelector('.bbb-compare-player-head');
    if(!head||!p)return;
    head.classList.add('bbb-compare-v2-player-head');
    let logo=head.querySelector('.bbb-compare-v2-logo');
    if(!logo){
      logo=document.createElement('div');
      logo.className='bbb-compare-v2-logo';
      head.insertBefore(logo,head.firstElementChild);
    }
    const src=logoUrl(p.team),team=String(p.team||'FA').toUpperCase();
    logo.innerHTML=src?`<img src="${src}" alt="" loading="lazy">`:`<span>${esc(team)}</span>`;
    const identity=logo.nextElementSibling;
    if(identity){
      let status=identity.querySelector('.bbb-compare-v2-status');
      const h=health(p);
      if(!status){status=document.createElement('span');status.className='bbb-compare-v2-status';identity.appendChild(status)}
      status.className=`bbb-compare-v2-status ${h.healthy?'healthy':'watch'}`;
      status.textContent=h.text;
    }
    let profileLink=picker.querySelector('.bbb-compare-v2-profile-link');
    if(!profileLink){
      profileLink=document.createElement('a');
      profileLink.className='bbb-compare-v2-profile-link';
      const searchWrap=picker.querySelector('.bbb-compare-search-wrap');
      searchWrap?.insertAdjacentElement('afterend',profileLink);
    }
    profileLink.href=`/player/${encodeURIComponent(keyOf(p))}`;
    profileLink.textContent='View full player profile →';
  }

  function decorateRows(){
    document.querySelectorAll('#compareView .bbb-compare-row').forEach(row=>{
      const label=String(row.querySelector('.bbb-compare-label strong')?.textContent||'').trim().toLowerCase();
      let group='value';
      if(/age|movement|injury/.test(label))group='context';
      if(/rookie|prospect|pro comp/.test(label))group='draft';
      row.dataset.compareGroup=group;
    });
    const table=document.querySelector('#compareView .bbb-compare-table');
    if(table&&!table.previousElementSibling?.classList.contains('bbb-compare-v2-table-head')){
      const head=document.createElement('div');
      head.className='bbb-compare-v2-table-head';
      head.innerHTML='<div><span>VALUE & CONTEXT</span><h2>Head-to-head details.</h2></div><p>Green highlights show the stronger side for that specific metric only — they are not an overall score.</p>';
      table.before(head);
    }
  }

  function rewriteVerdict(a,b){
    const verdict=document.querySelector('#compareView .bbb-compare-verdict');
    if(!verdict||!a||!b)return;
    verdict.classList.add('bbb-compare-v2-verdict');
    verdict.innerHTML=decisionSummary(a,b);
  }

  function enhanceTraitCards(){
    document.querySelectorAll('#compareView .bbb-compare-film').forEach(card=>{
      const name=String(card.querySelector('h3')?.textContent||'').trim();
      const p=(typeof bbbComparePlayers!=='undefined'?bbbComparePlayers:[]).find(x=>x.name===name);
      if(!p?.prospect||typeof bbbCompareTopTraits!=='function')return;
      const traits=bbbCompareTopTraits(p);
      const box=card.querySelector('.bbb-compare-traits');
      if(!box||!traits.length)return;
      box.classList.add('bbb-compare-v2-traits');
      box.innerHTML=traits.map(t=>{
        const rawPct=num(t.pct),max=num(t.max),value=num(t.value);
        const pct=rawPct!=null?Math.max(0,Math.min(100,rawPct<=1?rawPct*100:rawPct)):(max&&value!=null?Math.max(0,Math.min(100,value/max*100)):0);
        const score=max&&value!=null?`${value} / ${max}`:(value??'—');
        return `<div class="bbb-compare-v2-trait"><div><span>${esc(t.name)}</span><strong>${esc(score)}</strong></div><div class="bbb-compare-v2-trait-track"><i style="width:${pct.toFixed(1)}%"></i></div></div>`;
      }).join('');
    });
  }

  async function latestSeason(p){
    const key=keyOf(p);if(!key)return null;
    if(productionCache.has(key))return productionCache.get(key);
    const promise=(async()=>{
      try{
        if(typeof bbbDbSafe==='function'){
          const rows=await bbbDbSafe('site_player_season_stats',`select=*&player_key=eq.${encodeURIComponent(key)}&order=season.desc&limit=1`,[]);
          return rows?.[0]||null;
        }
        if(typeof bbbDb==='function'){
          const rows=await bbbDb('site_player_season_stats',`select=*&player_key=eq.${encodeURIComponent(key)}&order=season.desc&limit=1`);
          return rows?.[0]||null;
        }
      }catch(err){console.warn('Compare V2 production load',err)}
      return null;
    })();
    productionCache.set(key,promise);
    return promise;
  }
  function productionCard(p,row){
    const games=num(row?.games),points=num(row?.fantasy_points_ppr),ppg=games&&points!=null?points/games:null;
    const finish=num(row?.position_finish),season=row?.season||'—';
    const pos=row?.position||p?.pos||'';
    return `<article class="bbb-compare-v2-production-card">
      <div class="bbb-compare-v2-production-head"><div><span>${esc(season)} REGULAR SEASON</span><h3>${esc(p.name)}</h3></div><strong>${row?'NFLVERSE':'—'}</strong></div>
      ${row?`<div class="bbb-compare-v2-production-grid">
        <div><span>PPR Points</span><strong>${points==null?'—':points.toFixed(1)}</strong></div>
        <div><span>PPR / Game</span><strong>${ppg==null?'—':ppg.toFixed(1)}</strong></div>
        <div><span>Games</span><strong>${games==null?'—':Math.round(games)}</strong></div>
        <div><span>Pos. Finish</span><strong>${finish==null?'—':esc(pos)+'#'+Math.round(finish)}</strong></div>
      </div>`:`<div class="bbb-compare-v2-no-production"><strong>No NFL season yet.</strong><span>Regular-season fantasy production will appear here once available.</span></div>`}
    </article>`;
  }
  async function renderProduction(a,b){
    const token=++productionToken;
    const table=document.querySelector('#compareView .bbb-compare-table');
    if(!table||!a||!b){document.querySelector('#compareView .bbb-compare-v2-production')?.remove();return}
    let section=document.querySelector('#compareView .bbb-compare-v2-production');
    if(!section){
      section=document.createElement('section');
      section.className='bbb-compare-section bbb-compare-v2-production';
      table.insertAdjacentElement('afterend',section);
    }
    section.innerHTML='<div class="bbb-compare-v2-production-loading">Loading latest fantasy production…</div>';
    const [ar,br]=await Promise.all([latestSeason(a),latestSeason(b)]);
    if(token!==productionToken||!document.body.contains(section))return;
    section.innerHTML=`<div class="bbb-compare-section-head bbb-compare-v2-section-head"><div><span>FANTASY PRODUCTION</span><h2>Latest imported season.</h2></div><p>Full-PPR regular-season production. PPR/game is shown for context and is not an overall player score.</p></div><div class="bbb-compare-two">${productionCard(a,ar)}${productionCard(b,br)}</div>`;
  }

  function enhance(){
    const view=document.querySelector('#compareView');
    if(!view)return;
    view.classList.add('bbb-compare-v2');
    const {left:a,right:b}=currentPlayers();
    const pickers=view.querySelectorAll('.bbb-compare-picker');
    if(a)addPlayerIdentity(pickers[0],a);
    if(b)addPlayerIdentity(pickers[1],b);
    if(a&&b){rewriteVerdict(a,b);decorateRows();enhanceTraitCards();renderProduction(a,b)}
    else{view.querySelector('.bbb-compare-v2-table-head')?.remove();view.querySelector('.bbb-compare-v2-production')?.remove()}
  }

  function ensureStyles(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      #compareView.bbb-compare-v2 .bbb-compare-hero{padding:44px 0 30px;background:radial-gradient(circle at 78% 8%,rgba(10,143,77,.22),transparent 35%),linear-gradient(180deg,#07110c,#050807)}
      #compareView.bbb-compare-v2 .bbb-compare-hero h1{font-size:clamp(44px,6vw,68px);margin:7px 0 10px}
      #compareView.bbb-compare-v2 .bbb-compare-content{padding-top:32px}
      #compareView.bbb-compare-v2 .bbb-compare-selectors{grid-template-columns:minmax(0,1fr) 64px minmax(0,1fr);gap:10px}
      #compareView.bbb-compare-v2 .bbb-compare-picker{padding:15px;border-color:#1d4433;background:linear-gradient(145deg,#09150f,#060e0a);box-shadow:0 14px 40px rgba(0,0,0,.16)}
      #compareView.bbb-compare-v2 .bbb-compare-player-head.bbb-compare-v2-player-head{display:grid;grid-template-columns:58px minmax(0,1fr) auto;align-items:center;gap:12px;min-height:76px}
      #compareView .bbb-compare-v2-logo{width:56px;height:56px;border:1px solid #214936;border-radius:12px;background:#081a12;display:grid;place-items:center;overflow:hidden;color:#63d99e;font-size:8px;font-weight:950}
      #compareView .bbb-compare-v2-logo img{width:44px;height:44px;object-fit:contain}
      #compareView.bbb-compare-v2 .bbb-compare-player-head h2{font-size:23px;margin:5px 0 5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #compareView.bbb-compare-v2 .bbb-compare-meta{font-size:9px}
      #compareView .bbb-compare-v2-status{display:inline-flex;max-width:240px;margin-top:7px;border-radius:999px;padding:4px 7px;font-size:7px;font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #compareView .bbb-compare-v2-status.healthy{background:#09261a;border:1px solid #176743;color:#74e5a9}
      #compareView .bbb-compare-v2-status.watch{background:#28210f;border:1px solid #65521f;color:#e9cd75}
      #compareView.bbb-compare-v2 .bbb-compare-head-rank>strong{font-size:27px}
      #compareView.bbb-compare-v2 .bbb-compare-search-wrap{margin-top:12px}
      #compareView .bbb-compare-v2-profile-link{display:inline-flex;margin-top:9px;color:#79dba5;font-size:8px;font-weight:900}
      #compareView .bbb-compare-v2-profile-link:hover{color:#fff}
      #compareView.bbb-compare-v2 .bbb-compare-vs{color:#6edfa5}
      #compareView.bbb-compare-v2 .bbb-compare-swap{width:46px;height:46px;background:#08140f;border-color:#285740;box-shadow:0 8px 24px rgba(0,0,0,.22)}

      #compareView .bbb-compare-v2-verdict{display:block;margin:14px 0 26px;padding:18px;border-color:#286044;background:linear-gradient(135deg,#0a1b13,#07100c)}
      #compareView .bbb-compare-v2-verdict-copy>div:first-child{display:flex;align-items:flex-end;justify-content:space-between;gap:20px}
      #compareView .bbb-compare-v2-verdict-copy>div:first-child>span{color:#58d995;font-size:8px;font-weight:950;letter-spacing:.12em}
      #compareView .bbb-compare-v2-verdict-copy h2{max-width:720px;font-size:23px;line-height:1.05;margin:0;text-align:right}
      #compareView .bbb-compare-v2-verdict-copy>p{margin:13px 0 16px;color:#9cafa4;font-size:11px;line-height:1.6}
      #compareView .bbb-compare-v2-lenses{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}
      #compareView .bbb-compare-v2-lens{border:1px solid #193a2b;background:#07120d;border-radius:9px;padding:10px;min-width:0}
      #compareView .bbb-compare-v2-lens>span{display:block;color:#637b6e;font-size:6px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}
      #compareView .bbb-compare-v2-lens>strong{display:block;color:#edf5f0;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:4px 0 2px}
      #compareView .bbb-compare-v2-lens>small{display:block;color:#6e8378;font-size:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #compareView .bbb-compare-v2-lens.bbb{border-color:#235940}.bbb-compare-v2-lens.bbb>strong{color:#6edfa5}

      #compareView .bbb-compare-v2-table-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin:0 0 10px}
      #compareView .bbb-compare-v2-table-head span{color:#50ce8e;font-size:8px;font-weight:950;letter-spacing:.12em}
      #compareView .bbb-compare-v2-table-head h2{font-size:25px;margin:3px 0 0}
      #compareView .bbb-compare-v2-table-head p{max-width:450px;margin:0;color:#6f8378;font-size:9px;line-height:1.5;text-align:right}
      #compareView.bbb-compare-v2 .bbb-compare-table{border-color:#1d3d2f;border-radius:13px}
      #compareView.bbb-compare-v2 .bbb-compare-row{min-height:56px}
      #compareView.bbb-compare-v2 .bbb-compare-label{background:#08130e}
      #compareView.bbb-compare-v2 .bbb-compare-value.winner{background:linear-gradient(90deg,rgba(10,36,24,.35),#0a2418);box-shadow:inset 0 0 0 1px rgba(114,223,166,.05)}
      #compareView.bbb-compare-v2 .bbb-compare-row[data-compare-group="context"] .bbb-compare-label{background:#09110e}
      #compareView.bbb-compare-v2 .bbb-compare-row[data-compare-group="draft"] .bbb-compare-label{background:#0a1510}

      #compareView .bbb-compare-v2-production{margin-top:30px}
      #compareView .bbb-compare-v2-section-head{align-items:flex-end}
      #compareView .bbb-compare-v2-production-card{border:1px solid #193c2d;background:linear-gradient(145deg,#09140f,#060d09);border-radius:13px;padding:15px}
      #compareView .bbb-compare-v2-production-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}
      #compareView .bbb-compare-v2-production-head span{display:block;color:#57d793;font-size:7px;font-weight:950;letter-spacing:.09em}
      #compareView .bbb-compare-v2-production-head h3{font-size:17px;margin:4px 0 0}
      #compareView .bbb-compare-v2-production-head>strong{color:#617b6e;font-size:7px;letter-spacing:.08em}
      #compareView .bbb-compare-v2-production-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
      #compareView .bbb-compare-v2-production-grid>div{border:1px solid #153328;background:#06110c;border-radius:8px;padding:10px}
      #compareView .bbb-compare-v2-production-grid span{display:block;color:#60776a;font-size:6px;font-weight:900;text-transform:uppercase;letter-spacing:.05em}
      #compareView .bbb-compare-v2-production-grid strong{display:block;color:#e6efe9;font-size:14px;margin-top:5px}
      #compareView .bbb-compare-v2-no-production{border:1px dashed #204534;border-radius:8px;padding:16px;color:#75897e}
      #compareView .bbb-compare-v2-no-production strong{display:block;color:#a9bbb1;font-size:11px}.bbb-compare-v2-no-production span{display:block;font-size:8px;margin-top:4px}
      #compareView .bbb-compare-v2-production-loading{border:1px dashed #204534;border-radius:10px;padding:20px;text-align:center;color:#70857a;font-size:9px}

      #compareView.bbb-compare-v2 .bbb-compare-section{margin-top:30px}
      #compareView.bbb-compare-v2 .bbb-compare-update,#compareView.bbb-compare-v2 .bbb-compare-film{border-radius:13px;border-color:#193a2d;background:linear-gradient(145deg,#09140f,#060d09)}
      #compareView .bbb-compare-v2-traits{grid-template-columns:1fr!important;gap:7px!important}
      #compareView .bbb-compare-v2-trait{padding:9px!important}
      #compareView .bbb-compare-v2-trait>div:first-child{display:flex;align-items:center;justify-content:space-between;gap:10px}
      #compareView .bbb-compare-v2-trait span{font-size:7px!important}.bbb-compare-v2-trait strong{margin:0!important;font-size:9px!important;color:#cfe0d7!important}
      #compareView .bbb-compare-v2-trait-track{height:5px;background:#11291e;border-radius:999px;overflow:hidden;margin-top:7px}
      #compareView .bbb-compare-v2-trait-track i{display:block;height:100%;background:#42c883;border-radius:999px}

      @media(max-width:900px){
        #compareView .bbb-compare-v2-lenses{grid-template-columns:1fr 1fr}
        #compareView .bbb-compare-v2-production-grid{grid-template-columns:1fr 1fr}
      }
      @media(max-width:850px){
        #compareView.bbb-compare-v2 .bbb-compare-selectors{grid-template-columns:1fr}
        #compareView.bbb-compare-v2 .bbb-compare-vs{min-height:54px}
        #compareView .bbb-compare-v2-table-head{align-items:flex-start;flex-direction:column;gap:5px}
        #compareView .bbb-compare-v2-table-head p{text-align:left}
      }
      @media(max-width:560px){
        #compareView.bbb-compare-v2 .bbb-compare-hero{padding:36px 0 25px}
        #compareView.bbb-compare-v2 .bbb-compare-content{padding-top:24px}
        #compareView.bbb-compare-v2 .bbb-compare-player-head.bbb-compare-v2-player-head{grid-template-columns:48px minmax(0,1fr) auto;gap:9px}
        #compareView .bbb-compare-v2-logo{width:46px;height:46px;border-radius:10px}.bbb-compare-v2-logo img{width:36px!important;height:36px!important}
        #compareView .bbb-compare-v2-status{max-width:175px}
        #compareView .bbb-compare-v2-verdict-copy>div:first-child{display:block}.bbb-compare-v2-verdict-copy h2{text-align:left!important;margin-top:6px!important;font-size:20px!important}
        #compareView .bbb-compare-v2-lenses{grid-template-columns:1fr 1fr}
        #compareView .bbb-compare-v2-lens{padding:9px}
        #compareView .bbb-compare-v2-production-grid{grid-template-columns:1fr 1fr}
      }
    `;
    document.head.appendChild(s);
  }

  function wrapRender(){
    if(typeof bbbCompareRender!=='function'||bbbCompareRender.__bbbV2Wrapped)return;
    const base=bbbCompareRender;
    const wrapped=function(){
      const result=base.apply(this,arguments);
      requestAnimationFrame(enhance);
      return result;
    };
    wrapped.__bbbV2Wrapped=true;
    bbbCompareRender=wrapped;
  }
  function init(){ensureStyles();wrapRender();setTimeout(enhance,0)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
