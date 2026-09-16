// Account V1 navigation refinement: keep Trade Calc in the main nav and Join Free as the single CTA.
(function(){
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
      @media(max-width:1240px){
        .site-header .nav-links{gap:11px!important}
        .site-header .bbb-account-join{padding:0 11px!important;font-size:9px!important}
      }
      @media(max-width:1075px) and (min-width:951px){
        .site-header .brand-text{display:none!important}
        .site-header .nav-links{gap:10px!important}
      }
      @media(max-width:950px){
        .site-header .nav{min-height:62px!important;gap:8px!important}
        .site-header .bbb-account-join{display:inline-flex!important;visibility:visible!important;min-height:34px!important;max-width:132px!important;padding:0 11px!important;font-size:9px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
        .site-header .mobile-subnav{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important;overflow:visible!important;padding:0 10px 10px!important;white-space:normal!important}
        .site-header .mobile-subnav>a,
        .site-header .mobile-subnav>.bbb-mobile-explore-btn{display:inline-flex!important;width:100%!important;min-width:0!important;min-height:34px!important;align-items:center!important;justify-content:center!important;text-align:center!important;padding:7px 6px!important;margin:0!important;border:1px solid #203d30!important;background:#08110d!important;border-radius:999px!important;color:#a9bbb1!important;font-size:9px!important;font-weight:900!important;line-height:1.1!important;white-space:nowrap!important}
        .site-header .mobile-subnav>a:hover,
        .site-header .mobile-subnav>.bbb-mobile-explore-btn:hover{color:#fff!important;border-color:#3c6a54!important;background:#0b1a13!important}
        .site-header .mobile-subnav>.bbb-account-mobile-link{border-color:#2d5743!important;color:#d7e9df!important}
        .site-header .mobile-subnav>.bbb-mobile-trade-link{color:#fff!important}
      }
      @media(max-width:640px){
        .site-header .brand-logo{width:54px!important;height:48px!important}
        .site-header .brand-text{display:none!important}
        .site-header .bbb-account-join{max-width:118px!important;min-height:32px!important;padding:0 10px!important;font-size:8px!important}
        .site-header .mobile-subnav{padding:0 8px 9px!important;gap:5px!important}
        .site-header .mobile-subnav>a,
        .site-header .mobile-subnav>.bbb-mobile-explore-btn{min-height:32px!important;padding:6px 4px!important;font-size:8px!important}
      }
      @media(max-width:360px){
        .site-header .mobile-subnav{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      }
    `;
    document.head.appendChild(s);
  }

  function fixDesktopNav(nav){
    [...nav.children].filter(el=>el.tagName==='A'&&(el.getAttribute('href')||'').includes('youtube.com')).forEach(el=>el.remove());

    const header=nav.closest('.nav');
    let trade=nav.querySelector(':scope > .bbb-trade-nav-link')||nav.querySelector(':scope > a[href="#trade"]');
    if(trade){
      trade.classList.remove('nav-cta');
      trade.classList.add('bbb-trade-nav-link');
    }else{
      trade=header?.querySelector(':scope > .nav-cta[href*="#trade"]')||header?.querySelector('.nav-cta[href*="#trade"]');
      if(trade){
        trade.classList.remove('nav-cta');
        trade.classList.add('bbb-trade-nav-link');
      }else{
        trade=document.createElement('a');
        trade.href='#trade';
        trade.className='bbb-trade-nav-link';
      }
    }
    trade.textContent='Trade Calc';

    const direct=[...nav.children];
    let account=direct.find(el=>el.tagName==='A'&&((el.getAttribute('href')||'')==='#account'||el.classList.contains('bbb-account-nav-link')));
    const watch=direct.find(el=>el.tagName==='A'&&(el.getAttribute('href')||'').includes('#watchlist'));
    if(!account&&watch)account=watch;
    if(!account){
      account=document.createElement('a');
      account.className='bbb-account-nav-link';
    }
    account.href='#account';
    account.textContent='My BBB';
    account.classList.add('bbb-account-nav-link');

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

  function fixMobileNav(){
    document.querySelectorAll('.mobile-subnav').forEach(nav=>{
      let trade=nav.querySelector('.bbb-mobile-trade-link');
      if(!trade){
        trade=document.createElement('a');
        trade.className='bbb-mobile-trade-link';
        trade.href='#trade';
      }
      trade.textContent='Trade Calc';

      let account=nav.querySelector('.bbb-account-mobile-link');
      if(!account){
        account=document.createElement('a');
        account.className='bbb-account-mobile-link';
        account.href='#account';
      }
      account.textContent='My BBB';

      const explore=nav.querySelector('.bbb-mobile-explore-btn');
      if(explore){
        if(trade.parentElement!==nav)nav.insertBefore(trade,explore);
        if(account.parentElement!==nav)nav.insertBefore(account,explore);
        else if(account.nextElementSibling!==explore)nav.insertBefore(account,explore);
      }else{
        if(trade.parentElement!==nav)nav.appendChild(trade);
        if(account.parentElement!==nav)nav.appendChild(account);
      }
    });
  }

  function fixHeaderCtas(){
    document.querySelectorAll('.site-header .bbb-account-join').forEach(a=>{
      if(!a.classList.contains('signed-in'))a.textContent='JOIN FREE';
    });
  }

  function apply(){
    injectStyles();
    document.querySelectorAll('.nav-links').forEach(fixDesktopNav);
    fixMobileNav();
    fixHeaderCtas();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
  [100,350,900,1700,3000].forEach(ms=>setTimeout(apply,ms));
})();
