// Bobby's Big Board homepage structure polish.
// Keeps the main product — the dynasty Top 500 — ahead of secondary feeds.

(function(){
  function bbbHomeInjectStyles(){
    if(document.querySelector('#bbb-home-structure-styles'))return;
    const s=document.createElement('style');
    s.id='bbb-home-structure-styles';
    s.textContent=`
      #rankingsView #rankings{padding-top:58px}
      #rankingsView #bbbUpdatesHome{border-top:1px solid #13271f}
      #rankingsView .bbb-updates-home-actions{gap:8px;flex-wrap:wrap}
      .bbb-home-opportunity-link{background:#0b1712!important;border-color:#2e503f!important}
      .bbb-home-opportunity-link:hover{border-color:#47ca83!important}
      @media(max-width:640px){
        #rankingsView #rankings{padding-top:46px}
        #rankingsView .bbb-updates-home-actions{justify-content:stretch}
        #rankingsView .bbb-updates-home-actions .btn{flex:1;min-width:145px}
      }
    `;
    document.head.appendChild(s);
  }

  function bbbHomeAddOpportunityShortcut(){
    const actions=document.querySelector('#bbbUpdatesHome .bbb-updates-home-actions');
    if(!actions||actions.querySelector('.bbb-home-opportunity-link'))return;
    const a=document.createElement('a');
    a.className='btn btn-secondary bbb-home-opportunity-link';
    a.href='#opportunity';
    a.textContent='Opportunity Feed ↑↓';
    actions.insertBefore(a,actions.firstChild);
  }

  function bbbHomeReorder(){
    const view=document.querySelector('#rankingsView');
    const metrics=view?.querySelector(':scope > .metrics');
    if(!view||!metrics)return;
    const ordered=[
      view.querySelector(':scope > #rankings'),
      view.querySelector(':scope > #bbbUpdatesHome'),
      view.querySelector(':scope > #bbbMoversHome'),
      view.querySelector(':scope > #market'),
      view.querySelector(':scope > #about')
    ].filter(Boolean);
    let anchor=metrics;
    ordered.forEach(section=>{
      anchor.insertAdjacentElement('afterend',section);
      anchor=section;
    });
    bbbHomeAddOpportunityShortcut();
  }

  function bbbHomeInit(){
    bbbHomeInjectStyles();
    bbbHomeReorder();
    [100,350,800,1600].forEach(ms=>setTimeout(bbbHomeReorder,ms));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bbbHomeInit);else bbbHomeInit();
})();
