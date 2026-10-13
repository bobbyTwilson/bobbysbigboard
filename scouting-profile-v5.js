/* BBB Scouting V5 — native editorial profile, no embedded legacy site.
   Standalone initializer invoked from scouting-preview.js inside its existing scope. */
window.BBB_PROFILE_V5 = async function(ctx){
 const {app,p,r,g,a,s,sample,photo,videos,esc,stat,section,bbbDb,setTitle}=ctx;
 setTitle(p.name+" | Scouting & Film");
 const hasGrade=g?.grade!=null&&Number.isFinite(Number(g.grade));
 const gradeText=hasGrade?Number(g.grade).toFixed(1):"Not graded";
 const traits=Object.entries(g?.traits||{}).map(([name,val])=>({name,val:Number(val)})).filter(x=>Number.isFinite(x.val)&&x.val>=0);
 const range=entry=>(/^(speed|acceleration|analytics)$/i.test(entry.name)||entry.val>5)?10:5;
 const fieldTraits=traits.filter(x=>!/projected draft capital/i.test(x.name));
 const capTrait=traits.find(x=>/projected draft capital/i.test(x.name));
 const statsLabel=p.pos==="QB"?"Passing yards":p.pos==="RB"?"Rushing yards":"Receiving yards";
 const isProspect=(Number(g?.year||p.draft_year)>=2027);
 const report=s?.scouting_summary||p.overall_breakdown||"A complete player scouting evaluation has not been published yet. Statistics and film will be added as they are verified.";
 const height=x=>x==null?"Not recorded":Math.floor(Number(x)/12)+"′"+(Number(x)%12)+"″";
 const display=n=>n==null?"—":Number(n).toLocaleString("en-US",{maximumFractionDigits:1});
 const head=photo?'<img class="sp-player-image" src="'+esc(photo)+'" alt="'+esc(p.name)+' player portrait" onerror="this.remove()">':'';
 const initials=String(p.name||"").split(/\s+/).slice(0,2).map(x=>x[0]).join("");
 const profileTag=(t,v)=>'<div class="sp-detail"><span>'+esc(t)+'</span><strong>'+esc(v)+'</strong></div>';
 const imageSource=a?.source_url?'<a target="_blank" rel="noopener noreferrer" href="'+esc(a.source_url)+'">'+esc(a.source_name||"Testing source")+' ↗</a>':esc(a?.source_name||"BBB verified testing database");
 const measured=[
  {key:"forty_seconds",label:"40-YARD DASH",unit:"sec",format:v=>Number(v).toFixed(2),lo:4,hi:6,reverse:true},
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
  const metrics=tested.map(d=>{
   const value=Number(a[d.key]),pct=d.reverse?(d.hi-value)/(d.hi-d.lo):(value-d.lo)/(d.hi-d.lo),safe=Math.max(0,Math.min(100,pct*100));
   return '<div class="sp-athletic-row"><div class="sp-athletic-number"><span>'+esc(d.label)+'</span><strong>'+esc(d.format(value))+' <small>'+esc(d.unit)+'</small></strong></div><div class="sp-athletic-range"><div class="sp-athletic-marker" style="left:'+safe.toFixed(2)+'%"></div><div class="sp-range-fill" style="width:'+safe.toFixed(2)+'%"></div></div><div class="sp-range-ends"><span>'+d.lo+'</span><span>'+d.hi+'</span></div></div>';
  }).join("");
  return '<div class="sp-panel sp-athletics"><div class="sp-panel-head"><div><div class="sp-kicker">TESTING PROFILE</div><h2>How he measures up.</h2><p>Verified measurements, presented on labeled display scales.</p></div></div>'+
   '<div class="sp-physical"><div>'+profileTag("HEIGHT",height(a?.height_in))+'</div><div>'+profileTag("WEIGHT",a?.weight_lb==null?"Not recorded":display(a.weight_lb)+" lbs")+'</div><div>'+profileTag("HAND",a?.hand_in==null?"Not recorded":display(a.hand_in)+" in")+'</div><div>'+profileTag("ARM",a?.arm_in==null?"Not recorded":display(a.arm_in)+" in")+'</div></div>'+
   (tested.length?'<div class="sp-athletic-chart">'+metrics+'</div>':'<div class="sp-no-data">No verified athletic test results on file for this player yet. We will not substitute estimated numbers or unrelated testing results.</div>')+
   '<p class="sp-caption">Bar position shows a measurement within its labeled display range, <b>not a player percentile or athleticism score.</b> Faster times appear farther right. <span class="sp-test-source">'+(a?imageSource:'Source pending')+'</span></p></div>';
 };
 const grading=()=>'<div class="sp-panel"><div class="sp-panel-head"><div><div class="sp-kicker">BBB PLAYER EVALUATION</div><h2>Individual prospect grades.</h2><p>Recorded scouting traits from Bobby’s Big Board, kept on their original grading scales.</p></div><div class="sp-overall-grade"><span>OVERALL GRADE</span><strong>'+esc(gradeText)+'</strong></div></div>'+
  (fieldTraits.length?'<div class="sp-grading-list">'+fieldTraits.map(bar).join('')+'</div>':'<div class="sp-no-data">No individual prospect grades have been recorded for this player. Film notes and season data are still available.</div>')+
  (capTrait?'<div class="sp-grading-context">'+bar(capTrait)+'</div>':'')+
  '<p class="sp-caption">Speed, Acceleration and Analytics use 10-point scales; other recorded traits use 5-point scales. Draft capital is shown separately because it is not an on-field skill.</p></div>';
 const film=()=>'<div class="sp-panel"><div class="sp-panel-head"><div><div class="sp-kicker">BBB FILM ROOM</div><h2>Film & scouting notes.</h2><p>Published breakdowns and annotated observations, when available.</p></div></div>'+
  (videos.length?'<div class="sp-film-cards">'+videos.map(v=>'<a class="sp-film-card" href="https://www.youtube.com/watch?v='+encodeURIComponent(v.video_id)+'" target="_blank" rel="noopener noreferrer"><img src="https://i.ytimg.com/vi/'+encodeURIComponent(v.video_id)+'/hqdefault.jpg" alt=""><span><strong>'+esc(v.title)+'</strong><small>Watch the film breakdown ↗</small></span></a>').join('')+'</div>':'<div class="sp-no-data">No published BBB film breakdown has been linked to this player yet.</div>')+
  (sample?.clips?.length?'<div class="sp-film-notes"><h3>Film notebook <span>Editorial draft</span></h3>'+sample.clips.map((clip,i)=>'<div class="sp-film-clip"><span>PLAY '+(i+1)+' · '+esc(clip[0])+'</span><strong>'+esc(clip[1])+'</strong><p>'+esc(clip[2])+'</p></div>').join('')+'</div>':'')+'</div>';
 const emptyStats=()=>'<div class="sp-no-data">No NFL statistics are recorded yet for this player. Draft prospects will receive an NFL game log once they enter the league.</div>';
 const statsUI=()=>'<div class="sp-panel"><div class="sp-panel-head"><div><div class="sp-kicker">ON-FIELD PRODUCTION</div><h2>Season stats & game logs.</h2><p>Season-by-season production, plus weekly game detail when available.</p></div></div><div id="spStats">'+(isProspect?emptyStats():'Loading recorded NFL seasons…')+'</div><div id="spWeeks"></div></div>';
 const dyn=()=>'<div class="sp-panel"><div class="sp-panel-head"><div><div class="sp-kicker">MARKET CONTEXT</div><h2>Dynasty evaluation.</h2><p>Dynasty rankings are separate from scouting grades.</p></div></div>'+
  (r?'<div class="sp-three">'+profileTag("BBB OVERALL RANK","#"+r.rank)+profileTag("POSITION RANK",p.pos+(r.pr||"—"))+profileTag("MARKET RANK",r.market!=null?"#"+r.market:"Not recorded")+'</div><p class="sp-caption">Rankings can change independently of a player’s scouting evaluation.</p><a href="/dynasty/rankings" class="sp-link">Open Top 500 dynasty rankings →</a>':'<div class="sp-no-data">Not currently on the dynasty Top 500. This does not mean the player lacks scouting value.</div>')+'</div>';
 app.innerHTML='<section class="sp-profile"><div class="wrap"><div class="sp-crumb"><a href="/players">Players</a> <span>›</span> '+esc(p.pos||"")+' <span>›</span> '+esc(p.name)+'</div>'+
  '<div class="sp-hero"><div class="sp-portrait">'+head+'<span class="sp-portrait-fallback">'+esc(initials)+'</span></div><div class="sp-hero-content"><div class="sp-kicker">PLAYER EVALUATION · BOBBY’S BIG BOARD</div><h1>'+esc(p.name)+'</h1><p class="sp-identity">'+esc(p.pos||"")+' <span>·</span> '+esc(p.team||"Draft Prospect")+' <span>·</span> '+esc(p.college||"College not recorded")+'</p><div class="sp-hero-tags"><span class="sp-overall-chip">PROSPECT GRADE <strong>'+esc(gradeText)+'</strong></span>'+(g?.comp?'<span>PRO COMP <strong>'+esc(g.comp)+'</strong></span>':'')+(g?.year?'<span>CLASS <strong>'+esc(g.year)+'</strong></span>':'')+(r?'<span>DYNASTY <strong>#'+esc(r.rank)+'</strong></span>':'')+'</div></div></div>'+
  '<div class="sp-tabs" role="tablist" aria-label="Player profile sections"><button type="button" class="sp-tab active" data-tab="overview" role="tab" aria-selected="true">Overview</button><button type="button" class="sp-tab" data-tab="traits" role="tab" aria-selected="false">Prospect Grades</button><button type="button" class="sp-tab" data-tab="athletic" role="tab" aria-selected="false">Athletic Profile</button><button type="button" class="sp-tab" data-tab="film" role="tab" aria-selected="false">Film Room</button><button type="button" class="sp-tab" data-tab="stats" role="tab" aria-selected="false">Stats & Logs</button><button type="button" class="sp-tab" data-tab="dynasty" role="tab" aria-selected="false">Dynasty</button></div>'+
  '<div class="sp-tab-content active" data-content="overview" role="tabpanel"><div class="sp-overview-grid"><div class="sp-panel"><div class="sp-kicker">SCOUTING REPORT</div><h2>Player evaluation.</h2><p class="sp-report">'+esc(report)+'</p>'+(s?.development_areas?.length?'<h3>Development areas</h3><p class="sp-report">'+esc(s.development_areas.join(" · "))+'</p>':'')+(p.latest_weekly_update?'<div class="sp-latest"><strong>Latest player update</strong><p>'+esc(p.latest_weekly_update)+'</p></div>':'')+'</div><div class="sp-overview-sidebar">'+profileTag("POSITION",p.pos||"—")+profileTag("COLLEGE",p.college||"Not recorded")+profileTag("HEIGHT",height(a?.height_in))+profileTag("WEIGHT",a?.weight_lb==null?"Not recorded":display(a.weight_lb)+" lbs")+profileTag("PROSPECT GRADE",gradeText)+profileTag("PRO COMP",g?.comp||"Not recorded")+'</div></div><div class="sp-overview-bottom">'+grading()+athletics()+'</div></div>'+
  '<div class="sp-tab-content" data-content="traits" role="tabpanel">'+grading()+'</div>'+
  '<div class="sp-tab-content" data-content="athletic" role="tabpanel">'+athletics()+'</div>'+
  '<div class="sp-tab-content" data-content="film" role="tabpanel">'+film()+'</div>'+
  '<div class="sp-tab-content" data-content="stats" role="tabpanel">'+statsUI()+'</div>'+
  '<div class="sp-tab-content" data-content="dynasty" role="tabpanel">'+dyn()+'</div>'+
  '</div></section>';
 const tabs=Array.from(app.querySelectorAll(".sp-tab"));
 const showTab=tab=>{
  tabs.forEach(el=>{const on=el.dataset.tab===tab;el.classList.toggle("active",on);el.setAttribute("aria-selected",String(on))});
  app.querySelectorAll(".sp-tab-content").forEach(el=>el.classList.toggle("active",el.dataset.content===tab));
 };
 tabs.forEach(button=>button.addEventListener("click",()=>{showTab(button.dataset.tab);if(button.dataset.tab==="stats")loadStats();}));
 let loaded=false;
 const loadStats=async()=>{
  if(loaded)return;loaded=true;
  const mount=app.querySelector("#spStats"),weeks=app.querySelector("#spWeeks");if(!mount)return;
  try{
   const ss=await bbbDb("site_player_season_stats","select=season,games,targets,receptions,receiving_yards,receiving_tds,carries,rushing_yards,rushing_tds,passing_yards,passing_tds,attempts,completions&player_key=eq."+encodeURIComponent(p.player_key)+"&order=season.desc&limit=15");
   if(!ss?.length){mount.innerHTML=emptyStats();return}
   const columns=p.pos==="QB"?[["Season","season"],["Games","games"],["Comp","completions"],["Att","attempts"],["Pass Yds","passing_yards"],["Pass TDs","passing_tds"]]:
    p.pos==="RB"?[["Season","season"],["Games","games"],["Carries","carries"],["Rush Yds","rushing_yards"],["Rush TDs","rushing_tds"],["Rec","receptions"],["Rec Yds","receiving_yards"]]:
    [["Season","season"],["Games","games"],["Targets","targets"],["Receptions","receptions"],["Rec Yds","receiving_yards"],["Rec TDs","receiving_tds"]];
   const current=ss[0];
   mount.innerHTML='<div class="sp-season-highlights">'+profileTag("SEASON",current.season)+profileTag("GAMES",display(current.games))+profileTag(statsLabel,display(current[p.pos==="QB"?"passing_yards":p.pos==="RB"?"rushing_yards":"receiving_yards"]))+profileTag(p.pos==="QB"?"PASS TD":p.pos==="RB"?"RUSH TD":"REC TD",display(current[p.pos==="QB"?"passing_tds":p.pos==="RB"?"rushing_tds":"receiving_tds"]))+'</div>'+
    '<div class="sp-tablewrap"><table class="sp-table"><thead><tr>'+columns.map(([label])=>'<th>'+esc(label)+'</th>').join('')+'</tr></thead><tbody>'+ss.map(row=>'<tr>'+columns.map(([,k])=>'<td>'+esc(display(row[k]))+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
   try{
    const recent=await bbbDb("site_player_weekly_stats","select=season,week,opponent_team,targets,receptions,receiving_yards,receiving_tds,rushing_yards,passing_yards,target_share,air_yards_share&player_key=eq."+encodeURIComponent(p.player_key)+"&order=season.desc,week.desc&limit=18");
    if(!recent?.length)return;
    const c=p.pos==="QB"?[["Week","week"],["Opp","opponent_team"],["Pass Yds","passing_yards"]]:p.pos==="RB"?[["Week","week"],["Opp","opponent_team"],["Rush Yds","rushing_yards"],["Rec Yds","receiving_yards"]]:[["Week","week"],["Opp","opponent_team"],["Tgt","targets"],["Rec","receptions"],["Yds","receiving_yards"],["TD","receiving_tds"],["Tgt Share","target_share"]];
    weeks.innerHTML='<h3 class="sp-weeks-title">Recent game log</h3><div class="sp-tablewrap"><table class="sp-table"><thead><tr>'+c.map(([l])=>'<th>'+esc(l)+'</th>').join('')+'</tr></thead><tbody>'+recent.map(row=>'<tr>'+c.map(([l,k])=>'<td>'+esc(k==="target_share"&&row[k]!=null?Number(row[k]).toFixed(1)+"%":row[k]??"—")+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
   }catch(e){console.warn("Game log data unavailable",e)}
  }catch(e){mount.innerHTML='<div class="sp-no-data">Season stats could not be loaded right now.</div>';console.warn(e)}
 };
 if(location.hash){const requested=location.hash.slice(1);if(["overview","traits","athletic","film","stats","dynasty"].includes(requested)){showTab(requested);if(requested==="stats")loadStats()}}
};