// BBB Account V1 preview — free account foundation + My BBB shell.

const BBB_ACCOUNT_STORAGE='bbb_auth_session_v1';
const BBB_PREVIEW_AUTH_BRANCH='bobbys-big-board-v2-git-preview-scou-92f477-bobbywilsonbtw-2065.vercel.app';
function bbbAccountReturnOrigin(){
  // Deploy-specific preview URLs change on every commit. The branch alias is
  // stable and can be allowlisted in Supabase without accepting every Vercel site.
  const host=location.hostname.toLowerCase();
  if(host.startsWith('bobbys-big-board-v2-')&&host.endsWith('.vercel.app'))
    return 'https://'+BBB_PREVIEW_AUTH_BRANCH;
  return location.origin;
}

let bbbAccountSession=null;
let bbbAccountProfile=null;

function bbbAccountEsc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function bbbAccountHeaders(token=''){return {'apikey':BBB_SUPABASE_KEY,'Content-Type':'application/json',...(token?{'Authorization':'Bearer '+token}:{})};}
function bbbAccountSaveSession(s){bbbAccountSession=s||null;try{s?localStorage.setItem(BBB_ACCOUNT_STORAGE,JSON.stringify(s)):localStorage.removeItem(BBB_ACCOUNT_STORAGE);}catch{} }
function bbbAccountReadSession(){try{return JSON.parse(localStorage.getItem(BBB_ACCOUNT_STORAGE)||'null')}catch{return null}}

async function bbbAccountRefreshSession(){
  const s=bbbAccountReadSession();
  if(!s?.refresh_token)return null;
  if(s.expires_at&&Date.now()<((Number(s.expires_at)-60)*1000)){bbbAccountSession=s;return s;}
  try{
    const r=await fetch(`${BBB_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:bbbAccountHeaders(),body:JSON.stringify({refresh_token:s.refresh_token})});
    if(!r.ok)throw new Error('Session expired');
    const next=await r.json();bbbAccountSaveSession(next);return next;
  }catch{bbbAccountSaveSession(null);return null}
}

async function bbbAccountLoadProfile(){
  if(!bbbAccountSession?.access_token||!bbbAccountSession?.user?.id){bbbAccountProfile=null;return null;}
  try{
    const r=await fetch(`${BBB_SUPABASE_URL}/rest/v1/user_profiles?id=eq.${encodeURIComponent(bbbAccountSession.user.id)}&select=*`,{headers:bbbAccountHeaders(bbbAccountSession.access_token)});
    if(!r.ok)throw new Error('Profile unavailable');
    const rows=await r.json();bbbAccountProfile=rows[0]||null;return bbbAccountProfile;
  }catch{bbbAccountProfile=null;return null}
}

async function bbbAccountSignup(email,password,username){
  // Use the stable branch alias for preview email links. Live BBB accounts
  // continue returning to the official domain. Both must be allowlisted.
  const callbackUrl=bbbAccountReturnOrigin()+'/account';
  const r=await fetch(`${BBB_SUPABASE_URL}/auth/v1/signup?redirect_to=${encodeURIComponent(callbackUrl)}`,{method:'POST',headers:bbbAccountHeaders(),body:JSON.stringify({email,password,data:{username,display_name:username}})});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.msg||data.message||data.error_description||'Could not create account.');
  if(data.access_token){bbbAccountSaveSession(data);await bbbAccountLoadProfile();}
  return data;
}

async function bbbAccountLogin(email,password){
  const r=await fetch(`${BBB_SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:'POST',headers:bbbAccountHeaders(),body:JSON.stringify({email,password})});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.msg||data.message||data.error_description||'Could not sign in.');
  bbbAccountSaveSession(data);await bbbAccountLoadProfile();return data;
}

async function bbbAccountLogout(){
  const token=bbbAccountSession?.access_token;
  if(token)fetch(`${BBB_SUPABASE_URL}/auth/v1/logout`,{method:'POST',headers:bbbAccountHeaders(token)}).catch(()=>{});
  bbbAccountSaveSession(null);bbbAccountProfile=null;bbbAccountRender();bbbAccountPolishNav();
}

function bbbAccountInjectStyles(){
  if(document.querySelector('#bbb-account-v1-styles'))return;
  const s=document.createElement('style');s.id='bbb-account-v1-styles';s.textContent=`
    .bbb-account-join{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 15px;border:1px solid #2f674f;border-radius:999px;color:#dff7e9;background:#0a1711;font-size:10px;font-weight:950;letter-spacing:.03em;white-space:nowrap;transition:.15s ease}
    .bbb-account-join:hover{border-color:#58d99a;background:#10251a;color:#fff}.bbb-account-join.signed-in{gap:7px;padding-right:13px}.bbb-account-dot{width:7px;height:7px;border-radius:999px;background:#55df9a;box-shadow:0 0 0 3px rgba(85,223,154,.12)}
    .bbb-account-view{min-height:72vh;background:#050807}.bbb-account-hero{padding:72px 0 56px;border-bottom:1px solid #173328;background:radial-gradient(circle at 78% 18%,rgba(26,132,83,.24),transparent 34%),linear-gradient(180deg,#07100c,#050807)}
    .bbb-account-hero-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(360px,.75fr);gap:54px;align-items:center}.bbb-account-kicker{color:#53e49a;font-size:10px;font-weight:950;letter-spacing:.15em;text-transform:uppercase}.bbb-account-title{font-size:clamp(50px,6.5vw,82px);line-height:.94;letter-spacing:-.055em;text-transform:uppercase;margin:14px 0 20px}.bbb-account-title span{color:#53e49a}.bbb-account-copy{max-width:720px;color:#9eb0a7;font-size:17px;line-height:1.7}.bbb-account-pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}.bbb-account-pills span{padding:6px 9px;border:1px solid #244337;border-radius:999px;background:#0a1511;color:#9db0a6;font-size:9px;font-weight:900}
    .bbb-auth-card{border:1px solid #24513d;background:linear-gradient(180deg,#0d1914,#08100c);border-radius:18px;padding:24px;box-shadow:0 26px 80px rgba(0,0,0,.34)}.bbb-auth-tabs{display:flex;gap:7px;margin-bottom:18px}.bbb-auth-tab{flex:1;border:1px solid #234435;background:#08110d;color:#8fa198;border-radius:9px;padding:9px;font-size:10px;font-weight:950;cursor:pointer}.bbb-auth-tab.active{background:#118f55;border-color:#118f55;color:#fff}.bbb-auth-field{display:grid;gap:6px;margin-top:12px}.bbb-auth-field label{font-size:8px;color:#71857a;font-weight:950;letter-spacing:.11em;text-transform:uppercase}.bbb-auth-field input{width:100%;border:1px solid #29493b;background:#050a08;color:#eef5f0;border-radius:9px;padding:11px 12px;outline:none}.bbb-auth-field input:focus{border-color:#53e49a}.bbb-auth-submit{width:100%;margin-top:16px;border:0;border-radius:10px;padding:12px 15px;background:#169b5b;color:#fff;font-size:11px;font-weight:950;cursor:pointer}.bbb-auth-submit:disabled{opacity:.55;cursor:wait}.bbb-auth-note{margin-top:12px;color:#708279;font-size:9px;line-height:1.5}.bbb-auth-status{margin-top:12px;padding:10px 11px;border-radius:9px;background:#0a1711;border:1px solid #244337;color:#a8b8af;font-size:10px;line-height:1.5}.bbb-auth-status.error{border-color:#663131;background:#201010;color:#f2a4a4}.bbb-auth-status.success{border-color:#216346;background:#092417;color:#83e7b0}
    .bbb-account-main{padding:54px 0 78px}.bbb-account-topline{display:flex;justify-content:space-between;gap:24px;align-items:end;margin-bottom:24px}.bbb-account-topline h2{font-size:clamp(30px,4vw,46px);line-height:1;margin:7px 0 0;letter-spacing:-.04em}.bbb-account-grid{display:grid;grid-template-columns:1.1fr .9fr .9fr;gap:14px}.bbb-account-card{border:1px solid #1f3d31;background:linear-gradient(160deg,#0b1511,#070c09);border-radius:15px;padding:21px;min-height:180px}.bbb-account-card.featured{border-color:#2b654b;background:linear-gradient(145deg,#0d1b14,#0a2017)}.bbb-account-card .label{color:#53e49a;font-size:8px;font-weight:950;letter-spacing:.13em;text-transform:uppercase}.bbb-account-card h3{margin:10px 0 7px;font-size:18px}.bbb-account-card p{margin:0;color:#7e9187;font-size:11px;line-height:1.65}.bbb-account-card .action{display:inline-flex;margin-top:18px;padding:9px 11px;border:1px solid #2d5542;border-radius:9px;color:#cde7d7;background:#0b1712;font-size:9px;font-weight:950}.bbb-account-card .action.primary{background:#118f55;border-color:#118f55;color:#fff}.bbb-account-card .action.disabled{opacity:.55;pointer-events:none}.bbb-account-lock{display:inline-flex;align-items:center;gap:6px;margin-top:15px;color:#6f8177;font-size:9px;font-weight:850}.bbb-account-profilebar{display:flex;align-items:center;justify-content:space-between;gap:16px;border:1px solid #234638;background:#09130f;border-radius:14px;padding:16px 18px;margin-bottom:18px}.bbb-account-profile-id{display:flex;align-items:center;gap:12px}.bbb-account-avatar{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:#173528;border:1px solid #326a50;color:#78e4aa;font-size:16px;font-weight:950}.bbb-account-profile-id strong{display:block;font-size:13px}.bbb-account-profile-id span{display:block;color:#71847a;font-size:9px;margin-top:2px}.bbb-account-signout{border:1px solid #34473e;background:transparent;color:#94a49c;border-radius:8px;padding:8px 10px;font-size:9px;font-weight:900;cursor:pointer}
    .bbb-account-mobile-link{display:none}.nav{gap:16px}.nav-links{gap:17px!important}.nav-cta{flex:none}.bbb-nav-explore-menu .bbb-youtube-explore{border-top:1px solid #173027;margin-top:5px;padding-top:13px}
    @media(max-width:1240px){.bbb-account-join{padding:0 11px}.nav-links{gap:13px!important}.bbb-nav-explore-btn,.nav-links>a{font-size:11px!important}}
    @media(max-width:950px){.bbb-account-hero-grid{grid-template-columns:1fr}.bbb-auth-card{max-width:560px}.bbb-account-grid{grid-template-columns:1fr 1fr}.bbb-account-card.featured{grid-column:1/-1}.bbb-account-join{display:none}.bbb-account-mobile-link{display:inline-flex!important;flex:none;align-items:center;padding:7px 10px;border:1px solid #2d5743;background:#0b1712;border-radius:999px;color:#b8d8c7;font-size:10px;font-weight:950}}
    @media(max-width:640px){.bbb-account-hero{padding:44px 0 36px}.bbb-account-title{font-size:48px}.bbb-account-copy{font-size:14px}.bbb-account-main{padding:38px 0 58px}.bbb-account-grid{grid-template-columns:1fr}.bbb-account-card.featured{grid-column:auto}.bbb-account-profilebar,.bbb-account-topline{align-items:flex-start;flex-direction:column}.bbb-account-profilebar{gap:13px}.bbb-account-signout{width:100%}}
  `;document.head.appendChild(s);
}

function bbbAccountEnsureView(){
  let view=document.querySelector('#accountView');if(view)return view;
  view=document.createElement('main');view.id='accountView';view.className='bbb-account-view hide';
  const anchor=document.querySelector('#profileView')||document.querySelector('footer');
  if(anchor?.parentNode)anchor.parentNode.insertBefore(view,anchor);else document.body.appendChild(view);
  return view;
}

function bbbAccountSignedOutHtml(){return `
  <section class="bbb-account-hero"><div class="shell bbb-account-hero-grid"><div><div class="bbb-account-kicker">FREE BBB ACCOUNT</div><h1 class="bbb-account-title">YOUR DYNASTY.<br><span>YOUR BBB.</span></h1><p class="bbb-account-copy">Create a free Bobby's Big Board account now. This becomes the home for your teams, your saved players, league analysis, contender status, and eventually personalized trade ideas.</p><div class="bbb-account-pills"><span>FREE ACCOUNT</span><span>MY PLAYERS</span><span>SLEEPER CONNECTION NEXT</span><span>TEAM ANALYSIS COMING</span></div></div><div class="bbb-auth-card"><div class="bbb-auth-tabs"><button class="bbb-auth-tab active" data-auth-mode="signup">Create account</button><button class="bbb-auth-tab" data-auth-mode="login">Sign in</button></div><form id="bbbAccountForm"><div class="bbb-auth-field signup-only"><label>BBB Username</label><input name="username" maxlength="24" autocomplete="username" placeholder="Your BBB username"></div><div class="bbb-auth-field"><label>Email</label><input name="email" type="email" autocomplete="email" required placeholder="you@email.com"></div><div class="bbb-auth-field"><label>Password</label><input name="password" type="password" minlength="6" autocomplete="new-password" required placeholder="At least 6 characters"></div><button class="bbb-auth-submit" type="submit">CREATE FREE ACCOUNT</button><div class="bbb-auth-note">No paywall. No credit card. Your future league tools will live here.</div><div id="bbbAuthStatus"></div></form></div></div></section>
  <section class="bbb-account-main"><div class="shell"><div class="bbb-account-topline"><div><div class="bbb-account-kicker">WHAT THIS UNLOCKS</div><h2>The start of My BBB.</h2></div><p class="section-sub">Accounts stay lightweight so the public rankings remain just as fast as they are now.</p></div><div class="bbb-account-grid"><article class="bbb-account-card featured"><div class="label">01 / MY BBB</div><h3>Your personal dynasty home.</h3><p>Your account becomes the layer on top of the rankings — not a replacement for them. Your roster and leagues will reference the same live BBB player values everyone already uses.</p><span class="action primary">CREATE YOUR ACCOUNT</span></article><article class="bbb-account-card"><div class="label">02 / SLEEPER</div><h3>Connect your leagues.</h3><p>After the account foundation is approved, the next step is linking a Sleeper username and importing the leagues you choose.</p><span class="bbb-account-lock">COMING NEXT</span></article><article class="bbb-account-card"><div class="label">03 / ANALYSIS</div><h3>Know your team direction.</h3><p>Contender, middle or rebuilder — plus strengths, weaknesses, draft capital and recommended moves using BBB values.</p><span class="bbb-account-lock">PHASE 2–4</span></article></div></div></section>`}

function bbbAccountSignedInHtml(){
  const email=bbbAccountSession?.user?.email||'';const name=bbbAccountProfile?.username||bbbAccountProfile?.display_name||email.split('@')[0]||'BBB Member';const initial=(name[0]||'B').toUpperCase();
  return `<section class="bbb-account-hero"><div class="shell"><div class="bbb-account-kicker">MY BBB</div><h1 class="bbb-account-title">WELCOME BACK,<br><span>${bbbAccountEsc(name)}.</span></h1><p class="bbb-account-copy">Your account is live. This is the foundation we'll use for connected leagues, contender analysis, personalized roster recommendations and trade finding.</p></div></section><section class="bbb-account-main"><div class="shell"><div class="bbb-account-profilebar"><div class="bbb-account-profile-id"><div class="bbb-account-avatar">${bbbAccountEsc(initial)}</div><div><strong>${bbbAccountEsc(name)}</strong><span>${bbbAccountEsc(email)}</span></div></div><button id="bbbAccountSignout" class="bbb-account-signout">SIGN OUT</button></div><div class="bbb-account-grid"><article class="bbb-account-card featured"><div class="label">NEXT STEP</div><h3>Connect Sleeper.</h3><p>The account layer is ready. Once you approve this layout, we'll add the read-only Sleeper connection here and let you choose which leagues appear in My BBB.</p>${bbbSleeperPreviewOnly()?'<div id="bbbSleeperPanel" class="bbb-sleeper-panel" aria-live="polite">Loading your Sleeper connection…</div>':'<span class="bbb-account-lock">SLEEPER CONNECTION IN PREVIEW TESTING</span>'}</article><article class="bbb-account-card"><div class="label">MY PLAYERS</div><h3>Your existing watchlist.</h3><p>Your saved BBB players stay available while we fold them into the new account experience.</p><a class="action" href="#watchlist">OPEN MY PLAYERS</a></article><article class="bbb-account-card"><div class="label">MY TEAMS</div><h3>League dashboard.</h3><p>Roster value, starter strength, future picks, contender score and recommended moves will live here after Sleeper is connected.</p><span class="bbb-account-lock">WAITING FOR SLEEPER</span></article></div></div></section>`;
}


// Sleeper username/league linking (read-only Sleeper API). This feature is
// intentionally preview-only until commercial API permission is resolved.
const bbbSleeperState={userId:null,connection:null,saved:[],available:[],season:null,loaded:false,loading:false,busy:false,message:'',error:''};

function bbbSleeperPreviewOnly(){
  try{
    const topPage=window.top;
    return topPage!==window &&
      topPage.location.origin===location.origin &&
      /noindex/i.test(topPage.document.querySelector('meta[name="robots"]')?.content||'') &&
      /vercel\.app$/i.test(location.hostname);
  }catch{return false;}
}

function bbbSleeperStyle(){
  if(document.querySelector('#bbb-sleeper-styles'))return;
  const style=document.createElement('style');
  style.id='bbb-sleeper-styles';
  style.textContent='.bbb-sleeper-panel{margin-top:14px;font-size:12px;color:#b2c5ba}.bbb-sleeper-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.bbb-sleeper-row input{flex:1;min-width:145px;padding:10px;border:1px solid #375b45;border-radius:8px;color:#eff9f1;background:#07140d}.bbb-sleeper-panel button{border:1px solid #388354;border-radius:8px;background:#17452a;color:#e9fff0;padding:9px 12px;font-size:11px;font-weight:800;cursor:pointer}.bbb-sleeper-panel button:disabled{opacity:.5;cursor:wait}.bbb-sleeper-muted{color:#93aa9d;font-size:11px;line-height:1.55;margin:9px 0}.bbb-sleeper-status{color:#8ee1b0;font-size:11px;margin:10px 0}.bbb-sleeper-error{color:#ffa7a7;font-size:11px;margin:10px 0}.bbb-sleeper-leagues{max-height:300px;overflow-y:auto;margin:12px 0;padding:6px;background:#07120c;border-radius:9px}.bbb-sleeper-league{display:flex;gap:8px;align-items:start;padding:10px;border-bottom:1px solid #224130;font-size:11px;cursor:pointer}.bbb-sleeper-league:last-child{border:0}.bbb-sleeper-league input{margin-top:3px;accent-color:#40c980}.bbb-sleeper-league strong{display:block;color:#f1fff3;font-size:12px}.bbb-sleeper-league small{display:block;color:#93ae9e;margin-top:3px}.bbb-sleeper-secondary{background:#101b13!important;color:#a8cdb5!important}';
  document.head.appendChild(style);
}

function bbbSleeperHtml(){
  const st=bbbSleeperState, e=bbbAccountEsc;
  if(!st.loaded)return '<div class="bbb-sleeper-muted">Loading saved Sleeper account…</div>';
  let out='<div class="bbb-sleeper-muted">Read-only league import. No Sleeper password needed. This is a preview-only connection test.</div>';
  if(st.error)out+='<div class="bbb-sleeper-error" role="alert">'+e(st.error)+'</div>';
  if(st.message)out+='<div class="bbb-sleeper-status" role="status">'+e(st.message)+'</div>';
  if(!st.connection){
    out+='<form id="bbbSleeperConnectForm"><label for="bbbSleeperUsername">Sleeper username</label><div class="bbb-sleeper-row"><input id="bbbSleeperUsername" name="username" maxlength="40" autocomplete="off" spellcheck="false" placeholder="Your Sleeper username" required><button type="submit" '+(st.busy?'disabled':'')+'>CONNECT SLEEPER</button></div></form>';
    return out;
  }
  out+='<div><strong>Connected: @'+e(st.connection.sleeper_username)+'</strong></div>';
  out+='<div class="bbb-sleeper-row" style="margin-top:10px"><button id="bbbSleeperRefresh" type="button" '+(st.busy?'disabled':'')+'>FIND / REFRESH LEAGUES</button><button id="bbbSleeperDisconnect" class="bbb-sleeper-secondary" type="button" '+(st.busy?'disabled':'')+'>DISCONNECT</button></div>';
  const saved=st.saved.filter(x=>x.selected);
  if(saved.length)out+='<div class="bbb-sleeper-muted">Saved leagues: '+saved.map(x=>e(x.league_name)+' ('+e(x.season)+')'+(x.roster_id==null?' — roster not identified':'')).join(' · ')+'</div>';
  if(st.season)out+='<div class="bbb-sleeper-muted">NFL season '+e(st.season)+'</div>';
  if(st.available.length){
    out+='<form id="bbbSleeperLeagueForm"><div class="bbb-sleeper-leagues">';
    for(const league of st.available){
      const id=String(league.league_id), existing=st.saved.find(x=>x.league_id===id);
      const selected=Boolean(existing?.selected);
      out+='<label class="bbb-sleeper-league"><input type="checkbox" data-sleeper-league="'+e(id)+'" '+(selected?'checked':'')+'><span><strong>'+e(league.name||'Untitled league')+'</strong><small>'+e(league.season||st.season)+' · '+e(league.total_rosters??'?')+' rosters · '+e(league.status||'unknown')+'</small></span></label>';
    }
    out+='</div><button type="submit" '+(st.busy?'disabled':'')+'>SAVE SELECTED LEAGUES</button></form>';
  }else if(st.season)out+='<div class="bbb-sleeper-muted">No NFL leagues found for '+e(st.season)+'. Try another Sleeper username if this is unexpected.</div>';
  return out;
}

function bbbSleeperPaint(){
  if(!bbbSleeperPreviewOnly())return;
  const panel=document.querySelector('#bbbSleeperPanel');
  if(!panel)return;
  bbbSleeperStyle();panel.innerHTML=bbbSleeperHtml();
  panel.querySelector('#bbbSleeperConnectForm')?.addEventListener('submit',bbbSleeperConnect);
  panel.querySelector('#bbbSleeperRefresh')?.addEventListener('click',bbbSleeperDiscover);
  panel.querySelector('#bbbSleeperLeagueForm')?.addEventListener('submit',bbbSleeperSaveLeagues);
  panel.querySelector('#bbbSleeperDisconnect')?.addEventListener('click',bbbSleeperDisconnect);
}

async function bbbSleeperDatabase(endpoint,method='GET',body=null){
  const session=await bbbAccountRefreshSession();
  if(!session?.user?.id||!session.access_token)throw new Error('Please sign in to your BBB account again.');
  const url=BBB_SUPABASE_URL+'/rest/v1/'+endpoint;
  const headers=bbbAccountHeaders(session.access_token);
  if(method==='POST')headers.Prefer='resolution=merge-duplicates,return=representation';
  const response=await fetch(url,{method,headers,body:body==null?undefined:JSON.stringify(body)});
  if(!response.ok){
    const err=await response.json().catch(()=>({}));
    if(response.status===409)throw new Error('This Sleeper account is already linked to another BBB account.');
    throw new Error(err.message||'Could not save Sleeper connection ('+response.status+').');
  }
  return response.status===204?[]:response.json().catch(()=>[]);
}

async function bbbSleeperGet(path){
  const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),12000);
  try{
    const result=await fetch('https://api.sleeper.app/v1'+path,{signal:ctrl.signal,headers:{Accept:'application/json'},credentials:'omit'});
    if(result.status===404)return null;
    if(!result.ok)throw new Error('Sleeper is unavailable (HTTP '+result.status+'). Please retry.');
    return await result.json();
  }catch(err){
    if(err.name==='AbortError')throw new Error('Sleeper request timed out. Please try again.');
    if(err instanceof TypeError)throw new Error('Could not reach Sleeper. Check your browser connection or privacy settings.');
    throw err;
  }finally{clearTimeout(timeout);}
}

async function bbbSleeperInitialize(){
  if(!bbbSleeperPreviewOnly()||!bbbAccountSession?.user?.id)return;
  const uid=bbbAccountSession.user.id,st=bbbSleeperState;
  if(st.userId!==uid){Object.assign(st,{userId:uid,connection:null,saved:[],available:[],season:null,loaded:false,loading:false,busy:false,message:'',error:''});}
  if(st.loaded||st.loading){bbbSleeperPaint();return;}
  st.loading=true;
  try{
    const [connection,leagues]=await Promise.all([
      bbbSleeperDatabase('user_sleeper_connections?user_id=eq.'+encodeURIComponent(uid)+'&select=*'),
      bbbSleeperDatabase('user_sleeper_leagues?user_id=eq.'+encodeURIComponent(uid)+'&select=*&order=league_name.asc')
    ]);
    if(st.userId!==uid)return;
    st.connection=connection[0]||null;
    st.saved=Array.isArray(leagues)?leagues:[];
  }catch(err){st.error=err.message||'Could not read your saved leagues.';}
  finally{if(st.userId===uid){st.loading=false;st.loaded=true;bbbSleeperPaint();}}
}

async function bbbSleeperConnect(event){
  event.preventDefault();
  const st=bbbSleeperState;
  if(st.busy)return;
  const username=String(event.currentTarget.querySelector('[name=username]')?.value||'').trim();
  if(!/^[A-Za-z0-9_.-]{2,40}$/.test(username)){st.error='Enter a valid Sleeper username.';bbbSleeperPaint();return;}
  st.busy=true;st.error='';st.message='Looking up Sleeper account…';bbbSleeperPaint();
  try{
    const remote=await bbbSleeperGet('/user/'+encodeURIComponent(username));
    if(!remote?.user_id||!/^\d+$/.test(String(remote.user_id)))throw new Error('No Sleeper user was found for that username.');
    const uid=bbbAccountSession?.user?.id;
    if(!uid)throw new Error('BBB account session expired.');
    const results=await bbbSleeperDatabase('user_sleeper_connections?on_conflict=user_id','POST',[{
      user_id:uid,sleeper_user_id:String(remote.user_id),sleeper_username:String(remote.username||username),
      display_name:String(remote.display_name||remote.username||username),avatar_id:remote.avatar||null,updated_at:new Date().toISOString()
    }]);
    st.connection=results[0]||{sleeper_user_id:String(remote.user_id),sleeper_username:String(remote.username||username)};
    st.message='Sleeper username saved. Loading your leagues…';
    st.busy=false;
    await bbbSleeperDiscover();
    return;
  }catch(err){st.error=err.message||'Could not connect Sleeper.';st.message='';}
  finally{st.busy=false;bbbSleeperPaint();}
}

async function bbbSleeperDiscover(){
  const st=bbbSleeperState;
  if(st.busy||!st.connection)return;
  st.busy=true;st.error='';st.message='Loading current NFL leagues…';bbbSleeperPaint();
  try{
    const nfl=await bbbSleeperGet('/state/nfl');
    const season=String(nfl?.season||new Date().getUTCFullYear());
    if(!/^20\d{2}$/.test(season))throw new Error('Could not determine the NFL season.');
    const leagues=await bbbSleeperGet('/user/'+encodeURIComponent(st.connection.sleeper_user_id)+'/leagues/nfl/'+season);
    if(!Array.isArray(leagues))throw new Error('Sleeper did not return a league list.');
    st.available=leagues.filter(x=>x&&/^\d+$/.test(String(x.league_id))).slice(0,100);
    st.season=season;st.message=st.available.length?'Choose your leagues and save.':'No current-season leagues were found.';
  }catch(err){st.error=err.message||'Unable to load Sleeper leagues.';st.message='';}
  finally{st.busy=false;bbbSleeperPaint();}
}

async function bbbSleeperSaveLeagues(event){
  event.preventDefault();
  const st=bbbSleeperState;
  if(st.busy||!st.connection)return;
  const form=event.currentTarget;
  const picked=new Set([...form.querySelectorAll('input[data-sleeper-league]:checked')].map(x=>x.dataset.sleeperLeague));
  if(picked.size>20){st.error='Select up to 20 leagues for now.';bbbSleeperPaint();return;}
  st.busy=true;st.error='';st.message='Saving selected leagues…';bbbSleeperPaint();
  try{
    const uid=bbbAccountSession?.user?.id;
    if(!uid)throw new Error('BBB account session expired.');
    const rows=[];
    for(const league of st.available){
      const id=String(league.league_id),selected=picked.has(id);
      let rosterId=null;
      if(selected){
        const rosters=await bbbSleeperGet('/league/'+encodeURIComponent(id)+'/rosters');
        const mine=Array.isArray(rosters)?rosters.find(x=>String(x.owner_id)===String(st.connection.sleeper_user_id)||Array.isArray(x.co_owners)&&x.co_owners.some(c=>String(c)===String(st.connection.sleeper_user_id))):null;
        rosterId=Number.isInteger(Number(mine?.roster_id))?Number(mine.roster_id):null;
      }
      rows.push({
        user_id:uid,league_id:id,season:String(league.season||st.season),
        league_name:String(league.name||'Untitled league').slice(0,200),
        avatar_id:league.avatar||null,
        total_rosters:Number.isInteger(Number(league.total_rosters))?Number(league.total_rosters):null,
        roster_id:rosterId,league_status:String(league.status||'unknown'),
        selected,roster_positions:Array.isArray(league.roster_positions)?league.roster_positions:[],
        scoring_settings:league.scoring_settings&&typeof league.scoring_settings==='object'?league.scoring_settings:{},
        synced_at:new Date().toISOString()
      });
    }
    const updated=await bbbSleeperDatabase('user_sleeper_leagues?on_conflict=user_id,league_id','POST',rows);
    st.saved=[...st.saved.filter(s=>!rows.some(r=>r.league_id===s.league_id)),...updated];
    st.message=picked.size+' league'+(picked.size===1?'':'s')+' saved to My BBB.';
  }catch(err){st.error=err.message||'Could not save leagues.';st.message='';}
  finally{st.busy=false;bbbSleeperPaint();}
}

async function bbbSleeperDisconnect(){
  const st=bbbSleeperState;
  if(st.busy||!st.connection||!window.confirm('Disconnect Sleeper and remove saved league selections from My BBB?'))return;
  st.busy=true;st.error='';st.message='Disconnecting…';bbbSleeperPaint();
  try{
    const uid=encodeURIComponent(bbbAccountSession.user.id);
    await bbbSleeperDatabase('user_sleeper_leagues?user_id=eq.'+uid,'DELETE');
    await bbbSleeperDatabase('user_sleeper_connections?user_id=eq.'+uid,'DELETE');
    Object.assign(st,{connection:null,saved:[],available:[],season:null,message:'Sleeper disconnected. Your BBB account remains active.'});
  }catch(err){st.error=err.message||'Could not disconnect Sleeper.';st.message='';}
  finally{st.busy=false;bbbSleeperPaint();}
}

function bbbAccountBindAuth(){
  const view=bbbAccountEnsureView();
  const tabs=[...view.querySelectorAll('[data-auth-mode]')];let mode='signup';
  const setMode=next=>{mode=next;tabs.forEach(x=>x.classList.toggle('active',x.dataset.authMode===mode));view.querySelectorAll('.signup-only').forEach(x=>x.style.display=mode==='signup'?'grid':'none');const btn=view.querySelector('.bbb-auth-submit');if(btn)btn.textContent=mode==='signup'?'CREATE FREE ACCOUNT':'SIGN IN';const pw=view.querySelector('[name=password]');if(pw)pw.autocomplete=mode==='signup'?'new-password':'current-password';};
  tabs.forEach(t=>t.onclick=()=>setMode(t.dataset.authMode));
  view.querySelector('#bbbAccountForm')?.addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget,status=view.querySelector('#bbbAuthStatus'),btn=form.querySelector('.bbb-auth-submit');const fd=new FormData(form),email=String(fd.get('email')||'').trim(),password=String(fd.get('password')||''),username=String(fd.get('username')||'').trim();status.className='bbb-auth-status';status.textContent='Working…';btn.disabled=true;try{if(mode==='signup'){if(!/^[A-Za-z0-9_]{3,24}$/.test(username))throw new Error('Username must be 3–24 characters using letters, numbers or underscores.');const data=await bbbAccountSignup(email,password,username);if(data.access_token){status.className='bbb-auth-status success';status.textContent='Account created. Loading My BBB…';setTimeout(()=>{bbbAccountRender();bbbAccountPolishNav()},350);}else{status.className='bbb-auth-status success';status.textContent='Account created. Check your email to confirm it, then come back and sign in.';}}else{await bbbAccountLogin(email,password);status.className='bbb-auth-status success';status.textContent='Signed in. Loading My BBB…';setTimeout(()=>{bbbAccountRender();bbbAccountPolishNav()},250);}}catch(err){status.className='bbb-auth-status error';status.textContent=err.message||'Something went wrong.';}finally{btn.disabled=false;}});
  view.querySelector('#bbbAccountSignout')?.addEventListener('click',bbbAccountLogout);
}

function bbbAccountRender(){const view=bbbAccountEnsureView();view.innerHTML=bbbAccountSession?.access_token?bbbAccountSignedInHtml():bbbAccountSignedOutHtml();bbbAccountBindAuth();if(bbbAccountSession?.access_token)bbbSleeperInitialize();}

function bbbAccountAppendYouTubeToExplore(){
  document.querySelectorAll('.bbb-nav-explore-menu').forEach(menu=>{if(menu.querySelector('.bbb-youtube-explore'))return;const a=document.createElement('a');a.className='bbb-youtube-explore';a.href='https://www.youtube.com/@bobbysbigboard';a.target='_blank';a.innerHTML='<strong>YouTube ↗</strong><span>Film breakdowns, rankings and dynasty content.</span>';menu.appendChild(a);});
  document.querySelectorAll('#bbbMobileExploreSheet').forEach(menu=>{if(menu.querySelector('.bbb-youtube-explore'))return;const a=document.createElement('a');a.className='bbb-youtube-explore';a.href='https://www.youtube.com/@bobbysbigboard';a.target='_blank';a.innerHTML='<strong>YouTube ↗</strong><span>Film breakdowns, rankings and dynasty content.</span>';menu.appendChild(a);});
}

function bbbAccountPolishNav(){
  document.querySelectorAll('.nav-links').forEach(nav=>{
    [...nav.querySelectorAll(':scope > a')].forEach(a=>{const href=a.getAttribute('href')||'';if(href.includes('youtube.com'))a.remove();else if(href.includes('#watchlist')){a.textContent='My BBB';a.setAttribute('href','#account');a.classList.add('bbb-account-nav-link');}});
  });
  bbbAccountAppendYouTubeToExplore();
  const header=document.querySelector('.site-header .nav');if(header){let join=header.querySelector('.bbb-account-join');if(!join){join=document.createElement('a');join.className='bbb-account-join';const trade=header.querySelector('.nav-cta');trade?.insertAdjacentElement('afterend',join);if(!trade)header.appendChild(join);}join.href='#account';if(bbbAccountSession?.access_token){const name=bbbAccountProfile?.username||bbbAccountProfile?.display_name||'MY BBB';join.classList.add('signed-in');join.innerHTML=`<span class="bbb-account-dot"></span>${bbbAccountEsc(name).toUpperCase()}`;}else{join.classList.remove('signed-in');join.textContent='JOIN FREE';}}
  document.querySelectorAll('.mobile-subnav').forEach(nav=>{let a=nav.querySelector('.bbb-account-mobile-link');if(!a){a=document.createElement('a');a.className='bbb-account-mobile-link';a.href='#account';nav.appendChild(a);}a.textContent=bbbAccountSession?.access_token?'My BBB':'Join Free';});
}

function bbbAccountRoute(){
  const on=location.hash==='#account';const view=bbbAccountEnsureView();if(!on){view.classList.add('hide');return;}
  ['rankingsView','rookieView','prospectView','tradeView','compareView','updatesView','moversView','watchlistView','opportunityView','profileView','statsView'].forEach(id=>document.querySelector('#'+id)?.classList.add('hide'));view.classList.remove('hide');window.scrollTo(0,0);
}

async function bbbAccountInit(){
  bbbAccountInjectStyles();bbbAccountEnsureView();
  const recovering=new URL(location.href).searchParams.get('bbb_reset')==='1'||/(?:^#|&)type=recovery(?:&|$)/.test(location.hash);
  if(recovering){bbbAccountSaveSession(null);bbbAccountSession=null;bbbAccountProfile=null;}
  else {bbbAccountSession=await bbbAccountRefreshSession();if(bbbAccountSession)await bbbAccountLoadProfile();}
  bbbAccountRender();bbbAccountPolishNav();bbbAccountRoute();
  [150,600,1400].forEach(ms=>setTimeout(()=>{bbbAccountPolishNav();bbbAccountRoute();},ms));
  window.addEventListener('hashchange',()=>setTimeout(bbbAccountRoute,0));
}

// Prepaint a stable account control from the locally cached session.
bbbAccountSession=(new URL(location.href).searchParams.get('bbb_reset')==='1'||/(?:^#|&)type=recovery(?:&|$)/.test(location.hash))?null:bbbAccountReadSession();
bbbAccountInjectStyles();
bbbAccountPolishNav();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bbbAccountInit);else bbbAccountInit();
