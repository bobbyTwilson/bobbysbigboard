(function(){
  if(typeof profileRender!=='function')return;

  if(!document.querySelector('#bbb-profile-render-gate-styles')){
    const style=document.createElement('style');
    style.id='bbb-profile-render-gate-styles';
    style.textContent=`
      #profileView.bbb-profile-v2-rendering #profileMount{visibility:hidden!important;pointer-events:none!important}
      #profileView:not(.bbb-profile-v2-rendering) #profileMount{visibility:visible}

      /* The site's generic mobile table rules turn every table into ranking cards.
         Career production is a true data table, so keep it tabular and horizontally
         scrollable on phones instead of letting each season break into malformed cards. */
      @media(max-width:640px){
        .bbb-v2-career-card{overflow:hidden}
        .bbb-v2-career-table-wrap{
          overflow-x:auto!important;
          overflow-y:hidden;
          -webkit-overflow-scrolling:touch;
          overscroll-behavior-inline:contain;
          scrollbar-width:thin;
          border-radius:11px;
        }
        .bbb-v2-career-table-wrap:before{
          content:'Swipe to see more stats →';
          display:block;
          position:sticky;
          left:0;
          width:max-content;
          padding:8px 10px 7px;
          color:#6f8277;
          font-size:8px;
          font-weight:850;
          letter-spacing:.04em;
          text-transform:uppercase;
          background:#09140f;
          border-bottom:1px solid #173127;
          z-index:6;
        }
        .bbb-v2-career-table{
          display:table!important;
          width:100%!important;
          min-width:820px!important;
          border-collapse:collapse!important;
          table-layout:auto!important;
        }
        .bbb-v2-career-table thead{display:table-header-group!important}
        .bbb-v2-career-table tbody{
          display:table-row-group!important;
          padding:0!important;
        }
        .bbb-v2-career-table tbody tr{
          display:table-row!important;
          grid-template-columns:none!important;
          gap:0!important;
          padding:0!important;
          border:0!important;
          border-radius:0!important;
          background:#07100c!important;
        }
        .bbb-v2-career-table th,
        .bbb-v2-career-table td{
          display:table-cell!important;
          width:auto!important;
          padding:10px 9px!important;
          white-space:nowrap!important;
          vertical-align:middle!important;
        }
        .bbb-v2-career-table th:first-child,
        .bbb-v2-career-table td:first-child{
          position:sticky;
          left:0;
          min-width:72px;
          z-index:4;
          background:#09140f!important;
          box-shadow:1px 0 0 #173127;
        }
        .bbb-v2-career-table td:first-child{background:#07100c!important}
        .bbb-v2-career-table th:nth-child(2),
        .bbb-v2-career-table td:nth-child(2){
          position:sticky;
          left:72px;
          min-width:64px;
          z-index:3;
          background:#09140f!important;
          box-shadow:1px 0 0 #173127;
        }
        .bbb-v2-career-table td:nth-child(2){background:#07100c!important}
        .bbb-v2-career-table th:first-child,
        .bbb-v2-career-table th:nth-child(2){z-index:5}
      }
    `;
    document.head.appendChild(style);
  }

  function bbbProfileRenderGate(on){
    const view=document.querySelector('#profileView');
    if(!view)return;
    view.classList.toggle('bbb-profile-v2-rendering',!!on);
    view.setAttribute('aria-busy',on?'true':'false');
  }

  // Hide the entire legacy profile mount as early as possible on direct player-page loads.
  // The previous gate only hid .profile-content, which left the old hero/header visible
  // while Profile V2 was still assembling.
  if(location.pathname.startsWith('/player/'))bbbProfileRenderGate(true);

  async function bbbProfileCollegeData(slug){
    const found=typeof profileFind==='function'?profileFind(slug):null;
    if(!found)return null;

    const rows=await bbbDb('site_profiles',`select=college&name=eq.${encodeURIComponent(found.name)}&limit=1`).catch(()=>[]);
    const college=(rows?.[0]?.college||'').trim();
    return college?{found,college}:null;
  }

  function bbbApplyProfileCollege(data){
    if(!data)return;
    const {found,college}=data;
    const norm=typeof profileNorm==='function'?profileNorm(found.name):String(found.name||'').toLowerCase();
    const dynasty=(typeof players!=='undefined'?players:[]).find(x=>(typeof profileNorm==='function'?profileNorm(x.name):String(x.name||'').toLowerCase())===norm)||null;
    const rookie=(typeof rookies!=='undefined'?rookies:[]).find(x=>(typeof profileNorm==='function'?profileNorm(x.name):String(x.name||'').toLowerCase())===norm)||null;
    const prospect=(typeof prospects!=='undefined'?prospects:[]).find(x=>(typeof profileNorm==='function'?profileNorm(x.name):String(x.name||'').toLowerCase())===norm)||null;

    const pos=dynasty?.pos||rookie?.pos||prospect?.pos||found.pos||'';
    const team=dynasty?.team||rookie?.team||'';
    const age=dynasty?.age??rookie?.age;
    const meta=document.querySelector('#profileMount .profile-meta');
    if(!meta)return;

    meta.innerHTML=[
      pos?`<span class="pos-chip">${bbbEsc(pos)}</span>`:'',
      team?bbbEsc(team):'',
      bbbEsc(college),
      age!=null?`Age ${bbbEsc(age)}`:''
    ].filter(Boolean).join(' • ');
  }

  const bbbProfileRenderWithCollege=profileRender;
  profileRender=async function(slug){
    bbbProfileRenderGate(true);
    const collegePromise=bbbProfileCollegeData(slug);
    try{
      await bbbProfileRenderWithCollege(slug);
      bbbApplyProfileCollege(await collegePromise);
    }finally{
      requestAnimationFrame(()=>requestAnimationFrame(()=>bbbProfileRenderGate(false)));
    }
  };
})();
