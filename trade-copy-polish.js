// Preview-only BBB Decision Tool layer for the Trade Calculator.
// Keeps the existing valuation engine intact and adds a clearer dynasty decision readout.
(function(){
  function esc(v){return typeof bbbEsc==='function'?bbbEsc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function num(v){const n=Number(v);return Number.isFinite(n)?n:null;}
  function assetFromId(id){
    if(typeof resolveTradeAsset==='function')return resolveTradeAsset(id);
    if(typeof id==='number'&&typeof players!=='undefined')return players.find(p=>Number(p.rank)===id)||null;
    return null;
  }
  function sideAssets(side){
    const ids=side==='A'?(typeof tradeA!=='undefined'?tradeA:[]):(typeof tradeB!=='undefined'?tradeB:[]);
    return ids.map(assetFromId).filter(Boolean);
  }
  function adjustedValue(side){
    const el=document.querySelector(side==='A'?'#teamAAdjusted':'#teamBAdjusted');
    const text=String(el?.textContent||'').replace(/[^0-9.-]/g,'');
    return num(text)||0;
  }
  function mode(){return document.querySelector('.bbb-trade-mode-btn.active')?.dataset.mode||'bbb';}
  function rankFor(a){
    if(!a||a.type==='pick')return 9999;
    if(mode()==='market')return num(a.market)||550;
    return num(a.rank)||9999;
  }
  function bestPlayer(assets){return assets.filter(a=>a.type!=='pick').sort((a,b)=>rankFor(a)-rankFor(b))[0]||null;}
  function ageAverage(assets){
    const ages=assets.filter(a=>a.type!=='pick').map(a=>num(a.age)).filter(v=>v!=null);
    return ages.length?ages.reduce((s,v)=>s+v,0)/ages.length:null;
  }
  function marketClass(a){
    if(!a||a.type==='pick')return 'PICK';
    const view=String(a.view||a.market_view||'').toUpperCase();
    if(view.includes('BUY'))return 'BUY';
    if(view.includes('FADE'))return 'FADE';
    const gap=num(a.gap??a.bbb_vs_fp);
    if(gap!=null&&gap>=20)return 'BUY';
    if(gap!=null&&gap<=-20)return 'FADE';
    return 'MARKET';
  }
  function countMarket(assets,type){return assets.filter(a=>marketClass(a)===type).length;}
  function countPosition(assets,pos){return assets.filter(a=>a.type!=='pick'&&a.pos===pos).length;}
  function playerLabel(a){
    if(!a)return 'None';
    if(a.type==='pick')return a.name||'Draft pick';
    return `${a.name} (${mode()==='market'?'Market':'BBB'} #${rankFor(a)})`;
  }
  function cleanReasonCopy(){
    const reason=document.querySelector('#bbbTradeReason');
    if(!reason)return;
    let text=String(reason.textContent||'').trim();
    if(!text)return;
    text=text
      .replace('V2 will explain the strongest driver once both sides have assets.','Once both sides have assets, BBB will explain the biggest factor driving the result.')
      .replace('The V2 adjusted values are close after elite-asset and package discounts.','The adjusted values are close after accounting for elite-player premiums and package discounts.')
      .replace('and V2 protects that elite asset from being matched too easily by depth.','and BBB gives extra weight to that cornerstone instead of letting multiple depth pieces cancel it out too easily.')
      .replace('after V2 discounts the extra depth pieces.','after BBB discounts the extra depth pieces in the package.')
      .replace('carries the higher V2 adjusted value after package and cornerstone premiums.','has the higher adjusted value after accounting for package size and cornerstone value.');
    reason.textContent=text;
  }
  function cleanVerdictCopy(){
    const sub=document.querySelector('#tradeVerdictSub');
    if(sub&&sub.textContent.includes('V2 adjusted values are within 3%.'))sub.textContent=sub.textContent.replace('V2 adjusted values are within 3%.','Adjusted values are within 3%.');
  }
  function cleanModelExplainer(){
    const summary=document.querySelector('.trade-summary-card');
    if(!summary)return;
    const label=summary.querySelector('.trade-summary-label');
    if(label&&label.textContent.trim()==='V2 VALUE MODEL')label.textContent='BBB VALUE MODEL';
    const p=summary.querySelector('p');
    if(p&&p.textContent.includes('V2 protects elite assets'))p.textContent="BBB gives extra weight to elite cornerstone players, discounts extra depth pieces more aggressively, and lets you compare Bobby's board with market-rank value.";
  }
  function ensureStyles(){
    if(document.querySelector('#bbbDecisionToolStyles'))return;
    const style=document.createElement('style');
    style.id='bbbDecisionToolStyles';
    style.textContent=`
      .bbb-decision-card{margin-top:16px;border:1px solid #20523a;background:linear-gradient(155deg,#0a1711,#07100c 72%);border-radius:16px;padding:18px;box-shadow:0 16px 38px rgba(0,0,0,.18)}
      .bbb-decision-top{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;padding-bottom:15px;border-bottom:1px solid #173529}
      .bbb-decision-kicker{color:#5cda98;font-size:8px;font-weight:950;letter-spacing:.14em;text-transform:uppercase}.bbb-decision-top h3{margin:6px 0 4px;color:#fff;font-size:25px;letter-spacing:-.025em}.bbb-decision-sub{margin:0;color:#84998d;font-size:10px;line-height:1.55;max-width:620px}
      .bbb-decision-badge{flex:none;display:inline-flex;align-items:center;border-radius:999px;padding:8px 11px;font-size:9px;font-weight:950;letter-spacing:.06em;border:1px solid #365343;background:#101b16;color:#c5d1cb}.bbb-decision-badge.win{border-color:#27734d;background:#0c2a1c;color:#7fe5ad}.bbb-decision-badge.fair{border-color:#66572d;background:#251f0e;color:#e4cb78}.bbb-decision-badge.strong{border-color:#267d52;background:#0b3320;color:#91efbb}
      .bbb-decision-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:13px}.bbb-decision-stat{border:1px solid #193529;background:#08120e;border-radius:11px;padding:11px}.bbb-decision-stat span{display:block;color:#6d8276;font-size:7px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}.bbb-decision-stat strong{display:block;color:#eaf2ee;font-size:13px;margin-top:6px;line-height:1.3}.bbb-decision-stat small{display:block;color:#73877c;font-size:8px;margin-top:4px;line-height:1.35}
      .bbb-decision-take{margin-top:11px;border:1px solid #204633;background:#091811;border-radius:12px;padding:13px}.bbb-decision-take>span{display:block;color:#61d99c;font-size:7px;font-weight:950;letter-spacing:.13em;margin-bottom:7px}.bbb-decision-take p{margin:0;color:#c3d0c9;font-size:10px;line-height:1.62}
      .bbb-decision-flags{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.bbb-decision-flag{display:inline-flex;border-radius:999px;padding:5px 8px;border:1px solid #2d483b;background:#0b1511;color:#9caf9f;font-size:7px;font-weight:900}.bbb-decision-flag.buy{border-color:#276748;background:#0b271b;color:#77e0a8}.bbb-decision-flag.fade{border-color:#6d3434;background:#301515;color:#ee8f8f}.bbb-decision-flag.warn{border-color:#6a572b;background:#251f0e;color:#e3c879}
      .bbb-decision-empty{color:#81948a;font-size:10px;line-height:1.55}
      @media(max-width:900px){.bbb-decision-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:600px){.bbb-decision-top{display:block}.bbb-decision-badge{margin-top:10px}.bbb-decision-grid{grid-template-columns:1fr 1fr}.bbb-decision-card{padding:14px}}
      @media(max-width:420px){.bbb-decision-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }
  function ensurePanel(){
    const view=document.querySelector('#tradeView');
    if(!view)return null;
    let panel=document.querySelector('#bbbDecisionTool');
    if(panel)return panel;
    ensureStyles();
    panel=document.createElement('section');
    panel.id='bbbDecisionTool';
    panel.className='bbb-decision-card';
    const verdict=document.querySelector('.trade-verdict-card');
    if(verdict?.parentNode)verdict.insertAdjacentElement('afterend',panel);
    else view.appendChild(panel);
    return panel;
  }
  function buildTake(a,b,winner,edge,best,signal,ageA,ageB){
    if(!winner)return 'Add assets to both sides and BBB will turn the calculator result into a dynasty decision with context around consolidation, market disagreement, age, and roster construction.';
    const win=winner==='A'?a:b,lose=winner==='A'?b:a;
    const winName=`Team ${winner}`;
    const loseName=`Team ${winner==='A'?'B':'A'}`;
    let first=edge<3?`The deal is close enough that team needs should decide it.`:`${winName} has the stronger adjusted value by about ${edge.toFixed(1)}%.`;
    let second='';
    const winTop=bestPlayer(win),loseTop=bestPlayer(lose);
    if(winTop&&loseTop&&rankFor(winTop)+8<rankFor(loseTop)&&win.length<=lose.length)second=`The biggest reason is consolidation: ${winName} gets the best player in the trade, ${winTop.name}, without taking on a larger package.`;
    else if(win.length<lose.length)second=`BBB prefers the more concentrated package on ${winName} and discounts some of the extra depth coming back to ${loseName}.`;
    else if(signal)second=signal;
    else second=`The result is driven more by total quality than by one single asset.`;
    let third='';
    if(ageA!=null&&ageB!=null&&Math.abs(ageA-ageB)>=1.5){const young=ageA<ageB?'A':'B';third=`Team ${young} receives the younger player package on average, which matters more for a rebuilding roster than a contender.`;}
    else if(best)third=`The best player in the deal is ${best.name}, which is worth remembering in shallow starting lineups where elite assets carry extra leverage.`;
    return [first,second,third].filter(Boolean).join(' ');
  }
  function renderDecision(){
    const panel=ensurePanel();if(!panel)return;
    const a=sideAssets('A'),b=sideAssets('B');
    const av=adjustedValue('A'),bv=adjustedValue('B');
    if(!a.length||!b.length||!av||!bv){
      panel.innerHTML=`<div class="bbb-decision-top"><div><div class="bbb-decision-kicker">BBB DECISION TOOL PREVIEW</div><h3>Build the trade first.</h3><p class="bbb-decision-sub">The calculator stays the valuation engine. This layer turns the result into a quicker dynasty decision once both sides have assets.</p></div><span class="bbb-decision-badge fair">WAITING FOR TRADE</span></div><div class="bbb-decision-take"><span>BBB TAKE</span><p class="bbb-decision-empty">Add assets to both sides to see the decision, edge percentage, best asset, package shape, market signals, and dynasty-window context.</p></div>`;
      return;
    }
    const max=Math.max(av,bv),min=Math.min(av,bv),ratio=min/max,edge=(max/min-1)*100;
    const winner=av===bv?null:(av>bv?'A':'B');
    let verdict='FAIR TRADE',badgeClass='fair';
    if(ratio<.97&&ratio>=.92){verdict=`LEAN TEAM ${winner}`;badgeClass='win';}
    else if(ratio<.92&&ratio>=.84){verdict=`ACCEPT TEAM ${winner}`;badgeClass='win';}
    else if(ratio<.84){verdict=`STRONG ACCEPT TEAM ${winner}`;badgeClass='strong';}
    const all=[...a,...b];
    const best=bestPlayer(all);
    const ageA=ageAverage(a),ageB=ageAverage(b);
    const buyA=countMarket(a,'BUY'),buyB=countMarket(b,'BUY'),fadeA=countMarket(a,'FADE'),fadeB=countMarket(b,'FADE');
    const winAssets=winner==='A'?a:b,loseAssets=winner==='A'?b:a;
    let shape='Balanced package',shapeSub=`${a.length} assets vs ${b.length} assets`;
    if(winner&&winAssets.length<loseAssets.length){shape='Consolidation win';shapeSub=`Team ${winner} gets fewer, stronger assets`;}
    else if(a.length!==b.length){shape='Depth trade';shapeSub=`${Math.max(a.length,b.length)}-for-${Math.min(a.length,b.length)} package`;}
    const bestOpp=winner?bestPlayer(loseAssets):null;
    const eliteDilution=winner&&bestOpp&&rankFor(bestOpp)<=24&&winAssets.length>=3&&(!bestPlayer(winAssets)||rankFor(bestPlayer(winAssets))>50);
    const marketSignal=buyA!==buyB?`BBB has more BUY signals on Team ${buyA>buyB?'A':'B'} (${Math.max(buyA,buyB)} vs ${Math.min(buyA,buyB)}).`:fadeA!==fadeB?`Team ${fadeA>fadeB?'A':'B'} carries more BBB FADE signals (${Math.max(fadeA,fadeB)} vs ${Math.min(fadeA,fadeB)}).`:'';
    const take=buildTake(a,b,winner,edge,best,marketSignal,ageA,ageB);
    const flags=[];
    if(buyA)flags.push(`<span class="bbb-decision-flag buy">Team A: ${buyA} BBB BUY${buyA===1?'':'S'}</span>`);
    if(buyB)flags.push(`<span class="bbb-decision-flag buy">Team B: ${buyB} BBB BUY${buyB===1?'':'S'}</span>`);
    if(fadeA)flags.push(`<span class="bbb-decision-flag fade">Team A: ${fadeA} BBB FADE${fadeA===1?'':'S'}</span>`);
    if(fadeB)flags.push(`<span class="bbb-decision-flag fade">Team B: ${fadeB} BBB FADE${fadeB===1?'':'S'}</span>`);
    if(winner&&loseAssets.length-winAssets.length>=2)flags.push(`<span class="bbb-decision-flag warn">Depth cost: Team ${winner==='A'?'B':'A'} sends ${loseAssets.length} assets</span>`);
    if(eliteDilution)flags.push('<span class="bbb-decision-flag warn">Elite asset dilution warning</span>');
    if(countPosition(a,'QB')!==countPosition(b,'QB'))flags.push('<span class="bbb-decision-flag">Superflex QB leverage matters here</span>');
    if(countPosition(a,'TE')!==countPosition(b,'TE'))flags.push('<span class="bbb-decision-flag">TE value follows BBB dynasty rank</span>');
    panel.innerHTML=`<div class="bbb-decision-top"><div><div class="bbb-decision-kicker">BBB DECISION TOOL PREVIEW</div><h3>${esc(verdict)}</h3><p class="bbb-decision-sub">A decision layer on top of the existing BBB valuation model. It weighs the edge, package shape, market disagreement, age, and the best asset in the deal.</p></div><span class="bbb-decision-badge ${badgeClass}">${ratio>=.97?'WITHIN 3%':`${edge.toFixed(1)}% EDGE`}</span></div>
      <div class="bbb-decision-grid">
        <div class="bbb-decision-stat"><span>Best asset</span><strong>${esc(best?.name||'None')}</strong><small>${best?esc(playerLabel(best)):'No player asset'}</small></div>
        <div class="bbb-decision-stat"><span>Trade shape</span><strong>${esc(shape)}</strong><small>${esc(shapeSub)}</small></div>
        <div class="bbb-decision-stat"><span>Market signal</span><strong>${esc(buyA+buyB)} buys / ${esc(fadeA+fadeB)} fades</strong><small>${esc(marketSignal||'No major BBB market split')}</small></div>
        <div class="bbb-decision-stat"><span>Age and window</span><strong>${ageA==null?'N/A':ageA.toFixed(1)} vs ${ageB==null?'N/A':ageB.toFixed(1)}</strong><small>Average player age, Team A vs Team B</small></div>
      </div>
      <div class="bbb-decision-take"><span>BBB TAKE</span><p>${esc(take)}</p>${flags.length?`<div class="bbb-decision-flags">${flags.join('')}</div>`:''}</div>`;
  }
  function cleanTradeCopy(){cleanReasonCopy();cleanVerdictCopy();cleanModelExplainer();renderDecision();}
  if(typeof tradeRender==='function'&&!tradeRender.__bbbDecisionTool){
    const original=tradeRender;
    const wrapped=function(){const result=original.apply(this,arguments);cleanTradeCopy();return result;};
    wrapped.__bbbDecisionTool=true;
    tradeRender=wrapped;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(cleanTradeCopy,0));
  else setTimeout(cleanTradeCopy,0);
})();
