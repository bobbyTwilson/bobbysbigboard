// Account V1 navigation refinement: always expose My BBB and keep both account + trade CTAs prominent.
(function(){
  function injectStyles(){
    if(document.querySelector('#bbb-account-nav-fix-styles'))return;
    const s=document.createElement('style');
    s.id='bbb-account-nav-fix-styles';
    s.textContent=`
      .site-header .nav{gap:12px!important}
      .site-header .nav-links{gap:15px!important}
      .site-header .nav-cta{flex:none!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:32px!important;padding:0 10px!important;background:#0f6f43!important;border:1px solid #238b59!important;color:#fff!important;border-radius:999px!important;font-size:9px!important;font-weight:950!important;letter-spacing:.02em!important;white-space:nowrap!important;box-shadow:0 0 0 1px rgba(83,228,154,.04)!important}
      .site-header .nav-cta:hover{background:#13824d!important;border-color:#41bf7d!important;color:#fff!important}
      .site-header .bbb-account-join{flex:none!important;min-height:36px!important;padding:0 15px!important;background:#169b5b!important;border:1px solid #169b5b!important;color:#fff!important;border-radius:999px!important;font-size:10px!important;font-weight:950!important;box-shadow:0 0 0 1px rgba(83,228,154,.05)!important}
      .site-header .bbb-account-join:hover{background:#1caf68!important;border-color:#1caf68!important;color:#fff!important}
      .site-header .bbb-account-nav-link{color:#d7e4dd!important}
      .site-header .bbb-account-nav-link:hover{color:#fff!important}
      @media(max-width:1240px){
        .site-header .nav-links{gap:11px!important}
        .site-header .nav-cta{padding:0 8px!important;font-size:8px!important}
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
    const direct=[...nav.children];
    direct.filter(el=>el.tagName==='A'&&(el.getAttribute('href')||'').includes('youtube.com')).forEach(el=>el.remove());

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

    const explore=nav.querySelector(':scope > .bbb-nav-explore');
    if(explore)nav.insertBefore(account,explore);
    else nav.appendChild(account);
  }

  function fixHeaderCtas(){
    document.querySelectorAll('.site-header .nav-cta').forEach(a=>{
      if((a.getAttribute('href')||'').includes('#trade'))a.textContent='TRADE CALC';
    });
    document.querySelectorAll('.site-header .bbb-account-join').forEach(a=>{
      if(!a.classList.contains('signed-in'))a.textContent='JOIN FREE';
    });
  }

  function apply(){
    injectStyles();
    document.querySelectorAll('.nav-links').forEach(fixDesktopNav);
    fixHeaderCtas();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
  [100,350,900,1700,3000].forEach(ms=>setTimeout(apply,ms));
})();
