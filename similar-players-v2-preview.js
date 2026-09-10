// Bobby's Big Board — Similar Players V2 preview.
// Presentation-only enhancement for the existing same-position / rank+age proximity matches.
(function(){
  const STYLE_ID='bbb-similar-players-v2-styles';
  const TEAM_LOGOS={
    ARI:'ari',ATL:'atl',BAL:'bal',BUF:'buf',CAR:'car',CHI:'chi',CIN:'cin',CLE:'cle',
    DAL:'dal',DEN:'den',DET:'det',GB:'gb',HOU:'hou',IND:'ind',JAC:'jax',JAX:'jax',
    KC:'kc',LV:'lv',LAC:'lac',LAR:'lar',LA:'lar',MIA:'mia',MIN:'min',NE:'ne',NO:'no',
    NYG:'nyg',NYJ:'nyj',PHI:'phi',PIT:'pit',SF:'sf',SEA:'sea',TB:'tb',TEN:'ten',
    WAS:'wsh',WSH:'wsh'
  };

  function esc(v){
    if(typeof bbbEsc==='function')return bbbEsc(v);
    return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function num(v){const n=Number(v);return Number.isFinite(n)?n:null}
  function keyOf(p){return String(p?.playerKey||p?.player_key||'').trim()}
  function slug(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/['’.]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
  function playerPool(){try{return typeof players!=='undefined'&&Array.isArray(players)?players:[]}catch(_){return []}}
  function playerByKey(key){return playerPool().find(p=>keyOf(p)===key)||playerPool().find(p=>slug(p.name)===slug(key))||null}
  function currentPlayer(){
    const m=location.pathname.match(/^\/player\/([^/?#]+)/);if(!m)return null;
    return playerByKey(decodeURIComponent(m[1]));
  }
  function logo(team){const id=TEAM_LOGOS[String(team||'').toUpperCase()];return id?`https://a.espncdn.com/i/teamlogos/nfl/500/${id}.png`:''}
  function health(p){
    const raw=String(p?.injury_status||p?.injuryStatus||'').trim();
    const text=raw||'Healthy';
    return {text,healthy:!raw||/^(healthy|active|cleared|no injury)/i.test(raw)};
  }
  function market(p){
    const gap=num(p?.gap),rank=num(p?.market),raw=String(p?.view||'').toUpperCase();
    let cls='market',label='≈ MARKET';
    if((gap!=null&&gap>=20)||raw.includes('BUY')){cls='buy';label='BBB BUY'}
    else if((gap!=null&&gap<=-20)||raw.includes('FADE')){cls='fade';label='BBB FADE'}
    return {gap,rank,cls,label};
  }
  function reason(base,p){
    const bits=['Same-position dynasty alternative'];
    const br=num(base?.rank),pr=num(p?.rank);
    if(br!=null&&pr!=null){
      const d=Math.abs(pr-br);
      bits.push(d===0?'Same BBB rank':`${d} BBB spot${d===1?'':'s'} away`);
    }
    const ba=num(base?.age),pa=num(p?.age);
    if(ba!=null&&pa!=null){
      const d=Math.abs(pa-ba);
      if(d<.15)bits.push('Nearly identical age');
      else bits.push(`${d.toFixed(1)} yr${d<1.05?'':'s'} ${pa<ba?'younger':'older'}`);
    }
    return bits.join(' · ');
  }
  function logoMarkup(p){
    const team=String(p.team||'FA').toUpperCase(),src=logo(team);
    if(src)return `<div class="bbb-sim-v2-logo"><img src="${src}" alt="" loading="lazy" onerror="this.remove();this.parentElement.textContent='${esc(team)}';this.parentElement.classList.add('fallback')"></div>`;
    return `<div class="bbb-sim-v2-logo fallback">${esc(team||p.pos||'FA')}</div>`;
  }
  function gapMarkup(gap){
    if(gap==null)return '<strong>—</strong><small>BBB vs Market</small>';
    const cls=gap>0?'positive':gap<0?'negative':'neutral';
    return `<strong class="${cls}">${gap>0?'+':''}${esc(gap)}</strong><small>BBB vs Market</small>`;
  }
  function cardMarkup(base,p,key){
    const m=market(p),h=health(p);
    return `${logoMarkup(p)}
      <div class="bbb-sim-v2-head">
        <div><span>${esc(p.team||'FA')} · Age ${esc(p.age??'—')}</span><h3>${esc(p.name)}</h3></div>
        <div class="bbb-sim-v2-rank"><small>BBB</small><strong>#${esc(p.rank??'—')}</strong><span>${esc(p.pos||'')}${p.pr??'—'}</span></div>
      </div>
      <div class="bbb-sim-v2-metrics">
        <div><strong>${m.rank==null?'—':'#'+esc(m.rank)}</strong><small>Market Rank</small></div>
        <div>${gapMarkup(m.gap)}</div>
        <div><strong>${esc(p.pos||'')}${p.pr??'—'}</strong><small>Position Rank</small></div>
      </div>
      <div class="bbb-sim-v2-context">
        <span class="bbb-sim-v2-market ${m.cls}">${esc(m.label)}</span>
        <span class="bbb-sim-v2-health ${h.healthy?'healthy':'watch'}" title="${esc(h.text)}">${esc(h.text)}</span>
      </div>
      <div class="bbb-sim-v2-why"><span>WHY IT'S CLOSE</span><p>${esc(reason(base,p))}</p></div>
      <div class="bbb-sim-v2-actions"><span>View Profile →</span><button type="button" data-sim-compare="${esc(key)}">Compare</button></div>`;
  }

  function enhanceCard(a,base){
    if(!a||a.dataset.bbbSimilarV2==='1')return;
    const href=a.getAttribute('href')||'';
    const m=href.match(/^\/player\/([^/?#]+)/);if(!m)return;
    const key=decodeURIComponent(m[1]),p=playerByKey(key);if(!p)return;
    a.dataset.bbbSimilarV2='1';
    a.classList.add('bbb-similar-v2-card');
    a.innerHTML=cardMarkup(base,p,key);
  }
  function enhance(){
    const grid=document.querySelector('#profileView .bbb-similar-grid');if(!grid)return;
    const base=currentPlayer();if(!base)return;
    const card=grid.closest('.profile-card');
    if(card&&!card.dataset.bbbSimilarV2Head){
      card.dataset.bbbSimilarV2Head='1';
      const h=card.querySelector('.bbb-career-head h2');if(h)h.textContent='Dynasty alternatives around this player.';
      const p=card.querySelector('.bbb-career-head p');if(p)p.textContent='Same-position players closest in BBB rank, with age used as a secondary match. Use these as value alternatives — not film comps.';
    }
    grid.querySelectorAll('.bbb-similar-player').forEach(a=>enhanceCard(a,base));
  }
  function bindActions(){
    document.addEventListener('click',e=>{
      const btn=e.target.closest('[data-sim-compare]');if(!btn)return;
      e.preventDefault();e.stopPropagation();
      const target=btn.dataset.simCompare,base=currentPlayer(),left=keyOf(base);
      if(!target||!left)return;
      location.href=`/#compare?left=${encodeURIComponent(left)}&right=${encodeURIComponent(target)}`;
    });
  }
  function ensureStyles(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      #profileView .bbb-similar-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
      #profileView .bbb-similar-player.bbb-similar-v2-card{display:grid!important;grid-template-columns:54px minmax(0,1fr);gap:10px 13px;padding:14px!important;border:1px solid #183b2b!important;border-radius:13px!important;background:linear-gradient(145deg,#07150f,#050d09)!important;position:relative;overflow:hidden}
      #profileView .bbb-similar-player.bbb-similar-v2-card:before{content:'';position:absolute;inset:0 auto 0 0;width:3px;background:#2dcf80;opacity:.65}
      #profileView .bbb-similar-player.bbb-similar-v2-card:hover{border-color:#307353!important;background:linear-gradient(145deg,#091a12,#06100b)!important;transform:translateY(-1px)}
      #profileView .bbb-sim-v2-logo{grid-column:1;grid-row:1;width:52px;height:52px;border:1px solid #214936;border-radius:11px;background:#081b12;display:grid;place-items:center;overflow:hidden;color:#69dda1;font-size:9px;font-weight:950}.bbb-sim-v2-logo img{width:40px;height:40px;object-fit:contain}.bbb-sim-v2-logo.fallback{background:#0a2117}
      #profileView .bbb-sim-v2-head{grid-column:2;grid-row:1;display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0}.bbb-sim-v2-head>div:first-child{min-width:0}.bbb-sim-v2-head>div:first-child>span{display:block;color:#72877b;font-size:8px;font-weight:850;margin-bottom:3px}.bbb-sim-v2-head h3{margin:0!important;color:#f0f6f2!important;font-size:15px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bbb-sim-v2-rank{text-align:right;flex:none}.bbb-sim-v2-rank small{display:block;color:#60776b;font-size:6px;font-weight:950;letter-spacing:.09em}.bbb-sim-v2-rank strong{display:block;color:#66dfa2;font-size:21px;line-height:1}.bbb-sim-v2-rank span{display:block;color:#83968c;font-size:7px;font-weight:900;margin-top:3px}
      #profileView .bbb-sim-v2-metrics{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.bbb-sim-v2-metrics>div{border:1px solid #153428;background:#06110c;border-radius:8px;padding:9px 10px;min-width:0}.bbb-sim-v2-metrics strong{display:block;color:#dfe9e4;font-size:13px;line-height:1}.bbb-sim-v2-metrics strong.positive{color:#72e2a7}.bbb-sim-v2-metrics strong.negative{color:#ed8a8a}.bbb-sim-v2-metrics small{display:block;color:#647a6e;font-size:6px;font-weight:900;text-transform:uppercase;letter-spacing:.05em;margin-top:4px}
      #profileView .bbb-sim-v2-context{grid-column:1/-1;display:flex;align-items:center;gap:6px;min-width:0}.bbb-sim-v2-market,.bbb-sim-v2-health{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:7px;font-weight:950;white-space:nowrap}.bbb-sim-v2-market.buy{background:#0a2b1d;border:1px solid #176743;color:#74e5a9}.bbb-sim-v2-market.fade{background:#351717;border:1px solid #713232;color:#ef8c8c}.bbb-sim-v2-market.market{background:#18201c;border:1px solid #34443b;color:#b5c0ba}.bbb-sim-v2-health{min-width:0;overflow:hidden;text-overflow:ellipsis;max-width:245px}.bbb-sim-v2-health.healthy{background:#09261a;border:1px solid #176743;color:#74e5a9}.bbb-sim-v2-health.watch{background:#28210f;border:1px solid #65521f;color:#e9cd75}
      #profileView .bbb-sim-v2-why{grid-column:1/-1;border-left:2px solid #2dcf80;background:#071812;border-radius:0 8px 8px 0;padding:8px 10px}.bbb-sim-v2-why span{display:block;color:#58d996;font-size:6px;font-weight:950;letter-spacing:.1em}.bbb-sim-v2-why p{margin:4px 0 0!important;color:#91a49a!important;font-size:8px!important;line-height:1.4!important}
      #profileView .bbb-sim-v2-actions{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:9px;padding-top:2px;color:#69dda1;font-size:8px;font-weight:950}.bbb-sim-v2-actions button{border:1px solid #28533f;background:#08150f;color:#9fb3a8;border-radius:7px;padding:6px 9px;font-size:7px;font-weight:950;cursor:pointer}.bbb-sim-v2-actions button:hover{border-color:#4ad08a;color:#fff}
      @media(max-width:760px){#profileView .bbb-similar-grid{grid-template-columns:1fr!important}.bbb-sim-v2-health{max-width:210px}}
      @media(max-width:430px){#profileView .bbb-similar-player.bbb-similar-v2-card{grid-template-columns:46px minmax(0,1fr);padding:11px!important;gap:8px 10px}.bbb-sim-v2-logo{width:44px!important;height:44px!important;border-radius:9px!important}.bbb-sim-v2-logo img{width:34px!important;height:34px!important}.bbb-sim-v2-head h3{font-size:13px!important}.bbb-sim-v2-rank strong{font-size:18px}.bbb-sim-v2-metrics>div{padding:8px}.bbb-sim-v2-context{align-items:flex-start;flex-wrap:wrap}.bbb-sim-v2-health{max-width:100%}}
    `;document.head.appendChild(s);
  }
  function init(){
    ensureStyles();bindActions();enhance();
    const root=document.querySelector('#profileView')||document.body;
    new MutationObserver(()=>enhance()).observe(root,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));else setTimeout(init,0);
})();
