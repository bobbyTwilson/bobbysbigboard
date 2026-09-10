// Bobby's Big Board — Profile Tabs + Career V2 Preview
// Preview-only layer. Converts deep NFL profile research into focused tabs,
// adds a career resume/timeline, and compresses the Value vs. Consensus module.

(function(){
  const STYLE_ID='bbb-profile-tabs-career-v2-styles';
  const SYSTEM_CLASS='bbb-profile-tabs-v2';
  const cache=new Map();
  let token=0;

  const TEAM_LOGOS={
    ARI:'ari',ATL:'atl',BAL:'bal',BUF:'buf',CAR:'car',CHI:'chi',CIN:'cin',CLE:'cle',
    DAL:'dal',DEN:'den',DET:'det',GB:'gb',HOU:'hou',IND:'ind',JAC:'jax',JAX:'jax',
    KC:'kc',LV:'lv',LAC:'lac',LAR:'lar',LA:'lar',MIA:'mia',MIN:'min',NE:'ne',NO:'no',
    NYG:'nyg',NYJ:'nyj',PHI:'phi',PIT:'pit',SF:'sf',SEA:'sea',TB:'tb',TEN:'ten',
    WAS:'wsh',WSH:'wsh'
  };

  function esc(v){
    if(typeof bbbEsc==='function')return bbbEsc(v);
    return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  }
  function n(v){const x=Number(v);return Number.isFinite(x)?x:null}
  function int(v){const x=n(v);return x==null?'—':Math.round(x).toLocaleString()}
  function dec(v,d=1){const x=n(v);return x==null?'—':x.toFixed(d)}
  function date(v){
    if(!v)return '';
    const d=new Date(String(v).slice(0,10)+'T12:00:00');
    return Number.isNaN(d.getTime())?'':d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  }
  function slug(v){
    if(typeof profileSlug==='function')return profileSlug(v);
    return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  }
  function currentPlayer(pathSlug){
    if(typeof bbbSnapshotCurrentPlayer==='function'){
      const p=bbbSnapshotCurrentPlayer(pathSlug);if(p)return p;
    }
    const found=typeof profileFind==='function'?profileFind(pathSlug):null;
    if(!found)return null;
    const key=String(found.playerKey||found.player_key||'');
    return (typeof players!=='undefined'?players:[]).find(p=>String(p.playerKey||p.player_key||'')===key)||found;
  }
  function playerKey(p,pathSlug){return String(p?.playerKey||p?.player_key||pathSlug||'')}
  function logo(team){
    const id=TEAM_LOGOS[String(team||'').toUpperCase()];
    return id?`https://a.espncdn.com/i/teamlogos/nfl/500/${id}.png`:'';
  }
  function move(v){
    const x=n(v);
    if(x==null||x===0)return '<strong class="neutral">—</strong>';
    return `<strong class="${x>0?'up':'down'}">${x>0?'↑':'↓'} ${Math.abs(x)}</strong>`;
  }
  function marketBadge(view){
    const s=String(view||'').toUpperCase();
    if(s.includes('BUY'))return '<span class="bbb-tabs-market buy">BBB BUY</span>';
    if(s.includes('FADE'))return '<span class="bbb-tabs-market fade">BBB FADE</span>';
    return '<span class="bbb-tabs-market market">≈ MARKET</span>';
  }

  function loadData(key){
    if(!key||typeof bbbDb!=='function')return Promise.resolve({stats:[],weekly:[],mover:null,updates:[]});
    if(!cache.has(key)){
      const q=encodeURIComponent(key);
      cache.set(key,Promise.all([
        bbbDb('site_player_season_stats',`select=*&player_key=eq.${q}&order=season.asc`).catch(()=>[]),
        bbbDb('site_player_weekly_stats',`select=*&player_key=eq.${q}&order=season.asc,week.asc`).catch(()=>[]),
        bbbDb('site_movers',`select=*&player_key=eq.${q}&limit=1`).catch(()=>[]),
        bbbDb('site_updates',`select=id,update_date,update_type,update_text,injury_status,rank_impact&player_key=eq.${q}&order=update_date.desc,id.desc&limit=20`).catch(()=>[])
      ]).then(([stats,weekly,movers,updates])=>({
        stats:Array.isArray(stats)?stats:[],weekly:Array.isArray(weekly)?weekly:[],
        mover:Array.isArray(movers)?movers[0]||null:null,updates:Array.isArray(updates)?updates:[]
      })).catch(err=>{cache.delete(key);throw err}));
    }
    return cache.get(key);
  }

  function ensureStyles(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      #profileView .bbb-redesign-tabs{display:none!important}
      #profileView .${SYSTEM_CLASS}{margin:0 0 12px}
      #profileView .bbb-tabs-bar{display:flex;gap:2px;align-items:center;overflow-x:auto;padding:4px;border:1px solid #173b2a;border-radius:11px;background:#05100b;scrollbar-width:none;-webkit-overflow-scrolling:touch}
      #profileView .bbb-tabs-bar::-webkit-scrollbar{display:none}
      #profileView .bbb-tabs-btn{appearance:none;border:0;background:transparent;color:#81958a;min-height:38px;padding:0 15px;border-radius:8px;font-size:8px;font-weight:950;letter-spacing:.075em;text-transform:uppercase;white-space:nowrap;cursor:pointer;transition:background .15s ease,color .15s ease,box-shadow .15s ease}
      #profileView .bbb-tabs-btn:hover{color:#dce7e1;background:#081b12}
      #profileView .bbb-tabs-btn[aria-selected="true"]{color:#65e3a1;background:#0a261a;box-shadow:inset 0 -2px 0 #45d58b}
      #profileView .bbb-tabs-panel{margin-top:9px}
      #profileView .bbb-tabs-panel[hidden]{display:none!important}
      #profileView .bbb-tabs-panel>.profile-card{margin:0!important;width:100%}
      #profileView .bbb-tabs-panel>.profile-card+.profile-card{margin-top:10px!important}
      #profileView .profile-grid.bbb-tabs-grid-managed{display:none!important}

      #profileView .bbb-tab-placeholder{border:1px solid #173b2a;background:linear-gradient(145deg,#07130e,#050d09);border-radius:14px;padding:22px}
      #profileView .bbb-tab-placeholder .profile-card-kicker{margin-bottom:6px}
      #profileView .bbb-tab-placeholder h2{margin:0 0 7px;font-size:24px;color:#eef5f1}
      #profileView .bbb-tab-placeholder p{margin:0;color:#80948a;font-size:11px;line-height:1.6}

      #profileView .bbb-news-list{display:grid;gap:8px}
      #profileView .bbb-news-item{display:grid;grid-template-columns:92px minmax(0,1fr) auto;gap:13px;align-items:start;border:1px solid #17362a;background:#06110c;border-radius:10px;padding:13px}
      #profileView .bbb-news-date{color:#71877b;font-size:9px;font-weight:850}
      #profileView .bbb-news-copy strong{display:block;color:#dfe9e3;font-size:11px;margin-bottom:4px}
      #profileView .bbb-news-copy p{margin:0;color:#93a69c;font-size:10px;line-height:1.55}
      #profileView .bbb-news-status{display:inline-flex;align-items:center;border:1px solid #31513f;border-radius:999px;padding:4px 7px;color:#a8bbb1;font-size:7px;font-weight:900;white-space:nowrap}

      #profileView .bbb-career-card{padding:20px!important}
      #profileView .bbb-career-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:15px}
      #profileView .bbb-career-head h2{margin:5px 0 5px!important;font-size:28px!important}
      #profileView .bbb-career-head p{margin:0;color:#84988d;font-size:10px;line-height:1.55}
      #profileView .bbb-career-source{display:inline-flex;border:1px solid #28543f;background:#081b12;color:#6fdfaa;border-radius:999px;padding:5px 8px;font-size:7px;font-weight:950;letter-spacing:.08em}
      #profileView .bbb-career-glance{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-bottom:9px}
      #profileView .bbb-career-glance>div,#profileView .bbb-career-statgrid>div{border:1px solid #17362a;background:#06110c;border-radius:10px;padding:12px;min-width:0}
      #profileView .bbb-career-glance span,#profileView .bbb-career-statgrid span{display:block;color:#657b6f;font-size:7px;font-weight:950;letter-spacing:.075em;text-transform:uppercase;margin-bottom:5px}
      #profileView .bbb-career-glance strong{display:block;color:#eef5f1;font-size:20px;line-height:1.05}
      #profileView .bbb-career-glance small,#profileView .bbb-career-statgrid small{display:block;color:#799086;font-size:8px;margin-top:5px;line-height:1.35}
      #profileView .bbb-career-statgrid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px;margin-bottom:14px}
      #profileView .bbb-career-statgrid strong{display:block;color:#dce7e1;font-size:16px;line-height:1.05}
      #profileView .bbb-career-split{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(280px,.88fr);gap:10px}
      #profileView .bbb-career-block{border:1px solid #17362a;background:#06110c;border-radius:11px;padding:14px;min-width:0}
      #profileView .bbb-career-block>span{display:block;color:#59dc98;font-size:8px;font-weight:950;letter-spacing:.09em;text-transform:uppercase;margin-bottom:11px}
      #profileView .bbb-career-timeline{display:flex;align-items:stretch;gap:7px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}
      #profileView .bbb-career-timeline::-webkit-scrollbar{display:none}
      #profileView .bbb-career-stop{flex:1 0 120px;display:flex;gap:9px;align-items:center;border:1px solid #143426;background:#07140f;border-radius:9px;padding:10px}
      #profileView .bbb-career-stop img{width:30px;height:30px;object-fit:contain;flex:none}
      #profileView .bbb-career-stop .fallback{width:30px;height:30px;display:grid;place-items:center;border-radius:8px;background:#0a2419;color:#67dfa1;font-size:8px;font-weight:950;flex:none}
      #profileView .bbb-career-stop strong{display:block;color:#dbe6e0;font-size:10px}
      #profileView .bbb-career-stop small{display:block;color:#71877b;font-size:8px;margin-top:2px}
      #profileView .bbb-career-highs{display:grid;gap:7px}
      #profileView .bbb-career-high{border-bottom:1px solid #122c21;padding-bottom:8px}
      #profileView .bbb-career-high:last-child{border:0;padding-bottom:0}
      #profileView .bbb-career-high span{display:block;color:#6a8175;font-size:7px;font-weight:950;text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px}
      #profileView .bbb-career-high strong{display:block;color:#dce7e1;font-size:12px;line-height:1.35}
      #profileView .bbb-career-high small{display:block;color:#7d9287;font-size:8px;margin-top:3px}

      #profileView .bbb-similar-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
      #profileView .bbb-similar-player{display:block;border:1px solid #17362a;background:#06110c;border-radius:11px;padding:13px;text-decoration:none;min-width:0;transition:transform .14s ease,border-color .14s ease,background .14s ease}
      #profileView .bbb-similar-player:hover{transform:translateY(-1px);border-color:#2c6e4d;background:#081812}
      #profileView .bbb-similar-rank{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:12px}
      #profileView .bbb-similar-rank strong{color:#62e09f;font-size:18px}
      #profileView .bbb-similar-rank span{color:#6e8378;font-size:8px;font-weight:900}
      #profileView .bbb-similar-player h3{margin:0;color:#eef5f1;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #profileView .bbb-similar-player p{margin:4px 0 0;color:#82968b;font-size:9px}

      #profileView .bbb-v2-clarity-card.bbb-compact-consensus{padding:15px!important;margin-top:10px!important}
      #profileView .bbb-compact-consensus .bbb-compact-consensus-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:9px}
      #profileView .bbb-compact-consensus .bbb-compact-consensus-head>span:first-child{color:#5bdc99;font-size:8px;font-weight:950;letter-spacing:.1em;text-transform:uppercase}
      #profileView .bbb-compact-consensus-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
      #profileView .bbb-compact-consensus-grid>div{border:1px solid #17362a;background:#06110c;border-radius:9px;padding:10px 12px;min-width:0}
      #profileView .bbb-compact-consensus-grid span{display:block;color:#667c70;font-size:7px;font-weight:950;letter-spacing:.07em;text-transform:uppercase}
      #profileView .bbb-compact-consensus-grid strong{display:block;margin-top:4px;color:#eef5f1;font-size:20px;line-height:1}
      #profileView .bbb-compact-consensus-grid .gap strong.positive{color:#72e1a7}
      #profileView .bbb-compact-consensus-grid .gap strong.negative{color:#ed8a8a}
      #profileView .bbb-compact-consensus-moves{display:flex;gap:13px;align-items:center;flex-wrap:wrap;margin-top:8px;padding:8px 10px;border-left:2px solid #245d42;background:#06110c;border-radius:0 8px 8px 0}
      #profileView .bbb-compact-consensus-moves>span{color:#71877b;font-size:7px;font-weight:900;text-transform:uppercase;letter-spacing:.05em}
      #profileView .bbb-compact-consensus-moves strong{display:inline;color:#a9bbb1;font-size:9px;margin-left:3px}
      #profileView .bbb-compact-consensus-moves strong.up{color:#71dfa5}
      #profileView .bbb-compact-consensus-moves strong.down{color:#ee8a8a}
      #profileView .bbb-compact-consensus-moves strong.neutral{color:#81958a}
      #profileView .bbb-tabs-market{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:7px;font-weight:950;letter-spacing:.04em}
      #profileView .bbb-tabs-market.buy{background:#0a2b1d;color:#74e5a9;border:1px solid #176743}
      #profileView .bbb-tabs-market.fade{background:#351717;color:#f08b8b;border:1px solid #743535}
      #profileView .bbb-tabs-market.market{background:#18201c;color:#aab8b0;border:1px solid #34443b}

      @media(max-width:900px){
        #profileView .bbb-career-glance{grid-template-columns:repeat(2,minmax(0,1fr))}
        #profileView .bbb-career-statgrid{grid-template-columns:repeat(3,minmax(0,1fr))}
        #profileView .bbb-career-split{grid-template-columns:1fr}
        #profileView .bbb-similar-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
      }
      @media(max-width:640px){
        #profileView .${SYSTEM_CLASS}{margin-left:-1px;margin-right:-1px}
        #profileView .bbb-tabs-bar{border-radius:10px;gap:1px;padding:3px}
        #profileView .bbb-tabs-btn{min-height:40px;padding:0 13px;font-size:7px}
        #profileView .bbb-tabs-panel{margin-top:7px}
        #profileView .bbb-career-card{padding:14px!important}
        #profileView .bbb-career-head{display:block;margin-bottom:11px}
        #profileView .bbb-career-head h2{font-size:22px!important}
        #profileView .bbb-career-source{margin-top:8px}
        #profileView .bbb-career-glance{gap:6px}
        #profileView .bbb-career-glance>div,#profileView .bbb-career-statgrid>div{padding:10px}
        #profileView .bbb-career-glance strong{font-size:18px}
        #profileView .bbb-career-statgrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
        #profileView .bbb-career-statgrid strong{font-size:15px}
        #profileView .bbb-career-block{padding:11px}
        #profileView .bbb-career-stop{flex-basis:112px;padding:9px}
        #profileView .bbb-similar-grid{grid-template-columns:1fr 1fr;gap:6px}
        #profileView .bbb-similar-player{padding:11px}
        #profileView .bbb-news-item{grid-template-columns:1fr;gap:5px;padding:11px}
        #profileView .bbb-news-status{width:max-content}
        #profileView .bbb-v2-clarity-card.bbb-compact-consensus{padding:12px!important}
        #profileView .bbb-compact-consensus-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}
        #profileView .bbb-compact-consensus-grid>div{padding:9px}
        #profileView .bbb-compact-consensus-grid strong{font-size:18px}
        #profileView .bbb-compact-consensus-moves{gap:8px;padding:8px}
      }
      @media(max-width:390px){
        #profileView .bbb-similar-grid{grid-template-columns:1fr}
        #profileView .bbb-compact-consensus-grid{grid-template-columns:1fr 1fr}
        #profileView .bbb-compact-consensus-grid .gap{grid-column:1/-1}
      }
    `;
    document.head.appendChild(s);
  }

  function teamSegments(stats){
    const rows=[...(stats||[])].filter(r=>r.team&&n(r.season)!=null).sort((a,b)=>n(a.season)-n(b.season));
    const out=[];
    rows.forEach(r=>{
      const year=n(r.season),team=String(r.team||'').toUpperCase();
      const last=out[out.length-1];
      if(last&&last.team===team){last.end=year;last.games+=(n(r.games)||0);}
      else out.push({team,start:year,end:year,games:n(r.games)||0});
    });
    return out;
  }

  function bestSeason(stats){
    const rows=(stats||[]).filter(r=>n(r.fantasy_points_ppr)!=null);
    return [...rows].sort((a,b)=>(n(b.fantasy_points_ppr)||0)-(n(a.fantasy_points_ppr)||0))[0]||null;
  }
  function bestFinish(stats){
    const rows=(stats||[]).filter(r=>n(r.position_finish)!=null);
    return [...rows].sort((a,b)=>n(a.position_finish)-n(b.position_finish))[0]||null;
  }
  function bestGame(weekly){
    const rows=(weekly||[]).filter(r=>n(r.fantasy_points_ppr)!=null);
    return [...rows].sort((a,b)=>(n(b.fantasy_points_ppr)||0)-(n(a.fantasy_points_ppr)||0))[0]||null;
  }
  function totals(stats,key){return (stats||[]).reduce((sum,row)=>sum+(n(row[key])||0),0)}

  function careerStats(pos,stats){
    if(pos==='QB')return [
      ['Pass Yards',int(totals(stats,'passing_yards'))],['Pass TD',int(totals(stats,'passing_tds'))],
      ['INT',int(totals(stats,'interceptions'))],['Rush Yards',int(totals(stats,'rushing_yards'))],
      ['Rush TD',int(totals(stats,'rushing_tds'))],['Career PPR',dec(totals(stats,'fantasy_points_ppr'),1)]
    ];
    if(pos==='RB')return [
      ['Rush Yards',int(totals(stats,'rushing_yards'))],['Rush TD',int(totals(stats,'rushing_tds'))],
      ['Receptions',int(totals(stats,'receptions'))],['Rec Yards',int(totals(stats,'receiving_yards'))],
      ['Rec TD',int(totals(stats,'receiving_tds'))],['Career PPR',dec(totals(stats,'fantasy_points_ppr'),1)]
    ];
    return [
      ['Targets',int(totals(stats,'targets'))],['Receptions',int(totals(stats,'receptions'))],
      ['Rec Yards',int(totals(stats,'receiving_yards'))],['Rec TD',int(totals(stats,'receiving_tds'))],
      ['Rush Yards',int(totals(stats,'rushing_yards'))],['Career PPR',dec(totals(stats,'fantasy_points_ppr'),1)]
    ];
  }

  function careerCard(player,stats,weekly){
    const pos=String(player?.pos||stats?.[0]?.position||'').toUpperCase();
    const seasons=[...(stats||[])].filter(r=>n(r.season)!=null);
    const seasonYears=seasons.map(r=>n(r.season));
    const segments=teamSegments(seasons);
    const teams=[...new Set(segments.map(x=>x.team))];
    const games=totals(seasons,'games');
    const finish=bestFinish(seasons);
    const peak=bestSeason(seasons);
    const game=bestGame(weekly);
    const first=seasonYears.length?Math.min(...seasonYears):n(player?.draft);
    const last=seasonYears.length?Math.max(...seasonYears):null;
    const draft=n(player?.draft);
    const college=String(player?.college||'').trim();
    const statCards=careerStats(pos,seasons);
    const gameOpp=game?String(game.opponent_team||'').toUpperCase():'';
    const gameWhere=game?`W${esc(game.week)} ${esc(game.season)}${gameOpp?' vs '+esc(gameOpp):''}`:'';

    if(!seasons.length){
      return `<section class="profile-card full bbb-career-card"><div class="profile-card-kicker">CAREER</div><div class="bbb-career-head"><div><h2>Career résumé.</h2><p>Career production will populate once NFL regular-season data is available.</p></div><span class="bbb-career-source">NFLVERSE</span></div></section>`;
    }

    return `<section class="profile-card full bbb-career-card">
      <div class="bbb-career-head">
        <div><div class="profile-card-kicker">CAREER</div><h2>Career résumé.</h2><p>Team path, production totals and career highs without repeating the full season table.</p></div>
        <span class="bbb-career-source">NFLVERSE</span>
      </div>
      <div class="bbb-career-glance">
        <div><span>Seasons w/ Production</span><strong>${seasons.length}</strong><small>${first&&last?esc(first)+(first===last?'':'–'+esc(last)):''}</small></div>
        <div><span>Games</span><strong>${int(games)}</strong><small>Regular season</small></div>
        <div><span>Teams</span><strong>${teams.length}</strong><small>${esc(teams.join(' · ')||'—')}</small></div>
        <div><span>Best Finish</span><strong>${finish&&n(finish.position_finish)!=null?esc(pos)+esc(finish.position_finish):'—'}</strong><small>${finish?esc(finish.season):'No finish yet'}</small></div>
      </div>
      <div class="bbb-career-statgrid">${statCards.map(([label,value])=>`<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}</div>
      <div class="bbb-career-split">
        <div class="bbb-career-block"><span>Production Timeline</span><div class="bbb-career-timeline">${segments.map(seg=>{
          const src=logo(seg.team),years=seg.start===seg.end?seg.start:`${seg.start}–${seg.end}`;
          return `<div class="bbb-career-stop">${src?`<img src="${esc(src)}" alt="${esc(seg.team)} logo" loading="lazy">`:`<span class="fallback">${esc(seg.team)}</span>`}<div><strong>${esc(seg.team)}</strong><small>${esc(years)} · ${int(seg.games)} GP</small></div></div>`;
        }).join('')}</div></div>
        <div class="bbb-career-block"><span>Career Highs & Background</span><div class="bbb-career-highs">
          <div class="bbb-career-high"><span>Peak Fantasy Season</span><strong>${peak?esc(peak.season)+' · '+dec(peak.fantasy_points_ppr,1)+' PPR':'—'}</strong>${peak&&peak.position_finish!=null?`<small>${esc(pos)}${esc(peak.position_finish)} finish</small>`:''}</div>
          <div class="bbb-career-high"><span>Best Fantasy Game</span><strong>${game?dec(game.fantasy_points_ppr,1)+' PPR':'—'}</strong><small>${esc(gameWhere||'Weekly data unavailable')}</small></div>
          <div class="bbb-career-high"><span>Draft / College</span><strong>${draft?esc(draft)+' Draft Class':'Draft data unavailable'}</strong><small>${esc(college||'College not listed')}</small></div>
        </div></div>
      </div>
    </section>`;
  }

  function newsCard(updates){
    const rows=(updates||[]).slice(0,10);
    if(!rows.length)return `<section class="bbb-tab-placeholder"><div class="profile-card-kicker">NEWS</div><h2>No recent player updates.</h2><p>Injury, role, roster and performance updates will appear here as they are added to BBB.</p></section>`;
    return `<section class="profile-card full"><div class="profile-card-kicker">NEWS</div><div class="bbb-career-head"><div><h2>Latest player updates.</h2><p>Recent injury, performance, role and roster developments preserved in Bobby's Big Board.</p></div><span class="bbb-career-source">${rows.length} RECENT</span></div><div class="bbb-news-list">${rows.map(u=>`<div class="bbb-news-item"><time class="bbb-news-date">${esc(date(u.update_date))}</time><div class="bbb-news-copy"><strong>${esc(u.update_type||'Update')}</strong><p>${esc(u.update_text||'')}</p></div>${u.injury_status?`<span class="bbb-news-status">${esc(u.injury_status)}</span>`:''}</div>`).join('')}</div></section>`;
  }

  function similarCard(player){
    const pool=typeof players!=='undefined'&&Array.isArray(players)?players:[];
    const rank=n(player?.rank),age=n(player?.age),pos=String(player?.pos||'').toUpperCase();
    const currentKey=playerKey(player,'');
    const picks=pool.filter(p=>String(p.pos||'').toUpperCase()===pos&&playerKey(p,'')!==currentKey&&n(p.rank)!=null)
      .map(p=>{
        const rankGap=rank==null?0:Math.abs(n(p.rank)-rank);
        const ageGap=age==null||n(p.age)==null?0:Math.abs(n(p.age)-age);
        return {p,score:rankGap+ageGap*4};
      })
      .sort((a,b)=>a.score-b.score||n(a.p.rank)-n(b.p.rank)).slice(0,4).map(x=>x.p);
    if(!picks.length)return `<section class="bbb-tab-placeholder"><div class="profile-card-kicker">SIMILAR PLAYERS</div><h2>No nearby comps yet.</h2><p>Comparable dynasty players will appear here as the board fills out.</p></section>`;
    return `<section class="profile-card full"><div class="profile-card-kicker">SIMILAR PLAYERS</div><div class="bbb-career-head"><div><h2>Nearby dynasty profiles.</h2><p>Same-position players with similar BBB rank and age context. This is a navigation aid, not a film comp.</p></div></div><div class="bbb-similar-grid">${picks.map(p=>{
      const key=playerKey(p,slug(p.name));
      return `<a class="bbb-similar-player" href="/player/${encodeURIComponent(key)}"><div class="bbb-similar-rank"><strong>#${esc(p.rank)}</strong><span>${esc(p.pos||'')}${p.pr??'—'}</span></div><h3>${esc(p.name)}</h3><p>${esc(p.team||'—')} · Age ${p.age??'—'}</p></a>`;
    }).join('')}</div></section>`;
  }

  function compressConsensus(card,mover,player){
    if(!card)return;
    const m=mover||{};
    const bbbRank=n(m.current_rank)??n(player?.rank);
    const marketRank=n(m.current_market_rank)??n(player?.market);
    const gap=n(m.current_gap)??n(player?.gap);
    card.classList.add('bbb-compact-consensus');
    card.innerHTML=`
      <div class="bbb-compact-consensus-head"><span>Value & Consensus</span>${marketBadge(m.market_view||player?.view)}</div>
      <div class="bbb-compact-consensus-grid">
        <div><span>BBB Rank</span><strong>${bbbRank==null?'—':'#'+esc(bbbRank)}</strong></div>
        <div><span>Consensus</span><strong>${marketRank==null||marketRank<=0?'UR':'#'+esc(marketRank)}</strong></div>
        <div class="gap"><span>BBB vs Market</span><strong class="${gap>0?'positive':gap<0?'negative':''}">${gap==null?'—':(gap>0?'+':'')+esc(gap)}</strong></div>
      </div>
      <div class="bbb-compact-consensus-moves">
        <span>BBB 7D ${move(m.bbb_move_7d)}</span><span>BBB 30D ${move(m.bbb_move_30d)}</span><span>Market 7D ${move(m.market_move_7d)}</span><span>Market 30D ${move(m.market_move_30d)}</span>
      </div>`;
  }

  function tabLabel(key){return ({stats:'Stats',gamelog:'Game Log',news:'News',notes:'Notes',career:'Career',similar:'Similar Players'})[key]||key}

  function setActive(system,key,focus=false){
    const btn=system.querySelector(`[data-bbb-tab="${key}"]`);
    const panel=system.querySelector(`[data-bbb-panel="${key}"]`);
    if(!btn||!panel)return;
    system.querySelectorAll('[data-bbb-tab]').forEach(b=>b.setAttribute('aria-selected',String(b===btn)));
    system.querySelectorAll('[data-bbb-panel]').forEach(p=>p.hidden=p!==panel);
    system.dataset.active=key;
    if(focus)btn.focus({preventScroll:true});
  }

  function ensurePanel(system,key){
    let panel=system.querySelector(`[data-bbb-panel="${key}"]`);
    if(!panel){panel=document.createElement('div');panel.className='bbb-tabs-panel';panel.dataset.bbbPanel=key;system.appendChild(panel);}
    return panel;
  }

  function moveExistingCards(grid,system){
    const statsPanel=ensurePanel(system,'stats');
    const gamePanel=ensurePanel(system,'gamelog');
    const notesPanel=ensurePanel(system,'notes');
    const careerPanel=ensurePanel(system,'career');

    const seasonTable=grid.querySelector('.bbb-v2-career-card');
    const game=grid.querySelector('#bbbGameLog');
    const overview=grid.querySelector('.bbb-overview-card');
    const ranking=grid.querySelector('.bbb-ranking-card');
    const timeline=grid.querySelector('.bbb-v2-updates-card');
    const trend=grid.querySelector('.bbb-v2-clarity-card,.bbb-v2-trend-card');

    if(seasonTable&&!statsPanel.contains(seasonTable))statsPanel.appendChild(seasonTable);
    if(game&&!gamePanel.contains(game))gamePanel.appendChild(game);
    if(overview&&!notesPanel.contains(overview))notesPanel.appendChild(overview);
    if(ranking&&!notesPanel.contains(ranking))notesPanel.appendChild(ranking);
    if(timeline)timeline.remove();

    [...grid.children].filter(el=>el.classList?.contains('profile-card')&&el!==trend).forEach(el=>{
      if(!statsPanel.contains(el)&&!gamePanel.contains(el)&&!notesPanel.contains(el)&&!careerPanel.contains(el))notesPanel.appendChild(el);
    });

    return trend;
  }

  function buildSystem(content,grid,player,data){
    let system=content.querySelector('.'+SYSTEM_CLASS);
    if(!system){
      system=document.createElement('section');
      system.className=SYSTEM_CLASS;
      const bar=document.createElement('div');bar.className='bbb-tabs-bar';bar.setAttribute('role','tablist');bar.setAttribute('aria-label','Player profile content');
      ['stats','gamelog','news','notes','career','similar'].forEach((key,i)=>{
        const b=document.createElement('button');b.type='button';b.className='bbb-tabs-btn';b.dataset.bbbTab=key;b.setAttribute('role','tab');b.setAttribute('aria-selected',String(i===0));b.textContent=tabLabel(key);bar.appendChild(b);
      });
      system.appendChild(bar);
      ['stats','gamelog','news','notes','career','similar'].forEach(key=>ensurePanel(system,key));
      content.insertBefore(system,grid);
      bar.addEventListener('click',e=>{const b=e.target.closest('[data-bbb-tab]');if(b)setActive(system,b.dataset.bbbTab)});
      bar.addEventListener('keydown',e=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
        const buttons=[...bar.querySelectorAll('[data-bbb-tab]')],current=buttons.indexOf(document.activeElement);if(current<0)return;
        e.preventDefault();let next=current;
        if(e.key==='ArrowLeft')next=(current-1+buttons.length)%buttons.length;
        if(e.key==='ArrowRight')next=(current+1)%buttons.length;
        if(e.key==='Home')next=0;if(e.key==='End')next=buttons.length-1;
        setActive(system,buttons[next].dataset.bbbTab,true);
      });
    }

    const trend=moveExistingCards(grid,system);
    const news=ensurePanel(system,'news');
    const career=ensurePanel(system,'career');
    const similar=ensurePanel(system,'similar');
    if(!news.dataset.built){news.innerHTML=newsCard(data.updates);news.dataset.built='1';}
    if(!career.dataset.built){career.innerHTML=careerCard(player,data.stats,data.weekly);career.dataset.built='1';}
    if(!similar.dataset.built){similar.innerHTML=similarCard(player);similar.dataset.built='1';}

    const statsPanel=ensurePanel(system,'stats'),gamePanel=ensurePanel(system,'gamelog'),notesPanel=ensurePanel(system,'notes');
    if(!statsPanel.children.length)statsPanel.innerHTML='<section class="bbb-tab-placeholder"><div class="profile-card-kicker">STATS</div><h2>No season stats yet.</h2><p>Season-by-season NFL production will populate automatically when stats become available.</p></section>';
    if(!gamePanel.children.length)gamePanel.innerHTML='<section class="bbb-tab-placeholder"><div class="profile-card-kicker">GAME LOG</div><h2>No game log yet.</h2><p>Weekly NFL production will populate automatically when game data becomes available.</p></section>';
    if(!notesPanel.children.length)notesPanel.innerHTML='<section class="bbb-tab-placeholder"><div class="profile-card-kicker">NOTES</div><h2>No BBB notes yet.</h2><p>Scouting overview and ranking-history notes will appear here when available.</p></section>';

    grid.classList.add('bbb-tabs-grid-managed');

    if(trend){
      compressConsensus(trend,data.mover,player);
      content.appendChild(trend);
    }

    if(!system.dataset.active){
      const preferred=data.stats.length?'stats':notesPanel.children.length?'notes':'career';
      setActive(system,preferred);
    }else setActive(system,system.dataset.active);

    const jump=document.querySelector('#profileMount .bbb-fantasy-jump');
    if(jump&&!jump.dataset.tabsBound){
      jump.dataset.tabsBound='1';
      jump.addEventListener('click',e=>{
        e.preventDefault();setActive(system,'gamelog');
        system.scrollIntoView({behavior:'smooth',block:'start'});
      });
    }
  }

  async function apply(pathSlug){
    const run=++token;
    ensureStyles();
    const player=currentPlayer(pathSlug);if(!player)return;
    const key=playerKey(player,pathSlug);if(!key)return;
    const content=document.querySelector('#profileMount .profile-content>.shell');
    const grid=content?.querySelector('.profile-grid');
    if(!content||!grid)return;
    const data=await loadData(key).catch(()=>({stats:[],weekly:[],mover:null,updates:[]}));
    if(run!==token)return;
    buildSystem(content,grid,player,data);
  }

  function schedule(pathSlug){
    const times=[0,100,260,650,1200,2000];
    times.forEach(ms=>setTimeout(()=>apply(pathSlug),ms));
  }

  ensureStyles();
  if(typeof profileRender==='function'){
    const base=profileRender;
    profileRender=async function(pathSlug){
      const result=await base(pathSlug);
      schedule(pathSlug);
      return result;
    };
  }
  const current=typeof profileNameFromPath==='function'?profileNameFromPath():'';
  if(current)schedule(current);
})();
