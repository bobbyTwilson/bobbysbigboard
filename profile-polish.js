// Final profile composition guard for Bobby's Big Board.
// Loaded after the profile feature stack so late async/profile wrappers cannot
// reintroduce duplicate actions or suppress the evergreen player overview.

(function(){
  function bbbFinalNum(v){const n=Number(v);return Number.isFinite(n)?n:null}
  function bbbFinalStamp(v,fallback=0){const n=Date.parse(v||'');return Number.isFinite(n)?n:fallback}

  function bbbFinalRankingEvents(rows){
    const byDay=new Map();
    (rows||[]).forEach(row=>{
      const rank=bbbFinalNum(row.overall_rank),date=String(row.snapshot_date||'');
      if(rank==null||!date)return;
      const stamp=bbbFinalStamp(row.created_at,bbbFinalStamp(date+'T23:59:59Z'));
      const existing=byDay.get(date);
      if(!existing||stamp>=existing._stamp)byDay.set(date,{...row,_stamp:stamp,_rank:rank});
    });
    const days=[...byDay.values()].sort((a,b)=>a._stamp-b._stamp||String(a.snapshot_date).localeCompare(String(b.snapshot_date)));
    const events=[];let previous=null;
    days.forEach(row=>{
      const rank=row._rank;
      if(previous!=null&&rank!==previous){
        const move=previous-rank,amount=Math.abs(move);
        events.push({
          id:`ranking-${row.snapshot_date}-${previous}-${rank}`,
          update_date:row.snapshot_date,
          update_type:'Ranking',
          update_text:`BBB moved ${move>0?'up':'down'} ${amount} spot${amount===1?'':'s'}, from #${previous} to #${rank}.`,
          injury_status:null,
          rank_impact:`#${previous} → #${rank}`,
          _timeline_kind:'ranking',
          _from_rank:previous,
          _to_rank:rank,
          _move:move,
          _sort:row._stamp
        });
      }
      previous=rank;
    });
    return events;
  }

  function bbbFinalMergeTimeline(updates,history){
    const news=(updates||[]).filter(u=>u?._timeline_kind!=='ranking').map(u=>({
      ...u,
      _timeline_kind:'news',
      _sort:bbbFinalStamp(String(u.update_date||'')+'T12:00:00Z')+(bbbFinalNum(u.id)||0)/1000
    }));
    return [...news,...bbbFinalRankingEvents(history)]
      .sort((a,b)=>b._sort-a._sort||String(b.update_date||'').localeCompare(String(a.update_date||'')));
  }

  // profile-college.js installs the fast bundle loader after Player Timeline V2.
  // Wrap that final loader so the timeline keeps its BBB ranking events without
  // adding another network request (ranking history is served from the same bundle).
  if(typeof bbbV2Load==='function'&&typeof bbbLoadRankingHistory==='function'){
    const baseV2Load=bbbV2Load;
    bbbV2Load=async function(playerKey){
      const [data,history]=await Promise.all([
        baseV2Load(playerKey),
        bbbLoadRankingHistory(playerKey).catch(()=>[])
      ]);
      return {...(data||{}),updates:bbbFinalMergeTimeline(data?.updates||[],history||[]),rankingHistory:history||[]};
    };
  }

  function bbbFinalCurrentPlayer(slug){
    if(typeof bbbSnapshotCurrentPlayer==='function')return bbbSnapshotCurrentPlayer(slug);
    const found=typeof profileFind==='function'?profileFind(slug):null;
    if(!found)return null;
    return (typeof players!=='undefined'?players:[]).find(p=>String(p.playerKey||p.player_key||'')===String(found.playerKey||found.player_key||''))
      ||(typeof players!=='undefined'?players:[]).find(p=>typeof profileNorm==='function'&&profileNorm(p.name)===profileNorm(found.name))
      ||null;
  }

  function bbbFinalRemoveDuplicateCompare(mount){
    [...mount.querySelectorAll('a,button')].forEach(el=>{
      if(el.closest('.bbb-profile-atglance'))return;
      const text=String(el.textContent||'').trim().toUpperCase();
      const href=String(el.getAttribute?.('href')||'');
      if((text.includes('COMPARE')&&text.includes('PLAYER'))||/#compare\?left=/.test(href))el.remove();
    });
  }

  function bbbFinalEnsureOverview(mount,player){
    const overview=String(player?.overview||'').trim();
    if(!overview)return;
    const grid=mount.querySelector('.profile-grid');
    if(!grid)return;
    let card=grid.querySelector('.bbb-overview-card');
    if(!card){
      card=document.createElement('section');
      card.className='profile-card full bbb-overview-card';
    }
    card.innerHTML=`<div class="profile-card-kicker">PLAYER OVERVIEW</div><h2>Scouting overview.</h2><div class="profile-note bbb-profile-summary"><div class="bbb-profile-copy">${bbbEsc(overview)}</div></div>`;
    if(grid.firstElementChild!==card)grid.insertBefore(card,grid.firstElementChild);
  }

  function bbbFinalProfileFix(slug){
    const mount=document.querySelector('#profileMount');
    if(!mount)return;
    const player=bbbFinalCurrentPlayer(slug);
    bbbFinalRemoveDuplicateCompare(mount);
    bbbFinalEnsureOverview(mount,player);
  }

  if(typeof profileRender==='function'){
    const baseProfileRender=profileRender;
    profileRender=async function(slug){
      const result=await baseProfileRender(slug);
      bbbFinalProfileFix(slug);
      queueMicrotask(()=>bbbFinalProfileFix(slug));
      requestAnimationFrame(()=>bbbFinalProfileFix(slug));
      setTimeout(()=>bbbFinalProfileFix(slug),120);
      setTimeout(()=>bbbFinalProfileFix(slug),500);
      return result;
    };
  }
})();

// Preserve separate scouting evaluations when one player was graded at
// multiple positions. Single-position profiles are left exactly as they are.
(function(){
  if(typeof profileRender!=='function')return;

  function bbbMultiNorm(v){return typeof profileNorm==='function'?profileNorm(v):String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'')}
  function bbbMultiNum(v){const n=Number(v);return Number.isFinite(n)?n:null}
  function bbbMultiGrade(v){const n=bbbMultiNum(v);return n==null?'—':(Number.isInteger(n)?String(n):n.toFixed(1))}
  function bbbMultiTraitName(raw){return typeof profileCleanTrait==='function'?profileCleanTrait(raw):String(raw||'').replace(/\s*\([^)]*\)\s*$/,'').trim()}
  function bbbMultiTraitMax(pos,name,raw){
    if(typeof profileTraitMax==='function')return profileTraitMax(pos,name,raw);
    return /speed|acceleration|analytics/i.test(name)?10:5;
  }
  function bbbMultiTraits(grade){
    return Object.entries(grade?.traits||{}).map(([raw,val])=>{
      const name=bbbMultiTraitName(raw),value=bbbMultiNum(val),max=bbbMultiTraitMax(grade?.pos,name,raw);
      return {name,value,max,pct:value==null||!max?0:Math.max(0,Math.min(100,(value/max)*100))};
    }).filter(x=>x.value!=null);
  }
  function bbbMultiTopTraits(grade){
    return bbbMultiTraits(grade)
      .filter(t=>!/analytics|projected draft capital/i.test(t.name))
      .sort((a,b)=>b.pct-a.pct||b.value-a.value)
      .slice(0,5);
  }
  function bbbMultiPanel(grade){
    const top=bbbMultiTopTraits(grade);
    const all=bbbMultiTraits(grade);
    const topRows=top.map(t=>`<div class="bbb-multi-trait"><div><span>${bbbEsc(t.name)}</span><strong>${bbbEsc(bbbMultiGrade(t.value))} / ${bbbEsc(t.max)}</strong></div><div class="bbb-multi-track"><i style="width:${t.pct.toFixed(1)}%"></i></div></div>`).join('');
    const allRows=all.map(t=>`<div class="bbb-multi-full-row"><span>${bbbEsc(t.name)}</span><strong>${bbbEsc(bbbMultiGrade(t.value))} / ${bbbEsc(t.max)}</strong></div>`).join('');
    return `<article class="bbb-multi-panel">
      <div class="bbb-multi-panel-head"><div><span class="bbb-multi-pos">${bbbEsc(grade.pos||'—')}</span><small>${bbbEsc(grade.year||'—')} DRAFT CLASS</small></div><strong class="bbb-multi-grade">${bbbEsc(bbbMultiGrade(grade.grade))}</strong></div>
      <div class="bbb-multi-comp"><span>PRO COMP</span><strong>${bbbEsc(grade.comp||'—')}</strong></div>
      <div class="bbb-multi-top"><span>TOP TRAITS</span>${topRows}</div>
      <details class="bbb-multi-details"><summary>View complete ${bbbEsc(grade.pos||'')} grade <span>+</span></summary><div>${allRows}</div></details>
    </article>`;
  }
  function bbbMultiFindGrades(slug){
    const found=typeof profileFind==='function'?profileFind(slug):null;
    if(!found||typeof prospects==='undefined')return [];
    const norm=bbbMultiNorm(found.name);
    const order={WR:0,RB:1,QB:2,TE:3};
    return prospects.filter(p=>bbbMultiNorm(p.name)===norm).sort((a,b)=>(order[a.pos]??9)-(order[b.pos]??9)||(bbbMultiNum(b.grade)||0)-(bbbMultiNum(a.grade)||0));
  }
  function bbbMultiEnhance(slug){
    const grades=bbbMultiFindGrades(slug);
    if(grades.length<2)return;
    const mount=document.querySelector('#profileMount');
    const grid=mount?.querySelector('.profile-grid');
    if(!grid)return;

    grid.querySelector('.bbb-multigrade-card')?.remove();
    const singleGradeCard=[...grid.querySelectorAll('.profile-card')].find(card=>{
      const kicker=String(card.querySelector('.profile-card-kicker')?.textContent||'').trim();
      return /film grade profile|prospect profile/i.test(kicker);
    });
    singleGradeCard?.remove();

    const playerName=grades[0]?.name||'This player';
    const card=document.createElement('section');
    card.className='profile-card full bbb-multigrade-card';
    card.innerHTML=`<div class="profile-card-kicker">PROSPECT GRADES</div>
      <div class="bbb-multi-head"><div><h2>Multi-position evaluation.</h2><p>${bbbEsc(playerName)} was graded separately at each position. The dynasty board still uses his current NFL position, while the scouting profile preserves both evaluations.</p></div><span>${grades.map(g=>`${bbbEsc(g.pos)} ${bbbEsc(bbbMultiGrade(g.grade))}`).join(' / ')}</span></div>
      <div class="bbb-multi-grid">${grades.map(bbbMultiPanel).join('')}</div>`;
    grid.appendChild(card);
  }

  if(!document.querySelector('#bbb-multigrade-styles')){
    const style=document.createElement('style');
    style.id='bbb-multigrade-styles';
    style.textContent=`
      .bbb-multigrade-card{overflow:hidden}
      .bbb-multi-head{display:flex;justify-content:space-between;align-items:flex-start;gap:22px;margin-bottom:18px}
      .bbb-multi-head h2{margin:7px 0 5px}.bbb-multi-head p{margin:0;color:#7d9086;font-size:11px;line-height:1.6;max-width:690px}
      .bbb-multi-head>span{flex:none;border:1px solid #286849;background:#09251a;color:#72dda5;border-radius:999px;padding:8px 11px;font-size:9px;font-weight:950;letter-spacing:.04em}
      .bbb-multi-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .bbb-multi-panel{border:1px solid #1b392d;background:linear-gradient(160deg,#09140f,#07100c);border-radius:14px;padding:16px;min-width:0}
      .bbb-multi-panel-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;padding-bottom:13px;border-bottom:1px solid #173027}
      .bbb-multi-panel-head>div{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.bbb-multi-pos{display:inline-flex;border:1px solid #2f6d4e;background:#0a2b1d;color:#79e1a8;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:950}.bbb-multi-panel-head small{color:#6f8378;font-size:8px;font-weight:900;letter-spacing:.07em}.bbb-multi-grade{color:#72dfa5;font-size:28px;line-height:1}
      .bbb-multi-comp{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:12px 0;border-bottom:1px solid #173027}.bbb-multi-comp span,.bbb-multi-top>span{color:#6c8075;font-size:8px;font-weight:950;letter-spacing:.08em}.bbb-multi-comp strong{color:#dbe4df;font-size:11px;text-align:right}
      .bbb-multi-top{padding-top:12px}.bbb-multi-top>span{display:block;margin-bottom:10px}.bbb-multi-trait{margin-top:9px}.bbb-multi-trait>div:first-child{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:5px}.bbb-multi-trait span{color:#cfd9d3;font-size:9px;font-weight:850}.bbb-multi-trait strong{color:#9baca3;font-size:8px}.bbb-multi-track{height:5px;border-radius:999px;background:#14261e;overflow:hidden}.bbb-multi-track i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#279a60,#65dda0)}
      .bbb-multi-details{margin-top:14px;border:1px solid #183126;border-radius:10px;background:#07100c;overflow:hidden}.bbb-multi-details summary{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:10px 11px;cursor:pointer;list-style:none;color:#8fd9af;font-size:8px;font-weight:950;text-transform:uppercase;letter-spacing:.05em}.bbb-multi-details summary::-webkit-details-marker{display:none}.bbb-multi-details summary span{font-size:15px}.bbb-multi-details[open] summary span{transform:rotate(45deg)}.bbb-multi-details>div{padding:3px 11px 10px;border-top:1px solid #173027}.bbb-multi-full-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #12261d}.bbb-multi-full-row:last-child{border-bottom:0}.bbb-multi-full-row span{color:#aebbb4;font-size:9px}.bbb-multi-full-row strong{color:#7f9488;font-size:8px}
      @media(max-width:760px){.bbb-multi-grid{grid-template-columns:1fr}.bbb-multi-head{display:block}.bbb-multi-head>span{display:inline-flex;margin-top:11px}}
      @media(max-width:520px){.bbb-multi-panel{padding:13px}.bbb-multi-grade{font-size:24px}.bbb-multi-comp{align-items:flex-start}}
    `;
    document.head.appendChild(style);
  }

  const baseProfileRender=profileRender;
  profileRender=async function(slug){
    const result=await baseProfileRender(slug);
    bbbMultiEnhance(slug);
    queueMicrotask(()=>bbbMultiEnhance(slug));
    setTimeout(()=>bbbMultiEnhance(slug),120);
    return result;
  };
})();
