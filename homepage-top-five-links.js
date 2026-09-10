// Bobby's Big Board — clickable homepage Current Board Top 5 preview rows.
// Preview-only enhancement for Homepage Polish V1.
(function(){
  const STYLE_ID='bbb-home-top-five-links-styles';

  function slug(v){
    return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/['’.]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  }

  function root(){
    return document.getElementById('previewRows')||document.getElementById('topFive');
  }

  function injectStyles(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      #previewRows .preview-row.bbb-top-five-link,#topFive .preview-row.bbb-top-five-link{cursor:pointer;border-radius:10px;transition:background .14s ease,transform .14s ease,border-color .14s ease}
      #previewRows .preview-row.bbb-top-five-link:hover,#topFive .preview-row.bbb-top-five-link:hover{background:#0c1913;border-color:#2d5a44;transform:translateX(2px)}
      #previewRows .preview-row.bbb-top-five-link:focus-visible,#topFive .preview-row.bbb-top-five-link:focus-visible{outline:2px solid #4bd58c;outline-offset:2px;background:#0c1913}
    `;
    document.head.appendChild(s);
  }

  function enhance(){
    const list=root();
    if(!list)return false;
    list.querySelectorAll('.preview-row').forEach(row=>{
      if(row.dataset.bbbTopFiveLinked==='1')return;
      const name=(row.querySelector('.preview-name')||row.querySelector('b'))?.textContent?.trim();
      if(!name)return;
      row.dataset.bbbTopFiveLinked='1';
      row.classList.add('bbb-top-five-link');
      row.setAttribute('role','link');
      row.setAttribute('tabindex','0');
      row.setAttribute('aria-label',`Open ${name} player profile`);
      const open=()=>{
        if(typeof profileGo==='function')profileGo(name);
        else if(typeof goProfile==='function')goProfile(name);
        else location.href=`/player/${encodeURIComponent(slug(name))}`;
      };
      row.addEventListener('click',open);
      row.addEventListener('keydown',e=>{
        if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}
      });
    });
    return true;
  }

  function observe(){
    const list=root();
    if(!list)return;
    enhance();
    if(list.dataset.bbbTopFiveObserved==='1')return;
    list.dataset.bbbTopFiveObserved='1';
    new MutationObserver(enhance).observe(list,{childList:true,subtree:true});
  }

  function init(){
    injectStyles();
    observe();
    [100,250,500,900,1600,2600].forEach(ms=>setTimeout(observe,ms));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
