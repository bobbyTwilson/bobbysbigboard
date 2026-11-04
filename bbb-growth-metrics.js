/* BBB anonymous, transport-independent engagement signals.
 * This file NEVER sends requests, writes cookies, or collects searches,
 * account identifiers, payment values, email addresses, or IPs.
 * A future analytics provider may subscribe after the owner approves its costs.
 */
(function(){
 "use strict";
 if(window.BBB_SITE_METRICS)return;
 const recognized=new Set(["page_view","film_selected","film_open","profile_open","bbb_plus_interest","discord_click","youtube_click","player_search_open","rankings_open"]);
 function section(){
  const path=location.pathname;
  if(path.startsWith("/scouting/"))return "player_profile";
  if(path.startsWith("/dynasty/"))return "dynasty";
  return ({"/":"home","/film":"film_room","/players":"players","/draft":"draft","/plus":"bbb_plus","/account":"account"})[path]||"other";
 }
 function track(action,attributes){
  if(!recognized.has(action))return;
  const meta=attributes&&typeof attributes==="object"?attributes:{};
  const detail={action,section:section()};
  if(meta.player&&/^[a-z0-9-]{1,80}$/.test(meta.player))detail.player=meta.player;
  if(meta.video&&/^[A-Za-z0-9_-]{11}$/.test(meta.video))detail.video=meta.video;
  window.dispatchEvent(new CustomEvent("bbb:site-metric",{detail}));
 }
 const route=()=>track("page_view");
 window.BBB_SITE_METRICS=Object.freeze({track,route,subscribe(handler){
  if(typeof handler!=="function")return ()=>{};
  const forward=event=>handler(event.detail);
  window.addEventListener("bbb:site-metric",forward);
  return ()=>window.removeEventListener("bbb:site-metric",forward);
 }});
 document.addEventListener("click",event=>{
  const target=event.target;
  if(!(target instanceof Element))return;
  const picker=target.closest("[data-film-select]");
  if(picker){track("film_selected",{video:picker.dataset.filmSelect});return;}
  if(target.closest(".bbb-header-search-trigger")){track("player_search_open");return;}
  const a=target.closest("a[href]");
  if(!a)return;
  let url;try{url=new URL(a.href,location.href)}catch{return;}
  if(url.hostname==="discord.gg"){track("discord_click");return;}
  if(url.hostname==="www.youtube.com"||url.hostname==="youtube.com"){track("youtube_click");return;}
  if(url.origin!==location.origin)return;
  if(url.pathname==="/film"){track("film_open",{video:url.searchParams.get("video")});return;}
  if(url.pathname.startsWith("/scouting/")){track("profile_open",{player:decodeURIComponent(url.pathname.split("/")[2]||"")});return;}
  if(url.pathname==="/plus"){track("bbb_plus_interest");return;}
  if(url.pathname.startsWith("/dynasty/rankings"))track("rankings_open");
 },true);
})();
