(function(){
  if(typeof profileRender!=='function')return;

  async function bbbProfileCollegeMeta(slug){
    const found=typeof profileFind==='function'?profileFind(slug):null;
    if(!found)return;

    const rows=await bbbDb('site_profiles',`select=college&name=eq.${encodeURIComponent(found.name)}&limit=1`).catch(()=>[]);
    const college=(rows?.[0]?.college||'').trim();
    if(!college)return;

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
    await bbbProfileRenderWithCollege(slug);
    await bbbProfileCollegeMeta(slug);
  };
})();
