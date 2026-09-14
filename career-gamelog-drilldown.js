// Bobby's Big Board — Career season -> game log drilldown
// Makes season rows in Career Fantasy Production open the Game Log tab
// with the matching season selected. Query params make the view shareable.

(function(){
  const STYLE_ID='bbb-career-gamelog-drilldown-styles';
  const BOUND_ATTR='data-bbb-game-log-season';
  let scheduled=false;
  let lastDeepLink='';

  function isPlayerRoute(){
    return /^\/player\/[^/?#]+\/?$/.test(location.pathname);
  }

  function gameLogSelect(){
    return document.querySelector('#profileView #bbbGameLog #bbbGameSeason');
  }

  function gameLogTab(){
    return document.querySelector('#profileView .bbb-tabs-btn[data-bbb-tab="gamelog"]');
  }

  function seasonAvailable(season){
    const select=gameLogSelect();
    if(!select)return false;
    return [...select.options].some(option=>String(option.value)===String(season));
  }

  function setShareableState(season,mode='replace'){
    const url=new URL(location.href);
    url.searchParams.set('tab','gamelog');
    url.searchParams.set('season',String(season));
    history[mode==='push'?'pushState':'replaceState'](history.state,'',url);
  }

  function clearShareableState(){
    const url=new URL(location.href);
    if(url.searchParams.get('tab')!=='gamelog'&&!url.searchParams.has('season'))return;
    url.searchParams.delete('tab');
    url.searchParams.delete('season');
    history.replaceState(history.state,'',url);
    lastDeepLink='';
  }

  function openSeason(season,{scroll=true,push=true}={}){
    const tab=gameLogTab();
    const select=gameLogSelect();
    if(!tab||!select||!seasonAvailable(season))return false;

    tab.click();
    if(String(select.value)!==String(season)){
      select.value=String(season);
      select.dispatchEvent(new Event('change',{bubbles:true}));
    }

    setShareableState(season,push?'push':'replace');
    lastDeepLink=`${location.pathname}?tab=gamelog&season=${season}`;

    if(scroll){
      requestAnimationFrame(()=>{
        requestAnimationFrame(()=>{
          document.querySelector('#profileView .bbb-profile-tabs-v2')?.scrollIntoView({behavior:'smooth',block:'start'});
        });
      });
    }
    return true;
  }

  function bindCareerRows(){
    const table=document.querySelector('#profileView .bbb-v2-career-table');
    if(!table)return;

    table.querySelectorAll('tbody tr').forEach(row=>{
      const season=String(row.cells?.[0]?.textContent||'').trim();
      if(!/^\d{4}$/.test(season))return;

      if(!seasonAvailable(season)){
        row.removeAttribute(BOUND_ATTR);
        row.removeAttribute('tabindex');
        row.removeAttribute('role');
        row.removeAttribute('aria-label');
        row.classList.add('bbb-career-season-unavailable');
        row.title='Weekly game log is not available for this season.';
        return;
      }

      row.classList.remove('bbb-career-season-unavailable');
      row.setAttribute(BOUND_ATTR,season);
      row.setAttribute('tabindex','0');
      row.setAttribute('role','link');
      row.setAttribute('aria-label',`View ${season} weekly game log`);
      row.title=`View ${season} weekly game log`;

      if(row.dataset.bbbCareerDrilldownBound==='1')return;
      row.dataset.bbbCareerDrilldownBound='1';

      row.addEventListener('click',event=>{
        if(event.target.closest('a,button,select,input,textarea'))return;
        const targetSeason=row.getAttribute(BOUND_ATTR);
        if(targetSeason)openSeason(targetSeason,{scroll:true,push:true});
      });

      row.addEventListener('keydown',event=>{
        if(event.key!=='Enter'&&event.key!==' ')return;
        event.preventDefault();
        const targetSeason=row.getAttribute(BOUND_ATTR);
        if(targetSeason)openSeason(targetSeason,{scroll:true,push:true});
      });
    });
  }

  function bindGameLogSeason(){
    const select=gameLogSelect();
    if(!select||select.dataset.bbbCareerUrlBound==='1')return;
    select.dataset.bbbCareerUrlBound='1';
    select.addEventListener('change',()=>{
      const active=gameLogTab()?.getAttribute('aria-selected')==='true';
      if(active&&select.value)setShareableState(select.value,'replace');
    });
  }

  function bindTabBar(){
    const bar=document.querySelector('#profileView .bbb-tabs-bar');
    if(!bar||bar.dataset.bbbCareerUrlBound==='1')return;
    bar.dataset.bbbCareerUrlBound='1';
    bar.addEventListener('click',event=>{
      const btn=event.target.closest('[data-bbb-tab]');
      if(!btn||btn.dataset.bbbTab==='gamelog')return;
      clearShareableState();
    });
  }

  function applyDeepLink(){
    const params=new URLSearchParams(location.search);
    if(params.get('tab')!=='gamelog')return;
    const season=String(params.get('season')||'').trim();
    if(!/^\d{4}$/.test(season))return;
    const signature=`${location.pathname}?tab=gamelog&season=${season}`;
    if(lastDeepLink===signature)return;
    if(openSeason(season,{scroll:false,push:false}))lastDeepLink=signature;
  }

  function injectStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      #profileView .bbb-v2-career-table tbody tr[${BOUND_ATTR}]{
        cursor:pointer;
        transition:background .14s ease,box-shadow .14s ease;
        outline:none;
      }
      #profileView .bbb-v2-career-table tbody tr[${BOUND_ATTR}] td{
        transition:background .14s ease,color .14s ease;
      }
      #profileView .bbb-v2-career-table tbody tr[${BOUND_ATTR}]:hover td,
      #profileView .bbb-v2-career-table tbody tr[${BOUND_ATTR}]:focus-visible td{
        background:#102d25!important;
      }
      #profileView .bbb-v2-career-table tbody tr[${BOUND_ATTR}]:hover td:first-child,
      #profileView .bbb-v2-career-table tbody tr[${BOUND_ATTR}]:focus-visible td:first-child{
        color:#76e7b0!important;
      }
      #profileView .bbb-v2-career-table tbody tr[${BOUND_ATTR}] td:first-child:after{
        content:'→';
        display:inline-block;
        margin-left:8px;
        color:#55d9b5;
        opacity:0;
        transform:translateX(-3px);
        transition:opacity .14s ease,transform .14s ease;
        font-size:11px;
      }
      #profileView .bbb-v2-career-table tbody tr[${BOUND_ATTR}]:hover td:first-child:after,
      #profileView .bbb-v2-career-table tbody tr[${BOUND_ATTR}]:focus-visible td:first-child:after{
        opacity:1;
        transform:translateX(0);
      }
      #profileView .bbb-v2-career-table tbody tr[${BOUND_ATTR}]:focus-visible{
        box-shadow:inset 0 0 0 2px #42cfa2;
      }
      #profileView .bbb-v2-career-table tbody tr.bbb-career-season-unavailable{
        cursor:default;
      }
      @media (hover:none){
        #profileView .bbb-v2-career-table tbody tr[${BOUND_ATTR}] td:first-child:after{
          opacity:.65;
          transform:none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function apply(){
    if(!isPlayerRoute())return;
    injectStyles();
    bindCareerRows();
    bindGameLogSeason();
    bindTabBar();
    applyDeepLink();
  }

  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      apply();
    });
  }

  const observer=new MutationObserver(schedule);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('popstate',()=>{lastDeepLink='';schedule()});
  document.addEventListener('DOMContentLoaded',schedule,{once:true});
  schedule();
})();
