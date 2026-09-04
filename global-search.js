// Bobby's Big Board Global Player Search V1.
// Searches the already-loaded Dynasty, Rookie, and Prospect databases without
// adding another network request. Duplicate player records are merged into one
// result with source badges.

(function(){
  let bbbSearchOpenState=false;
  let bbbSearchActiveIndex=-1;
  let bbbSearchRefreshTimer=null;

  function bbbSearchEsc(v){
    return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function bbbSearchNorm(v){
    return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  }
  function bbbSearchSlug(v){
    return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/['’.]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  }
  function bbbSearchNum(v){const n=Number(v);return Number.isFinite(n)?n:null}
  function bbbSearchGrade(v){
    const n=bbbSearchNum(v);if(n==null)return '—';return Number.isInteger(n)?String(n):n.toFixed(1);
  }
  function bbbSearchView(p){
    const gap=bbbSearchNum(p?.gap);
    if(gap!=null){
      if(gap>=20)return ['buy','BBB BUY'];
      if(gap<=-20)return ['fade','BBB FADE'];
      return ['market','≈ MARKET'];
    }
    const raw=String(p?.view||'').toUpperCase();
    if(raw.includes('BUY'))return ['buy','BBB BUY'];
    if(raw.includes('FADE'))return ['fade','BBB FADE'];
    return ['market','≈ MARKET'];
  }

  function bbbSearchIndex(){
    const map=new Map();
    const ensure=(item,source)=>{
      if(!item?.name)return null;
      const key=String(item.playerKey||item.player_key||'').trim();
      const identity=key||bbbSearchNorm(item.name);
      let row=map.get(identity);
      if(!row){
        row={
          key:key||bbbSearchSlug(item.name),
          name:item.name,
          pos:item.pos||'',
          team:item.team||'',
          sources:new Set(),
          dynasty:null,
          rookie:null,
          prospect:null
        };
        map.set(identity,row);
      }
      if(!row.key&&key)row.key=key;
      if(!row.pos&&item.pos)row.pos=item.pos;
      if(!row.team&&item.team)row.team=item.team;
      row.sources.add(source);
      return row;
    };

    (typeof players!=='undefined'?players:[]).forEach(p=>{const r=ensure(p,'DYNASTY');if(r)r.dynasty=p});
    (typeof rookies!=='undefined'?rookies:[]).forEach(p=>{const r=ensure(p,'ROOKIE');if(r)r.rookie=p});
    (typeof prospects!=='undefined'?prospects:[]).forEach(p=>{const r=ensure(p,'PROSPECT');if(r)r.prospect=p});
    return [...map.values()];
  }

  function bbbSearchScore(row,q){
    const name=bbbSearchNorm(row.name),team=bbbSearchNorm(row.team),pos=bbbSearchNorm(row.pos);
    if(name===q)return 0;
    if(name.startsWith(q))return 1;
    const parts=name.split(' ');
    if(parts.some(x=>x.startsWith(q)))return 2;
    if(name.includes(q))return 3;
    if(team===q||pos===q)return 4;
    if(team.startsWith(q))return 5;
    if(`${name} ${team} ${pos}`.includes(q))return 6;
    return 99;
  }

  function bbbSearchResults(q){
    const query=bbbSearchNorm(q);
    if(!query)return [];
    return bbbSearchIndex()
      .map(row=>({row,score:bbbSearchScore(row,query)}))
      .filter(x=>x.score<99)
      .sort((a,b)=>a.score-b.score
        || (a.row.dynasty?.rank??9999)-(b.row.dynasty?.rank??9999)
        || (a.row.rookie?.rank??9999)-(b.row.rookie?.rank??9999)
        || String(a.row.name).localeCompare(String(b.row.name)))
      .slice(0,14)
      .map(x=>x.row);
  }

  function bbbSearchSourceBadges(row){
    const out=[];
    if(row.dynasty?.rank)out.push(`<span class="bbb-search-source dynasty">DYNASTY #${bbbSearchEsc(row.dynasty.rank)}</span>`);
    if(row.rookie?.rank)out.push(`<span class="bbb-search-source rookie">ROOKIE #${bbbSearchEsc(row.rookie.rank)}</span>`);
    if(row.prospect){
      const year=row.prospect.year?`${bbbSearchEsc(row.prospect.year)} · `:'';
      out.push(`<span class="bbb-search-source prospect">PROSPECT ${year}${bbbSearchEsc(bbbSearchGrade(row.prospect.grade))}</span>`);
    }
    return out.join('');
  }

  function bbbSearchResultHtml(row,index){
    const dynasty=row.dynasty;
    const [viewClass,viewText]=bbbSearchView(dynasty);
    const key=row.key||bbbSearchSlug(row.name);
    const secondary=[row.pos,row.team||(!dynasty&&row.prospect?.year?`${row.prospect.year} class`:'')].filter(Boolean).join(' • ');
    const market=dynasty?`<div class="bbb-search-result-market"><span class="bbb-search-market ${viewClass}">${bbbSearchEsc(viewText)}</span>${dynasty.market!=null?`<small>Market #${bbbSearchEsc(dynasty.market)}</small>`:''}</div>`:'';
    return `<a class="bbb-search-result${index===bbbSearchActiveIndex?' active':''}" data-search-index="${index}" href="/player/${encodeURIComponent(key)}">
      <div class="bbb-search-result-main">
        <strong>${bbbSearchEsc(row.name)}</strong>
        <span>${bbbSearchEsc(secondary||'Player profile')}</span>
        <div class="bbb-search-sources">${bbbSearchSourceBadges(row)}</div>
      </div>
      ${market}
    </a>`;
  }

  function bbbSearchRender(){
    const input=document.querySelector('#bbbGlobalSearchInput');
    const results=document.querySelector('#bbbGlobalSearchResults');
    const meta=document.querySelector('#bbbGlobalSearchMeta');
    if(!input||!results)return;
    const q=input.value.trim();
    const index=bbbSearchIndex();
    if(meta)meta.textContent=`${index.filter(x=>x.dynasty).length} dynasty • ${index.filter(x=>x.rookie).length} rookies • ${index.filter(x=>x.prospect).length} prospects`;
    if(!q){
      bbbSearchActiveIndex=-1;
      results.innerHTML='<div class="bbb-search-empty"><strong>Search every BBB player database.</strong><span>Type a player name, team, or position. Dynasty, rookie, and prospect records are merged into one result.</span></div>';
      return;
    }
    const found=bbbSearchResults(q);
    if(bbbSearchActiveIndex>=found.length)bbbSearchActiveIndex=found.length-1;
    results.innerHTML=found.length?found.map(bbbSearchResultHtml).join(''):'<div class="bbb-search-empty"><strong>No players found.</strong><span>Try a shorter name or a different spelling.</span></div>';
  }

  function bbbSearchNavigate(href){
    bbbSearchClose();
    const url=new URL(href,location.origin);
    if(url.origin===location.origin&&typeof profileRoute==='function'){
      history.pushState({},'',url.pathname+url.search+url.hash);
      profileRoute(true);
    }else location.href=url.href;
  }

  function bbbSearchOpen(){
    const overlay=document.querySelector('#bbbGlobalSearchOverlay');
    const input=document.querySelector('#bbbGlobalSearchInput');
    if(!overlay||!input)return;
    bbbSearchOpenState=true;
    bbbSearchActiveIndex=-1;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden','false');
    document.body.classList.add('bbb-global-search-open');
    input.value='';
    bbbSearchRender();
    setTimeout(()=>input.focus(),20);
    clearInterval(bbbSearchRefreshTimer);
    let tries=0;
    bbbSearchRefreshTimer=setInterval(()=>{
      if(!bbbSearchOpenState||++tries>12){clearInterval(bbbSearchRefreshTimer);return;}
      bbbSearchRender();
    },250);
  }

  function bbbSearchClose(){
    const overlay=document.querySelector('#bbbGlobalSearchOverlay');
    if(!overlay)return;
    bbbSearchOpenState=false;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden','true');
    document.body.classList.remove('bbb-global-search-open');
    clearInterval(bbbSearchRefreshTimer);
  }

  function bbbSearchInjectStyles(){
    if(document.querySelector('#bbb-global-search-styles'))return;
    const style=document.createElement('style');
    style.id='bbb-global-search-styles';
    style.textContent=`
      .bbb-global-search-trigger{flex:none;display:inline-flex;align-items:center;justify-content:center;gap:7px;border:1px solid #29483b;background:#09130f;color:#a8b8af;border-radius:999px;padding:9px 12px;font-size:10px;font-weight:900;cursor:pointer;white-space:nowrap}.bbb-global-search-trigger:hover{border-color:#47ca83;color:#fff}.bbb-global-search-icon{font-size:16px;line-height:1;transform:rotate(-15deg)}.bbb-global-search-key{color:#63776d;font-size:8px;border:1px solid #263d33;border-radius:5px;padding:2px 5px;background:#07100c}
      body.bbb-global-search-open{overflow:hidden}.bbb-global-search-overlay{position:fixed;inset:0;z-index:500;background:rgba(1,5,3,.82);backdrop-filter:blur(10px);display:flex;align-items:flex-start;justify-content:center;padding:90px 18px 24px;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .14s ease,visibility .14s ease}.bbb-global-search-overlay.open{opacity:1;visibility:visible;pointer-events:auto}.bbb-global-search-panel{width:min(760px,100%);max-height:min(720px,calc(100vh - 120px));display:flex;flex-direction:column;border:1px solid #28513f;background:linear-gradient(180deg,#09150f,#050a07);border-radius:18px;box-shadow:0 28px 90px rgba(0,0,0,.62);overflow:hidden}.bbb-search-head{display:flex;align-items:center;gap:10px;padding:14px;border-bottom:1px solid #193328}.bbb-search-input-wrap{flex:1;display:flex;align-items:center;gap:10px;border:1px solid #2b5140;background:#050a08;border-radius:11px;padding:0 12px}.bbb-search-input-wrap>span{color:#57d893;font-size:20px;transform:rotate(-15deg)}#bbbGlobalSearchInput{width:100%;border:0;outline:0;background:transparent;color:#f2f6f3;padding:13px 0;font-size:15px;font-weight:750}#bbbGlobalSearchInput::placeholder{color:#63766c}.bbb-search-close{width:38px;height:38px;flex:none;border-radius:50%;border:1px solid #29483b;background:#08110d;color:#aebbb4;cursor:pointer;font-size:18px}.bbb-search-close:hover{color:#fff;border-color:#47ca83}.bbb-search-subhead{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 15px;border-bottom:1px solid #14291f;color:#62766b;font-size:8px;font-weight:850;letter-spacing:.04em}.bbb-search-subhead strong{color:#7f9489;font-size:8px}.bbb-search-results{overflow:auto;padding:8px}.bbb-search-result{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:12px;border:1px solid transparent;border-radius:11px;color:inherit;text-decoration:none}.bbb-search-result:hover,.bbb-search-result.active{background:#0b1a13;border-color:#24503b}.bbb-search-result-main{min-width:0}.bbb-search-result-main>strong{display:block;color:#f5f7f5;font-size:13px;font-weight:950}.bbb-search-result-main>span{display:block;margin-top:2px;color:#75887e;font-size:9px}.bbb-search-sources{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}.bbb-search-source{display:inline-flex;border-radius:999px;padding:3px 6px;font-size:7px;font-weight:950;letter-spacing:.04em}.bbb-search-source.dynasty{background:#0b2b1d;border:1px solid #176743;color:#74e5a9}.bbb-search-source.rookie{background:#17251e;border:1px solid #375245;color:#b9cec3}.bbb-search-source.prospect{background:#171d22;border:1px solid #394a54;color:#b9ced8}.bbb-search-result-market{flex:none;text-align:right}.bbb-search-market{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:7px;font-weight:950}.bbb-search-market.buy{background:#0b4229;color:#67e29d;border:1px solid #197847}.bbb-search-market.fade{background:#3b1717;color:#f08f8f;border:1px solid #713232}.bbb-search-market.market{background:#1a211e;color:#b6c0ba;border:1px solid #313d37}.bbb-search-result-market small{display:block;color:#65786e;font-size:8px;margin-top:5px}.bbb-search-empty{padding:48px 22px;text-align:center}.bbb-search-empty strong{display:block;color:#dbe4df;font-size:15px}.bbb-search-empty span{display:block;max-width:470px;margin:7px auto 0;color:#71847a;font-size:10px;line-height:1.6}
      @media(max-width:1120px){.bbb-global-search-trigger-label,.bbb-global-search-key{display:none}.bbb-global-search-trigger{width:38px;height:38px;padding:0}.bbb-global-search-icon{font-size:18px}}
      @media(max-width:640px){.bbb-global-search-overlay{padding:68px 10px 10px;align-items:flex-start}.bbb-global-search-panel{max-height:calc(100vh - 78px);border-radius:14px}.bbb-search-head{padding:10px}.bbb-search-subhead{display:block}.bbb-search-subhead strong{display:none}.bbb-search-result{align-items:flex-start;gap:10px;padding:11px}.bbb-search-result-market{max-width:88px}.bbb-global-search-trigger{width:36px;height:36px}.nav{gap:10px}.nav-cta{padding:8px 10px}}
    `;
    document.head.appendChild(style);
  }

  function bbbSearchInjectUi(){
    if(document.querySelector('#bbbGlobalSearchOverlay'))return;
    bbbSearchInjectStyles();
    const overlay=document.createElement('div');
    overlay.id='bbbGlobalSearchOverlay';
    overlay.className='bbb-global-search-overlay';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML=`<section class="bbb-global-search-panel" role="dialog" aria-modal="true" aria-label="Global player search">
      <div class="bbb-search-head"><label class="bbb-search-input-wrap"><span aria-hidden="true">⌕</span><input id="bbbGlobalSearchInput" autocomplete="off" spellcheck="false" placeholder="Search any player…" aria-label="Search players"></label><button type="button" class="bbb-search-close" aria-label="Close search">×</button></div>
      <div class="bbb-search-subhead"><span id="bbbGlobalSearchMeta">Loading player databases…</span><strong>↑↓ Navigate · Enter Open · Esc Close</strong></div>
      <div id="bbbGlobalSearchResults" class="bbb-search-results"></div>
    </section>`;
    document.body.appendChild(overlay);

    const input=overlay.querySelector('#bbbGlobalSearchInput');
    input.addEventListener('input',()=>{bbbSearchActiveIndex=-1;bbbSearchRender()});
    input.addEventListener('keydown',e=>{
      const rows=[...overlay.querySelectorAll('.bbb-search-result')];
      if(e.key==='ArrowDown'&&rows.length){e.preventDefault();bbbSearchActiveIndex=Math.min(rows.length-1,bbbSearchActiveIndex+1);bbbSearchRender();overlay.querySelector(`.bbb-search-result[data-search-index="${bbbSearchActiveIndex}"]`)?.scrollIntoView({block:'nearest'})}
      else if(e.key==='ArrowUp'&&rows.length){e.preventDefault();bbbSearchActiveIndex=Math.max(0,bbbSearchActiveIndex-1);bbbSearchRender();overlay.querySelector(`.bbb-search-result[data-search-index="${bbbSearchActiveIndex}"]`)?.scrollIntoView({block:'nearest'})}
      else if(e.key==='Enter'&&bbbSearchActiveIndex>=0){const a=overlay.querySelector(`.bbb-search-result[data-search-index="${bbbSearchActiveIndex}"]`);if(a){e.preventDefault();bbbSearchNavigate(a.href)}}
      else if(e.key==='Escape'){e.preventDefault();bbbSearchClose()}
    });
    overlay.querySelector('.bbb-search-close').addEventListener('click',bbbSearchClose);
    overlay.addEventListener('click',e=>{if(e.target===overlay)bbbSearchClose()});
    overlay.addEventListener('click',e=>{
      const a=e.target.closest('.bbb-search-result');
      if(!a)return;
      e.preventDefault();bbbSearchNavigate(a.href);
    });
  }

  function bbbSearchInjectTriggers(){
    document.querySelectorAll('.nav').forEach(nav=>{
      if(nav.querySelector(':scope > .bbb-global-search-trigger'))return;
      const button=document.createElement('button');
      button.type='button';
      button.className='bbb-global-search-trigger';
      button.setAttribute('aria-label','Search all players');
      button.innerHTML='<span class="bbb-global-search-icon" aria-hidden="true">⌕</span><span class="bbb-global-search-trigger-label">Search</span><span class="bbb-global-search-key">⌘K</span>';
      button.addEventListener('click',bbbSearchOpen);
      const cta=nav.querySelector(':scope > .nav-cta');
      nav.insertBefore(button,cta||null);
    });
  }

  function bbbSearchInit(){
    bbbSearchInjectUi();
    bbbSearchInjectTriggers();
    [100,500].forEach(ms=>setTimeout(bbbSearchInjectTriggers,ms));
    document.addEventListener('keydown',e=>{
      const target=e.target;
      const typing=target&&(target.matches?.('input,textarea,select')||target.isContentEditable);
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){
        e.preventDefault();bbbSearchOpen();return;
      }
      if(e.key==='/'&&!typing&&!bbbSearchOpenState){e.preventDefault();bbbSearchOpen();return;}
      if(e.key==='Escape'&&bbbSearchOpenState)bbbSearchClose();
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bbbSearchInit);else bbbSearchInit();
})();
