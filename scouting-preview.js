(function(){
"use strict";
const app=document.getElementById("app"),D={profiles:[],ranks:[],prospects:[],athletics:[],scouting:[],videos:[],films:[],media:{}},R=new Map(),P=new Map(),A=new Map(),S=new Map(),SAMPLES=window.BBB_SCOUTING_SAMPLES||{};
let filter="",position="ALL",limit=32,isDraftMode=false,draftYearFilter="2027";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num=v=>v==null?"—":Number(v).toLocaleString("en-US");
const purl=p=>"/scouting/"+encodeURIComponent(p.player_key);
const section=(k,t,s)=>'<div class="sectionHead"><div><div class="eyebrow">'+esc(k)+'</div><h2>'+esc(t)+'</h2><p>'+esc(s)+'</p></div></div>';
const stat=(k,v)=>'<div class="grade"><small>'+esc(k)+'</small><strong>'+esc(v)+'</strong></div>';
const chip=t=>'<span class="pill">'+esc(t)+'</span>';
const filmList=()=>window.BBB_FILM_ROOM.catalog(D.films,D.videos,D.profiles,D.prospects);
function setTitle(x){document.title=x+" | Bobby's Big Board";const k=location.pathname.startsWith("/scouting/")?"players":location.pathname.split("/")[1]||"home";document.querySelectorAll("[data-nav]").forEach(a=>a.classList.toggle("active",a.dataset.nav===k))}
function portrait(p){const m=D.media[p.player_key];return m&&/^https:\/\/(a\.)?espncdn\.com\//.test(m.url||"")?m.url:""}
function playerCard(p){
 const r=R.get(p.player_key),g=P.get(p.player_key),src=portrait(p);
 const hasGrade=g&&g.grade!=null&&Number.isFinite(Number(g.grade)),v=filmList().filter(x=>x.player_key===p.player_key);
 const name=esc(p.name),team=esc(p.team||"—"),college=esc(p.college||"College not recorded"),grade=hasGrade?Number(g.grade).toFixed(1):"Not graded";
 const head=src?'<img loading="lazy" src="'+esc(src)+'" alt="ESPN player headshot" onerror="this.remove()">':'';
 const initials=esc(String(p.name||"?").split(/\s+/).slice(0,2).map(x=>x[0]).join(""));
 const badges=(p.overall_breakdown?'<span class="coverageTag">Scouting notes</span>':'')+(v.length?'<span class="coverageTag filmed">'+v.length+' film video'+(v.length>1?'s':'')+'</span>':'')+(!p.overall_breakdown&&!v.length?'<span class="coverageEmpty">Evaluation in progress</span>':'');
 return '<a class="bbb-directory-row" href="'+purl(p)+'" aria-label="Open '+name+' scouting profile">'+
 '<div class="bbb-directory-person"><div class="bbb-directory-avatar"><span>'+initials+'</span>'+head+'</div><div class="bbb-directory-person-text"><strong>'+name+'</strong><small>'+esc(p.pos||'')+' <span class="metaDot">·</span> '+team+'</small></div></div>'+
 '<div class="bbb-directory-cell bbb-directory-college"><small>COLLEGE</small><strong>'+college+'</strong></div>'+
 '<div class="bbb-directory-cell bbb-directory-grade"><small>PROSPECT GRADE</small><strong class="'+(hasGrade?'hasGrade':'notGraded')+'">'+grade+'</strong></div>'+
 '<div class="bbb-directory-cell bbb-directory-coverage"><small>SCOUTING COVERAGE</small><div class="bbb-directory-tags">'+badges+'</div></div>'+
 '<div class="bbb-directory-cell bbb-directory-rank"><small>DYNASTY</small><strong>'+(r?'#'+esc(r.rank):'—')+'</strong></div>'+
 '<span class="bbb-directory-action" aria-hidden="true">View profile <b>→</b></span></a>'
}
function videoCard(v){return '<a class="card" href="/film?video='+encodeURIComponent(v.video_id)+'" style="padding:12px"><div class="featureImage"><img loading="lazy" src="https://i.ytimg.com/vi/'+encodeURIComponent(v.video_id)+'/hqdefault.jpg" alt="'+esc(v.title)+'"></div><div style="padding:12px 4px"><span class="tag">'+esc(v.category_label||"FILM STUDY")+'</span><h3 style="font-size:17px;margin:10px 0">'+esc(v.title)+'</h3><span class="arrow">Watch inside the Film Room →</span></div></a>'}
function home(){setTitle("Scouting & Film");const picks=["denzel-boston","christian-watson","parker-washington","matthew-golden"].map(k=>D.profiles.find(p=>p.player_key===k)).filter(Boolean);
app.innerHTML='<section class="hero"><div class="wrap heroGrid"><div><div class="eyebrow">A NEW ERA OF BOBBY’S BIG BOARD</div><h1>THE FILM<br>BEHIND <em>THE PLAYER.</em></h1><p class="lead">Scouting reports, verified athletic testing, real NFL production and independent film breakdowns—all in one place. Rankings are still here. Now the football comes first.</p><div class="actions"><a class="primary" href="/players">Explore Player Profiles →</a><a class="secondary" href="/film">Enter the Film Room ↗</a></div></div><div class="heroPanel"><a href="/film?video=ZpO1nYUEsqE"><div class="featureImage"><img src="https://i.ytimg.com/vi/ZpO1nYUEsqE/maxresdefault.jpg" alt="Parker Washington Film Breakdown"></div></a><div class="featureMeta"><span>FEATURED FILM STUDY</span><span>BBB ORIGINAL</span></div><h3>Parker Washington: Better Than You Think</h3><p>Route releases, leverage, ball skills and the details that turn production into evaluation.</p><a class="sectionlink" href="/film?video=ZpO1nYUEsqE">Watch inside the Film Room →</a></div></div></section>'+
'<div class="statsstrip"><div class="wrap statgrid"><div class="micro"><b>'+num(D.profiles.length)+'</b> player records</div><div class="micro"><b>'+num(D.prospects.length)+'</b> draft prospect records</div><div class="micro"><b>'+num(filmList().length)+'</b> film videos</div><div class="micro"><b>500</b> dynasty rankings</div></div></div>'+
'<section class="section"><div class="wrap">'+section("PLAYER LAB","Scouting spotlights","Player evaluations built on production and actual film.")+'<div class="bbb-directory-rows">'+picks.map(playerCard).join("")+'</div></div></section>'+
'<section class="section line"><div class="wrap">'+section("WATCH THE TAPE","Featured film breakdowns","From release technique to ball tracking, go deeper than highlights.")+'<div class="cards">'+filmList().slice(0,3).map(videoCard).join("")+'</div><p style="margin-top:22px"><a class="sectionlink" href="/film">Browse the Film Room →</a></p></div></section>'+
'<section class="section"><div class="wrap">'+section("CONNECTED TO THE EVALUATION","One platform. More ways to study.","Film-first during the season, prospect scouting before the draft, dynasty tools whenever you need them.")+'<div class="cards"><a class="card" href="/players"><span class="tag">01 / NFL PLAYERS</span><h3>Scouting profiles</h3><p>How they win, size and testing, game production and video evaluations.</p><span class="arrow">Open directory →</span></a><a class="card" href="/draft"><span class="tag">02 / DRAFT</span><h3>Prospects and comps</h3><p>Grades, projections and film reports for future NFL talent.</p><span class="arrow">Explore prospects →</span></a><a class="card" href="/dynasty/rankings"><span class="tag">03 / DYNASTY</span><h3>Top 500 and trade tools</h3><p>Your existing rankings, trade calculator and comparisons are preserved.</p><span class="arrow">Go to dynasty →</span></a></div></div></section>'}
function directory(isDraft){
 isDraftMode=!!isDraft;position="ALL";filter="";limit=40;draftYearFilter="2027";window.BBB_SORT=isDraft?"grade":"featured";setTitle(isDraft?"NFL Draft Hub":"Player Directory");
 const prospects=isDraft?D.prospects.map(g=>D.profiles.find(p=>p.player_key===g.player_key)||{player_key:g.player_key,name:g.name,pos:g.pos,team:"",college:""}):D.profiles;
 window.BBB_DIR=prospects.slice();
 app.innerHTML='<section class="section bbb-directory-page"><div class="wrap">'+
 section(isDraft?"PROSPECT SCOUTING":"THE PLAYER DATABASE",isDraft?"NFL Draft prospects.":"Know the player.","Real scouting notes, film breakdowns, college backgrounds and only the grades actually assigned in Bobby’s Big Board.")+
 (isDraft?'<div class="filterbar"><button class="filter active" data-year="2027">2027 Class</button><button class="filter" data-year="2028">2028 Class</button><button class="filter" data-year="ALL">All Classes</button></div>':'')+
 '<div class="bbb-directory-controls"><input id="directorySearch" class="search" aria-label="Find player" placeholder="Search players, colleges, or teams…">'+
 '<div class="bbb-directory-filter-buttons"><button class="filter active" data-pos="ALL">All</button><button class="filter" data-pos="QB">QB</button><button class="filter" data-pos="RB">RB</button><button class="filter" data-pos="WR">WR</button><button class="filter" data-pos="TE">TE</button></div>'+
 '<label class="bbb-sortlabel">Sort <select id="directorySort"><option value="featured">Featured</option><option value="name">Name A–Z</option><option value="grade">Prospect grade</option><option value="rank">Dynasty rank</option></select></label></div>'+
 '<div class="bbb-directory-meta"><span id="resultCount"></span><span>Grades shown only when recorded in BBB</span></div>'+
 '<div class="bbb-directory-head"><span>PLAYER</span><span>COLLEGE</span><span>PROSPECT GRADE</span><span>SCOUTING COVERAGE</span><span>DYNASTY</span><span></span></div>'+
 '<div id="directoryCards" class="bbb-directory-rows"></div><div style="margin-top:24px;text-align:center"><button class="secondary" id="loadMore">Load more players</button></div>'+
 '</div></section>';
 const q=document.getElementById("directorySearch");
 q.addEventListener("input",ev=>{filter=ev.target.value.toLowerCase().trim();limit=40;draw()});
 document.getElementById("directorySort").value=window.BBB_SORT;
 document.getElementById("directorySort").addEventListener("change",ev=>{window.BBB_SORT=ev.target.value;limit=40;draw()});
 document.querySelectorAll("[data-pos]").forEach(btn=>btn.addEventListener("click",()=>{position=btn.dataset.pos;limit=40;document.querySelectorAll("[data-pos]").forEach(b=>b.classList.toggle("active",b===btn));draw()}));
 document.querySelectorAll("[data-year]").forEach(btn=>btn.addEventListener("click",()=>{draftYearFilter=btn.dataset.year;limit=40;document.querySelectorAll("[data-year]").forEach(b=>b.classList.toggle("active",b===btn));draw()}));
 document.getElementById("loadMore").addEventListener("click",()=>{limit+=40;draw()});draw();
}
function draw(){
 const videos=new Set(D.videos.filter(x=>x.video_type==="long"&&x.privacy_status==="public").map(x=>x.player_key));
 let rows=window.BBB_DIR.filter(p=>(!isDraftMode||draftYearFilter==="ALL"||String(P.get(p.player_key)?.year||"")===draftYearFilter)&&(position==="ALL"||p.pos===position)&&(!filter||[p.name,p.team,p.college].join(" ").toLowerCase().includes(filter)));
 const grade=p=>{const g=P.get(p.player_key)?.grade;return g!=null&&Number.isFinite(Number(g))?Number(g):-1};
 const rank=p=>Number(R.get(p.player_key)?.rank||9999);
 const featured=p=>(videos.has(p.player_key)?2:0)+(p.overall_breakdown?1:0);
 const sort=window.BBB_SORT;
 rows.sort((a,b)=>sort==="name"?a.name.localeCompare(b.name):sort==="rank"?rank(a)-rank(b)||a.name.localeCompare(b.name):sort==="grade"?grade(b)-grade(a)||a.name.localeCompare(b.name):featured(b)-featured(a)||grade(b)-grade(a)||a.name.localeCompare(b.name));
 document.getElementById("resultCount").textContent=rows.length+" players found";
 document.getElementById("directoryCards").innerHTML=rows.length?rows.slice(0,limit).map(playerCard).join(""):'<div class="empty">'+(isDraftMode&&draftYearFilter==="2028"?"No 2028 prospect grades are in BBB yet. This class will populate as scouting begins.":"No matching players. Try another search.")+'</div>';
 document.getElementById("loadMore").style.display=rows.length>limit?"inline-flex":"none";
}
function filmRoom(){setTitle("Film Room");return window.BBB_FILM_ROOM.render(app,filmList(),{esc,profileLink:purl})}
const height=v=>v?Math.floor(Number(v)/12)+"′"+Number(v)%12+"″":"—";
function measurements(a){if(!a)return '<p class="note">Verified combine testing is not yet available for this player. Missing drills are never estimated.</p>';let rows=[["Height",height(a.height_in)],["Weight",a.weight_lb?a.weight_lb+" lb":"—"],["40-yard dash",a.forty_seconds?a.forty_seconds+"s":"Not recorded"],["Vertical jump",a.vertical_in?a.vertical_in+"″":"Not recorded"],["Broad jump",a.broad_in?a.broad_in+"″":"Not recorded"],["3-cone",a.three_cone_seconds?a.three_cone_seconds+"s":"Not recorded"]];return '<div class="measureGrid">'+rows.map(x=>'<div class="measure"><span>'+x[0]+'</span><strong>'+esc(x[1])+'</strong></div>').join("")+'</div><p class="tiny" style="margin-top:15px"><a class="sectionlink" href="'+esc(a.source_url||"#")+'" target="_blank" rel="noopener">Source: '+esc(a.source_name||"Verified testing")+' ↗</a></p>'}
async function detail(slug){
 const p=D.profiles.find(x=>x.player_key===slug);
 if(!p){app.innerHTML='<section class="section"><div class="wrap"><div class="empty">Player not found. <a href="/players">Back to directory</a></div></div></section>';return}
 const related=filmList().filter(v=>v.player_key===slug);
 return window.BBB_PROFILE_V5({app,p,r:R.get(slug),g:P.get(slug),a:A.get(slug),s:S.get(slug),sample:SAMPLES[slug],photo:portrait(p),videos:related,prospects:D.prospects,esc,stat,section,bbbDb,setTitle});
}

/* Native head-to-head removes the old #compare routing race entirely. */
function nativeCompare(){
 setTitle("Compare Players");const choices=D.ranks.map(r=>r.name).filter(Boolean).sort((a,b)=>a.localeCompare(b));
 app.innerHTML='<section class="section"><div class="wrap">'+section("BBB DYNASTY COMPARISON","Compare two players.","Independent BBB rankings, market context, existing prospect grades and linked scouting profiles.")+
 '<div class="bbb-compare-layout"><div class="bbb-compare-pick"><label for="cmpA">PLAYER A</label><input id="cmpA" list="bbbCompareChoices" placeholder="Start typing a player name…" autocomplete="off"><div id="cmpSummaryA" class="bbb-compare-help">Choose the first player.</div></div>'+
 '<div class="bbb-compare-pick"><label for="cmpB">PLAYER B</label><input id="cmpB" list="bbbCompareChoices" placeholder="Start typing a player name…" autocomplete="off"><div id="cmpSummaryB" class="bbb-compare-help">Choose the second player.</div></div></div>'+
 '<datalist id="bbbCompareChoices">'+choices.map(x=>'<option value="'+esc(x)+'"></option>').join("")+'</datalist>'+
 '<div id="cmpOutput" class="bbb-compare-table"><div class="bbb-compare-help">Select two ranked players to see a head-to-head comparison.</div></div>'+
 '<div class="bbb-compare-note">Prospect grades represent your saved film evaluations, not a universal score across every position. A missing grade means you have not graded that player in BBB.</div>'+
 '</div></section>';
 const parse=text=>D.ranks.find(r=>String(r.name||"").trim().toLowerCase()===text.trim().toLowerCase())||null;
 const detailHtml=r=>{
  if(!r)return '<p class="note">Select an exact name from the suggestions.</p>';
  const p=D.profiles.find(p=>p.player_key===r.player_key),g=P.get(r.player_key);
  return '<h3 class="bbb-compare-playername">'+esc(r.name)+'</h3><p>'+esc(r.pos||"")+' · '+esc(r.team||"")+(p?.college?' · '+esc(p.college):'')+'</p>'+
  '<div class="bbb-profile-grade-row"><span class="bbb-plain-pill">BBB #'+esc(r.rank)+'</span><span class="bbb-plain-pill">Prospect grade: <b>'+(g?.grade!=null?esc(g.grade):"Not graded")+'</b></span></div>'+
  '<a class="sectionlink" href="'+purl(r)+'">Full player profile →</a>';
 };
 const val=(r,field)=>r&&r[field]!=null?r[field]:"—";
 const render=()=>{
  const l=parse(document.getElementById("cmpA").value),r=parse(document.getElementById("cmpB").value);
  document.getElementById("cmpSummaryA").innerHTML=detailHtml(l);
  document.getElementById("cmpSummaryB").innerHTML=detailHtml(r);
  if(!l||!r){document.getElementById("cmpOutput").innerHTML='<div class="bbb-compare-help">Choose two players from the dropdown suggestions to compare their BBB evaluations.</div>';return}
  if(l.player_key===r.player_key){document.getElementById("cmpOutput").innerHTML='<div class="bbb-compare-help">Choose two different players.</div>';return}
  const lg=P.get(l.player_key),rg=P.get(r.player_key);
  const pa=D.profiles.find(x=>x.player_key===l.player_key),pb=D.profiles.find(x=>x.player_key===r.player_key);
  const grade=g=>g?.grade!=null?Number(g.grade).toFixed(1):"Not graded";
  const rows=[
   ["BBB overall rank","#"+l.rank,"#"+r.rank],
   ["Position rank",l.pos+(l.pr||"—"),r.pos+(r.pr||"—")],
   ["Team",val(l,"team"),val(r,"team")],
   ["Age",val(l,"age"),val(r,"age")],
   ["Market rank",l.market!=null?"#"+l.market:"—",r.market!=null?"#"+r.market:"—"],
   ["BBB vs market",val(l,"gap"),val(r,"gap")],
   ["College",pa?.college||"—",pb?.college||"—"],
   ["Prospect grade",grade(lg),grade(rg)],
   ["Draft class",lg?.year||"—",rg?.year||"—"],
   ["Pro comparison",lg?.comp||"—",rg?.comp||"—"]
  ];
  document.getElementById("cmpOutput").innerHTML=rows.map((x,i)=>'<div class="bbb-compare-line"><strong>'+esc(x[1])+'</strong><span>'+esc(x[0])+'</span><strong>'+esc(x[2])+'</strong></div>').join("");
 };
 for(const id of ["cmpA","cmpB"]){document.getElementById(id).addEventListener("input",render);document.getElementById(id).addEventListener("change",render)}
 const sp=new URLSearchParams(location.search);const initial=[sp.get("left"),sp.get("right")];
 if(initial[0]){const x=D.ranks.find(r=>r.player_key===initial[0]);if(x)document.getElementById("cmpA").value=x.name}
 if(initial[1]){const x=D.ranks.find(r=>r.player_key===initial[1]);if(x)document.getElementById("cmpB").value=x.name}
 render();
}

/* Unified Dynasty tab: the original working tool engine remains embedded inside the
   shared BBB navigation without showing another website header or resetting its state. */
function dynastyTool(key){
 const names={rankings:"Top 500 Rankings",trade:"Trade Calculator",compare:"Player Compare",rookies:"Rookie Rankings",movers:"Market Movers",updates:"Player Updates"};
 const labels={rankings:"rankings",trade:"trade",compare:"compare",rookies:"rookies",movers:"movers",updates:"updates"};
 const which=names[key]?key:"rankings";
 setTitle("Dynasty — "+names[which]);
 app.innerHTML='<section class="section"><div class="wrap">'+section("BBB DYNASTY TOOLKIT",names[which],"Rankings, trades and dynasty context in one connected BBB experience.")+'<div class="dynastyBack">'+Object.entries(names).map(([slug,name])=>'<a class="dynastyTab '+(slug===which?'active':'')+'" href="/dynasty/'+slug+'">'+esc(name)+'</a>').join("")+'</div><div style="margin-top:23px"><iframe class="dynastyFrame" id="dynastyToolFrame" title="BBB '+esc(names[which])+'" src="/dynasty-engine/#'+labels[which]+'" loading="eager"></iframe></div></div></section>';
 const iframe=document.getElementById("dynastyToolFrame");
 iframe.addEventListener("load",()=>{
   try{
    const inner=iframe.contentDocument;
    if(!inner)return;
    let scheduled=false;
    const resize=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;iframe.style.height=Math.max(830,inner.documentElement.scrollHeight+55,inner.body?.scrollHeight+55)+"px"})};
    resize();
    if(window.ResizeObserver){const ro=new ResizeObserver(resize);ro.observe(inner.body);}
    window.addEventListener("resize",resize,{passive:true});
   }catch(err){console.warn("Dynasty frame height fallback",err)}
 });
}

async function load(){let queries=[["profiles","site_profiles","select=player_key,name,pos,team,age,college,draft_year,overall_breakdown,latest_weekly_update,injury_status&order=name.asc&limit=1000"],["ranks","site_dynasty","select=player_key,rank,pr,name,pos,team,age,market,gap&order=rank.asc&limit=500"],["prospects","site_prospects","select=player_key,name,pos,year,grade,comp,traits&limit=300"],["athletics","bbb_player_athletics","select=*&limit=1000"],["scouting","bbb_player_scouting","select=*&limit=1000"],["videos","bbb_youtube_videos","select=video_id,player_key,title,video_type,content_archetype,privacy_status,published_at&order=published_at.desc&limit=250"],["films","bbb_player_films","select=player_key,youtube_video_id,title,video_type,editorial_status,published_at&editorial_status=eq.approved&order=published_at.desc&limit=250"]];
await Promise.all(queries.map(async q=>{try{D[q[0]]=await bbbDb(q[1],q[2])||[]}catch(x){console.warn("Failed loading "+q[0],x);D[q[0]]=[]}}));D.ranks.forEach(x=>R.set(x.player_key,x));D.prospects.forEach(x=>P.set(x.player_key,x));D.athletics.forEach(x=>A.set(x.player_key,x));D.scouting.forEach(x=>S.set(x.player_key,x));
try{const images=await fetch("/scouting-headshots.json",{cache:"force-cache"}).then(r=>r.ok?r.json():null);D.media=images?.players||{}}catch(e){console.warn("ESPN images unavailable",e)}
const path=decodeURIComponent(location.pathname).replace(/\/+$/,"")||"/";if(path==="/players")directory(false);else if(path==="/draft")directory(true);else if(path==="/film")filmRoom();else if(path.startsWith("/scouting/"))await detail(path.split("/").slice(2).join("/"));else if(path==="/dynasty/compare")nativeCompare();else if(path.startsWith("/dynasty"))dynastyTool(path.split("/")[2]||"rankings");else home()
}load().catch(e=>{console.error(e);app.innerHTML='<section class="section"><div class="wrap"><div class="empty">Unable to load scouting data. Refresh to try again.</div></div></section>'});
})();