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
      .site-header .bbb-trade-nav-link{color:#69d99c!important;font-weight:900!important}
      .site-header .bbb-trade-nav-link:hover{color:#fff!important}
      .bbb-mobile-trade-link{color:#8ee4b5!important;border-color:#2b5c45!important}
      @media(max-width:1240px){
        .site-header .nav-links{gap:11px!important}
        .site-header .bbb-account-join{padding:0 11px!important;font-size:9px!important}
      }
      @media(max-width:1075px) and (min-width:951px){
        .site-header .brand-text{display:none!important}
        .site-header .nav-links{gap:10px!important}
      }
    `;
    document.head.appendChild(s);
  }

  function fixDesktopNav(nav){
    [...nav.children].filter(el=>el.tagName==='A'&&(el.getAttribute('href')||'').includes('youtube.com')).forEach(el=>el.remove());

    const header=nav.closest('.nav');
    let trade=nav.querySelector(':scope > .bbb-trade-nav-link');
    if(!trade){
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
      prospects.insertAdjacentElement('afterend',trade);
      trade.insertAdjacentElement('afterend',account);
    }else if(explore){
      nav.insertBefore(trade,explore);
      nav.insertBefore(account,explore);
    }else{
      nav.append(trade,account);
    }
  }

  function fixMobileNav(){
    document.querySelectorAll('.mobile-subnav').forEach(nav=>{
      let trade=nav.querySelector('.bbb-mobile-trade-link');
      if(!trade){trade=document.createElement('a');trade.className='bbb-mobile-trade-link';trade.href='#trade';trade.textContent='Trade Calc';}
      const account=nav.querySelector('.bbb-account-mobile-link');
      if(account)nav.insertBefore(trade,account);else nav.appendChild(trade);
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
