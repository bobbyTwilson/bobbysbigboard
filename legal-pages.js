// Bobby's Big Board legal and billing policy pages
(function(){
  const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
  const VIEWS=['terms','privacy','billing'];
  const UPDATED='September 24, 2026';

  function css(){
    if(q('#bbb-legal-css'))return;
    const s=document.createElement('style');s.id='bbb-legal-css';s.textContent=
      '.bbb-legal-view{min-height:75vh;background:#050807;color:#f4f7f5}.bbb-legal-hero{padding:62px 0 34px;border-bottom:1px solid #173328;background:radial-gradient(circle at 78% 10%,rgba(10,143,77,.14),transparent 34%),linear-gradient(180deg,#07100c,#050807)}.bbb-legal-k{color:#54d293;font-size:10px;font-weight:950;letter-spacing:.15em;text-transform:uppercase}.bbb-legal-title{font-size:clamp(44px,6vw,72px);line-height:.94;letter-spacing:-.05em;margin:13px 0 12px}.bbb-legal-sub{max-width:720px;color:#91a299;font-size:13px;line-height:1.7}.bbb-legal-wrap{padding:44px 0 76px}.bbb-legal-grid{display:grid;grid-template-columns:220px minmax(0,760px);gap:38px;align-items:start}.bbb-legal-nav{position:sticky;top:92px;display:grid;gap:8px}.bbb-legal-nav a{padding:10px 12px;border:1px solid #1d392e;border-radius:10px;background:#09110d;color:#8fa198;font-size:10px;font-weight:900}.bbb-legal-nav a.on{border-color:#3a7457;color:#fff;background:#0e2318}.bbb-legal-body{display:grid;gap:14px}.bbb-legal-card{border:1px solid #193329;background:#09110d;border-radius:14px;padding:20px 22px}.bbb-legal-card h2{font-size:18px;margin:0 0 9px}.bbb-legal-card p,.bbb-legal-card li{color:#9baca3;font-size:12px;line-height:1.75}.bbb-legal-card p{margin:8px 0}.bbb-legal-card ul{margin:8px 0 0;padding-left:18px}.bbb-legal-card strong{color:#e9f0ec}.bbb-legal-note{border-left:3px solid #c9a94a;background:#17140c;color:#ddca86;padding:12px 14px;border-radius:8px;font-size:11px;line-height:1.6}.bbb-legal-links{display:flex;flex-wrap:wrap;gap:12px;align-items:center}.bbb-legal-links a{color:#79dca8;font-weight:900}.bbb-legal-footer-links{display:flex;gap:14px;flex-wrap:wrap;margin-top:8px}.bbb-legal-footer-links a{color:#83958b;font-size:10px;font-weight:800}.bbb-plus-legal-links{margin-top:9px;text-align:center;color:#63766c;font-size:8px;line-height:1.6}.bbb-plus-legal-links a{color:#9fb3a8;text-decoration:underline;text-underline-offset:2px}@media(max-width:760px){.bbb-legal-grid{grid-template-columns:1fr}.bbb-legal-nav{position:static;display:flex;overflow-x:auto}.bbb-legal-nav a{flex:none}.bbb-legal-wrap{padding-top:28px}.bbb-legal-card{padding:17px}.bbb-legal-hero{padding-top:45px}}';
    document.head.appendChild(s);
  }

  const sharedNav=(active)=>'<nav class="bbb-legal-nav">'+
    '<a href="#terms" class="'+(active==='terms'?'on':'')+'">TERMS OF SERVICE</a>'+
    '<a href="#privacy" class="'+(active==='privacy'?'on':'')+'">PRIVACY POLICY</a>'+
    '<a href="#billing" class="'+(active==='billing'?'on':'')+'">BBB+ BILLING POLICY</a>'+
    '<a href="#plus">BACK TO BBB+</a>'+
  '</nav>';

  function shell(kind,title,sub,body){
    return '<section class="bbb-legal-hero"><div class="shell"><div class="bbb-legal-k">BOBBY\'S BIG BOARD</div><h1 class="bbb-legal-title">'+title+'</h1><p class="bbb-legal-sub">'+sub+'<br><strong>Last updated:</strong> '+UPDATED+'</p></div></section>'+
      '<section class="bbb-legal-wrap"><div class="shell bbb-legal-grid">'+sharedNav(kind)+'<div class="bbb-legal-body">'+body+'</div></div></section>';
  }

  function terms(){
    return shell('terms','Terms of Service','These terms govern your use of Bobby\'s Big Board, including free tools, accounts, and BBB+ paid features.',
      '<div class="bbb-legal-card"><h2>1. Using Bobby\'s Big Board</h2><p>By accessing or using Bobby\'s Big Board (“BBB,” “we,” “us,” or “our”), you agree to these Terms. If you do not agree, do not use the service. If you are under 18, use the service only with permission from a parent or legal guardian who can agree to these Terms on your behalf.</p></div>'+
      '<div class="bbb-legal-card"><h2>2. What the service provides</h2><p>BBB provides dynasty fantasy football rankings, player research, prospect scouting, market context, trade analysis, statistics, historical value tools, account features, and optional premium BBB+ features.</p><p>Fantasy football analysis is opinion and informational content. <strong>BBB does not guarantee player performance, trade outcomes, league results, winnings, or financial results.</strong> BBB is not a sportsbook, gambling operator, contest operator, investment adviser, or financial adviser.</p></div>'+
      '<div class="bbb-legal-card"><h2>3. Accounts and security</h2><p>You are responsible for accurate account information, keeping your login credentials secure, and activity performed through your account. Do not share access in a way that bypasses paid access controls or harms the service.</p></div>'+
      '<div class="bbb-legal-card"><h2>4. Acceptable use</h2><ul><li>Do not scrape, copy, resell, mirror, or systematically extract BBB rankings, data, or premium content without permission.</li><li>Do not attempt to bypass authentication, subscription checks, rate limits, or other security controls.</li><li>Do not use the service to distribute malware, interfere with the site, impersonate others, or violate applicable law.</li></ul></div>'+
      '<div class="bbb-legal-card"><h2>5. BBB+ subscriptions</h2><p>BBB+ is an automatically renewing subscription unless canceled. Current launch pricing is <strong>$4.99 per month</strong> or <strong>$39.99 per year</strong>. Billing, renewals, cancellation timing, refunds, and Founding 100 terms are described in the <a href="#billing">BBB+ Billing Policy</a>, which is incorporated into these Terms.</p></div>'+
      '<div class="bbb-legal-card"><h2>6. Intellectual property</h2><p>BBB’s original rankings, written analysis, graphics, branding, site design, databases, and other original materials are owned by or licensed to Bobby\'s Big Board. NFL, team, player, platform, and third-party names and marks belong to their respective owners.</p></div>'+
      '<div class="bbb-legal-card"><h2>7. Third-party services</h2><p>BBB may rely on third-party services such as Stripe for payments, Supabase for account/data infrastructure, Vercel for hosting/analytics, and supported fantasy platforms for league integrations. Their services may be subject to separate terms and privacy policies.</p></div>'+
      '<div class="bbb-legal-card"><h2>8. Changes, availability, and beta features</h2><p>We may add, modify, pause, or remove features. Some BBB+ features are labeled as roadmap, beta, preview, early access, or coming soon and may change before full release. We may update rankings, formulas, market sources, or tools at any time.</p></div>'+
      '<div class="bbb-legal-card"><h2>9. Suspension or termination</h2><p>We may restrict or terminate access for fraud, abuse, chargebacks, security threats, unlawful use, or material violations of these Terms. You may stop using BBB at any time and may manage BBB+ billing through the Stripe billing portal when available.</p></div>'+
      '<div class="bbb-legal-card"><h2>10. Disclaimers and limitation of liability</h2><p>The service is provided on an “as is” and “as available” basis to the extent permitted by law. Data can be delayed, incomplete, inaccurate, or changed after publication. To the maximum extent permitted by law, BBB is not liable for indirect, incidental, special, consequential, or lost-profit damages arising from use of the service or reliance on fantasy football analysis.</p></div>'+
      '<div class="bbb-legal-card"><h2>11. Governing law</h2><p>These Terms are governed by the laws of the State of Mississippi, without regard to conflict-of-law rules, except where applicable consumer law requires otherwise.</p></div>'+
      '<div class="bbb-legal-card"><h2>12. Contact and updates</h2><p>For account, privacy, or billing questions, use the support contact shown on your BBB/Stripe receipt or billing portal, or the official support channel provided on Bobby\'s Big Board. We may update these Terms as the service evolves; the updated date above will change when we do.</p></div>');
  }

  function privacy(){
    return shell('privacy','Privacy Policy','This policy explains what information Bobby\'s Big Board handles and how it is used.',
      '<div class="bbb-legal-card"><h2>1. Information we collect</h2><ul><li><strong>Account information:</strong> email address, username/display name, authentication and account identifiers.</li><li><strong>BBB+ billing status:</strong> Stripe customer/subscription identifiers, plan, subscription status, renewal/cancellation status, and billing-period dates. Full card numbers are processed by Stripe and are not stored by BBB.</li><li><strong>Site activity:</strong> basic usage, device/browser, page activity, and analytics information used to operate and improve the site.</li><li><strong>Saved preferences:</strong> watchlists, settings, account preferences, and similar features you choose to use.</li><li><strong>Connected league data:</strong> if you choose to connect a supported fantasy platform, BBB may process league, roster, team, and related data needed to provide the requested feature.</li><li><strong>Support communications:</strong> information you send when asking for help or reporting an issue.</li></ul></div>'+
      '<div class="bbb-legal-card"><h2>2. How we use information</h2><p>We use information to create and secure accounts, provide rankings and tools, manage BBB+ access and billing status, personalize requested features, prevent abuse, troubleshoot issues, understand site performance, and improve the service.</p></div>'+
      '<div class="bbb-legal-card"><h2>3. Payments</h2><p>Payments are processed by Stripe. BBB generally receives payment and subscription status plus identifiers needed to connect your Stripe subscription to your BBB account. Stripe handles payment-card details under its own privacy and security practices.</p></div>'+
      '<div class="bbb-legal-card"><h2>4. Service providers</h2><p>We may use vendors that help operate BBB, including payment processing, authentication/database infrastructure, hosting, analytics, email, and supported fantasy-platform integrations. These providers receive information only as needed to perform their services or as otherwise permitted by law.</p></div>'+
      '<div class="bbb-legal-card"><h2>5. Cookies and analytics</h2><p>BBB and its service providers may use cookies, local storage, and similar technologies for sign-in, preferences, security, checkout, and analytics. Browser controls can limit some of these technologies, though doing so may affect site functionality.</p></div>'+
      '<div class="bbb-legal-card"><h2>6. Data retention</h2><p>We keep information as long as reasonably necessary to provide the service, maintain security and records, satisfy legal or billing obligations, and resolve disputes. Retention periods vary by data type and service provider.</p></div>'+
      '<div class="bbb-legal-card"><h2>7. Your choices</h2><p>You may choose not to connect third-party league accounts, may manage BBB+ billing through Stripe, and may request help with account/privacy questions through BBB’s official support channel. Rights to access, correct, or delete information may vary based on applicable law and legitimate recordkeeping requirements.</p></div>'+
      '<div class="bbb-legal-card"><h2>8. Security</h2><p>We use reasonable technical and organizational measures intended to protect account and subscription information. No internet service can guarantee absolute security.</p></div>'+
      '<div class="bbb-legal-card"><h2>9. Children</h2><p>BBB is not directed to children under 13. If we learn that personal information from a child under 13 was collected without appropriate authorization, we will take reasonable steps to remove it.</p></div>'+
      '<div class="bbb-legal-card"><h2>10. Policy changes and contact</h2><p>We may update this policy as BBB changes. For privacy questions, use the official BBB support channel or contact information shown on your BBB/Stripe receipt or billing portal.</p></div>');
  }

  function billing(){
    return shell('billing','BBB+ Billing Policy','Clear subscription, renewal, cancellation, and refund terms for BBB+.',
      '<div class="bbb-legal-note"><strong>Launch pricing:</strong> $4.99/month or $39.99/year. BBB+ automatically renews until canceled.</div>'+
      '<div class="bbb-legal-card"><h2>1. Subscription plans</h2><p>BBB+ is offered as a recurring monthly or yearly subscription. Unless otherwise shown at checkout, monthly plans renew each month and yearly plans renew each year using the payment method associated with your Stripe billing account.</p></div>'+
      '<div class="bbb-legal-card"><h2>2. Automatic renewal</h2><p>By subscribing, you authorize recurring charges at the selected plan price, plus any applicable taxes, until you cancel. Your renewal date is shown in the Stripe billing portal.</p></div>'+
      '<div class="bbb-legal-card"><h2>3. Cancellation</h2><p>You may cancel through <strong>Manage BBB+ Billing</strong>. When cancellation is scheduled for the end of the billing period, BBB+ access remains active through the already-paid period and the subscription does not renew. Cancellation does not ordinarily produce a prorated refund for unused time.</p></div>'+
      '<div class="bbb-legal-card"><h2>4. Refunds</h2><p>Subscription charges are generally non-refundable once a billing period begins, except where required by law or where BBB determines a duplicate, erroneous, or similar billing issue occurred. If you believe a charge is incorrect, contact BBB promptly through the support contact shown on your receipt or billing portal.</p></div>'+
      '<div class="bbb-legal-card"><h2>5. Failed payments</h2><p>If a payment fails, Stripe may retry the payment and BBB+ access may be limited, paused, or ended depending on the resulting subscription status. Updating your payment method in the billing portal may restore billing eligibility.</p></div>'+
      '<div class="bbb-legal-card"><h2>6. Price changes</h2><p>BBB may change subscription pricing in the future. Existing subscribers will receive notice of material price changes when required, and changes will generally apply to a future renewal rather than retroactively to a completed paid period.</p></div>'+
      '<div class="bbb-legal-card"><h2>7. Founding 100</h2><p>Founding 100 status is a limited launch designation for qualifying early BBB+ members. Availability is limited and may depend on active membership at the time of signup. Founding status does not guarantee that every roadmap feature will launch on a specific date.</p></div>'+
      '<div class="bbb-legal-card"><h2>8. Roadmap and early-access features</h2><p>BBB+ includes a mix of current premium features and clearly labeled roadmap/early-access features. Purchasing a subscription supports continued development but does not guarantee any particular unreleased feature, integration, or launch date.</p></div>'+
      '<div class="bbb-legal-card"><h2>9. Taxes and payment processing</h2><p>Stripe processes BBB+ payments. Applicable taxes may be calculated or collected where required. Your bank or payment provider may apply its own rules or fees.</p></div>'+
      '<div class="bbb-legal-card"><h2>10. Contact</h2><p>For billing questions, use the support contact shown on your Stripe receipt or billing portal or the official BBB support channel.</p><div class="bbb-legal-links"><a href="#terms">Terms of Service</a><a href="#privacy">Privacy Policy</a></div></div>');
  }

  function view(kind){
    let v=q('#'+kind+'View'); if(v)return v;
    v=document.createElement('main');v.id=kind+'View';v.className='bbb-legal-view hide';
    const a=q('#profileView')||q('footer');
    a?.parentNode?a.parentNode.insertBefore(v,a):document.body.appendChild(v);
    return v;
  }

  function hideOthers(){
    ['rankingsView','rookieView','prospectView','tradeView','compareView','updatesView','moversView','watchlistView','opportunityView','profileView','statsView','accountView','plusView','termsView','privacyView','billingView']
      .forEach(id=>q('#'+id)?.classList.add('hide'));
  }

  function route(){
    const kind=String(location.hash||'').replace(/^#/,'').split('?')[0];
    if(!VIEWS.includes(kind))return;
    hideOthers();
    const v=view(kind);
    v.innerHTML=kind==='terms'?terms():kind==='privacy'?privacy():billing();
    v.classList.remove('hide');
    window.scrollTo(0,0);
  }

  function footerLinks(){
    const f=q('.footer-inner')||q('footer');
    if(!f||f.querySelector('.bbb-legal-footer-links'))return;
    const d=document.createElement('div');d.className='bbb-legal-footer-links';
    d.innerHTML='<a href="#terms">Terms</a><a href="#privacy">Privacy</a><a href="#billing">BBB+ Billing</a>';
    f.appendChild(d);
  }

  function plusLinks(){
    const note=q('#bbbPlusCard .bbb-plus-note');
    if(!note||q('#bbbPlusCard .bbb-plus-legal-links'))return;
    const d=document.createElement('div');d.className='bbb-plus-legal-links';
    d.innerHTML='By subscribing, you agree to the <a href="#terms">Terms</a> and <a href="#billing">Billing Policy</a> and acknowledge the <a href="#privacy">Privacy Policy</a>.';
    note.insertAdjacentElement('afterend',d);
  }

  function intercept(){
    document.addEventListener('click',e=>{
      const a=e.target.closest('a[href="#terms"],a[href="#privacy"],a[href="#billing"],a[href="/#terms"],a[href="/#privacy"],a[href="/#billing"]');
      if(!a)return;
      const kind=a.getAttribute('href').split('#')[1];
      if(!VIEWS.includes(kind))return;
      e.preventDefault();e.stopImmediatePropagation();
      if(location.pathname!=='/'||location.hash!=='#'+kind)history.pushState({bbbView:kind},'', '/#'+kind);
      route();
    },true);
  }

  function init(){
    css(); VIEWS.forEach(view); footerLinks(); plusLinks(); route(); intercept();
    const o=new MutationObserver(()=>{footerLinks();plusLinks()});o.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('hashchange',()=>setTimeout(route,0));
    window.addEventListener('popstate',()=>setTimeout(route,0));
    [200,700,1400].forEach(ms=>setTimeout(()=>{footerLinks();plusLinks();route()},ms));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();