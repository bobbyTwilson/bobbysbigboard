// BBB+ Value History V1
// Premium rank/consensus analytics. The backend enforces BBB+ entitlement;
// this client never receives premium history unless the signed-in account has access.

(function(){
  const STYLE_ID='bbb-plus-value-history-styles';
  const CARD_CLASS='bbb-plus-history';
  let renderToken=0;
  let observer=null;

  const q=s=>document.querySelector(s);
  const esc=v=>typeof bbbEsc==='function'?bbbEsc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
  const sess=()=>{try{return typeof bbbAccountSession!=='undefined'?bbbAccountSession:null}catch{return null}};
  const signed=()=>!!sess()?.access_token;
  const date=v=>{
    if(!v)return '—';
    const d=new Date(String(v).slice(0,10)+'T12:00:00');
    return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  };
  const signedNum=v=>{
    const n=num(v);
    if(n==null)return '—';
    return n>0?'+'+n:String(n);
  };
  const moveHtml=change=>{
    const n=num(change);
    if(n==null)return '<span class="bbbph-move neutral">BUILDING</span>';
    if(n>0)return '<span class="bbbph-move up">↑ '+esc(n)+'</span>';
    if(n<0)return '<span class="bbbph-move down">↓ '+esc(Math.abs(n))+'</span>';
    return '<span class="bbbph-move neutral">NO CHANGE</span>';
  };
  const rank=v=>num(v)==null?'—':'#'+Math.round(num(v));
  const money=v=>num(v)==null?'—':Math.round(num(v)).toLocaleString();

  function ensureStyles(){
    if(q('#'+STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      #profileView .${CARD_CLASS}{position:relative;overflow:hidden!important;border-color:#5e4d25!important;background:radial-gradient(circle at 86% 10%,rgba(240,199,94,.10),transparent 28%),linear-gradient(155deg,#11140d,#07110c 48%,#060b08)!important}
      #profileView .${CARD_CLASS}:before{content:"BBB+";position:absolute;right:16px;top:14px;color:#f1ce67;font-size:9px;font-weight:1000;letter-spacing:.1em;border:1px solid #6c5929;background:#211c0c;border-radius:999px;padding:5px 8px}
      #profileView .bbbph-head{display:flex;justify-content:space-between;gap:22px;align-items:flex-start;margin-bottom:16px;padding-right:56px}
      #profileView .bbbph-head h2{margin:5px 0 5px!important}
      #profileView .bbbph-head p{margin:0;color:#899b91;font-size:10px;line-height:1.6;max-width:690px}
      #profileView .bbbph-owner{display:inline-flex;margin-top:8px;border:1px solid #735f2d;background:#211c0c;color:#f0cf70;border-radius:999px;padding:4px 7px;font-size:7px;font-weight:950;letter-spacing:.07em}
      #profileView .bbbph-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px;margin-bottom:10px}
      #profileView .bbbph-kpi{min-width:0;border:1px solid #21382e;background:#07110d;border-radius:10px;padding:11px 12px}
      #profileView .bbbph-kpi>span{display:block;color:#687b71;font-size:6.5px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;margin-bottom:5px}
      #profileView .bbbph-kpi>strong{display:block;color:#eef4f0;font-size:19px;line-height:1}
      #profileView .bbbph-kpi>small{display:block;color:#71847a;font-size:7.5px;line-height:1.35;margin-top:5px}
      #profileView .bbbph-kpi.gold strong{color:#f0cd67}
      #profileView .bbbph-kpi.green strong{color:#70e0a5}
      #profileView .bbbph-kpi.red strong{color:#ec8b8b}

      #profileView .bbbph-report{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(250px,.6fr);gap:8px;margin-bottom:10px}
      #profileView .bbbph-report-main,#profileView .bbbph-report-side{border:1px solid #21382e;background:#07110d;border-radius:10px;padding:13px}
      #profileView .bbbph-report-label{display:block;color:#e6c45f;font-size:7px;font-weight:950;letter-spacing:.1em;text-transform:uppercase;margin-bottom:5px}
      #profileView .bbbph-report-main strong{display:block;color:#e8efeB;font-size:14px;line-height:1.4;margin-bottom:4px}
      #profileView .bbbph-report-main p{margin:0;color:#81958a;font-size:9px;line-height:1.55}
      #profileView .bbbph-report-side{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      #profileView .bbbph-report-side>div{min-width:0}
      #profileView .bbbph-report-side span{display:block;color:#687b71;font-size:6.5px;font-weight:950;text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px}
      #profileView .bbbph-report-side strong{display:block;color:#dce6e0;font-size:12px}

      #profileView .bbbph-chart-shell{border:1px solid #263b31;background:#050c08;border-radius:12px;padding:11px 11px 9px;margin-bottom:10px}
      #profileView .bbbph-chart-top{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:5px}
      #profileView .bbbph-legend{display:flex;gap:13px;align-items:center;color:#82958a;font-size:7px;font-weight:900;text-transform:uppercase;letter-spacing:.06em}
      #profileView .bbbph-legend span:before{content:"";display:inline-block;width:14px;height:3px;border-radius:999px;margin-right:5px;vertical-align:2px}
      #profileView .bbbph-legend .bbb:before{background:#58d89a}
      #profileView .bbbph-legend .market:before{background:#e3be54}
      #profileView .bbbph-ranges{display:flex;gap:4px;padding:3px;border:1px solid #263b31;background:#07110d;border-radius:8px}
      #profileView .bbbph-ranges button{border:0;background:transparent;color:#6f8277;border-radius:6px;padding:6px 8px;font-size:7px;font-weight:950;cursor:pointer}
      #profileView .bbbph-ranges button.on{background:#173323;color:#fff}
      #profileView .bbbph-chart{display:block;width:100%;height:auto;overflow:visible}
      #profileView .bbbph-grid{stroke:#183127;stroke-width:1}
      #profileView .bbbph-axis{fill:#65786e;font-size:9px;font-weight:850}
      #profileView .bbbph-bbb-line{fill:none;stroke:#58d89a;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}
      #profileView .bbbph-market-line{fill:none;stroke:#e3be54;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:7 5}
      #profileView .bbbph-point{cursor:pointer;outline:none}
      #profileView .bbbph-hit{fill:transparent;pointer-events:all}
      #profileView .bbbph-bbb-dot{fill:#08130e;stroke:#58d89a;stroke-width:3}
      #profileView .bbbph-market-dot{fill:#171308;stroke:#e3be54;stroke-width:2}
      #profileView .bbbph-point.selected .bbbph-bbb-dot,#profileView .bbbph-point:focus .bbbph-bbb-dot{fill:#58d89a;stroke:#e8fff3;stroke-width:4}
      #profileView .bbbph-point.selected .bbbph-market-dot,#profileView .bbbph-point:focus .bbbph-market-dot{fill:#e3be54}
      #profileView .bbbph-chart-dates{display:flex;justify-content:space-between;color:#61756a;font-size:8px;font-weight:850;padding:0 4px}
      #profileView .bbbph-snapshot{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-top:10px}
      #profileView .bbbph-snapshot>div{border:1px solid #1c3329;background:#07110d;border-radius:8px;padding:9px 10px}
      #profileView .bbbph-snapshot span{display:block;color:#667a6f;font-size:6.5px;font-weight:950;text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px}
      #profileView .bbbph-snapshot strong{display:block;color:#e6eee9;font-size:12px}
      #profileView .bbbph-snapshot .value strong{color:#71dfa7}

      #profileView .bbbph-bottom{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      #profileView .bbbph-moves{border:1px solid #21382e;background:#07110d;border-radius:10px;padding:12px}
      #profileView .bbbph-moves h3{margin:0 0 9px;color:#e3ebe6;font-size:11px}
      #profileView .bbbph-move-row{display:grid;grid-template-columns:80px 1fr auto;gap:9px;align-items:center;padding:7px 0;border-bottom:1px solid #13291f}
      #profileView .bbbph-move-row:last-child{border-bottom:0}
      #profileView .bbbph-move-row time{color:#667a6f;font-size:7.5px}
      #profileView .bbbph-move-row span{color:#9badA3;font-size:8.5px}
      #profileView .bbbph-move-row strong{font-size:9px}
      #profileView .bbbph-move-row strong.up{color:#70dfa5}
      #profileView .bbbph-move-row strong.down{color:#ed8a8a}
      #profileView .bbbph-empty{color:#708379;font-size:9px;line-height:1.5}

      #profileView .bbbph-move{display:inline-flex;border-radius:999px;padding:4px 6px;font-size:7px!important;font-weight:950!important;letter-spacing:.03em}
      #profileView .bbbph-move.up{background:#0a2b1d;color:#74e5a9;border:1px solid #176743}
      #profileView .bbbph-move.down{background:#351717;color:#f08b8b;border:1px solid #743535}
      #profileView .bbbph-move.neutral{background:#18201c;color:#aab8b0;border:1px solid #34443b}

      #profileView .bbbph-lock{border:1px solid #5c4c26;background:radial-gradient(circle at 90% 0,rgba(240,199,94,.12),transparent 32%),linear-gradient(145deg,#14140d,#08110d);border-radius:13px;padding:20px}
      #profileView .bbbph-lock-top{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}
      #profileView .bbbph-lock-top span:first-child{color:#efcb68;font-size:8px;font-weight:1000;letter-spacing:.11em}
      #profileView .bbbph-lock-top span:last-child{border:1px solid #6a572a;background:#211b0c;color:#f0cf70;border-radius:999px;padding:4px 7px;font-size:7px;font-weight:950}
      #profileView .bbbph-lock h2{margin:0 0 7px!important;font-size:24px!important}
      #profileView .bbbph-lock p{margin:0;color:#879a90;font-size:10px;line-height:1.6;max-width:680px}
      #profileView .bbbph-lock-features{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:14px}
      #profileView .bbbph-lock-features>div{border:1px solid #26382f;background:#07110d;border-radius:9px;padding:10px}
      #profileView .bbbph-lock-features span{display:block;color:#667a6f;font-size:6.5px;font-weight:950;text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px}
      #profileView .bbbph-lock-features strong{display:block;color:#dfe8e3;font-size:10px}
      #profileView .bbbph-lock-action{display:inline-flex;margin-top:13px;padding:8px 11px;border:1px solid #355744;border-radius:8px;color:#a8e0c2;background:#0a1811;font-size:8px;font-weight:950;text-decoration:none}
      #profileView .bbbph-lock-note{margin-top:9px!important;color:#65786e!important;font-size:8px!important}

      @media(max-width:950px){
        #profileView .bbbph-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}
        #profileView .bbbph-report{grid-template-columns:1fr}
      }
      @media(max-width:700px){
        #profileView .bbbph-head{display:block;padding-right:48px}
        #profileView .bbbph-kpis{grid-template-columns:1fr 1fr}
        #profileView .bbbph-chart-top{align-items:flex-start;flex-direction:column}
        #profileView .bbbph-snapshot{grid-template-columns:1fr 1fr}
        #profileView .bbbph-snapshot .value{grid-column:1/-1}
        #profileView .bbbph-bottom{grid-template-columns:1fr}
        #profileView .bbbph-lock-features{grid-template-columns:1fr 1fr}
      }
    `;
    document.head.appendChild(s);
  }

  function currentPlayerKey(pathSlug=''){
    const path=location.pathname.match(/^\/player\/([^/?#]+)/);
    if(path)return decodeURIComponent(path[1]);
    if(typeof bbbSnapshotCurrentPlayer==='function'){
      const p=bbbSnapshotCurrentPlayer(pathSlug);if(p)return String(p.playerKey||p.player_key||'');
    }
    const found=typeof profileFind==='function'?profileFind(pathSlug):null;
    return String(found?.playerKey||found?.player_key||'');
  }

  function targetPanel(){
    return q('#profileView .bbb-profile-tabs-v2 [data-bbb-panel="notes"]')
      || q('#profileMount .profile-grid');
  }

  function lockedHtml(reason){
    const isSigned=signed();
    const heading=isSigned?'Premium Value History is built and gated.':'Sign in to preview BBB+ access.';
    const copy=isSigned
      ? 'The premium history endpoint is live. Public checkout stays closed while we finish the rest of the BBB+ launch tools.'
      : 'BBB+ members get the deeper history layer while the regular rank-history graph stays free.';
    return '<section class="profile-card full '+CARD_CLASS+'"><div class="bbbph-lock">'+
      '<div class="bbbph-lock-top"><span>BBB+ VALUE HISTORY</span><span>PREMIUM</span></div>'+
      '<h2>'+heading+'</h2><p>'+copy+'</p>'+
      '<div class="bbbph-lock-features">'+
        '<div><span>History</span><strong>Full BBB + market timeline</strong></div>'+
        '<div><span>Movement</span><strong>7D / 30D / 90D context</strong></div>'+
        '<div><span>Divergence</span><strong>BBB vs consensus over time</strong></div>'+
        '<div><span>Snapshots</span><strong>Exact daily value drilldown</strong></div>'+
      '</div>'+
      (!isSigned?'<a class="bbbph-lock-action" href="/#account">SIGN IN TO MY BBB</a>':'')+
      '<p class="bbbph-lock-note">'+(reason==='error'?'Premium data is temporarily unavailable. The free ranking history below still works.':'Payments remain closed until the full launch bundle is ready.')+'</p>'+
    '</div></section>';
  }

  async function loadPremium(playerKey){
    const s=sess();
    if(!s?.access_token)return {kind:'locked'};
    try{
      const r=await fetch(BBB_SUPABASE_URL+'/functions/v1/bbb-plus-value-history?player_key='+encodeURIComponent(playerKey),{
        headers:{apikey:BBB_SUPABASE_KEY,Authorization:'Bearer '+s.access_token}
      });
      const data=await r.json().catch(()=>({}));
      if(r.status===401||r.status===403)return {kind:'locked',data};
      if(!r.ok)throw new Error(data.error||'Premium history unavailable');
      return {kind:'data',data};
    }catch(err){
      console.warn('BBB+ value history',err);
      return {kind:'error'};
    }
  }

  function reportCopy(data){
    const s=data?.summary||{},gap=num(s?.gap?.current),bbb7=num(s?.bbb?.change_7d?.change),market7=num(s?.market?.change_7d?.change);
    let title='BBB and consensus are being tracked together.';
    if(gap!=null){
      if(gap>0)title='BBB is '+Math.abs(gap)+' spot'+(Math.abs(gap)===1?'':'s')+' higher than consensus.';
      else if(gap<0)title='Consensus is '+Math.abs(gap)+' spot'+(Math.abs(gap)===1?'':'s')+' higher than BBB.';
      else title='BBB and consensus currently agree exactly.';
    }
    const bits=[];
    if(bbb7!=null)bits.push('BBB '+(bbb7>0?'climbed ':bbb7<0?'fell ':'held steady over ')+(bbb7===0?'the last 7 days':Math.abs(bbb7)+' spot'+(Math.abs(bbb7)===1?'':'s')+' in 7 days'));
    if(market7!=null)bits.push('consensus '+(market7>0?'climbed ':market7<0?'fell ':'held steady over ')+(market7===0?'the same window':Math.abs(market7)+' spot'+(Math.abs(market7)===1?'':'s')+' in 7 days'));
    return {title,body:bits.length?bits.join(' while ')+'.':'More movement context will populate as tracking history grows.'};
  }

  function rangeTimeline(timeline,range){
    const rows=Array.isArray(timeline)?timeline:[];
    if(range==='all'||!rows.length)return rows;
    const days=Number(range.replace('d',''))||30;
    const last=new Date(rows[rows.length-1].date+'T12:00:00Z').getTime();
    const cutoff=last-days*86400000;
    const filtered=rows.filter(r=>new Date(r.date+'T12:00:00Z').getTime()>=cutoff);
    return filtered.length?filtered:rows;
  }

  function chartHtml(timeline,range='30d'){
    const list=rangeTimeline(timeline,range).filter(r=>num(r.bbb_rank)!=null||num(r.market_rank)!=null);
    if(!list.length)return '<div class="bbbph-empty">Premium chart history is still building.</div>';

    const width=820,height=270,left=50,right=22,top=25,bottom=34;
    const vals=list.flatMap(r=>[num(r.bbb_rank),num(r.market_rank)]).filter(v=>v!=null);
    let min=Math.min(...vals),max=Math.max(...vals);
    if(min===max){min=Math.max(1,min-3);max=max+3}else{
      const p=Math.max(2,Math.ceil((max-min)*.18));min=Math.max(1,min-p);max=max+p;
    }
    const cw=width-left-right,ch=height-top-bottom;
    const x=i=>list.length===1?left+cw/2:left+(i/(list.length-1))*cw;
    const y=v=>top+((v-min)/(max-min))*ch;
    const ticks=Array.from({length:5},(_,i)=>Math.round(min+((max-min)*i/4))).filter((v,i,a)=>i===0||v!==a[i-1]);
    const grid=ticks.map(v=>'<g><line x1="'+left+'" y1="'+y(v).toFixed(1)+'" x2="'+(width-right)+'" y2="'+y(v).toFixed(1)+'" class="bbbph-grid"/><text x="'+(left-9)+'" y="'+(y(v)+3).toFixed(1)+'" text-anchor="end" class="bbbph-axis">#'+v+'</text></g>').join('');
    const bbbPts=list.map((r,i)=>num(r.bbb_rank)==null?null:{x:x(i),y:y(num(r.bbb_rank)),r,i}).filter(Boolean);
    const marketPts=list.map((r,i)=>num(r.market_rank)==null?null:{x:x(i),y:y(num(r.market_rank)),r,i}).filter(Boolean);
    const bbbLine=bbbPts.length>1?'<polyline points="'+bbbPts.map(p=>p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ')+'" class="bbbph-bbb-line"/>':'';
    const marketLine=marketPts.length>1?'<polyline points="'+marketPts.map(p=>p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ')+'" class="bbbph-market-line"/>':'';
    const points=list.map((r,i)=>{
      const br=num(r.bbb_rank),mr=num(r.market_rank),px=x(i),selected=i===list.length-1;
      return '<g class="bbbph-point'+(selected?' selected':'')+'" tabindex="0" role="button" aria-pressed="'+(selected?'true':'false')+'" data-index="'+i+'" aria-label="'+esc(date(r.date))+' BBB '+rank(br)+' consensus '+rank(mr)+'">'+
        '<circle cx="'+px.toFixed(1)+'" cy="'+(br==null?(top+ch/2):y(br)).toFixed(1)+'" r="12" class="bbbph-hit"/>'+
        (br==null?'':'<circle cx="'+px.toFixed(1)+'" cy="'+y(br).toFixed(1)+'" r="'+(selected?5.5:4)+'" class="bbbph-bbb-dot"/>')+
        (mr==null?'':'<circle cx="'+px.toFixed(1)+'" cy="'+y(mr).toFixed(1)+'" r="3.5" class="bbbph-market-dot"/>')+
      '</g>';
    }).join('');

    return '<div class="bbbph-chart-shell" data-bbbph-range="'+range+'">'+
      '<div class="bbbph-chart-top"><div class="bbbph-legend"><span class="bbb">BBB RANK</span><span class="market">CONSENSUS</span></div>'+
      '<div class="bbbph-ranges"><button data-range="30d" class="'+(range==='30d'?'on':'')+'">30D</button><button data-range="90d" class="'+(range==='90d'?'on':'')+'">90D</button><button data-range="all" class="'+(range==='all'?'on':'')+'">ALL</button></div></div>'+
      '<svg class="bbbph-chart" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="BBB plus premium value history chart">'+grid+bbbLine+marketLine+points+'</svg>'+
      '<div class="bbbph-chart-dates"><span>'+date(list[0].date)+'</span><span>'+date(list[list.length-1].date)+'</span></div>'+
      '<div class="bbbph-snapshot" data-bbbph-snapshot>'+snapshotHtml(list[list.length-1])+'</div>'+
    '</div>';
  }

  function snapshotHtml(row){
    if(!row)return '';
    return '<div><span>Date</span><strong>'+date(row.date)+'</strong></div>'+
      '<div><span>BBB Rank</span><strong>'+rank(row.bbb_rank)+'</strong></div>'+
      '<div><span>Consensus</span><strong>'+rank(row.market_rank)+'</strong></div>'+
      '<div><span>BBB vs Market</span><strong>'+signedNum(row.gap)+'</strong></div>'+
      '<div class="value"><span>BBB Trade Value</span><strong>'+money(row.trade_value)+'</strong></div>';
  }

  function movementRows(rows){
    const list=(rows||[]).slice(0,5);
    if(!list.length)return '<div class="bbbph-empty">No tracked rank changes yet.</div>';
    return list.map(r=>{
      const change=num(r.change),cls=change>0?'up':change<0?'down':'';
      return '<div class="bbbph-move-row"><time>'+date(r.date)+'</time><span>#'+esc(r.from_rank)+' → #'+esc(r.to_rank)+'</span><strong class="'+cls+'">'+(change>0?'↑ ':change<0?'↓ ':'')+Math.abs(change||0)+'</strong></div>';
    }).join('');
  }

  function unlockedHtml(data){
    const s=data?.summary||{},p=data?.player||{},rep=reportCopy(data),access=data?.access||{};
    const gap=num(s?.gap?.current),gapCls=gap>0?'green':gap<0?'red':'';
    const bbb7=s?.bbb?.change_7d?.change;
    return '<section class="profile-card full '+CARD_CLASS+'" data-bbbph-player="'+esc(p.player_key||'')+'">'+
      '<div class="bbbph-head"><div><div class="profile-card-kicker" style="color:#f0ca64">BBB+ VALUE HISTORY</div><h2>Deeper value history.</h2><p>BBB ranking, consensus movement, divergence, exact daily trade values and meaningful movement events in one premium view.</p>'+
      (access.source==='admin'?'<span class="bbbph-owner">OWNER PREVIEW</span>':'')+'</div></div>'+
      '<div class="bbbph-kpis">'+
        '<div class="bbbph-kpi green"><span>Current BBB Rank</span><strong>'+rank(s?.bbb?.current_rank)+'</strong><small>'+moveHtml(bbb7)+'</small></div>'+
        '<div class="bbbph-kpi gold"><span>Consensus Rank</span><strong>'+rank(s?.market?.current_rank)+'</strong><small>FantasyCalc market</small></div>'+
        '<div class="bbbph-kpi '+gapCls+'"><span>Current Gap</span><strong>'+signedNum(gap)+'</strong><small>'+(gap>0?'BBB higher':gap<0?'Consensus higher':'Same rank')+'</small></div>'+
        '<div class="bbbph-kpi"><span>Best Tracked Rank</span><strong>'+rank(s?.bbb?.best_rank)+'</strong><small>BBB high</small></div>'+
        '<div class="bbbph-kpi"><span>Current Trade Value</span><strong>'+money(s?.bbb?.current_trade_value)+'</strong><small>BBB value</small></div>'+
        '<div class="bbbph-kpi"><span>Tracking Since</span><strong style="font-size:13px">'+date(s?.tracked_since)+'</strong><small>'+esc(s?.days_tracked||0)+' snapshots</small></div>'+
      '</div>'+
      '<div class="bbbph-report">'+
        '<div class="bbbph-report-main"><span class="bbbph-report-label">BBB+ READ</span><strong>'+esc(rep.title)+'</strong><p>'+esc(rep.body)+'</p></div>'+
        '<div class="bbbph-report-side">'+
          '<div><span>30D BBB</span><strong>'+moveHtml(s?.bbb?.change_30d?.change)+'</strong></div>'+
          '<div><span>90D BBB</span><strong>'+moveHtml(s?.bbb?.change_90d?.change)+'</strong></div>'+
          '<div><span>Biggest BBB Edge</span><strong>'+signedNum(s?.gap?.max_bbb_edge?.gap)+'</strong></div>'+
          '<div><span>Biggest Market Edge</span><strong>'+signedNum(s?.gap?.max_market_edge?.gap)+'</strong></div>'+
        '</div>'+
      '</div>'+
      '<div data-bbbph-chart>'+chartHtml(data.timeline,'30d')+'</div>'+
      '<div class="bbbph-bottom">'+
        '<div class="bbbph-moves"><h3>Recent BBB ranking moves</h3>'+movementRows(data?.movements?.bbb)+'</div>'+
        '<div class="bbbph-moves"><h3>Recent consensus moves</h3>'+movementRows(data?.movements?.market)+'</div>'+
      '</div>'+
    '</section>';
  }

  function bind(card,data){
    if(!card||!data)return;
    const bindChart=()=>{
      const shell=card.querySelector('.bbbph-chart-shell');
      if(!shell)return;
      const range=shell.dataset.bbbphRange||'30d';
      const list=rangeTimeline(data.timeline,range).filter(r=>num(r.bbb_rank)!=null||num(r.market_rank)!=null);
      const snapshot=shell.querySelector('[data-bbbph-snapshot]');
      const points=[...shell.querySelectorAll('.bbbph-point')];
      const activate=(point)=>{
        const i=Number(point.dataset.index);
        const row=list[i];
        if(!row)return;
        points.forEach(p=>{p.classList.toggle('selected',p===point);p.setAttribute('aria-pressed',p===point?'true':'false')});
        if(snapshot)snapshot.innerHTML=snapshotHtml(row);
      };
      points.forEach(point=>{
        point.addEventListener('click',()=>activate(point));
        point.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate(point)}});
      });
      shell.querySelectorAll('[data-range]').forEach(btn=>{
        btn.addEventListener('click',()=>{
          const next=btn.dataset.range||'30d';
          const mount=card.querySelector('[data-bbbph-chart]');
          if(mount){mount.innerHTML=chartHtml(data.timeline,next);bindChart()}
        });
      });
    };
    bindChart();
  }

  async function enhance(pathSlug=''){
    const run=++renderToken;
    ensureStyles();
    const key=currentPlayerKey(pathSlug);
    if(!key)return;
    const panel=targetPanel();
    if(!panel)return;

    let holder=panel.querySelector('.'+CARD_CLASS);
    if(!holder){
      const temp=document.createElement('div');
      temp.innerHTML=lockedHtml();
      holder=temp.firstElementChild;
      panel.insertBefore(holder,panel.firstChild);
    }

    const result=await loadPremium(key);
    if(run!==renderToken||currentPlayerKey(pathSlug)!==key)return;
    const current=targetPanel();
    if(!current)return;
    holder=current.querySelector('.'+CARD_CLASS);

    if(result.kind==='data'){
      const temp=document.createElement('div');temp.innerHTML=unlockedHtml(result.data);
      const next=temp.firstElementChild;
      if(holder)holder.replaceWith(next);else current.insertBefore(next,current.firstChild);
      bind(next,result.data);
    }else{
      const temp=document.createElement('div');temp.innerHTML=lockedHtml(result.kind==='error'?'error':'locked');
      const next=temp.firstElementChild;
      if(holder)holder.replaceWith(next);else current.insertBefore(next,current.firstChild);
    }
  }

  function schedule(pathSlug=''){
    [0,180,500,950,1600,2500].forEach(ms=>setTimeout(()=>enhance(pathSlug),ms));
  }

  ensureStyles();

  if(typeof profileRender==='function'){
    const base=profileRender;
    profileRender=async function(pathSlug){
      const result=await base(pathSlug);
      schedule(pathSlug);
      return result;
    };
  }

  if(observer)observer.disconnect();
  observer=new MutationObserver(()=>{
    if(location.pathname.startsWith('/player/')&&targetPanel()){
      observer.disconnect();
      schedule(currentPlayerKey());
      setTimeout(()=>observer?.observe(document.documentElement,{childList:true,subtree:true}),2700);
    }
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  if(location.pathname.startsWith('/player/'))schedule(currentPlayerKey());
})();