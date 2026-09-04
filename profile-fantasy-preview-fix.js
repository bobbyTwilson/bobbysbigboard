// Preview-only polish for Bobby's Big Board player fantasy stats.
// Keeps the approved top-of-profile fantasy strip intact while making deeper
// season production and weekly game logs substantially easier to scan.

(function(){
  const weeklyCache=new Map();

  function esc(v){
    if(typeof bbbEsc==='function')return bbbEsc(v);
    return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
  function int(v){const n=Number(v);return Number.isFinite(n)?Math.round(n).toLocaleString():'—'}
  function dec(v,d=1){const n=Number(v);return Number.isFinite(n)?n.toFixed(d):'—'}

  function patchCompareButton(){
    if(typeof bbbCompareAddProfileButton!=='function'||bbbCompareAddProfileButton.__bbbSnapshotAware)return;
    const original=bbbCompareAddProfileButton;
    const wrapped=function(){
      const hero=document.querySelector('#profileMount .profile-hero .shell');
      const snapshot=hero?.querySelector('.bbb-profile-atglance');
      if(snapshot){
        hero.querySelectorAll('.bbb-profile-compare-action').forEach(el=>el.remove());
        return;
      }
      return original();
    };
    wrapped.__bbbSnapshotAware=true;
    bbbCompareAddProfileButton=wrapped;
  }

  function parseProduction(text){
    const raw=String(text||'').trim();
    const labels=['PASS YDS','PASS TD','RUSH YDS','RUSH TD','REC YDS','REC TD','CMP/ATT','CAR','TGT','REC','INT'];
    const label=labels.find(x=>raw.endsWith(' '+x));
    if(!label)return null;
    return {label,value:raw.slice(0,-label.length).trim()};
  }

  function polishProduction(){
    document.querySelectorAll('#profileView .bbb-fantasy-statline').forEach(line=>{
      line.classList.add('bbb-preview-production-grid');
      [...line.children].forEach(item=>{
        if(item.dataset.bbbProductionPolished==='1')return;
        const parsed=parseProduction(item.textContent);
        if(!parsed)return;
        item.dataset.bbbProductionPolished='1';
        item.innerHTML=`<small>${esc(parsed.label)}</small><strong>${esc(parsed.value)}</strong>`;
      });
    });
  }

  function polishGameLogJump(){
    document.querySelectorAll('#profileView .bbb-fantasy-jump').forEach(jump=>{
      let button=jump;
      if(jump.tagName==='A'){
        button=document.createElement('button');
        button.type='button';
        button.className=jump.className;
        button.textContent=jump.textContent;
        jump.replaceWith(button);
      }
      if(button.dataset.bbbGameJumpBound==='1')return;
      button.dataset.bbbGameJumpBound='1';
      button.classList.add('bbb-preview-game-jump');
      button.addEventListener('click',e=>{
        e.preventDefault();
        e.stopPropagation();
        document.querySelector('#bbbGameLog')?.scrollIntoView({behavior:'smooth',block:'start'});
      });
    });
  }

  function removeOldCompare(){
    const hero=document.querySelector('#profileMount .profile-hero .shell');
    if(!hero?.querySelector('.bbb-profile-atglance'))return;
    hero.querySelectorAll('.bbb-profile-compare-action').forEach(el=>el.remove());
  }

  function currentPlayer(){
    const match=location.pathname.match(/^\/player\/([^/?#]+)/);
    const slug=match?decodeURIComponent(match[1]):'';
    if(!slug||typeof profileFind!=='function')return null;
    return profileFind(slug)||null;
  }

  function loadWeeklyRows(){
    const player=currentPlayer();
    const key=String(player?.playerKey||player?.player_key||'').trim();
    if(!key||typeof bbbDb!=='function')return Promise.resolve([]);
    if(!weeklyCache.has(key)){
      weeklyCache.set(key,bbbDb(
        'site_player_weekly_stats',
        `select=*&player_key=eq.${encodeURIComponent(key)}&order=season.desc,week.asc`
      ).then(rows=>Array.isArray(rows)?rows:[]).catch(()=>[]));
    }
    return weeklyCache.get(key);
  }

  function seasonTotals(rows){
    const keys=['completions','attempts','passing_yards','passing_tds','interceptions','carries','rushing_yards','rushing_tds','targets','receptions','receiving_yards','receiving_tds'];
    const out={};
    keys.forEach(k=>out[k]=rows.reduce((sum,row)=>sum+num(row[k]),0));
    return out;
  }

  function seasonProductionCards(pos,t){
    if(pos==='QB')return [
      ['CMP / ATT',`${int(t.completions)} / ${int(t.attempts)}`],
      ['PASS YARDS',int(t.passing_yards)],
      ['PASS TD',int(t.passing_tds)],
      ['INTERCEPTIONS',int(t.interceptions)],
      ['RUSH YARDS',int(t.rushing_yards)],
      ['RUSH TD',int(t.rushing_tds)]
    ];
    if(pos==='RB')return [
      ['CARRIES',int(t.carries)],
      ['RUSH YARDS',int(t.rushing_yards)],
      ['RUSH TD',int(t.rushing_tds)],
      ['TARGETS',int(t.targets)],
      ['RECEPTIONS',int(t.receptions)],
      ['REC YARDS',int(t.receiving_yards)],
      ['REC TD',int(t.receiving_tds)]
    ];
    const cards=[
      ['TARGETS',int(t.targets)],
      ['RECEPTIONS',int(t.receptions)],
      ['REC YARDS',int(t.receiving_yards)],
      ['REC TD',int(t.receiving_tds)]
    ];
    if(t.rushing_yards||t.rushing_tds){
      cards.push(['RUSH YARDS',int(t.rushing_yards)],['RUSH TD',int(t.rushing_tds)]);
    }
    return cards;
  }

  function seasonSummaryHtml(rows,season){
    const list=rows.filter(r=>Number(r.season)===Number(season));
    if(!list.length)return '';
    const pos=String(list[0]?.position||currentPlayer()?.pos||'').toUpperCase();
    const t=seasonTotals(list);
    const points=num(list[0]?.season_ppr)||list.reduce((sum,row)=>sum+num(row.fantasy_points_ppr),0);
    const games=list.length;
    const ppg=games?points/games:0;
    const finish=Number(list[0]?.season_position_finish);
    const best=[...list].sort((a,b)=>num(b.fantasy_points_ppr)-num(a.fantasy_points_ppr))[0];
    const bestFinish=Number(best?.weekly_position_finish);
    const production=seasonProductionCards(pos,t);
    return `<div class="bbb-preview-season-summary">
      <div class="bbb-preview-season-summary-head">
        <div><span>${esc(season)} SEASON TOTALS</span><strong>${pos&&Number.isFinite(finish)?esc(pos+finish):'—'}</strong><small>PPR positional finish</small></div>
        <div class="bbb-preview-season-fantasy-grid">
          <div><span>PPR POINTS</span><strong>${dec(points,1)}</strong></div>
          <div><span>PPR / GAME</span><strong>${dec(ppg,1)}</strong></div>
          <div><span>GAMES</span><strong>${games}</strong></div>
          <div><span>BEST WEEK</span><strong>${best?`W${esc(best.week)} · ${dec(best.fantasy_points_ppr,1)}`:'—'}</strong><small>${best&&Number.isFinite(bestFinish)?esc(pos+bestFinish):''}</small></div>
        </div>
      </div>
      <div class="bbb-preview-season-production-grid">
        ${production.map(([label,value])=>`<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}
      </div>
    </div>`;
  }

  async function renderDeepSeasonSummary(){
    const card=document.querySelector('#bbbGameLog');
    const select=card?.querySelector('#bbbGameSeason');
    const body=card?.querySelector('#bbbGameBody');
    if(!card||!select||!body)return;
    const season=Number(select.value);
    const rows=await loadWeeklyRows();
    if(!document.body.contains(card))return;
    let summary=card.querySelector('.bbb-preview-season-summary-wrap');
    if(!summary){
      summary=document.createElement('div');
      summary.className='bbb-preview-season-summary-wrap';
      body.insertAdjacentElement('beforebegin',summary);
    }
    summary.innerHTML=seasonSummaryHtml(rows,season);
  }

  function bindGameSeason(){
    const select=document.querySelector('#bbbGameLog #bbbGameSeason');
    if(!select||select.dataset.bbbPreviewSeasonBound==='1')return;
    select.dataset.bbbPreviewSeasonBound='1';
    select.addEventListener('change',()=>{
      setTimeout(()=>{
        renderDeepSeasonSummary();
        polishGameLogTable();
      },0);
    });
  }

  function polishGameLogTable(){
    const table=document.querySelector('#bbbGameLog .bbb-game-table');
    if(!table)return;
    table.classList.add('bbb-preview-readable-game-table');
    table.querySelectorAll('tbody tr').forEach(row=>{
      const cells=row.cells;
      if(cells[0])cells[0].classList.add('bbb-preview-week-cell');
      if(cells[1])cells[1].classList.add('bbb-preview-opponent-cell');
      const ppr=row.querySelector('.bbb-game-ppr');
      const rank=row.querySelector('.bbb-game-rank');
      ppr?.closest('td')?.classList.add('bbb-preview-ppr-cell');
      rank?.closest('td')?.classList.add('bbb-preview-rank-cell');
    });
  }

  function polishCareerTable(){
    const table=document.querySelector('#profileView .bbb-v2-career-table');
    if(!table)return;
    table.classList.add('bbb-preview-readable-career-table');
    table.querySelectorAll('tbody tr').forEach(row=>{
      const cells=row.cells;
      if(cells[0])cells[0].classList.add('bbb-preview-season-cell');
      if(cells[1])cells[1].classList.add('bbb-preview-team-cell');
    });
  }

  function apply(){
    patchCompareButton();
    removeOldCompare();
    polishProduction();
    polishGameLogJump();
    bindGameSeason();
    polishGameLogTable();
    polishCareerTable();
    renderDeepSeasonSummary();
  }

  function injectStyles(){
    if(document.querySelector('#bbb-profile-fantasy-preview-fix-styles'))return;
    const s=document.createElement('style');
    s.id='bbb-profile-fantasy-preview-fix-styles';
    s.textContent=`
      /* Approved compact season strip near the top */
      #profileView .bbb-fantasy-statline.bbb-preview-production-grid{
        display:grid;
        grid-template-columns:repeat(6,minmax(0,1fr));
        gap:7px;
        margin-top:12px;
        padding-top:11px;
      }
      #profileView .bbb-fantasy-statline.bbb-preview-production-grid>span{
        display:block;
        min-width:0;
        margin:0;
        padding:9px 10px;
        border:1px solid #19382b;
        border-radius:9px;
        background:#08120e;
        white-space:normal;
      }
      #profileView .bbb-fantasy-statline.bbb-preview-production-grid>span small{
        display:block;
        color:#657b6f;
        font-size:7px;
        font-weight:950;
        letter-spacing:.07em;
        text-transform:uppercase;
        line-height:1.2;
      }
      #profileView .bbb-fantasy-statline.bbb-preview-production-grid>span strong{
        display:block;
        margin-top:4px;
        color:#eef5f1;
        font-size:15px;
        line-height:1.1;
        font-weight:950;
      }
      #profileView .bbb-fantasy-jump.bbb-preview-game-jump{
        appearance:none;
        border:0;
        background:transparent;
        padding:0;
        cursor:pointer;
        font-family:inherit;
      }
      #profileView .bbb-fantasy-gamelog-card{scroll-margin-top:96px}

      /* Selected-season summary inside the detailed game-log section */
      #profileView .bbb-preview-season-summary{
        margin:0 0 16px;
        padding:16px;
        border:1px solid #25503c;
        border-radius:13px;
        background:linear-gradient(135deg,#0a1c14,#07100c);
      }
      #profileView .bbb-preview-season-summary-head{
        display:grid;
        grid-template-columns:minmax(150px,.65fr) minmax(0,2fr);
        gap:16px;
        align-items:stretch;
      }
      #profileView .bbb-preview-season-summary-head>div:first-child{
        display:flex;
        flex-direction:column;
        justify-content:center;
        padding-right:16px;
        border-right:1px solid #1b3a2d;
      }
      #profileView .bbb-preview-season-summary-head>div:first-child>span{
        color:#57d893;
        font-size:8px;
        font-weight:950;
        letter-spacing:.1em;
      }
      #profileView .bbb-preview-season-summary-head>div:first-child>strong{
        margin-top:5px;
        color:#6ce0a3;
        font-size:30px;
        line-height:1;
      }
      #profileView .bbb-preview-season-summary-head>div:first-child>small{
        margin-top:5px;
        color:#72867b;
        font-size:8px;
      }
      #profileView .bbb-preview-season-fantasy-grid{
        display:grid;
        grid-template-columns:repeat(4,minmax(0,1fr));
        gap:8px;
      }
      #profileView .bbb-preview-season-fantasy-grid>div,
      #profileView .bbb-preview-season-production-grid>div{
        border:1px solid #19382b;
        border-radius:10px;
        background:#08120e;
      }
      #profileView .bbb-preview-season-fantasy-grid>div{padding:11px 12px}
      #profileView .bbb-preview-season-fantasy-grid span,
      #profileView .bbb-preview-season-production-grid span{
        display:block;
        color:#6f8378;
        font-size:7px;
        font-weight:950;
        letter-spacing:.07em;
        text-transform:uppercase;
      }
      #profileView .bbb-preview-season-fantasy-grid strong{
        display:block;
        margin-top:4px;
        color:#eef5f1;
        font-size:16px;
        line-height:1.1;
      }
      #profileView .bbb-preview-season-fantasy-grid small{
        display:block;
        margin-top:3px;
        color:#72dfa6;
        font-size:8px;
        font-weight:900;
      }
      #profileView .bbb-preview-season-production-grid{
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(120px,1fr));
        gap:8px;
        margin-top:10px;
        padding-top:10px;
        border-top:1px solid #173127;
      }
      #profileView .bbb-preview-season-production-grid>div{padding:11px 12px}
      #profileView .bbb-preview-season-production-grid strong{
        display:block;
        margin-top:4px;
        color:#f0f5f2;
        font-size:16px;
        line-height:1.1;
      }

      /* Weekly game log readability */
      #profileView .bbb-game-head{margin-bottom:17px}
      #profileView .bbb-game-head h2{font-size:31px;margin-bottom:6px}
      #profileView .bbb-game-head p{font-size:11px;line-height:1.55;color:#93a39b}
      #profileView .bbb-game-head label{font-size:8px;color:#82958b}
      #profileView .bbb-game-head select{min-width:112px;padding:9px 12px;font-size:11px}
      #profileView .bbb-game-table-wrap{
        border-radius:13px;
        border-color:#214233;
        scrollbar-width:thin;
        scrollbar-color:#2d5a44 #07100c;
      }
      #profileView .bbb-game-table.bbb-preview-readable-game-table{min-width:960px}
      #profileView .bbb-game-table.bbb-preview-readable-game-table th{
        padding:12px 13px;
        color:#8fa198;
        font-size:8px;
        letter-spacing:.075em;
        background:#0b1712;
      }
      #profileView .bbb-game-table.bbb-preview-readable-game-table td{
        padding:14px 13px;
        color:#c4d0ca;
        font-size:11px;
        line-height:1.2;
        border-bottom-color:#173027;
      }
      #profileView .bbb-game-table.bbb-preview-readable-game-table tbody tr:nth-child(even){background:#08130f}
      #profileView .bbb-game-table.bbb-preview-readable-game-table tbody tr:hover{background:#0d1a14}
      #profileView .bbb-game-table .bbb-preview-week-cell{
        min-width:64px;
        width:64px;
        position:sticky;
        left:0;
        z-index:3;
        background:#07100c;
      }
      #profileView .bbb-game-table tbody tr:nth-child(even) .bbb-preview-week-cell{background:#08130f}
      #profileView .bbb-game-table .bbb-preview-week-cell strong{
        display:inline-flex;
        min-width:38px;
        justify-content:center;
        padding:6px 7px;
        border:1px solid #2a513e;
        border-radius:8px;
        background:#0a1b13;
        color:#dfe9e4;
        font-size:10px;
      }
      #profileView .bbb-game-table .bbb-preview-opponent-cell{
        min-width:94px;
        width:94px;
        position:sticky;
        left:64px;
        z-index:3;
        background:#07100c;
        color:#e0e8e4!important;
        font-size:11px!important;
        font-weight:950!important;
        box-shadow:1px 0 0 #1b392c;
      }
      #profileView .bbb-game-table tbody tr:nth-child(even) .bbb-preview-opponent-cell{background:#08130f}
      #profileView .bbb-game-table .bbb-preview-ppr-cell{background:rgba(14,57,38,.28)}
      #profileView .bbb-game-ppr{font-size:14px!important;font-weight:950!important}
      #profileView .bbb-game-ppr.boom{color:#78e5ab!important}
      #profileView .bbb-game-ppr.quiet{color:#e79393!important}
      #profileView .bbb-game-rank{
        padding:5px 8px;
        font-size:9px;
        min-width:48px;
        justify-content:center;
      }
      #profileView .bbb-game-rank.top{
        color:#80ebb1;
        border-color:#228657;
        background:#0b2e20;
      }
      #profileView .bbb-game-footnote{margin-top:11px;font-size:8px;line-height:1.5}

      /* Season-by-season career table readability */
      #profileView .bbb-v2-career-summary{
        gap:9px;
        margin-bottom:17px;
      }
      #profileView .bbb-v2-career-summary>div{
        padding:12px 13px;
        border:1px solid #19382b;
        border-radius:10px;
        background:#08120e;
      }
      #profileView .bbb-v2-career-summary strong{font-size:18px}
      #profileView .bbb-v2-career-table-wrap{
        border-radius:13px;
        border-color:#214233;
        scrollbar-width:thin;
        scrollbar-color:#2d5a44 #07100c;
      }
      #profileView .bbb-v2-career-table.bbb-preview-readable-career-table{min-width:980px}
      #profileView .bbb-v2-career-table.bbb-preview-readable-career-table th{
        padding:12px 12px;
        color:#8fa198;
        font-size:8px;
        background:#0b1712;
      }
      #profileView .bbb-v2-career-table.bbb-preview-readable-career-table td{
        padding:14px 12px;
        color:#c4d0ca;
        font-size:11px;
        border-bottom-color:#173027;
      }
      #profileView .bbb-v2-career-table.bbb-preview-readable-career-table tbody tr:nth-child(even){background:#08130f}
      #profileView .bbb-v2-career-table .bbb-preview-season-cell{
        min-width:78px;
        position:sticky;
        left:0;
        z-index:3;
        background:#07100c;
        color:#f0f5f2!important;
        font-size:13px!important;
        font-weight:950!important;
      }
      #profileView .bbb-v2-career-table tbody tr:nth-child(even) .bbb-preview-season-cell{background:#08130f}
      #profileView .bbb-v2-career-table .bbb-preview-team-cell{
        min-width:72px;
        position:sticky;
        left:78px;
        z-index:3;
        background:#07100c;
        color:#a8bbb0!important;
        font-size:11px!important;
        font-weight:950!important;
        box-shadow:1px 0 0 #1b392c;
      }
      #profileView .bbb-v2-career-table tbody tr:nth-child(even) .bbb-preview-team-cell{background:#08130f}
      #profileView .bbb-v2-career-table td.ppr{
        color:#7de4ad!important;
        font-size:13px!important;
        font-weight:950!important;
        background:rgba(14,57,38,.22);
      }
      #profileView .bbb-v2-career-table td.finish{
        color:#f0f5f2!important;
        font-size:12px!important;
        font-weight:950!important;
      }

      @media(max-width:900px){
        #profileView .bbb-fantasy-statline.bbb-preview-production-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
        #profileView .bbb-preview-season-summary-head{grid-template-columns:1fr}
        #profileView .bbb-preview-season-summary-head>div:first-child{border-right:0;border-bottom:1px solid #1b3a2d;padding:0 0 12px}
        #profileView .bbb-preview-season-fantasy-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
      }
      @media(max-width:520px){
        #profileView .bbb-fantasy-statline.bbb-preview-production-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
        #profileView .bbb-preview-season-summary{padding:13px}
        #profileView .bbb-preview-season-summary-head>div:first-child>strong{font-size:26px}
        #profileView .bbb-preview-season-fantasy-grid{grid-template-columns:1fr 1fr}
        #profileView .bbb-preview-season-production-grid{grid-template-columns:1fr 1fr}
        #profileView .bbb-game-head{align-items:flex-start;flex-direction:column}
        #profileView .bbb-game-head h2{font-size:27px}
        #profileView .bbb-game-head label{width:100%}
        #profileView .bbb-game-head select{width:100%}
      }
    `;
    document.head.appendChild(s);
  }

  injectStyles();
  patchCompareButton();

  if(typeof profileRender==='function'){
    const base=profileRender;
    profileRender=async function(slug){
      const result=await base(slug);
      apply();
      queueMicrotask(apply);
      requestAnimationFrame(apply);
      setTimeout(apply,80);
      return result;
    };
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
})();
