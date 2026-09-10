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

  function apply(){
    const system=document.querySelector('#profileView .bbb-profile-tabs-v2');
    if(!system)return;

    const historyTab=system.querySelector('[data-bbb-tab="notes"]');
    if(historyTab)historyTab.textContent='Rank History';

    const career=system.querySelector('[data-bbb-panel="career"]');
    if(!career)return;

    career.querySelectorAll('.bbb-career-block>span').forEach(label=>{
      if(String(label.textContent||'').trim().toLowerCase()==='production timeline')label.textContent='Career Path';
    });

    const draftHigh=[...career.querySelectorAll('.bbb-career-high')].find(row=>{
      const label=row.querySelector('span');
      return /draft\s*\/\s*college/i.test(String(label?.textContent||''));
    });
    if(draftHigh){
      const label=draftHigh.querySelector('span');
      const strong=draftHigh.querySelector('strong');
      const small=draftHigh.querySelector('small');
      if(label)label.textContent='Draft Profile';
      const line=draftLine();
      if(strong&&line)strong.textContent=line;
      if(small)small.remove();
    }
  }

  const observer=new MutationObserver(apply);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  [0,100,300,700,1400,2400].forEach(ms=>setTimeout(apply,ms));
})();
