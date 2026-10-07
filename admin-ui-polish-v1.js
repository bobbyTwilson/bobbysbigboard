/* BBB Admin UI Polish v1 */
(function(){
  const SVG={
    dashboard:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    moves:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4v16M8 4 5 7M8 4l3 3M16 20V4m0 16-3-3m3 3 3-3"/></svg>',
    scanner:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V11m5 8V5m5 14v-6m5 6V8"/></svg>',
    injuries:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    content:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7z"/></svg>',
    automations:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>',
    rankings:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 6h11M10 12h11M10 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>',
    players:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    prospects:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.4 6 .9-4.4 4.2 1.1 6-5.4-2.8-5.4 2.8 1.1-6-4.4-4.2 6-.9z"/></svg>',
    research:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>',
    eligibility:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 6v5c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></svg>',
    review:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M8 10h8M8 14h5"/></svg>'
  };

  function installNavIcons(){
    document.querySelectorAll('.nav-btn[data-page]').forEach(btn=>{
      if(btn.querySelector('.nav-label'))return;
      const textNode=[...btn.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.nodeValue.trim());
      if(!textNode)return;
      const label=textNode.nodeValue.trim();
      const wrap=document.createElement('span');
      wrap.className='nav-label';
      wrap.innerHTML=SVG[btn.dataset.page]||SVG.dashboard;
      wrap.append(document.createTextNode(label));
      btn.insertBefore(wrap,textNode);
      textNode.remove();
    });
  }

  function cleanLiteralNewlineArtifacts(){
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    const remove=[];
    while(walker.nextNode()){
      const n=walker.currentNode;
      const v=n.nodeValue||'';
      if(/^\s*(?:\\n)+\s*$/.test(v))remove.push(n);
      else if(n.parentNode===document.body&&v.includes('\\n'))n.nodeValue=v.replace(/\\n/g,'');
    }
    remove.forEach(n=>n.remove());
  }

  function compactDashboard(){
    const brief=document.querySelector('#pageDashboard .command-brief');
    if(!brief||document.getElementById('briefUiToggle'))return;
    brief.classList.add('ui-collapsed');
    const actions=brief.querySelector('.brief-head-actions');
    if(!actions)return;
    const btn=document.createElement('button');
    btn.id='briefUiToggle';
    btn.type='button';
    btn.className='small-btn';
    btn.textContent='SHOW BRIEF';
    btn.addEventListener('click',()=>{
      const collapsed=brief.classList.toggle('ui-collapsed');
      btn.textContent=collapsed?'SHOW BRIEF':'HIDE BRIEF';
    });
    actions.prepend(btn);
  }

  function init(){
    cleanLiteralNewlineArtifacts();
    installNavIcons();
    compactDashboard();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();

  window.BBBAdminUIPolish={init};
})();