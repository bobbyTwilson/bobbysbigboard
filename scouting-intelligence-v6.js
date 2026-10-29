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
  const year=Number(g?.year),pos=String(g?.pos||p.pos||"");
  const classRows=(prospects||[]).filter(x=>Number(x.year)===year&&x.grade!=null&&Number.isFinite(Number(x.grade))).sort((a,b)=>Number(b.grade)-Number(a.grade));
  const positionRows=classRows.filter(x=>x.pos===pos);
  const place=list=>{const n=list.findIndex(x=>x.player_key===p.player_key);return n<0?null:1+list.slice(0,n).filter(x=>Number(x.grade)>Number(g.grade)).length};
  const overall=place(classRows),positionRank=place(positionRows),ranked=overall!=null&&positionRank!=null;
  const maxFor=(name,value)=>/^(speed|acceleration|analytics)$/i.test(name)||/\(10\)/.test(name)||value>5?10:5;
  const all=Object.entries(g?.traits||{}).map(([name,v])=>{
    const value=Number(v),max=maxFor(name,value);
    return {name,value,max,pct:Math.max(0,Math.min(100,100*value/max))}
  }).filter(x=>Number.isFinite(x.value)&&x.value>=0&&!/draft capital|analytics|dawg factor/i.test(x.name));
  const byName=new Map(all.map(x=>[x.name.toLowerCase(),x]));
  const keys=pos==="WR"||pos==="TE"?
    ["Releases","Catching","Medium Routes","Speed","Catch in Traffic","Run After Catch"]:
    pos==="RB"?["Vision","Contact Balance","Speed","Acceleration","Catching","Run IQ"]:
    pos==="QB"?["Accuracy","Arm Strength","Pocket Presence","Decision Making","Mobility","Athleticism"]:[];
  const chosen=[];
  for(const key of keys){const metric=byName.get(key.toLowerCase());if(metric&&!chosen.includes(metric))chosen.push(metric)}
  for(const metric of all.slice().sort((a,b)=>b.pct-a.pct)){if(chosen.length>=6)break;if(!chosen.includes(metric))chosen.push(metric)}
  const radarTraits=chosen.slice(0,6);
  const fmt=value=>Number(value).toLocaleString("en-US",{maximumFractionDigits:1});
  const raw=x=>fmt(x.value)+"/"+x.max;
  const cohort=positionRows.filter(x=>x.traits&&typeof x.traits==="object");
  const medians=radarTraits.map(metric=>{
    const pts=cohort.map(player=>{
      const val=Object.entries(player.traits).find(([name])=>name.toLowerCase()===metric.name.toLowerCase());
      if(!val)return null;
      const n=Number(val[1]);return Number.isFinite(n)&&n>=0?Math.min(100,100*n/maxFor(val[0],n)):null;
    }).filter(v=>v!=null).sort((a,b)=>a-b);
    if(pts.length<5)return null;
    const m=Math.floor(pts.length/2);
    return pts.length%2?pts[m]:(pts[m-1]+pts[m])/2;
  });
  const canCompare=radarTraits.length>=3&&medians.every(v=>v!=null)&&cohort.length>=5;
  // A radar polygon normalizes each REAL recorded BBB trait to its own original 5/10-point maximum.
  // It is not a percentile and does not replace the saved overall prospect grade.
  const coords=(pct,i,n,r=105)=>{
    const angle=(-90+i*360/n)*Math.PI/180,dist=r*pct/100;
    return [220+dist*Math.cos(angle),180+dist*Math.sin(angle)];
  };
  const polygon=(scores,n)=>scores.map((v,i)=>coords(v,i,n).map(x=>x.toFixed(2)).join(",")).join(" ");
  const radar=()=>{
    if(radarTraits.length<3)return '<div class="sp-visual-empty">A radar chart will appear once this player has at least three recorded scouting traits.</div>';
    const n=radarTraits.length;
    const grid=[25,50,75,100].map(k=>'<polygon points="'+polygon(Array(n).fill(k),n)+'" class="sp-radar-ring"/>').join("");
    const lines=radarTraits.map((_,i)=>'<line x1="220" y1="180" x2="'+coords(100,i,n)[0].toFixed(1)+'" y2="'+coords(100,i,n)[1].toFixed(1)+'" class="sp-radar-axis"/>').join("");
    const dots=radarTraits.map((x,i)=>{
      const [px,py]=coords(x.pct,i,n);
      return '<circle class="sp-radar-dot" cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+'" r="4.5"/>';
    }).join("");
    // Real scouting trait NAMES at the ends of the spokes, not numbered references.
    // Long names wrap to multiple SVG text lines so the graph stays within its panel.
    const wrapName=name=>{
      const words=String(name).trim().split(/\s+/);
      if(name.length<=13||words.length===1)return [name];
      const lines=[''];
      for(const word of words){
        const last=lines.length-1;
        if(lines[last]&&(lines[last].length+word.length+1)>12)lines.push(word);
        else lines[last]+=(lines[last]?' ':'')+word;
      }
      return lines;
    };
    const labels=radarTraits.map((trait,i)=>{
      const [px,py]=coords(100,i,n,145);
      const rows=wrapName(trait.name);
      const baseY=py-(rows.length-1)*6.8+4;
      return '<text class="sp-radar-trait-name" x="'+px.toFixed(2)+'" y="'+baseY.toFixed(2)+'" text-anchor="middle">'+
        rows.map((row,index)=>'<tspan x="'+px.toFixed(2)+'" dy="'+(index?'13.6':'0')+'">'+esc(row)+'</tspan>').join("")+
        '</text>';
    }).join("");
    const description=radarTraits.map(x=>x.name+" "+raw(x)).join(", ");
    return '<div class="sp-v7-radar-plot"><svg class="sp-radar-svg" viewBox="0 0 440 360" role="img" aria-label="'+esc("BBB scouting radar: "+description)+'">'+
      '<g class="sp-radar-grids">'+grid+lines+'</g>'+
      (canCompare?'<polygon class="sp-radar-peer" points="'+polygon(medians,n)+'"/>':'')+
      '<polygon class="sp-radar-player" points="'+polygon(radarTraits.map(x=>x.pct),n)+'"/>'+dots+labels+'</svg></div>';
  };
  const ordered=all.slice().sort((a,b)=>b.pct-a.pct||a.name.localeCompare(b.name));
  const strongest=ordered.slice(0,4);
  const lowest=ordered.slice(-3).reverse();
  // A written scouting report takes priority; only approved notes are public.
  // Otherwise frame the existing grades as provisional strengths and questions.
  const prosCons=()=>{
    if(g?.grade==null||!Number.isFinite(Number(g.grade)))return "";
    const approved=s?.editorial_status==="approved";
    const notes=x=>Array.isArray(x)?x.filter(v=>typeof v==="string"&&v.trim()).map(v=>v.trim().slice(0,400)).slice(0,6):[];
    const editorialPros=approved?notes(s.strengths):[],editorialCons=approved?notes(s.development_areas):[];
    const angles={
      speed:["offers a credible vertical-speed dimension to his projection","leaves the true vertical-speed ceiling to confirm on film"],
      acceleration:["adds first-step burst to his overall skill set","makes the initial burst an area for more film study"],
      agility:["supports creating space within a tight window","raises questions about his quickness in tight quarters"],
      deceleration:["supports stop-start movement and sharper cuts","leaves stop-start movement worth another look"],
      "change of direction":["supports lateral movement and redirecting against leverage","makes change of direction a development focus"],
      releases:["supports beating coverage at the line of scrimmage","raises questions about consistently escaping press coverage"],
      catching:["supports his hands and target-finishing projection","makes catch consistency a relative question"],
      "catch in traffic":["supports finishing targets through contact","makes contested-catch consistency worth watching"],
      "short routes":["supports separation underneath","makes underneath route precision a question"],
      "medium routes":["supports intermediate route work","makes intermediate route execution worth refining"],
      "deep routes":["supports a downfield route tree","leaves deep-route development to monitor"],
      "double moves":["adds deception to his route repertoire","leaves route deception as an area to polish"],
      "run after catch":["supports the potential to create extra yards in space","makes independent creation after the catch a development focus"],
      vision:["supports finding and setting up rushing lanes","leaves rushing-lane recognition as an area to evaluate"],
      "contact balance":["supports finishing through contact","leaves power through contact a comparative question"],
      "pass protection":["supports earning snaps on passing downs","raises questions about early passing-down reliability"],
      "ball security":["supports dependable ball handling","makes ball security worth watching closely"],
      "route running":["supports his receiving-role projection","makes route detail an area to develop"],
      blocking:["supports an every-down tight end profile","makes blocking a developmental question"],
      physicality:["supports a strong contact-oriented profile","grades below his more promising traits"],
      "arm talent":["supports his overall passing-tools projection","makes arm talent a question relative to his other tools"],
      "deep accuracy":["supports throwing accurately downfield","leaves vertical ball placement worth further study"],
      "short accuracy":["supports operating the quick passing game","makes short-area placement a concern to monitor"],
      "intermediate accuracy":["supports challenging intermediate coverages","makes intermediate-ball placement worth developing"],
      "pre-snap processing":["supports reading looks before the snap","leaves pre-snap identification to refine"],
      "post-snap processing":["supports adjusting decisions after the snap","makes post-snap recognition a relative question"],
      "anticipation / timing":["supports the timing and rhythm of his throws","leaves throwing with anticipation to develop"],
      "decision making / ball security":["supports safe decision-making in structure","makes ball-security decisions worth additional review"],
      "pocket presence":["supports maneuvering within the pocket","leaves his pocket movement under pressure to improve"],
      "play extension":["provides upside outside the designed structure","makes improvisation less central to the projection"],
      "rushing upside":["adds another dimension to the quarterback profile","leaves the designed-run dimension as a comparative limitation"]
    };
    const label=t=>t.name.replace(/\s*\((?:5|10)\)$/,""),describe=(t,bad)=>{
      const name=label(t),angle=angles[name.toLowerCase()]?.[bad?1:0];
      return name+" ("+raw(t)+") "+(angle||(bad?"is a lower-rated aspect of the evaluation that deserves more film study":"is one of the higher-rated aspects of this evaluation"))+".";
    };
    const gradedPros=ordered.filter(t=>t.pct>=80).slice(0,4);
    if(gradedPros.length<3)for(const t of ordered.slice(0,3)){if(!gradedPros.includes(t))gradedPros.push(t);}
    const highest=ordered[0]?.pct||0;
    const gradedCons=ordered.slice().reverse().filter(t=>t.pct<=80&&highest-t.pct>=12).slice(0,3);
    const noFlaw="No clearly weak on-field trait is reflected in the existing grades. Consistency against tougher competition is a future film-study question, not a confirmed flaw.";
    const good=editorialPros.length?editorialPros:gradedPros.map(t=>describe(t,false));
    const bad=editorialCons.length?editorialCons:(gradedCons.length?gradedCons.map(t=>describe(t,true)):[noFlaw]);
    const side=(label,rows,type)=>'<div class="sp-procon-half sp-procon-'+type+'"><h3><span aria-hidden="true">'+(type==="positive"?"✓":"!")+'</span>'+label+'</h3><ul>'+
      rows.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul></div>';
    const editorial=editorialPros.length&&editorialCons.length;
    return '<section class="sp-procon" aria-labelledby="sp-procon-title"><div class="sp-procon-head"><div class="sp-kicker">BOBBY’S BIG BOARD SCOUTING ANALYSIS</div><h2 id="sp-procon-title">Pros &amp; cons.</h2><p>What gives this player an edge — and the areas still worth developing.</p></div>'+
      '<div class="sp-procon-grid">'+side("Pros · Strengths",good,"positive")+side("Cons · Questions",bad,"caution")+'</div>'+
      '<p class="sp-procon-source">'+(editorial?"Published BBB scouting notes.":"Grade-based scouting preview based on BBB’s recorded trait evaluations. These are relative projections, not independently confirmed play-by-play film observations.")+'</p></section>';
  };
  const insight=(label,items,negative=false)=>
    '<div class="sp-v7-traitgroup '+(negative?'sp-v7-development':'')+'"><h3><span aria-hidden="true">'+(negative?'−':'✓')+'</span>'+esc(label)+'</h3>'+
    (items.length?'<ul>'+items.map(x=>'<li><span class="sp-v7-bullet" aria-hidden="true">'+(negative?'−':'✓')+'</span><span>'+esc(x.name)+' <small>'+esc(raw(x))+'</small></span></li>').join("")+'</ul>':
    '<p class="sp-muted">No rated traits are recorded yet.</p>')+'</div>';
  const rankedCard=ranked?
    '<section class="sp-draft-rank sp-v7-card sp-v7-rank"><div class="sp-kicker">BBB '+year+' SCOUTING BOARD</div>'+
    '<div class="sp-rank-values"><strong>'+esc(pos)+positionRank+'</strong><span>#'+overall+' overall</span></div>'+
    '<p>Among '+positionRows.length+' graded '+esc(pos)+'s and '+classRows.length+' graded '+year+' prospects. These are BBB evaluations, not consensus rankings.</p>'+
    '<a href="/draft">View the draft board →</a></section>':
    '<section class="sp-draft-rank sp-v7-card sp-v7-rank"><div class="sp-kicker">BBB SCOUTING BOARD</div>'+
    '<div class="sp-rank-values"><strong>'+(r?'BBB #'+esc(r.rank):'Not ranked')+'</strong></div>'+
    '<p>'+(r?'Current dynasty rank; independent of a prospect grade.':'A class rank is shown once a graded BBB scouting evaluation is available.')+'</p>'+
    '<a href="/draft">Explore the draft board →</a></section>';
  const bars=radarTraits.map(x=>
    '<div class="sp-v7-grade-row"><div class="sp-v7-bar-label"><span>'+esc(x.name)+'</span><strong>'+Math.round(x.pct)+'</strong></div>'+
    '<div class="sp-v7-bar-track" role="meter" aria-label="'+esc(x.name)+' normalized scouting grade" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(x.pct)+'"><span style="width:'+x.pct.toFixed(2)+'%"></span></div>'+
    '<small>'+esc(raw(x))+' original BBB grade</small></div>').join("");
  const compare=canCompare?'<label class="sp-v7-compare">Compare <select id="spRadarCompare" aria-label="Trait radar comparison"><option value="none">Player only</option><option value="peers">'+esc(year+" "+pos+" cohort")+'</option></select></label>':
    '<span class="sp-v7-cohort">Recorded BBB traits</span>';
  const note=p.latest_weekly_update?window.BBB_PUBLIC_COPY.clean(p.latest_weekly_update):"";
  const stamp=r?.weekly_update_date&&/^\d{4}-\d{2}-\d{2}/.test(r.weekly_update_date)?
    new Date(r.weekly_update_date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"";
  return '<div class="sp-overview-v6 sp-overview-v7"><div class="sp-v7-dashboard">'+
    '<section class="sp-panel sp-verdict sp-v7-card sp-v7-report"><div class="sp-v7-card-label"><span aria-hidden="true">▤</span> THE BBB SCOUTING REPORT</div>'+
    '<h2>What the film <em>tells us.</em></h2><p class="sp-report">'+esc(report)+'</p>'+
    (note?'<div class="sp-v7-latest"><div class="sp-v7-latest-top"><strong>↗ &nbsp; LATEST UPDATE</strong>'+ (stamp?'<time>'+esc(stamp)+'</time>':'')+'</div><p>'+esc(note)+'</p></div>':'')+

    '<div class="sp-report-actions"><button class="sp-quicklink" data-profile-tab="film" type="button">Review Film Room →</button><button class="sp-quicklink" data-profile-tab="traits" type="button">Individual Grades →</button></div></section>'+
    '<div class="sp-v7-mid">'+
    '<section class="sp-v7-card sp-v7-radar"><div class="sp-v7-card-head"><span class="sp-kicker">TRAIT BREAKDOWN</span>'+compare+'</div>'+
    radar()+(canCompare?'<div class="sp-v7-radar-legend"><span>● Player</span><span class="sp-v7-peer-legend">– '+esc(year+" "+pos+" median")+' (n='+cohort.length+')</span></div>':'')+
    '<p class="sp-v7-method">Traits normalized to 0–100 from their original 5- or 10-point BBB scales. Not percentiles.</p></section>'+
    '<section class="sp-v7-card sp-v7-grades"><div class="sp-v7-card-head"><span class="sp-kicker">GRADE BREAKDOWN</span>'+
    (g?.grade!=null?'<div class="sp-v7-grade-chip">Overall <strong>'+esc(Number(g.grade).toFixed(1))+'</strong></div>':'')+'</div>'+
    (radarTraits.length?'<div class="sp-v7-bars">'+bars+'</div>':'<div class="sp-visual-empty">Trait grades are not yet recorded for this player.</div>')+
    '<button type="button" class="sp-v7-morelink" data-profile-tab="traits">All recorded traits →</button></section></div>'+
    '<div class="sp-v7-side">'+rankedCard+
    '<section class="sp-overview-pulse sp-v7-card"><div class="sp-kicker">SEASON INTELLIGENCE</div><h3>Inside the numbers.</h3>'+
    '<div id="spOverviewAdvanced"><div class="sp-muted">Loading recorded advanced NFL data…</div></div>'+
    '<button class="sp-v7-morelink" data-profile-tab="advanced" type="button">Full advanced statistics →</button></section>'+
    '<section class="sp-v7-card sp-v7-production"><div class="sp-v7-card-head"><span class="sp-kicker">PRODUCTION SNAPSHOT</span>'+
    '<button class="sp-v7-morelink" data-profile-tab="stats" type="button">View full stats →</button></div>'+
    '<div id="spOverviewProduction" aria-live="polite"><div class="sp-muted">Loading current season totals…</div></div></section>'+
    '</div></div>'+
    prosCons()+
    '<div class="sp-overview-foot sp-v7-film-cta"><div><div class="sp-kicker">FILM LIBRARY</div><h3>'+(videos?.length?"Breakdowns are ready to watch.":"More film is coming.")+'</h3>'+
    '<p>'+(videos?.length?videos.length+" published breakdown"+(videos.length===1?"":"s")+" linked to this player.":"No published long-form film is linked yet.")+'</p></div>'+
    '<button class="sp-quicklink" data-profile-tab="film" type="button">Open Film Room →</button></div></div>';
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