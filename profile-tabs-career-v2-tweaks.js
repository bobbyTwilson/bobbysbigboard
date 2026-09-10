// Bobby's Big Board — Profile Tabs + Career V2 requested polish.
// Preview-only micro-layer: clearer rank-history naming and career resume labels.
(function(){
  const EXACT_DRAFT={
    'drew-lock':{year:2019,round:2,pick:42,college:'Missouri'}
  };

  function currentKey(){
    const m=location.pathname.match(/^\/player\/([^/?#]+)/);
    return m?decodeURIComponent(m[1]):'';
  }
  function currentPlayer(){
    const key=currentKey();
    if(typeof bbbSnapshotCurrentPlayer==='function'){
      const p=bbbSnapshotCurrentPlayer(key);if(p)return p;
    }
    if(typeof profileFind==='function')return profileFind(key);
    return null;
  }
  function draftLine(){
    const key=currentKey();
    const exact=EXACT_DRAFT[key];
    if(exact)return `${exact.year} · Round ${exact.round} · Pick ${exact.pick} · ${exact.college}`;
    const p=currentPlayer();
    if(!p)return '';
    const year=p.draft??p.draft_year;
    const round=p.draftRound??p.draft_round;
    const pick=p.draftPick??p.draft_pick??p.overall_pick;
    const college=p.college;
    const bits=[];
    if(year)bits.push(String(year));
    if(round)bits.push(`Round ${round}`);
    if(pick)bits.push(`Pick ${pick}`);
    if(college)bits.push(String(college));
    return bits.join(' · ');
  }

  function setText(el,value){
    if(el&&value&&String(el.textContent||'').trim()!==value)el.textContent=value;
  }

  function apply(){
    const system=document.querySelector('#profileView .bbb-profile-tabs-v2');
    if(!system)return false;

    const historyTab=system.querySelector('[data-bbb-tab="notes"]');
    setText(historyTab,'Rank History');

    const career=system.querySelector('[data-bbb-panel="career"]');
    if(!career)return true;

    career.querySelectorAll('.bbb-career-block>span').forEach(label=>{
      if(String(label.textContent||'').trim().toLowerCase()==='production timeline')setText(label,'Career Path');
    });

    const draftHigh=[...career.querySelectorAll('.bbb-career-high')].find(row=>{
      const label=row.querySelector('span');
      return /draft\s*\/\s*college|draft profile/i.test(String(label?.textContent||''));
    });
    if(draftHigh){
      const label=draftHigh.querySelector('span');
      const strong=draftHigh.querySelector('strong');
      const small=draftHigh.querySelector('small');
      setText(label,'Draft Profile');
      const line=draftLine();
      setText(strong,line);
      if(small)small.remove();
    }
    return true;
  }

  // Observe only until the tab system exists, then disconnect. Scheduled passes cover
  // the profile's async render without creating a permanent mutation feedback loop.
  const observer=new MutationObserver(()=>{
    if(apply())observer.disconnect();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  [0,100,300,700,1400,2400].forEach(ms=>setTimeout(apply,ms));
})();
