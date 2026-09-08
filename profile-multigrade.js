// Multi-position prospect grade support for Bobby's Big Board.
// Keeps normal single-position profiles unchanged while allowing hybrid players
// such as Savion Williams to show separate WR and RB evaluations on one page.
(function(){
  if(typeof profileRender!=='function')return;

  function mgNorm(v){return typeof profileNorm==='function'?profileNorm(v):String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'')}
  function mgNum(v){const n=Number(v);return Number.isFinite(n)?n:null}
  function mgGrade(v){const n=mgNum(v);return n==null?'—':(Number.isInteger(n)?String(n):n.toFixed(1))}
  function mgTraitName(raw){return typeof profileCleanTrait==='function'?profileCleanTrait(raw):String(raw||'').replace(/\s*\([^)]*\)\s*$/,'').trim()}
  function mgTraitMax(pos,name,raw){
    if(typeof profileTraitMax==='function')return profileTraitMax(pos,name,raw);
    return /speed|acceleration|analytics/i.test(name)?10:5;
  }
  function mgTraits(grade){
    return Object.entries(grade?.traits||{}).map(([raw,val])=>{
      const name=mgTraitName(raw),value=mgNum(val),max=mgTraitMax(grade?.pos,name,raw);
      return {name,value,max,pct:value==null||!max?0:Math.max(0,Math.min(100,(value/max)*100))};
    }).filter(x=>x.value!=null);
  }
  function mgTopTraits(grade){
    return mgTraits(grade)
      .filter(t=>!/analytics|projected draft capital/i.test(t.name))
      .sort((a,b)=>b.pct-a.pct||b.value-a.value)
      .slice(0,5);
  }
  function mgPanel(grade){
    const top=mgTopTraits(grade);
    const all=mgTraits(grade);
    const topRows=top.map(t=>`<div class="bbb-mg-trait"><div><span>${bbbEsc(t.name)}</span><strong>${bbbEsc(mgGrade(t.value))} / ${bbbEsc(t.max)}</strong></div><div class="bbb-mg-track"><i style="width:${t.pct.toFixed(1)}%"></i></div></div>`).join('');
    const allRows=all.map(t=>`<div class="bbb-mg-full-row"><span>${bbbEsc(t.name)}</span><strong>${bbbEsc(mgGrade(t.value))} / ${bbbEsc(t.max)}</strong></div>`).join('');
    return `<article class="bbb-mg-panel">
      <div class="bbb-mg-panel-head"><div><span class="bbb-mg-pos">${bbbEsc(grade.pos||'—')}</span><small>${bbbEsc(grade.year||'—')} DRAFT CLASS</small></div><strong class="bbb-mg-grade">${bbbEsc(mgGrade(grade.grade))}</strong></div>
      <div class="bbb-mg-comp"><span>PRO COMP</span><strong>${bbbEsc(grade.comp||'—')}</strong></div>
      <div class="bbb-mg-top"><span>TOP TRAITS</span>${topRows}</div>
      <details class="bbb-mg-details"><summary>View complete ${bbbEsc(grade.pos||'')} grade <span>+</span></summary><div>${allRows}</div></details>
    </article>`;
  }
  function mgFindGrades(slug){
    const found=typeof profileFind==='function'?profileFind(slug):null;
    if(!found||typeof prospects==='undefined')return [];
    const norm=mgNorm(found.name);
    return prospects.filter(p=>mgNorm(p.name)===norm).sort((a,b)=>{
      const order={WR:0,RB:1,QB:2,TE:3};
      return (order[a.pos]??9)-(order[b.pos]??9)||(mgNum(b.grade)||0)-(mgNum(a.grade)||0);
    });
  }
  function mgEnhance(slug){
    const grades=mgFindGrades(slug);
    if(grades.length<2)return;
    const mount=document.querySelector('#profileMount');
    const grid=mount?.querySelector('.profile-grid');
    if(!grid)return;

    grid.querySelector('.bbb-multigrade-card')?.remove();
    const existing=[...grid.querySelectorAll('.profile-card')].find(card=>{
      const kicker=String(card.querySelector('.profile-card-kicker')?.textContent||'').trim();
      return /film grade profile|prospect profile/i.test(kicker);
    });
    existing?.remove();

    const playerName=grades[0]?.name||'This player';
    const card=document.createElement('section');
    card.className='profile-card full bbb-multigrade-card';
    card.innerHTML=`<div class="profile-card-kicker">PROSPECT GRADES</div>
      <div class="bbb-mg-head"><div><h2>Multi-position evaluation.</h2><p>${bbbEsc(playerName)} was graded separately at each position. The dynasty board still uses his current NFL position, while the scouting profile preserves both evaluations.</p></div><span>${grades.map(g=>`${bbbEsc(g.pos)} ${bbbEsc(mgGrade(g.grade))}`).join(' / ')}</span></div>
      <div class="bbb-mg-grid">${grades.map(mgPanel).join('')}</div>`;
    grid.appendChild(card);
  }

  if(!document.querySelector('#bbb-multigrade-styles')){
    const style=document.createElement('style');
    style.id='bbb-multigrade-styles';
    style.textContent=`
      .bbb-multigrade-card{overflow:hidden}
      .bbb-mg-head{display:flex;justify-content:space-between;align-items:flex-start;gap:22px;margin-bottom:18px}
      .bbb-mg-head h2{margin:7px 0 5px}.bbb-mg-head p{margin:0;color:#7d9086;font-size:11px;line-height:1.6;max-width:690px}
      .bbb-mg-head>span{flex:none;border:1px solid #286849;background:#09251a;color:#72dda5;border-radius:999px;padding:8px 11px;font-size:9px;font-weight:950;letter-spacing:.04em}
      .bbb-mg-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .bbb-mg-panel{border:1px solid #1b392d;background:linear-gradient(160deg,#09140f,#07100c);border-radius:14px;padding:16px;min-width:0}
      .bbb-mg-panel-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;padding-bottom:13px;border-bottom:1px solid #173027}
      .bbb-mg-panel-head>div{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.bbb-mg-pos{display:inline-flex;border:1px solid #2f6d4e;background:#0a2b1d;color:#79e1a8;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:950}.bbb-mg-panel-head small{color:#6f8378;font-size:8px;font-weight:900;letter-spacing:.07em}.bbb-mg-grade{color:#72dfa5;font-size:28px;line-height:1}
      .bbb-mg-comp{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:12px 0;border-bottom:1px solid #173027}.bbb-mg-comp span,.bbb-mg-top>span{color:#6c8075;font-size:8px;font-weight:950;letter-spacing:.08em}.bbb-mg-comp strong{color:#dbe4df;font-size:11px;text-align:right}
      .bbb-mg-top{padding-top:12px}.bbb-mg-top>span{display:block;margin-bottom:10px}.bbb-mg-trait{margin-top:9px}.bbb-mg-trait>div:first-child{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:5px}.bbb-mg-trait span{color:#cfd9d3;font-size:9px;font-weight:850}.bbb-mg-trait strong{color:#9bacA3;font-size:8px}.bbb-mg-track{height:5px;border-radius:999px;background:#14261e;overflow:hidden}.bbb-mg-track i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#279a60,#65dda0)}
      .bbb-mg-details{margin-top:14px;border:1px solid #183126;border-radius:10px;background:#07100c;overflow:hidden}.bbb-mg-details summary{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:10px 11px;cursor:pointer;list-style:none;color:#8fd9af;font-size:8px;font-weight:950;text-transform:uppercase;letter-spacing:.05em}.bbb-mg-details summary::-webkit-details-marker{display:none}.bbb-mg-details summary span{font-size:15px}.bbb-mg-details[open] summary span{transform:rotate(45deg)}.bbb-mg-details>div{padding:3px 11px 10px;border-top:1px solid #173027}.bbb-mg-full-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #12261d}.bbb-mg-full-row:last-child{border-bottom:0}.bbb-mg-full-row span{color:#aebbb4;font-size:9px}.bbb-mg-full-row strong{color:#7f9488;font-size:8px}
      @media(max-width:760px){.bbb-mg-grid{grid-template-columns:1fr}.bbb-mg-head{display:block}.bbb-mg-head>span{display:inline-flex;margin-top:11px}}
      @media(max-width:520px){.bbb-mg-panel{padding:13px}.bbb-mg-grade{font-size:24px}.bbb-mg-comp{align-items:flex-start}}
    `;
    document.head.appendChild(style);
  }

  const baseProfileRender=profileRender;
  profileRender=async function(slug){
    const result=await baseProfileRender(slug);
    mgEnhance(slug);
    queueMicrotask(()=>mgEnhance(slug));
    setTimeout(()=>mgEnhance(slug),120);
    return result;
  };
})();
