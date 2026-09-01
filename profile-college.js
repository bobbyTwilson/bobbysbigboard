(function(){
  if(typeof profileRender!=='function')return;

  if(!document.querySelector('#bbb-profile-render-gate-styles')){
    const style=document.createElement('style');
    style.id='bbb-profile-render-gate-styles';
    style.textContent=`
      #profileView.bbb-profile-v2-rendering #profileMount{visibility:hidden!important;pointer-events:none!important}
      #profileView:not(.bbb-profile-v2-rendering) #profileMount{visibility:visible}
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
