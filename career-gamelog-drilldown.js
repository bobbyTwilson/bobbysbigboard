// Bobby's Big Board — Inline career season game-log drilldown
// Expands weekly game logs directly beneath Career Fantasy Production rows.
// Multiple seasons can remain open at once for easy year-to-year comparison.

(function(){
  const STYLE_ID='bbb-career-gamelog-drilldown-styles';
  const weeklyCache=new Map();
  let scheduled=false;
  let renderToken=0;

  function esc(v){
    if(typeof bbbEsc==='function')return bbbEsc(v);
    return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
  function int(v){const n=Number(v);return Number.isFinite(n)?Math.round(n).toLocaleString():'—'}
  function dec(v,d=1){const n=Number(v);return Number.isFinite(n)?n.toFixed(d):'—'}
  function isPlayerRoute(){return /^\/player\/[^/?#]+\/?$/.test(location.pathname)}
  function routeSlug(){const m=location.pathname.match(/^\/player\/([^/?#]+)/);return m?decodeURIComponent(m[1]):''}

  function currentPlayer(){
    const slug=routeSlug();
    if(!slug||typeof profileFind!=='function')return null;
    return profileFind(slug)||null;
  }

  function loadWeekly(){
    const player=currentPlayer();
    const key=String(player?.playerKey||player?.player_key||'').trim();
    if(!key||typeof bbbDb!=='function')return Promise.resolve([]);
    if(!weeklyCache.has(key)){
      weeklyCache.set(key,bbbDb(
        'site_player_weekly_stats',
        `select=*&player_key=eq.${encodeURIComponent(key)}&order=season.desc,week.asc`
      ).then(rows=>Array.isArray(rows)?rows:[]).catch(err=>{
        console.error('BBB career drilldown weekly stats:',err);
        weeklyCache.delete(key);
        return [];
      }));
    }
    return weeklyCache.get(key);
  }

  function opponent(row){
    const opp=String(row?.opponent_team||'—');
    const team=String(row?.team||'');
    const parts=String(row?.game_id||'').split('_');
    if(parts.length>=4){
      const away=parts[2],home=parts[3];
      if(team===away)return `@ ${opp}`;
      if(team===home)return `vs ${opp}`;
    }
    return opp;
  }

  function columns(pos){
    if(pos==='QB')return [
      ['WK','week'],['OPP','opp'],['CMP/ATT','cmpatt'],['PASS YDS','passing_yards'],['PASS TD','passing_tds'],['INT','interceptions'],['RUSH YDS','rushing_yards'],['RUSH TD','rushing_tds'],['PPR','ppr'],['WK RANK','rank']
    ];
    if(pos==='RB')return [
      ['WK','week'],['OPP','opp'],['CAR','carries'],['RUSH YDS','rushing_yards'],['RUSH TD','rushing_tds'],['TGT','targets'],['REC','receptions'],['REC YDS','receiving_yards'],['REC TD','receiving_tds'],['PPR','ppr'],['WK RANK','rank']
    ];
    return [
      ['WK','week'],['OPP','opp'],['TGT','targets'],['REC','receptions'],['REC YDS','receiving_yards'],['REC TD','receiving_tds'],['RUSH YDS','rushing_yards'],['RUSH TD','rushing_tds'],['PPR','ppr'],['WK RANK','rank']
    ];
  }

  function cell(row,key,pos){
    if(key==='week')return `<strong>W${esc(row.week)}</strong>`;
    if(key==='opp')return `<strong class="bbb-drill-opp">${esc(opponent(row))}</strong>`;
    if(key==='cmpatt')return `${int(row.completions)}/${int(row.attempts)}`;
    if(key==='ppr'){
      const p=num(row.fantasy_points_ppr),cls=p>=20?'boom':p<8?'quiet':'';
      return `<strong class="bbb-drill-ppr ${cls}">${dec(p,1)}</strong>`;
    }
    if(key==='rank'){
      const rawFinish=row.weekly_position_finish;\n      const finish=rawFinish==null||rawFinish===''?NaN:Number(rawFinish);
      return Number.isFinite(finish)&&finish>0?`<span class="bbb-drill-rank ${finish<=12?'top':''}">${esc(pos+finish)}</span>`:'NR';
    }
    return int(row[key]);
  }

  function drillTable(rows,pos){
    const cols=columns(pos);
    return `<div class="bbb-career-drill-table-wrap"><table class="bbb-career-drill-table"><thead><tr>${cols.map(c=>`<th>${esc(c[0])}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${cell(r,c[1],pos)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function seasonSummary(rows,pos){
    const games=rows.length;
    const ppr=rows.reduce((s,r)=>s+num(r.fantasy_points_ppr),0);
    const ppg=games?ppr/games:0;
    const best=[...rows].sort((a,b)=>num(b.fantasy_points_ppr)-num(a.fantasy_points_ppr))[0];
    const rawFinish=rows[0]?.season_position_finish;\n    const finish=rawFinish==null||rawFinish===''?NaN:Number(rawFinish);
    return `<div class="bbb-career-drill-summary">
      <span><small>GAMES</small><strong>${games}</strong></span>
      <span><small>PPR</small><strong>${dec(ppr,1)}</strong></span>
      <span><small>PPR / GAME</small><strong>${dec(ppg,1)}</strong></span>
      <span><small>SEASON FINISH</small><strong>${Number.isFinite(finish)&&finish>0?esc(pos+finish):'NR'}</strong></span>
      <span><small>BEST WEEK</small><strong>${best?`W${esc(best.week)} · ${dec(best.fantasy_points_ppr,1)}`:'—'}</strong></span>
    </div>`;
  }

  function drillImmediatelyAfter(row){
    const next=row.nextElementSibling;
    if(!next?.classList.contains('bbb-career-drill-row'))return null;
    const season=String(row.dataset.bbbCareerSeason||'');
    return !season||String(next.dataset.season||'')===season?next:null;
  }

  function setRowState(row,expanded){
    const season=String(row.dataset.bbbCareerSeason||'');
    row.setAttribute('aria-expanded',expanded?'true':'false');
    row.classList.toggle('is-expanded',expanded);
    row.setAttribute('aria-label',`${expanded?'Collapse':'Expand'} ${season} weekly game log`);
    row.title=`${expanded?'Collapse':'Expand'} ${season} weekly game log`;
  }

  function expandedCount(table){return table.querySelectorAll('tbody tr.bbb-career-season-row[aria-expanded="true"]').length}

  function syncCollapseAll(table){
    const card=table.closest('.bbb-v2-career-card');
    const button=card?.querySelector('.bbb-career-collapse-all');
    if(!button)return;
    const count=expandedCount(table);
    button.hidden=count<2;
    button.textContent=`Collapse all (${count})`;
  }

  function collapseRow(row){
    const season=String(row.dataset.bbbCareerSeason||'');
    let next=row.nextElementSibling;
    // Defensive cleanup: remove every duplicate drill row for this season that may
    // have been created by an older preview build before the state fix.
    while(next?.classList.contains('bbb-career-drill-row')&&(!season||String(next.dataset.season||'')===season)){
      const remove=next;
      next=next.nextElementSibling;
      remove.remove();
    }
    setRowState(row,false);
    const table=row.closest('table');
    if(table)syncCollapseAll(table);
  }

  function expandRow(row,seasonRows,pos){
    // The DOM is the source of truth. MutationObserver refreshes can run after an
    // expansion, so never rely on aria-expanded alone to decide whether to close.
    if(drillImmediatelyAfter(row)||row.getAttribute('aria-expanded')==='true'){
      collapseRow(row);
      return;
    }
    const season=String(row.dataset.bbbCareerSeason||'');
    const table=row.closest('table');
    if(!table||!seasonRows.length)return;
    const detail=document.createElement('tr');
    detail.className='bbb-career-drill-row';
    detail.dataset.season=season;
    const td=document.createElement('td');
    td.colSpan=Math.max(1,row.cells.length);
    td.innerHTML=`<div class="bbb-career-drill-panel">
      <div class="bbb-career-drill-head">
        <div><span>WEEKLY GAME LOG · ${esc(season)}</span><h3>${esc(season)} regular season</h3><p>Weekly fantasy production without leaving the career view.</p></div>
        <button type="button" class="bbb-career-drill-close" aria-label="Collapse ${esc(season)} game log">Collapse ↑</button>
      </div>
      ${seasonSummary(seasonRows,pos)}
      ${drillTable(seasonRows,pos)}
    </div>`;
    detail.appendChild(td);
    row.insertAdjacentElement('afterend',detail);
    setRowState(row,true);
    td.querySelector('.bbb-career-drill-close')?.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      collapseRow(row);
    });
    syncCollapseAll(table);
  }

  function ensureCollapseAll(table){
    const card=table.closest('.bbb-v2-career-card');
    const wrap=table.closest('.bbb-v2-career-table-wrap');
    if(!card||!wrap||card.querySelector('.bbb-career-collapse-all'))return;
    const controls=document.createElement('div');
    controls.className='bbb-career-drill-controls';
    controls.innerHTML='<span>Tap a season to view its weekly games.</span><button type="button" class="bbb-career-collapse-all" hidden>Collapse all</button>';
    wrap.insertAdjacentElement('beforebegin',controls);
    controls.querySelector('.bbb-career-collapse-all')?.addEventListener('click',()=>{
      table.querySelectorAll('tbody tr.bbb-career-season-row[aria-expanded="true"]').forEach(row=>collapseRow(row));
    });
  }

  async function bindCareerRows(){
    const table=document.querySelector('#profileView .bbb-v2-career-table');
    if(!table)return;
    const token=++renderToken;
    const weekly=await loadWeekly();
    if(token!==renderToken||!document.body.contains(table))return;

    const player=currentPlayer();
    const fallbackPos=String(player?.pos||'').toUpperCase();
    const bySeason=new Map();
    weekly.forEach(r=>{
      const season=String(r.season||'');
      if(!/^\d{4}$/.test(season))return;
      if(!bySeason.has(season))bySeason.set(season,[]);
      bySeason.get(season).push(r);
    });
    bySeason.forEach(rows=>rows.sort((a,b)=>Number(a.week)-Number(b.week)));

    ensureCollapseAll(table);

    table.querySelectorAll('tbody tr').forEach(row=>{
      if(row.classList.contains('bbb-career-drill-row'))return;
      const season=String(row.cells?.[0]?.textContent||'').trim();
      if(!/^\d{4}$/.test(season))return;
      const seasonRows=bySeason.get(season)||[];
      row.classList.add('bbb-career-season-row');
      row.dataset.bbbCareerSeason=season;

      if(!seasonRows.length){
        row.classList.add('bbb-career-season-unavailable');
        row.removeAttribute('tabindex');
        row.removeAttribute('role');
        row.removeAttribute('aria-expanded');
        row.classList.remove('is-expanded');
        row.title='Weekly game log is not available for this season.';
        return;
      }

      row.classList.remove('bbb-career-season-unavailable');
      row.setAttribute('tabindex','0');
      row.setAttribute('role','button');

      // MutationObserver runs after a drill row is inserted/removed. Preserve the
      // live expansion state instead of resetting aria-expanded back to false.
      const currentlyExpanded=!!drillImmediatelyAfter(row);
      setRowState(row,currentlyExpanded);

      if(row.dataset.bbbCareerDrilldownBound==='1')return;
      row.dataset.bbbCareerDrilldownBound='1';
      const pos=String(seasonRows[0]?.position||fallbackPos).toUpperCase();

      row.addEventListener('click',event=>{
        if(event.target.closest('a,button,select,input,textarea'))return;
        expandRow(row,seasonRows,pos);
      });
      row.addEventListener('keydown',event=>{
        if(event.key!=='Enter'&&event.key!==' ')return;
        event.preventDefault();
        expandRow(row,seasonRows,pos);
      });
    });
    syncCollapseAll(table);
  }

  function injectStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      #profileView .bbb-career-drill-controls{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:4px 0 9px;color:#8ca49c;font-size:9px;font-weight:800}
      #profileView .bbb-career-collapse-all,#profileView .bbb-career-drill-close{appearance:none;border:1px solid #2b6f61;background:#0d2b24;color:#83e6d0;border-radius:8px;padding:7px 10px;font-size:8px;font-weight:950;letter-spacing:.04em;cursor:pointer}
      #profileView .bbb-career-collapse-all:hover,#profileView .bbb-career-drill-close:hover{background:#123a31;border-color:#3e9a84;color:#effffb}
      #profileView .bbb-v2-career-table tbody tr.bbb-career-season-row:not(.bbb-career-season-unavailable){cursor:pointer;outline:none;transition:background .14s ease}
      #profileView .bbb-v2-career-table tbody tr.bbb-career-season-row:not(.bbb-career-season-unavailable) td{transition:background .14s ease,color .14s ease}
      #profileView .bbb-v2-career-table tbody tr.bbb-career-season-row:not(.bbb-career-season-unavailable):hover td,
      #profileView .bbb-v2-career-table tbody tr.bbb-career-season-row:not(.bbb-career-season-unavailable):focus-visible td{background:#10342c!important}
      #profileView .bbb-v2-career-table tbody tr.bbb-career-season-row.is-expanded td{background:#123d34!important;border-bottom-color:#285e51!important}
      #profileView .bbb-v2-career-table tbody tr.bbb-career-season-row:not(.bbb-career-season-unavailable) td:last-child:after{content:'⌄';display:inline-block;margin-left:9px;color:#5ed8bf;font-size:12px;font-weight:950;transition:transform .16s ease}
      #profileView .bbb-v2-career-table tbody tr.bbb-career-season-row.is-expanded td:last-child:after{transform:rotate(180deg)}
      #profileView .bbb-v2-career-table tbody tr.bbb-career-season-row:focus-visible{box-shadow:inset 0 0 0 2px #53d4b4}
      #profileView .bbb-v2-career-table tbody tr.bbb-career-drill-row{cursor:default!important;background:transparent!important}
      #profileView .bbb-v2-career-table tbody tr.bbb-career-drill-row>td{padding:0!important;background:#07120f!important;border-bottom:1px solid #2b5549!important;white-space:normal!important}
      #profileView .bbb-career-drill-panel{margin:0;padding:18px 16px 20px;background:linear-gradient(135deg,#0d2b24,#0a1e1a 60%,#0b2520);border-left:3px solid #46cfa8;box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}
      #profileView .bbb-career-drill-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin-bottom:12px}
      #profileView .bbb-career-drill-head span{display:block;color:#5be0c0;font-size:8px;font-weight:950;letter-spacing:.11em;text-transform:uppercase}
      #profileView .bbb-career-drill-head h3{margin:4px 0 3px;color:#f2f8f5;font-size:18px;line-height:1.1}
      #profileView .bbb-career-drill-head p{margin:0;color:#91aaa1;font-size:9px}
      #profileView .bbb-career-drill-summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;margin-bottom:11px}
      #profileView .bbb-career-drill-summary>span{display:block;padding:9px 10px;border:1px solid #23584b;border-radius:9px;background:#0a211c}
      #profileView .bbb-career-drill-summary small{display:block;color:#72958a;font-size:7px;font-weight:950;letter-spacing:.07em}
      #profileView .bbb-career-drill-summary strong{display:block;margin-top:3px;color:#edf7f3;font-size:13px}
      #profileView .bbb-career-drill-table-wrap{overflow-x:auto;border:1px solid #23584b;border-radius:10px;background:#081915;-webkit-overflow-scrolling:touch}
      #profileView .bbb-career-drill-table{width:100%;min-width:760px;border-collapse:collapse}
      #profileView .bbb-career-drill-table th{padding:8px 9px;text-align:right;background:#0d2923;color:#7fa399;border-bottom:1px solid #27594e;font-size:7px;font-weight:950;letter-spacing:.06em;white-space:nowrap}
      #profileView .bbb-career-drill-table td{padding:9px!important;text-align:right;color:#c5d8d2!important;background:#091c18!important;border-bottom:1px solid #173c33!important;font-size:9px!important;white-space:nowrap!important}
      #profileView .bbb-career-drill-table tbody tr:nth-child(even) td{background:#0b221d!important}
      #profileView .bbb-career-drill-table tr:last-child td{border-bottom:0!important}
      #profileView .bbb-career-drill-table th:first-child,#profileView .bbb-career-drill-table th:nth-child(2),#profileView .bbb-career-drill-table td:first-child,#profileView .bbb-career-drill-table td:nth-child(2){text-align:left}
      #profileView .bbb-career-drill-table td:first-child strong{color:#f0f7f4}
      #profileView .bbb-drill-opp{color:#dcebe6}
      #profileView .bbb-drill-ppr{color:#eaf4f0}.bbb-drill-ppr.boom{color:#6fe2a9}.bbb-drill-ppr.quiet{color:#ef9999}
      #profileView .bbb-drill-rank{display:inline-flex;border:1px solid #3b5b51;background:#122a24;color:#bed0ca;border-radius:999px;padding:3px 6px;font-size:8px;font-weight:950}
      #profileView .bbb-drill-rank.top{border-color:#2c8066;background:#103b2d;color:#7be4ae}
      @media(max-width:760px){
        #profileView .bbb-career-drill-controls{align-items:flex-start;flex-direction:column}
        #profileView .bbb-career-drill-summary{grid-template-columns:repeat(2,minmax(0,1fr))}
        #profileView .bbb-career-drill-summary>span:last-child{grid-column:1/-1}
        #profileView .bbb-career-drill-head{align-items:flex-start;flex-direction:column}
        #profileView .bbb-career-drill-close{width:100%}
        #profileView .bbb-career-drill-panel{padding:14px 10px 16px}
      }
      @media(max-width:560px){
        #profileView .bbb-career-drill-table-wrap:before{content:'Swipe to see full weekly log →';display:block;position:sticky;left:0;width:max-content;padding:6px 8px;color:#78978e;font-size:7px;font-weight:900;text-transform:uppercase;background:#0d2923;border-bottom:1px solid #27594e;z-index:3}
      }
    `;
    document.head.appendChild(style);
  }

  function apply(){
    if(!isPlayerRoute())return;
    injectStyles();
    bindCareerRows();
  }

  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;apply()});
  }

  const observer=new MutationObserver(schedule);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',schedule,{once:true});
  window.addEventListener('popstate',schedule);
  schedule();
})();
