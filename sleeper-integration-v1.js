// BBB Sleeper Integration V1 foundation.
// The account/league storage layer is ready, but live Sleeper API sync remains disabled
// until Bobby's Big Board receives Sleeper approval for a third-party integration.
(function(){
  const STYLE_ID='bbb-sleeper-foundation-styles';

  function injectStyles(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      .bbb-sleeper-form{margin-top:17px;display:grid;gap:9px}.bbb-sleeper-input-row{display:flex;gap:8px}.bbb-sleeper-input{min-width:0;flex:1;border:1px solid #2b5140;background:#050a08;color:#eef5f0;border-radius:9px;padding:11px 12px;outline:none}.bbb-sleeper-input:focus{border-color:#53e49a}.bbb-sleeper-connect{flex:none;border:1px solid #24543f;border-radius:9px;padding:0 13px;background:#102319;color:#8cbda1;font-size:9px;font-weight:950;cursor:not-allowed;opacity:.68}.bbb-sleeper-note{padding:10px 11px;border:1px solid #29493b;border-radius:9px;background:#08120e;color:#81948a;font-size:9px;line-height:1.55}.bbb-sleeper-note strong{color:#b7d7c5}.bbb-sleeper-secure{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}.bbb-sleeper-secure span{padding:4px 7px;border:1px solid #244337;border-radius:999px;color:#81a18f;background:#09130f;font-size:7px;font-weight:900;letter-spacing:.04em}.bbb-sleeper-connected{display:flex;align-items:center;gap:10px;margin-top:16px;padding:12px;border:1px solid #256246;border-radius:10px;background:#092317}.bbb-sleeper-avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#173528;color:#72e1a7;font-weight:950}.bbb-sleeper-connected strong{display:block;color:#e5f4eb;font-size:11px}.bbb-sleeper-connected span{display:block;margin-top:2px;color:#7e9589;font-size:8px}
      @media(max-width:640px){.bbb-sleeper-input-row{flex-direction:column}.bbb-sleeper-connect{min-height:40px}}
    `;document.head.appendChild(s);
  }

  function headers(){
    const token=window.bbbAccountSession?.access_token;
    return typeof window.bbbAccountHeaders==='function'?window.bbbAccountHeaders(token):{};
  }

  async function loadConnection(){
    const session=window.bbbAccountSession;
    if(!session?.access_token||!session?.user?.id)return null;
    try{
      const url=`${window.BBB_SUPABASE_URL}/rest/v1/user_sleeper_connections?user_id=eq.${encodeURIComponent(session.user.id)}&select=sleeper_user_id,sleeper_username,display_name,avatar_id,connected_at`;
      const r=await fetch(url,{headers:headers()});
      if(!r.ok)return null;
      const rows=await r.json();return rows?.[0]||null;
    }catch(_){return null;}
  }

  function targetCard(){
    const view=document.querySelector('#accountView');
    if(!view||view.classList.contains('hide')||!window.bbbAccountSession?.access_token)return null;
    return view.querySelector('.bbb-account-grid .bbb-account-card.featured');
  }

  async function enhance(){
    injectStyles();
    const card=targetCard();
    if(!card||card.dataset.bbbSleeperV1==='1')return;
    card.dataset.bbbSleeperV1='1';
    const existing=await loadConnection();
    if(existing){
      const label=existing.display_name||existing.sleeper_username||'Sleeper';
      card.innerHTML=`<div class="label">SLEEPER</div><h3>Sleeper connected.</h3><p>Your Sleeper identity is linked to this BBB account. League sync will appear here when the integration is enabled.</p><div class="bbb-sleeper-connected"><div class="bbb-sleeper-avatar">S</div><div><strong>${typeof bbbAccountEsc==='function'?bbbAccountEsc(label):label}</strong><span>@${typeof bbbAccountEsc==='function'?bbbAccountEsc(existing.sleeper_username||''):existing.sleeper_username||''}</span></div></div>`;
      return;
    }
    card.innerHTML=`<div class="label">SLEEPER CONNECTION</div><h3>Connect your Sleeper account.</h3><p>BBB will use a read-only connection. We will never ask for your Sleeper password or store full API responses.</p><div class="bbb-sleeper-form"><div class="bbb-sleeper-input-row"><input class="bbb-sleeper-input" type="text" placeholder="Sleeper username" aria-label="Sleeper username" disabled><button class="bbb-sleeper-connect" type="button" disabled>CONNECT SLEEPER</button></div><div class="bbb-sleeper-note"><strong>Integration setup is ready.</strong> Sleeper now requires approval for third-party league connections, so live sync stays disabled until BBB is approved.</div><div class="bbb-sleeper-secure"><span>READ ONLY</span><span>NO SLEEPER PASSWORD</span><span>YOU CHOOSE THE LEAGUES</span></div></div>`;
  }

  const observer=new MutationObserver(()=>{setTimeout(enhance,0)});
  function start(){injectStyles();if(document.body)observer.observe(document.body,{childList:true,subtree:true});enhance();[150,500,1200,2500].forEach(ms=>setTimeout(enhance,ms));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
