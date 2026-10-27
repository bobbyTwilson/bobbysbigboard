(function(){
"use strict";
const app=document.getElementById("app"),D={profiles:[],ranks:[],prospects:[],athletics:[],scouting:[],videos:[],films:[],media:{}},R=new Map(),P=new Map(),A=new Map(),S=new Map(),SAMPLES=window.BBB_SCOUTING_SAMPLES||{};
let filter="",position="ALL",limit=32,isDraftMode=false,draftYearFilter="2027";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num=v=>v==null?"—":Number(v).toLocaleString("en-US");
// Duplicate legacy player aliases remain in the source database for historical
// references, but the public scouting preview resolves them to one canonical player.
const PROFILE_ALIASES=Object.freeze({"michael-penix":"michael-penix-jr","ben-sinnot":"ben-sinnott","lequint-allen":"lequint-allen-jr","erick-all":"erick-all-jr"});
const canonicalKey=key=>PROFILE_ALIASES[String(key||"")]||String(key||"");
const purl=p=>"/scouting/"+encodeURIComponent(canonicalKey(p.player_key));
const section=(k,t,s)=>'<div class="sectionHead"><div><div class="eyebrow">'+esc(k)+'</div><h2>'+esc(t)+'</h2><p>'+esc(s)+'</p></div></div>';
const stat=(k,v)=>'<div class="grade"><small>'+esc(k)+'</small><strong>'+esc(v)+'</strong></div>';
const chip=t=>'<span class="pill">'+esc(t)+'</span>';
// Memoize the joined film catalog: directory cards no longer rebuild it on every row.
let filmCatalogCache=null;
let homepagePending=true;
let activeRoute=0;
const pageCache=new Map();
const PAGE_CACHE_MS=90*1000;
let cachedHeadshots=null;
const assetHeadshots=()=>cachedHeadshots||(cachedHeadshots=fetch("/scouting-headshots.json",{cache:"force-cache"})
  .then(r=>r.ok?r.json():null).then(doc=>doc?.players||{})
  .catch(error=>{cachedHeadshots=null;console.warn("Headshot manifest unavailable",error);return{}}));

const filmList=()=>filmCatalogCache||(filmCatalogCache=window.BBB_FILM_ROOM.catalog(D.films,D.videos,D.profiles,D.prospects));
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
'<div class="statsstrip"><div class="wrap statgrid"><div class="micro"><b id="homeProfilesCount">'+(homepagePending?'…':num(D.profiles.length))+'</b> player records</div><div class="micro"><b id="homeProspectsCount">'+(homepagePending?'…':num(D.prospects.length))+'</b> draft prospect records</div><div class="micro"><b id="homeFilmsCount">'+(homepagePending?'…':num(filmList().length))+'</b> film videos</div><div class="micro"><b>500</b> dynasty rankings</div></div></div>'+
'<section class="section"><div class="wrap">'+section("PLAYER LAB","Scouting spotlights","Player evaluations built on production and actual film.")+'<div class="bbb-directory-rows" id="homeSpotlights">'+(homepagePending?'<div class="empty">Loading player spotlights…</div>':picks.map(playerCard).join(""))+'</div></div></section>'+
'<section class="section line"><div class="wrap">'+section("WATCH THE TAPE","Featured film breakdowns","From release technique to ball tracking, go deeper than highlights.")+'<div class="cards" id="homeFilmCards">'+(homepagePending?'<div class="card">Loading featured film…</div>':filmList().slice(0,3).map(videoCard).join(""))+'</div><p style="margin-top:22px"><a class="sectionlink" href="/film">Browse the Film Room →</a></p></div></section>'+
'<section class="section"><div class="wrap">'+section("CONNECTED TO THE EVALUATION","One platform. More ways to study.","Film-first during the season, prospect scouting before the draft, dynasty tools whenever you need them.")+'<div class="cards"><a class="card" href="/players"><span class="tag">01 / NFL PLAYERS</span><h3>Scouting profiles</h3><p>How they win, size and testing, game production and video evaluations.</p><span class="arrow">Open directory →</span></a><a class="card" href="/draft"><span class="tag">02 / DRAFT</span><h3>Prospects and comps</h3><p>Grades, projections and film reports for future NFL talent.</p><span class="arrow">Explore prospects →</span></a><a class="card" href="/dynasty/rankings"><span class="tag">03 / DYNASTY</span><h3>Top 500 and trade tools</h3><p>Your existing rankings, trade calculator and comparisons are preserved.</p><span class="arrow">Go to dynasty →</span></a></div></div></section>'}
function hydrateHome(){
 homepagePending=false;
 document.getElementById("homeProfilesCount").textContent=num(D.profiles.length);
 document.getElementById("homeProspectsCount").textContent=num(D.prospects.length);
 document.getElementById("homeFilmsCount").textContent=num(filmList().length);
 const picks=["denzel-boston","christian-watson","parker-washington","matthew-golden"].map(k=>D.profiles.find(p=>p.player_key===k)).filter(Boolean);
 document.getElementById("homeSpotlights").innerHTML=picks.map(playerCard).join("");
 document.getElementById("homeFilmCards").innerHTML=filmList().slice(0,3).map(videoCard).join("");
}
function directory(isDraft){
 isDraftMode=!!isDraft;position="ALL";filter="";limit=40;window.BBB_SORT=isDraft?"grade":"featured";setTitle(isDraft?"NFL Draft Hub":"Player Directory");
 // Build the class list from BBB's actual graded years. Retain 2028 for future reports.
 const recordedYears=D.prospects.map(g=>Number(g.year)).filter(y=>Number.isInteger(y)&&y>=2000&&y<=2100);
 const firstClass=recordedYears.length?Math.min(...recordedYears):2027;
 const lastClass=Math.max(2028,...recordedYears);
 const classYears=Array.from({length:lastClass-firstClass+1},(_,i)=>lastClass-i);
 const selectedClass=isDraft?new URLSearchParams(location.search).get("class"):null;
 draftYearFilter=selectedClass==="ALL"||classYears.includes(Number(selectedClass))&&selectedClass!==null?selectedClass:"2027";
 const prospects=isDraft?D.prospects.map(g=>D.profiles.find(p=>p.player_key===g.player_key)||{player_key:g.player_key,name:g.name,pos:g.pos,team:"",college:""}):D.profiles;
 window.BBB_DIR=prospects.slice();
 app.innerHTML='<section class="section bbb-directory-page"><div class="wrap">'+
 section(isDraft?"PROSPECT SCOUTING":"THE PLAYER DATABASE",isDraft?"NFL Draft prospects.":"Know the player.","Real scouting notes, film breakdowns, college backgrounds and only the grades actually assigned in Bobby’s Big Board.")+
 (isDraft?'<div class="bbb-draft-class-bar"><div class="bbb-draft-class-heading"><span class="eyebrow">DRAFT CLASS ARCHIVE</span><p>Every class graded by Bobby’s Big Board, from '+esc(firstClass)+' through '+esc(lastClass)+'.</p></div><label class="bbb-draft-class-picker" for="draftClassFilter"><span>DRAFT CLASS</span><select id="draftClassFilter" aria-label="Select NFL Draft class">'+
  classYears.map(year=>'<option value="'+year+'"'+(String(year)===draftYearFilter?' selected':'')+'>'+year+' NFL Draft'+(year===2028&&!D.prospects.some(g=>Number(g.year)===2028)?' · Coming Soon':'')+'</option>').join("")+
  '<option value="ALL"'+(draftYearFilter==="ALL"?' selected':'')+'>All Draft Classes</option></select></label></div>':'')+
 '<div class="bbb-directory-controls"><input id="directorySearch" class="search" aria-label="Find player" placeholder="Search players, colleges, or teams…">'+
 '<div class="bbb-directory-filter-buttons"><button class="filter active" data-pos="ALL">All</button><button class="filter" data-pos="QB">QB</button><button class="filter" data-pos="RB">RB</button><button class="filter" data-pos="WR">WR</button><button class="filter" data-pos="TE">TE</button></div>'+
 '<label class="bbb-sortlabel">Sort <select id="directorySort"><option value="featured">Featured</option><option value="name">Name A–Z</option><option value="grade">Prospect grade</option><option value="rank">Dynasty rank</option></select></label></div>'+
 '<div class="bbb-directory-meta"><span id="resultCount" aria-live="polite"></span><span id="draftClassContext">Grades shown only when recorded in BBB</span></div>'+
 '<div class="bbb-directory-head"><span>PLAYER</span><span>COLLEGE</span><span>PROSPECT GRADE</span><span>SCOUTING COVERAGE</span><span>DYNASTY</span><span></span></div>'+
 '<div id="directoryCards" class="bbb-directory-rows"></div><div style="margin-top:24px;text-align:center"><button class="secondary" id="loadMore">Load more players</button></div>'+
 '</div></section>';
 const q=document.getElementById("directorySearch");
 q.addEventListener("input",ev=>{filter=ev.target.value.toLowerCase().trim();limit=40;draw()});
 document.getElementById("directorySort").value=window.BBB_SORT;
 document.getElementById("directorySort").addEventListener("change",ev=>{window.BBB_SORT=ev.target.value;limit=40;draw()});
 document.querySelectorAll("[data-pos]").forEach(btn=>btn.addEventListener("click",()=>{position=btn.dataset.pos;limit=40;document.querySelectorAll("[data-pos]").forEach(b=>b.classList.toggle("active",b===btn));draw()}));
 if(isDraft){
   document.getElementById("draftClassFilter").addEventListener("change",event=>{
     draftYearFilter=event.target.value;
     limit=40;
     // Keep draft-class selections bookmarkable without a page reload.
     const next=new URL(location.href);
     if(draftYearFilter==="2027")next.searchParams.delete("class");
     else next.searchParams.set("class",draftYearFilter);
     history.replaceState(history.state,"",next.pathname+next.search+next.hash);
     draw();
   });
 }
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
 document.getElementById("resultCount").textContent=rows.length+" "+(rows.length===1?"player":"players")+(isDraftMode&&draftYearFilter!=="ALL"?" · "+draftYearFilter+" class":"")+" found";
 const context=document.getElementById("draftClassContext");
 if(context)context.textContent=isDraftMode?(draftYearFilter==="ALL"?"All recorded BBB draft evaluations":rows.length?"Graded evaluations · "+draftYearFilter+" NFL Draft":"Scouting grades coming soon · "+draftYearFilter+" NFL Draft"):"Grades shown only when recorded in BBB";
 document.getElementById("directoryCards").innerHTML=rows.length?rows.slice(0,limit).map(playerCard).join(""):'<div class="empty">'+
  (isDraftMode&&draftYearFilter==="2028"&&!filter&&position==="ALL"?"2028 scouting is coming. The class is ready for player grades and breakdowns as they are added.":
   isDraftMode&&draftYearFilter!=="ALL"&&!filter&&position==="ALL"?"No grades are recorded for the "+esc(draftYearFilter)+" NFL Draft class yet.":
   "No matching players. Try another search.")+'</div>';
 document.getElementById("loadMore").style.display=rows.length>limit?"inline-flex":"none";
}
function filmRoom(){setTitle("Film Room");return window.BBB_FILM_ROOM.render(app,filmList(),{esc,profileLink:purl})}
const height=v=>v?Math.floor(Number(v)/12)+"′"+Number(v)%12+"″":"—";
function measurements(a){if(!a)return '<p class="note">Verified combine testing is not yet available for this player. Missing drills are never estimated.</p>';let rows=[["Height",height(a.height_in)],["Weight",a.weight_lb?a.weight_lb+" lb":"—"],["40-yard dash",a.forty_seconds?a.forty_seconds+"s":"Not recorded"],["Vertical jump",a.vertical_in?a.vertical_in+"″":"Not recorded"],["Broad jump",a.broad_in?a.broad_in+"″":"Not recorded"],["3-cone",a.three_cone_seconds?a.three_cone_seconds+"s":"Not recorded"]];return '<div class="measureGrid">'+rows.map(x=>'<div class="measure"><span>'+x[0]+'</span><strong>'+esc(x[1])+'</strong></div>').join("")+'</div><p class="tiny" style="margin-top:15px"><a class="sectionlink" href="'+esc(a.source_url||"#")+'" target="_blank" rel="noopener">Source: '+esc(a.source_name||"Verified testing")+' ↗</a></p>'}
async function detail(slug){
 const p=D.profiles.find(x=>x.player_key===slug);
 if(!p){app.innerHTML='<section class="section"><div class="wrap"><div class="empty">Player not found. <a href="/players">Back to directory</a></div></div></section>';return}
 const related=filmList().filter(v=>v.player_key===slug);
 return window.BBB_PROFILE_V5({app,p,r:R.get(slug),g:P.get(slug),a:A.get(slug),s:S.get(slug),sample:SAMPLES[slug],photo:portrait(p),videos:related,prospects:D.prospects,profiles:D.profiles,esc,stat,section,bbbDb,setTitle});
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
 // Switching dynasty sub-tabs should NOT recreate the legacy app iframe.
 const existing=document.getElementById("dynastyToolFrame");
 if(existing&&app.contains(existing)){
   app.querySelectorAll(".dynastyTab").forEach(a=>a.classList.toggle("active",a.getAttribute("href")==="/dynasty/"+which));
   const heading=app.querySelector(".sectionHead h2");
   if(heading)heading.textContent=names[which];
   try{
     const frameUrl=new URL(existing.src,location.href);
     if(frameUrl.hash!=="#"+labels[which])existing.contentWindow.location.hash=labels[which];
   }catch(error){existing.src="/dynasty-engine/#"+labels[which]}
   return;
 }
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

/* Member features are rendered from the existing BBB app, preserving its
   real Supabase auth/session and BBB+/Sleeper integrations. No mock account UI. */
function legacyView(key){
 const names={account:"My BBB Account",plus:"BBB+ Membership",watchlist:"My Watchlist",stats:"Fantasy Statistics",terms:"Terms of Service",privacy:"Privacy Policy",billing:"BBB+ Billing Policy"};
 const which=Object.hasOwn(names,key)?key:"account";
 // Supabase email confirmation/password reset can land on the root URL with
 // access_token in the fragment. Give the existing auth handler that fragment,
 // then remove it from the public address bar immediately.
 const tokenHash=which==="account"&&/(?:^#|&)access_token=/.test(location.hash)?location.hash:"";
 const embeddedAuthUrl="/dynasty-engine/"+(tokenHash?location.search+tokenHash:"#"+which);
 setTitle(names[which]);
 const isLegal=["terms","privacy","billing"].includes(which);
 app.innerHTML='<section class="section bbb-member-section"><div class="wrap">'+
  (isLegal?'':section("BOBBY’S BIG BOARD",names[which],"Your existing BBB account, membership and connected tools—inside the new website."))+
  '<iframe id="bbbMemberFrame" class="dynastyFrame bbb-member-frame" title="'+esc(names[which])+
  '" src="'+esc(embeddedAuthUrl)+'" loading="eager"></iframe></div></section>';
 if(tokenHash)history.replaceState(history.state,"","/account");
 const frame=app.querySelector("#bbbMemberFrame");
 frame.addEventListener("load",()=>{
  try{
   const inner=frame.contentDocument;if(!inner)return;
   let scheduled=false;
   const resize=()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
     scheduled=false;
     const shown=[...inner.querySelectorAll(".bbb-account-view:not(.hide),.bbb-plus-view:not(.hide),.bbb-legal-view:not(.hide),.stats-view:not(.hide),.watchlist-view:not(.hide)")];
     let bottom=0;
     for(const el of shown){const b=el.getBoundingClientRect();bottom=Math.max(bottom,b.bottom+inner.defaultView.scrollY)}
     frame.style.height=Math.max(800,Math.min(5500,bottom+85))+"px";
    });
   };
   resize();
   if(inner.defaultView?.ResizeObserver){const obs=new inner.defaultView.ResizeObserver(resize);obs.observe(inner.body)}
   inner.defaultView?.addEventListener("hashchange",resize);
   inner.defaultView?.addEventListener("resize",resize);
   // Refresh height after login, account loading and membership checks.
   [250,900,1800,3500].forEach(ms=>inner.defaultView.setTimeout(resize,ms));
  }catch(error){console.warn("BBB member view sizing fallback",error)}
 });
}

async function load(){
  const visit=++activeRoute;
  // Dispose profile-only hash listeners before changing sections.
  if(window.BBB_SCOUTING_CLEANUP){
    window.BBB_SCOUTING_CLEANUP();
    window.BBB_SCOUTING_CLEANUP=null;
  }
  // Decide which page the visitor wants BEFORE making network requests.
  // The member iframe and dynasty tools already load their own data.
  let path=decodeURIComponent(location.pathname).replace(/\/+$/,"")||"/";
  const legacyPaths={"/rankings":"/dynasty/rankings","/rookies":"/dynasty/rookies","/prospects":"/draft","/trade":"/dynasty/trade","/compare":"/dynasty/compare","/movers":"/dynasty/movers","/updates":"/dynasty/updates"};
  const authCallbackHash=path==="/"&&/(?:^#|&)access_token=/.test(location.hash);
  if(authCallbackHash){history.replaceState(history.state,"","/account"+location.search+location.hash);path="/account"}
  const oldHash=(path==="/"&&/^#(account|plus|watchlist|stats|terms|privacy|billing)$/.test(location.hash))?location.hash.slice(1):"";
  if(oldHash){history.replaceState(history.state,"","/"+oldHash+location.search);path="/"+oldHash}
  if(legacyPaths[path]){history.replaceState(history.state,"",legacyPaths[path]+location.search+location.hash);path=legacyPaths[path]}
  if(["/account","/plus","/watchlist","/stats","/terms","/privacy","/billing"].includes(path))return legacyView(path.slice(1));
  if(path==="/dynasty/watchlist")return legacyView("watchlist");
  if(path==="/dynasty/stats")return legacyView("stats");
  if(path==="/") {
    homepagePending=true;
    home(); // Real homepage paints before any network request.
  }
  if(path==="/dynasty/compare"){ /* only rankings and light player metadata required below */ }
  else if(path.startsWith("/dynasty"))return dynastyTool(path.split("/")[2]||"rankings");

  const profile=path.startsWith("/scouting/");
  let playerKey="";
  if(profile){
    const requested=path.split("/").slice(2).join("/");
    playerKey=canonicalKey(requested);
    if(playerKey!==requested)history.replaceState(history.state,"","/scouting/"+encodeURIComponent(playerKey)+location.search+location.hash);
  }
  const profileFilter=profile?"&player_key=eq."+encodeURIComponent(playerKey):"";
  const remembered=pageCache.get(path);
  const hasFreshCopy=remembered&&Date.now()-remembered.savedAt<PAGE_CACHE_MS;
  if(!hasFreshCopy&&path!=="/"){
    setTitle(profile?"Player Scouting":path==="/players"?"Players":path==="/draft"?"NFL Draft":path==="/film"?"Film Room":"Player Comparison");
    app.innerHTML='<section class="section"><div class="wrap"><div class="eyebrow">BOBBY’S BIG BOARD</div><div class="bbb-route-loading" role="status">Opening '+esc(profile?"scouting profile":path==="/players"?"player directory":path==="/draft"?"draft board":path==="/film"?"film room":"player comparison")+'…</div></div></section>';
  }
  const slimProfiles="select=player_key,name,pos,team,college,draft_year,overall_breakdown";
  const fullProfiles="select=player_key,name,pos,team,age,college,draft_year,overall_breakdown,latest_weekly_update,injury_status";
  const slimRanks="select=player_key,rank";
  const fullRanks="select=player_key,rank,pr,name,pos,team,age,market,gap,tier,view,overview,latest_update,weekly_update_date,injury_status,injury_note";
  const slimProspects="select=player_key,name,pos,year,grade,comp";
  const fullProspects="select=player_key,name,pos,year,grade,comp,traits";
  const videoFields="select=video_id,player_key,title,video_type,content_archetype,privacy_status,published_at";
  const filmFields="select=video_id,player_key,title,video_type,editorial_status,published_at,created_at,updated_at";
  const query=(key,table,params)=>({key,table,params});
  let queries;
  if(profile){
    queries=[
      query("profiles","site_profiles",fullProfiles+profileFilter+"&limit=1"),
      query("ranks","site_dynasty",fullRanks+profileFilter+"&limit=1"),
      query("prospects","site_prospects",fullProspects+"&limit=300"),
      query("athletics","bbb_player_athletics","select=*"+profileFilter+"&limit=1"),
      query("scouting","bbb_player_scouting","select=*"+profileFilter+"&limit=1"),
      query("videos","bbb_youtube_videos",videoFields+profileFilter+"&order=published_at.desc&limit=50"),
      query("films","site_bbb_film_catalog",filmFields+profileFilter+"&order=created_at.desc&limit=50")
    ];
  }else if(path==="/film"){
    queries=[
      query("profiles","site_profiles",slimProfiles+"&order=name.asc&limit=1000"),
      query("prospects","site_prospects","select=player_key,name,pos,year&limit=300"),
      query("videos","bbb_youtube_videos",videoFields+"&order=published_at.desc&limit=250"),
      query("films","site_bbb_film_catalog",filmFields+"&order=created_at.desc&limit=500")
    ];
  }else if(path==="/dynasty/compare"){
    queries=[
      query("profiles","site_profiles",slimProfiles+"&order=name.asc&limit=1000"),
      query("ranks","site_dynasty",fullRanks+"&order=rank.asc&limit=500"),
      query("prospects","site_prospects",slimProspects+"&limit=300")
    ];
  }else{
    // Home and prospect directories require the lightweight shared listing
    // fields, not hundreds of full JSON trait maps and scouting/athletics rows.
    queries=[
      query("profiles","site_profiles",slimProfiles+"&order=name.asc&limit=1000"),
      query("ranks","site_dynasty",slimRanks+"&order=rank.asc&limit=500"),
      query("prospects","site_prospects",slimProspects+"&limit=300"),
      query("videos","bbb_youtube_videos",videoFields+"&order=published_at.desc&limit=250"),
      query("films","site_bbb_film_catalog",filmFields+"&order=created_at.desc&limit=500")
    ];
  }

  // Recent pages restore instantly; identical Supabase queries also reuse BBB's
  // shared request cache when visiting a section for the first time.
  let nextData;
  if(hasFreshCopy){
    nextData=remembered.data;
  }else{
    const results={};
    const imagesNeeded=profile||path==="/"||path==="/players"||path==="/draft";
    await Promise.all([
      ...queries.map(async q=>{
        try{results[q.key]=await bbbDb(q.table,q.params)||[]}
        catch(error){console.warn("Failed loading "+q.key,error);results[q.key]=[]}
      }),
      imagesNeeded?assetHeadshots().then(images=>{results.media=images}):Promise.resolve()
    ]);
    if(visit!==activeRoute)return; // Ignore responses from an abandoned navigation.
    nextData=results;
    pageCache.set(path,{savedAt:Date.now(),data:nextData});
    if(pageCache.size>40){
      for(const [key,value] of pageCache)if(Date.now()-value.savedAt>PAGE_CACHE_MS)pageCache.delete(key);
      if(pageCache.size>40)pageCache.delete(pageCache.keys().next().value);
    }
  }
  if(visit!==activeRoute)return;
  for(const key of ["profiles","ranks","prospects","athletics","scouting","videos","films"])
    D[key]=nextData[key]||[];
  D.media=nextData.media||{};
// Keep exactly one visible Michael Penix Jr. entry, with his existing Falcons
// identity, college history, draft pick, and newly unified scouting grade.
D.profiles=D.profiles.filter(p=>!Object.prototype.hasOwnProperty.call(PROFILE_ALIASES,p.player_key));
for(const map of [R,P,A,S])map.clear();
D.ranks.forEach(x=>R.set(x.player_key,x));D.prospects.forEach(x=>P.set(x.player_key,x));D.athletics.forEach(x=>A.set(x.player_key,x));D.scouting.forEach(x=>S.set(x.player_key,x));
filmCatalogCache=null;
if(path==="/players")directory(false);else if(path==="/draft")directory(true);else if(path==="/film")filmRoom();else if(["/account","/plus","/watchlist","/stats","/terms","/privacy","/billing"].includes(path))legacyView(path.slice(1));else if(path==="/dynasty/watchlist")legacyView("watchlist");else if(path==="/dynasty/stats")legacyView("stats");else if(profile){await detail(playerKey)}else if(path==="/dynasty/compare")nativeCompare();else if(path.startsWith("/dynasty"))dynastyTool(path.split("/")[2]||"rankings");else if(path==="/")hydrateHome();else home()
}
// Keep internal navigation in this document; full reloads discard the scouting
// app, re-download styles/scripts, and restart every view.
function localRoute(path){
  return path==="/"||path==="/players"||path==="/draft"||path==="/film"||
    path==="/dynasty"||path.startsWith("/scouting/")||
    /^\/dynasty\/(rankings|trade|compare|rookies|movers|updates|watchlist|stats)\/?$/.test(path)||
    /^\/(account|plus|watchlist|stats|terms|privacy|billing)\/?$/.test(path);
}
const renderRoute=()=>load().catch(error=>{
  console.error("Scouting route failed",error);
  app.innerHTML='<section class="section"><div class="wrap"><div class="empty">That section could not load. <a href="'+esc(location.pathname)+'">Retry page</a></div></div></section>';
});
document.addEventListener("click",event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const a=event.target?.closest?.("a[href]");
  if(!a||a.hasAttribute("download")||a.target&&a.target!=="_self")return;
  let next;
  try{next=new URL(a.href,location.href)}catch{return}
  if(next.origin!==location.origin||!localRoute(next.pathname))return;
  if(next.pathname===location.pathname&&next.search===location.search){
    if(next.hash)return; // Native fragment navigation (including profile tabs).
    event.preventDefault();return;
  }
  event.preventDefault();
  history.pushState(history.state,"",next.pathname+next.search+next.hash);
  renderRoute();
  window.scrollTo(0,0);
});
window.addEventListener("popstate",renderRoute);
// A player selected far down the embedded Top 500 must open at the TOP of
// the full website, not just at scrollTop=0 inside the dynasty iframe.
window.addEventListener("message",event=>{
  if(event.origin!==location.origin||event.data?.type!=="bbb:dynasty-profile-open")return;
  const frame=document.getElementById("dynastyToolFrame");
  if(!frame||event.source!==frame.contentWindow)return;
  window.scrollTo(0,0);
  requestAnimationFrame(()=>window.scrollTo(0,0));
});
renderRoute();
})();