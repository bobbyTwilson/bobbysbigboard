// Account V1 navigation refinement: desktop nav + app-like mobile navigation.
(function(){
  const mobileLinks=[
    ['#prospects','Prospects','Prospect grades and historical scouting database.'],
    ['#stats','Stats','Fantasy leaders, season stats and player production.'],
    ['#updates','Updates','Latest injury, role and roster news.'],
    ['#movers','Movers','BBB risers, fallers and market-value gaps.'],
    ['#compare','Compare','Put two dynasty assets side-by-side.'],
    ['#opportunity','Opportunity','Track meaningful changes in player opportunity.']
  ];

  function injectStyles(){
    if(document.querySelector('#bbb-account-nav-fix-styles'))return;
    const s=document.createElement('style');
    s.id='bbb-account-nav-fix-styles';
    s.textContent=`
      .site-header .nav{gap:12px!important}
      .site-header .nav-links{gap:15px!important}
      .site-header .bbb-account-join{flex:none!important;min-height:36px!important;padding:0 15px!important;background:#169b5b!important;border:1px solid #169b5b!important;color:#fff!important;border-radius:999px!important;font-size:10px!important;font-weight:950!important;box-shadow:0 0 0 1px rgba(83,228,154,.05)!important}
      .site-header .bbb-account-join:hover{background:#1caf68!important;border-color:#1caf68!important;color:#fff!important}
      .site-header .bbb-account-nav-link{color:#d7e4dd!important}
      .site-header .bbb-account-nav-link:hover{color:#fff!important}
      .site-header .bbb-trade-nav-link{color:#d7e4dd!important;font-weight:800!important}
      .site-header .bbb-trade-nav-link:hover{color:#fff!important}
      .bbb-mobile-dock,.bbb-mobile-more-backdrop,.bbb-mobile-more-sheet{display:none}
      @media(max-width:1240px){
        .site-header .nav-links{gap:11px!important}
        .site-header .bbb-account-join{padding:0 11px!important;font-size:9px!important}
      }
      @media(max-width:1075px) and (min-width:951px){
        .site-header .brand-text{display:none!important}
        .site-header .nav-links{gap:10px!important}
      }
      @media(max-width:950px){
        body{padding-bottom:70px!important}
        .site-header .nav{min-height:62px!important;gap:10px!important;padding-right:2px!important}
        .site-header .brand{min-width:0!important}
        .site-header .brand-logo{width:56px!important;height:50px!important}
        .site-header .brand-text{display:none!important}
        .site-header .bbb-account-join{display:inline-flex!important;visibility:visible!important;min-height:34px!important;max-width:132px!important;padding:0 12px!important;font-size:9px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
        .site-header .mobile-subnav{display:none!important}
        #bbbMobileExploreSheet{display:none!important}

        .bbb-mobile-dock{position:fixed;left:8px;right:8px;bottom:max(8px,env(safe-area-inset-bottom));z-index:210;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));align-items:stretch;min-height:58px;padding:5px;background:rgba(6,14,10,.96);border:1px solid #214033;border-radius:17px;box-shadow:0 16px 48px rgba(0,0,0,.48);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
        .bbb-mobile-dock a,.bbb-mobile-dock button{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-width:0;border:0;background:transparent;color:#7f9489;border-radius:12px;padding:6px 2px;font-size:8px;font-weight:900;line-height:1;cursor:pointer;-webkit-tap-highlight-color:transparent}
        .bbb-mobile-dock a:hover,.bbb-mobile-dock button:hover,.bbb-mobile-dock .active{background:#0e2118;color:#fff}
        .bbb-mobile-dock .active:after{content:'';position:absolute;left:50%;bottom:2px;width:14px;height:2px;transform:translateX(-50%);border-radius:999px;background:#53e49a}
        .bbb-mobile-dock svg{width:18px;height:18px;display:block;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
        .bbb-mobile-dock .bbb-mobile-trade-main{color:#cfe9db}
        .bbb-mobile-dock .bbb-mobile-account-main{color:#cfe9db}

        .bbb-mobile-more-backdrop{position:fixed;inset:0;z-index:218;background:rgba(0,0,0,.58);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}
        .bbb-mobile-more-backdrop.open{display:block}
        .bbb-mobile-more-sheet{position:fixed;left:8px;right:8px;bottom:calc(max(8px,env(safe-area-inset-bottom)) + 66px);z-index:220;padding:14px;background:#07110d;border:1px solid #244638;border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.6)}
        .bbb-mobile-more-sheet.open{display:block}
        .bbb-mobile-more-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:2px 3px 11px;border-bottom:1px solid #173027}
        .bbb-mobile-more-head strong{font-size:12px;color:#edf5f0}
        .bbb-mobile-more-head span{display:block;margin-top:2px;color:#687d72;font-size:8px}
        .bbb-mobile-more-close{width:30px;height:30px;border:1px solid #2b493d;border-radius:50%;background:#0b1712;color:#9fb0a7;font-size:17px;line-height:1;cursor:pointer}
        .bbb-mobile-more-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px}
        .bbb-mobile-more-grid a{display:block;padding:11px 12px;border:1px solid #19352a;background:#091510;border-radius:11px;color:#dbe7e0}
        .bbb-mobile-more-grid a:hover{border-color:#326a50;background:#0d1d16}
        .bbb-mobile-more-grid strong{display:block;font-size:10px;font-weight:950}
        .bbb-mobile-more-grid span{display:block;margin-top:3px;color:#70857a;font-size:7px;line-height:1.35}
        .bbb-mobile-more-youtube{display:flex!important;align-items:center!important;justify-content:space-between!important;grid-column:1/-1;color:#9ce5bb!important}
      }
      @media(max-width:390px){
        .site-header .bbb-account-join{max-width:106px!important;padding:0 10px!important;font-size:8px!important}
        .bbb-mobile-dock{left:6px;right:6px}
        .bbb-mobile-dock a,.bbb-mobile-dock button{font-size:7px!important}
        .bbb-mobile-dock svg{width:17px;height:17px}
        .bbb-mobile-more-grid{grid-template-columns:1fr}
        .bbb-mobile-more-youtube{grid-column:auto}
      }
    `;
    document.head.appendChild(s);
  }

  function icon(type){
    const icons={
      rankings:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V11M12 19V5M19 19v-8"/></svg>',
      rookies:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/></svg>',
      trade:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h11M15 4l3 3-3 3M17 17H6M9 14l-3 3 3 3"/></svg>',
      account:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3"/><path d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6"/></svg>',
      more:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>'
    };
    return icons[type]||'';
  }

  function fixDesktopNav(nav){
    [...nav.children].filter(el=>el.tagName==='A'&&(el.getAttribute('href')||'').includes('youtube.com')).forEach(el=>el.remove());
    const header=nav.closest('.nav');
    let trade=nav.querySelector(':scope > .bbb-trade-nav-link')||nav.querySelector(':scope > a[href="#trade"]');
    if(trade){trade.classList.remove('nav-cta');trade.classList.add('bbb-trade-nav-link');}
    else{
      trade=header?.querySelector(':scope > .nav-cta[href*="#trade"]')||header?.querySelector('.nav-cta[href*="#trade"]');
      if(trade){trade.classList.remove('nav-cta');trade.classList.add('bbb-trade-nav-link');}
      else{trade=document.createElement('a');trade.href='#trade';trade.className='bbb-trade-nav-link';}
    }
    trade.textContent='Trade Calc';

    const direct=[...nav.children];
    let account=direct.find(el=>el.tagName==='A'&&((el.getAttribute('href')||'')==='#account'||el.classList.contains('bbb-account-nav-link')));
    const watch=direct.find(el=>el.tagName==='A'&&(el.getAttribute('href')||'').includes('#watchlist'));
    if(!account&&watch)account=watch;
    if(!account){account=document.createElement('a');account.className='bbb-account-nav-link';}
    account.href='#account';account.textContent='My BBB';account.classList.add('bbb-account-nav-link');

    const prospects=[...nav.children].find(el=>el.tagName==='A'&&(el.getAttribute('href')||'').includes('#prospects'));
    const explore=nav.querySelector(':scope > .bbb-nav-explore');
    if(prospects){
      if(prospects.nextElementSibling!==trade)prospects.insertAdjacentElement('afterend',trade);
      if(trade.nextElementSibling!==account)trade.insertAdjacentElement('afterend',account);
    }else if(explore){
      if(trade.parentElement!==nav)nav.insertBefore(trade,explore);
      if(account.parentElement!==nav)nav.insertBefore(account,explore);
    }else{
      if(trade.parentElement!==nav)nav.appendChild(trade);
      if(account.parentElement!==nav)nav.appendChild(account);
    }
  }

  function makeMobileNav(){
    if(document.querySelector('#bbbMobileDock'))return;
    const dock=document.createElement('nav');
    dock.id='bbbMobileDock';dock.className='bbb-mobile-dock';dock.setAttribute('aria-label','Mobile navigation');
    dock.innerHTML=`
      <a href="#rankings" data-mobile-key="rankings">${icon('rankings')}<span>Rankings</span></a>
      <a href="#rookies" data-mobile-key="rookies">${icon('rookies')}<span>Rookies</span></a>
      <a href="#trade" class="bbb-mobile-trade-main" data-mobile-key="trade">${icon('trade')}<span>Trade</span></a>
      <a href="#account" class="bbb-mobile-account-main" data-mobile-key="account">${icon('account')}<span>My BBB</span></a>
      <button type="button" id="bbbMobileMoreBtn" data-mobile-key="more" aria-expanded="false">${icon('more')}<span>More</span></button>`;

    const backdrop=document.createElement('div');backdrop.id='bbbMobileMoreBackdrop';backdrop.className='bbb-mobile-more-backdrop';
    const sheet=document.createElement('div');sheet.id='bbbMobileMoreSheet';sheet.className='bbb-mobile-more-sheet';
    sheet.innerHTML=`<div class="bbb-mobile-more-head"><div><strong>Explore Bobby's Big Board</strong><span>More tools and research</span></div><button type="button" class="bbb-mobile-more-close" aria-label="Close menu">×</button></div><div class="bbb-mobile-more-grid">${mobileLinks.map(([href,title,copy])=>`<a href="${href}"><strong>${title}</strong><span>${copy}</span></a>`).join('')}<a class="bbb-mobile-more-youtube" href="https://www.youtube.com/@bobbysbigboard" target="_blank"><strong>YouTube ↗</strong><span>Film breakdowns and dynasty content.</span></a></div>`;
    document.body.append(dock,backdrop,sheet);
    const btn=dock.querySelector('#bbbMobileMoreBtn');
    const close=()=>{backdrop.classList.remove('open');sheet.classList.remove('open');btn.classList.remove('active');btn.setAttribute('aria-expanded','false');};
    const open=()=>{backdrop.classList.add('open');sheet.classList.add('open');btn.classList.add('active');btn.setAttribute('aria-expanded','true');};
    btn.addEventListener('click',()=>sheet.classList.contains('open')?close():open());
    backdrop.addEventListener('click',close);sheet.querySelector('.bbb-mobile-more-close').addEventListener('click',close);
    sheet.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
    window.addEventListener('hashchange',()=>{close();updateMobileActive();});
    updateMobileActive();
  }

  function updateMobileActive(){
    const dock=document.querySelector('#bbbMobileDock');if(!dock)return;
    const h=location.hash||'#rankings';
    let key=h==='#rookies'?'rookies':h==='#trade'?'trade':h==='#account'?'account':h==='#rankings'||h===''?'rankings':'more';
    dock.querySelectorAll('[data-mobile-key]').forEach(el=>el.classList.toggle('active',el.dataset.mobileKey===key));
  }

  function fixHeaderCtas(){
    document.querySelectorAll('.site-header .bbb-account-join').forEach(a=>{if(!a.classList.contains('signed-in'))a.textContent='JOIN FREE';});
  }

  function apply(){
    injectStyles();
    document.querySelectorAll('.nav-links').forEach(fixDesktopNav);
    fixHeaderCtas();
    makeMobileNav();
    updateMobileActive();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
  [100,350,900,1700,3000].forEach(ms=>setTimeout(apply,ms));
})();
