// BBB+ Command Center V1
// A member-only home for the premium tools. Uses real BBB data and watched players;
// no public checkout behavior is changed here.

(function(){
  const STYLE_ID='bbb-plus-command-center-styles';
  const STORAGE='bbb_watchlist_v1';
  let dashboard=null;
  let loading=false;
  let lastKeySig='';
  let started=false;

  const q=s=>document.querySelector(s);
  const esc=v=>typeof bbbEsc==='function'?bbbEsc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
  const signed=()=>{try{return !!bbbAccountSession?.access_token}catch{return false}};
  const session=()=>{try{return bbbAccountSession||null}catch{return null}};
  const rank=v=>num(v)==null?'—':'#'+Math.round(num(v));
  const gap=v=>{const n=num(v);return n==null?'—':(n>0?'+':'')+Math.round(n)};
  const date=v=>{
    if(!v)return '';
    const d=new Date(String(v).slice(0,10)+'T12:00:00');
    return Number.isNaN(d.getTime())?'':d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
  };
  const watchKeys=()=>{
    try{
      const raw=JSON.parse(localStorage.getItem(STORAGE)||'[]');
      return [...new Set((Array.isArray(raw)?raw:[]).map(String).filter(Boolean))].slice(0,12);
    }catch{return []}
  };

  function ensureStyles(){
    if(q('#'+STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      #plusView.bbbcc-active{background:#040705!important;min-height:78vh}
      #plusView .bbbcc{padding:0 0 84px;color:#edf3ef}
      #plusView.bbbcc-active .shell{width:min(1500px,calc(100% - 48px));max-width:none}
      #plusView .bbbcc-hero{position:relative;overflow:hidden;border-bottom:1px solid #183429;background:#050a07;padding:54px 0 30px}
      #plusView .bbbcc-hero:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(80,223,153,.055) 1px,transparent 1px),linear-gradient(rgba(80,223,153,.04) 1px,transparent 1px);background-size:42px 42px;mask-image:linear-gradient(to bottom,rgba(0,0,0,.8),transparent 92%)}
      #plusView .bbbcc-hero-inner{position:relative}
      #plusView .bbbcc-topline{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:28px}
      #plusView .bbbcc-kicker{display:flex;align-items:center;gap:9px;color:#e7c45e;font-size:8px;font-weight:1000;letter-spacing:.14em;text-transform:uppercase}
      #plusView .bbbcc-kicker:before{content:"";width:24px;height:1px;background:#cda944}
      #plusView .bbbcc-member{display:flex;align-items:center;gap:8px;color:#9fafA6;font-size:10px;font-weight:850}
      #plusView .bbbcc-member strong{color:#efd06d}
      #plusView .bbbcc-hero-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(520px,.85fr);gap:58px;align-items:end}
      #plusView .bbbcc-title{margin:0;font-size:clamp(44px,5.4vw,72px);line-height:.9;letter-spacing:-.052em;text-transform:uppercase}
      #plusView .bbbcc-title span{color:#69dfa3}
      #plusView .bbbcc-sub{max-width:720px;margin:16px 0 0;color:#93a49a;font-size:14px;line-height:1.65}
      #plusView .bbbcc-pulse{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-top:1px solid #1b3a2d;border-bottom:1px solid #1b3a2d;background:#06100b}
      #plusView .bbbcc-pulse>div{padding:13px 14px;border-right:1px solid #173025;min-width:0}
      #plusView .bbbcc-pulse>div:last-child{border-right:0}
      #plusView .bbbcc-pulse span{display:block;color:#6f8278;font-size:8px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px}
      #plusView .bbbcc-pulse strong{display:block;color:#e7eee9;font-size:16px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #plusView .bbbcc-pulse .green{color:#69dfa3}
      #plusView .bbbcc-pulse .gold{color:#e8c75f}
      #plusView .bbbcc-nav{display:flex;align-items:center;gap:7px;margin-top:22px;flex-wrap:wrap}
      #plusView .bbbcc-action{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:1px solid #29473a;border-radius:8px;background:#08120e;color:#b7c5bd;text-decoration:none;font-size:9px;font-weight:950;letter-spacing:.04em}
      #plusView .bbbcc-action:hover{border-color:#50cf8c;color:#fff}
      #plusView .bbbcc-action.primary{border-color:#5f512b;background:#18150b;color:#efcf6a}
      #plusView .bbbcc-main{padding-top:30px}
      #plusView .bbbcc-section-head{display:flex;align-items:end;justify-content:space-between;gap:20px;margin:0 0 13px}
      #plusView .bbbcc-section-head h2{margin:0;color:#eff5f1;font-size:27px;letter-spacing:-.025em}
      #plusView .bbbcc-section-head p{margin:6px 0 0;color:#7f9188;font-size:11px;line-height:1.5}
      #plusView .bbbcc-section-meta{color:#6d8076;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap}
      #plusView .bbbcc-player-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
      #plusView .bbbcc-player{position:relative;min-width:0;border:1px solid #1e4031;border-radius:14px;background:#07100c;padding:18px;overflow:hidden;transition:border-color .14s ease,background-color .14s ease}
      #plusView .bbbcc-player:hover{border-color:#32644d;background:#08140f}
      #plusView .bbbcc-player-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:11px}
      #plusView .bbbcc-player-name{min-width:0}
      #plusView .bbbcc-player-name strong{display:block;color:#f2f6f3;font-size:19px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #plusView .bbbcc-player-name span{display:block;color:#7b8e84;font-size:9px;margin-top:5px;text-transform:uppercase;letter-spacing:.04em}
      #plusView .bbbcc-health{flex:none;border:1px solid #1f6a47;background:#08291b;color:#78e1a8;border-radius:999px;padding:5px 8px;font-size:8px;font-weight:950}
      #plusView .bbbcc-health.watch{border-color:#715d2b;background:#211a0b;color:#e8ca6b}
      #plusView .bbbcc-player-body{display:grid;grid-template-columns:minmax(0,.82fr) minmax(240px,1.18fr);gap:14px;align-items:stretch}
      #plusView .bbbcc-ranks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid #173025;border-radius:9px;background:#050b08;overflow:hidden}
      #plusView .bbbcc-rank{padding:10px;border-right:1px solid #142b21}
      #plusView .bbbcc-rank:last-child{border-right:0}
      #plusView .bbbcc-rank span{display:block;color:#6f8278;font-size:8px;font-weight:950;letter-spacing:.06em;text-transform:uppercase;margin-bottom:5px}
      #plusView .bbbcc-rank strong{display:block;color:#dfe8e2;font-size:18px}
      #plusView .bbbcc-rank:first-child strong{color:#68dda1}
      #plusView .bbbcc-rank.gap-pos strong{color:#68dda1}
      #plusView .bbbcc-rank.gap-neg strong{color:#ee8c8c}
      #plusView .bbbcc-spark{border:1px solid #173025;border-radius:9px;background:#050b08;padding:9px 10px 7px;min-width:0}
      #plusView .bbbcc-spark-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:3px}
      #plusView .bbbcc-spark-top span{color:#6f8278;font-size:8px;font-weight:950;letter-spacing:.06em;text-transform:uppercase}
      #plusView .bbbcc-spark-top strong{font-size:10px}
      #plusView .bbbcc-spark-top strong.up{color:#6fe0a5}
      #plusView .bbbcc-spark-top strong.down{color:#ee8e8e}
      #plusView .bbbcc-spark-top strong.flat{color:#8a9b92}
      #plusView .bbbcc-spark svg{display:block;width:100%;height:76px;overflow:visible}
      #plusView .bbbcc-spark-line{fill:none;stroke:#65dca0;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
      #plusView .bbbcc-spark-line.down{stroke:#e77f7f}
      #plusView .bbbcc-spark-line.flat{stroke:#d5b759}
      #plusView .bbbcc-spark-grid{stroke:#142b21;stroke-width:1}
      #plusView .bbbcc-update{margin-top:10px;padding-top:10px;border-top:1px solid #153026}
      #plusView .bbbcc-update-row{display:flex;gap:10px;align-items:flex-start}
      #plusView .bbbcc-update time{flex:none;color:#64d99d;font-size:8.5px;font-weight:950;text-transform:uppercase;letter-spacing:.05em;padding-top:1px}
      #plusView .bbbcc-update p{margin:0;color:#aebdb5;font-size:11px;line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      #plusView .bbbcc-player-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px}
      #plusView .bbbcc-market-view{display:inline-flex;border-radius:999px;border:1px solid #29463a;background:#09140f;color:#a0b0a8;padding:5px 8px;font-size:8px;font-weight:950}
      #plusView .bbbcc-market-view.buy{border-color:#1e6948;background:#08291b;color:#72e0a6}
      #plusView .bbbcc-market-view.fade{border-color:#6e3838;background:#2e1515;color:#ef9292}
      #plusView .bbbcc-open{color:#c1ccc6;font-size:9px;font-weight:950;text-decoration:none}
      #plusView .bbbcc-open:hover{color:#fff}
      #plusView .bbbcc-lower{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(360px,.55fr);gap:12px;margin-top:28px}
      #plusView .bbbcc-panel{border:1px solid #1d3d30;border-radius:13px;background:#07100c;padding:14px}
      #plusView .bbbcc-panel-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:9px}
      #plusView .bbbcc-panel-head h3{margin:0;color:#eef4f0;font-size:17px}
      #plusView .bbbcc-panel-head span{color:#6f8278;font-size:8px;font-weight:950;letter-spacing:.07em;text-transform:uppercase}
      #plusView .bbbcc-edge-list{display:grid}
      #plusView .bbbcc-edge{display:grid;grid-template-columns:minmax(0,1fr) 70px 70px 70px;gap:8px;align-items:center;padding:9px 2px;border-bottom:1px solid #132a20}
      #plusView .bbbcc-edge:last-child{border-bottom:0}
      #plusView .bbbcc-edge-player strong{display:block;color:#e8efeb;font-size:12px}
      #plusView .bbbcc-edge-player span{display:block;color:#71857a;font-size:8px;margin-top:3px}
      #plusView .bbbcc-edge-col{text-align:right}
      #plusView .bbbcc-edge-col span{display:block;color:#6a7d73;font-size:7px;font-weight:950;text-transform:uppercase;margin-bottom:4px}
      #plusView .bbbcc-edge-col strong{display:block;color:#d6e0da;font-size:12px}
      #plusView .bbbcc-edge-col.edge strong{color:#69dfa3}
      #plusView .bbbcc-tools{display:grid;gap:6px}
      #plusView .bbbcc-membership{margin-top:8px;padding:12px;border:1px solid #5d4e28;border-radius:10px;background:#141109}
      #plusView .bbbcc-membership-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:8px}
      #plusView .bbbcc-membership-top span{display:block;color:#d9ba5b;font-size:6px;font-weight:1000;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px}
      #plusView .bbbcc-membership-top strong{display:block;color:#f3e6b1;font-size:10px}
      #plusView .bbbcc-membership p{margin:0;color:#9f9165;font-size:7px;line-height:1.5}
      #plusView .bbbcc-membership .bbbcc-action{margin-top:10px;width:100%;border-color:#6c592c;background:#211b0c;color:#f0cf6e}
      #plusView .bbbcc-membership.cancel{border-color:#755e28;background:#171309}
      #plusView .bbbcc-membership.cancel .bbbcc-membership-top strong{color:#f2d27b}
      #plusView .bbbcc-tool{display:block;padding:11px;border:1px solid #173025;border-radius:9px;background:#050c08;text-decoration:none}
      #plusView .bbbcc-tool:hover{border-color:#345e4c}
      #plusView .bbbcc-tool span{display:block;color:#e7c45e;font-size:8px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px}
      #plusView .bbbcc-tool strong{display:block;color:#eaf1ed;font-size:13px}
      #plusView .bbbcc-tool small{display:block;color:#7b8d84;font-size:9.5px;line-height:1.5;margin-top:5px}
      #plusView .bbbcc-empty{padding:26px;border:1px dashed #2a4437;border-radius:12px;background:#06100b;text-align:center}
      #plusView .bbbcc-empty strong{display:block;color:#edf3ef;font-size:15px;margin-bottom:6px}
      #plusView .bbbcc-empty p{max-width:560px;margin:0 auto;color:#7f9188;font-size:9px;line-height:1.6}
      #plusView .bbbcc-empty a{display:inline-flex;margin-top:12px}
      #plusView .bbbcc-loading{min-height:420px;display:grid;place-items:center;background:#040705;color:#7d8f86;font-size:9px;font-weight:900;letter-spacing:.07em;text-transform:uppercase}
      @media(max-width:1200px){
        #plusView .bbbcc-hero-grid{grid-template-columns:1fr;gap:24px}
        #plusView .bbbcc-lower{grid-template-columns:1fr}
      }
      @media(max-width:900px){
        #plusView .bbbcc-player-grid{grid-template-columns:1fr}
        #plusView .bbbcc-pulse{grid-template-columns:1fr 1fr}
        #plusView .bbbcc-pulse>div:nth-child(2){border-right:0}
        #plusView .bbbcc-pulse>div:nth-child(-n+2){border-bottom:1px solid #173025}
      }
      @media(max-width:620px){
        #plusView.bbbcc-active .shell{width:min(100% - 24px,1560px)}
        #plusView .bbbcc-hero{padding:38px 0 24px}
        #plusView .bbbcc-title{font-size:45px}
        #plusView .bbbcc-topline{align-items:flex-start;flex-direction:column}
        #plusView .bbbcc-player-body{grid-template-columns:1fr}
        #plusView .bbbcc-edge{grid-template-columns:minmax(0,1fr) 58px 58px}
        #plusView .bbbcc-edge-col.market{display:none}
      }
    `;
    document.head.appendChild(s);
  }

  function view(){
    let v=q('#plusView');
    if(v)return v;
    return null;
  }

  function healthClass(status){
    const s=String(status||'').trim();
    return s&&!/healthy|active|cleared/i.test(s)?'watch':'';
  }

  function marketClass(view,g){
    const v=String(view||'').toUpperCase();
    if(v.includes('BUY')||(num(g)!=null&&num(g)>=20))return 'buy';
    if(v.includes('FADE')||(num(g)!=null&&num(g)<=-20))return 'fade';
    return '';
  }

  function marketLabel(view,g){
    const cls=marketClass(view,g);
    return cls==='buy'?'BBB BUY':cls==='fade'?'BBB FADE':'MARKET';
  }

  function sparkline(history,change){
    const list=(history||[]).filter(x=>num(x.value)!=null);
    const cls=num(change)>0?'up':num(change)<0?'down':'flat';
    const label=num(change)==null?'BUILDING':(num(change)>0?'+':'')+num(change).toFixed(1)+'%';
    if(list.length<2){
      return '<div class="bbbcc-spark"><div class="bbbcc-spark-top"><span>30D BBB VALUE</span><strong class="flat">BUILDING</strong></div><svg viewBox="0 0 180 50"><line x1="4" y1="28" x2="176" y2="28" class="bbbcc-spark-grid"/></svg></div>';
    }
    const vals=list.map(x=>num(x.value));
    let min=Math.min(...vals),max=Math.max(...vals);
    if(min===max){min-=1;max+=1}
    const w=180,h=50,p=4;
    const x=i=>p+(i/(list.length-1))*(w-p*2);
    const y=v=>p+((max-v)/(max-min))*(h-p*2);
    const pts=list.map((r,i)=>x(i).toFixed(1)+','+y(num(r.value)).toFixed(1)).join(' ');
    return '<div class="bbbcc-spark"><div class="bbbcc-spark-top"><span>30D BBB VALUE</span><strong class="'+cls+'">'+esc(label)+'</strong></div><svg viewBox="0 0 '+w+' '+h+'" aria-label="30 day BBB value trend"><line x1="4" y1="43" x2="176" y2="43" class="bbbcc-spark-grid"/><polyline points="'+pts+'" class="bbbcc-spark-line '+cls+'"/></svg></div>';
  }

  function playerCard(p){
    const hc=healthClass(p.injury_status);
    const status=String(p.injury_status||'Healthy').trim()||'Healthy';
    const g=num(p.gap),gc=g>0?'gap-pos':g<0?'gap-neg':'';
    const mc=marketClass(p.market_view,p.gap);
    return '<article class="bbbcc-player">'+
      '<div class="bbbcc-player-head"><div class="bbbcc-player-name"><strong>'+esc(p.name)+'</strong><span>'+esc(p.pos||'')+(p.team?' · '+esc(p.team):'')+(num(p.position_rank)!=null?' · '+esc(p.pos)+Math.round(num(p.position_rank)):'')+'</span></div><span class="bbbcc-health '+hc+'">'+esc(status)+'</span></div>'+
      '<div class="bbbcc-player-body"><div class="bbbcc-ranks">'+
        '<div class="bbbcc-rank"><span>BBB</span><strong>'+rank(p.rank)+'</strong></div>'+
        '<div class="bbbcc-rank"><span>Market</span><strong>'+rank(p.market_rank)+'</strong></div>'+
        '<div class="bbbcc-rank '+gc+'"><span>Gap</span><strong>'+gap(p.gap)+'</strong></div>'+
      '</div>'+sparkline(p.history,p.value_change_30d)+'</div>'+
      '<div class="bbbcc-update"><div class="bbbcc-update-row"><time>'+esc(date(p.update_date)||'Latest')+'</time><p>'+esc(p.latest_update||'No new BBB note yet. This card will update as the player board changes.')+'</p></div></div>'+
      '<div class="bbbcc-player-foot"><span class="bbbcc-market-view '+mc+'">'+marketLabel(p.market_view,p.gap)+'</span><a class="bbbcc-open" href="/player/'+encodeURIComponent(p.player_key)+'">OPEN PLAYER →</a></div>'+
    '</article>';
  }

  function pulseHtml(){
    const s=dashboard?.summary||{};
    const edge=s.strongest_edge;
    return '<div class="bbbcc-pulse">'+
      '<div><span>Your Board</span><strong class="green">'+esc(s.player_count||0)+' players</strong></div>'+
      '<div><span>7D Movement</span><strong>'+esc(s.meaningful_movers||0)+' meaningful moves</strong></div>'+
      '<div><span>Health Watch</span><strong class="'+((s.health_attention||0)>0?'gold':'')+'">'+esc(s.health_attention||0)+' needing attention</strong></div>'+
      '<div><span>Strongest BBB Edge</span><strong class="green">'+(edge?esc(edge.name)+' '+gap(edge.gap):'—')+'</strong></div>'+
    '</div>';
  }

  function edgesHtml(){
    const rows=(dashboard?.market_edges||[]).slice(0,6);
    if(!rows.length)return '<div class="bbbcc-empty"><p>Market gap data is still building.</p></div>';
    return '<div class="bbbcc-edge-list">'+rows.map(p=>'<div class="bbbcc-edge">'+
      '<div class="bbbcc-edge-player"><strong>'+esc(p.name)+'</strong><span>'+esc(p.pos||'')+(p.team?' · '+esc(p.team):'')+'</span></div>'+
      '<div class="bbbcc-edge-col"><span>BBB</span><strong>'+rank(p.rank)+'</strong></div>'+
      '<div class="bbbcc-edge-col market"><span>Market</span><strong>'+rank(p.market_rank)+'</strong></div>'+
      '<div class="bbbcc-edge-col edge"><span>Gap</span><strong>'+gap(p.gap)+'</strong></div>'+
    '</div>').join('')+'</div>';
  }

  function membershipHtml(access){
    if(access?.source==='admin'){
      return '<div class="bbbcc-membership">'+
        '<div class="bbbcc-membership-top"><div><span>BBB+ Membership</span><strong>Member controls preview</strong></div><strong>★</strong></div>'+
        '<p>Paid members see this control here. It opens Stripe billing where they can update payment details, cancel, or resume a scheduled cancellation.</p>'+
        '<button type="button" class="bbbcc-action" data-bbbcc-billing-preview>MANAGE MEMBERSHIP</button>'+
      '</div>';
    }
    if(access?.source!=='membership'||!access?.membership)return '';
    const m=access.membership;
    const ending=!!m.cancel_at_period_end;
    const end=m.current_period_end?new Date(m.current_period_end):null;
    const endLabel=end&&!Number.isNaN(end.getTime())?end.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'the end of your billing period';
    const plan=String(m.plan_interval||'').toLowerCase()==='year'?'Yearly':'Monthly';
    return '<div class="bbbcc-membership '+(ending?'cancel':'')+'">'+
      '<div class="bbbcc-membership-top"><div><span>BBB+ Membership</span><strong>'+(ending?'Cancellation scheduled':plan+' plan active')+'</strong></div><strong>★</strong></div>'+
      '<p>'+(ending?'Your premium access stays active through '+esc(endLabel)+'. You can resume from billing settings before then.':plan+' billing is active. You can update your payment method or cancel anytime through secure billing settings.')+'</p>'+
      '<button type="button" class="bbbcc-action" data-bbbcc-billing>'+(ending?'MANAGE / RESUME MEMBERSHIP':'MANAGE / CANCEL MEMBERSHIP')+'</button>'+
    '</div>';
  }

  function toolsHtml(access){
    return '<div class="bbbcc-tools">'+
      '<a class="bbbcc-tool" href="#trade"><span>TRADE LAB</span><strong>Build the deal. Then go deeper.</strong><small>Package concentration, BBB vs market and premium trade reads.</small></a>'+
      '<a class="bbbcc-tool" href="#watchlist"><span>PLAYER ALERTS</span><strong>Manage the players you track.</strong><small>Rank, market, injury and BBB update controls live in My Players.</small></a>'+
      '<a class="bbbcc-tool" href="#rankings"><span>VALUE HISTORY+</span><strong>Open any player from the Top 500.</strong><small>Premium historical rank, market gap and exact value snapshots live on player profiles.</small></a>'+
    '</div>'+membershipHtml(access);
  }

  function contentHtml(){
    const p=dashboard?.players||[];
    const access=dashboard?.access||{};
    const badge=access.source==='admin'?'OWNER PREVIEW':(access.membership?.founding_member?'FOUNDING MEMBER':'BBB+ MEMBER');
    const watched=p.length;
    return '<div class="bbbcc">'+
      '<section class="bbbcc-hero"><div class="shell bbbcc-hero-inner">'+
        '<div class="bbbcc-topline"><div class="bbbcc-kicker">BBB+ COMMAND CENTER</div><div class="bbbcc-member"><strong>★ '+badge+'</strong><span>Premium data live</span></div></div>'+
        '<div class="bbbcc-hero-grid"><div><h1 class="bbbcc-title">THIS IS<br><span>YOUR BOARD.</span></h1><p class="bbbcc-sub">No filler. Your players, Bobby’s current values, the market gap, and the movement that actually matters — in one place.</p><div class="bbbcc-nav"><a class="bbbcc-action primary" href="#watchlist">MANAGE MY PLAYERS</a><a class="bbbcc-action" href="#trade">OPEN TRADE LAB</a><a class="bbbcc-action" href="#rankings">TOP 500</a>'+(access.source==='membership'?'<button type="button" class="bbbcc-action" data-bbbcc-billing>MANAGE MEMBERSHIP</button>':access.source==='admin'?'<button type="button" class="bbbcc-action" data-bbbcc-billing-preview>MANAGE MEMBERSHIP</button>':'')+'</div></div>'+
        pulseHtml()+
        '</div></div></section>'+
      '<div class="shell bbbcc-main">'+
        '<div class="bbbcc-section-head"><div><h2>Your players</h2><p>Live BBB rank, market position, current note and a 30-day value trace.</p></div><div class="bbbcc-section-meta">'+esc(watched)+' ON YOUR BOARD</div></div>'+
        (p.length?'<div class="bbbcc-player-grid">'+p.map(playerCard).join('')+'</div>':'<div class="bbbcc-empty"><strong>Your command center needs players.</strong><p>Star players anywhere on Bobby’s Big Board and they’ll appear here with premium value history and live movement context.</p><a class="bbbcc-action primary" href="#rankings">ADD PLAYERS FROM THE TOP 500</a></div>')+
        '<div class="bbbcc-lower">'+
          '<section class="bbbcc-panel"><div class="bbbcc-panel-head"><h3>Where BBB is ahead of the market</h3><span>Top live gaps</span></div>'+edgesHtml()+'</section>'+
          '<aside class="bbbcc-panel"><div class="bbbcc-panel-head"><h3>BBB+ tools</h3><span>Live now</span></div>'+toolsHtml(access)+'</aside>'+
        '</div>'+
      '</div>'+
    '</div>';
  }

  function renderLoading(){
    const v=view();if(!v)return;
    v.classList.add('bbbcc-active');
    v.innerHTML='<div class="bbbcc-loading">Opening your BBB+ Command Center…</div>';
  }

  function render(){
    const v=view();if(!v||!dashboard)return;
    v.classList.add('bbbcc-active');
    v.innerHTML=contentHtml();
    document.querySelectorAll('[data-bbbcc-billing]').forEach(btn=>btn.addEventListener('click',openBilling));
    document.querySelectorAll('[data-bbbcc-billing-preview]').forEach(btn=>btn.addEventListener('click',()=>alert('Owner preview: paid BBB+ members use this exact control to open Stripe billing, where they can cancel or resume their membership. Your owner account is not a paid Stripe subscription.')));
  }

  async function openBilling(){
    const s=session();if(!s?.access_token)return;
    const buttons=[...document.querySelectorAll('[data-bbbcc-billing]')];buttons.forEach(btn=>btn.disabled=true);
    try{
      const r=await fetch(BBB_SUPABASE_URL+'/functions/v1/bbb-plus-portal',{
        method:'POST',
        headers:{apikey:BBB_SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'}
      });
      const body=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(body.error||'Billing settings unavailable.');
      if(body.url)location.href=body.url;
    }catch(err){alert(err.message||'Billing settings unavailable.')}
    finally{buttons.forEach(btn=>btn.disabled=false)}
  }

  async function load(force=false){
    ensureStyles();
    if(!String(location.hash||'').startsWith('#plus'))return;
    if(!signed()){
      if(window.__bbbPlusMemberEntitled) setTimeout(()=>load(force),180);
      return;
    }
    const keys=watchKeys();
    const sig=keys.join('|');
    if(!force&&dashboard&&sig===lastKeySig){render();return}
    if(loading)return;
    loading=true;
    lastKeySig=sig;
    renderLoading();
    try{
      const s=session();
      const r=await fetch(BBB_SUPABASE_URL+'/functions/v1/bbb-plus-command-center',{
        method:'POST',
        headers:{apikey:BBB_SUPABASE_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},
        body:JSON.stringify({player_keys:keys})
      });
      if(r.status===401||r.status===403){
        dashboard=null;
        const v=view();if(v)v.classList.remove('bbbcc-active');
        return;
      }
      const body=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(body.error||'Command Center unavailable.');
      dashboard=body;
      render();
    }catch(err){
      console.warn('BBB+ Command Center',err);
      const v=view();
      if(v){
        v.classList.add('bbbcc-active');
        v.innerHTML='<div class="shell" style="padding:60px 0"><div class="bbbcc-empty"><strong>Command Center is temporarily unavailable.</strong><p>The rest of BBB+ is still available. Refresh in a moment or jump straight into Trade Lab.</p><a class="bbbcc-action primary" href="#trade">OPEN TRADE LAB</a></div></div>';
      }
    }finally{loading=false}
  }

  function maybeLoad(){
    if(!String(location.hash||'').startsWith('#plus'))return;
    setTimeout(()=>load(false),20);
  }

  window.bbbPlusCommandCenterOpen=(force=false)=>load(force);

  function init(){
    if(started)return;started=true;
    ensureStyles();
    if(window.__bbbPlusMemberEntitled&&String(location.hash||'').startsWith('#plus'))setTimeout(()=>load(true),0);
    window.addEventListener('bbb:plus-ready',maybeLoad);
    window.addEventListener('hashchange',maybeLoad);
    window.addEventListener('popstate',maybeLoad);
    window.addEventListener('storage',e=>{if(e.key===STORAGE&&String(location.hash||'').startsWith('#plus'))load(true)});
    [120,420,900].forEach(ms=>setTimeout(maybeLoad,ms));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();