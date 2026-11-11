/* BBB+ Film Notebook — authorization is verified exclusively by the server.
   This file never receives restricted scouting text until a valid entitlement succeeds. */
(function(){
"use strict";
const API="https://twbduhmibbotregdxlla.supabase.co";
const KEY="sb_publishable_R3-rucNypGm1DPd4LHV-0A_wIoT0jBS";
const SESSIONS=["bbb_auth_session_v1","bbb_admin_session_v1"];
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const text=v=>String(v??"").trim();
const lines=v=>text(v).split(/\r?\n+/).map(x=>x.trim().replace(/^[-•]\s*/,"")).filter(Boolean);
const signed=()=>SESSIONS.some(k=>{try{return !!JSON.parse(localStorage.getItem(k)||"null")?.access_token}catch{return false}});
async function getToken(){
 for(const key of SESSIONS){
  let s;try{s=JSON.parse(localStorage.getItem(key)||"null")}catch{}
  if(!s?.access_token)continue;
  if(!s.expires_at||Date.now()<(Number(s.expires_at)-60)*1000)return s.access_token;
  if(!s.refresh_token)continue;
  try{
   const r=await fetch(API+"/auth/v1/token?grant_type=refresh_token",{
    method:"POST",headers:{apikey:KEY,"Content-Type":"application/json"},
    body:JSON.stringify({refresh_token:s.refresh_token}),cache:"no-store"
   });
   if(!r.ok)continue;
   const next=await r.json();if(!next.access_token)continue;
   localStorage.setItem(key,JSON.stringify({...s,...next,expires_at:Math.floor(Date.now()/1000)+Number(next.expires_in||3600)}));
   return next.access_token;
  }catch{}
 }
 return null;
}
function pill(t){return '<span class="bfn-pill">'+esc(t)+'</span>';}
function teaser(g,p){
 if(Number(g?.year||p?.draft_year)<2027)return "";
 const available=!!g?.notebook_available;
 return '<section class="bfn-teaser" aria-label="BBB+ Film Notebook">'+
  '<div class="bfn-kicker"><span class="bfn-dot"></span> BBB+ FILM NOTEBOOK</div>'+
  '<div class="bfn-teaser-grid"><div><h2>'+(available?"The evaluation behind the grade.":"The next scouting layer.")+'</h2>'+
  '<p>'+(available?"Read the full film strengths, development concerns, NFL projection, and why Bobby chose this pro comparison.":"Detailed film notes are being prepared as this class is graded. Bobby’s public grade and overview remain free.")+'</p></div>'+
  '<button class="bfn-go" type="button" data-profile-tab="notebook">'+(available?"Open Film Notebook →":"Explore Film Notebook →")+'</button></div></section>';
}
function navTab(p,g){
 if(Number(g?.year||p?.draft_year)<2027)return "";
 return '<button type="button" class="sp-tab bfn-tab" data-tab="notebook" role="tab" aria-selected="false">'+
  '<span class="bfn-tab-symbol" aria-hidden="true">✦</span> BBB+ Notebook</button>';
}
function initial(p,g){
 const available=!!g?.notebook_available;
 return '<section class="bfn-shell"><div class="bfn-top">'+
  '<span class="bfn-kicker"><span class="bfn-dot"></span> BOBBY’S BIG BOARD · BBB+ ORIGINAL</span>'+
  '<h2>THE FILM <em>NOTEBOOK.</em></h2>'+
  '<p>The deeper scouting evaluation behind Bobby’s prospect grade. Detailed observations are delivered to authorized BBB+ members only.</p>'+
  '<div class="bfn-ident">'+pill(p?.name||"NFL Prospect")+pill(String(g?.year||p?.draft_year||"Draft"))+
  pill(p?.pos||"")+((g?.grade!=null)?pill(Number(g.grade).toFixed(1)+" BBB Grade"):"")+'</div></div>'+
  '<div class="bfn-content" data-bfn-content>'+(available?
    '<div class="bfn-state"><div class="bfn-state-mark">✦</div><h3>Unlock the full scouting notebook.</h3>'+
    '<p>Includes strengths, development concerns, NFL projection, developmental plan and the reasoning behind the player comparison.</p>'+
    '<button type="button" class="bfn-primary" data-bfn-load>CHECK MY BBB+ ACCESS →</button></div>':
    '<div class="bfn-state"><div class="bfn-state-mark">◎</div><h3>Film review in progress.</h3>'+
    '<p>Bobby’s full notebook for this prospect has not been published yet. The public grade and scouting overview remain available above.</p>'+
    '<a href="/draft" class="bfn-secondary">Back to the Draft Board →</a></div>')+'</div></section>';
}
function state(kind,detail=""){
 if(kind==="loading")return '<div class="bfn-state" role="status"><div class="bfn-spinner"></div><h3>Checking your membership…</h3><p>Your access is verified securely before any film notes are sent.</p></div>';
 if(kind==="signin")return '<div class="bfn-state"><div class="bfn-state-mark">✦</div><h3>Sign in to open the notebook.</h3><p>Your grade and scouting overview are free. The complete film review is included with BBB+.</p>'+
  '<div class="bfn-actions"><a href="/account" target="_blank" rel="noopener" class="bfn-primary">SIGN IN TO MY BBB ↗</a>'+
  '<button type="button" class="bfn-secondary" data-bfn-load>I’VE SIGNED IN · RETRY</button></div></div>';
 if(kind==="upgrade")return '<div class="bfn-state"><div class="bfn-state-mark">✦</div><h3>Go beyond the scouting grade.</h3>'+
  '<p>Film strengths and concerns, scheme projection, the development plan, and detailed pro-comp reasoning are exclusive to BBB+.</p>'+
  '<div class="bfn-actions"><a href="/plus" class="bfn-primary">EXPLORE BBB+ MEMBERSHIP →</a>'+
  '<button type="button" class="bfn-secondary" data-bfn-load>REFRESH ACCESS</button></div></div>';
 if(kind==="error")return '<div class="bfn-state" role="alert"><h3>Could not open the notebook.</h3><p>'+esc(detail||"Please try again.")+'</p>'+
  '<button type="button" class="bfn-secondary" data-bfn-load>RETRY ACCESS CHECK</button></div>';
 return '<div class="bfn-state"><h3>No published film notebook yet.</h3><p>The detailed evaluation will appear here when Bobby publishes it.</p></div>';
}
function bulletCard(title,value,kind){
 const rows=lines(value);
 if(!rows.length)return "";
 return '<article class="bfn-bullet-card bfn-'+kind+'"><div class="bfn-card-top">'+
  '<span aria-hidden="true">'+(kind==="pros"?"✓":"!")+'</span><h3>'+esc(title)+'</h3></div>'+
  '<ul>'+rows.map(row=>'<li>'+esc(row)+'</li>').join("")+'</ul></article>';
}
function proseCard(tag,title,value){
 if(!text(value))return "";
 return '<article class="bfn-copy-card"><div class="bfn-copy-tag">'+esc(tag)+'</div><h3>'+esc(title)+'</h3>'+
  '<p>'+esc(text(value))+'</p></article>';
}
function unlocked(data){
 const report=data.notebook||{};
 return '<div class="bfn-unlocked">'+
  '<div class="bfn-confirm"><span>✓</span><div><strong>FULL NOTEBOOK UNLOCKED</strong>'+
  '<small>BBB+ member access verified · Bobby’s original scouting evaluation</small></div></div>'+
  '<div class="bfn-notebook-head"><div><div class="bfn-kicker">HOW HE WINS / AREAS TO IMPROVE</div>'+
  '<h3>What separates him. What holds him back.</h3></div>'+
  '<span class="bfn-research">FILM EVALUATION</span></div>'+
  '<div class="bfn-two">'+bulletCard("How he wins",report.strengths,"pros")+
  bulletCard("Areas to improve",report.concerns,"cons")+'</div>'+
  '<div class="bfn-notebook-head"><div><div class="bfn-kicker">PROJECTION / DEVELOPMENT / COMPARISON</div>'+
  '<h3>From college tape to the NFL.</h3></div></div>'+
  '<div class="bfn-analysis-grid">'+
   proseCard("01 / NFL OUTLOOK","NFL Projection",report.projection)+
   proseCard("02 / DEVELOPMENT PATH","Development Plan",report.development_plan)+
   proseCard("03 / PRO COMP EXPLAINED","Why this comparison?",report.comp_explanation)+'</div>'+
  '<div class="bfn-footnote">Original scouting opinions are projections, not guarantees. Evaluations may evolve as additional film is reviewed.</div></div>';
}
function bind(root,playerKey,g){
 if(!root||!playerKey||Number(g?.year)<2027)return;
 const tab=root.querySelector('[data-tab="notebook"]');
 const mount=root.querySelector('[data-bfn-content]');
 if(!tab||!mount||!g?.notebook_available)return;
 let busy=false,finished=false;
 const load=async(force=false)=>{
  if(busy||finished&&!force)return;
  busy=true;mount.innerHTML=state("loading");
  try{
   const token=await getToken();
   if(!token){mount.innerHTML=state("signin");return;}
   const endpoint=API+"/functions/v1/bbb-plus-film-notebook?player_key="+encodeURIComponent(playerKey);
   const res=await fetch(endpoint,{headers:{apikey:KEY,Authorization:"Bearer "+token,Accept:"application/json"},cache:"no-store"});
   const data=await res.json().catch(()=>({}));
   if(res.status===401){mount.innerHTML=state("signin");return}
   if(res.status===403){mount.innerHTML=state("upgrade");return}
   if(res.status===404){mount.innerHTML=state("empty");return}
   if(!res.ok||data?.access?.has_access!==true||!data.notebook)throw new Error("The membership check could not be completed.");
   mount.innerHTML=unlocked(data);finished=true;
  }catch(err){mount.innerHTML=state("error",err?.message)}
  finally{busy=false}
 };
 root.addEventListener("click",e=>{
  if(e.target.closest('[data-bfn-load]')){e.preventDefault();void load(true);}
 });
 tab.addEventListener("click",()=>{void load()});
 if(location.hash==="#notebook")void load();
}
window.BBB_PLUS_FILM_NOTEBOOK={teaser,navTab,initial,bind};
})();
