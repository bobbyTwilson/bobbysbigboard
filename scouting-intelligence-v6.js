/* Public-facing editorial copy: strip workflow jargon, preserve the actual evidence.
 * Source record stays untouched. Review the wording at the source before public release. */
window.BBB_PUBLIC_COPY = {
 clean(value){
  let s=String(value||"").trim();
  s=s.replace(/^Week\s+\d+\s+(?:owner[- ]approved\s+ranking\s+update|ranking\s+approved|ranking\s+update)\s*:\s*/i,"");
  s=s.replace(/^BBB\s+(?:owner[- ]approved|approved)\s+ranking\s+update\s*:\s*/i,"");
  s=s.replace(/\s*Current BBB rank #(\d+)\s*\(previously #(\d+)\)\.?\s*$/i,(_,now,old)=>" BBB now ranks him #"+now+(Number(now)>Number(old)?", down from #"+old:Number(now)<Number(old)?", up from #"+old:", unchanged from #"+old)+".");
  s=s.replace(/\bBBB owner approved\b/gi,"BBB made");
  s=s.replace(/\bBBB moved from #(\d+) to #(\d+)\.?/gi,(_,from,to)=>Number(to)<Number(from)?"His BBB dynasty ranking moved up from #"+from+" to #"+to+".":"His BBB dynasty ranking moved from #"+from+" to #"+to+".");
  return s.trim();
 }
};

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
  return '<div class="sp-overview-v6"><div class="sp-overview-top"><div class="sp-panel sp-verdict"><div class="sp-kicker">THE BBB SCOUTING REPORT</div><h2>What the film tells us.</h2><p class="sp-report">'+esc(report)+'</p>'+(p.latest_weekly_update?'<div class="sp-latest"><strong>Latest update</strong><p>'+esc(window.BBB_PUBLIC_COPY.clean(p.latest_weekly_update))+'</p></div>':'')+'<div class="sp-report-actions"><button class="sp-quicklink" data-profile-tab="film" type="button">Review Film Room →</button><button class="sp-quicklink" data-profile-tab="traits" type="button">View Individual Grades →</button></div></div><div class="sp-overview-right">'+ranks+'<div class="sp-overview-pulse"><div class="sp-kicker">SEASON INTELLIGENCE</div><h3>Inside the numbers.</h3><div id="spOverviewAdvanced"><div class="sp-muted">NFL advanced data loads when available. College prospects will have a separate college-stat pipeline.</div></div><button class="sp-quicklink" type="button" data-profile-tab="advanced">Full advanced statistics →</button></div></div></div><div class="sp-insights">'+pros+cons+'</div>'+
  '<div class="sp-overview-foot"><div><div class="sp-kicker">FILM LIBRARY</div><h3>'+(hasVideo?'Breakdowns are ready to watch.':'The scouting film room is growing.')+'</h3><p>'+(hasVideo?videos.length+' published film video'+(videos.length===1?'':'s')+' attached to this player.':'No published film breakdown is attached yet. New videos will appear when released.')+'</p></div><button class="sp-quicklink" type="button" data-profile-tab="film">Explore Film Room →</button></div></div>';
 },

 // A strictly derived BBB view over recorded nflverse weekly fields. No licensed scores inferred.
 rushingAggregate(weeks){
  if(!Array.isArray(weeks)||!weeks.length)return null;
  const records=weeks.filter(w=>Number.isFinite(Number(w.season)));
  if(!records.length)return null;
  const season=Math.max(...records.map(w=>Number(w.season)));
  const rows=records.filter(w=>Number(w.season)===season);
  const sum=key=>rows.reduce((total,w)=>total+(w[key]==null?0:Number(w[key])||0),0);
  const valid=key=>rows.filter(w=>w[key]!=null&&Number.isFinite(Number(w[key]))).length;
  const safe=key=>valid(key)===rows.length?sum(key):null;
  const games=rows.length,carries=sum("carries"),yards=sum("rushing_yards"),firstDowns=safe("rushing_first_downs"),epa=safe("rushing_epa");
  const snaps=rows.filter(w=>w.offense_snap_pct!=null&&Number.isFinite(Number(w.offense_snap_pct)));
  const snapPct=snaps.length?snaps.reduce((s,w)=>s+(Number(w.offense_snap_pct)<=1?Number(w.offense_snap_pct)*100:Number(w.offense_snap_pct)),0)/snaps.length:null;
  const timestamps=rows.map(w=>Date.parse(w.updated_at||"")).filter(Number.isFinite);
  return {
   season,games,carries,rushing_yards:yards,rushing_tds:safe("rushing_tds"),
   yards_per_carry:carries>0?yards/carries:null,
   carries_per_game:games>0?carries/games:null,
   rush_first_downs:firstDowns,first_down_rate:firstDowns!=null&&carries>0?100*firstDowns/carries:null,
   rushing_epa:epa,epa_per_carry:epa!=null&&carries>0?epa/carries:null,
   opportunities_per_game:games>0?(carries+sum("targets"))/games:null,
   avg_offense_snap_pct:snapPct,
   rushing_epa_weeks:valid("rushing_epa"),rushing_first_down_weeks:valid("rushing_first_downs"),
   snap_weeks:snaps.length,updated_at:timestamps.length?new Date(Math.max(...timestamps)).toISOString():null
  };
 },
 rushingHTML(row,esc,compact,peerRows=[]){
  if(!row)return '<div class="sp-muted">Rushing metrics have not been recorded for this season.</div>';
  const fmt=(value,dec=1)=>value==null?"—":Number(value).toLocaleString("en-US",{minimumFractionDigits:dec,maximumFractionDigits:dec});
  const eligible=(peerRows||[]).filter(x=>x.carries>=25&&x.games>=3&&x.season===row.season);
  const rank=key=>{
   if(row[key]==null||row.carries<25||row.games<3)return null;
   const matching=eligible.filter(x=>x[key]!=null&&Number.isFinite(Number(x[key])));
   if(matching.length<8)return null;
   const number=Number(row[key]);
   // Aggregating the same weekly floats in different row orders can differ by ~1e-14.
   // Treat numerically equivalent values as tied, never produce rank N+1 out of N.
   const tolerance=Math.max(0.0000001,Math.abs(number)*0.000000001);
   return {position:Math.min(matching.length,matching.filter(x=>Number(x[key])>number+tolerance).length+1),total:matching.length};
  };
  const fields=[
   ["yards_per_carry","Yards per carry",2,"Rushing yards ÷ carries"],
   ["epa_per_carry","Rushing EPA / carry",2,"Rushing EPA divided by carries"],
   ["rushing_epa","Total rushing EPA",2,"Expected points added on rushing plays"],
   ["rush_first_downs","Rushing first downs",0,"Recorded first downs gained on runs"],
   ["first_down_rate","First downs / carry",1,"Percentage of carries earning a first down","%"],
   ["carries_per_game","Carries per game",1,"Recorded carries divided by games"],
   ["opportunities_per_game","Opportunities / game",1,"Carries plus targets per recorded game"],
   ["avg_offense_snap_pct","Avg. offensive snap share",1,"Unweighted average of recorded weekly snap shares","%"]
  ];
  const metric=(key,label,precision,note,suffix="")=>{
   const v=row[key],r=rank(key);
   return '<div class="sp-adv-metric sp-rush-metric"><span>'+esc(label)+'</span><strong>'+esc(fmt(v,precision))+(v==null?"":suffix)+'</strong>'+
    (r?'<div class="sp-adv-rank">#'+r.position+' <small>of '+r.total+' qualifying RBs</small></div>':"")+
    '<small>'+esc(note)+'</small></div>';
  };
  if(compact){
   const quick=[fields[0],fields[1],fields[3]];
   return '<div class="sp-pulse-stats">'+quick.map(field=>'<div><strong>'+esc(fmt(row[field[0]],field[2]))+'</strong><small>'+esc(field[1])+'</small></div>').join("")+'</div>'+
    '<p class="sp-caption">'+esc(row.season)+' · '+esc(row.games)+' games · rushing stats updated '+esc(row.updated_at?new Date(row.updated_at).toLocaleDateString("en-US",{month:"short",day:"numeric"}):"date unavailable")+'</p>';
  }
  return '<section class="sp-advanced-rushing"><div class="sp-adv-heading"><div><span class="sp-kicker">RUSHING EFFICIENCY & WORKLOAD</span><h2>'+esc(row.season)+' rushing advanced stats</h2><p>Actual NFL weekly rushing data, through '+esc(row.games)+' recorded games. '+(eligible.length?"Position ranks compare RBs with at least 25 carries and three games.":"Peer rankings load when available.")+'</p></div></div>'+
   '<div class="sp-advanced-grid">'+fields.map(([key,label,precision,note,suffix])=>metric(key,label,precision,note,suffix)).join("")+'</div>'+
   '<div class="sp-adv-coverage"><span>Rushing data coverage</span><p>Rushing EPA: '+row.rushing_epa_weeks+'/'+row.games+' weeks · Rushing first downs: '+row.rushing_first_down_weeks+'/'+row.games+' weeks · Snap share: '+row.snap_weeks+'/'+row.games+' weeks'+(row.updated_at?' · Updated '+esc(new Date(row.updated_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})):"")+'</p></div>'+
   '<p class="sp-caption">EPA and first-down season totals are shown only when all recorded weeks have that field. BBB peer ranks require at least eight qualifying RBs with the relevant metric; these are not PlayerProfiler rankings. Yards after contact, missed tackles forced, yards over expected and true rushing success rate are not currently tracked.</p></section>';
 },
 advancedHTML(row,esc,compact,peers=[],position=""){
  if(!row)return '<div class="sp-no-data">Advanced NFL receiving metrics are not available for this player yet.</div>';
  const n=(key,dec=0)=>row[key]==null?"—":Number(row[key]).toLocaleString("en-US",{minimumFractionDigits:dec,maximumFractionDigits:dec});
  const fields=[
   ["receiving_air_yards","Air yards",0,"Targeted distance downfield"],
   ["receiving_yards_after_catch","Yards after catch",0,"Recorded receiving YAC"],
   ["receiving_first_downs","Receiving first downs",0,"Converted first downs"],
   ["receiving_epa","Receiving EPA",2,"Expected points added on receiving plays"],
   ["average_weekly_target_share_pct","Avg. weekly target share",1,"Unweighted mean of reported weekly shares"],
   ["average_weekly_air_yards_share_pct","Avg. weekly air-yard share",1,"Unweighted mean of reported weekly shares"]
  ];
  const peerRank=key=>{
   const value=Number(row[key]);
   if(row[key]==null||!Number.isFinite(value))return null;
   const eligible=peers.filter(r=>r[key]!=null&&Number.isFinite(Number(r[key])));
   if(eligible.length<8)return null;
   const ahead=eligible.filter(r=>Number(r[key])>value).length;
   return {rank:ahead+1,n:eligible.length};
  };
  const metrics=fields.map(([key,label,dec,context])=>({key,label,value:n(key,dec),dec,context,rank:peerRank(key),available:row[key]!=null}));
  if(compact){
   const picked=metrics.filter(x=>x.available).slice(0,3);
   return '<div class="sp-pulse-stats">'+(picked.length?picked.map(x=>'<div><strong>'+esc(x.value)+(x.dec===1?"%":"")+'</strong><small>'+esc(x.label)+'</small></div>').join(""):'<div class="sp-muted">No complete advanced receiving metrics recorded yet.</div>')+'</div><p class="sp-caption">'+esc(row.season)+' · '+esc(row.weekly_rows)+' weekly records · updated '+esc(row.stats_updated_at?new Date(row.stats_updated_at).toLocaleDateString("en-US",{month:"short",day:"numeric"}):"date unavailable")+'</p>';
  }
  const ypt=row.targets>0?Number(row.receiving_yards)/Number(row.targets):null;
  const yacPer=row.receptions>0&&row.receiving_yards_after_catch!=null?Number(row.receiving_yards_after_catch)/Number(row.receptions):null;
  if(ypt!=null)metrics.push({label:"Yards per target",value:ypt.toFixed(1),context:"Receiving yards ÷ targets",rank:null});
  if(yacPer!=null)metrics.push({label:"YAC per reception",value:yacPer.toFixed(1),context:"Recorded YAC ÷ receptions",rank:null});
  const cover=(recorded,key)=>recorded+'/'+row.weekly_rows+' weeks recorded';
  return '<div class="sp-adv-heading"><div><span class="sp-kicker">RECORDED NFL PRODUCTION · POSITION PEERS</span><h2>'+esc(String(row.season))+' advanced receiving profile</h2><p>Data last updated '+esc(row.stats_updated_at?new Date(row.stats_updated_at).toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric"}):"date unavailable")+'. '+esc(row.weekly_rows)+' recorded games. Position comparisons use BBB-tracked '+esc(position||"players")+'s for the same season, not licensed PlayerProfiler rankings.</p></div></div>'+
   '<div class="sp-advanced-grid">'+metrics.map(x=>'<div class="sp-adv-metric"><span>'+esc(x.label)+'</span><strong>'+esc(x.value)+(x.dec===1&&x.value!=="—"?"%":"")+'</strong>'+(x.rank?'<div class="sp-adv-rank">#'+x.rank.rank+' <small>of '+x.rank.n+' tracked '+esc(position)+'s</small></div>':'')+'<small>'+esc(x.context)+'</small></div>').join("")+'</div>'+
   '<div class="sp-adv-coverage"><span>Advanced data coverage</span><p>Air yards: '+esc(cover(row.air_yards_covered_weeks))+' · YAC: '+esc(cover(row.yac_covered_weeks))+' · EPA: '+esc(cover(row.receiving_epa_covered_weeks))+'</p></div>'+
   '<p class="sp-caption">Same-position ranks are calculated from available, recorded BBB data. Missing metrics are excluded, and ranks only appear when at least eight peers have data. These are <b>not official NFL, PFF, or PlayerProfiler ranks or percentiles</b>. Routes, yards per route run and route win rates cannot be inferred from the current feed.</p>';
 }


};