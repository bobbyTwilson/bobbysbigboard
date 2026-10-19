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
const mustWatchExternally=id=>externalOnlyIds.has(String(id||""));
const youtubeUrl=id=>"https://www.youtube.com/watch?v="+safeId(id);
const categoryLabels={prospect:"Draft Prospect",rookie:"Rookie Film",nfl:"NFL Film Study"};
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
  const category=v.video_type==="prospect_breakdown"||draftYear>=2027?"prospect":
   v.video_type==="rookie_film"||draftYear>=2025&&draftYear<=2026?"rookie":"nfl";
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
 return '<iframe title="Bobby’s Big Board YouTube film breakdown" src="https://www.youtube-nocookie.com/embed/'+safeId(id)+'?rel=0&playsinline=1&autoplay=1" loading="lazy" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
}
function screen(video,playing,esc){
 if(!video)return '<div class="bbb-film-placeholder">No matching film breakdown selected.</div>';
 if(mustWatchExternally(video.video_id))return '<div class="bbb-film-external"><img class="bbb-film-external-art" src="'+thumb(video.video_id)+'" alt="" loading="lazy"><div class="bbb-film-external-shade"></div><div class="bbb-film-external-message"><span>VIEW ON YOUTUBE</span><h3>Playback is restricted on other websites.</h3><p>The NFL has blocked this video from playing in embedded players. The film breakdown is still linked to this profile.</p><a class="bbb-film-external-button" href="'+youtubeUrl(video.video_id)+'" target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a></div></div>';
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
 const screenNode=root.querySelector("[data-film-screen]"),infoNode=root.querySelector("[data-film-info]");
 const repaint=()=>{
  if(screenNode)screenNode.innerHTML=screen(chosen,playing,esc);
  if(infoNode)infoNode.innerHTML=detail(chosen,esc,profileLink,isProfile);
  upgradePoster(screenNode?.querySelector(".bbb-film-poster-image"));
  root.querySelectorAll("[data-film-select]").forEach(el=>el.setAttribute("aria-pressed",String(!!chosen&&el.dataset.filmSelect===chosen.video_id)));
 };
 const pick=(id,autoPlay)=>{
  const v=list.find(x=>x.video_id===id);if(!v)return;
  chosen=v;playing=autoPlay;repaint();
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
  all:videos.length,
  prospect:videos.filter(x=>x.category==="prospect").length,
  rookie:videos.filter(x=>x.category==="rookie").length,
  nfl:videos.filter(x=>x.category==="nfl").length
 };
 app.innerHTML='<section class="section bbb-film-room"><div class="wrap">'+
 '<div class="bbb-film-header"><div class="eyebrow">THE BBB FILM ROOM</div><h1>The film behind the evaluation.</h1>'+
 '<p>Watch our draft prospect scouting reports, rookie evaluations and NFL film breakdowns right here. Every video connects directly to a player profile.</p></div>'+
 '<div class="bbb-film-stage" data-bbb-film-root><div class="bbb-film-stage-left"><div class="bbb-film-screen" data-film-screen></div><div class="bbb-film-stage-info" data-film-info></div></div>'+
 '<aside class="bbb-film-stage-side"><div class="bbb-film-side-label">FROM THE BIG BOARD</div><h3>Scouting on film.</h3><p>Breakdowns grounded in actual routes, technique, coverage, and performance—not just box scores.</p>'+
 '<div class="bbb-film-side-stat"><strong>'+totals.prospect+'</strong><span>Draft prospect breakdown'+(totals.prospect!==1?"s":"")+'</span></div>'+
 '<div class="bbb-film-side-stat"><strong>'+totals.rookie+'</strong><span>Rookie film studies</span></div>'+
 '<div class="bbb-film-side-stat"><strong>'+totals.nfl+'</strong><span>NFL player breakdowns</span></div>'+
 '</aside></div>'+
 '<div class="bbb-film-catalog-head"><div><div class="eyebrow">VIDEO LIBRARY</div><h2>Browse the breakdowns</h2></div><span>'+videos.length+' published film studies</span></div>'+
 '<div class="bbb-film-toolbar"><div class="bbb-film-filters" role="group" aria-label="Film categories">'+
 [['all','All Film'],['prospect','Draft Prospects'],['rookie','Rookie Film'],['nfl','NFL Film']].map(([id,label])=>'<button type="button" class="bbb-film-filter'+(id==="all"?" active":"")+'" data-film-category="'+id+'" aria-pressed="'+(id==="all"?"true":"false")+'">'+label+' <span>'+totals[id]+'</span></button>').join('')+
 '</div><input class="bbb-film-search" type="search" placeholder="Search player, video, or college…" aria-label="Search film breakdowns" data-film-search></div>'+
 '<div class="bbb-film-library" data-film-library></div><div class="bbb-film-no-results" data-film-empty hidden>No matching film breakdowns yet.</div>'+
 '<div class="bbb-film-footer-note">Only public, long-form films linked to BBB players appear here. New scouting uploads can be added from the same video registry.</div>'+
 '</div></section>';
 const root=app.querySelector("[data-bbb-film-root]");
 const controller=attach(root,videos,fromUrl,esc,profileLink);
 // Film tiles are located outside the playback panel, so forward selection explicitly.
 const library=app.querySelector("[data-film-library]");
 let category="all",search="";
 const draw=()=>{
  const filtered=videos.filter(v=>(category==="all"||v.category===category)&&(!search||[v.title,v.player_name,v.player_college,v.player_team].join(" ").toLowerCase().includes(search)));
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