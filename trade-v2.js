(function(){
  const BBB_V2_WEIGHTS=[1,.76,.58,.43,.32,.24,.18,.14];
  let bbbTradeMode='bbb';

  function esc(v){return typeof bbbEsc==='function'?bbbEsc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function rankValue(rank){if(!rank||rank<1)return 0;return Math.round(10000*Math.exp(-.012*(rank-1)));}
  function playerRank(p,mode=bbbTradeMode){if(!p||p.type==='pick')return null;if(mode==='market')return p.market||550;return p.rank||null;}
  function baseValue(a,mode=bbbTradeMode){if(!a)return 0;if(a.type==='pick')return Number(a.value)||0;return rankValue(playerRank(a,mode));}
  function studMultiplier(a,mode=bbbTradeMode){if(!a||a.type==='pick')return 1;const r=playerRank(a,mode);if(!r||r>100)return 1;if(r<=6)return 1.18;if(r<=12)return 1.14;if(r<=24)return 1.10;if(r<=50)return 1.06;return 1.03;}
  function sideAssets(s){const ids=s==='A'?tradeA:tradeB;return ids.map(x=>typeof resolveTradeAsset==='function'?resolveTradeAsset(x):(typeof x==='number'?players.find(p=>p.rank===x):null)).filter(Boolean);}
  function sideCalc(s,mode=bbbTradeMode){
    const assets=sideAssets(s).map(a=>({a,base:baseValue(a,mode)})).sort((x,y)=>y.base-x.base);
    let adjusted=0;
    assets.forEach((x,i)=>{const premium=i===0?studMultiplier(x.a,mode):1;adjusted+=x.base*(BBB_V2_WEIGHTS[i]||0)*premium;});
    return {assets,raw:assets.reduce((z,x)=>z+x.base,0),adjusted:Math.round(adjusted),top:assets[0]?.a||null};
  }
  function modeLabel(){return bbbTradeMode==='market'?'MARKET':'BBB';}
  function marketGapText(p){if(!p||p.type==='pick')return '';if(p.gap==null)return 'Market gap —';const n=Number(p.gap);return `${n>0?'+':''}${n} vs market`;}
  function assetRankMeta(p){
    if(p.type==='pick')return `<span class="pick-badge">PICK</span> • ${esc(p.year||'')} • ${esc(p.range||'')}`;
    return `BBB #${p.rank} • ${p.pos}${p.pr||''} • ${esc(p.team||'')} • Market ${p.market?'#'+p.market:'UR'}`;
  }
  function currentValueLabel(p){
    if(p.type==='pick')return 'BBB PICK VALUE';
    return bbbTradeMode==='market'?(p.market?'MARKET VALUE':'MARKET UR FLOOR'):'BBB VALUE';
  }
  function bestPlayer(side){return side.assets.map(x=>x.a).find(a=>a.type!=='pick')||null;}
  function reasonText(a,b,winner,fair){
    if(fair)return 'The V2 adjusted values are close after elite-asset and package discounts.';
    const win=winner==='A'?a:b,lose=winner==='A'?b:a;
    const wp=bestPlayer(win),lp=bestPlayer(lose);
    if(wp&&lp){
      const wr=playerRank(wp),lr=playerRank(lp);
      if(wr&&lr&&wr+8<lr&&win.assets.length<=lose.assets.length)return `${winner==='A'?'Team A':'Team B'} gets the best player in the deal and consolidates the package into the stronger cornerstone.`;
      if(wr&&lr&&wr+15<lr)return `${winner==='A'?'Team A':'Team B'} gets the highest-ranked player in the deal, and V2 protects that elite asset from being matched too easily by depth.`;
    }
    if(win.assets.length<lose.assets.length)return `${winner==='A'?'Team A':'Team B'} is receiving the more concentrated package after V2 discounts the extra depth pieces.`;
    if(bbbTradeMode==='bbb'&&wp&&Number(wp.gap)>=20)return `BBB is meaningfully higher than the market on ${wp.name}, which pushes the Bobby-side valuation toward ${winner==='A'?'Team A':'Team B'}.`;
    return `${winner==='A'?'Team A':'Team B'} carries the higher V2 adjusted value after package and cornerstone premiums.`;
  }
  function slug(name){return String(name||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/['’.]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}

  function renderAssets(s){
    const ar=sideAssets(s),box=document.querySelector('#tradeAssets'+s);if(!box)return;
    box.innerHTML=ar.length?ar.map((p,i)=>{
      const v=baseValue(p);
      const premium=studMultiplier(p);
      const premiumBadge=p.type!=='pick'&&premium>1?`<span class="bbb-trade-premium">ELITE ×${premium.toFixed(2)}</span>`:'';
      return `<div class="trade-asset bbb-trade-v2-asset ${p.type==='pick'?'pick-asset':''}"><div><button type="button" class="bbb-trade-asset-name" data-profile="${p.type==='pick'?'':esc(p.name)}">${esc(p.name)}</button><div class="trade-asset-meta">${assetRankMeta(p)}</div>${p.type!=='pick'?`<div class="bbb-trade-market-gap">${esc(marketGapText(p))} ${premiumBadge}</div>`:''}</div><div class="trade-asset-value"><strong>${fmt(v)}</strong><span>${currentValueLabel(p)}</span></div><button class="trade-remove" data-s="${s}" data-i="${i}">×</button></div>`;
    }).join(''):'<div class="trade-empty">Add up to eight players or picks.</div>';
    box.querySelectorAll('.trade-remove').forEach(b=>b.onclick=()=>{const arr=b.dataset.s==='A'?tradeA:tradeB;arr.splice(+b.dataset.i,1);tradeRender();});
    box.querySelectorAll('[data-profile]').forEach(b=>{if(!b.dataset.profile)return;b.onclick=()=>{if(typeof profileGo==='function')profileGo(b.dataset.profile);};});
  }

  tradeAssets=renderAssets;
  adj=function(s){return sideCalc(s).adjusted;};
  raw=function(s){return Math.round(sideCalc(s).raw);};
  assetValue=function(a){return baseValue(a);};

  tradeRender=function(){
    if(!document.querySelector('#tradeView'))return;
    renderAssets('A');renderAssets('B');
    const a=sideCalc('A'),b=sideCalc('B');
    teamATotal.textContent=fmt(a.raw);teamBTotal.textContent=fmt(b.raw);teamAAdjusted.textContent=fmt(a.adjusted);teamBAdjusted.textContent=fmt(b.adjusted);
    teamACount.textContent=`${tradeA.length} / 8 assets`;teamBCount.textContent=`${tradeB.length} / 8 assets`;
    document.querySelectorAll('.bbb-trade-mode-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.mode===bbbTradeMode));
    const modeTag=document.querySelector('#bbbTradeModeTag');if(modeTag)modeTag.textContent=bbbTradeMode==='market'?'MARKET RANK MODEL':'BOBBY\'S BOARD MODEL';
    const reason=document.querySelector('#bbbTradeReason');const split=document.querySelector('#bbbTradeSplit');const compare=document.querySelector('#bbbTradeCompareAction');
    if(!tradeA.length||!tradeB.length||!a.adjusted||!b.adjusted){
      tradeVerdict.textContent=tradeA.length||tradeB.length?'ADD BOTH SIDES':'BUILD A TRADE';tradeVerdictSub.textContent='Add players or picks to both sides to compare the deal.';fairnessPct.textContent='—';fairnessFill.style.width='0';
      if(reason)reason.textContent='V2 will explain the strongest driver once both sides have assets.';if(split)split.textContent='—';if(compare)compare.classList.add('hide');return;
    }
    const fairRatio=Math.min(a.adjusted,b.adjusted)/Math.max(a.adjusted,b.adjusted),winner=a.adjusted>=b.adjusted?'A':'B',fair=fairRatio>=.97;
    const total=a.adjusted+b.adjusted,aShare=total?Math.round(a.adjusted/total*100):50,bShare=100-aShare;
    let verdict=fair?'FAIR TRADE':fairRatio>=.92?`SLIGHT LEAN TEAM ${winner}`:fairRatio>=.84?`LEAN TEAM ${winner}`:`STRONGLY FAVORS TEAM ${winner}`;
    tradeVerdict.textContent=verdict;
    const edge=Math.max(a.adjusted,b.adjusted)/Math.min(a.adjusted,b.adjusted)-1;
    tradeVerdictSub.textContent=fair?'V2 adjusted values are within 3%.':`Team ${winner} receives about ${(edge*100).toFixed(1)}% more adjusted ${modeLabel()} value.`;
    fairnessPct.textContent=(fairRatio*100).toFixed(1)+'%';fairnessFill.style.width=(fairRatio*100)+'%';
    if(reason)reason.textContent=reasonText(a,b,winner,fair);if(split)split.textContent=`${aShare} / ${bShare}`;
    const ap=bestPlayer(a),bp=bestPlayer(b);if(compare){if(a.assets.length===1&&b.assets.length===1&&ap&&bp){compare.classList.remove('hide');compare.onclick=()=>{location.hash=`compare?left=${slug(ap.name)}&right=${slug(bp.name)}`;};}else compare.classList.add('hide');}
  };

  searchTrade=function(s){
    const inp=document.querySelector('#tradeSearch'+s),out=document.querySelector('#tradeResults'+s),qq=inp.value.trim().toLowerCase();if(!qq){out.classList.add('hide');return;}
    const usedPlayers=new Set([...tradeA,...tradeB].filter(x=>typeof x==='number'));
    const pm=players.filter(p=>!usedPlayers.has(p.rank)&&(`${p.name} ${p.team} ${p.pos}`).toLowerCase().includes(qq)).map(p=>({kind:'player',key:String(p.rank),obj:p,score:p.name.toLowerCase().startsWith(qq)?0:1}));
    const km=(typeof draftPicks!=='undefined'?draftPicks:[]).filter(p=>(`${p.name} ${p.year} ${p.range} pick`).toLowerCase().includes(qq)).map(p=>({kind:'pick',key:p.id,obj:p,score:String(p.year)===qq||p.name.toLowerCase().startsWith(qq)?0:1}));
    const m=[...km,...pm].sort((x,y)=>x.score-y.score).slice(0,12);
    out.innerHTML=m.length?m.map(x=>x.kind==='pick'?`<button class="trade-result pick-result" data-kind="pick" data-key="${esc(x.key)}"><div><strong>${esc(x.obj.name)}</strong><span><span class="pick-badge">PICK</span> • ${esc(x.obj.year)} • ${esc(x.obj.range)}</span></div><span class="trade-result-value">${fmt(baseValue(x.obj))}</span></button>`:`<button class="trade-result" data-kind="player" data-key="${x.key}"><div><strong>${esc(x.obj.name)}</strong><span>BBB #${x.obj.rank} • Market ${x.obj.market?'#'+x.obj.market:'UR'} • ${x.obj.pos}${x.obj.pr||''} • ${esc(x.obj.team||'')}</span></div><span class="trade-result-value">${fmt(baseValue(x.obj))}</span></button>`).join(''):'<div class="empty">No matches.</div>';
    out.classList.remove('hide');out.querySelectorAll('.trade-result').forEach(b=>b.onclick=()=>{const arr=s==='A'?tradeA:tradeB;if(arr.length<8)arr.push(b.dataset.kind==='player'?+b.dataset.key:b.dataset.key);inp.value='';out.classList.add('hide');tradeRender();});
  };

  function inject(){
    const view=document.querySelector('#tradeView');if(!view||document.querySelector('#bbbTradeV2Styles'))return;
    const style=document.createElement('style');style.id='bbbTradeV2Styles';style.textContent=`
      .bbb-trade-v2-controls{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.bbb-trade-mode{display:flex;padding:3px;border:1px solid #29483b;background:#07100c;border-radius:999px}.bbb-trade-mode-btn{border:0;background:transparent;color:#788c81;padding:8px 12px;border-radius:999px;font-size:9px;font-weight:950;letter-spacing:.08em;cursor:pointer}.bbb-trade-mode-btn.active{background:#0a8f4d;color:white}.bbb-trade-v2-badge{color:#62dc9c;border:1px solid #2b5a44;background:#0b2017;border-radius:999px;padding:7px 10px;font-size:8px;font-weight:950;letter-spacing:.12em}.bbb-trade-v2-asset{grid-template-columns:minmax(0,1fr) auto auto}.bbb-trade-asset-name{border:0;background:none;padding:0;color:#fff;font-weight:950;font-size:12px;cursor:pointer;text-align:left}.bbb-trade-asset-name:hover{color:#64d697}.bbb-trade-market-gap{font-size:8px;color:#71877b;margin-top:5px}.bbb-trade-premium{display:inline-flex;margin-left:5px;color:#f0cc79;border:1px solid #604e25;background:#211b0c;border-radius:999px;padding:2px 5px;font-weight:950}.bbb-trade-reason{margin-top:14px;padding:12px;border:1px solid #1d3c2f;background:#09150f;border-radius:10px}.bbb-trade-reason span{display:block;color:#50ce8e;font-size:7px;font-weight:950;letter-spacing:.13em;margin-bottom:6px}.bbb-trade-reason p{margin:0;color:#b8c7bf;font-size:10px;line-height:1.55}.bbb-trade-split{display:flex;justify-content:space-between;align-items:center;margin-top:9px;color:#72867b;font-size:8px}.bbb-trade-split strong{color:#fff;font-size:11px}.bbb-trade-compare{width:100%;margin-top:10px;border:1px solid #2e503f;background:#0b1712;color:#8fe1b2;border-radius:9px;padding:9px;font-size:9px;font-weight:950;cursor:pointer}.bbb-trade-compare:hover{border-color:#50ce8e;color:#fff}.trade-summary-card .bbb-v2-weights{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:14px}.trade-summary-card .bbb-v2-weights div{padding:8px;border:1px solid #193026;background:#09110d;border-radius:8px}.trade-summary-card .bbb-v2-weights span{display:block;color:#718279;font-size:7px}.trade-summary-card .bbb-v2-weights b{font-size:12px}.trade-explainer-grid{grid-template-columns:repeat(3,1fr)}@media(max-width:950px){.bbb-trade-v2-controls{width:100%;justify-content:space-between}}@media(max-width:640px){.bbb-trade-mode{width:100%}.bbb-trade-mode-btn{flex:1}.bbb-trade-v2-badge{display:none}.bbb-trade-v2-asset{grid-template-columns:minmax(0,1fr) auto auto}}
    `;document.head.appendChild(style);
    const topbar=document.querySelector('.trade-topbar');const actions=topbar?.querySelector('.trade-actions');
    if(topbar&&actions){const controls=document.createElement('div');controls.className='bbb-trade-v2-controls';controls.innerHTML=`<div class="bbb-trade-mode"><button class="bbb-trade-mode-btn active" data-mode="bbb">BBB VALUE</button><button class="bbb-trade-mode-btn" data-mode="market">MARKET VALUE</button></div><span id="bbbTradeModeTag" class="bbb-trade-v2-badge">BOBBY'S BOARD MODEL</span>`;topbar.insertBefore(controls,actions);controls.querySelectorAll('button').forEach(b=>b.onclick=()=>{bbbTradeMode=b.dataset.mode;tradeRender();});}
    const summary=document.querySelector('.trade-summary-card');if(summary)summary.innerHTML=`<div class="trade-summary-label">V2 VALUE MODEL</div><strong>Cornerstones cost more.</strong><p>V2 protects elite assets, discounts depth more aggressively, and lets you flip between Bobby's board and market-rank valuation.</p><div class="bbb-v2-weights"><div><span>2ND ASSET</span><b>76%</b></div><div><span>3RD ASSET</span><b>58%</b></div><div><span>4TH ASSET</span><b>43%</b></div><div><span>5TH+ ASSETS</span><b>32% ↓</b></div></div>`;
    const verdict=document.querySelector('.trade-verdict-card');const note=verdict?.querySelector('.trade-note');if(verdict&&note){const reason=document.createElement('div');reason.className='bbb-trade-reason';reason.innerHTML='<span>WHY BBB LEANS THIS WAY</span><p id="bbbTradeReason">V2 will explain the strongest driver once both sides have assets.</p><div class="bbb-trade-split"><span>ADJUSTED VALUE SPLIT • TEAM A / TEAM B</span><strong id="bbbTradeSplit">—</strong></div>';verdict.insertBefore(reason,note);const compare=document.createElement('button');compare.id='bbbTradeCompareAction';compare.className='bbb-trade-compare hide';compare.textContent='COMPARE THE TWO PLAYERS →';verdict.insertBefore(compare,note);note.textContent="BBB Value uses Bobby's Superflex rankings. Market Value converts current market rank to the same curve; market-unranked players use a conservative UR floor. Draft-pick values remain Bobby's values in both modes.";}
    const explainers=document.querySelectorAll('.trade-explainer');if(explainers[0])explainers[0].innerHTML='<span>01 / CORNERSTONE PREMIUM</span><h3>Elite players are expensive.</h3><p>Top assets receive an extra premium so depth packages have to meaningfully overpay for a cornerstone.</p>';if(explainers[1])explainers[1].innerHTML='<span>02 / PACKAGE TAX</span><h3>Depth gets discounted harder.</h3><p>Additional assets count less as the package grows: 76%, 58%, 43%, 32% and down from there.</p>';if(explainers[2])explainers[2].innerHTML='<span>03 / TWO LENSES</span><h3>BBB vs the market.</h3><p>Flip between Bobby\'s board and current market rank to see whether the same trade looks different to consensus.</p>';
    tradeRender();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else inject();
})();
