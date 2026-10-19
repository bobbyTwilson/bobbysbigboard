/* Regression gates for unified preview only; does not alter production files. */
import {readFile,stat} from "node:fs/promises";
import {Script} from "node:vm";
const root=".vercel/output/static/";
const required=["index.html","dynasty-engine/index.html","scouting-preview.js","scouting-green.css","scouting-directory.css","scouting-profile-v5.js","scouting-film-room-v1.js","scouting-intelligence-v6.js","bbb-core.js","scouting-headshots.json","robots.txt"];
for(const path of required){const s=await stat(root+path);if(!s.isFile()||s.size===0)throw Error("Preview missing asset: "+path)}
for(const path of required.filter(x=>x.endsWith(".js"))){new Script(await readFile(root+path,"utf8"),{filename:path})}
const html=await readFile(root+"index.html","utf8"),js=await readFile(root+"scouting-preview.js","utf8"),config=JSON.parse(await readFile(".vercel/output/config.json","utf8"));
for(const marker of ['id="bbbSiteSearch"','id="bbbSiteResults"','href="/players"','href="/film"','href="/draft"','href="/dynasty/rankings"','name="robots" content="noindex,nofollow"'])if(!html.includes(marker))throw Error("Preview markup missing "+marker);
for(const marker of ["setupGlobalSearch()","site_bbb_film_catalog","publishedFilms=window.BBB_FILM_ROOM.catalog","films","player_key"])if(!js.includes(marker))throw Error("Preview data pipeline missing "+marker);
if(js.includes('"bbb_youtube_videos"'))throw Error("Preview must not access private video registry");
const routes=["/players/?","/film/?","/draft/?","/scouting/([^/]+)/?","/dynasty/(rankings|trade|compare|rookies|movers|updates)/?"];
for(const route of routes)if(!config.routes.some(r=>r.src===route))throw Error("Preview routing missing "+route);
if(!(await readFile(root+"robots.txt","utf8")).includes("Disallow: /"))throw Error("Preview must remain noindexed");
console.log("BBB scouting preview regression gates PASS: search, routes, film catalog, assets and JS syntax.");
