// Preview-only polish for Bobby's Big Board player fantasy stats.
// Fixes duplicate Compare CTA behavior, clarifies season production, and
// makes the game-log jump scroll in-place without touching the site router.

(function(){
  function esc(v){
    if(typeof bbbEsc==='function')return bbbEsc(v);
    return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function patchCompareButton(){
    if(typeof bbbCompareAddProfileButton!=='function'||bbbCompareAddProfileButton.__bbbSnapshotAware)return;
    const original=bbbCompareAddProfileButton;
    const wrapped=function(){
      const hero=document.querySelector('#profileMount .profile-hero .shell');
      const snapshot=hero?.querySelector('.bbb-profile-atglance');
      if(snapshot){
        hero.querySelectorAll('.bbb-profile-compare-action').forEach(el=>el.remove());
        return;
      }
      return original();
    };
    wrapped.__bbbSnapshotAware=true;
    bbbCompareAddProfileButton=wrapped;
  }

  function parseProduction(text){
    const raw=String(text||'').trim();
    const labels=['PASS YDS','PASS TD','RUSH YDS','RUSH TD','REC YDS','REC TD','CMP/ATT','CAR','TGT','REC','INT'];
    const label=labels.find(x=>raw.endsWith(' '+x));
    if(!label)return null;
    return {label,value:raw.slice(0,-label.length).trim()};
  }

  function polishProduction(){
    document.querySelectorAll('#profileView .bbb-fantasy-statline').forEach(line=>{
      line.classList.add('bbb-preview-production-grid');
      [...line.children].forEach(item=>{
        if(item.dataset.bbbProductionPolished==='1')return;
        const parsed=parseProduction(item.textContent);
        if(!parsed)return;
        item.dataset.bbbProductionPolished='1';
        item.innerHTML=`<small>${esc(parsed.label)}</small><strong>${esc(parsed.value)}</strong>`;
      });
    });
  }

  function polishGameLogJump(){
    document.querySelectorAll('#profileView .bbb-fantasy-jump').forEach(jump=>{
      let button=jump;
      if(jump.tagName==='A'){
        button=document.createElement('button');
        button.type='button';
        button.className=jump.className;
        button.textContent=jump.textContent;
        jump.replaceWith(button);
      }
      if(button.dataset.bbbGameJumpBound==='1')return;
      button.dataset.bbbGameJumpBound='1';
      button.classList.add('bbb-preview-game-jump');
      button.addEventListener('click',e=>{
        e.preventDefault();
        e.stopPropagation();
        document.querySelector('#bbbGameLog')?.scrollIntoView({behavior:'smooth',block:'start'});
      });
    });
  }

  function removeOldCompare(){
    const hero=document.querySelector('#profileMount .profile-hero .shell');
    if(!hero?.querySelector('.bbb-profile-atglance'))return;
    hero.querySelectorAll('.bbb-profile-compare-action').forEach(el=>el.remove());
  }

  function apply(){
    patchCompareButton();
    removeOldCompare();
    polishProduction();
    polishGameLogJump();
  }

  function injectStyles(){
    if(document.querySelector('#bbb-profile-fantasy-preview-fix-styles'))return;
    const s=document.createElement('style');
    s.id='bbb-profile-fantasy-preview-fix-styles';
    s.textContent=`
      #profileView .bbb-fantasy-statline.bbb-preview-production-grid{
        display:grid;
        grid-template-columns:repeat(6,minmax(0,1fr));
        gap:7px;
        margin-top:12px;
        padding-top:11px;
      }
      #profileView .bbb-fantasy-statline.bbb-preview-production-grid>span{
        display:block;
        min-width:0;
        margin:0;
        padding:9px 10px;
        border:1px solid #19382b;
        border-radius:9px;
        background:#08120e;
        white-space:normal;
      }
      #profileView .bbb-fantasy-statline.bbb-preview-production-grid>span small{
        display:block;
        color:#657b6f;
        font-size:7px;
        font-weight:950;
        letter-spacing:.07em;
        text-transform:uppercase;
        line-height:1.2;
      }
      #profileView .bbb-fantasy-statline.bbb-preview-production-grid>span strong{
        display:block;
        margin-top:4px;
        color:#eef5f1;
        font-size:15px;
        line-height:1.1;
        font-weight:950;
      }
      #profileView .bbb-fantasy-jump.bbb-preview-game-jump{
        appearance:none;
        border:0;
        background:transparent;
        padding:0;
        cursor:pointer;
        font-family:inherit;
      }
      #profileView .bbb-fantasy-gamelog-card{scroll-margin-top:96px}
      @media(max-width:900px){
        #profileView .bbb-fantasy-statline.bbb-preview-production-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
      }
      @media(max-width:520px){
        #profileView .bbb-fantasy-statline.bbb-preview-production-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
      }
    `;
    document.head.appendChild(s);
  }

  injectStyles();
  patchCompareButton();

  if(typeof profileRender==='function'){
    const base=profileRender;
    profileRender=async function(slug){
      const result=await base(slug);
      apply();
      queueMicrotask(apply);
      requestAnimationFrame(apply);
      setTimeout(apply,80);
      return result;
    };
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
})();
