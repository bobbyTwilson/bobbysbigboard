/* Bobby's Big Board Film Room: public, player-matched YouTube embeds.
 * Approved catalog records + clearly titled newly synchronized public film uploads.
 * No private/unlisted playback; third-party player loads on explicit click only.
 */
(function(){
"use strict";
const valid=id=>/^[A-Za-z0-9_-]{11}$/.test(String(id||""));
const fallbackEsc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const thumb=id=>"https://i.ytimg.com/vi/"+encodeURIComponent(id)+"/hqdefault.jpg";
const safeId=id=>valid(id)?encodeURIComponent(id):"";
const categoryLabels={prospect:"Draft Prospect",rookie:"Rookie Film",nfl:"NFL Film Study"};
function catalog(approved,channel,profiles,prospects){
 const publicVideos=new Map((channel||[]).filter(v=>valid(v.video_id)&&v.video_type==="long"&&v.privacy_status==="public").map(v=>[v.video_id,v]));
 const playerMap=new Map((profiles||[]).map(p=>[p.player_key,p]));
 const prospectMap=new Map((prospects||[]).map(p=>[p.player_key,p]));
 const seen=new Set(),entries=[];
 function add(v,registry){
  if(!v||!v.player_key||seen.has(v.video_id)||!publicVideos.has(v.video_id))return;
  const p=playerMap.get(v.player_key);if(!p)return;
  const prospect=prospectMap.get(v.player_key),draftYear=Number(prospect?.year||p.draft_year||0);
  const category=registry?.video_type==="prospect_breakdown"||draftYear>=2027?"prospect":
   registry?.video_type==="rookie_film"||draftYear>=2025&&draftYear<=2026?"rookie":"nfl";
  seen.add(v.video_id);
  entries.push({...v,title:v.title||registry?.title||"Film Breakdown",player_name:p.name,player_position:p.pos,
   player_college:p.college,player_team:p.team,category,category_label:categoryLabels[category],
   draft_year:draftYear||null});
 }
 for(const record of approved||[]){
  if(record.editorial_status!=="approved"||!valid(record.youtube_video_id))continue;
  const video=publicVideos.get(record.youtube_video_id);
  if(video)add({...video,player_key:record.player_key},record);
 }
 for(const video of publicVideos.values()){
  if(!video.player_key||seen.has(video.video_id))continue;
  if(!/film breakdown|film study|scouting report|scouting breakdown|player evaluation/i.test(video.title||""))continue;
  add(video,null);
 }
 entries.sort((a,b)=>Date.parse(b.published_at||0)-Date.parse(a.published_at||0));
 return entries;
}
function frame(id,esc){
 return '<iframe title="Bobby’s Big Board YouTube film breakdown" src="https://www.youtube-nocookie.com/embed/'+safeId(id)+'?rel=0&playsinline=1&autoplay=1" loading="lazy" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
}
function screen(video,playing,esc){
 if(!video)return '<div class="bbb-film-placeholder">No matching film breakdown selected.</div>';
 if(playing)return frame(video.video_id,esc);
 return '<div class="bbb-film-poster" style="background-image:linear-gradient(0deg,rgba(0,0,0,.70),rgba(0,0,0,.09)),url(&quot;'+thumb(video.video_id)+'&quot;)"><button class="bbb-film-bigplay" type="button" data-film-play aria-label="Play '+esc(video.title)+'">▶</button><div class="bbb-film-poster-info"><span>'+esc(video.category_label)+'</span><strong>'+esc(video.title)+'</strong></div></div>';
}
function detail(video,esc,profileLink){
 return video?'<div class="bbb-film-info-head"><div><span class="bbb-film-eyebrow">'+esc(video.category_label)+'</span><h2>'+esc(video.title)+'</h2><p>'+esc(video.player_name)+(video.player_college?" · "+esc(video.player_college):"")+'</p></div></div>'+
  '<div class="bbb-film-meta-actions"><a href="'+profileLink(video.player_key)+'" class="bbb-film-profile-link">View '+esc(video.player_name)+"'s scouting profile →</a>"+
  '<a href="https://www.youtube.com/watch?v='+safeId(video.video_id)+'" target="_blank" rel="noopener noreferrer" class="bbb-film-youtube-link">Open on YouTube ↗</a></div>':"";
}
function attach(root,list,initialId,esc,profileLink){
 let chosen=list.find(v=>v.video_id===initialId)||list[0]||null,playing=false;
 const screenNode=root.querySelector("[data-film-screen]"),infoNode=root.querySelector("[data-film-info]");
 const repaint=()=>{
  if(screenNode)screenNode.innerHTML=screen(chosen,playing,esc);
  if(infoNode)infoNode.innerHTML=detail(chosen,esc,profileLink);
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
 '<strong>'+esc(video.title)+'</strong><span>'+esc(video.player_name)+'</span></span></button>';
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
function profileMarkup(videos,player,esc){
 if(!videos.length)return '<div class="sp-panel"><div class="sp-panel-head"><div><div class="sp-kicker">BBB FILM ROOM</div><h2>Film & scouting notes.</h2></div></div><div class="sp-no-data">No public film breakdown linked to '+esc(player.name)+' yet.</div></div>';
 return '<div class="sp-panel bbb-film-profile" data-bbb-profile-film><div class="sp-panel-head"><div><div class="sp-kicker">PLAYER FILM STUDIES</div><h2>Watch '+esc(player.name)+' on film.</h2><p>Play BBB breakdowns here without leaving the scouting profile.</p></div></div>'+
 '<div class="bbb-film-screen" data-film-screen></div><div class="bbb-film-stage-info" data-film-info></div>'+
 (videos.length>1?'<div class="bbb-film-profile-list">'+videos.map(v=>filmTile(v,esc)).join("")+'</div>':'')+
 '</div>';
}
function bindProfile(app,videos,esc){
 const root=app.querySelector("[data-bbb-profile-film]");
 if(root&&videos.length)attach(root,videos,null,esc,slug=>"/scouting/"+encodeURIComponent(slug));
}
window.BBB_FILM_ROOM={catalog,render,profileMarkup,bindProfile};
})();