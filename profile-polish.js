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
