(function(){
  const SITE='https://bobbysbigboard.com';
  const DEFAULT={
    title:"Bobby's Big Board | Dynasty Fantasy Football Rankings",
    description:"Bobby's Big Board dynasty Superflex rankings, rookie rankings, prospect grades, player profiles, market movers, player comparison, and trade calculator.",
    path:'/'
  };
  const ROUTES={
    '#rankings':{title:"Dynasty Fantasy Football Rankings | Bobby's Big Board",description:"Bobby's live Top 500 dynasty Superflex rankings with market gaps, advanced filters, player profiles, and trade values.",path:'/rankings'},
    '#rookies':{title:"2026 Dynasty Rookie Rankings | Bobby's Big Board",description:"Bobby's live 2026 dynasty rookie rankings for Superflex leagues, with tiers, market context, and player profiles.",path:'/rookies'},
    '#prospects':{title:"Dynasty Prospect Grades | Bobby's Big Board",description:"Browse Bobby's film-based prospect grades, traits, draft classes, and pro comparisons for quarterbacks, running backs, wide receivers, and tight ends.",path:'/prospects'},
    '#stats':{title:"2026 Fantasy Football Stats | Bobby's Big Board",description:"Track 2026 PPR fantasy leaders, passing, rushing, receiving, weekly finishes, and season-long production alongside Bobby's dynasty rankings.",path:'/stats'},
    '#trade':{title:"Dynasty Trade Calculator | Bobby's Big Board",description:"Build dynasty trades with Bobby's live Superflex values, cornerstone premiums, package discounts, draft picks, and BBB-vs-market valuation.",path:'/trade'},
    '#compare':{title:"Dynasty Player Compare | Bobby's Big Board",description:"Compare two dynasty players head-to-head using Bobby's rankings, market value, age, injury status, movement, prospect grades, and recent updates.",path:'/compare'},
    '#movers':{title:"Dynasty Market Movers | Bobby's Big Board",description:"Track the biggest dynasty ranking risers, fallers, and BBB-vs-market movement across Bobby's Big Board.",path:'/movers'},
    '#updates':{title:"Dynasty Player Updates | Bobby's Big Board",description:"Read the latest meaningful dynasty player updates, injuries, role changes, roster news, and performance notes tracked by Bobby's Big Board.",path:'/updates'}
  };

  function setMeta(selector,attr,value){
    let el=document.head.querySelector(selector);
    if(!el){
      el=document.createElement('meta');
      if(selector.includes('property=')){el.setAttribute('property',selector.match(/property="([^"]+)/)?.[1]||'');}
      else el.setAttribute('name',selector.match(/name="([^"]+)/)?.[1]||'');
      document.head.appendChild(el);
    }
    el.setAttribute(attr,value);
  }
  function canonical(path){
    let el=document.head.querySelector('link[rel="canonical"]');
    if(!el){el=document.createElement('link');el.rel='canonical';document.head.appendChild(el);}
    el.href=SITE+path;
  }
  function playerMeta(){
    if(!location.pathname.startsWith('/player/'))return null;
    const slug=decodeURIComponent(location.pathname.split('/player/')[1]||'').split('/')[0];
    const found=typeof profileFind==='function'?profileFind(slug):null;
    const dynasty=found&&Array.isArray(players)?players.find(x=>typeof profileNorm==='function'&&profileNorm(x.name)===profileNorm(found.name)):null;
    const name=found?.name||document.querySelector('.profile-title')?.textContent?.trim()||slug.split('-').map(x=>x?x[0].toUpperCase()+x.slice(1):'').join(' ');
    const rank=dynasty?.rank?`BBB dynasty rank #${dynasty.rank}. `:'';
    const pos=found?.pos||dynasty?.pos||'';
    const team=dynasty?.team||found?.team||'';
    const description=`${name} dynasty fantasy football profile. ${rank}${pos}${team?' • '+team:''}. Rankings, market value, player updates, ranking history, career fantasy production, and prospect context from Bobby's Big Board.`;
    return {title:`${name} Dynasty Profile | Bobby's Big Board`,description,path:`/player/${slug}`};
  }
  function current(){
    const p=playerMeta();if(p)return p;
    const h=(location.hash||'#rankings').split('?')[0];
    return ROUTES[h]||DEFAULT;
  }
  function sync(){
    const m=current();
    document.title=m.title;
    setMeta('meta[name="description"]','content',m.description);
    setMeta('meta[property="og:title"]','content',m.title);
    setMeta('meta[property="og:description"]','content',m.description);
    setMeta('meta[property="og:url"]','content',SITE+m.path);
    setMeta('meta[name="twitter:title"]','content',m.title);
    setMeta('meta[name="twitter:description"]','content',m.description);
    canonical(m.path);
    return m;
  }
  function addShareButton(){
    if(!location.pathname.startsWith('/player/'))return;
    const actions=document.querySelector('.bbb-v2-actions');
    if(!actions||actions.querySelector('.bbb-share-profile'))return;
    const btn=document.createElement('button');
    btn.type='button';btn.className='bbb-share-profile';btn.textContent='Share Profile';
    btn.onclick=async()=>{
      const m=sync(),url=SITE+m.path;
      try{
        if(navigator.share){await navigator.share({title:m.title,text:m.description,url});return;}
        await navigator.clipboard.writeText(url);
        const old=btn.textContent;btn.textContent='Link Copied ✓';setTimeout(()=>btn.textContent=old,1600);
      }catch(e){if(e?.name!=='AbortError')console.warn('Share profile',e);}
    };
    actions.appendChild(btn);
  }
  function installStyle(){
    if(document.querySelector('#bbb-share-style'))return;
    const s=document.createElement('style');s.id='bbb-share-style';s.textContent=`.bbb-v2-actions .bbb-share-profile{display:inline-flex;align-items:center;justify-content:center;padding:9px 12px;border:1px solid #27513c;background:#0a1811;color:#9fe3bc;border-radius:9px;font-size:9px;font-weight:950;text-transform:uppercase;letter-spacing:.06em;cursor:pointer}.bbb-v2-actions .bbb-share-profile:hover{border-color:#50ce8e;color:#fff}`;document.head.appendChild(s);
  }
  function refresh(){sync();addShareButton();}

  installStyle();
  window.addEventListener('hashchange',()=>setTimeout(refresh,0));
  window.addEventListener('popstate',()=>setTimeout(refresh,0));
  document.addEventListener('DOMContentLoaded',()=>{
    refresh();
    const mount=document.querySelector('#profileMount');
    if(mount)new MutationObserver(()=>refresh()).observe(mount,{childList:true,subtree:true});
  });
})();

(function bbbStatsHub(){
  const SEASON=2026;
  const state={mode:'fantasy',pos:'ALL',team:'ALL',search:'',period:'season',visible:50};
  let seasonRows=[],weeklyRows=[],loaded=false,loading=null;
  const num=v=>{const x=Number(v);return Number.isFinite(x)?x:0;};
  const esc=v=>typeof bbbEsc==='function'?bbbEsc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt1=v=>num(v).toFixed(1).replace(/\.0$/,'');
  const pct=v=>v==null||v===''?'—':`${(num(v)*100).toFixed(1)}%`;
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');

  function injectStyles(){
    if(document.querySelector('#bbb-stats-hub-styles'))return;
    const s=document.createElement('style');s.id='bbb-stats-hub-styles';s.textContent=`
      #statsView{background:#050807;min-height:70vh}
      .bbb-stats-hero{padding:64px 0 44px;border-bottom:1px solid #173328;background:radial-gradient(circle at 78% 12%,rgba(10,143,77,.19),transparent 38%),linear-gradient(180deg,#07100c,#050807)}
      .bbb-stats-hero-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(330px,.8fr);gap:50px;align-items:end}
      .bbb-stats-title{font-size:clamp(48px,7vw,80px);line-height:.93;letter-spacing:-.055em;text-transform:uppercase;margin:12px 0 16px}.bbb-stats-title span{color:#42c883}
      .bbb-stats-copy{max-width:700px;color:#a9b7b0;font-size:16px;margin:0}
      .bbb-stats-leader-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.bbb-stats-leader{padding:14px;border:1px solid #1d3b2e;background:#09120e;border-radius:12px}.bbb-stats-leader span{display:block;color:#6f877a;font-size:8px;font-weight:950;letter-spacing:.1em;text-transform:uppercase}.bbb-stats-leader strong{display:block;font-size:14px;margin-top:7px}.bbb-stats-leader b{display:block;color:#55d391;font-size:20px;line-height:1.1;margin-top:2px}
      .bbb-stats-section{padding:54px 0 72px}.bbb-stats-head{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:22px}.bbb-stats-head h2{font-size:clamp(30px,4vw,46px);margin:6px 0 0;letter-spacing:-.045em}.bbb-stats-head p{max-width:520px;color:#7f9188;font-size:12px;margin:0}
      .bbb-stats-panel{border:1px solid #183027;background:#070d0a;border-radius:18px;overflow:hidden}.bbb-stats-toolbar{display:grid;grid-template-columns:auto minmax(190px,1fr) 145px 150px;gap:11px;padding:16px;border-bottom:1px solid #183027}.bbb-stats-modes{display:flex;gap:6px;flex-wrap:wrap}.bbb-stats-mode{border:1px solid #264638;background:#0a120e;color:#9caaa3;padding:9px 11px;border-radius:9px;font-size:10px;font-weight:900;cursor:pointer}.bbb-stats-mode.active{background:#0a8f4d;border-color:#0a8f4d;color:#fff}
      .bbb-stats-search,.bbb-stats-select{width:100%;background:#050a08;border:1px solid #274539;color:#edf3ef;border-radius:9px;padding:10px 11px;outline:none;font-size:10px}.bbb-stats-search:focus,.bbb-stats-select:focus{border-color:#2bb66f}
      .bbb-stats-subbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;border-bottom:1px solid #162a21;background:#07100c}.bbb-stats-pos{display:flex;gap:6px;flex-wrap:wrap}.bbb-stats-pos button{border:1px solid #203e31;background:#08110d;color:#84978d;border-radius:999px;padding:6px 9px;font-size:8px;font-weight:950;cursor:pointer}.bbb-stats-pos button.active{border-color:#2f8a5d;background:#0a2b1c;color:#78e4aa}.bbb-stats-context{color:#667a70;font-size:9px}
      .bbb-stats-scroll{overflow-x:auto}.bbb-stats-table{width:100%;border-collapse:collapse;min-width:900px}.bbb-stats-table th{text-align:left;color:#789087;font-size:8px;text-transform:uppercase;letter-spacing:.1em;padding:11px 12px;border-bottom:1px solid #20392e}.bbb-stats-table td{padding:12px;color:#cdd5d0;font-size:11px;white-space:nowrap}.bbb-stats-table tbody tr{border-bottom:1px solid #14251e;background:#080d0b;cursor:pointer}.bbb-stats-table tbody tr:hover{background:#0c1712}.bbb-stats-rank{font-size:16px!important;font-weight:950;color:#64d697!important}.bbb-stats-name{font-weight:950;color:#fff!important;font-size:12px!important}.bbb-stats-bbb{font-weight:900;color:#a6e0be!important}.bbb-stats-primary{font-weight:950;color:#fff!important}.bbb-stats-muted{color:#71857b!important}.bbb-stats-key{color:#a9b9b1!important;max-width:330px;overflow:hidden;text-overflow:ellipsis}
      .bbb-stats-footer{display:flex;justify-content:space-between;align-items:center;padding:14px 16px}.bbb-stats-count{color:#708178;font-size:9px}.bbb-stats-more{border:1px solid #2e503f;background:#0d1a14;color:#d7e2dc;border-radius:9px;padding:9px 13px;font-size:10px;font-weight:900;cursor:pointer}.bbb-stats-more.hide{display:none}
      @media(max-width:950px){.bbb-stats-hero-grid{grid-template-columns:1fr}.bbb-stats-toolbar{grid-template-columns:1fr 1fr}.bbb-stats-modes{grid-column:1/-1}.bbb-stats-head{align-items:flex-start;flex-direction:column}}
      @media(max-width:640px){.bbb-stats-hero{padding:44px 0 34px}.bbb-stats-title{font-size:50px}.bbb-stats-leader-grid{grid-template-columns:1fr 1fr}.bbb-stats-toolbar{grid-template-columns:1fr;padding:11px}.bbb-stats-modes{grid-column:auto}.bbb-stats-subbar{align-items:flex-start;flex-direction:column}.bbb-stats-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}.bbb-stats-table{display:table!important;min-width:760px}.bbb-stats-table thead{display:table-header-group!important}.bbb-stats-table tbody{display:table-row-group!important;padding:0!important}.bbb-stats-table tbody tr{display:table-row!important;border:0!important;padding:0!important}.bbb-stats-table th,.bbb-stats-table td{display:table-cell!important;padding:11px 10px!important;white-space:nowrap!important}.bbb-stats-key{max-width:230px}.bbb-stats-footer{gap:10px}.bbb-stats-more{flex:none}}
    `;document.head.appendChild(s);
  }

  function injectView(){
    if(document.querySelector('#statsView'))return;
    const main=document.createElement('main');main.id='statsView';main.className='hide';
    main.innerHTML=`<section class="bbb-stats-hero"><div class="shell bbb-stats-hero-grid"><div><div class="eyebrow">2026 Fantasy Production</div><h1 class="bbb-stats-title">Stats &<br><span>Fantasy Leaders.</span></h1><p class="bbb-stats-copy">See who is actually producing, how they rank in PPR scoring, and where that production sits next to Bobby's dynasty value. Switch between season totals and individual weeks, then jump straight into any player profile.</p></div><aside class="bbb-stats-leader-grid" id="bbbStatsLeaders"><div class="bbb-stats-leader"><span>PPR Leader</span><strong>Loading…</strong><b>—</b></div><div class="bbb-stats-leader"><span>Passing Leader</span><strong>Loading…</strong><b>—</b></div><div class="bbb-stats-leader"><span>Rushing Leader</span><strong>Loading…</strong><b>—</b></div><div class="bbb-stats-leader"><span>Receiving Leader</span><strong>Loading…</strong><b>—</b></div></aside></div></section><section class="bbb-stats-section"><div class="shell"><div class="bbb-stats-head"><div><div class="kicker">The Stat Board</div><h2>Production meets dynasty value.</h2></div><p>Fantasy rank is positional PPR rank for the selected period. BBB Rank stays beside it so you can quickly spot players whose current production and dynasty value are telling different stories.</p></div><div class="bbb-stats-panel"><div class="bbb-stats-toolbar"><div class="bbb-stats-modes"><button class="bbb-stats-mode active" data-stats-mode="fantasy">Fantasy Leaders</button><button class="bbb-stats-mode" data-stats-mode="passing">Passing</button><button class="bbb-stats-mode" data-stats-mode="rushing">Rushing</button><button class="bbb-stats-mode" data-stats-mode="receiving">Receiving</button></div><input id="bbbStatsSearch" class="bbb-stats-search" placeholder="Search player or team…"><select id="bbbStatsTeam" class="bbb-stats-select"><option value="ALL">All teams</option></select><select id="bbbStatsPeriod" class="bbb-stats-select"><option value="season">2026 Season</option></select></div><div class="bbb-stats-subbar"><div class="bbb-stats-pos"><button class="active" data-stats-pos="ALL">All</button><button data-stats-pos="QB">QB</button><button data-stats-pos="RB">RB</button><button data-stats-pos="WR">WR</button><button data-stats-pos="TE">TE</button></div><div id="bbbStatsContext" class="bbb-stats-context">Loading 2026 stats…</div></div><div class="bbb-stats-scroll"><table class="bbb-stats-table"><thead id="bbbStatsHead"></thead><tbody id="bbbStatsBody"><tr><td class="empty">Loading stats…</td></tr></tbody></table></div><div class="bbb-stats-footer"><span id="bbbStatsCount" class="bbb-stats-count"></span><button id="bbbStatsMore" class="bbb-stats-more">Show 50 More</button></div></div></div></section>`;
    const strip=document.querySelector('.youtube-strip');
    if(strip)strip.parentNode.insertBefore(main,strip);else document.body.appendChild(main);
  }

  function injectNav(){
    const nav=document.querySelector('.nav-links');
    if(nav&&!nav.querySelector('a[href="#stats"]')){
      const a=document.createElement('a');a.href='#stats';a.textContent='Stats';
      const yt=[...nav.querySelectorAll('a')].find(x=>/youtube/i.test(x.textContent||''));
      nav.insertBefore(a,yt||null);
    }
    const mobile=document.querySelector('.mobile-subnav');
    if(mobile&&!mobile.querySelector('a[href="#stats"]')){
      const a=document.createElement('a');a.href='#stats';a.textContent='Stats';mobile.appendChild(a);
    }
  }

  function getRows(){
    if(state.period==='season')return seasonRows;
    const week=Number(state.period.replace('week-',''));
    return weeklyRows.filter(r=>Number(r.week)===week);
  }
  function fantasyFinish(r){
    const f=state.period==='season'?r.position_finish:r.weekly_position_finish;
    return f?`${r.position}${f}`:'—';
  }
  function bbbRank(r){
    const key=String(r.player_key||'');
    const list=Array.isArray(players)?players:[];
    const p=list.find(x=>String(x.playerKey||x.player_key||'')===key)||list.find(x=>norm(x.name)===norm(r.player_name));
    return p?.rank||null;
  }
  function keyStats(r){
    const pos=String(r.position||'');
    if(pos==='QB')return `${fmt1(r.passing_yards)} pass yds • ${num(r.passing_tds)} TD • ${num(r.interceptions)} INT${num(r.rushing_yards)?` • ${fmt1(r.rushing_yards)} rush`:''}`;
    if(pos==='RB')return `${num(r.carries)} car • ${fmt1(r.rushing_yards)} rush yds • ${num(r.receptions)} rec • ${fmt1(r.receiving_yards)} rec yds`;
    return `${num(r.targets)} tgt • ${num(r.receptions)} rec • ${fmt1(r.receiving_yards)} yds • ${num(r.receiving_tds)} TD`;
  }
  function sortedFiltered(){
    let rows=getRows().filter(r=>{
      if(state.pos!=='ALL'&&r.position!==state.pos)return false;
      if(state.team!=='ALL'&&r.team!==state.team)return false;
      if(state.search&&!(`${r.player_name} ${r.team} ${r.position}`).toLowerCase().includes(state.search))return false;
      if(state.mode==='passing'&&num(r.attempts)<=0)return false;
      if(state.mode==='rushing'&&num(r.carries)<=0)return false;
      if(state.mode==='receiving'&&num(r.targets)<=0)return false;
      return true;
    });
    const metric=state.mode==='passing'?'passing_yards':state.mode==='rushing'?'rushing_yards':state.mode==='receiving'?'receiving_yards':'fantasy_points_ppr';
    rows.sort((a,b)=>num(b[metric])-num(a[metric])||num(b.fantasy_points_ppr)-num(a.fantasy_points_ppr)||String(a.player_name).localeCompare(String(b.player_name)));
    return rows;
  }
  function headHtml(){
    if(state.mode==='passing')return '<tr><th>Pass Yds</th><th>Player</th><th>Pos</th><th>Team</th><th>BBB</th><th>Comp/Att</th><th>Pass TD</th><th>INT</th><th>Rush Yds</th><th>PPR</th></tr>';
    if(state.mode==='rushing')return '<tr><th>Rush Yds</th><th>Player</th><th>Pos</th><th>Team</th><th>BBB</th><th>Carries</th><th>YPC</th><th>Rush TD</th><th>Rec</th><th>PPR</th></tr>';
    if(state.mode==='receiving')return '<tr><th>Rec Yds</th><th>Player</th><th>Pos</th><th>Team</th><th>BBB</th><th>Targets</th><th>Rec</th><th>YPR</th><th>Rec TD</th><th>Target Share</th><th>PPR</th></tr>';
    return '<tr><th>Fantasy Rank</th><th>Player</th><th>Pos</th><th>Team</th><th>BBB Rank</th><th>PPR Pts</th><th>Games</th><th>Key Stats</th></tr>';
  }
  function rowHtml(r){
    const rank=bbbRank(r),games=state.period==='season'?num(r.games):1;
    if(state.mode==='passing')return `<tr data-stats-name="${esc(r.player_name)}"><td class="bbb-stats-rank">${fmt1(r.passing_yards)}</td><td class="bbb-stats-name">${esc(r.player_name)}</td><td><span class="pos-chip">${esc(r.position)}</span></td><td>${esc(r.team||'—')}</td><td class="bbb-stats-bbb">${rank?'#'+rank:'—'}</td><td>${num(r.completions)}/${num(r.attempts)}</td><td class="bbb-stats-primary">${num(r.passing_tds)}</td><td>${num(r.interceptions)}</td><td>${fmt1(r.rushing_yards)}</td><td>${fmt1(r.fantasy_points_ppr)}</td></tr>`;
    if(state.mode==='rushing'){const ypc=num(r.carries)?num(r.rushing_yards)/num(r.carries):0;return `<tr data-stats-name="${esc(r.player_name)}"><td class="bbb-stats-rank">${fmt1(r.rushing_yards)}</td><td class="bbb-stats-name">${esc(r.player_name)}</td><td><span class="pos-chip">${esc(r.position)}</span></td><td>${esc(r.team||'—')}</td><td class="bbb-stats-bbb">${rank?'#'+rank:'—'}</td><td>${num(r.carries)}</td><td>${ypc.toFixed(1)}</td><td class="bbb-stats-primary">${num(r.rushing_tds)}</td><td>${num(r.receptions)}</td><td>${fmt1(r.fantasy_points_ppr)}</td></tr>`;}
    if(state.mode==='receiving'){const ypr=num(r.receptions)?num(r.receiving_yards)/num(r.receptions):0;return `<tr data-stats-name="${esc(r.player_name)}"><td class="bbb-stats-rank">${fmt1(r.receiving_yards)}</td><td class="bbb-stats-name">${esc(r.player_name)}</td><td><span class="pos-chip">${esc(r.position)}</span></td><td>${esc(r.team||'—')}</td><td class="bbb-stats-bbb">${rank?'#'+rank:'—'}</td><td>${num(r.targets)}</td><td>${num(r.receptions)}</td><td>${ypr.toFixed(1)}</td><td class="bbb-stats-primary">${num(r.receiving_tds)}</td><td>${pct(r.target_share)}</td><td>${fmt1(r.fantasy_points_ppr)}</td></tr>`;}
    return `<tr data-stats-name="${esc(r.player_name)}"><td class="bbb-stats-rank">${fantasyFinish(r)}</td><td class="bbb-stats-name">${esc(r.player_name)}</td><td><span class="pos-chip">${esc(r.position)}</span></td><td>${esc(r.team||'—')}</td><td class="bbb-stats-bbb">${rank?'#'+rank:'—'}</td><td class="bbb-stats-primary">${fmt1(r.fantasy_points_ppr)}</td><td>${games||'—'}</td><td class="bbb-stats-key">${keyStats(r)}</td></tr>`;
  }
  function render(){
    if(!loaded)return;
    const rows=sortedFiltered(),slice=rows.slice(0,state.visible);
    document.querySelector('#bbbStatsHead').innerHTML=headHtml();
    document.querySelector('#bbbStatsBody').innerHTML=slice.map(rowHtml).join('')||'<tr><td colspan="11" class="empty">No players match those filters.</td></tr>';
    document.querySelector('#bbbStatsCount').textContent=`Showing ${Math.min(state.visible,rows.length)} of ${rows.length} players`;
    document.querySelector('#bbbStatsMore').classList.toggle('hide',state.visible>=rows.length);
    const period=state.period==='season'?'2026 season':`Week ${state.period.replace('week-','')}`;
    document.querySelector('#bbbStatsContext').textContent=`${period} • PPR scoring • ${rows.length} matching players`;
    document.querySelectorAll('#bbbStatsBody tr[data-stats-name]').forEach(tr=>tr.onclick=()=>{if(typeof profileGo==='function')profileGo(tr.dataset.statsName);});
  }
  function renderLeaders(){
    if(!seasonRows.length)return;
    const best=k=>[...seasonRows].filter(r=>num(r[k])>0).sort((a,b)=>num(b[k])-num(a[k]))[0];
    const defs=[['PPR Leader',best('fantasy_points_ppr'),'fantasy_points_ppr',' PPR'],['Passing Leader',best('passing_yards'),'passing_yards',' yds'],['Rushing Leader',best('rushing_yards'),'rushing_yards',' yds'],['Receiving Leader',best('receiving_yards'),'receiving_yards',' yds']];
    document.querySelector('#bbbStatsLeaders').innerHTML=defs.map(([label,r,k,suffix])=>`<div class="bbb-stats-leader"><span>${label}</span><strong>${r?esc(r.player_name):'—'}</strong><b>${r?fmt1(r[k])+suffix:'—'}</b></div>`).join('');
  }
  function populateFilters(){
    const teams=[...new Set(seasonRows.map(r=>r.team).filter(Boolean))].sort();
    const team=document.querySelector('#bbbStatsTeam');team.innerHTML='<option value="ALL">All teams</option>'+teams.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');
    const weeks=[...new Set(weeklyRows.map(r=>num(r.week)).filter(Boolean))].sort((a,b)=>b-a);
    const period=document.querySelector('#bbbStatsPeriod');period.innerHTML='<option value="season">2026 Season</option>'+weeks.map(w=>`<option value="week-${w}">Week ${w}</option>`).join('');
  }
  async function loadStats(){
    if(loaded)return;
    if(loading)return loading;
    loading=Promise.all([
      bbbDbCached('site_player_season_stats',`select=*&season=eq.${SEASON}&order=fantasy_points_ppr.desc.nullslast`),
      bbbDbCached('site_player_weekly_stats',`select=*&season=eq.${SEASON}&order=week.desc`)
    ]).then(([s,w])=>{
      seasonRows=s||[];weeklyRows=w||[];loaded=true;populateFilters();renderLeaders();render();
    }).catch(e=>{
      console.error('BBB stats hub:',e);
      const body=document.querySelector('#bbbStatsBody');if(body)body.innerHTML='<tr><td class="empty">Stats are temporarily unavailable. Refresh in a moment.</td></tr>';
      const ctx=document.querySelector('#bbbStatsContext');if(ctx)ctx.textContent='Stats unavailable';
    });
    return loading;
  }
  function bind(){
    document.querySelectorAll('[data-stats-mode]').forEach(b=>b.onclick=()=>{state.mode=b.dataset.statsMode;state.visible=50;document.querySelectorAll('[data-stats-mode]').forEach(x=>x.classList.toggle('active',x===b));render();});
    document.querySelectorAll('[data-stats-pos]').forEach(b=>b.onclick=()=>{state.pos=b.dataset.statsPos;state.visible=50;document.querySelectorAll('[data-stats-pos]').forEach(x=>x.classList.toggle('active',x===b));render();});
    document.querySelector('#bbbStatsSearch').oninput=e=>{state.search=e.target.value.trim().toLowerCase();state.visible=50;render();};
    document.querySelector('#bbbStatsTeam').onchange=e=>{state.team=e.target.value;state.visible=50;render();};
    document.querySelector('#bbbStatsPeriod').onchange=e=>{state.period=e.target.value;state.visible=50;render();};
    document.querySelector('#bbbStatsMore').onclick=()=>{state.visible+=50;render();};
  }
  function show(){
    const active=location.hash==='#stats';
    const view=document.querySelector('#statsView');if(view)view.classList.toggle('hide',!active);
    if(active){
      document.querySelectorAll('#rankingsView,#rookieView,#prospectView,#tradeView,#profileView,#updatesView,#moversView,#compareView').forEach(el=>el?.classList.add('hide'));
      window.scrollTo(0,0);loadStats().then(()=>setTimeout(render,0));
    }
  }

  injectStyles();injectView();injectNav();bind();
  const originalView=typeof bbbView==='function'?bbbView:null;
  if(originalView)bbbView=function(){originalView();show();};
  window.addEventListener('hashchange',()=>setTimeout(show,0));
  document.addEventListener('DOMContentLoaded',()=>{show();if(location.hash==='#stats')loadStats();});
})();
