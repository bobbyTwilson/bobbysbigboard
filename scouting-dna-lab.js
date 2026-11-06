/* Bobby's Big Board — Scouting DNA / Player Comparison Lab.
 * Read-only presentation of existing published BBB grades, film and testing.
 * No generated/estimated scores. Shared trait normalization powers both views.
 */
(function(){
"use strict";
const clean = v=>String(v??"").trim();
const escapeHtml = v=>clean(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const number = v=>v==null||v===""?null:(Number.isFinite(Number(v))?Number(v):null);
const compact = n=>n==null?"—":Number(n).toLocaleString("en-US",{maximumFractionDigits:1});
const kind = name=>{
 const s=clean(name).toLowerCase();
 if(/draft capital|analytics/.test(s))return "exclude";
 if(/speed|accelerat|agility|direction|decelerat|mobility|athleticism|rushing upside/.test(s))return "Movement & Burst";
 if(/release|routes|route running|double move|timing|anticipation/.test(s))return "Routes & Technique";
 if(/catch|hands|traffic|run after catch|ball secur|contact balance|physical|vision|creativity|separation/.test(s))return "Ball Skills & Creation";
 if(/accuracy|arm talent|throw off.platform|play extension|pocket|process|decision|pre.snap|pressure|clutch/.test(s))return "QB & Processing";
 return "Football IQ & Other";
};
function traits(grade){
 const source=grade&&grade.traits&&typeof grade.traits==="object"&&!Array.isArray(grade.traits)?grade.traits:{};
 return Object.entries(source).flatMap(([raw,v])=>{
  const n=number(v);
  if(n==null||n<0||kind(raw)==="exclude")return [];
  const explicit=raw.match(/\((5|10)\)\s*$/);
  const max=explicit?Number(explicit[1]):(/^(speed|acceleration)$/i.test(raw)?10:n>5?10:5);
  if(n>max)return [];
  const label=raw.replace(/\s*\((?:5|10)\)\s*$/,"").trim();
  return [{key:label.toLowerCase().replace(/\s+/g," "),name:label,val:n,max,pct:Math.min(100,100*n/max),group:kind(label)}];
 }).sort((a,b)=>b.pct-a.pct||a.name.localeCompare(b.name));
}
const sortTop=(items,count)=>items.slice().sort((a,b)=>b.pct-a.pct||a.name.localeCompare(b.name)).slice(0,count);
function radar(items,esc=escapeHtml){
 const chosen=sortTop(items,6);
 if(chosen.length<3)return '<div class="bbb-dna-empty">At least three existing BBB trait grades are needed for a DNA chart. No scores have been estimated.</div>';
 const n=chosen.length,cx=240,cy=185,r=106;
 const point=(pct,i,dist=r)=>{const angle=(-Math.PI/2)+i*2*Math.PI/n;return [cx+dist*pct/100*Math.cos(angle),cy+dist*pct/100*Math.sin(angle)]};
 const poly=vals=>vals.map((v,i)=>point(v,i).map(x=>x.toFixed(1)).join(",")).join(" ");
 const rings=[25,50,75,100].map(v=>'<polygon class="bbb-dna-grid" points="'+poly(Array(n).fill(v))+'"/>').join("");
 const spokes=chosen.map((x,i)=>{const [px,py]=point(100,i);return '<line class="bbb-dna-axis" x1="'+cx+'" y1="'+cy+'" x2="'+px.toFixed(1)+'" y2="'+py.toFixed(1)+'"/>'}).join("");
 const labels=chosen.map((x,i)=>{
  const [px,py]=point(100,i,166);
  const label=x.name.length>17?x.name.slice(0,16).trim()+"…":x.name;
  return '<text class="bbb-dna-label" x="'+px.toFixed(1)+'" y="'+(py+4).toFixed(1)+'" text-anchor="middle">'+esc(label)+'</text>';
 }).join("");
 const dots=chosen.map((x,i)=>{const [px,py]=point(x.pct,i);return '<circle class="bbb-dna-dot" cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+'" r="4"><title>'+esc(x.name+" "+compact(x.val)+"/"+x.max)+'</title></circle>'}).join("");
 return '<svg class="bbb-dna-radar" viewBox="0 0 480 365" role="img" aria-label="'+esc("BBB recorded scouting traits: "+chosen.map(x=>x.name+" "+compact(x.val)+"/"+x.max).join(", "))+'">'+rings+spokes+'<polygon class="bbb-dna-shape" points="'+poly(chosen.map(x=>x.pct))+'"/>'+dots+labels+'</svg>';
}
function traitRow(t,esc=escapeHtml){
 return '<div class="bbb-dna-trait"><div class="bbb-dna-trait-title"><strong>'+esc(t.name)+'</strong><span>'+esc(compact(t.val))+' / '+t.max+'</span></div>'+
 '<div class="bbb-dna-track" role="img" aria-label="'+esc(t.name+": "+compact(t.val)+" out of "+t.max)+'"><span style="width:'+t.pct.toFixed(1)+'%"></span></div></div>';
}
function profile({p,g,videos,esc=escapeHtml}){
 const list=traits(g),overall=number(g?.grade);
 const grouped=[...new Set(list.map(t=>t.group))];
 const groups=grouped.map(group=>'<div class="bbb-dna-category"><h3>'+esc(group)+'</h3>'+list.filter(x=>x.group===group).map(t=>traitRow(t,esc)).join("")+'</div>').join("");
 const summary=clean(p?.overall_breakdown);
 const filmed=Array.isArray(videos)?videos.filter(v=>/^[A-Za-z0-9_-]{11}$/.test(v.video_id||"")).slice(0,2):[];
 const above=list.length?sortTop(list,3):[];
 const below=list.length?list.slice().sort((a,b)=>a.pct-b.pct).slice(0,2):[];
 const highlights=above.length?'<div class="bbb-dna-highlights"><div><small>HIGHEST RECORDED TRAITS</small>'+above.map(t=>'<span>'+esc(t.name)+' · '+compact(t.val)+'/'+t.max+'</span>').join("")+'</div><div><small>LOWEST RECORDED TRAITS</small>'+below.map(t=>'<span>'+esc(t.name)+' · '+compact(t.val)+'/'+t.max+'</span>').join("")+'</div></div>':'';
 const url='/dynasty/compare?left='+encodeURIComponent(p.player_key);
 return '<section class="sp-panel bbb-dna-panel" id="scoutingDna"><div class="sp-panel-head"><div><div class="sp-kicker">BOBBY’S BIG BOARD · ORIGINAL SCOUTING</div><h2>'+esc(p.name)+' · Scouting DNA</h2><p>Every score below comes from a recorded BBB evaluation—not a generated rating. Compare players using the exact same source grades.</p></div><div class="bbb-dna-status"><span>HISTORICAL BBB GRADE</span><strong>'+(overall==null?'Not graded':compact(overall))+'</strong></div></div>'+
 (list.length?'<div class="bbb-dna-core"><div class="bbb-dna-visual"><div class="bbb-dna-visual-label">SCOUTING FINGERPRINT</div>'+radar(list,esc)+'</div><div class="bbb-dna-core-notes"><div class="bbb-dna-overline">HOW HE GRADES</div><h3>'+esc(list.length)+' actual scored traits</h3><p>Bars and radar use each trait’s original 5- or 10-point maximum. They are <strong>not percentiles, new evaluations, or position-adjusted rankings.</strong></p>'+highlights+'</div></div><div class="bbb-dna-category-grid">'+groups+'</div>':
 '<div class="bbb-dna-empty">No individual scouting traits have been recorded for this player yet. Existing production and film remain available elsewhere on his profile.</div>')+
 (summary?'<div class="bbb-dna-editorial"><span>FROM THE BBB SCOUTING REPORT</span><p>'+esc(summary)+'</p></div>':'')+
 '<div class="bbb-dna-actions"><a class="bbb-dna-compare-link" href="'+url+'">Compare '+esc(p.name)+' with another player →</a>'+
 (filmed.length?'<a href="/film?video='+encodeURIComponent(filmed[0].video_id)+'">Watch related BBB film ↗</a>':'<a href="/film">Browse Film Room ↗</a>')+'</div></section>';
}

/* A player only receives an edge when BOTH values are comparable, numeric
 * and have a meaningful better direction. No invented overall player score. */
const edgeFor=(left,right,direction)=>{
 if(direction!=="higher"&&direction!=="lower")return "neutral";
 const a=number(left),b=number(right);
 if(a===null||b===null)return "neutral";
 if(Math.abs(a-b)<.00001)return "even";
 return direction==="lower"?(a<b?"left":"right"):(a>b?"left":"right");
};
const edgeTotals=outcomes=>{
 let left=0,right=0,ties=0;
 for(const outcome of outcomes){
  if(outcome==="left")left++;
  else if(outcome==="right")right++;
  else if(outcome==="even")ties++;
 }
 const compared=left+right+ties;
 return {left,right,ties,compared,winner:!compared?"neutral":left===right?"even":left>right?"left":"right"};
};
const teamAccent=code=>({
 ARI:"#CF4F59",ATL:"#D85355",BAL:"#AD86E0",BUF:"#D64D58",CAR:"#65B9EA",CHI:"#E8A15A",CIN:"#F29B53",CLE:"#E99A55",
 DAL:"#9EBDDF",DEN:"#E38D53",DET:"#85B7E2",GB:"#E4C76B",HOU:"#CF6472",IND:"#AEC8E4",JAX:"#79CFC8",KC:"#DE5965",
 LV:"#B5C7BE",LAC:"#65C8F3",LAR:"#6DAAEE",MIA:"#68D8CB",MIN:"#B6A0E6",NE:"#9CB6D7",NO:"#E4CF83",NYG:"#8CA9E8",
 NYJ:"#77C59B",PHI:"#64C7B2",PIT:"#E7C564",SEA:"#7FD3BC",SF:"#D77D7E",TB:"#E5767F",TEN:"#7EC0DC",WAS:"#E2B26D"
 })[clean(code).toUpperCase()]||"#7AD49B";

/* NFL marks are a decorative identification layer behind the player photo.
 * Known current teams only. Free agents and unknown teams get the same
 * tasteful card treatment without a bogus logo. */
const nflLogoCodes=new Set([
 "ARI","ATL","BAL","BUF","CAR","CHI","CIN","CLE","DAL","DEN","DET","GB",
 "HOU","IND","JAX","KC","LV","LAC","LAR","MIA","MIN","NE","NO","NYG",
 "NYJ","PHI","PIT","SEA","SF","TB","TEN","WAS"
]);
const nflLogoCode=code=>{
 const alias={JAC:"JAX",WSH:"WAS",OAK:"LV",SD:"LAC",STL:"LAR"};
 const raw=clean(code).toUpperCase();
 const normalized=alias[raw]||raw;
 return nflLogoCodes.has(normalized)?normalized.toLowerCase():null;
};

const numberOrDash=(v,suffix="")=>number(v)==null?"Not recorded":compact(v)+suffix;
const height=v=>number(v)==null?"Not recorded":Math.floor(number(v)/12)+"′"+(number(v)%12)+"″";
function lab({app,profiles,ranks,prospects,bbbDb,purl,setTitle,portrait,esc=escapeHtml}){
 setTitle("Player Comparison Lab");
 const byRank=new Map((ranks||[]).map(x=>[x.player_key,x]));
 const byGrade=new Map((prospects||[]).map(x=>[x.player_key,x]));
 const users=(profiles||[]).filter(p=>p?.player_key&&p?.name).sort((a,b)=>a.name.localeCompare(b.name));
 const byKey=new Map(users.map(p=>[p.player_key,p]));
 const opt=users.map(p=>'<option value="'+esc(p.name)+'"></option>').join("");
 app.innerHTML='<section class="section bbb-lab"><div class="wrap">'+
 '<div class="bbb-lab-kicker">BBB SCOUTING TOOLS / NFL PLAYERS</div><h1>PLAYER <em>COMPARISON LAB.</em></h1>'+
 '<p class="bbb-lab-lead">Put two players head to head. Compare Bobby’s saved scouting traits, real athletic measurements, dynasty value and original film—without inventing a single grade.</p>'+
 '<div class="bbb-lab-setup"><div class="bbb-lab-pick"><label for="bbbLabLeft">PLAYER ONE</label><input id="bbbLabLeft" list="bbbLabNames" autocomplete="off" placeholder="Search first player…"><small id="bbbLabLeftHelp">Choose any listed NFL player</small></div>'+
 '<button type="button" class="bbb-lab-swap" id="bbbLabSwap" aria-label="Swap compared players">⇄ <span>SWAP</span></button>'+
 '<div class="bbb-lab-pick"><label for="bbbLabRight">PLAYER TWO</label><input id="bbbLabRight" list="bbbLabNames" autocomplete="off" placeholder="Search second player…"><small id="bbbLabRightHelp">Choose any listed NFL player</small></div></div>'+
 '<datalist id="bbbLabNames">'+opt+'</datalist>'+
 '<div class="bbb-lab-shortcuts"><span>QUICK MATCHUPS</span><button type="button" data-bbb-match="kc-concepcion|luther-burden-iii">KC Concepcion vs. Luther Burden III</button><button type="button" data-bbb-match="bhayshul-tuten|kc-concepcion">Tuten vs. KC</button></div>'+
 '<div class="bbb-lab-result" id="bbbLabResult" aria-live="polite"><div class="bbb-lab-empty">Choose two players above to compare their actual BBB scouting data.</div></div>'+
 '<div class="bbb-lab-disclaimer">BBB scouting traits are historical prospect evaluations on their original grading scales. A 5/5 trait is displayed as 100% of its scale—not as a player percentile. Missing grades are not estimated. Film links use published studies only.</div>'+
 '</div></section>';
 const $=selector=>app.querySelector(selector),left=$("#bbbLabLeft"),right=$("#bbbLabRight"),result=$("#bbbLabResult");
 const memo=new Map();
 let requestId=0;
 const keyOf=value=>{
  const str=clean(value).toLowerCase();
  const byName=users.find(p=>p.name.toLowerCase()===str);
  return byName?.player_key||(byKey.has(str)?str:null);
 };
 const pOf=key=>byKey.get(key)||null;

 const identity=(p,rank,grade,side,overallWinner)=>{
  const g=number(grade?.grade);
  const photoUrl=typeof portrait==="function"?clean(portrait(p)):"";
  // Identical allowlist to the existing BBB profile/directory portrait renderer.
  const photo=/^https:\/\/(?:a\.)?espncdn\.com\//i.test(photoUrl)?photoUrl:"";
  const initials=clean(p.name).split(/\s+/).slice(0,2).map(x=>x[0]||"").join("").toUpperCase();
  const photoMarkup=photo?'<img class="bbb-lab-player-photo" loading="lazy" src="'+esc(photo)+'" alt="'+esc(p.name)+' player portrait" onerror="this.remove()">':'';
  const logoCode=nflLogoCode(p.team);
  const teamLogoMarkup=logoCode?'<img class="bbb-lab-team-watermark" loading="lazy" decoding="async" src="https://a.espncdn.com/i/teamlogos/nfl/500/'+logoCode+'.png" alt="" aria-hidden="true" onerror="this.remove()">':'';
  const accent=teamAccent(p.team);
  const rankLabel=number(rank?.rank)==null?"UNRANKED":"#"+compact(rank.rank);
  const gradeLabel=g==null?"Not graded":compact(g);
  return '<article class="bbb-lab-identity bbb-lab-card bbb-lab-card-'+side+(overallWinner===side?' bbb-lab-card-leading':'')+'" style="--bbb-lab-team-accent:'+accent+'">'+
    '<div class="bbb-lab-card-art">'+teamLogoMarkup+'<span class="bbb-lab-photo-fallback">'+esc(initials)+'</span>'+photoMarkup+'</div>'+
    '<div class="bbb-lab-card-info"><div class="bbb-lab-card-eyebrow">'+(side==="left"?"PLAYER ONE":"PLAYER TWO")+' <i></i> '+esc(p.team||"FREE AGENT")+'</div>'+
    '<div class="bbb-lab-name">'+esc(p.name)+'</div>'+
    '<div class="bbb-lab-card-sub">'+esc(p.pos||"PLAYER")+' <span>·</span> '+esc(p.team||"TEAM NOT RECORDED")+'</div>'+
    '<div class="bbb-lab-card-ratings"><div><small>DYNASTY</small><strong>'+esc(rankLabel)+'</strong></div><div><small>BBB GRADE</small><strong class="'+(g==null?'bbb-lab-grade-missing':'')+'">'+esc(gradeLabel)+'</strong></div></div>'+
    '<div class="bbb-lab-badges"><span>'+esc(grade?.comp?"COMP · "+grade.comp:"SCOUTING · BBB")+'</span></div>'+
    '<a class="bbb-lab-profile-link" href="'+purl(p)+'">FULL PLAYER PROFILE <span aria-hidden="true">↗</span></a>'+
    '</div></article>';
 };
 const pairRow=(label,leftDisplay,rightDisplay,leftVal=null,rightVal=null,direction=null)=>{
  const edge=edgeFor(leftVal,rightVal,direction);
  return '<div class="bbb-lab-row bbb-lab-edge-'+edge+'" data-edge="'+edge+'">'+
    '<strong class="bbb-lab-cell bbb-lab-cell-left'+(edge==="left"?' bbb-lab-cell-win':'')+'">'+esc(leftDisplay)+'</strong>'+
    '<div class="bbb-lab-row-label"><span>'+esc(label)+'</span></div>'+
    '<strong class="bbb-lab-cell bbb-lab-cell-right'+(edge==="right"?' bbb-lab-cell-win':'')+'">'+esc(rightDisplay)+'</strong></div>';
 };
 const sectionEdge=(outcomes,leftName,rightName)=>{
  const tally=edgeTotals(outcomes);
  const label=tally.winner==="left"?leftName:tally.winner==="right"?rightName:tally.winner==="even"?"EVEN MATCHUP":"NOT ENOUGH DATA";
  return '<div class="bbb-lab-section-edge bbb-lab-section-'+tally.winner+'" data-edge="'+tally.winner+'"><div class="bbb-lab-section-edge-label">SECTION EDGE</div>'+
    '<strong>'+(tally.winner==="left"||tally.winner==="right"?'EDGE · ':'')+esc(label)+'</strong>'+
    '<small>'+tally.left+' - '+tally.right+' measurable wins'+(tally.ties?' · '+tally.ties+' ties':'')+'</small></div>';
 };
 const sectionHead=(index,title,description,edges,names)=>{
  return '<div class="bbb-lab-panel-heading"><div><span>'+esc(index)+'</span><h2>'+esc(title)+'</h2><p>'+esc(description)+'</p></div>'+sectionEdge(edges,names[0],names[1])+'</div>';
 };
 const filmCards=(videos,p)=>{
  if(!videos?.length)return '<p class="bbb-lab-no-film">No published BBB film study linked yet.</p>';
  return videos.slice(0,2).map(v=>'<a href="/film?video='+encodeURIComponent(v.video_id)+'">'+esc(v.title||p.name+" Film Study")+' ↗</a>').join("");
 };
 async function fetchPlayer(key){
  if(memo.has(key))return memo.get(key);
  const one=async(table,query)=>{try{const rows=await bbbDb(table,query);return rows?.[0]||null}catch{return null}};
  const films=async()=>{try{const rows=await bbbDb("site_bbb_film_catalog","select=video_id,title,player_key,editorial_status,published_at&player_key=eq."+encodeURIComponent(key)+"&editorial_status=eq.approved&order=published_at.desc&limit=3");return (rows||[]).filter(v=>/^[A-Za-z0-9_-]{11}$/.test(v.video_id||""))}catch{return []}};
  const task=Promise.all([
   one("site_prospects","select=player_key,name,pos,year,grade,comp,traits&player_key=eq."+encodeURIComponent(key)+"&limit=1"),
   one("bbb_player_athletics","select=player_key,height_in,weight_lb,forty_seconds,vertical_in,broad_in,three_cone_seconds,shuttle_seconds,source_name&player_key=eq."+encodeURIComponent(key)+"&limit=1"),
   films()
  ]).then(([grade,athletic,videos])=>({p:pOf(key),rank:byRank.get(key),grade:grade||byGrade.get(key),athletic,videos}));
  memo.set(key,task);
  return task;
 }

 const gradeLabel=g=>number(g?.grade)==null?"Not graded":compact(g.grade);
 const topTraits=g=>traits(g).slice(0,3).map(t=>'<span>'+esc(t.name)+' · '+compact(t.val)+'/'+t.max+'</span>').join("")||'<span>Not evaluated yet</span>';
 const testingRows=(a,b)=>[
   {label:"Height",left:height(a?.height_in),right:height(b?.height_in)},
   {label:"Weight",left:numberOrDash(a?.weight_lb," lb"),right:numberOrDash(b?.weight_lb," lb")},
   {label:"40-yard dash",left:numberOrDash(a?.forty_seconds," sec"),right:numberOrDash(b?.forty_seconds," sec"),a:a?.forty_seconds,b:b?.forty_seconds,direction:"lower"},
   {label:"Vertical",left:numberOrDash(a?.vertical_in," in"),right:numberOrDash(b?.vertical_in," in"),a:a?.vertical_in,b:b?.vertical_in,direction:"higher"},
   {label:"Broad jump",left:numberOrDash(a?.broad_in," in"),right:numberOrDash(b?.broad_in," in"),a:a?.broad_in,b:b?.broad_in,direction:"higher"},
   {label:"3-cone",left:numberOrDash(a?.three_cone_seconds," sec"),right:numberOrDash(b?.three_cone_seconds," sec"),a:a?.three_cone_seconds,b:b?.three_cone_seconds,direction:"lower"},
   {label:"Short shuttle",left:numberOrDash(a?.shuttle_seconds," sec"),right:numberOrDash(b?.shuttle_seconds," sec"),a:a?.shuttle_seconds,b:b?.shuttle_seconds,direction:"lower"}
 ];
 const rowEdge=r=>edgeFor(r.a,r.b,r.direction);
 const renderRows=rows=>rows.map(r=>pairRow(r.label,r.left,r.right,r.a,r.b,r.direction)).join("");
 const sharedTraits=(first,second,samePosition)=>{
  const la=traits(first),rb=traits(second),rightMap=new Map(rb.map(t=>[t.key,t]));
  const shared=la.filter(t=>rightMap.has(t.key)&&rightMap.get(t.key).max===t.max);
  const pairs=shared.sort((x,y)=>x.group.localeCompare(y.group)||x.name.localeCompare(y.name))
    .map(t=>({l:t,r:rightMap.get(t.key)}));
  const outcomes=pairs.map(x=>samePosition?edgeFor(x.l.val,x.r.val,"higher"):"neutral");
  const html=pairs.map((pair,i)=>{
   const {l:t,r:u}=pair,edge=outcomes[i];
   return '<div class="bbb-lab-trait bbb-lab-edge-'+edge+'" data-edge="'+edge+'">'+
    '<div class="bbb-lab-trait-head">'+
      '<strong class="bbb-lab-trait-score bbb-lab-trait-score-left'+(edge==="left"?' bbb-lab-cell-win':'')+'">'+compact(t.val)+'/'+t.max+'</strong>'+
      '<div class="bbb-lab-trait-title">'+esc(t.name)+'</div>'+
      '<strong class="bbb-lab-trait-score bbb-lab-trait-score-right'+(edge==="right"?' bbb-lab-cell-win':'')+'">'+compact(u.val)+'/'+u.max+'</strong>'+
    '</div>'+
    '<div class="bbb-lab-trait-bars">'+
      '<div class="bbb-lab-trait-track left"><i style="width:'+t.pct.toFixed(1)+'%"></i></div>'+
      '<span class="bbb-lab-trait-edge-label">'+(edge==="left"?'← LEFT EDGE':edge==="right"?'RIGHT EDGE →':edge==="even"?'EVEN':'RECORDED')+'</span>'+
      '<div class="bbb-lab-trait-track right"><i style="width:'+u.pct.toFixed(1)+'%"></i></div>'+
    '</div></div>';
  }).join("");
  return {outcomes,html:html||'<div class="bbb-lab-empty">These players do not have shared BBB trait grades on the same scale yet. No scores have been estimated.</div>'};
 };
 const overallPanel=(votes,leftName,rightName)=>{
  const summary=edgeTotals(votes);
  const leader=summary.winner==="left"?leftName:summary.winner==="right"?rightName:summary.winner==="even"?"Even matchup":"Insufficient comparable data";
  return '<div class="bbb-lab-overall bbb-lab-overall-'+summary.winner+'" data-edge="'+summary.winner+'">'+
    '<div class="bbb-lab-overall-copy"><span>HEAD-TO-HEAD / RECORDED METRICS</span>'+
    '<h2>'+(summary.winner==="left"||summary.winner==="right"?'OVERALL SECTION EDGE · ':'')+esc(leader)+'</h2>'+
    '<p>Each eligible section counts once. This is a comparison of recorded advantages, <strong>not a new BBB grade, player projection, or matchup prediction.</strong></p></div>'+
    '<div class="bbb-lab-overall-score"><div class="bbb-lab-overall-score-names"><span>'+esc(leftName)+'</span><span>'+esc(rightName)+'</span></div>'+
    '<div class="bbb-lab-overall-score-values"><strong class="'+(summary.winner==="left"?'bbb-lab-score-leading':'')+'">'+summary.left+'</strong><span>–</span><strong class="'+(summary.winner==="right"?'bbb-lab-score-leading':'')+'">'+summary.right+'</strong></div>'+
    '<small>SECTION EDGES WON'+(summary.ties?' · '+summary.ties+' EVEN':'')+'</small></div></div>';
 };
 function renderPair(a,b){
  const p=a.p,q=b.p;
  const names=[p.name,q.name],samePos=p.pos===q.pos;
  const rA=a.rank,rB=b.rank;
  const dynastyRows=[
   {label:"BBB dynasty rank",left:rA?.rank?"#"+rA.rank:"Not ranked",right:rB?.rank?"#"+rB.rank:"Not ranked",a:rA?.rank,b:rB?.rank,direction:"lower"},
   {label:"Market rank",left:number(rA?.market)==null?"Not recorded":"#"+rA.market,right:number(rB?.market)==null?"Not recorded":"#"+rB.market,a:rA?.market,b:rB?.market,direction:"lower"},
   {label:"Position rank",left:rA?.pr?p.pos+rA.pr:"Not recorded",right:rB?.pr?q.pos+rB.pr:"Not recorded",a:rA?.pr,b:rB?.pr,direction:samePos?"lower":null},
   {label:"BBB draft grade",left:gradeLabel(a.grade),right:gradeLabel(b.grade),a:a.grade?.grade,b:b.grade?.grade,direction:samePos?"higher":null},
   {label:"Graded draft year",left:a.grade?.year||"Not recorded",right:b.grade?.year||"Not recorded"},
   {label:"College",left:p.college||"Not recorded",right:q.college||"Not recorded"},
   {label:"Prospect comp",left:a.grade?.comp||"Not recorded",right:b.grade?.comp||"Not recorded"}
  ];
  const testing=testingRows(a.athletic,b.athletic);
  const scout=sharedTraits(a.grade,b.grade,samePos);
  const dynastyVotes=dynastyRows.map(rowEdge);
  const athleticVotes=testing.map(rowEdge);
  const sections=[edgeTotals(dynastyVotes),edgeTotals(scout.outcomes),edgeTotals(athleticVotes)];
  const summary=edgeTotals(sections.map(x=>x.winner));
  result.innerHTML='<div class="bbb-lab-headtohead">'+identity(p,rA,a.grade,"left",summary.winner)+
   '<div class="bbb-lab-versus"><span>HEAD TO HEAD</span><strong>VS</strong><small>BBB LAB</small></div>'+
   identity(q,rB,b.grade,"right",summary.winner)+'</div>'+
   overallPanel(sections.map(x=>x.winner),p.name,q.name)+
   '<section class="bbb-lab-panel bbb-lab-panel-dna">'+
   sectionHead('01 / SCOUTING DNA','Trait-by-trait comparison.',
     'Recorded grades on matching scales.'+(samePos?' Winning scores get the edge.':' Different positions: trait values are displayed without declaring a winner.'),scout.outcomes,names)+
   '<div class="bbb-lab-traits">'+scout.html+'</div>'+
   '<div class="bbb-lab-topnotes"><div><small>'+esc(p.name)+' · HIGHEST GRADED</small>'+topTraits(a.grade)+'</div>'+
   '<div><small>'+esc(q.name)+' · HIGHEST GRADED</small>'+topTraits(b.grade)+'</div></div></section>'+
   '<section class="bbb-lab-panel bbb-lab-panel-value">'+
   sectionHead('02 / DYNASTY VALUE','Where they rank.',
     'Lower rank numbers win. Original prospect grades only get an edge for the same position.',dynastyVotes,names)+
   '<div class="bbb-lab-rows">'+renderRows(dynastyRows)+'</div></section>'+
   '<section class="bbb-lab-panel bbb-lab-panel-athletic">'+
   sectionHead('03 / VERIFIED ATHLETICS','How they measured.',
     'Faster times and better jumps glow. Height and weight are context, never automatic winners.',athleticVotes,names)+
   '<div class="bbb-lab-rows">'+renderRows(testing)+'</div>'+
   '<p class="bbb-lab-source">Measurement sources: '+esc(a.athletic?.source_name||"not recorded")+' · '+esc(b.athletic?.source_name||"not recorded")+'</p></section>'+
   '<section class="bbb-lab-panel bbb-lab-panel-film"><div class="bbb-lab-panel-heading"><div><span>04 / FILM & THE EVALUATION</span>'+
   '<h2>What Bobby saw on tape.</h2><p>Scouting notes and film are evidence, not a subjective auto-winner.</p></div>'+
   '<div class="bbb-lab-section-edge bbb-lab-section-neutral"><strong>NO AUTO EDGE</strong><small>Read the film context</small></div></div>'+
   '<div class="bbb-lab-editorial">'+
   [a,b].map(o=>'<article><h3>'+esc(o.p.name)+'</h3><p>'+esc(o.p.overall_breakdown||"No published scouting breakdown yet.")+'</p>'+
   '<div class="bbb-lab-film">'+filmCards(o.videos,o.p)+'</div>'+
   '<a class="bbb-lab-view-dna" href="'+purl(o.p)+'#dna">Explore full Scouting DNA →</a></article>').join("")+'</div></section>';
 }
 const getField=(id,key)=>{const n=$("#"+id);const obj=pOf(key);if(n&&obj)n.value=obj.name;};
 const update=async()=>{
  const current=++requestId,lk=keyOf(left.value),rk=keyOf(right.value);
  $("#bbbLabLeftHelp").textContent=lk?((pOf(lk)?.pos||"Player")+" · chosen"):(left.value.trim()?"Choose an exact player from the suggestions":"Choose any listed NFL player");
  $("#bbbLabRightHelp").textContent=rk?((pOf(rk)?.pos||"Player")+" · chosen"):(right.value.trim()?"Choose an exact player from the suggestions":"Choose any listed NFL player");
  if(!lk||!rk){result.innerHTML='<div class="bbb-lab-empty">Choose two players above to compare their BBB evaluations.</div>';return}
  if(lk===rk){result.innerHTML='<div class="bbb-lab-empty">Select two different players.</div>';return}
  const url=new URL(location.href);url.searchParams.set("left",lk);url.searchParams.set("right",rk);
  history.replaceState(history.state,"",url.pathname+url.search);
  result.innerHTML='<div class="bbb-lab-empty">Loading recorded scouting and testing data…</div>';
  const [a,b]=await Promise.all([fetchPlayer(lk),fetchPlayer(rk)]);
  if(current!==requestId)return;
  if(!a.p||!b.p){result.innerHTML='<div class="bbb-lab-empty">Could not load this matchup. Choose two other players.</div>';return}
  renderPair(a,b);
 };
 for(const input of [left,right]){input.addEventListener("input",update);input.addEventListener("change",update)}
 $("#bbbLabSwap").addEventListener("click",()=>{const v=left.value;left.value=right.value;right.value=v;void update()});
 app.querySelectorAll("[data-bbb-match]").forEach(button=>button.addEventListener("click",()=>{
  const [l,r]=button.dataset.bbbMatch.split("|");
  if(!pOf(l)||!pOf(r))return;
  getField("bbbLabLeft",l);getField("bbbLabRight",r);void update();
 }));
 const params=new URLSearchParams(location.search);
 getField("bbbLabLeft",params.get("left"));
 getField("bbbLabRight",params.get("right"));
 if(left.value||right.value)void update();
}
window.BBB_SCOUTING_DNA=Object.freeze({traits,radar,profile,lab,edgeFor,edgeTotals,nflLogoCode});
})();