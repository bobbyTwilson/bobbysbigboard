// Bobby's Big Board profile render gate.
// Prevents the classic/base profile DOM from flashing before the current profile
// enhancement stack finishes. Shared/direct player URLs show one stable loading
// state until the final profile composition is ready.
(function(){
  const PLAYER_PATH=/^\/player\/[^/?#]+\/?$/;
  let token=0;

  function isPlayerPath(){return PLAYER_PATH.test(location.pathname)}
  function mount(){return document.querySelector('#profileMount')}

  function setRendering(on){
    const root=document.documentElement;
    root.classList.toggle('bbb-profile-rendering',!!on);
    if(on&&isPlayerPath())root.classList.add('bbb-player-boot');
    const m=mount();
    if(m)m.setAttribute('aria-busy',on?'true':'false');
  }

  function finishRendering(myToken){
    if(myToken!==token)return;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(myToken!==token)return;
      document.documentElement.classList.remove('bbb-profile-rendering','bbb-player-boot');
      const m=mount();
      if(m)m.setAttribute('aria-busy','false');
    }));
  }

  function syncRouteClass(){
    if(!isPlayerPath())document.documentElement.classList.remove('bbb-player-boot','bbb-profile-rendering');
  }

  const style=document.createElement('style');
  style.id='bbb-profile-render-gate-styles';
  style.textContent=`
    html.bbb-player-boot #rankingsView,
    html.bbb-player-boot #rookieView,
    html.bbb-player-boot #prospectView,
    html.bbb-player-boot #tradeView,
    html.bbb-player-boot #compareView,
    html.bbb-player-boot #updatesView,
    html.bbb-player-boot #moversView,
    html.bbb-player-boot #watchlistView,
    html.bbb-player-boot #opportunityView{display:none!important}
    html.bbb-player-boot #profileView{display:block!important;min-height:72vh}
    html.bbb-profile-rendering #profileMount{position:relative;min-height:62vh}
    html.bbb-profile-rendering #profileMount>*{visibility:hidden!important}
    html.bbb-profile-rendering #profileMount:before{
      content:'Loading player profile…';
      visibility:visible;
      position:absolute;
      inset:0;
      min-height:52vh;
      display:grid;
      place-items:center;
      color:#819188;
      font-size:12px;
      font-weight:800;
      letter-spacing:.02em;
      background:#050807;
      z-index:20;
    }
  `;
  document.head.appendChild(style);

  // The feature bundle loads this file last, so this wraps the complete active
  // profile stack (V2, snapshot, fantasy stats, density, final polish, Daejon).
  if(typeof profileRender==='function'){
    const activeProfileRender=profileRender;
    profileRender=async function(slug){
      const myToken=++token;
      setRendering(true);
      try{
        return await activeProfileRender.apply(this,arguments);
      }finally{
        finishRendering(myToken);
      }
    };
  }

  // Direct player documents receive an early boot class in the generated HTML.
  // Clear it on navigation back to the board/tools.
  window.addEventListener('popstate',syncRouteClass);
  window.addEventListener('hashchange',syncRouteClass);
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href]');
    if(!a)return;
    const href=a.getAttribute('href')||'';
    if(href.startsWith('#')||href.startsWith('/#'))setTimeout(syncRouteClass,0);
  });
})();
