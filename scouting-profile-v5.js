/* BBB Scouting V5 — native editorial profile, no embedded legacy site.
   Standalone initializer invoked from scouting-preview.js inside its existing scope. */
window.BBB_PROFILE_V5 = async function(ctx){
 const {app,p,r,g,a,s,sample,photo,videos,prospects,profiles,esc,stat,section,bbbDb,setTitle}=ctx;
 setTitle(p.name+" | Scouting & Film");
 const hasGrade=g?.grade!=null&&Number.isFinite(Number(g.grade));
 const gradeText=hasGrade?Number(g.grade).toFixed(1):"Not graded";
 const traits=Object.entries(g?.traits||{}).map(([name,val])=>({name,val:Number(val)})).filter(x=>Number.isFinite(x.val)&&x.val>=0);
 const range=entry=>(/^(speed|acceleration|analytics)$/i.test(entry.name)||entry.val>5)?10:5;
 const fieldTraits=traits.filter(x=>!/projected draft capital/i.test(x.name));
 const capTrait=traits.find(x=>/projected draft capital/i.test(x.name));
 const statsLabel=p.pos==="QB"?"Passing yards":p.pos==="RB"?"Rushing yards":"Receiving yards";
 const isProspect=(Number(g?.year||p.draft_year)>=2027);
 const V6=window.BBB_SCOUTING_V6;
 const report=s?.scouting_summary||p.overall_breakdown||"A complete player scouting evaluation has not been published yet. Statistics and film will be added as they are verified.";
 const height=x=>x==null?"Not recorded":Math.floor(Number(x)/12)+"′"+(Number(x)%12)+"″";
 const display=n=>n==null?"—":Number(n).toLocaleString("en-US",{maximumFractionDigits:1});
 const head=photo?'<img class="sp-player-image" src="'+esc(photo)+'" alt="'+esc(p.name)+' player portrait" onerror="this.remove()">':'';
 const initials=String(p.name||"").split(/\s+/).slice(0,2).map(x=>x[0]).join("");
 const profileTag=(t,v)=>'<div class="sp-detail"><span>'+esc(t)+'</span><strong>'+esc(v)+'</strong></div>';
 const imageSource=a?.source_url?'<a target="_blank" rel="noopener noreferrer" href="'+esc(a.source_url)+'">'+esc(a.source_name||"Testing source")+' ↗</a>':esc(a?.source_name||"BBB verified testing database");
 const measured=[
  {key:"forty_seconds",label:"40-YARD DASH",unit:"sec",format:v=>Number(v).toFixed(2),lo:4,hi:6,reverse:true},
  {key:"ten_split_seconds",label:"10-YD SPLIT",unit:"sec",format:v=>Number(v).toFixed(2),lo:1.3,hi:1.9,reverse:true},
  {key:"vertical_in",label:"VERTICAL JUMP",unit:"in",format:v=>display(v),lo:20,hi:45},
  {key:"broad_in",label:"BROAD JUMP",unit:"in",format:v=>display(v),lo:95,hi:145},
  {key:"three_cone_seconds",label:"3-CONE",unit:"sec",format:v=>Number(v).toFixed(2),lo:6.5,hi:8.5,reverse:true},
  {key:"shuttle_seconds",label:"20-YD SHUTTLE",unit:"sec",format:v=>Number(v).toFixed(2),lo:3.6,hi:5.2,reverse:true},
  {key:"bench_reps",label:"BENCH REPS",unit:"reps",format:v=>display(v),lo:0,hi:40}
 ];
 const bar=({name,val},i)=>{
  const max=range({name,val}),pct=Math.max(0,Math.min(100,Number(val)/max*100));
  return '<div class="sp-grade-row"><div class="sp-grade-text"><span>'+esc(name)+'</span><strong>'+esc(display(val))+' <small>/ '+max+'</small></strong></div><div class="sp-grade-track" role="img" aria-label="'+esc(name)+': '+esc(display(val))+' out of '+max+'"><div class="sp-grade-fill" style="width:'+pct.toFixed(1)+'%"></div></div></div>';
 };
 const athletics=()=>{
  let tested=measured.filter(d=>a?.[d.key]!=null);
  const movementTraits=fieldTraits.filter(x=>/^(speed|acceleration|agility|change of direction|deceleration)$/i.test(x.name));
  const metrics=tested.map(d=>{
   const value=Number(a[d.key]),pct=d.reverse?(d.hi-value)/(d.hi-d.lo):(value-d.lo)/(d.hi-d.lo),safe=Math.max(0,Math.min(100,pct*100));
   return '<div class="sp-athletic-row"><div class="sp-athletic-number"><span>'+esc(d.label)+'</span><strong>'+esc(d.format(value))+' <small>'+esc(d.unit)+'</small></strong></div><div class="sp-athletic-range"><div class="sp-athletic-marker" style="left:'+safe.toFixed(2)+'%"></div><div class="sp-range-fill" style="width:'+safe.toFixed(2)+'%"></div></div><div class="sp-range-ends"><span>'+d.lo+'</span><span>'+d.hi+'</span></div></div>';
  }).join("");
  return '<div class="sp-panel sp-athletics"><div class="sp-panel-head"><div><div class="sp-kicker">TESTING PROFILE</div><h2>How he measures up.</h2><p>Verified measurements, presented on labeled display scales.</p></div></div>'+
   '<div class="sp-physical"><div>'+profileTag("HEIGHT",height(a?.height_in))+'</div><div>'+profileTag("WEIGHT",a?.weight_lb==null?"Not recorded":display(a.weight_lb)+" lbs")+'</div><div>'+profileTag("HAND",a?.hand_in==null?"Not recorded":display(a.hand_in)+" in")+'</div><div>'+profileTag("ARM",a?.arm_in==null?"Not recorded":display(a.arm_in)+" in")+'</div></div>'+
   (tested.length?'<div class="sp-athletic-chart">'+metrics+'</div>':'<div class="sp-no-data">No verified timed/jump drill results are recorded. This is expected for many college prospects before the NFL Combine.</div>')+
   (a?.forty_seconds&&a?.weight_lb?'<div class="sp-speed-score"><strong>'+(Number(a.weight_lb)*200/Math.pow(Number(a.forty_seconds),4)).toFixed(1)+'</strong><span><b>Weight-adjusted Speed Score</b><br>Calculated from weight × 200 ÷ 40 time⁴ (Barnwell formula). Independent BBB calculation, not a PlayerProfiler percentile.</span></div>':'')+
   (movementTraits.length?'<div class="sp-movement"><div class="sp-kicker">FILM-BASED ATHLETIC TRAITS</div><h3>Movement evaluation</h3><p class="sp-caption" style="margin:0 0 18px">BBB scouting grades, not measured combine times.</p><div class="sp-grading-list">'+movementTraits.map(bar).join('')+'</div></div>':'')+
   '<p class="sp-caption">Bar position shows a measurement within its labeled display range, <b>not a player percentile or athleticism score.</b> Faster times appear farther right. <span class="sp-test-source">'+(a?imageSource:'Source pending')+'</span></p></div>';
 };
 const grading=()=>'<div class="sp-panel"><div class="sp-panel-head"><div><div class="sp-kicker">BBB PLAYER EVALUATION</div><h2>Individual prospect grades.</h2><p>Recorded scouting traits from Bobby’s Big Board, kept on their original grading scales.</p></div><div class="sp-overall-grade"><span>OVERALL GRADE</span><strong>'+esc(gradeText)+'</strong></div></div>'+
  (fieldTraits.length?'<div class="sp-grading-list">'+fieldTraits.map(bar).join('')+'</div>':'<div class="sp-no-data">No individual prospect grades have been recorded for this player. Film notes and season data are still available.</div>')+
  (capTrait?'<div class="sp-grading-context">'+bar(capTrait)+'</div>':'')+
  '<p class="sp-caption">Speed, Acceleration and Analytics use 10-point scales; other recorded traits use 5-point scales. Draft capital is shown separately because it is not an on-field skill.</p></div>';
 const film=()=>window.BBB_FILM_ROOM.profileMarkup(videos,p,esc)+
  (sample?.clips?.length?'<div class="sp-panel sp-film-notes" style="margin-top:15px"><div class="sp-kicker">EDITORIAL NOTEBOOK</div><h3>Selected play observations <span>Draft only</span></h3><p class="sp-caption">These notes have not been published as a final scouting evaluation.</p>'+sample.clips.map((clip,i)=>'<div class="sp-film-clip"><span>PLAY '+(i+1)+' · '+esc(clip[0])+'</span><strong>'+esc(clip[1])+'</strong><p>'+esc(clip[2])+'</p></div>').join('')+'</div>':'');
 const emptyStats=()=>'<div class="sp-no-data">No NFL statistics are recorded yet for this player. Draft prospects will receive an NFL game log once they enter the league.</div>';
 const statsUI=()=>'<div class="sp-panel"><div class="sp-panel-head"><div><div class="sp-kicker">ON-FIELD PRODUCTION</div><h2>Season stats & game logs.</h2><p>Season-by-season production, plus weekly game detail when available.</p></div></div><div id="spStats">'+(isProspect?emptyStats():'Loading recorded NFL seasons…')+'</div><div id="spWeeks"></div></div>';
 const dyn=()=>{
  if(!r)return '<div class="sp-panel"><div class="sp-panel-head"><div><div class="sp-kicker">DYNASTY SNAPSHOT</div><h2>Dynasty value & market.</h2></div></div><div class="sp-no-data">This player is not currently on the BBB Top 500 dynasty board. His scouting profile remains available.</div></div>';
  const gap=r.market==null?null:Number(r.rank)-Number(r.market);
  const marketText=gap==null?"Market data not recorded":gap===0?"Aligned with market":gap>0?gap+" spots below the market":Math.abs(gap)+" spots above the market";
  const rankDate=r.weekly_update_date?new Date(r.weekly_update_date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"";
  const note=window.BBB_PUBLIC_COPY.clean(r.latest_update||p.latest_weekly_update||"");
  const summary=String(r.overview||p.overall_breakdown||"").trim();
  const strip=(label,val)=>'<div class="sp-dyn-stat"><span>'+esc(label)+'</span><strong>'+esc(val)+'</strong></div>';
  const progress=Math.max(0,100-Number(r.rank)/500*100);
  return '<div class="sp-panel sp-dynasty-snapshot"><div class="sp-panel-head"><div><div class="sp-kicker">BBB DYNASTY PLAYER SNAPSHOT</div><h2>'+esc(p.name)+' · Dynasty outlook</h2><p>Live ranking data from the same Top 500 board as the classic player profile.</p></div><a class="sp-dyn-profile-link" href="/player/'+encodeURIComponent(p.player_key)+'">Classic full profile ↗</a></div>'+
  '<div class="sp-dyn-hero"><div class="sp-dyn-rank"><span>SUPERFLEX RANK</span><strong>#'+esc(r.rank)+'</strong><small>Top 500</small><div class="sp-dyn-rank-track"><i style="width:'+progress.toFixed(1)+'%"></i></div></div><div class="sp-dyn-summary"><span class="sp-kicker">MARKET POSITION</span><h3>'+esc(marketText)+'</h3><p>BBB: #'+esc(r.rank)+(r.market!=null?' · Market: #'+esc(r.market):' · Market rank unavailable')+'. Smaller ranking numbers indicate higher value.</p></div></div>'+
  '<div class="sp-dyn-statgrid">'+strip("POSITION RANK",p.pos+(r.pr||"—"))+strip("DYNASTY TIER",r.tier?"Tier "+r.tier:"Not assigned")+strip("MARKET RANK",r.market==null?"Not recorded":"#"+r.market)+strip("AGE",r.age==null?"Not recorded":String(r.age))+strip("TEAM",r.team||"Not recorded")+'</div>'+
  (summary?'<div class="sp-dyn-editorial"><span class="sp-kicker">BOBBY’S EVALUATION</span><p>'+esc(summary)+'</p></div>':'')+
  (note?'<div class="sp-dyn-editorial update"><span class="sp-kicker">RECENT DYNASTY CONTEXT'+(rankDate?" · "+esc(rankDate):"")+'</span><p>'+esc(note)+'</p></div>':'')+
  '<div class="sp-dyn-actions"><a class="sp-link" href="/dynasty/rankings">Explore Top 500 rankings →</a><a class="sp-link secondary" href="/dynasty/compare?left='+encodeURIComponent(p.player_key)+'">Compare this player →</a></div>'+
  '<p class="sp-caption">Market comparison is contextual, not a consensus grade. BBB rankings and scouting grades are independent evaluations.</p></div>';
 };
 app.innerHTML='<section class="sp-profile"><div class="wrap"><div class="sp-crumb"><a href="/players">Players</a> <span>›</span> '+esc(p.pos||"")+' <span>›</span> '+esc(p.name)+'</div>'+
  '<div class="sp-hero"><div class="sp-portrait">'+head+'<span class="sp-portrait-fallback">'+esc(initials)+'</span></div><div class="sp-hero-content"><div class="sp-kicker">PLAYER EVALUATION · BOBBY’S BIG BOARD</div><h1>'+esc(p.name)+'</h1><p class="sp-identity">'+esc(p.pos||"")+' <span>·</span> '+esc(p.team||"Draft Prospect")+' <span>·</span> '+esc(p.college||"College not recorded")+'</p><div class="sp-measure-strip" aria-label="Player height and weight"><div class="sp-measure-quick"><span>HEIGHT</span><strong>'+esc(height(a?.height_in))+'</strong></div><div class="sp-measure-quick"><span>WEIGHT</span><strong>'+esc(a?.weight_lb==null?"Not recorded":display(a.weight_lb)+" lbs")+'</strong></div></div><div class="sp-hero-tags"><span class="sp-overall-chip">PROSPECT GRADE <strong>'+esc(gradeText)+'</strong></span>'+(g?.comp?'<span>PRO COMP <strong>'+esc(g.comp)+'</strong></span>':'')+(g?.year?'<span>CLASS <strong>'+esc(g.year)+'</strong></span>':'')+(r?'<span>DYNASTY <strong>#'+esc(r.rank)+'</strong></span>':'')+'</div></div></div>'+
  '<div class="sp-tabs" role="tablist" aria-label="Player profile sections"><button type="button" class="sp-tab active" data-tab="overview" role="tab" aria-selected="true">Overview</button><button type="button" class="sp-tab" data-tab="traits" role="tab" aria-selected="false">Prospect Grades</button><button type="button" class="sp-tab" data-tab="athletic" role="tab" aria-selected="false">Athletic Profile</button><button type="button" class="sp-tab" data-tab="film" role="tab" aria-selected="false">Film Room</button><button type="button" class="sp-tab" data-tab="stats" role="tab" aria-selected="false">Stats & Logs</button><button type="button" class="sp-tab" data-tab="advanced" role="tab" aria-selected="false">Advanced Stats</button><button type="button" class="sp-tab" data-tab="dynasty" role="tab" aria-selected="false">Dynasty</button></div>'+
  '<div class="sp-tab-content active" data-content="overview" role="tabpanel">'+V6.overview({p,g,s,report,r,sample,prospects,videos,esc})+'</div>'+
  '<div class="sp-tab-content" data-content="traits" role="tabpanel">'+grading()+'</div>'+
  '<div class="sp-tab-content" data-content="athletic" role="tabpanel">'+athletics()+'</div>'+
  '<div class="sp-tab-content" data-content="film" role="tabpanel">'+film()+'</div>'+
  '<div class="sp-tab-content" data-content="stats" role="tabpanel">'+statsUI()+'</div>'+
  '<div class="sp-tab-content" data-content="advanced" role="tabpanel"><div class="sp-panel" id="spAdvancedPanel"><div class="sp-muted">Loading recorded NFL advanced receiving metrics…</div></div></div>'+
  '<div class="sp-tab-content" data-content="dynasty" role="tabpanel">'+dyn()+'</div>'+
  '</div></section>';
 window.BBB_FILM_ROOM.bindProfile(app,videos,esc);
 const tabs=Array.from(app.querySelectorAll(".sp-tab"));
 const showTab=tab=>{
  tabs.forEach(el=>{const on=el.dataset.tab===tab;el.classList.toggle("active",on);el.setAttribute("aria-selected",String(on))});
  app.querySelectorAll(".sp-tab-content").forEach(el=>el.classList.toggle("active",el.dataset.content===tab));
 };
 tabs.forEach(button=>button.addEventListener("click",()=>{showTab(button.dataset.tab);if(button.dataset.tab==="stats")loadStats();if(button.dataset.tab==="advanced")loadAdvanced();}));
 app.querySelectorAll("[data-profile-tab]").forEach(button=>button.addEventListener("click",()=>{const target=button.dataset.profileTab;showTab(target);if(target==="advanced")loadAdvanced();if(target==="stats")loadStats();app.querySelector(".sp-tabs")?.scrollIntoView({behavior:"smooth",block:"start"});}));
 let loaded=false;
 let advancedLoaded=false;
 const loadAdvanced=async()=>{
  if(advancedLoaded)return;advancedLoaded=true;
  const quick=app.querySelector("#spOverviewAdvanced"),full=app.querySelector("#spAdvancedPanel");
  try{
   const rows=await bbbDb("site_player_advanced_season","select=*&player_key=eq."+encodeURIComponent(p.player_key)+"&order=season.desc&limit=1");
   const row=rows?.[0]||null;
   let peers=[];if(row)try{peers=await bbbDb("site_player_advanced_season","select=*&season=eq."+encodeURIComponent(row.season)+"&limit=1000")}catch(e){console.warn("Advanced peers unavailable",e)}
   const positionByKey=new Map((profiles||[]).map(x=>[x.player_key,x.pos]));
   const peersAtPosition=peers.filter(x=>positionByKey.get(x.player_key)===p.pos);
   if(quick)quick.innerHTML=V6.advancedHTML(row,esc,true,peersAtPosition,p.pos);
   if(full)full.innerHTML=V6.advancedHTML(row,esc,false,peersAtPosition,p.pos);
  }catch(err){console.warn("Advanced stats unavailable",err);if(quick)quick.innerHTML='<div class="sp-muted">Recorded advanced stats are temporarily unavailable.</div>';if(full)full.innerHTML='<div class="sp-no-data">Advanced stats are temporarily unavailable.</div>'}
 };
 loadAdvanced();
 const loadStats=async()=>{
  if(loaded)return;loaded=true;
  const mount=app.querySelector("#spStats"),weeks=app.querySelector("#spWeeks");if(!mount)return;
  try{
   const seasons=await bbbDb("site_player_season_stats","select=season,games,targets,receptions,receiving_yards,receiving_tds,carries,rushing_yards,rushing_tds,passing_yards,passing_tds,attempts,completions,interceptions,fantasy_points_ppr,position_finish&player_key=eq."+encodeURIComponent(p.player_key)+"&order=season.desc&limit=18");
   if(!seasons?.length){mount.innerHTML=emptyStats();return}
   const fmt=(value,dec=0)=>value==null?"—":Number(value).toLocaleString("en-US",{maximumFractionDigits:dec});
   const pos=p.pos||"WR";
   const isQB=pos==="QB",isRB=pos==="RB";
   const statDefs=(isQB?[
    ["PASSING","completions","CMP"],["PASSING","attempts","ATT"],["PASSING","passing_yards","PASS YDS"],["PASSING","passing_tds","PASS TD"],["PASSING","interceptions","INT"],
    ["RUSHING","carries","CAR"],["RUSHING","rushing_yards","RUSH YDS"],["RUSHING","rushing_tds","RUSH TD"]
   ]:isRB?[
    ["RUSHING","carries","CAR"],["RUSHING","rushing_yards","RUSH YDS"],["RUSHING","rushing_tds","RUSH TD"],
    ["RECEIVING","targets","TGT"],["RECEIVING","receptions","REC"],["RECEIVING","receiving_yards","REC YDS"],["RECEIVING","receiving_tds","REC TD"]
   ]:[
    ["RECEIVING","targets","TGT"],["RECEIVING","receptions","REC"],["RECEIVING","receiving_yards","REC YDS"],["RECEIVING","receiving_tds","REC TD"],
    ["RUSHING","carries","CAR"],["RUSHING","rushing_yards","RUSH YDS"],["RUSHING","rushing_tds","RUSH TD"]
   ]).filter(([group])=>group!=="RUSHING"||isQB||isRB||seasons.some(s=>Number(s.carries||0)>0));
   const maxByKey={};for(const row of seasons)for(const [,key] of statDefs){const n=Number(row[key]);if(row[key]!=null&&Number.isFinite(n))maxByKey[key]=Math.max(maxByKey[key]??-Infinity,n)}
   const tone=(key,value,maximum)=>{if(value==null||!Number.isFinite(Number(value)))return "";const n=Number(value);if(/_tds$/.test(key)&&n===0)return "sp-stat-zero";if(maximum!=null&&n===maximum&&n>0)return "sp-stat-best";if(/_tds$/.test(key)&&n>0)return "sp-stat-positive";return ""};
   const cell=(key,label,value,max)=>'<div class="sp-stat-cell '+tone(key,value,max)+'"><span>'+esc(label)+'</span><strong>'+esc(fmt(value,key==="fantasy_points_ppr"?1:0))+'</strong></div>';
   const seasonCard=row=>{
    const groups=[...new Set(statDefs.map(x=>x[0]))].map(group=>'<div class="sp-season-group"><div class="sp-stat-group-title">'+esc(group)+'</div><div class="sp-season-metrics">'+statDefs.filter(x=>x[0]===group).map(([,key,label])=>cell(key,label,row[key],maxByKey[key])).join("")+'</div></div>').join("");
    return '<article class="sp-season-card"><div class="sp-season-cardhead"><div><strong>'+esc(row.season)+'</strong><span>'+esc(fmt(row.games))+' games'+(row.position_finish!=null?' · '+esc(pos)+esc(row.position_finish)+' PPR finish':'')+'</span></div><div class="sp-season-ppr">PPR <b>'+esc(fmt(row.fantasy_points_ppr,1))+'</b></div></div>'+groups+'</article>';
   };
   const current=seasons[0],heroFields=isQB?[["passing_yards","PASS YDS"],["passing_tds","PASS TD"],["rushing_yards","RUSH YDS"],["rushing_tds","RUSH TD"]]:isRB?[["rushing_yards","RUSH YDS"],["rushing_tds","RUSH TD"],["receiving_yards","REC YDS"],["receiving_tds","REC TD"]]:[["targets","TARGETS"],["receptions","RECEPTIONS"],["receiving_yards","REC YDS"],["receiving_tds","REC TD"]];
   mount.innerHTML='<div class="sp-season-lead"><span class="sp-kicker">'+esc(current.season)+' · LATEST RECORDED SEASON</span><div class="sp-season-quick">'+heroFields.map(([key,label])=>cell(key,label,current[key],maxByKey[key])).join("")+'</div></div><div class="sp-stats-legend"><span class="sp-legend-best">● Season high</span><span class="sp-legend-positive">● Other TD total</span><span class="sp-legend-zero">● Zero touchdowns</span><span>— Not recorded</span></div><div class="sp-season-list">'+seasons.map(seasonCard).join("")+'</div><p class="sp-caption">Green is this player’s highest recorded season for that category, not a league percentile. Current seasons may be incomplete. Zero TDs are red; unavailable stats are never treated as zero.</p>';
   if(!weeks)return;
   try{
    const games=await bbbDb("site_player_weekly_stats","select=season,week,opponent_team,completions,attempts,passing_yards,passing_tds,interceptions,carries,rushing_yards,rushing_tds,targets,receptions,receiving_yards,receiving_tds,fantasy_points_ppr,weekly_position_finish&player_key=eq."+encodeURIComponent(p.player_key)+"&order=season.desc,week.desc&limit=18");
    if(!games?.length){weeks.innerHTML='<div class="sp-no-data">No NFL weekly game logs are available yet.</div>';return}
    const statMax={};for(const game of games)for(const key of ["passing_yards","passing_tds","rushing_yards","rushing_tds","receiving_yards","receiving_tds"]){const n=Number(game[key]);if(game[key]!=null&&Number.isFinite(n))statMax[key]=Math.max(statMax[key]??-Infinity,n)}
    const mini=(key,label,value)=>cell(key,label,value,statMax[key]);
    const gameCard=game=>{
     const groups=isQB?[
      ["PASSING",[["completions","CMP"],["attempts","ATT"],["passing_yards","YDS"],["passing_tds","TD"],["interceptions","INT"]]],
      ["RUSHING",[["carries","CAR"],["rushing_yards","YDS"],["rushing_tds","TD"]]]
     ]:isRB?[
      ["RUSHING",[["carries","CAR"],["rushing_yards","YDS"],["rushing_tds","TD"]]],
      ["RECEIVING",[["targets","TGT"],["receptions","REC"],["receiving_yards","YDS"],["receiving_tds","TD"]]]
     ]:[
      ["RECEIVING",[["targets","TGT"],["receptions","REC"],["receiving_yards","YDS"],["receiving_tds","TD"]]],
      ["RUSHING",[["carries","CAR"],["rushing_yards","YDS"],["rushing_tds","TD"]]]
     ];
     const visibleGroups=groups.filter(([name])=>name!=="RUSHING"||isQB||isRB||Number(game.carries||0)>0);
     return '<article class="sp-game-card"><header class="sp-game-head"><div><small>'+esc(game.season)+' SEASON</small><h4>Week '+esc(game.week)+' <span>vs '+esc(game.opponent_team||"—")+'</span></h4></div><div class="sp-game-ppr"><span>PPR POINTS</span><strong>'+esc(fmt(game.fantasy_points_ppr,1))+'</strong>'+(game.weekly_position_finish!=null?'<small>'+esc(pos)+esc(game.weekly_position_finish)+' WEEKLY FINISH</small>':'')+'</div></header>'+
      visibleGroups.map(([name,fields])=>'<div class="sp-game-statgroup"><div class="sp-stat-group-title">'+name+'</div><div class="sp-game-metrics">'+fields.map(([key,label])=>mini(key,label,game[key])).join("")+'</div></div>').join("")+'</article>';
    };
    weeks.innerHTML='<div class="sp-games-heading"><div><div class="sp-kicker">WEEK BY WEEK</div><h3>Recent game logs</h3><p>Targets, catches, carries, yards, touchdowns and fantasy points — no sideways scrolling.</p></div><span>'+games.length+' recorded games</span></div><div class="sp-game-list">'+games.map(gameCard).join("")+'</div><p class="sp-caption">Green weekly values mark the highest of the games shown; zero TDs are red. Game logs show recorded production only.</p>';
   }catch(error){console.warn("Game logs unavailable",error);weeks.innerHTML='<div class="sp-no-data">Game-by-game statistics are temporarily unavailable. Season numbers above are unaffected.</div>'}
  }catch(error){console.warn("Season stats unavailable",error);mount.innerHTML='<div class="sp-no-data">Season statistics could not be loaded right now. Try refreshing the page.</div>'}
 };
 if(location.hash){const requested=location.hash.slice(1);if(["overview","traits","athletic","film","stats","advanced","dynasty"].includes(requested)){showTab(requested);if(requested==="stats")loadStats();if(requested==="advanced")loadAdvanced()}}
};