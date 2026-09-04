// Player deep-link guard.
// Mobile/in-app browsers can restore an old hash or finish the live-data loads
// after the first profile routing pass. Keep /player/* authoritative and reroute
// once the player datasets are actually available.
(function(){
  const isPlayerPath=()=>/^\/player\/[^/?#]+\/?$/.test(location.pathname);
  if(!isPlayerPath())return;

  window.__BBB_PLAYER_DEEP_LINK__=true;

  function clearPlayerHash(){
    if(!isPlayerPath()||!location.hash)return;
    history.replaceState(history.state,'',location.pathname+location.search);
  }

  function keepProfileVisible(){
    if(!isPlayerPath())return;
    clearPlayerHash();
    ['rankingsView','rookieView','prospectView','tradeView','compareView','updatesView','moversView','watchlistView','opportunityView']
      .forEach(id=>document.querySelector('#'+id)?.classList.add('hide'));
    document.querySelector('#profileView')?.classList.remove('hide');
  }

  function rerouteProfile(){
    if(!isPlayerPath())return;
    keepProfileVisible();
    if(typeof profileRoute==='function')profileRoute(true);
  }

  // Prevent stale #compare (or any other restored hash) from winning on a
  // directly shared player URL before the rest of the app initializes.
  clearPlayerHash();

  // Re-run the profile router after each live dataset completes. This removes
  // the desktop-vs-mobile timing difference on slower in-app browsers.
  ['load','loadRookies','loadProspects'].forEach(name=>{
    const original=window[name];
    if(typeof original!=='function'||original.__bbbDeepLinkWrapped)return;
    const wrapped=async function(){
      const result=await original.apply(this,arguments);
      if(isPlayerPath())setTimeout(rerouteProfile,0);
      return result;
    };
    wrapped.__bbbDeepLinkWrapped=true;
    window[name]=wrapped;
  });

  const init=()=>{
    keepProfileVisible();
    rerouteProfile();
    // One delayed recovery pass handles a slow first load without leaving a
    // permanent "Player not found"/blank state.
    setTimeout(()=>{
      if(!isPlayerPath())return;
      const mount=document.querySelector('#profileMount');
      const ready=mount?.querySelector('.profile-hero');
      if(!ready)rerouteProfile();
    },4000);
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();

  window.addEventListener('pageshow',()=>{if(isPlayerPath())keepProfileVisible()});
  window.addEventListener('hashchange',()=>{if(isPlayerPath())rerouteProfile()});
  window.addEventListener('popstate',()=>{if(isPlayerPath())rerouteProfile()});
})();
