// Bobby's Big Board fantasy production profile layer.
// Adds a compact ESPN-style season summary near the top and a Sleeper-style
// weekly game log beside the deeper career-production research.

(function(){
  if(typeof profileRender!=='function'||typeof bbbDb!=='function')return;

  let bbbFantasyToken=0;
  const bbbFantasyCache=new Map();

  function esc(v){
    if(typeof bbbEsc==='function')return bbbEsc(v);
    return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  }
  function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
  function dec(v,d=1){const n=Number(v);return Number.isFinite(n)?n.toFixed(d):'—'}
  function int(v){const n=Number(v);return Number.isFinite(n)?Math.round(n).toLocaleString():'—'}
  function currentYear(){return new Date().getFullYear()}

  function currentPlayer(slug){
    const found=typeof profileFind==='function'?profileFind(slug):null;
    if(!found)return null;
    const key=String(found.playerKey||found.player_key||'');
    return (typeof players!=='undefined'?players:[]).find(p=>String(p.playerKey||p.player_key||'')===key)
      ||(typeof players!=='undefined'?players:[]).find(p=>typeof profileNorm==='function'&&profileNorm(p.name)===profileNorm(found.name))
      ||found;
  }

  function loadWeekly(playerKey){
    const key=String(playerKey||'').trim();
    if(!key)return Promise.resolve([]);
    if(!bbbFantasyCache.has(key)){
      bbbFantasyCache.set(key,bbbDb(
        'site_player_weekly_stats',
        `select=*&player_key=eq.${encodeURIComponent(key)}&order=season.desc,week.asc`
      ).then(rows=>Array.isArray(rows)?rows:[]).catch(err=>{
        bbbFantasyCache.delete(key);
        throw err;
      }));
    }
    return bbbFantasyCache.get(key);
  }

  function seasonRows(rows,season){
    return (rows||[]).filter(r=>Number(r.season)===Number(season));
  }
  function seasons(rows){
    return [...new Set((rows||[]).map(r=>Number(r.season)).filter(Number.isFinite))].sort((a,b)=>b-a);
  }
  function totals(rows){
    const keys=['completions','attempts','passing_yards','passing_tds','interceptions','carries','rushing_yards','rushing_tds','targets','receptions','receiving_yards','receiving_tds','fumbles_lost'];
    const out={};keys.forEach(k=>out[k]=rows.reduce((s,r)=>s+num(r[k]),0));return out;
  }
  function position(player,rows){return String(player?.pos||rows?.[0]?.position||'').toUpperCase()}

  function statLine(pos,t){
    if(pos==='QB')return [
      `${int(t.completions)}/${int(t.attempts)} CMP/ATT`,
      `${int(t.passing_yards)} PASS YDS`,
      `${int(t.passing_tds)} PASS TD`,
      `${int(t.interceptions)} INT`,
      `${int(t.rushing_yards)} RUSH YDS`,
      `${int(t.rushing_tds)} RUSH TD`
    ];
    if(pos==='RB')return [
      `${int(t.carries)} CAR`,
      `${int(t.rushing_yards)} RUSH YDS`,
      `${int(t.rushing_tds)} RUSH TD`,
      `${int(t.targets)} TGT`,
      `${int(t.receptions)} REC`,
      `${int(t.receiving_yards)} REC YDS`,
      `${int(t.receiving_tds)} REC TD`
    ];
    return [
      `${int(t.targets)} TGT`,
      `${int(t.receptions)} REC`,
      `${int(t.receiving_yards)} REC YDS`,
      `${int(t.receiving_tds)} REC TD`
    ];
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

  function summaryHtml(player,rows,season){
    const list=seasonRows(rows,season);
    if(!list.length)return '';
    const pos=position(player,list),t=totals(list),games=list.length;
    const seasonPpr=num(list[0]?.season_ppr)||list.reduce((s,r)=>s+num(r.fantasy_points_ppr),0);
    const finish=Number(list[0]?.season_position_finish);
    const ppg=games?seasonPpr/games:0;
    const isCurrent=Number(season)===currentYear();
    const status=isCurrent?'CURRENT':'FINAL';
    const note=isCurrent?'Live regular-season production.':`${currentYear()} production will replace this once weekly games are available.`;
    return `<section class="bbb-fantasy-season-strip" aria-label="${esc(season)} fantasy season summary">
      <div class="bbb-fantasy-season-head">
        <div><span class="bbb-fantasy-kicker">${esc(season)} FANTASY SEASON</span><small>${esc(note)}</small></div>
        <span class="bbb-fantasy-status ${isCurrent?'current':'final'}">${status}</span>
      </div>
      <div class="bbb-fantasy-season-main">
        <div class="rank"><span>PPR Rank</span><strong>${pos&&Number.isFinite(finish)?esc(pos+finish):'—'}</strong></div>
        <div><span>PPR Points</span><strong>${dec(seasonPpr,1)}</strong></div>
        <div><span>PPR / Game</span><strong>${dec(ppg,1)}</strong></div>
        <div><span>Games</span><strong>${games}</strong></div>
      </div>
      <div class="bbb-fantasy-statline">${statLine(pos,t).map(x=>`<span>${esc(x)}</span>`).join('')}</div>
      <a class="bbb-fantasy-jump" href="#bbbGameLog">View game log ↓</a>
    </section>`;
  }

  function columns(pos){
    if(pos==='QB')return [
      ['WK','week'],['OPP','opp'],['CMP/ATT','cmpatt'],['PASS YDS','passing_yards'],['PASS TD','passing_tds'],['INT','interceptions'],['RUSH YDS','rushing_yards'],['RUSH TD','rushing_tds'],['PPR','ppr'],['WK RANK','rank']
    ];
    if(pos==='RB')return [
      ['WK','week'],['OPP','opp'],['CAR','carries'],['RUSH YDS','rushing_yards'],['RUSH TD','rushing_tds'],['TGT','targets'],['REC','receptions'],['REC YDS','receiving_yards'],['REC TD','receiving_tds'],['PPR','ppr'],['WK RANK','rank']
    ];
    return [
      ['WK','week'],['OPP','opp'],['TGT','targets'],['REC','receptions'],['REC YDS','receiving_yards'],['REC TD','receiving_tds'],['PPR','ppr'],['WK RANK','rank']
    ];
  }

  function cell(row,key,pos){
    if(key==='week')return `<strong>W${esc(row.week)}</strong>`;
    if(key==='opp')return esc(opponent(row));
    if(key==='cmpatt')return `${int(row.completions)}/${int(row.attempts)}`;
    if(key==='ppr'){
      const p=num(row.fantasy_points_ppr),cls=p>=20?'boom':p<8?'quiet':'';
      return `<strong class="bbb-game-ppr ${cls}">${dec(p,1)}</strong>`;
    }
    if(key==='rank'){
      const finish=Number(row.weekly_position_finish);
      return Number.isFinite(finish)?`<span class="bbb-game-rank ${finish<=12?'top':''}">${esc(pos+finish)}</span>`:'—';
    }
    return int(row[key]);
  }

  function gameLogBody(player,rows,season){
    const list=seasonRows(rows,season).sort((a,b)=>Number(b.week)-Number(a.week));
    if(!list.length)return '<div class="bbb-game-empty">No weekly fantasy production is available for this season.</div>';
    const pos=position(player,list),cols=columns(pos);
    return `<div class="bbb-game-table-wrap"><table class="bbb-game-table"><thead><tr>${cols.map(c=>`<th>${esc(c[0])}</th>`).join('')}</tr></thead><tbody>${list.map(r=>`<tr>${cols.map(c=>`<td>${cell(r,c[1],pos)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function renderGameLog(player,rows,selectedSeason){
    const card=document.querySelector('#bbbGameLog');if(!card)return;
    const seasonList=seasons(rows);
    const season=seasonList.includes(Number(selectedSeason))?Number(selectedSeason):seasonList[0];
    card.dataset.season=String(season||'');
    const select=card.querySelector('#bbbGameSeason');
    if(select){select.innerHTML=seasonList.map(y=>`<option value="${y}" ${y===season?'selected':''}>${y}</option>`).join('')}
    const body=card.querySelector('#bbbGameBody');if(body)body.innerHTML=gameLogBody(player,rows,season);
  }

  function render(slug,player,rows){
    const mount=document.querySelector('#profileMount');
    const hero=mount?.querySelector('.profile-hero .shell');
    const grid=mount?.querySelector('.profile-grid');
    if(!mount||!hero||!grid)return;

    hero.querySelector('.bbb-fantasy-season-strip')?.remove();
    grid.querySelector('#bbbGameLog')?.remove();

    const seasonList=seasons(rows);
    if(!seasonList.length){
      // NFL rookies/prospects with no prior weekly data should not get a large empty card.
      return;
    }
    const latest=seasonList[0];
    const summary=document.createElement('div');
    summary.innerHTML=summaryHtml(player,rows,latest);
    const summaryCard=summary.firstElementChild;
    const snapshot=hero.querySelector('.bbb-profile-atglance');
    if(summaryCard){snapshot?snapshot.insertAdjacentElement('afterend',summaryCard):hero.appendChild(summaryCard)}

    const game=document.createElement('section');
    game.id='bbbGameLog';
    game.className='profile-card full bbb-fantasy-gamelog-card';
    game.innerHTML=`<div class="bbb-game-head"><div><div class="profile-card-kicker">FANTASY GAME LOG</div><h2>Weekly production.</h2><p>PPR scoring with the player's positional finish for every week.</p></div><label>Season<select id="bbbGameSeason" aria-label="Game log season"></select></label></div><div id="bbbGameBody"></div><div class="bbb-game-footnote">Weekly rank compares this player with every ${esc(position(player,seasonRows(rows,latest))||'fantasy')} at the same position in that NFL week.</div>`;

    const career=grid.querySelector('.bbb-v2-career-card');
    if(career)grid.insertBefore(game,career);else grid.appendChild(game);
    renderGameLog(player,rows,latest);
    game.querySelector('#bbbGameSeason')?.addEventListener('change',e=>renderGameLog(player,rows,Number(e.target.value)));
  }

  function injectStyles(){
    if(document.querySelector('#bbb-fantasy-profile-styles'))return;
    const s=document.createElement('style');s.id='bbb-fantasy-profile-styles';s.textContent=`
      .bbb-fantasy-season-strip{margin-top:10px;border:1px solid #204b36;background:linear-gradient(135deg,#08160f,#07100c);border-radius:14px;padding:13px 15px}.bbb-fantasy-season-head{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:10px}.bbb-fantasy-kicker{display:block;color:#55d991;font-size:8px;font-weight:950;letter-spacing:.12em}.bbb-fantasy-season-head small{display:block;color:#687d71;font-size:8px;margin-top:3px}.bbb-fantasy-status{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:7px;font-weight:950;letter-spacing:.07em}.bbb-fantasy-status.current{background:#0a2b1d;border:1px solid #176743;color:#74e5a9}.bbb-fantasy-status.final{background:#18201c;border:1px solid #34443b;color:#aab8b0}.bbb-fantasy-season-main{display:grid;grid-template-columns:1.15fr repeat(3,1fr);gap:7px}.bbb-fantasy-season-main>div{border-left:1px solid #193529;padding:2px 12px}.bbb-fantasy-season-main>div:first-child{border-left:0;padding-left:0}.bbb-fantasy-season-main span{display:block;color:#64786d;font-size:7px;font-weight:900;text-transform:uppercase;letter-spacing:.07em}.bbb-fantasy-season-main strong{display:block;color:#f0f5f2;font-size:18px;margin-top:3px}.bbb-fantasy-season-main .rank strong{color:#6ce0a3;font-size:22px}.bbb-fantasy-statline{display:flex;gap:6px 14px;flex-wrap:wrap;margin-top:10px;padding-top:9px;border-top:1px solid #173127}.bbb-fantasy-statline span{color:#9aaba2;font-size:8px;font-weight:850;white-space:nowrap}.bbb-fantasy-jump{display:inline-block;margin-top:8px;color:#54d891;font-size:7px;font-weight:950;letter-spacing:.05em;text-transform:uppercase}
      .bbb-fantasy-gamelog-card{overflow:hidden}.bbb-game-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:15px}.bbb-game-head h2{margin:3px 0 4px}.bbb-game-head p{margin:0;color:#7f9087;font-size:10px}.bbb-game-head label{display:grid;gap:5px;color:#65786e;font-size:7px;font-weight:950;text-transform:uppercase;letter-spacing:.08em}.bbb-game-head select{min-width:94px;background:#07100c;border:1px solid #27503d;color:#e5eee9;border-radius:8px;padding:8px 10px;font-size:10px;font-weight:850}.bbb-game-table-wrap{overflow-x:auto;border:1px solid #173127;border-radius:11px;background:#07100c;-webkit-overflow-scrolling:touch}.bbb-game-table{width:100%;border-collapse:collapse;min-width:720px}.bbb-game-table th{padding:9px 10px;text-align:right;background:#09140f;border-bottom:1px solid #173127;color:#61746a;font-size:7px;font-weight:950;letter-spacing:.06em;white-space:nowrap}.bbb-game-table th:first-child,.bbb-game-table th:nth-child(2),.bbb-game-table td:first-child,.bbb-game-table td:nth-child(2){text-align:left}.bbb-game-table td{padding:10px;border-bottom:1px solid #10251c;color:#aebcb4;font-size:9px;text-align:right;white-space:nowrap}.bbb-game-table tr:last-child td{border-bottom:0}.bbb-game-table tbody tr:hover{background:#09130f}.bbb-game-table td:first-child strong{color:#dce6e1}.bbb-game-table td:nth-child(2){color:#83978c;font-weight:850}.bbb-game-ppr{color:#dfe8e3}.bbb-game-ppr.boom{color:#71dfa5}.bbb-game-ppr.quiet{color:#df8a8a}.bbb-game-rank{display:inline-flex;border:1px solid #34443b;background:#18201c;color:#aab8b0;border-radius:999px;padding:4px 7px;font-size:8px;font-weight:950}.bbb-game-rank.top{border-color:#176743;background:#0a2b1d;color:#74e5a9}.bbb-game-footnote{color:#63766c;font-size:8px;margin-top:9px}.bbb-game-empty{padding:30px;text-align:center;border:1px dashed #244236;border-radius:11px;color:#7f9087;font-size:10px}
      @media(max-width:720px){.bbb-fantasy-season-main{grid-template-columns:repeat(2,1fr)}.bbb-fantasy-season-main>div{border-left:0;border-top:1px solid #193529;padding:8px 0 0}.bbb-fantasy-season-main>div:nth-child(-n+2){border-top:0;padding-top:0}.bbb-fantasy-season-main>div:nth-child(even){padding-left:10px;border-left:1px solid #193529}.bbb-game-head{align-items:flex-start;flex-direction:column}.bbb-game-head label{width:100%}.bbb-game-head select{width:100%}}
      @media(max-width:640px){.bbb-game-table-wrap:before{content:'Swipe to see full game log →';display:block;position:sticky;left:0;width:max-content;padding:7px 9px;color:#687d71;font-size:7px;font-weight:900;text-transform:uppercase;background:#09140f;border-bottom:1px solid #173127;z-index:5}.bbb-game-table{display:table!important;min-width:720px!important}.bbb-game-table thead{display:table-header-group!important}.bbb-game-table tbody{display:table-row-group!important;padding:0!important}.bbb-game-table tbody tr{display:table-row!important;padding:0!important;border:0!important;background:#07100c!important}.bbb-game-table th,.bbb-game-table td{display:table-cell!important;width:auto!important;white-space:nowrap!important}.bbb-game-table th:first-child,.bbb-game-table td:first-child{position:sticky;left:0;z-index:4;background:#09140f!important;box-shadow:1px 0 0 #173127}.bbb-game-table td:first-child{background:#07100c!important}}
      @media(max-width:430px){.bbb-fantasy-season-strip{padding:12px}.bbb-fantasy-season-main strong{font-size:15px}.bbb-fantasy-season-main .rank strong{font-size:19px}.bbb-fantasy-statline{gap:6px 10px}}
    `;document.head.appendChild(s);
  }

  injectStyles();

  const baseRender=profileRender;
  profileRender=async function(slug){
    const token=++bbbFantasyToken;
    const result=await baseRender(slug);
    const player=currentPlayer(slug);
    const key=String(player?.playerKey||player?.player_key||'').trim();
    if(!player||!key)return result;
    const rows=await loadWeekly(key).catch(err=>{console.error('BBB fantasy weekly stats:',err);return []});
    if(token!==bbbFantasyToken)return result;
    render(slug,player,rows);
    return result;
  };
})();
