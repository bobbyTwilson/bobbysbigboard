/* Bobby's Big Board Film Room: public, player-matched YouTube embeds.
 * Approved catalog records + clearly titled newly synchronized public film uploads.
 * No private/unlisted playback; third-party player loads on explicit click only.
 */
(function(){
"use strict";
const valid=id=>/^[A-Za-z0-9_-]{11}$/.test(String(id||""));
const fallbackEsc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const thumb=(id,quality="hqdefault")=>"https://i.ytimg.com/vi/"+encodeURIComponent(id)+"/"+quality+".jpg";
function upgradePoster(img){
 if(!img)return;
 const id=img.dataset.videoId;
 if(!valid(id))return;
 const qualities=["maxresdefault","sddefault","hqdefault"];
 let index=0;
 const fallback=()=>{if(index>=qualities.length-1)return;index++;img.src=thumb(id,qualities[index]);};
 img.addEventListener("error",fallback);
 img.addEventListener("load",()=>{if(img.naturalWidth<400)fallback();});
 img.src=thumb(id,qualities[0]);
}

const safeId=id=>valid(id)?encodeURIComponent(id):"";
/* Confirmed by NFL rightsholder's embedded-player error on the BBB preview.
   Keep affected films discoverable without retrying a blocked third-party iframe.
   Add future cases only after verifying their playback restrictions. */
const externalOnlyIds=new Set(["cdERkoRmnH0"]);
const runtimeErrors=new Map();
const cacheKey="bbb-film-external-playback-v1";
try{
 const cached=JSON.parse(sessionStorage.getItem(cacheKey)||"[]");
 if(Array.isArray(cached))for(const id of cached.slice(0,100))if(valid(id))runtimeErrors.set(id,150);
}catch{}
const mustWatchExternally=id=>externalOnlyIds.has(String(id||""))||runtimeErrors.has(String(id||""));
function rememberExternal(id,code){
 if(!valid(id))return;
 runtimeErrors.set(id,code);
 // An embed restriction can be changed by its owner, so cache only for this browser tab.
 if(code===101||code===150)try{
  sessionStorage.setItem(cacheKey,JSON.stringify([...runtimeErrors].filter(([key,status])=>status===101||status===150).map(([key])=>key).slice(0,100)));
 }catch{}
}
function externalReason(id){
 const code=runtimeErrors.get(id);
 if(code===100)return "YouTube reports that this video is unavailable or private. You can check its YouTube page for updates.";
 if(code===153)return "YouTube could not authorize playback in this embedded player. Try opening the video directly on YouTube.";
 if(code===5)return "The embedded player couldn't play this video. Try watching it directly on YouTube.";
 return "The rights holder has restricted this video's playback on other websites. The full film breakdown can still be opened on YouTube.";
}
// The YouTube IFrame Player API reports copyright / embed restrictions as 101 or 150.
// Do not interpret iframe 'load' as success: blocked YouTube error pages also load.
let playerApiPromise=null;
function loadPlayerApi(){
 if(window.YT?.Player)return Promise.resolve(window.YT);
 if(playerApiPromise)return playerApiPromise;
 playerApiPromise=new Promise((resolve,reject)=>{
  let settled=false;
  const prior=window.onYouTubeIframeAPIReady;
  const settle=(error,yt)=>{
   if(settled)return;settled=true;clearTimeout(timeout);
   if(error)reject(error);else resolve(yt);
  };
  window.onYouTubeIframeAPIReady=()=>{try{if(typeof prior==="function")prior()}catch{};settle(null,window.YT)};
  const script=document.createElement("script");
  script.src="https://www.youtube.com/iframe_api";
  script.async=true;
  script.onerror=()=>settle(new Error("YouTube player API could not load"));
  const timeout=setTimeout(()=>settle(new Error("YouTube player API timed out")),10000);
  document.head.appendChild(script);
 }).catch(error=>{playerApiPromise=null;throw error});
 return playerApiPromise;
}
const youtubeUrl=id=>"https://www.youtube.com/watch?v="+safeId(id);
const categoryLabels={prospect:"Draft Prospect",nfl:"NFL Film"};
function catalog(approved,channel,profiles,prospects){
 const playerMap=new Map((profiles||[]).map(p=>[p.player_key,p]));
 const prospectMap=new Map((prospects||[]).map(p=>[p.player_key,p]));
 const seen=new Set(),entries=[];
 for(const v of approved||[]){
  const id=v.youtube_video_id||v.video_id;
  if(v.editorial_status!=="approved"||!valid(id)||seen.has(id)||!v.player_key)continue;
  const p=playerMap.get(v.player_key);
  if(!p)continue;
  const prospect=prospectMap.get(v.player_key),draftYear=Number(prospect?.year||p.draft_year||0);
  // Prospect status follows the player's current roster/class, not their historical video type.
  // Drafted rookies and veterans share NFL Film, including 2025/2026 rookie breakdowns.
  const category=(!p.team&&(draftYear>=new Date().getFullYear()||v.video_type==="prospect_breakdown"))?"prospect":"nfl";
  seen.add(id);
  entries.push({
   video_id:id,player_key:v.player_key,title:v.title||"Film Breakdown",
   published_at:v.published_at||v.created_at||v.updated_at||null,
   player_name:p.name,player_position:p.pos,player_college:p.college,player_team:p.team,
   category,category_label:categoryLabels[category],draft_year:draftYear||null
  });
 }
 entries.sort((a,b)=>Date.parse(b.published_at||0)-Date.parse(a.published_at||0));
 return entries;
}
function frame(id,esc){
 const watch=youtubeUrl(id);
 return '<div class="bbb-film-embed-wrap"><iframe title="Bobby’s Big Board YouTube film breakdown" src="https://www.youtube-nocookie.com/embed/'+safeId(id)+'?rel=0&playsinline=1&autoplay=1&enablejsapi=1&origin='+encodeURIComponent(location.origin)+'" loading="eager" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>'+
 '<a class="bbb-film-embed-watch" href="'+watch+'" target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a></div>';
}
function screen(video,playing,esc){
 if(!video)return '<div class="bbb-film-placeholder">No matching film breakdown selected.</div>';
 if(mustWatchExternally(video.video_id))return '<div class="bbb-film-external"><img class="bbb-film-external-art" src="'+thumb(video.video_id)+'" alt="" loading="lazy"><div class="bbb-film-external-shade"></div><div class="bbb-film-external-message"><span>VIEW ON YOUTUBE</span><h3>Playback is restricted here.</h3><p>'+esc(externalReason(video.video_id))+'</p><a class="bbb-film-external-button" href="'+youtubeUrl(video.video_id)+'" target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a></div></div>';
 if(playing)return frame(video.video_id,esc);
 return '<div class="bbb-film-poster"><img class="bbb-film-poster-image" data-video-id="'+safeId(video.video_id)+'" alt="" decoding="async"><div class="bbb-film-poster-shade"></div><button class="bbb-film-bigplay" type="button" data-film-play aria-label="Play '+esc(video.title)+'">▶</button><div class="bbb-film-poster-info"><span>'+esc(video.category_label)+'</span><strong>'+esc(video.title)+'</strong></div></div>';
}
function detail(video,esc,profileLink,isProfile){
 return video?'<div class="bbb-film-info-head"><div><span class="bbb-film-eyebrow">'+esc(video.category_label)+'</span><h2>'+esc(video.title)+'</h2><p>'+esc(video.player_name)+(video.player_college?" · "+esc(video.player_college):"")+'</p></div></div>'+
  '<div class="bbb-film-meta-actions"><a href="'+profileLink(video.player_key,video)+'" class="bbb-film-profile-link">'+(isProfile?'Explore the Film Room →':'View '+esc(video.player_name)+"'s scouting profile →")+'</a>'+
  '<a href="'+youtubeUrl(video.video_id)+'" target="_blank" rel="noopener noreferrer" class="bbb-film-youtube-link">'+(mustWatchExternally(video.video_id)?'Watch on YouTube ↗':'Open on YouTube ↗')+'</a></div>':"";
}
function attach(root,list,initialId,esc,profileLink,isProfile=false){
 let chosen=list.find(v=>v.video_id===initialId)||list[0]||null,playing=false;
 let activePlayer=null,renderToken=0;
 const screenNode=root.querySelector("[data-film-screen]"),infoNode=root.querySelector("[data-film-info]");
 const repaint=()=>{
  const token=++renderToken;
  if(activePlayer){try{activePlayer.destroy()}catch{}activePlayer=null}
  if(screenNode)screenNode.innerHTML=screen(chosen,playing,esc);
  if(infoNode)infoNode.innerHTML=detail(chosen,esc,profileLink,isProfile);
  upgradePoster(screenNode?.querySelector(".bbb-film-poster-image"));
  root.querySelectorAll("[data-film-select]").forEach(el=>el.setAttribute("aria-pressed",String(!!chosen&&el.dataset.filmSelect===chosen.video_id)));
  const iframe=screenNode?.querySelector(".bbb-film-embed-wrap iframe");
  const id=chosen?.video_id;
  if(!iframe||!id)return;
  // Only load YouTube's monitoring script after someone actually starts a video.
  loadPlayerApi().then(YT=>{
   if(token!==renderToken||!iframe.isConnected||chosen?.video_id!==id||!playing)return;
   activePlayer=new YT.Player(iframe,{events:{
    onError:event=>{
     if(token!==renderToken||chosen?.video_id!==id)return;
     const code=Number(event.data);
     if(![5,100,101,150,153].includes(code))return;
     rememberExternal(id,code);
     playing=false;repaint();
     // Update the selected video's tile/queue label as well.
     root.querySelectorAll("[data-film-select]").forEach(el=>el.setAttribute("data-film-restricted",String(el.dataset.filmSelect===id)));
   }
   }});
  }).catch(()=>{ /* The unconditional YouTube link remains visible when the API is unavailable. */ });
 };
 const pick=(id,autoPlay)=>{
  const v=list.find(x=>x.video_id===id);if(!v)return;
  chosen=v;playing=autoPlay&&!mustWatchExternally(id);repaint();
 };
 root.addEventListener("click",event=>{
  const play=event.target.closest("[data-film-play]");
  if(play){if(chosen){playing=true;repaint()}return}
  const button=event.target.closest("[data-film-select]");
  if(button&&root.contains(button)){
   pick(button.dataset.filmSelect,true);
   root.querySelector("[data-film-screen]")?.scrollIntoView({behavior:"smooth",block:"center"});
  }
 });
 repaint();
 return {pick,current:()=>chosen,reset:()=>{playing=false;repaint()}};
}
function filmTile(video,esc){
 return '<button type="button" class="bbb-film-library-tile" data-film-select="'+safeId(video.video_id)+'" aria-pressed="false">'+
 '<span class="bbb-film-tile-image"><img loading="lazy" src="'+thumb(video.video_id)+'" alt=""><span class="bbb-film-tile-play" aria-hidden="true">▶</span></span>'+
 '<span class="bbb-film-tile-copy"><small>'+esc(video.category_label)+' · '+esc(video.player_position||"Player")+'</small>'+
 '<strong>'+esc(video.title)+'</strong><span>'+esc(video.player_name)+'</span>'+(mustWatchExternally(video.video_id)?'<span class="bbb-film-external-label">YouTube playback only</span>':'')+'</span></button>';
}
function render(app,videos,ctx){
 const esc=ctx.esc||fallbackEsc;
 const profileLink=ctx.profileLink||((slug)=>"/scouting/"+encodeURIComponent(slug));
 const fromUrl=new URLSearchParams(location.search).get("video");
 const totals={
  prospect:videos.filter(x=>x.category==="prospect").length,
  nfl:videos.filter(x=>x.category==="nfl").length
 };
 app.innerHTML='<section class="section bbb-film-room"><div class="wrap">'+
 '<div class="bbb-film-header"><div class="eyebrow">THE BBB FILM ROOM</div><h1>The film behind the evaluation.</h1>'+
 '<p>Draft prospect scouting and NFL film breakdowns, directly connected to each player’s BBB profile. Rookie and veteran studies live together under NFL Film.</p></div>'+
 '<div class="bbb-film-stage" data-bbb-film-root><div class="bbb-film-stage-left"><div class="bbb-film-screen" data-film-screen></div><div class="bbb-film-stage-info" data-film-info></div></div>'+
 '<aside class="bbb-film-stage-side"><div class="bbb-film-side-label">FROM THE BIG BOARD</div><h3>Scouting on film.</h3><p>Breakdowns grounded in actual routes, technique, coverage, and performance—not just box scores.</p>'+
 '<div class="bbb-film-side-stat"><strong>'+totals.prospect+'</strong><span>Draft prospect breakdown'+(totals.prospect!==1?"s":"")+'</span></div>'+
 '<div class="bbb-film-side-stat"><strong>'+totals.nfl+'</strong><span>NFL player breakdowns</span></div>'+
 '</aside></div>'+
 '<div class="bbb-film-catalog-head"><div><div class="eyebrow">VIDEO LIBRARY</div><h2>Browse the breakdowns</h2></div><span>'+videos.length+' published film studies</span></div>'+
 '<div class="bbb-film-toolbar"><div class="bbb-film-filters" role="group" aria-label="Film categories">'+
 [['nfl','NFL Film'],['prospect','Draft Prospects']].map(([id,label])=>'<button type="button" class="bbb-film-filter'+(id==="nfl"?" active":"")+'" data-film-category="'+id+'" aria-pressed="'+(id==="nfl"?"true":"false")+'">'+label+' <span>'+totals[id]+'</span></button>').join('')+
 '</div><input class="bbb-film-search" type="search" placeholder="Search player, video, or college…" aria-label="Search film breakdowns" data-film-search></div>'+
 '<div class="bbb-film-library" data-film-library></div><div class="bbb-film-no-results" data-film-empty hidden>No matching film breakdowns yet.</div>'+
 '<div class="bbb-film-footer-note">Only approved, public long-form films linked to BBB players appear here. Recent YouTube uploads are added when they are synced to the BBB film catalog.</div>'+
 '</div></section>';
 const root=app.querySelector("[data-bbb-film-root]");
 const controller=attach(root,videos,fromUrl,esc,profileLink);
 // Film tiles are located outside the playback panel, so forward selection explicitly.
 const library=app.querySelector("[data-film-library]");
 let category="nfl",search="";
 const draw=()=>{
  const filtered=videos.filter(v=>v.category===category&&(!search||[v.title,v.player_name,v.player_college,v.player_team].join(" ").toLowerCase().includes(search)));
  library.innerHTML=filtered.map(v=>filmTile(v,esc)).join("");
  app.querySelector("[data-film-empty]").hidden=filtered.length>0;
  library.querySelectorAll("[data-film-select]").forEach(b=>b.setAttribute("aria-pressed",String(controller.current()?.video_id===b.dataset.filmSelect)));
 };
 library.addEventListener("click",ev=>{
  const btn=ev.target.closest("[data-film-select]");
  if(!btn||!library.contains(btn))return;
  controller.pick(btn.dataset.filmSelect,true);
  library.querySelectorAll("[data-film-select]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.filmSelect===btn.dataset.filmSelect)));
  root.querySelector("[data-film-screen]")?.scrollIntoView({behavior:"smooth",block:"start"});
 });
 app.querySelectorAll("[data-film-category]").forEach(b=>b.addEventListener("click",()=>{
  category=b.dataset.filmCategory;
  app.querySelectorAll("[data-film-category]").forEach(x=>{const selected=x===b;x.classList.toggle("active",selected);x.setAttribute("aria-pressed",String(selected))});
  draw();
 }));
 app.querySelector("[data-film-search]").addEventListener("input",e=>{search=e.target.value.toLowerCase().trim();draw()});
 draw();
}
function playlistItem(video,index,esc){
 return '<button type="button" class="bbb-film-queue-item" data-film-select="'+safeId(video.video_id)+'" aria-pressed="false">'+
 '<span class="bbb-film-queue-art"><img src="'+thumb(video.video_id,'mqdefault')+'" loading="lazy" alt=""><span class="bbb-film-queue-play" aria-hidden="true">▶</span></span>'+
 '<span class="bbb-film-queue-copy"><small>VIDEO '+String(index+1).padStart(2,'0')+' · '+esc(video.category_label)+'</small>'+
 '<strong>'+esc(video.title)+'</strong>'+(mustWatchExternally(video.video_id)?'<span class="bbb-film-external-label">YouTube only</span>':'')+'</span></button>';
}
function profileMarkup(videos,player,esc){
 if(!videos.length)return '<div class="sp-panel"><div class="sp-panel-head"><div><div class="sp-kicker">BBB FILM ROOM</div><h2>Film & scouting notes.</h2></div></div><div class="sp-no-data">No public film breakdown linked to '+esc(player.name)+' yet.</div></div>';
 const multi=videos.length>1;
 return '<div class="sp-panel bbb-film-profile" data-bbb-profile-film><div class="sp-panel-head"><div><div class="sp-kicker">PLAYER FILM STUDIES</div><h2>Watch '+esc(player.name)+' on film.</h2><p>Watch the full breakdown here. Switch between studies without leaving this profile.</p></div><span class="bbb-film-profile-count">'+videos.length+' VIDEO'+(multi?'S':'')+'</span></div>'+
 '<div class="bbb-film-profile-layout">'+
 '<div class="bbb-film-profile-main"><div class="bbb-film-screen" data-film-screen></div><div class="bbb-film-stage-info" data-film-info></div></div>'+
 '<aside class="bbb-film-profile-rail">'+
 (multi?'<div class="bbb-film-rail-label">MORE FILM ON '+esc(player.name.toUpperCase())+'</div><div class="bbb-film-queue" role="group" aria-label="Select a '+esc(player.name)+' film breakdown">'+videos.map((v,i)=>playlistItem(v,i,esc)).join('')+'</div>':
 '<div class="bbb-film-rail-label">PLAYER FILM COLLECTION</div><h3>One breakdown. More to come.</h3><p>This film study is linked to '+esc(player.name)+"'s scouting report. Any future videos you publish for this player will be added here automatically.</p>"+
 '<a class="bbb-film-rail-link" href="/film">Explore all BBB film →</a>')+
 '</aside></div></div>';
}
function bindProfile(app,videos,esc){
 const root=app.querySelector("[data-bbb-profile-film]");
 if(root&&videos.length)attach(root,videos,null,esc,(_slug,video)=>"/film?video="+encodeURIComponent(video.video_id),true);
}
window.BBB_FILM_ROOM={catalog,render,profileMarkup,bindProfile};
})();