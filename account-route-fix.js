// BBB My BBB route hardening — keeps the account view stable on repeated clicks and from player routes.
(function(){
  function showAccountRoute(){
    if(location.pathname!=='/'||location.hash!=='#account'){
      history.pushState({bbbView:'account'},'', '/#account');
    }
    if(typeof bbbAccountRoute==='function')bbbAccountRoute();
    if(typeof updateMobileActive==='function')updateMobileActive();
    requestAnimationFrame(()=>{
      if(typeof bbbAccountRoute==='function')bbbAccountRoute();
      if(typeof updateMobileActive==='function')updateMobileActive();
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
})();
