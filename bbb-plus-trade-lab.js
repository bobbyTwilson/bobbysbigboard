// BBB+ Advanced Trade Lab V1
// Premium package analysis layered under the free BBB Trade Calculator.
// Entitlement and analysis are enforced by the Supabase Edge Function.

(function(){
  const STYLE_ID='bbb-plus-trade-lab-styles';
  const MOUNT_ID='bbbPlusTradeLab';
  let timer=null;
  let requestSeq=0;
  let lastSignature='';
  let lastResult=null;
  let accessDenied=false;

  const q=s=>document.querySelector(s);
  const esc=v=>typeof bbbEsc==='function'?bbbEsc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n=v=>{const x=Number(v);return Number.isFinite(x)?x:null};
  const fmt=v=>n(v)==null?'—':Math.round(n(v)).toLocaleString();
  const pct=v=>n(v)==null?'—':(n(v)>0?'+':'')+n(v).toFixed(1)+'%';
  const age=v=>n(v)==null?'—':n(v).toFixed(1);
  const rank=v=>n(v)==null?'—':'#'+Math.round(n(v));
  const signed=()=>!!(typeof bbbAccountSession!=='undefined'&&bbbAccountSession?.access_token);
  const session=()=>typeof bbbAccountSession!=='undefined'?bbbAccountSession:null;

  function ensureStyles(){
    if(q('#'+STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      .bbb-plus-trade-lab{margin-top:20px;border:1px solid #5a4b25;background:radial-gradient(circle at 92% 0,rgba(241,197,82,.10),transparent 32%),linear-gradient(155deg,#11140d,#07110d 48%,#060b08);border-radius:18px;padding:20px;overflow:hidden}
      .bbbpt-head{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:15px}
      .bbbpt-kicker{color:#f0cb66;font-size:8px;font-weight:1000;letter-spacing:.12em;text-transform:uppercase}
      .bbbpt-head h3{margin:6px 0 5px;font-size:24px;line-height:1;letter-spacing:-.035em}
      .bbbpt-head p{margin:0;max-width:680px;color:#82948a;font-size:10px;line-height:1.6}
      .bbbpt-badge{flex:none;display:inline-flex;align-items:center;gap:5px;border:1px solid #6f5d2c;background:#211c0c;color:#f0cf70;border-radius:999px;padding:6px 9px;font-size:7px;font-weight:1000;letter-spacing:.07em}
      .bbbpt-overview{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:10px}
      .bbbpt-metric{border:1px solid #233a30;background:#07110d;border-radius:11px;padding:12px}
      .bbbpt-metric span{display:block;color:#687b71;font-size:6.5px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;margin-bottom:5px}
      .bbbpt-metric strong{display:block;color:#edf4ef;font-size:18px;line-height:1.05}
      .bbbpt-metric small{display:block;color:#71847a;font-size:7.5px;line-height:1.4;margin-top:5px}
      .bbbpt-metric.gold strong{color:#f0ca61}.bbbpt-metric.green strong{color:#72e1a7}.bbbpt-metric.red strong{color:#ef9090}
      .bbbpt-sides{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:10px}
      .bbbpt-side{border:1px solid #223a2f;background:#07110d;border-radius:12px;padding:14px}
      .bbbpt-side-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}
      .bbbpt-side-head span{display:block;color:#687b71;font-size:7px;font-weight:950;letter-spacing:.09em;text-transform:uppercase}
      .bbbpt-side-head strong{display:block;color:#eaf1ed;font-size:15px;margin-top:3px}
      .bbbpt-package-edge{font-size:8px!important;padding:5px 7px;border-radius:999px;background:#111b16;border:1px solid #2b4538;color:#9eb0a7!important;white-space:nowrap}
      .bbbpt-package-edge.pos{background:#0a281b;border-color:#1c6846;color:#77e6aa!important}
      .bbbpt-package-edge.neg{background:#301616;border-color:#6b3434;color:#ef9696!important}
      .bbbpt-side-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-bottom:11px}
      .bbbpt-stat{border:1px solid #183027;background:#050c08;border-radius:8px;padding:9px}
      .bbbpt-stat span{display:block;color:#61756a;font-size:6px;font-weight:950;text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px}
      .bbbpt-stat strong{display:block;color:#dbe5df;font-size:11px}
      .bbbpt-assets{display:grid;gap:5px}
      .bbbpt-asset{display:grid;grid-template-columns:minmax(0,1.35fr) .65fr .65fr .65fr;gap:7px;align-items:center;padding:8px 9px;border:1px solid #14291f;background:#050b08;border-radius:8px}
      .bbbpt-asset-name strong{display:block;color:#edf4ef;font-size:9px}
      .bbbpt-asset-name span{display:block;color:#667a6f;font-size:7px;margin-top:2px}
      .bbbpt-asset-col span{display:block;color:#607268;font-size:5.8px;text-transform:uppercase;font-weight:950;letter-spacing:.06em}
      .bbbpt-asset-col strong{display:block;color:#cbd7d0;font-size:9px;margin-top:2px}
      .bbbpt-asset-col.edge strong.pos{color:#73e3a7}.bbbpt-asset-col.edge strong.neg{color:#ee9292}
      .bbbpt-read{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(240px,.55fr);gap:9px}
      .bbbpt-read-main,.bbbpt-read-side{border:1px solid #223a2f;background:#07110d;border-radius:12px;padding:14px}
      .bbbpt-read-main h4,.bbbpt-read-side h4{margin:0 0 10px;font-size:12px;color:#edf3ef}
      .bbbpt-insights{display:grid;gap:7px}
      .bbbpt-insight{position:relative;padding-left:16px;color:#9badA3;font-size:9px;line-height:1.55}
      .bbbpt-insight:before{content:"";position:absolute;left:0;top:6px;width:6px;height:6px;border-radius:50%;background:#d5ad45;box-shadow:0 0 0 3px rgba(213,173,69,.08)}
      .bbbpt-read-side-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
      .bbbpt-read-side-grid>div{border:1px solid #172d24;background:#050c08;border-radius:8px;padding:9px}
      .bbbpt-read-side-grid span{display:block;color:#62766b;font-size:6px;font-weight:950;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
      .bbbpt-read-side-grid strong{display:block;color:#e0e9e4;font-size:10px}
      .bbbpt-lock{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;align-items:center}
      .bbbpt-lock h3{margin:5px 0 6px;font-size:22px}.bbbpt-lock p{margin:0;color:#84958c;font-size:10px;line-height:1.6;max-width:720px}
      .bbbpt-lock-features{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}.bbbpt-lock-features span{padding:6px 8px;border:1px solid #2a4036;background:#07110d;border-radius:999px;color:#9eb1a7;font-size:7px;font-weight:900}
      .bbbpt-lock-action{display:inline-flex;padding:9px 12px;border:1px solid #6b592a;background:#1c180b;color:#efd06f;border-radius:9px;font-size:8px;font-weight:950;text-decoration:none;white-space:nowrap}
      .bbbpt-loading{min-height:110px;display:grid;place-items:center;color:#819389;font-size:9px;border:1px dashed #2c4238;border-radius:11px}
      .bbbpt-empty{padding:18px;border:1px dashed #2b4036;border-radius:11px;background:#07100c;color:#82948a;font-size:9px;line-height:1.55}
      @media(max-width:980px){.bbbpt-overview{grid-template-columns:1fr 1fr}.bbbpt-sides{grid-template-columns:1fr}.bbbpt-read{grid-template-columns:1fr}}
      @media(max-width:700px){.bbb-plus-trade-lab{padding:14px}.bbbpt-head{flex-direction:column}.bbbpt-overview{grid-template-columns:1fr 1fr}.bbbpt-side-grid{grid-template-columns:1fr 1fr}.bbbpt-asset{grid-template-columns:minmax(0,1.25fr) .75fr .75fr}.bbbpt-asset-col.market{display:none}.bbbpt-lock{grid-template-columns:1fr}.bbbpt-lock-action{justify-self:start}}
    `;
    document.head.appendChild(s);
  }

  function ensureMount(){
    let mount=q('#'+MOUNT_ID);
    if(mount)return mount;
    const grid=q('#tradeView .trade-grid');
    if(!grid)return null;
    mount=document.createElement('section');
    mount.id=MOUNT_ID;
    mount.className='bbb-plus-trade-lab';
    grid.insertAdjacentElement('afterend',mount);
    return mount;
  }

  function tradePayload(){
    const convert=x=>typeof x==='number'?{kind:'player',rank:x}:{kind:'pick',id:String(x)};
    let a=[],b=[];
    try{
      a=(typeof tradeA!=='undefined'?tradeA:[]).map(convert);
      b=(typeof tradeB!=='undefined'?tradeB:[]).map(convert);
    }catch{}
    return {side_a:a,side_b:b};
  }

  function hasBoth(payload){return payload.side_a.length>0&&payload.side_b.length>0}

  function lockHtml(){
    const sign=signed();
    return '<div class="bbbpt-lock"><div><div class="bbbpt-kicker">BBB+ TRADE LAB</div><h3>Go beyond equal value.</h3><p>Trade Lab adds BBB-vs-market package analysis, concentration, age/profile context, asset-by-asset gaps and a deeper explanation of what is actually driving the deal.</p><div class="bbbpt-lock-features"><span>BBB VS MARKET</span><span>PACKAGE CONCENTRATION</span><span>AGE PROFILE</span><span>ASSET GAP BREAKDOWN</span><span>TRADE READ</span></div></div>'+
      (sign?'<a class="bbbpt-lock-action" href="#plus">BBB+ LAUNCHING SOON</a>':'<a class="bbbpt-lock-action" href="#account">SIGN IN TO MY BBB</a>')+
      '</div>';
  }

  function emptyHtml(){
    return '<div class="bbbpt-head"><div><div class="bbbpt-kicker">BBB+ TRADE LAB</div><h3>Advanced package analysis.</h3><p>Build both sides of the trade above. Once each team has an asset, Trade Lab will break down the deal beyond the free fairness score.</p></div><span class="bbbpt-badge">BBB+ PREMIUM</span></div><div class="bbbpt-empty">Add at least one player or pick to <strong>Team A</strong> and <strong>Team B</strong> to run the premium analysis.</div>';
  }

  function loadingHtml(){
    return '<div class="bbbpt-head"><div><div class="bbbpt-kicker">BBB+ TRADE LAB</div><h3>Analyzing the package.</h3><p>Comparing BBB value, consensus value, package construction and the strongest drivers in the deal.</p></div><span class="bbbpt-badge">BBB+ PREMIUM</span></div><div class="bbbpt-loading">RUNNING PREMIUM TRADE ANALYSIS…</div>';
  }

  function favoredLabel(v){
    return v==='A'?'TEAM A':v==='B'?'TEAM B':'EVEN';
  }
  function fairness(v){
    return n(v)==null?'—':(n(v)*100).toFixed(1)+'%';
  }
  function packageClass(v){
    const x=n(v);return x>1?'pos':x<-1?'neg':'';
  }
  function positions(obj){
    const entries=Object.entries(obj||{}).filter(([,v])=>Number(v)>0);
    return entries.length?entries.map(([k,v])=>k+' '+v).join(' · '):'—';
  }

  function assetRows(assets){
    if(!assets?.length)return '<div class="bbbpt-empty">No assets.</div>';
    return assets.map(a=>{
      const edge=n(a.bbb_vs_market_value_pct),cls=edge>1?'pos':edge<-1?'neg':'';
      const meta=a.kind==='pick'?(esc(a.year||'')+' · '+esc(a.range||'Draft pick')):(esc(a.pos||'')+(a.team?' · '+esc(a.team):''));
      const bbbRank=a.kind==='pick'?'PICK':rank(a.bbb_rank);
      const marketRank=a.kind==='pick'?'—':rank(a.market_rank);
      return '<div class="bbbpt-asset">'+
        '<div class="bbbpt-asset-name"><strong>'+esc(a.name)+'</strong><span>'+meta+'</span></div>'+
        '<div class="bbbpt-asset-col"><span>BBB</span><strong>'+bbbRank+' · '+fmt(a.bbb_value)+'</strong></div>'+
        '<div class="bbbpt-asset-col market"><span>Market</span><strong>'+marketRank+' · '+fmt(a.market_value)+'</strong></div>'+
        '<div class="bbbpt-asset-col edge"><span>BBB Edge</span><strong class="'+cls+'">'+pct(edge)+'</strong></div>'+
      '</div>';
    }).join('');
  }

  function sideHtml(label,side){
    const edge=n(side.bbb_vs_market_pct),cls=packageClass(edge);
    return '<article class="bbbpt-side">'+
      '<div class="bbbpt-side-head"><div><span>'+label+' RECEIVES</span><strong>'+fmt(side.adjusted_bbb)+' BBB adjusted</strong></div><strong class="bbbpt-package-edge '+cls+'">'+pct(edge)+' vs market</strong></div>'+
      '<div class="bbbpt-side-grid">'+
        '<div class="bbbpt-stat"><span>Market Adjusted</span><strong>'+fmt(side.adjusted_market)+'</strong></div>'+
        '<div class="bbbpt-stat"><span>Avg Player Age</span><strong>'+age(side.avg_age)+'</strong></div>'+
        '<div class="bbbpt-stat"><span>Top Asset Share</span><strong>'+pct(side.concentration_pct)+'</strong></div>'+
        '<div class="bbbpt-stat"><span>Top-24 Pieces</span><strong>'+esc(side.top24_count||0)+'</strong></div>'+
        '<div class="bbbpt-stat"><span>Assets</span><strong>'+esc(side.asset_count||0)+'</strong></div>'+
        '<div class="bbbpt-stat"><span>Picks</span><strong>'+esc(side.pick_count||0)+'</strong></div>'+
        '<div class="bbbpt-stat"><span>Positions</span><strong>'+esc(positions(side.positions))+'</strong></div>'+
        '<div class="bbbpt-stat"><span>BBB Top Asset</span><strong>'+esc(side.top_asset?.name||'—')+'</strong></div>'+
      '</div>'+
      '<div class="bbbpt-assets">'+assetRows(side.assets)+'</div>'+
    '</article>';
  }

  function dataHtml(data){
    const a=data.side_a||{},b=data.side_b||{},cmp=data.comparison||{},bbb=cmp.bbb||{},market=cmp.market||{};
    const top=[a.top_asset?{side:'A',...a.top_asset}:null,b.top_asset?{side:'B',...b.top_asset}:null].filter(Boolean).sort((x,y)=>(y.bbb_value||0)-(x.bbb_value||0))[0];
    const badge=data?.access?.source==='admin'?'OWNER PREVIEW':'BBB+ ACTIVE';
    const disagreement=cmp.disagreement?'YES':'NO';
    const disagreeClass=cmp.disagreement?'gold':'';
    return '<div class="bbbpt-head"><div><div class="bbbpt-kicker">BBB+ TRADE LAB</div><h3>Advanced package analysis.</h3><p>The free calculator tells you how close the BBB values are. Trade Lab explains package construction, consensus disagreement, concentration and the individual assets driving the result.</p></div><span class="bbbpt-badge">'+badge+'</span></div>'+
      '<div class="bbbpt-overview">'+
        '<div class="bbbpt-metric green"><span>BBB View</span><strong>'+favoredLabel(bbb.favored)+'</strong><small>'+fairness(bbb.fairness)+' fairness</small></div>'+
        '<div class="bbbpt-metric gold"><span>Consensus View</span><strong>'+favoredLabel(market.favored)+'</strong><small>'+fairness(market.fairness)+' fairness</small></div>'+
        '<div class="bbbpt-metric '+disagreeClass+'"><span>Market Disagreement</span><strong>'+disagreement+'</strong><small>'+(cmp.disagreement?'BBB and consensus read the deal differently':'Same overall lean')+'</small></div>'+
        '<div class="bbbpt-metric"><span>Strongest Asset</span><strong style="font-size:13px">'+esc(top?.name||'—')+'</strong><small>'+(top?('Team '+top.side+' · '+(top.kind==='player'?rank(top.bbb_rank):'Draft pick')):'—')+'</small></div>'+
      '</div>'+
      '<div class="bbbpt-sides">'+sideHtml('TEAM A',a)+sideHtml('TEAM B',b)+'</div>'+
      '<div class="bbbpt-read">'+
        '<div class="bbbpt-read-main"><h4>Why this trade looks this way</h4><div class="bbbpt-insights">'+((data.read||[]).length?(data.read||[]).map(x=>'<div class="bbbpt-insight">'+esc(x)+'</div>').join(''):'<div class="bbbpt-insight">The package is too close to call beyond the value totals right now.</div>')+'</div></div>'+
        '<div class="bbbpt-read-side"><h4>Package snapshot</h4><div class="bbbpt-read-side-grid">'+
          '<div><span>BBB Edge</span><strong>'+pct(bbb.edge_pct)+'</strong></div>'+
          '<div><span>Market Edge</span><strong>'+pct(market.edge_pct)+'</strong></div>'+
          '<div><span>A Concentration</span><strong>'+pct(a.concentration_pct)+'</strong></div>'+
          '<div><span>B Concentration</span><strong>'+pct(b.concentration_pct)+'</strong></div>'+
        '</div></div>'+
      '</div>';
  }

  function render(kind,data){
    const mount=ensureMount();if(!mount)return;
    if(kind==='locked'){mount.innerHTML=lockHtml();return}
    if(kind==='empty'){mount.innerHTML=emptyHtml();return}
    if(kind==='loading'){mount.innerHTML=loadingHtml();return}
    if(kind==='data'){mount.innerHTML=dataHtml(data);return}
    mount.innerHTML='<div class="bbbpt-empty">Trade Lab is temporarily unavailable. The free BBB trade calculator above is still working.</div>';
  }

  async function analyze(){
    ensureStyles();
    const payload=tradePayload();
    if(!hasBoth(payload)){
      lastSignature='';
      lastResult=null;
      render(accessDenied?'locked':'empty');
      return;
    }

    if(!signed()){render('locked');return}
    if(accessDenied){render('locked');return}

    const sig=JSON.stringify(payload);
    if(sig===lastSignature&&lastResult){render('data',lastResult);return}
    lastSignature=sig;
    const seq=++requestSeq;
    render('loading');

    try{
      const s=session();
      const r=await fetch(BBB_SUPABASE_URL+'/functions/v1/bbb-plus-trade-lab',{
        method:'POST',
        headers:{apikey:BBB_SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      const data=await r.json().catch(()=>({}));
      if(seq!==requestSeq)return;
      if(r.status===401||r.status===403){
        accessDenied=true;
        lastResult=null;
        render('locked');
        return;
      }
      if(!r.ok)throw new Error(data.error||'Trade Lab unavailable');
      lastResult=data;
      render('data',data);
    }catch(err){
      if(seq!==requestSeq)return;
      console.warn('BBB+ Trade Lab',err);
      lastResult=null;
      render('error');
    }
  }

  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(analyze,140);
  }

  function wrapTradeRender(){
    if(typeof tradeRender!=='function'||tradeRender.__bbbPlusTradeLab)return;
    const base=tradeRender;
    const wrapped=function(){
      const result=base.apply(this,arguments);
      schedule();
      return result;
    };
    wrapped.__bbbPlusTradeLab=true;
    tradeRender=wrapped;
  }

  ensureStyles();
  ensureMount();
  wrapTradeRender();
  schedule();

  document.addEventListener('click',e=>{
    if(e.target.closest('#tradeView'))setTimeout(schedule,0);
  });
  window.addEventListener('hashchange',()=>{if(location.hash==='#trade')setTimeout(schedule,30)});
})();