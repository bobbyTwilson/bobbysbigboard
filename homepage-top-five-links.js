// Bobby's Big Board — clickable homepage Top 5 preview rows.
// Preview-only enhancement for Homepage Polish V1.
(function(){
  const STYLE_ID='bbb-home-top-five-links-styles';

  function slug(v){
    return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/['’.]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  }

  function injectStyles(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      #topFive .preview-row.bbb-top-five-link{cursor:pointer;border-radius:9px;transition:background .14s ease,transform .14s ease,box-shadow .14s ease}
      #topFive .preview-row.bbb-top-five-link:hover{background:#0a1912;transform:translateX(2px)}
      #topFive .preview-row.bbb-top-five-link:focus-visible{outline:2px solid #4bd58c;outline-offset:2px;background:#0a1912}
    `;
    document.head.appendChild(s);
  }

  function enhance(){
    const root=document.getElementById('topFive');
    if(!root)return false;
    root.querySelectorAll('.preview-row').forEach(row=>{
      if(row.dataset.bbbTopFiveLinked==='1')return;
      const name=(row.querySelector('b')||row.querySelector('.preview-name'))?.textContent?.trim();
      if(!name)return;
      row.dataset.bbbTopFiveLinked='1';
      row.classList.add('bbb-top-five-link');
      row.setAttribute('role','link');
      row.setAttribute('tabindex','0');
      row.setAttribute('aria-label',`Open ${name} player profile`);
      const open=()=>{
        if(typeof goProfile==='function')goProfile(name);
        else location.href=`/player/${encodeURIComponent(slug(name))}`;
      };
      row.addEventListener('click',open);
      row.addEventListener('keydown',e=>{
        if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}
      });
    });
    return true;
  }

  function init(){
    injectStyles();
    enhance();
    [100,250,500,900,1600].forEach(ms=>setTimeout(enhance,ms));
    const root=document.getElementById('topFive');
    if(root)new MutationObserver(enhance).observe(root,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
