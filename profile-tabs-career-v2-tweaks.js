// Bobby's Big Board — Career data polish.
// Reads canonical draft metadata + NFL roster history directly from Supabase
// so Career profiles do not depend on one-off hardcoded player values.
(function(){
  const cache=new Map();
  const TEAM_LOGOS={
    ARI:'ari',ATL:'atl',BAL:'bal',BUF:'buf',CAR:'car',CHI:'chi',CIN:'cin',CLE:'cle',
    DAL:'dal',DEN:'den',DET:'det',GB:'gb',HOU:'hou',IND:'ind',JAC:'jax',JAX:'jax',
    KC:'kc',LV:'lv',OAK:'lv',LAC:'lac',SD:'lac',LAR:'lar',LA:'lar',STL:'lar',MIA:'mia',
    MIN:'min',NE:'ne',NO:'no',NYG:'nyg',NYJ:'nyj',PHI:'phi',PIT:'pit',SF:'sf',SEA:'sea',
    TB:'tb',TEN:'ten',WAS:'wsh',WSH:'wsh'
  };

  function esc(v){
    if(typeof bbbEsc==='function')return bbbEsc(v);
    return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function num(v){const x=Number(v);return Number.isFinite(x)?x:null}
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
  function setText(el,value){
    if(el&&value!=null&&String(el.textContent||'').trim()!==String(value))el.textContent=String(value);
  }
  function schoolName(meta,player){
    const raw=String(meta?.draft_college||meta?.college||player?.college||'').trim();
    return raw?raw.split(';')[0].trim():'';
  }
  function teamLogo(team){
    const id=TEAM_LOGOS[String(team||'').toUpperCase()];
    return id?`https://a.espncdn.com/i/teamlogos/nfl/500/${id}.png`:'';
  }

  function loadCanonical(key){
    if(!key||typeof bbbDb!=='function')return Promise.resolve({meta:null,history:[]});
    if(!cache.has(key)){
      const q=encodeURIComponent(key);
      cache.set(key,Promise.all([
        bbbDb('players',`select=player_key,name,position,team,draft_year,draft_round,draft_pick,draft_team,draft_college,college,rookie_season,last_nfl_season,metadata_source&player_key=eq.${q}&limit=1`).catch(()=>[]),
        bbbDb('player_team_history',`select=player_key,season,team,first_week,last_week,source&player_key=eq.${q}&order=season.asc,first_week.asc`).catch(()=>[])
      ]).then(([metaRows,history])=>({
        meta:Array.isArray(metaRows)?metaRows[0]||null:null,
        history:Array.isArray(history)?history:[]
      })).catch(err=>{cache.delete(key);throw err}));
    }
    return cache.get(key);
  }

  function draftInfo(meta,player,history){
    const year=num(meta?.draft_year)??num(player?.draft)??num(player?.draft_year);
    const round=num(meta?.draft_round)??num(player?.draftRound)??num(player?.draft_round);
    const pick=num(meta?.draft_pick)??num(player?.draftPick)??num(player?.draft_pick)??num(player?.overall_pick);
    const college=schoolName(meta,player);
    const source=String(meta?.metadata_source||'').toLowerCase();
    const verifiedUndrafted=!round&&!pick&&(source.includes('udfa')||source==='nflverse_players');
    const bits=[];
    if(year)bits.push(String(year));
    if(round)bits.push(`Round ${round}`);
    if(pick)bits.push(`Pick ${pick}`);
    if(year&&!round&&!pick)bits.push(verifiedUndrafted?'UDFA':'Draft details pending');
    if(college)bits.push(college);

    let detail='';
    if(round&&pick&&meta?.draft_team)detail=`Drafted by ${String(meta.draft_team).toUpperCase()}`;
    else if(verifiedUndrafted){
      const first=[...(history||[])].filter(r=>r.team&&num(r.season)!=null).sort((a,b)=>num(a.season)-num(b.season)||(num(a.first_week)??99)-(num(b.first_week)??99))[0];
      if(first?.team)detail=`Undrafted free agent · first NFL roster: ${String(first.team).toUpperCase()}`;
      else detail='Undrafted free agent';
    }
    return {line:bits.join(' · '),detail};
  }

  function careerSegments(history){
    const rows=[...(history||[])]
      .filter(r=>r.team&&num(r.season)!=null)
      .map(r=>({team:String(r.team).toUpperCase(),season:num(r.season),firstWeek:num(r.first_week),lastWeek:num(r.last_week)}))
      .sort((a,b)=>a.season-b.season||(a.firstWeek??99)-(b.firstWeek??99)||a.team.localeCompare(b.team));
    const out=[];
    rows.forEach(r=>{
      const last=out[out.length-1];
      if(last&&last.team===r.team&&r.season===last.end+1){
        last.end=r.season;
        last.lastWeek=r.lastWeek;
      }else{
        out.push({team:r.team,start:r.season,end:r.season,firstWeek:r.firstWeek,lastWeek:r.lastWeek});
      }
    });
    return out;
  }

  function careerPathHtml(history){
    const segments=careerSegments(history);
    if(!segments.length)return '<div class="bbb-career-high"><span>NFL Roster History</span><strong>No regular-season roster history yet</strong><small>Career path will populate automatically when verified NFL roster data is available.</small></div>';
    return segments.map(seg=>{
      const src=teamLogo(seg.team);
      const years=seg.start===seg.end?String(seg.start):`${seg.start}–${seg.end}`;
      return `<div class="bbb-career-stop">${src?`<img src="${esc(src)}" alt="${esc(seg.team)} logo" loading="lazy">`:`<span class="fallback">${esc(seg.team)}</span>`}<div><strong>${esc(seg.team)}</strong><small>${esc(years)}</small></div></div>`;
    }).join('');
  }

  function applyLabels(system){
    const historyTab=system?.querySelector('[data-bbb-tab="notes"]');
    setText(historyTab,'Rank History');
    const notesPanel=system?.querySelector('[data-bbb-panel="notes"]');
    notesPanel?.querySelectorAll('.profile-card-kicker').forEach(el=>{
      if(String(el.textContent||'').trim().toUpperCase()==='NOTES')setText(el,'RANK HISTORY');
    });
    const career=system?.querySelector('[data-bbb-panel="career"]');
    career?.querySelectorAll('.bbb-career-block>span').forEach(label=>{
      if(/production timeline|career path/i.test(String(label.textContent||'').trim()))setText(label,'Career Path');
    });
  }

  function applyCanonical(system,key,data){
    if(currentKey()!==key)return;
    applyLabels(system);
    const career=system.querySelector('[data-bbb-panel="career"]');
    if(!career)return;
    const player=currentPlayer();
    const info=draftInfo(data.meta,player,data.history);

    const draftHigh=[...career.querySelectorAll('.bbb-career-high')].find(row=>{
      const label=row.querySelector('span');
      return /draft\s*\/\s*college|draft profile/i.test(String(label?.textContent||''));
    });
    if(draftHigh){
      setText(draftHigh.querySelector('span'),'Draft Profile');
      if(info.line)setText(draftHigh.querySelector('strong'),info.line);
      let small=draftHigh.querySelector('small');
      if(info.detail){
        if(!small){small=document.createElement('small');draftHigh.appendChild(small);}
        setText(small,info.detail);
      }else if(small)small.remove();
    }

    const pathBlock=[...career.querySelectorAll('.bbb-career-block')].find(block=>{
      const label=block.querySelector(':scope > span');
      return /production timeline|career path/i.test(String(label?.textContent||''));
    });
    if(pathBlock){
      setText(pathBlock.querySelector(':scope > span'),'Career Path');
      const timeline=pathBlock.querySelector('.bbb-career-timeline');
      if(timeline){
        const html=careerPathHtml(data.history);
        if(timeline.innerHTML!==html)timeline.innerHTML=html;
      }
    }
    system.dataset.bbbCareerCanonicalKey=key;
  }

  function hydrate(){
    const key=currentKey();
    if(!key)return false;
    const system=document.querySelector('#profileView .bbb-profile-tabs-v2');
    if(!system)return false;
    applyLabels(system);
    loadCanonical(key).then(data=>applyCanonical(system,key,data)).catch(()=>{});
    return true;
  }
  function schedule(){[0,80,220,550,1100,1900].forEach(ms=>setTimeout(hydrate,ms));}

  if(typeof profileRender==='function'){
    const base=profileRender;
    profileRender=async function(slug){
      const result=await base(slug);
      schedule();
      return result;
    };
  }

  const observer=new MutationObserver(()=>{
    const system=document.querySelector('#profileView .bbb-profile-tabs-v2');
    if(system){applyLabels(system);observer.disconnect();schedule();}
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  schedule();
})();
