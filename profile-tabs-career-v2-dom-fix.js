// Compatibility shim for Profile Tabs + Career V2 preview.
// The current generated profile uses one element as both `.shell` and `.profile-grid`.
// V2 expects the shell to contain a grid, so normalize that shape before V2's scheduled pass.
(function(){
  function normalizeProfileGrid(){
    const content=document.querySelector('#profileMount .profile-content');
    const outer=content?.querySelector(':scope > .shell.profile-grid');
    if(!outer)return;
    if(outer.querySelector(':scope > .bbb-tabs-v2-inner-grid'))return;

    const inner=document.createElement('div');
    inner.className='profile-grid bbb-tabs-v2-inner-grid';
    [...outer.children].forEach(child=>inner.appendChild(child));
    outer.classList.remove('profile-grid');
    outer.appendChild(inner);
  }

  function scheduleNormalize(){
    normalizeProfileGrid();
    requestAnimationFrame(normalizeProfileGrid);
    setTimeout(normalizeProfileGrid,40);
    setTimeout(normalizeProfileGrid,140);
  }

  if(typeof profileRender==='function'){
    const base=profileRender;
    profileRender=async function(slug){
      const result=await base(slug);
      scheduleNormalize();
      return result;
    };
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',scheduleNormalize,{once:true});
  }else{
    scheduleNormalize();
  }
})();
