// BBB Account Auth Cleanup V1 — recovery flow, auth callbacks, safer signup messaging, cross-tab state sync.
(function(){
  const RESET_QUERY='bbb_reset';
  let recoverySession=null;

  function injectStyles(){
    if(document.querySelector('#bbb-auth-cleanup-styles'))return;
    const s=document.createElement('style');
    s.id='bbb-auth-cleanup-styles';
    s.textContent=`
      .bbb-auth-secondary{display:flex;justify-content:center;margin-top:11px}.bbb-auth-link{border:0;background:none;color:#78dca8;font-size:9px;font-weight:900;cursor:pointer;padding:3px 5px}.bbb-auth-link:hover{color:#fff;text-decoration:underline}.bbb-auth-helper{margin-top:10px;color:#74877d;font-size:9px;line-height:1.55}.bbb-auth-helper strong{color:#a9bcb1}.bbb-auth-reset-title{font-size:22px;margin:0 0 6px;letter-spacing:-.03em}.bbb-auth-reset-copy{margin:0 0 16px;color:#83978c;font-size:10px;line-height:1.6}.bbb-auth-password-row{position:relative}.bbb-auth-password-row input{padding-right:58px}.bbb-auth-show-password{position:absolute;right:8px;bottom:8px;border:0;background:transparent;color:#6f8a7c;font-size:8px;font-weight:900;cursor:pointer}.bbb-auth-success-banner{margin-bottom:14px;padding:10px 12px;border:1px solid #216346;border-radius:9px;background:#092417;color:#83e7b0;font-size:10px;line-height:1.5}
    `;
    document.head.appendChild(s);
  }

  function authHeaders(token=''){return bbbAccountHeaders(token)}

  async function getUser(token){
    const r=await fetch(`${BBB_SUPABASE_URL}/auth/v1/user`,{headers:authHeaders(token)});
    if(!r.ok)return null;
    return await r.json().catch(()=>null);
  }

  function sessionFromHash(params,user){
    const expiresIn=Number(params.get('expires_in')||3600);
    return {
      access_token:params.get('access_token'),
      refresh_token:params.get('refresh_token'),
      expires_in:expiresIn,
      expires_at:Math.floor(Date.now()/1000)+expiresIn,
      token_type:params.get('token_type')||'bearer',
      user:user||null
    };
  }

  function cleanedAccountUrl(){
    const url=new URL(location.href);
    url.searchParams.delete(RESET_QUERY);
    url.hash='account';
    return url.pathname+(url.search||'')+url.hash;
  }

  function setAccountRouteWithoutTokens(){
    history.replaceState(null,'',cleanedAccountUrl());
  }

  async function handleAuthCallback(){
    const raw=location.hash.startsWith('#')?location.hash.slice(1):'';
    if(!raw.includes('access_token='))return false;
    const params=new URLSearchParams(raw);
    const token=params.get('access_token');
    if(!token)return false;
    const type=params.get('type')||'';
    const user=await getUser(token);
    const session=sessionFromHash(params,user);

    if(type==='recovery'||new URL(location.href).searchParams.get(RESET_QUERY)==='1'){
      recoverySession=session;
      setAccountRouteWithoutTokens();
      showRecoveryForm();
      return true;
    }

    if(session.refresh_token&&user){
      bbbAccountSaveSession(session);
      bbbAccountSession=session;
      await bbbAccountLoadProfile();
      setAccountRouteWithoutTokens();
      bbbAccountRender();
      bbbAccountPolishNav();
      bbbAccountRoute();
      showOneTimeBanner('Email confirmed. You’re signed in to My BBB.');
      return true;
    }
    return false;
  }

  function showOneTimeBanner(message){
    const view=bbbAccountEnsureView();
    const shell=view.querySelector('.bbb-account-main .shell');
    if(!shell||shell.querySelector('.bbb-auth-success-banner'))return;
    const el=document.createElement('div');el.className='bbb-auth-success-banner';el.textContent=message;shell.prepend(el);
    setTimeout(()=>el.remove(),6000);
  }

  function addForgotPassword(){
    if(bbbAccountSession?.access_token)return;
    const view=bbbAccountEnsureView();
    const form=view.querySelector('#bbbAccountForm');
    if(!form||form.querySelector('.bbb-auth-secondary'))return;
    const wrap=document.createElement('div');wrap.className='bbb-auth-secondary';
    wrap.innerHTML='<button type="button" class="bbb-auth-link" id="bbbForgotPassword">Forgot password?</button>';
    const status=form.querySelector('#bbbAuthStatus');
    if(status)form.insertBefore(wrap,status);else form.appendChild(wrap);
    const toggle=()=>{const login=view.querySelector('[data-auth-mode="login"]')?.classList.contains('active');wrap.style.display=login?'flex':'none';};
    toggle();
    view.querySelectorAll('[data-auth-mode]').forEach(tab=>tab.addEventListener('click',()=>setTimeout(toggle,0)));
    wrap.querySelector('#bbbForgotPassword')?.addEventListener('click',showForgotForm);
    const pw=form.querySelector('[name="password"]');if(pw){pw.minLength=8;pw.placeholder='At least 8 characters';}
  }

  function showForgotForm(){
    const view=bbbAccountEnsureView();
    const card=view.querySelector('.bbb-auth-card');if(!card)return;
    const existingEmail=view.querySelector('#bbbAccountForm [name="email"]')?.value||'';
    card.innerHTML=`<h3 class="bbb-auth-reset-title">Reset password</h3><p class="bbb-auth-reset-copy">Enter the email on your BBB account. We’ll send a secure reset link. While BBB email is still new, the message may land in Spam or Junk.</p><form id="bbbForgotForm"><div class="bbb-auth-field"><label>Email</label><input name="email" type="email" autocomplete="email" required value="${bbbAccountEsc(existingEmail)}" placeholder="you@email.com"></div><button class="bbb-auth-submit" type="submit">SEND RESET LINK</button><div class="bbb-auth-helper">For privacy, we’ll show the same confirmation whether or not an account exists for that email.</div><div class="bbb-auth-secondary"><button type="button" class="bbb-auth-link" id="bbbBackToSignIn">Back to sign in</button></div><div id="bbbForgotStatus"></div></form>`;
    card.querySelector('#bbbBackToSignIn')?.addEventListener('click',()=>{bbbAccountRender();setTimeout(()=>{enhanceAuthUi();const login=bbbAccountEnsureView().querySelector('[data-auth-mode="login"]');login?.click();},0);});
    card.querySelector('#bbbForgotForm')?.addEventListener('submit',requestPasswordReset);
  }

  async function requestPasswordReset(e){
    e.preventDefault();const form=e.currentTarget,status=form.querySelector('#bbbForgotStatus'),btn=form.querySelector('.bbb-auth-submit');const email=String(new FormData(form).get('email')||'').trim();
    status.className='bbb-auth-status';status.textContent='Sending…';btn.disabled=true;
    try{
      const redirect=`${location.origin}/?${RESET_QUERY}=1`;
      const r=await fetch(`${BBB_SUPABASE_URL}/auth/v1/recover?redirect_to=${encodeURIComponent(redirect)}`,{method:'POST',headers:authHeaders(),body:JSON.stringify({email})});
      const data=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(data.msg||data.message||data.error_description||'Could not send reset email.');
      status.className='bbb-auth-status success';status.textContent='If an account exists for that email, a password reset link is on the way. Check your Inbox and Spam/Junk folder. If it lands there, mark it Not spam.';
    }catch(err){status.className='bbb-auth-status error';status.textContent=err.message||'Could not send reset email.';}finally{btn.disabled=false;}
  }

  function showRecoveryForm(){
    injectStyles();
    const view=bbbAccountEnsureView();
    ['rankingsView','rookieView','prospectView','tradeView','compareView','updatesView','moversView','watchlistView','opportunityView','profileView','statsView'].forEach(id=>document.querySelector('#'+id)?.classList.add('hide'));
    view.classList.remove('hide');
    view.innerHTML=`<section class="bbb-account-hero"><div class="shell bbb-account-hero-grid"><div><div class="bbb-account-kicker">ACCOUNT SECURITY</div><h1 class="bbb-account-title">RESET YOUR<br><span>PASSWORD.</span></h1><p class="bbb-account-copy">Choose a new password for your Bobby’s Big Board account. Your recovery link is temporary and the token is removed from the address bar immediately.</p></div><div class="bbb-auth-card"><h3 class="bbb-auth-reset-title">Choose a new password</h3><p class="bbb-auth-reset-copy">Use at least 8 characters. A password manager is recommended.</p><form id="bbbRecoveryForm"><div class="bbb-auth-field bbb-auth-password-row"><label>New password</label><input name="password" type="password" minlength="8" autocomplete="new-password" required placeholder="At least 8 characters"><button class="bbb-auth-show-password" type="button">SHOW</button></div><div class="bbb-auth-field"><label>Confirm password</label><input name="confirm" type="password" minlength="8" autocomplete="new-password" required placeholder="Repeat password"></div><button class="bbb-auth-submit" type="submit">UPDATE PASSWORD</button><div id="bbbRecoveryStatus"></div></form></div></div></section>`;
    const form=view.querySelector('#bbbRecoveryForm');
    form?.querySelector('.bbb-auth-show-password')?.addEventListener('click',e=>{const input=form.querySelector('[name="password"]');const show=input.type==='password';input.type=show?'text':'password';e.currentTarget.textContent=show?'HIDE':'SHOW';});
    form?.addEventListener('submit',updateRecoveredPassword);
    window.scrollTo(0,0);
  }

  async function updateRecoveredPassword(e){
    e.preventDefault();const form=e.currentTarget,status=form.querySelector('#bbbRecoveryStatus'),btn=form.querySelector('.bbb-auth-submit');const fd=new FormData(form),password=String(fd.get('password')||''),confirm=String(fd.get('confirm')||'');
    status.className='bbb-auth-status';status.textContent='Updating…';btn.disabled=true;
    try{
      if(password.length<8)throw new Error('Password must be at least 8 characters.');
      if(password!==confirm)throw new Error('Passwords do not match.');
      const token=recoverySession?.access_token;if(!token)throw new Error('This reset link is no longer valid. Request a new one.');
      const r=await fetch(`${BBB_SUPABASE_URL}/auth/v1/user`,{method:'PUT',headers:authHeaders(token),body:JSON.stringify({password})});
      const data=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(data.msg||data.message||data.error_description||'Could not update password.');
      const user=data?.id?data:await getUser(token);
      const session={...recoverySession,user};
      bbbAccountSaveSession(session);bbbAccountSession=session;await bbbAccountLoadProfile();recoverySession=null;
      status.className='bbb-auth-status success';status.textContent='Password updated. Opening My BBB…';
      setTimeout(()=>{bbbAccountRender();bbbAccountPolishNav();bbbAccountRoute();showOneTimeBanner('Password updated successfully.');},650);
    }catch(err){status.className='bbb-auth-status error';status.textContent=err.message||'Could not update password.';}finally{btn.disabled=false;}
  }

  function polishSignupMessages(){
    const status=bbbAccountEnsureView().querySelector('#bbbAuthStatus');if(!status||status.dataset.cleanupBound)return;status.dataset.cleanupBound='1';
    const observer=new MutationObserver(()=>{
      const t=status.textContent||'';
      if(/account created\. check your email/i.test(t))status.textContent='Check your email to confirm your account. If you already have a BBB account with this email, switch to Sign in instead.';
      if(/already registered|already exists|user.*exists/i.test(t)){status.textContent='This email already has a BBB account. Sign in instead, or use Forgot password if needed.';status.className='bbb-auth-status error';}
    });
    observer.observe(status,{childList:true,subtree:true,characterData:true});
  }

  function enhanceAuthUi(){injectStyles();addForgotPassword();polishSignupMessages();}

  function syncFromStorage(){
    window.addEventListener('storage',async e=>{if(e.key!==BBB_ACCOUNT_STORAGE)return;bbbAccountSession=bbbAccountReadSession();if(bbbAccountSession)await bbbAccountLoadProfile();else bbbAccountProfile=null;bbbAccountRender();bbbAccountPolishNav();bbbAccountRoute();enhanceAuthUi();});
  }

  const originalRender=bbbAccountRender;
  bbbAccountRender=function(){originalRender();setTimeout(enhanceAuthUi,0);};

  async function start(){
    injectStyles();syncFromStorage();
    const handled=await handleAuthCallback();
    if(!handled)enhanceAuthUi();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,0));else setTimeout(start,0);
})();
