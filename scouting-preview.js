(function(){
"use strict";
const app=document.getElementById("app"),D={profiles:[],ranks:[],prospects:[],athletics:[],scouting:[],videos:[],films:[],movers:[],media:{}},R=new Map(),P=new Map(),A=new Map(),S=new Map(),SAMPLES=window.BBB_SCOUTING_SAMPLES||{};
let filter="",position="ALL",limit=32,isDraftMode=false,draftYearFilter="2027";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num=v=>v==null?"—":Number(v).toLocaleString("en-US");
// Duplicate legacy player aliases remain in the source database for historical
// references, but the public scouting preview resolves them to one canonical player.
const PROFILE_ALIASES=Object.freeze({"michael-penix":"michael-penix-jr","ben-sinnot":"ben-sinnott","lequint-allen":"lequint-allen-jr","erick-all":"erick-all-jr"});
const canonicalKey=key=>PROFILE_ALIASES[String(key||"")]||String(key||"");
// Accept either a player row (directory/compare) or a player key (Film Room).
// The Film Room supplies a string, so object-only access produced /scouting/undefined.
const purl=p=>{const key=typeof p==="string"?p:p?.player_key;return key?"/scouting/"+encodeURIComponent(canonicalKey(key)):"/players";};
const section=(k,t,s)=>'<div class="sectionHead"><div><div class="eyebrow">'+esc(k)+'</div><h2>'+esc(t)+'</h2><p>'+esc(s)+'</p></div></div>';
const stat=(k,v)=>'<div class="grade"><small>'+esc(k)+'</small><strong>'+esc(v)+'</strong></div>';
const chip=t=>'<span class="pill">'+esc(t)+'</span>';
// Memoize the joined film catalog: directory cards no longer rebuild it on every row.
let filmCatalogCache=null;
let homepagePending=true;
let activeRoute=0;
const pageCache=new Map();
const PAGE_CACHE_MS=90*1000;

/* Shared scouting header: real player search and reliable Dynasty dropdown. */
function installScoutingHeaderTools(){
 const header=document.querySelector('header .top');
 const nav=header?.querySelector('nav');
 if(!header||!nav||header.dataset.bbbHeaderReady==='1')return;
 header.dataset.bbbHeaderReady='1';
 const dynasty=nav.querySelector('details.dropdown');
 const closeDynasty=()=>{if(dynasty?.open)dynasty.open=false;};
 // On phones/tablets the long desktop navigation is a single contained panel.
 // The native Dynasty <details> stays keyboard-accessible inside that panel.
 const mobileButton=header.querySelector('.bbb-mobile-menu-toggle');
 const mobileViewport=window.matchMedia('(max-width:1120px)');
 const mobileScrim=document.createElement('div');
 mobileScrim.className='bbb-mobile-nav-scrim';
 mobileScrim.hidden=true;
 mobileScrim.setAttribute('aria-hidden','true');
 document.body.appendChild(mobileScrim);
 const mobileMenuOpen=()=>header.classList.contains('bbb-mobile-nav-open');
 const closeMobileMenu=(restoreFocus=false)=>{
   const wasOpen=mobileMenuOpen();
   header.classList.remove('bbb-mobile-nav-open');
   document.body.classList.remove('bbb-mobile-nav-visible');
   mobileScrim.hidden=true;
   closeDynasty();
   mobileButton?.setAttribute('aria-expanded','false');
   mobileButton?.setAttribute('aria-label','Open site navigation');
   if(restoreFocus&&wasOpen)mobileButton?.focus({preventScroll:true});
 };
 const toggleMobileMenu=()=>{
   if(!mobileViewport.matches)return;
   const shouldOpen=!mobileMenuOpen();
   closeMobileMenu(false);
   if(!shouldOpen)return;
   header.classList.add('bbb-mobile-nav-open');
   document.body.classList.add('bbb-mobile-nav-visible');
   mobileScrim.hidden=false;
   mobileButton?.setAttribute('aria-expanded','true');
   mobileButton?.setAttribute('aria-label','Close site navigation');
 };
 mobileButton?.addEventListener('click',toggleMobileMenu);
 mobileScrim.addEventListener('click',()=>closeMobileMenu(true));
 nav.addEventListener('click',event=>{
   if(event.target instanceof Element&&event.target.closest('a[href]'))closeMobileMenu(false);
 });
 document.addEventListener('keydown',event=>{
   if(event.key==='Escape'&&mobileMenuOpen()){event.preventDefault();closeMobileMenu(true);}
 });
 window.addEventListener('popstate',()=>closeMobileMenu(false));
 if(mobileViewport.addEventListener){
   mobileViewport.addEventListener('change',event=>{if(!event.matches)closeMobileMenu(false);});
 }else if(mobileViewport.addListener){
   mobileViewport.addListener(event=>{if(!event.matches)closeMobileMenu(false);});
 }
 // Remove <details open> on selection, external click, Esc or back/forward.
 document.addEventListener('click',event=>{
   if(!dynasty?.open)return;
   const target=event.target;
   if(target instanceof Element && target.closest('details.dropdown summary'))return;
   if(target instanceof Element && target.closest('details.dropdown a')){closeDynasty();return;}
   if(!dynasty.contains(target))closeDynasty();
 },true);
 window.addEventListener('popstate',closeDynasty);
 const trigger=document.createElement('button');
 trigger.type='button';trigger.className='bbb-header-search-trigger';
 trigger.setAttribute('aria-label','Search players');
 trigger.setAttribute('aria-haspopup','dialog');
 trigger.innerHTML='<span class="bbb-search-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="10.8" cy="10.8" r="6.8"></circle><path d="m16 16 5 5"></path></svg></span><span>Search</span>';
 nav.appendChild(trigger);
 const backdrop=document.createElement('div');
 backdrop.className='bbb-header-search-overlay';backdrop.hidden=true;
 backdrop.innerHTML='<div class="bbb-header-search-backdrop" data-bbb-search-close></div>'+
 '<section class="bbb-header-search-dialog" role="dialog" aria-modal="true" aria-label="Search Bobby’s Big Board">'+
 '<div class="bbb-header-search-line"><span aria-hidden="true" class="bbb-header-search-glass"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="10.8" cy="10.8" r="6.8"></circle><path d="m16 16 5 5"></path></svg></span>'+
 '<input id="bbbHeaderSearchInput" autocomplete="off" type="search" placeholder="Search players, teams, or positions…" aria-label="Search players" />'+
 '<button type="button" class="bbb-header-search-close" aria-label="Close search" data-bbb-search-close>×</button></div>'+
 '<div class="bbb-header-search-description">SEARCH THE BOBBY’S BIG BOARD PLAYER DIRECTORY</div>'+
 '<div id="bbbHeaderSearchResults" class="bbb-header-search-results" role="listbox" aria-label="Players"><div class="bbb-header-search-message">Start typing to find a player.</div></div></section>';
 document.body.appendChild(backdrop);
 const field=backdrop.querySelector('#bbbHeaderSearchInput'),results=backdrop.querySelector('#bbbHeaderSearchResults');
 const styles=document.createElement('style');styles.id='bbb-header-search-styles';
 styles.textContent=[
 '.bbb-header-search-trigger{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid #41664b;background:#142d1c;color:#e2f3e4;border-radius:10px;min-height:37px;padding:7px 12px;cursor:pointer;font:inherit;font-size:12px;font-weight:800;white-space:nowrap}',
 '.bbb-header-search-trigger:hover,.bbb-header-search-trigger:focus-visible{border-color:#8de4a8;background:#22462d;outline:none}',
 '.bbb-header-search-trigger .bbb-search-icon{display:inline-grid;place-items:center;width:18px;height:18px;line-height:1;flex:0 0 18px}',
  '.bbb-header-search-trigger .bbb-search-icon svg,.bbb-header-search-glass svg{display:block;vertical-align:middle;stroke:currentColor;transform:none}',
 '.bbb-header-search-overlay[hidden]{display:none!important}',
 '.bbb-header-search-overlay{position:fixed;inset:0;z-index:300;display:flex;justify-content:center;align-items:flex-start;padding:clamp(58px,11vh,115px) 12px 20px}',
 '.bbb-header-search-backdrop{position:absolute;inset:0;background:rgba(1,9,5,.83);backdrop-filter:blur(8px)}',
 '.bbb-header-search-dialog{position:relative;width:min(680px,100%);background:#0c1c12;border:1px solid #4b7656;box-shadow:0 22px 90px #000b;border-radius:16px;overflow:hidden;color:#edf7ee}',
 '.bbb-header-search-line{display:flex;align-items:center;gap:10px;padding:15px 17px;border-bottom:1px solid #345b3f}',
 '.bbb-header-search-glass{display:inline-grid;place-items:center;width:28px;height:28px;flex:0 0 28px;color:#9cdeb2}',
  '.bbb-header-search-glass svg{width:24px;height:24px}',
 '.bbb-header-search-line input{flex:1;min-width:0;background:transparent;color:#fff;border:0;outline:0;font-size:16px;font-family:inherit}',
 '.bbb-header-search-line input::placeholder{color:#849c8a}',
 '.bbb-header-search-close{border:0;background:#21382a;border-radius:8px;color:#dbe8df;font-size:26px;width:34px;height:34px;cursor:pointer}',
 '.bbb-header-search-description{color:#82ad8e;font-size:10px;font-weight:900;letter-spacing:.08em;padding:12px 18px 3px}',
 '.bbb-header-search-results{padding:8px 10px 14px;overflow-y:auto;max-height:min(58vh,520px)}',
 '.bbb-header-search-results a{display:flex;align-items:center;gap:12px;padding:12px 11px;border-radius:10px;color:#ebf3e9;text-decoration:none;border-bottom:1px solid #1d3625}',
 '.bbb-header-search-results a:hover,.bbb-header-search-results a:focus-visible{background:#193d29;outline:2px solid #68bd86}',
 '.bbb-header-search-avatar{width:37px;height:37px;border-radius:10px;display:grid;place-items:center;background:#244630;color:#9cebb6;font-size:14px;font-weight:900;flex:none}',
 '.bbb-header-search-player{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}',
 '.bbb-header-search-player strong{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
 '.bbb-header-search-player small{font-size:11px;color:#a2b6a8}',
 '.bbb-header-search-rank{border:1px solid #345a40;border-radius:8px;padding:5px 8px;color:#96dba9;font-size:11px;font-weight:900}',
 '.bbb-header-search-message{padding:23px 14px;color:#b4cbb8;font-size:13px;text-align:center}',
 'body.bbb-header-search-open{overflow:hidden}',
 '@media(max-width:680px){.bbb-header-search-trigger{padding:8px 10px;min-height:39px}.bbb-header-search-trigger span:last-child{display:none}.bbb-header-search-overlay{padding-top:65px}.bbb-header-search-results{max-height:64dvh}}'
 ].join('\n');
 document.head.appendChild(styles);
 let open=false,loadPromise=null,records=[],ranking=new Map();
 const close=()=>{if(!open)return;open=false;backdrop.hidden=true;document.body.classList.remove('bbb-header-search-open');(mobileViewport.matches?mobileButton:trigger)?.focus({preventScroll:true});};
 const render=()=>{
   if(!open)return;
   const term=field.value.trim().toLowerCase();
   if(!term){results.innerHTML='<div class="bbb-header-search-message">Start typing to find a player.</div>';return;}
   if(!records.length){results.innerHTML='<div class="bbb-header-search-message">Loading player directory…</div>';return;}
   const tokens=term.split(/\s+/).filter(Boolean);
   const found=records.map(p=>{
     const name=String(p.name||'').toLowerCase();
     const hay=[p.name,p.team,p.pos,p.college].filter(Boolean).join(' ').toLowerCase();
     if(!tokens.every(word=>hay.includes(word)))return null;
     const score=name===term?0:name.startsWith(term)?1:name.includes(term)?2:3;
     return {p,score};
   }).filter(Boolean).sort((a,b)=>a.score-b.score||(ranking.get(a.p.player_key)||9999)-(ranking.get(b.p.player_key)||9999)||a.p.name.localeCompare(b.p.name)).slice(0,12);
   results.innerHTML=found.length?found.map(({p})=>{
     const initial=String(p.name||'?').split(/\s+/).slice(0,2).map(word=>word.charAt(0)).join('');
     const rank=ranking.get(p.player_key);
     return '<a href="/scouting/'+encodeURIComponent(p.player_key)+'" role="option"><span class="bbb-header-search-avatar">'+esc(initial)+'</span>'+
     '<span class="bbb-header-search-player"><strong>'+esc(p.name)+'</strong><small>'+esc([p.pos,p.team||p.college].filter(Boolean).join(' · '))+'</small></span>'+
     (rank?'<span class="bbb-header-search-rank">#'+rank+'</span>':'')+'</a>';
   }).join(''):'<div class="bbb-header-search-message">No matching players. Try a shorter name or a different spelling.</div>';
 };
 async function loadSearch(){
   if(loadPromise)return loadPromise;
   loadPromise=Promise.all([
     bbbDb('site_profiles','select=player_key,name,pos,team,college&order=name.asc&limit=1200'),
     bbbDb('site_dynasty','select=player_key,rank&order=rank.asc&limit=500')
   ]).then(([profiles,ranks])=>{
     records=Array.isArray(profiles)?profiles.filter(p=>p.player_key&&p.name):[];
     ranking=new Map((Array.isArray(ranks)?ranks:[]).map(p=>[p.player_key,p.rank]));
     render();
   }).catch(error=>{loadPromise=null;console.warn('BBB header player search',error);if(open)results.innerHTML='<div class="bbb-header-search-message">Player search is temporarily unavailable. Try again in a moment.</div>';});
   return loadPromise;
 }
 trigger.addEventListener('click',()=>{
   closeMobileMenu(false);closeDynasty();open=true;backdrop.hidden=false;document.body.classList.add('bbb-header-search-open');
   field.value='';render();
   requestAnimationFrame(()=>field.focus({preventScroll:true}));
   void loadSearch();
 });
 backdrop.querySelectorAll('[data-bbb-search-close]').forEach(el=>el.addEventListener('click',close));
 results.addEventListener('click',e=>{if(e.target.closest('a[href]'))close();});
 field.addEventListener('input',render);
 field.addEventListener('keydown',event=>{
   const links=[...results.querySelectorAll('a[href]')];
   if(event.key==='ArrowDown'&&links.length){event.preventDefault();links[0].focus();}
   if(event.key==='Enter'&&links.length){event.preventDefault();links[0].click();}
 });
 results.addEventListener('keydown',event=>{
   const links=[...results.querySelectorAll('a[href]')],at=links.indexOf(document.activeElement);
   if(event.key==='ArrowDown'&&at+1<links.length){event.preventDefault();links[at+1].focus();}
   if(event.key==='ArrowUp'){event.preventDefault();if(at>0)links[at-1].focus();else field.focus();}
 });
 document.addEventListener('keydown',event=>{
   if(event.key==='Escape'){closeDynasty();close();}
   if(event.key==='/'&&!open&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||'')){event.preventDefault();trigger.click();}
 });
 window.addEventListener('popstate',close);
}

let cachedHeadshots=null;
const assetHeadshots=()=>cachedHeadshots||(cachedHeadshots=fetch("/scouting-headshots.json",{cache:"force-cache"})
  .then(r=>r.ok?r.json():null).then(doc=>doc?.players||{})
  .catch(error=>{cachedHeadshots=null;console.warn("Headshot manifest unavailable",error);return{}}));

const filmList=()=>filmCatalogCache||(filmCatalogCache=window.BBB_FILM_ROOM.catalog(D.films,D.videos,D.profiles,D.prospects));
function setTitle(x){document.title=x+" | Bobby's Big Board";const k=location.pathname==="/dynasty/compare"?"compare":location.pathname.startsWith("/scouting/")?"players":location.pathname.split("/")[1]||"home";document.querySelectorAll("[data-nav]").forEach(a=>a.classList.toggle("active",a.dataset.nav===k))}
function portrait(p){const override=P.get(p.player_key)?.photo_url;if(override&&/^https:\/\//i.test(override))return override;const m=D.media[p.player_key];return m&&/^https:\/\/(a\.)?espncdn\.com\//.test(m.url||"")?m.url:""}
function playerCard(p){
 const r=R.get(p.player_key),g=P.get(p.player_key),src=portrait(p);
 const hasGrade=g&&g.grade!=null&&Number.isFinite(Number(g.grade)),v=filmList().filter(x=>x.player_key===p.player_key);
 const name=esc(p.name),team=esc(p.team||"—"),college=esc(p.college||"College not recorded"),grade=hasGrade?Number(g.grade).toFixed(1):"Not graded";
 const head=src?'<img loading="lazy" src="'+esc(src)+'" alt="ESPN player headshot" onerror="this.remove()">':'';
 const initials=esc(String(p.name||"?").split(/\s+/).slice(0,2).map(x=>x[0]).join(""));
 // A grade is already an evaluation. Published reports and BBB+ notebooks
 // are stored on the prospect row, not in the legacy overall_breakdown field.
 const hasPublishedReport=!!g?.notebook_available||!!String(g?.overview||'').trim();
 const hasScoutingNotes=hasPublishedReport||!!String(p.overall_breakdown||'').trim();
 const badges=(hasScoutingNotes?'<span class="coverageTag">Scouting notes</span>':hasGrade?'<span class="coverageTag">Grade recorded</span>':'')+
  (g?.notebook_available?'<span class="coverageTag premium">BBB+ Notebook</span>':'')+
  (v.length?'<span class="coverageTag filmed">'+v.length+' film video'+(v.length>1?'s':'')+'</span>':'')+
  (!hasGrade&&!hasScoutingNotes&&!v.length?'<span class="coverageEmpty">Evaluation in progress</span>':'');
 return '<a class="bbb-directory-row" href="'+purl(p)+'" aria-label="Open '+name+' scouting profile">'+
 '<div class="bbb-directory-person"><div class="bbb-directory-avatar"><span>'+initials+'</span>'+head+'</div><div class="bbb-directory-person-text"><strong>'+name+'</strong><small>'+esc(p.pos||'')+' <span class="metaDot">·</span> '+team+'</small></div></div>'+
 '<div class="bbb-directory-cell bbb-directory-college"><small>COLLEGE</small><strong>'+college+'</strong></div>'+
 '<div class="bbb-directory-cell bbb-directory-grade"><small>PROSPECT GRADE</small><strong class="'+(hasGrade?'hasGrade':'notGraded')+'">'+grade+'</strong></div>'+
 '<div class="bbb-directory-cell bbb-directory-coverage"><small>SCOUTING COVERAGE</small><div class="bbb-directory-tags">'+badges+'</div></div>'+
 '<div class="bbb-directory-cell bbb-directory-rank"><small>DYNASTY</small><strong>'+(r?'#'+esc(r.rank):'—')+'</strong></div>'+
 '<span class="bbb-directory-action" aria-hidden="true">View profile <b>→</b></span></a>'
}
function videoCard(v){return '<a class="card" href="/film?video='+encodeURIComponent(v.video_id)+'" style="padding:12px"><div class="featureImage"><img loading="lazy" src="https://i.ytimg.com/vi/'+encodeURIComponent(v.video_id)+'/hqdefault.jpg" alt="'+esc(v.title)+'"></div><div style="padding:12px 4px"><span class="tag">'+esc(v.category_label||"FILM STUDY")+'</span><h3 style="font-size:17px;margin:10px 0">'+esc(v.title)+'</h3><span class="arrow">Watch inside the Film Room →</span></div></a>'}
function featuredFilmHtml(v){
 if(!v)return '<div class="featureMeta"><span>FILM LIBRARY</span></div><h3>New film breakdowns are on the way.</h3><p>Browse our scouting evaluations and player profiles.</p><a class="sectionlink" href="/film">Open the Film Room →</a>';
 const url="/film?video="+encodeURIComponent(v.video_id);
 return '<a href="'+url+'"><div class="featureImage"><img loading="eager" src="https://i.ytimg.com/vi/'+encodeURIComponent(v.video_id)+'/hqdefault.jpg" alt="'+esc(v.title)+'"></div></a>'+
 '<div class="featureMeta"><span>NEWEST FILM STUDY</span><span>BBB ORIGINAL</span></div>'+
 '<h3>'+esc(v.title)+'</h3><p>'+esc(v.player_name)+' · '+esc(v.category_label)+'</p>'+
 '<a class="sectionlink" href="'+url+'">Watch in the Film Room →</a>';
}
function spotlightPlayers(){
 const seen=new Set(),featured=[];
 for(const film of filmList()){
  const p=D.profiles.find(row=>row.player_key===film.player_key);
  if(p&&!seen.has(p.player_key)){featured.push(p);seen.add(p.player_key)}
  if(featured.length===4)break;
 }
 if(featured.length<4)for(const rank of D.ranks){
  const p=D.profiles.find(row=>row.player_key===rank.player_key);
  if(p&&!seen.has(p.player_key)){featured.push(p);seen.add(p.player_key)}
  if(featured.length===4)break;
 }
 return featured;
}
function home(){
 setTitle("Scouting & Film");
 app.innerHTML="<section class=\"hero\"><div class=\"wrap heroGrid\"><div><div class=\"eyebrow\">THE FILM BEHIND THE PLAYER</div><h1>THE FILM<br>BEHIND <em>THE PLAYER.</em></h1><p class=\"lead\">Scouting reports, verified athletic testing, real NFL production and independent film breakdowns—all in one place. Rankings are still here. Now the football comes first.</p><div class=\"actions\"><a class=\"primary\" href=\"/players\">Explore Player Profiles →</a><a class=\"secondary\" href=\"/film\">Enter the Film Room ↗</a></div></div><div id=\"homeFeature\" class=\"heroPanel\"><div class=\"featureMeta\"><span>NEWEST FILM STUDY</span></div><p>Loading our latest breakdown…</p></div></div></section>\n<div class=\"statsstrip\"><div class=\"wrap statgrid\"><div class=\"micro\"><b id=\"homeProfilesCount\">…</b> player records</div><div class=\"micro\"><b id=\"homeProspectsCount\">…</b> draft prospect records</div><div class=\"micro\"><b id=\"homeFilmsCount\">…</b> film studies</div><div class=\"micro\"><b id=\"homeRankCount\">500</b> dynasty rankings</div></div></div>\n<section class=\"section\"><div class=\"wrap\"><div class=\"sectionHead\"><div><div class=\"eyebrow\">LATEST ON FILM</div><h2>Fresh scouting spotlights.</h2><p>The players featured in our most recent film breakdowns. Updated automatically when new studies go public.</p></div></div><div class=\"bbb-directory-rows\" id=\"homeSpotlights\"><div class=\"empty\">Loading recent film subjects…</div></div></div></section>\n<section class=\"section line\"><div class=\"wrap\"><div class=\"sectionHead\"><div><div class=\"eyebrow\">WATCH THE TAPE</div><h2>Newest breakdowns.</h2><p>The latest published film evaluations, from releases and separation to contact balance and decision-making.</p></div></div><div class=\"cards\" id=\"homeFilmCards\"><div class=\"card\">Loading the film library…</div></div><p style=\"margin-top:22px\"><a class=\"sectionlink\" href=\"/film\">Explore all film studies →</a></p></div></section>\n<section class=\"section\"><div class=\"wrap\"><div class=\"sectionHead\"><div><div class=\"eyebrow\">DYNASTY MARKET</div><h2>Players climbing the board.</h2><p>Biggest recorded seven-day BBB ranking risers. Movement is based on actual rank snapshots.</p></div></div><div class=\"bbb-home-movers\" id=\"homeMovers\"><div class=\"empty\">Loading recent movement…</div></div><p style=\"margin-top:20px\"><a class=\"sectionlink\" href=\"/dynasty/movers\">All market movers →</a></p></div></section>\n<section class=\"section line\"><div class=\"wrap\"><div class=\"sectionHead\"><div><div class=\"eyebrow\">CONNECTED TO THE EVALUATION</div><h2>One platform. More ways to study.</h2><p>Scouting, the NFL Draft, and Superflex dynasty analysis—without leaving BBB.</p></div></div><div class=\"cards\"><a class=\"card\" href=\"/players\"><span class=\"tag\">01 / NFL PLAYERS</span><h3>Scouting profiles</h3><p>How they win, size and testing, game production and video evaluations.</p><span class=\"arrow\">Open directory →</span></a><a class=\"card\" href=\"/draft\"><span class=\"tag\">02 / DRAFT</span><h3>Prospects and comps</h3><p>Grades, projections and film reports for future NFL talent.</p><span class=\"arrow\">Explore prospects →</span></a><a class=\"card\" href=\"/dynasty/rankings\"><span class=\"tag\">03 / DYNASTY</span><h3>Top 500 and trade tools</h3><p>Superflex rankings, market movement, and dynasty comparisons.</p><span class=\"arrow\">Explore dynasty →</span></a></div></div></section>\n<section class=\"section bbb-community\" aria-label=\"Join Bobby's Big Board community\"><div class=\"wrap bbb-community-inner\"><div><div class=\"eyebrow\">WATCH · DISCUSS · RETURN</div><h2>More football between the videos.</h2><p>Get the latest film breakdowns on YouTube, talk scouting in our Discord, and explore the free player database.</p></div><div class=\"bbb-community-actions\"><a class=\"primary\" href=\"https://www.youtube.com/channel/UCksffvipLdUOO4GGh4Lq_Fg?sub_confirmation=1\" rel=\"noopener noreferrer\" target=\"_blank\">Subscribe on YouTube ↗</a><a class=\"secondary\" href=\"https://discord.gg/J26MZPyu6q\" rel=\"noopener noreferrer\" target=\"_blank\">Join the BBB Discord ↗</a></div></div></section>";
}
function hydrateHome(){
 homepagePending=false;
 const update=(id,value)=>{const node=document.getElementById(id);if(node)node.textContent=num(value)};
 update("homeProfilesCount",D.profiles.length);
 update("homeProspectsCount",D.prospects.length);
 update("homeFilmsCount",filmList().length);
 update("homeRankCount",D.ranks.length);
 const featured=document.getElementById("homeFeature");
 if(featured)featured.innerHTML=featuredFilmHtml(filmList()[0]);
 const players=spotlightPlayers();
 const spot=document.getElementById("homeSpotlights");
 if(spot)spot.innerHTML=players.length?players.map(playerCard).join(""):'<div class="empty">More player evaluations are on the way.</div>';
 const cards=document.getElementById("homeFilmCards");
 if(cards)cards.innerHTML=filmList().length?filmList().slice(0,3).map(videoCard).join(""):'<div class="card">New film evaluations are coming soon.</div>';
 const movers=document.getElementById("homeMovers");
 const risers=(D.movers||[]).filter(x=>Number(x.bbb_move_7d)>0&&D.profiles.some(p=>p.player_key===x.player_key)).slice(0,5);
 if(movers)movers.innerHTML=risers.length?risers.map(x=>'<a class="bbb-home-mover" href="'+purl(x.player_key)+'"><div><strong>'+esc(x.name)+'</strong><small>'+esc(x.pos||"")+' · '+esc(x.team||"")+' · BBB #'+esc(x.current_rank)+'</small></div><span>↑ '+esc(x.bbb_move_7d)+' spots</span></a>').join(""):'<div class="empty">No seven-day risers are recorded yet. See the full movers board.</div>';
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
 '<label class="bbb-sortlabel">Sort <select id="directorySort"><option value="featured">Featured</option><option value="name">Name A–Z</option><option value="grade">Prospect grade</option><option value="draft-year">Draft class (newest)</option><option value="rank">Dynasty rank</option></select></label></div>'+
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
 // A published scouting notebook is more meaningful than a legacy profile summary.
 // Featured should surface the newest 2027 film evaluations, rather than bury them
 // behind older NFL prospect notes. Non-published grades still remain discoverable.
 const featured=p=>{
  const g=P.get(p.player_key);
  const graded=g?.grade!=null&&Number.isFinite(Number(g.grade));
  const published=!!g?.notebook_available||!!String(g?.overview||'').trim();
  return (published?12:0)+(videos.has(p.player_key)?5:0)+
   (graded&&Number(g.year)>=2027?3:0)+(p.overall_breakdown?1:0);
 };
 const sort=window.BBB_SORT;
 rows.sort((a,b)=>sort==="name"?a.name.localeCompare(b.name):sort==="rank"?rank(a)-rank(b)||a.name.localeCompare(b.name):sort==="grade"?grade(b)-grade(a)||a.name.localeCompare(b.name):sort==="draft-year"?Number(P.get(b.player_key)?.year||0)-Number(P.get(a.player_key)?.year||0)||grade(b)-grade(a)||a.name.localeCompare(b.name):featured(b)-featured(a)||grade(b)-grade(a)||a.name.localeCompare(b.name));
 document.getElementById("resultCount").textContent=rows.length+" "+(rows.length===1?"player":"players")+(isDraftMode&&draftYearFilter!=="ALL"?" · "+draftYearFilter+" class":"")+" found";
 const context=document.getElementById("draftClassContext");
 if(context)context.textContent=isDraftMode?(draftYearFilter==="ALL"?"All recorded BBB draft evaluations":rows.length?"Graded evaluations · "+draftYearFilter+" NFL Draft":"Scouting grades coming soon · "+draftYearFilter+" NFL Draft"):(sort==="featured"?"Featured · published scouting reports and film first":sort==="draft-year"?"Newest NFL Draft classes first":"Grades shown only when recorded in BBB");
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

/* The Comparison Lab uses the same recorded traits as Scouting DNA profiles.
 * Player-specific detail is lazy loaded only after a visitor selects both players. */
function nativeCompare(){
 if(!window.BBB_SCOUTING_DNA?.lab){
  app.innerHTML='<section class="section"><div class="wrap"><div class="empty">Comparison Lab is temporarily unavailable. <a href="/players">Browse players</a></div></div></section>';return;
 }
 return window.BBB_SCOUTING_DNA.lab({
  app,profiles:D.profiles,ranks:D.ranks,prospects:D.prospects,
  bbbDb,purl,setTitle,portrait,esc
 });
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
 app.innerHTML='<section class="section"><div class="wrap">'+section("BBB DYNASTY TOOLKIT",names[which],"Rankings, trades and dynasty context in one connected BBB experience.")+'<div class="dynastyBack">'+Object.entries(names).map(([slug,name])=>'<a class="dynastyTab '+(slug===which?'active':'')+'" href="/dynasty/'+slug+'">'+esc(name)+'</a>').join("")+'</div><div style="margin-top:23px"><iframe class="dynastyFrame" id="dynastyToolFrame" title="BBB '+esc(names[which])+'" src="/dynasty-engine/#'+labels[which]+'" scrolling="no" loading="eager"></iframe></div></div></section>';
 const iframe=document.getElementById("dynastyToolFrame");
 iframe.addEventListener("load",()=>{
   try{
    const inner=iframe.contentDocument,win=inner?.defaultView;
    if(!inner?.body||!win)return;
    let scheduled=false,lastHeight=0;
    let observer=null;
    const resize=()=>{
      if(scheduled)return;
      scheduled=true;
      requestAnimationFrame(()=>{
        scheduled=false;
        if(!iframe.isConnected){
          observer?.disconnect();
          window.removeEventListener("resize",resize);
          win.removeEventListener("hashchange",resize);
          win.removeEventListener("popstate",resize);
          return;
        }
        // ScrollHeight includes the iframe viewport itself. Adding 55px to
        // that measurement created a resize feedback loop and flashing bars.
        // Measure the BOTTOM of actual visible content instead, so an iframe
        // height change cannot make the next target height grow by itself.
        let bottom=0;
        for(const el of inner.body.children){
          if(!el.getClientRects().length)continue;
          const position=win.getComputedStyle(el).position;
          if(position==="fixed"||position==="absolute")continue;
          bottom=Math.max(bottom,el.getBoundingClientRect().bottom+win.scrollY);
        }
        const target=Math.max(820,Math.ceil(bottom+20));
        if(Math.abs(target-lastHeight)<3)return;
        lastHeight=target;
        iframe.style.height=target+"px";
      });
    };
    resize();
    if(win.ResizeObserver){observer=new win.ResizeObserver(resize);observer.observe(inner.body);}
    win.addEventListener("hashchange",resize);
    win.addEventListener("popstate",resize);
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
 // Both successful Auth callbacks and rejected/expired links must reach
 // the existing account handler in the embedded dynasty engine.
 const tokenHash=which==="account"&&/(?:^#|&)(?:access_token|error|error_description)=/.test(location.hash)?location.hash:"";
 // The outer page is a shell: forward Stripe's return result so the original
 // BBB+ module can confirm subscription activation after checkout completes.
 const checkoutResult=which==="plus"?new URLSearchParams(location.search).get("checkout"):"";
 const checkoutSearch=["success","canceled"].includes(checkoutResult)?"?checkout="+checkoutResult:"";
 const embeddedAuthUrl="/dynasty-engine/"+(tokenHash?location.search+tokenHash:checkoutSearch+"#"+which);
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
  const authCallbackHash=path==="/"&&/(?:^#|&)(?:access_token|error|error_description)=/.test(location.hash);
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
  // Always re-read live prospect grades after navigation, including a previously visited profile.
  const liveProspectRoute=profile||["/","/draft","/players","/film","/dynasty/compare"].includes(path);
  const hasFreshCopy=!liveProspectRoute&&remembered&&Date.now()-remembered.savedAt<PAGE_CACHE_MS;
  if(!hasFreshCopy&&path!=="/"){
    setTitle(profile?"Player Scouting":path==="/players"?"Players":path==="/draft"?"NFL Draft":path==="/film"?"Film Room":"Player Comparison");
    app.innerHTML='<section class="section"><div class="wrap"><div class="eyebrow">BOBBY’S BIG BOARD</div><div class="bbb-route-loading" role="status">Opening '+esc(profile?"scouting profile":path==="/players"?"player directory":path==="/draft"?"draft board":path==="/film"?"film room":"player comparison")+'…</div></div></section>';
  }
  const slimProfiles="select=player_key,name,pos,team,college,draft_year,overall_breakdown";
  const fullProfiles="select=player_key,name,pos,team,age,college,draft_year,overall_breakdown,latest_weekly_update,weekly_update_date,injury_status";
  const slimRanks="select=player_key,rank";
  const fullRanks="select=player_key,rank,pr,name,pos,team,age,market,gap,tier,view,overview,latest_update,weekly_update_date,injury_status,injury_note";
  const slimProspects="select=player_key,name,pos,year,grade,comp,notebook_available,photo_url,photo_credit";
  const fullProspects="select=player_key,name,pos,year,grade,comp,traits,overview,notebook_available,photo_url,photo_credit";
  const videoFields="select=video_id,player_key,title,video_type,content_archetype,privacy_status,published_at";
  const filmFields="select=video_id,player_key,title,description,video_type,editorial_status,published_at,created_at,updated_at";
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
      query("films","site_bbb_film_catalog",filmFields+"&order=created_at.desc&limit=500"),
      ...(path==="/"?[query("movers","site_movers","select=player_key,name,pos,team,current_rank,bbb_move_7d&order=bbb_move_7d.desc&limit=30")]:[])
    ];
  }

  // Recent pages restore instantly; identical Supabase queries also reuse BBB's
  // shared request cache when visiting a section for the first time.
  let nextData;
  if(hasFreshCopy){
    nextData=remembered.data;
  }else{
    const results={};
    const imagesNeeded=profile||path==="/"||path==="/players"||path==="/draft"||path==="/dynasty/compare";
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
  D.movers=nextData.movers||[];
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
const renderRoute=()=>{
 window.BBB_SITE_METRICS?.route();
 return load().catch(error=>{
  console.error("Scouting route failed",error);
  app.innerHTML='<section class="section"><div class="wrap"><div class="empty">That section could not load. <a href="'+esc(location.pathname)+'">Retry page</a></div></div></section>';
});
};
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
installScoutingHeaderTools();
renderRoute();
})();