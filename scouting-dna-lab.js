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
const numberOrDash=(v,suffix="")=>number(v)==null?"Not recorded":compact(v)+suffix;
const height=v=>number(v)==null?"Not recorded":Math.floor(number(v)/12)+"′"+(number(v)%12)+"″";
function lab({app,profiles,ranks,prospects,bbbDb,purl,setTitle,esc=escapeHtml}){
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
 const identity=(p,rank,grade)=>{
  const g=number(grade?.grade);
  return '<div class="bbb-lab-identity"><div class="bbb-lab-name">'+esc(p.name)+'</div><div class="bbb-lab-badges">'+
   '<span>'+esc(p.pos||"Position unknown")+'</span><span>'+esc(p.team||"Team not recorded")+'</span>'+
   (rank?.rank?'<span>BBB #'+esc(rank.rank)+'</span>':'<span>Not in Top 500</span>')+
   '<span>Prospect grade: '+(g==null?'Not graded':compact(g))+'</span></div>'+
   '<a href="'+purl(p)+'">Full scouting profile →</a></div>';
 };
 const pairRow=(label,a,b)=>'<div class="bbb-lab-row"><strong>'+esc(a)+'</strong><span>'+esc(label)+'</span><strong>'+esc(b)+'</strong></div>';
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
 const testing=(a,b)=>{
  const rows=[
   ["Height",height(a?.height_in),height(b?.height_in)],
   ["Weight",numberOrDash(a?.weight_lb," lb"),numberOrDash(b?.weight_lb," lb")],
   ["40-yard dash",numberOrDash(a?.forty_seconds," sec"),numberOrDash(b?.forty_seconds," sec")],
   ["Vertical",numberOrDash(a?.vertical_in," in"),numberOrDash(b?.vertical_in," in")],
   ["Broad jump",numberOrDash(a?.broad_in," in"),numberOrDash(b?.broad_in," in")],
   ["3-cone",numberOrDash(a?.three_cone_seconds," sec"),numberOrDash(b?.three_cone_seconds," sec")]
  ];
  return rows.map(([n,l,r])=>pairRow(n,l,r)).join("");
 };
 const compareTraits=(a,b)=>{
  const la=traits(a),rb=traits(b),rightMap=new Map(rb.map(t=>[t.key,t]));
  const shared=la.filter(t=>rightMap.has(t.key)&&rightMap.get(t.key).max===t.max);
  if(!shared.length)return '<div class="bbb-lab-empty">These players do not have shared BBB trait grades on the same scale yet. No scores have been estimated.</div>';
  return shared.sort((x,y)=>x.group.localeCompare(y.group)||x.name.localeCompare(y.name)).map(t=>{
   const u=rightMap.get(t.key);
   return '<div class="bbb-lab-trait"><div class="bbb-lab-trait-title">'+esc(t.name)+'</div>'+
    '<div class="bbb-lab-trait-values"><strong>'+compact(t.val)+'/'+t.max+'</strong><span>RECORDED TRAIT</span><strong>'+compact(u.val)+'/'+u.max+'</strong></div>'+
    '<div class="bbb-lab-trait-bars"><div class="bbb-lab-trait-track left"><i style="width:'+t.pct.toFixed(1)+'%"></i></div><div class="bbb-lab-trait-track right"><i style="width:'+u.pct.toFixed(1)+'%"></i></div></div></div>';
  }).join("");
 };
 function renderPair(a,b){
  const p=a.p,q=b.p;
  const positionsMatch=p.pos===q.pos;
  const rankA=a.rank,rankB=b.rank;
  const dataRows=[
   ["BBB dynasty rank",rankA?.rank?"#"+rankA.rank:"Not ranked",rankB?.rank?"#"+rankB.rank:"Not ranked"],
   ["Position rank",rankA?.pr?p.pos+rankA.pr:"—",rankB?.pr?q.pos+rankB.pr:"—"],
   ["Market rank",number(rankA?.market)!=null?"#"+rankA.market:"Not recorded",number(rankB?.market)!=null?"#"+rankB.market:"Not recorded"],
   ["BBB draft grade",gradeLabel(a.grade),gradeLabel(b.grade)],
   ["Graded draft year",a.grade?.year||"Not recorded",b.grade?.year||"Not recorded"],
   ["College",p.college||"Not recorded",q.college||"Not recorded"],
   ["Prospect comp",a.grade?.comp||"Not recorded",b.grade?.comp||"Not recorded"]
  ];
  result.innerHTML='<div class="bbb-lab-headtohead">'+identity(p,rankA,a.grade)+'<div class="bbb-lab-versus">VS</div>'+identity(q,rankB,b.grade)+'</div>'+
  '<section class="bbb-lab-panel"><div class="bbb-lab-panel-heading"><span>01 / SCOUTING DNA</span><h2>Trait-by-trait comparison.</h2><p>Same-named BBB traits, shown only where both players have recorded grades on matching scales.'+
  (positionsMatch?'':' These players play different positions, so comparisons may be limited.')+'</p></div>'+
  '<div class="bbb-lab-traits">'+compareTraits(a.grade,b.grade)+'</div>'+
  '<div class="bbb-lab-topnotes"><div><small>'+esc(p.name)+' · HIGHEST GRADED</small>'+topTraits(a.grade)+'</div><div><small>'+esc(q.name)+' · HIGHEST GRADED</small>'+topTraits(b.grade)+'</div></div></section>'+
  '<section class="bbb-lab-panel"><div class="bbb-lab-panel-heading"><span>02 / DYNASTY & DRAFT</span><h2>Value and scouting context.</h2><p>Independent dynasty rankings and original graded prospect evaluations are distinct measures.</p></div><div class="bbb-lab-rows">'+dataRows.map(row=>pairRow(row[0],row[1],row[2])).join("")+'</div></section>'+
  '<section class="bbb-lab-panel"><div class="bbb-lab-panel-heading"><span>03 / VERIFIED TESTING</span><h2>How they measured.</h2><p>Missing Combine or pro-day results remain unrecorded rather than estimated.</p></div><div class="bbb-lab-rows">'+testing(a.athletic,b.athletic)+'</div><p class="bbb-lab-source">Measurement sources: '+esc(a.athletic?.source_name||"not recorded")+' · '+esc(b.athletic?.source_name||"not recorded")+'</p></section>'+
  '<section class="bbb-lab-panel"><div class="bbb-lab-panel-heading"><span>04 / FILM & THE EVALUATION</span><h2>What Bobby saw on tape.</h2></div><div class="bbb-lab-editorial">'+
  [a,b].map(o=>'<article><h3>'+esc(o.p.name)+'</h3><p>'+esc(o.p.overall_breakdown||"No published scouting breakdown yet.")+'</p><div class="bbb-lab-film">'+filmCards(o.videos,o.p)+'</div><a class="bbb-lab-view-dna" href="'+purl(o.p)+'#dna">Explore full Scouting DNA →</a></article>').join("")+'</div></section>';
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
window.BBB_SCOUTING_DNA=Object.freeze({traits,radar,profile,lab});
})();