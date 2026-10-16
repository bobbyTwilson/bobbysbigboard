/* BBB V6: scouting overview and advanced production — reuse verified BBB data,
   keep raw combine results, historical prospect evaluations and dynasty value distinct. */
window.BBB_SCOUTING_V6 = {
 overview(ctx){
  const {p,g,s,report,r,sample,prospects,videos,esc}=ctx;
  const classYear=Number(g?.year),position=String(g?.pos||p.pos||"");
  const classRows=(prospects||[]).filter(x=>Number(x.year)===classYear&&x.grade!=null&&Number.isFinite(Number(x.grade))).sort((a,b)=>Number(b.grade)-Number(a.grade));
  const byPosition=classRows.filter(x=>x.pos===position);
  const place=arr=>{const n=arr.findIndex(x=>x.player_key===p.player_key);return n<0?null:1+arr.slice(0,n).filter(x=>Number(x.grade)>Number(g.grade)).length};
  const overall=place(classRows),posRank=place(byPosition),isRanked=overall!=null&&posRank!=null;
  const tag=(str)=>esc(str);
  const all=Object.entries(g?.traits||{}).map(([name,v])=>{
   const val=Number(v), max=/\(10\)/.test(name)||/^(speed|acceleration|analytics)$/i.test(name)||val>5?10:5;
   return {name,grade:val,max,pct:val/max}
  }).filter(x=>Number.isFinite(x.grade)&&x.grade>=0&&!/draft capital/i.test(x.name));
  all.sort((a,b)=>b.pct-a.pct||b.grade-a.grade);
  const strengths=all.filter(v=>!/^(analytics|dawg factor)$/i.test(v.name)).slice(0,3);
  const watch=all.slice(-2).reverse();
  const label=(v)=>v.max===10?v.grade.toFixed(1)+"/10":v.grade.toFixed(1)+"/5";
  const row=(x,i)=>'<div class="sp-scout-item"><span class="sp-scout-index">'+(i+1).toString().padStart(2,"0")+'</span><div><strong>'+esc(x.name)+'</strong><small>BBB graded '+label(x)+'</small></div></div>';
  const approvedStrengths=s?.strengths?.length?s.strengths:(!all.length?sample?.traits||[]:[]);
  const card=(title,sub,items,isWatch)=>'<div class="sp-insight-card '+(isWatch?'watch':'')+'"><div class="sp-insight-head"><span class="sp-kicker">'+(isWatch?'DEVELOPMENT':'SCOUTING STRENGTHS')+'</span><h3>'+title+'</h3><p>'+sub+'</p></div>'+(items.length?'<div class="sp-scout-items">'+items.map(row).join('')+'</div>':'<div class="sp-no-data">'+(isWatch?'No finalized developmental assessment has been recorded yet.':'No individual scouting strengths have been graded yet.')+'</div>')+'</div>';
  const pros=all.length?card('Where he wins.','The strongest individual traits on his recorded BBB grading sheet.',strengths,false):'<div class="sp-insight-card"><span class="sp-kicker">WHAT STANDS OUT</span><h3>Where he wins.</h3>'+(approvedStrengths.length?'<ul class="sp-simple-list">'+approvedStrengths.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<div class="sp-no-data">Awaiting scouting evaluation.</div>')+'</div>';
  const cons=watch.length?card('Areas to sharpen.','Lowest relative grades within this player’s own scouting profile—not necessarily weaknesses.',watch,true):'<div class="sp-insight-card watch"><span class="sp-kicker">DEVELOPMENT WATCH</span><h3>What comes next.</h3>'+(s?.development_areas?.length?'<ul class="sp-simple-list">'+s.development_areas.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<div class="sp-no-data">No reviewed developmental notes yet. We won’t invent a weakness.</div>')+'</div>';
  const ranks=isRanked?'<div class="sp-draft-rank"><div class="sp-kicker">BBB '+classYear+' SCOUTING BOARD</div><div class="sp-rank-values"><strong>'+position+posRank+'</strong><span>#'+overall+' overall</span></div><p>Among '+byPosition.length+' graded '+position+'s and '+classRows.length+' total graded '+classYear+' prospects. This is BBB’s board, not a consensus ranking.</p><a href="/draft">View the draft board →</a></div>':
   '<div class="sp-draft-rank"><div class="sp-kicker">'+(r?'CURRENT NFL EVALUATION':'SCOUTING COVERAGE')+'</div><div class="sp-rank-values"><strong>'+(r?'BBB #'+r.rank:'In development')+'</strong></div><p>'+(r?'Dynasty ranking is separate from on-field film grades.':'Class ranking appears when a player has a saved, graded draft evaluation.')+'</p></div>';
  const hasVideo=videos?.length>0;
  return '<div class="sp-overview-v6"><div class="sp-overview-top"><div class="sp-panel sp-verdict"><div class="sp-kicker">THE BBB SCOUTING REPORT</div><h2>What the film tells us.</h2><p class="sp-report">'+esc(report)+'</p>'+(p.latest_weekly_update?'<div class="sp-latest"><strong>Latest update</strong><p>'+esc(p.latest_weekly_update)+'</p></div>':'')+'<div class="sp-report-actions"><button class="sp-quicklink" data-profile-tab="film" type="button">Review Film Room →</button><button class="sp-quicklink" data-profile-tab="traits" type="button">View Individual Grades →</button></div></div><div class="sp-overview-right">'+ranks+'<div class="sp-overview-pulse"><div class="sp-kicker">SEASON INTELLIGENCE</div><h3>Inside the numbers.</h3><div id="spOverviewAdvanced"><div class="sp-muted">NFL advanced data loads when available. College prospects will have a separate college-stat pipeline.</div></div><button class="sp-quicklink" type="button" data-profile-tab="advanced">Full advanced statistics →</button></div></div></div><div class="sp-insights">'+pros+cons+'</div>'+
  '<div class="sp-overview-foot"><div><div class="sp-kicker">FILM LIBRARY</div><h3>'+(hasVideo?'Breakdowns are ready to watch.':'The scouting film room is growing.')+'</h3><p>'+(hasVideo?videos.length+' published film video'+(videos.length===1?'':'s')+' attached to this player.':'No published film breakdown is attached yet. New videos will appear when released.')+'</p></div><button class="sp-quicklink" type="button" data-profile-tab="film">Explore Film Room →</button></div></div>';
 },
 advancedHTML(row,esc,compact){
  if(!row)return '<div class="sp-no-data">Advanced NFL receiving metrics are not available for this player yet.</div>';
  const n=(key,dec=0)=>row[key]==null?'—':Number(row[key]).toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec});
  const arr=[
   ['Air yards',n('receiving_air_yards'),'Targeted distance downfield'],
   ['Yards after catch',n('receiving_yards_after_catch'),'Recorded YAC'],
   ['Receiving first downs',n('receiving_first_downs'),'Converted first downs'],
   ['Receiving EPA',n('receiving_epa',2),'Expected-points added on receiving plays'],
   ['Avg. weekly target share',n('average_weekly_target_share_pct',1)+'%','Unweighted average of reported weekly target shares'],
   ['Avg. weekly air-yard share',n('average_weekly_air_yards_share_pct',1)+'%','Unweighted average of reported weekly air-yard shares']
  ];
  if(compact){
   const found=[arr[0],arr[1],arr[4]].filter(x=>x[1]!=='—');
   return '<div class="sp-pulse-stats">'+found.map(x=>'<div><strong>'+esc(x[1])+'</strong><small>'+esc(x[0])+'</small></div>').join('')+'</div><p class="sp-caption">2026 through '+esc(row.weekly_rows)+' recorded games · nflverse/BBB weekly data</p>';
  }
  const ypr=row.targets?Number(row.receiving_yards)/Number(row.targets):null;
  const yacPer=row.receptions?Number(row.receiving_yards_after_catch)/Number(row.receptions):null;
  if(ypr!=null)arr.push(['Yards per target',ypr.toFixed(1),'Derived from receiving yards ÷ targets']);
  if(yacPer!=null)arr.push(['YAC per reception',yacPer.toFixed(1),'Derived from receiving YAC ÷ receptions']);
  return '<div class="sp-adv-heading"><div><span class="sp-kicker">RECORDED NFL PRODUCTION</span><h2>'+esc(String(row.season))+' advanced receiving profile</h2><p>Source: BBB game pipeline (nflverse-derived). '+esc(row.weekly_rows)+' weekly records; raw air-yard coverage '+esc(row.air_yards_covered_weeks)+'/'+esc(row.weekly_rows)+'.</p></div></div>'+
   '<div class="sp-advanced-grid">'+arr.map(x=>'<div class="sp-adv-metric"><span>'+esc(x[0])+'</span><strong>'+esc(x[1])+'</strong><small>'+esc(x[2])+'</small></div>').join('')+'</div>'+
   '<p class="sp-caption">Only recorded/derived metrics are shown. Yards per route run, route win rate, PlayerProfiler workout scores, and percentile rankings require separate tracked inputs or licensed methodologies and are not inferred here.</p>';
 }
};