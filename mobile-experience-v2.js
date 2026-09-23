// Bobby's Big Board — Mobile Experience V2
// Phone-first polish for rankings, profile navigation, filters, and trade calculator.
// Desktop remains unchanged.

(function(){
  const STYLE_ID='bbb-mobile-experience-v2-styles';
  let scheduled=false;

  function mobile(){return window.matchMedia('(max-width:700px)').matches}

  function injectStyles(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      @media(max-width:700px){
        :root{--bbb-mobile-header:62px}

        /* Global mobile rhythm */
        body{font-size:14px}
        .site-header .nav{min-height:var(--bbb-mobile-header)!important;gap:10px!important}
        .site-header .shell{width:calc(100% - 20px)!important}
        .site-header .brand-logo,.site-header .bbb-full-logo{width:50px!important;height:44px!important}
        .site-header .nav-cta{min-height:38px;padding:8px 11px!important;font-size:9px!important}
        .section{padding-top:42px!important;padding-bottom:42px!important}
        .section-head{gap:8px!important;margin-bottom:17px!important}
        .section-head h2{font-size:31px!important}
        .section-sub,.section-head p{font-size:11px!important;line-height:1.45!important}

        /* Mobile subnav: one clean horizontal dock instead of wrapping. */
        .mobile-subnav{
          display:flex!important;
          align-items:center!important;
          gap:6px!important;
          width:100%!important;
          max-width:100%!important;
          padding:6px 10px 8px!important;
          overflow-x:auto!important;
          overscroll-behavior-x:contain;
          -webkit-overflow-scrolling:touch;
          scrollbar-width:none;
          background:rgba(3,8,6,.96);
          border-bottom:1px solid #132b21;
        }
        .mobile-subnav::-webkit-scrollbar{display:none}
        .mobile-subnav a,.bbb-mobile-explore-btn{
          flex:0 0 auto!important;
          min-height:34px!important;
          display:inline-flex!important;
          align-items:center!important;
          padding:0 10px!important;
          border-radius:999px!important;
          font-size:9px!important;
          white-space:nowrap!important;
        }
        .bbb-mobile-explore-sheet{
          top:calc(var(--bbb-mobile-header) + 44px)!important;
          left:8px!important;
          right:8px!important;
          max-height:calc(100dvh - 120px);
          overflow-y:auto;
        }

        /* Rankings controls: compact, thumb-friendly, no giant filter stack. */
        #rankings .controls{
          gap:7px!important;
          padding:9px!important;
          margin-bottom:8px!important;
        }
        #rankings .tabs{
          gap:4px!important;
          order:2;
        }
        #rankings .tab{
          min-height:36px!important;
          font-size:8px!important;
          padding:7px 2px!important;
        }
        #rankings .search{
          order:1;
          min-height:46px!important;
          padding:10px 12px!important;
          font-size:16px!important;
        }
        #rankings .market-filter{
          order:3;
          min-height:40px!important;
          padding:8px 10px!important;
          font-size:11px!important;
        }

        #rankings .bbb-filter-zone{
          margin-bottom:10px!important;
          border:1px solid #193329!important;
          border-radius:12px!important;
          overflow:hidden!important;
          background:#07100c!important;
        }
        #rankings .bbb-quick-row{
          display:flex!important;
          flex-wrap:nowrap!important;
          gap:6px!important;
          width:100%!important;
          padding:8px!important;
          overflow-x:auto!important;
          -webkit-overflow-scrolling:touch;
          scrollbar-width:none;
        }
        #rankings .bbb-quick-row::-webkit-scrollbar{display:none}
        #rankings .bbb-filter-label{display:none!important}
        #rankings .bbb-qf,
        #rankings .bbb-advanced-toggle,
        #rankings .bbb-filter-count{
          flex:0 0 auto!important;
          min-height:34px!important;
          display:inline-flex!important;
          align-items:center!important;
          justify-content:center!important;
          padding:0 9px!important;
          font-size:7px!important;
          white-space:nowrap!important;
        }
        #rankings .bbb-advanced-toggle{margin-left:0!important}
        #rankings .bbb-advanced-panel{
          grid-template-columns:1fr 1fr!important;
          gap:7px!important;
          padding:10px!important;
        }
        #rankings .bbb-adv-field{gap:4px!important}
        #rankings .bbb-adv-field label{font-size:6.5px!important}
        #rankings .bbb-adv-field select,
        #rankings .bbb-adv-field input{
          min-height:42px!important;
          padding:8px!important;
          font-size:11px!important;
        }
        #rankings .bbb-adv-actions{
          grid-column:1/-1!important;
          gap:8px!important;
        }
        #rankings .bbb-clear-filters{min-height:40px!important}

        /* Top 500 cards: stronger scan hierarchy and less vertical waste. */
        #rankings tbody{gap:7px!important}
        #rankings tbody tr{
          min-height:78px!important;
          padding:11px 10px!important;
          border-radius:11px!important;
          box-shadow:none!important;
        }
        #rankings .rank-cell{
          font-size:22px!important;
          padding-right:8px!important;
        }
        #rankings .player-cell{
          font-size:14px!important;
          line-height:1.12!important;
        }
        #rankings .col-team{
          display:flex!important;
          align-items:center!important;
          flex-wrap:wrap!important;
          gap:5px!important;
          font-size:9px!important;
        }
        #rankings .col-posrank{
          min-height:23px!important;
          padding:3px 7px!important;
          font-size:9px!important;
        }
        #rankings .col-view .market-badge{font-size:6.5px!important}
        #rankings .bbb-mobile-injury{
          display:inline-flex;
          align-items:center;
          max-width:120px;
          min-height:18px;
          padding:2px 6px;
          border:1px solid #654b28;
          border-radius:999px;
          background:#22190c;
          color:#e7c77b;
          font-size:6.5px;
          font-weight:950;
          line-height:1.1;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }
        #rankings .bbb-mobile-injury.out,
        #rankings .bbb-mobile-injury.ir{
          border-color:#6b3434;
          background:#251010;
          color:#efa0a0;
        }

        /* Player profile: keep the successful layout, improve hierarchy/touch targets. */
        #profileView .profile-hero{
          padding-top:12px!important;
          padding-bottom:10px!important;
        }
        #profileView .profile-back{
          min-height:36px!important;
          display:inline-flex!important;
          align-items:center!important;
          margin-bottom:8px!important;
          padding:0 2px!important;
          font-size:8px!important;
        }
        #profileView .bbb-redesign-hero-row{gap:9px!important}
        #profileView .profile-title{margin:0!important}
        #profileView .bbb-redesign-hero-actions{
          margin-top:5px!important;
          gap:6px!important;
        }
        #profileView .bbb-redesign-hero-actions .bbb-profile-watch,
        #profileView .bbb-redesign-compare{
          min-height:40px!important;
          border-radius:9px!important;
        }
        #profileView .bbb-profile-atglance{margin-top:10px!important}
        #profileView .bbb-redesign-latest p{
          display:-webkit-box;
          -webkit-line-clamp:4;
          -webkit-box-orient:vertical;
          overflow:hidden;
        }

        /* Main profile tabs remain reachable as the user scrolls. */
        #profileView .bbb-tabs-bar{
          position:sticky!important;
          top:var(--bbb-mobile-header)!important;
          z-index:38!important;
          margin:0 -1px 8px!important;
          padding:4px!important;
          background:rgba(5,16,11,.97)!important;
          border-color:#1c4936!important;
          box-shadow:0 8px 22px rgba(0,0,0,.2);
          backdrop-filter:blur(12px);
        }
        #profileView .bbb-tabs-btn{
          min-height:42px!important;
          padding:0 13px!important;
          font-size:7.5px!important;
        }
        #profileView .bbb-tabs-btn.active{
          background:#0d3323!important;
          color:#73e6aa!important;
          box-shadow:inset 0 0 0 1px #246947;
        }
        #profileView .bbb-redesign-tabs{
          gap:4px!important;
          padding:3px!important;
          margin-bottom:8px!important;
          scroll-snap-type:x proximity;
        }
        #profileView .bbb-redesign-tabs a{
          min-height:38px!important;
          display:inline-flex!important;
          align-items:center!important;
          padding:0 11px!important;
          scroll-snap-align:start;
        }

        /* Trade calculator: designed for the phone instead of merely stacked. */
        .trade-section{padding-top:38px!important}
        .trade-topbar{
          gap:10px!important;
          margin-bottom:15px!important;
        }
        .trade-topbar h2{font-size:31px!important}
        .trade-actions{
          width:100%!important;
          display:grid!important;
          grid-template-columns:1fr 1fr!important;
          gap:7px!important;
        }
        .trade-action{
          min-height:42px!important;
          padding:8px!important;
          font-size:9px!important;
        }
        .bbb-trade-v2-controls{
          width:100%!important;
          display:block!important;
        }
        .bbb-trade-mode{
          width:100%!important;
          display:grid!important;
          grid-template-columns:1fr 1fr!important;
          border-radius:10px!important;
        }
        .bbb-trade-mode-btn{
          min-height:40px!important;
          padding:0 8px!important;
          border-radius:8px!important;
          font-size:8px!important;
        }
        .trade-grid{
          gap:9px!important;
        }
        .trade-team-card,
        .trade-verdict-card{
          border-radius:13px!important;
        }
        .trade-team-card{
          padding:12px!important;
        }
        .trade-team-head{
          margin-bottom:9px!important;
        }
        .trade-team-head strong{font-size:21px!important}
        .trade-search{
          min-height:46px!important;
          padding:10px 11px!important;
          font-size:16px!important;
        }
        .trade-assets{
          min-height:84px!important;
          gap:6px!important;
          margin-top:8px!important;
        }
        .trade-empty{
          min-height:82px!important;
          padding:18px 10px!important;
        }
        .trade-asset{
          gap:6px!important;
          padding:9px!important;
          border-radius:9px!important;
        }
        .bbb-trade-asset-name,.trade-asset-name{font-size:11px!important}
        .trade-asset-meta{font-size:8px!important}
        .trade-remove{width:30px!important;height:30px!important}
        .trade-verdict-card{
          padding:13px!important;
          order:3!important;
          position:static!important;
        }
        .trade-verdict{font-size:22px!important;margin:8px 0 5px!important}
        .trade-verdict-sub{min-height:0!important;font-size:9px!important}
        .fairness-wrap{margin:14px 0 11px!important}
        .adjusted-grid{gap:6px!important}
        .adjusted-grid div{padding:8px!important}
        .bbb-trade-reason{margin-top:10px!important;padding:10px!important}
        .bbb-trade-reason p{font-size:9px!important}
        .trade-note{font-size:7px!important}
        .trade-explainer-grid{display:none!important}

        /* Avoid giant footer/strip spacing on phones. */
        .youtube-strip{padding:24px 0 30px!important}
        .youtube-strip-inner{padding:18px!important;gap:13px!important}
        .footer{padding:24px 0 30px!important}
      }

      @media(max-width:390px){
        #rankings .bbb-advanced-panel{grid-template-columns:1fr!important}
        #rankings tbody tr{
          grid-template-columns:42px minmax(0,1fr) auto!important;
          gap:3px 7px!important;
        }
        .trade-actions{grid-template-columns:1fr!important}
      }
    `;
    document.head.appendChild(s);
  }

  function playerStatus(p){
    return String(p?.injuryStatus||p?.injury_status||'').trim();
  }

  function decorateRankingCards(){
    if(!mobile()||!Array.isArray(window.players)&&typeof players==='undefined')return;
    const list=typeof players!=='undefined'?players:window.players;
    document.querySelectorAll('#rankingsBody tr[data-r]').forEach(row=>{
      if(row.dataset.bbbMobileV2Decorated==='1')return;
      const p=list.find(x=>Number(x.rank)===Number(row.dataset.r));
      const status=playerStatus(p);
      const team=row.querySelector('.col-team');
      if(team&&status&&!/healthy|active|cleared|none/i.test(status)){
        const badge=document.createElement('span');
        const low=status.toLowerCase();
        badge.className='bbb-mobile-injury '+(low.includes('ir')?'ir':low.includes('out')?'out':'');
        badge.textContent=status;
        team.appendChild(badge);
      }
      row.dataset.bbbMobileV2Decorated='1';
    });
  }

  function rememberBoardScroll(e){
    if(!mobile())return;
    const row=e.target.closest('#rankingsBody tr[data-r]');
    if(!row)return;
    try{
      sessionStorage.setItem('bbbMobileBoardScroll',String(window.scrollY||0));
      sessionStorage.setItem('bbbMobileReturnToBoard','1');
    }catch{}
  }

  function bindProfileBack(){
    if(!mobile()||!/^\/player\//.test(location.pathname))return;
    const back=document.querySelector('#profileView .profile-back');
    if(!back||back.dataset.bbbMobileBackBound==='1')return;
    back.dataset.bbbMobileBackBound='1';
    back.textContent='← BACK TO RANKINGS';
    back.addEventListener('click',e=>{
      let saved=null;
      try{saved=Number(sessionStorage.getItem('bbbMobileBoardScroll'));}catch{}
      if(!Number.isFinite(saved))return;
      e.preventDefault();
      history.pushState({},'', '/#rankings');
      if(typeof profileRoute==='function')profileRoute(true);
      else location.href='/#rankings';
      setTimeout(()=>window.scrollTo(0,saved),80);
      setTimeout(()=>window.scrollTo(0,saved),260);
    });
  }

  function restoreBoardScroll(){
    if(!mobile()||/^\/player\//.test(location.pathname))return;
    let should=false,saved=null;
    try{
      should=sessionStorage.getItem('bbbMobileReturnToBoard')==='1';
      saved=Number(sessionStorage.getItem('bbbMobileBoardScroll'));
      if(should)sessionStorage.removeItem('bbbMobileReturnToBoard');
    }catch{}
    if(should&&Number.isFinite(saved)){
      setTimeout(()=>window.scrollTo(0,saved),100);
      setTimeout(()=>window.scrollTo(0,saved),320);
    }
  }

  function compactExploreSheet(){
    const sheet=document.querySelector('#bbbMobileExploreSheet');
    if(!sheet||sheet.dataset.bbbMobileV2==='1')return;
    sheet.dataset.bbbMobileV2='1';
    sheet.querySelectorAll('a').forEach(a=>{
      const span=a.querySelector('span');
      if(span)span.style.display='none';
    });
  }

  function apply(){
    injectStyles();
    if(!mobile())return;
    decorateRankingCards();
    bindProfileBack();
    compactExploreSheet();
  }

  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      apply();
    });
  }

  document.addEventListener('click',rememberBoardScroll,true);
  const observer=new MutationObserver(schedule);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('resize',schedule);
  window.addEventListener('popstate',()=>{schedule();restoreBoardScroll()});
  window.addEventListener('hashchange',restoreBoardScroll);
  document.addEventListener('DOMContentLoaded',()=>{schedule();restoreBoardScroll()},{once:true});
  schedule();
})();
