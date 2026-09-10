// Bobby's Big Board — Global Search V2 preview.
// Presentation-only enhancement. Existing search indexing, matching, keyboard controls and routing stay intact.
(function(){
  const STYLE_ID='bbb-global-search-v2-styles';
  const LOGO_MAP={
    ARI:'ari',ATL:'atl',BAL:'bal',BUF:'buf',CAR:'car',CHI:'chi',CIN:'cin',CLE:'cle',
    DAL:'dal',DEN:'den',DET:'det',GB:'gb',HOU:'hou',IND:'ind',JAC:'jax',JAX:'jax',
    KC:'kc',LV:'lv',LAC:'lac',LAR:'lar',MIA:'mia',MIN:'min',NE:'ne',NO:'no',
    NYG:'nyg',NYJ:'nyj',PHI:'phi',PIT:'pit',SF:'sf',SEA:'sea',TB:'tb',TEN:'ten',
    WAS:'wsh',WSH:'wsh'
  };

  function esc(v){
    if(typeof bbbEsc==='function')return bbbEsc(v);
    return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function num(v){const n=Number(v);return Number.isFinite(n)?n:null}
  function keyOf(v){return String(v?.playerKey||v?.player_key||'').trim()}
  function grade(v){const n=num(v);return n==null?'—':Number.isInteger(n)?String(n):n.toFixed(1)}
  function logoUrl(team){const id=LOGO_MAP[String(team||'').toUpperCase()];return id?`https://a.espncdn.com/i/teamlogos/nfl/500/${id}.png`:''}
  function pool(name){try{return typeof window[name]!=='undefined'&&Array.isArray(window[name])?window[name]:[]}catch(_){return []}}
  function globals(name){
    try{
      if(name==='players'&&typeof players!=='undefined'&&Array.isArray(players))return players;
      if(name==='rookies'&&typeof rookies!=='undefined'&&Array.isArray(rookies))return rookies;
      if(name==='prospects'&&typeof prospects!=='undefined'&&Array.isArray(prospects))return prospects;
    }catch(_){ }
    return pool(name);
  }
  function byKey(list,key){return list.find(x=>keyOf(x)===key)||null}
  function statusInfo(p){
    if(!p)return null;
    const raw=String(p.injuryStatus||p.injury_status||'').trim();
    const text=raw||'Healthy';
    const healthy=!raw||/^(healthy|active|cleared|no injury)/i.test(raw);
    return {text,healthy};
  }
  function marketInfo(p){
    if(!p)return null;
    const gap=num(p.gap),market=num(p.market);
    let kind='market',label='MARKET';
    const raw=String(p.view||'').toUpperCase();
    if(gap!=null&&gap>=20||raw.includes('BUY')){kind='buy';label='BBB BUY'}
    else if(gap!=null&&gap<=-20||raw.includes('FADE')){kind='fade';label='BBB FADE'}
    return {gap,market,kind,label};
  }
  function identity(key){
    const dynasty=byKey(globals('players'),key);
    const rookie=byKey(globals('rookies'),key);
    const prospect=byKey(globals('prospects'),key);
    const any=dynasty||rookie||prospect;
    return any?{dynasty,rookie,prospect,any}:null;
  }
  function sourceBadges(data){
    const out=[];
    if(data.dynasty?.rank)out.push(`<span class="bbb-search-v2-chip dynasty">BBB #${esc(data.dynasty.rank)}</span>`);
    if(data.rookie?.rank)out.push(`<span class="bbb-search-v2-chip rookie">ROOKIE #${esc(data.rookie.rank)}</span>`);
    if(data.prospect){
      const year=data.prospect.year?`${esc(data.prospect.year)} `:'';
      out.push(`<span class="bbb-search-v2-chip prospect">${year}PROSPECT · ${esc(grade(data.prospect.grade))}</span>`);
    }
    return out.join('');
  }
  function secondary(data){
    const p=data.any;
    const bits=[];
    if(p.pos)bits.push(p.pos);
    if(p.team)bits.push(p.team);
    else if(data.prospect?.year)bits.push(`${data.prospect.year} Draft Class`);
    if(data.dynasty?.pr)bits.push(`${data.dynasty.pos}${data.dynasty.pr}`);
    return bits.join(' · ');
  }
  function logoMarkup(data){
    const p=data.any,team=String(p.team||'').toUpperCase(),url=logoUrl(team);
    if(url)return `<div class="bbb-search-v2-logo"><img src="${url}" alt="" loading="lazy" onerror="this.remove();this.parentElement.classList.add('fallback');this.parentElement.textContent='${esc(team)}'"></div>`;
    const label=p.pos||String(data.prospect?.year||'BBB').slice(-2);
    return `<div class="bbb-search-v2-logo fallback">${esc(label)}</div>`;
  }
  function rightMarkup(data){
    const market=marketInfo(data.dynasty),status=statusInfo(data.dynasty);
    if(!market&&!status&&data.prospect){
      return `<div class="bbb-search-v2-right prospect-only"><span>PRO GRADE</span><strong>${esc(grade(data.prospect.grade))}</strong>${data.prospect.comp?`<small>${esc(data.prospect.comp)}</small>`:''}</div>`;
    }
    return `<div class="bbb-search-v2-right">
      ${status?`<span class="bbb-search-v2-status ${status.healthy?'healthy':'watch'}" title="${esc(status.text)}">${esc(status.text)}</span>`:''}
      ${market?`<div class="bbb-search-v2-market"><strong class="${market.kind}">${esc(market.label)}</strong>${market.market!=null?`<span>Market #${esc(market.market)}</span>`:''}${market.gap!=null?`<small>Gap ${market.gap>0?'+':''}${esc(market.gap)}</small>`:''}</div>`:''}
    </div>`;
  }

  function enhanceResult(a){
    if(!a||a.dataset.bbbSearchV2==='1')return;
    let url;
    try{url=new URL(a.getAttribute('href')||'',location.origin)}catch(_){return}
    const match=url.pathname.match(/^\/player\/([^/]+)/);if(!match)return;
    const key=decodeURIComponent(match[1]);
    const data=identity(key);if(!data)return;
    const p=data.any;
    a.dataset.bbbSearchV2='1';
    a.innerHTML=`${logoMarkup(data)}<div class="bbb-search-v2-main"><div class="bbb-search-v2-name-row"><strong>${esc(p.name)}</strong><span>${esc(p.pos||'')}</span></div><div class="bbb-search-v2-meta">${esc(secondary(data)||'BBB Player Profile')}</div><div class="bbb-search-v2-chips">${sourceBadges(data)}</div>${data.prospect?.comp?`<div class="bbb-search-v2-comp">PRO COMP · ${esc(data.prospect.comp)}</div>`:''}</div>${rightMarkup(data)}<span class="bbb-search-v2-arrow">›</span>`;
  }
  function enhanceResults(){document.querySelectorAll('#bbbGlobalSearchResults .bbb-search-result').forEach(enhanceResult)}
  function enhancePanel(){
    const panel=document.querySelector('.bbb-global-search-panel');
    if(!panel||panel.dataset.bbbSearchV2==='1')return;
    panel.dataset.bbbSearchV2='1';
    const head=panel.querySelector('.bbb-search-head');
    if(head&&!panel.querySelector('.bbb-search-v2-kicker'))head.insertAdjacentHTML('beforebegin','<div class="bbb-search-v2-kicker"><span>BBB GLOBAL SEARCH</span><small>Dynasty · Rookies · Prospects</small></div>');
    const input=panel.querySelector('#bbbGlobalSearchInput');if(input)input.placeholder='Search player, team, or position…';
  }
  function ensureStyles(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      .bbb-global-search-overlay{padding-top:72px!important;background:rgba(1,5,3,.86)!important;backdrop-filter:blur(12px)!important}
      .bbb-global-search-panel{width:min(880px,100%)!important;max-height:min(760px,calc(100vh - 96px))!important;border-color:#24513d!important;border-radius:16px!important;background:linear-gradient(180deg,#08140e,#040906)!important;box-shadow:0 34px 100px rgba(0,0,0,.68)!important}
      .bbb-search-v2-kicker{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:13px 16px 0;color:#62d99b}.bbb-search-v2-kicker span{font-size:8px;font-weight:950;letter-spacing:.13em}.bbb-search-v2-kicker small{color:#60776b;font-size:8px;font-weight:850}
      .bbb-search-head{padding:11px 14px 14px!important;border-bottom-color:#173127!important}.bbb-search-input-wrap{min-height:50px!important;border-radius:10px!important;border-color:#2a5944!important;background:#040a07!important}.bbb-search-input-wrap:focus-within{border-color:#4ad08a!important;box-shadow:0 0 0 2px rgba(74,208,138,.07)}#bbbGlobalSearchInput{font-size:16px!important}.bbb-search-close{border-radius:10px!important;width:42px!important;height:42px!important}
      .bbb-search-subhead{padding:9px 16px!important;background:#06100b!important}.bbb-search-results{padding:9px!important}
      .bbb-search-result{display:grid!important;grid-template-columns:52px minmax(0,1fr) 205px 18px!important;align-items:center!important;gap:13px!important;min-height:82px;padding:11px 12px!important;margin-bottom:5px;border:1px solid #132b21!important;border-radius:12px!important;background:#060e0a!important;transition:background .13s ease,border-color .13s ease,transform .13s ease!important}.bbb-search-result:last-child{margin-bottom:0}.bbb-search-result:hover,.bbb-search-result.active{background:#0a1811!important;border-color:#2d664c!important;transform:translateY(-1px)}
      .bbb-search-v2-logo{width:50px;height:50px;border:1px solid #214735;border-radius:11px;background:linear-gradient(145deg,#0a1c13,#07100c);display:grid;place-items:center;overflow:hidden;color:#69dda1;font-size:10px;font-weight:950;letter-spacing:.03em}.bbb-search-v2-logo img{width:39px;height:39px;object-fit:contain}.bbb-search-v2-logo.fallback{background:#0a2016;border-color:#28583f}
      .bbb-search-v2-main{min-width:0}.bbb-search-v2-name-row{display:flex;align-items:center;gap:8px;min-width:0}.bbb-search-v2-name-row strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f4f8f5;font-size:14px;font-weight:950}.bbb-search-v2-name-row>span{flex:none;border:1px solid #2b5943;background:#092117;color:#72dfa8;border-radius:999px;padding:3px 6px;font-size:7px;font-weight:950}.bbb-search-v2-meta{margin-top:4px;color:#82968b;font-size:9px;font-weight:800}.bbb-search-v2-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}.bbb-search-v2-chip{display:inline-flex;border-radius:999px;padding:3px 6px;font-size:7px;font-weight:950;letter-spacing:.035em}.bbb-search-v2-chip.dynasty{background:#0a2b1d;border:1px solid #176743;color:#74e5a9}.bbb-search-v2-chip.rookie{background:#17251e;border:1px solid #375245;color:#b9cec3}.bbb-search-v2-chip.prospect{background:#121d22;border:1px solid #334b57;color:#b8d3df}.bbb-search-v2-comp{margin-top:6px;color:#688076;font-size:7px;font-weight:850;text-transform:uppercase;letter-spacing:.04em}
      .bbb-search-v2-right{min-width:0;display:flex;align-items:flex-end;flex-direction:column;gap:8px;text-align:right}.bbb-search-v2-status{display:block;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border-radius:999px;padding:4px 7px;font-size:7px;font-weight:950}.bbb-search-v2-status.healthy{background:#09261a;border:1px solid #176743;color:#74e5a9}.bbb-search-v2-status.watch{background:#2a2110;border:1px solid #65511f;color:#e9cd75}.bbb-search-v2-market{display:flex;align-items:center;justify-content:flex-end;gap:6px;flex-wrap:wrap}.bbb-search-v2-market strong{border-radius:999px;padding:4px 7px;font-size:7px;font-weight:950}.bbb-search-v2-market strong.buy{background:#0b4229;color:#67e29d;border:1px solid #197847}.bbb-search-v2-market strong.fade{background:#3b1717;color:#f08f8f;border:1px solid #713232}.bbb-search-v2-market strong.market{background:#18201c;color:#b6c0ba;border:1px solid #34443b}.bbb-search-v2-market span,.bbb-search-v2-market small{color:#657b70;font-size:7px;font-weight:850}.bbb-search-v2-right.prospect-only span{color:#61786d;font-size:7px;font-weight:950;letter-spacing:.08em}.bbb-search-v2-right.prospect-only strong{color:#6fe0a5;font-size:22px;line-height:1}.bbb-search-v2-right.prospect-only small{max-width:190px;color:#8da097;font-size:8px}
      .bbb-search-v2-arrow{color:#3e6d55;font-size:21px;line-height:1}.bbb-search-result:hover .bbb-search-v2-arrow,.bbb-search-result.active .bbb-search-v2-arrow{color:#6de1a4}
      .bbb-search-empty{border:1px dashed #1f4031;border-radius:12px;margin:4px;padding:52px 22px!important;background:#060e0a}
      @media(max-width:700px){.bbb-global-search-overlay{padding:58px 8px 8px!important}.bbb-global-search-panel{max-height:calc(100vh - 66px)!important;border-radius:13px!important}.bbb-search-v2-kicker{padding:11px 12px 0}.bbb-search-v2-kicker small{display:none}.bbb-search-head{padding:9px 10px 11px!important}.bbb-search-input-wrap{min-height:46px!important}#bbbGlobalSearchInput{font-size:14px!important}.bbb-search-results{padding:7px!important}.bbb-search-result{grid-template-columns:44px minmax(0,1fr) 14px!important;grid-template-areas:'logo main arrow' 'logo right arrow'!important;gap:8px 10px!important;min-height:96px!important;padding:10px!important}.bbb-search-v2-logo{grid-area:logo;width:42px;height:42px;border-radius:9px;align-self:start}.bbb-search-v2-logo img{width:33px;height:33px}.bbb-search-v2-main{grid-area:main}.bbb-search-v2-name-row strong{font-size:13px}.bbb-search-v2-right{grid-area:right;align-items:flex-start;flex-direction:row;flex-wrap:wrap;text-align:left;gap:5px 7px}.bbb-search-v2-status{max-width:100%;font-size:7px}.bbb-search-v2-market{justify-content:flex-start}.bbb-search-v2-arrow{grid-area:arrow;align-self:center}.bbb-search-v2-comp{display:none}.bbb-search-subhead strong{display:none!important}}
      @media(max-width:410px){.bbb-search-v2-chip{font-size:6px}.bbb-search-v2-meta{font-size:8px}.bbb-search-v2-status{max-width:210px}.bbb-search-v2-market small{display:none}}
    `;document.head.appendChild(s);
  }
  function init(){
    ensureStyles();enhancePanel();enhanceResults();
    const overlay=document.querySelector('#bbbGlobalSearchOverlay');
    if(overlay)new MutationObserver(()=>{enhancePanel();enhanceResults()}).observe(overlay,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));else setTimeout(init,0);
})();
