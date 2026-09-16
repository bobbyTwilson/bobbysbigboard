// BBB My BBB route hardening — keeps the account view stable on repeated clicks and removes redundant My BBB nav links.
(function(){
  function injectNavStyle(){
    if(document.querySelector('#bbb-account-route-fix-styles'))return;
    const s=document.createElement('style');
    s.id='bbb-account-route-fix-styles';
    s.textContent=`
      @media(max-width:950px){
        #bbbMobileDock{grid-template-columns:repeat(4,minmax(0,1fr))!important}
        .site-header .bbb-global-search-trigger{width:118px!important;height:34px!important;padding:0 12px!important;justify-content:flex-start!important;gap:7px!important;border-radius:999px!important;background:#09130f!important;border-color:#315544!important}
        .site-header .bbb-global-search-trigger-label{display:inline!important;font-size:9px!important;font-weight:900!important;color:#b6c8be!important}
        .site-header .bbb-global-search-key{display:none!important}
        .site-header .bbb-global-search-icon{font-size:17px!important;color:#63dda0!important}
      }
      @media(max-width:390px){
        .site-header .bbb-global-search-trigger{width:96px!important;padding:0 10px!important}
        .site-header .bbb-global-search-trigger-label{font-size:8px!important}
      }
    `;
    document.head.appendChild(s);
  }

  function simplifyAccountNav(){
    injectNavStyle();

    // The green account/username pill in the header is the single My BBB entry point.
    document.querySelectorAll('.nav-links > a[href="#account"],.nav-links > a[href="/#account"],.nav-links > .bbb-account-nav-link').forEach(a=>a.remove());

    // Remove the redundant My BBB item from older mobile/subnav navigation.
    document.querySelectorAll('.mobile-subnav .bbb-account-mobile-link,.mobile-subnav a[href="#account"],.mobile-subnav a[href="/#account"]').forEach(a=>a.remove());

    const dock=document.querySelector('#bbbMobileDock');
    if(dock){
      dock.querySelectorAll('[data-mobile-key="account"],a[href="#account"],a[href="/#account"]').forEach(a=>a.remove());
    }
  }

  function showAccountRoute(){
    if(location.pathname!=='/'||location.hash!=='#account'){
      history.pushState({bbbView:'account'},'', '/#account');
    }
    if(typeof bbbAccountRoute==='function')bbbAccountRoute();
    if(typeof updateMobileActive==='function')updateMobileActive();
    requestAnimationFrame(()=>{
      if(typeof bbbAccountRoute==='function')bbbAccountRoute();
      if(typeof updateMobileActive==='function')updateMobileActive();
      simplifyAccountNav();
    });
  }

  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href="#account"],a[href="/#account"]');
    if(!a)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    showAccountRoute();
  },true);

  window.addEventListener('popstate',()=>{
    if(location.hash==='#account')setTimeout(showAccountRoute,0);
  });

  // Older nav polish scripts run a few delayed passes. Keep the account entry point
  // intentionally singular even if one of those passes tries to recreate My BBB.
  const observer=new MutationObserver(simplifyAccountNav);
  if(document.body)observer.observe(document.body,{childList:true,subtree:true});
  else document.addEventListener('DOMContentLoaded',()=>observer.observe(document.body,{childList:true,subtree:true}),{once:true});

  simplifyAccountNav();
  [100,400,1000,1800,3200].forEach(ms=>setTimeout(simplifyAccountNav,ms));
})();
