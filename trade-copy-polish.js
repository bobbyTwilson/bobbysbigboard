// Preview-only simplified BBB decision layer for the Trade Calculator.
// Keeps the existing calculator layout and adds only a clearer verdict, edge, and short BBB take.
(function(){
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
  function currentMode(){return document.querySelector('.bbb-trade-mode-btn.active')?.dataset.mode||'bbb';}
  function rankFor(asset){
    if(!asset||asset.type==='pick')return null;
    return currentMode()==='market'?(num(asset.market)||550):(num(asset.rank)||null);
  }
  function bestPlayer(assets){
    return assets.filter(a=>a.type!=='pick').sort((a,b)=>(rankFor(a)||9999)-(rankFor(b)||9999))[0]||null;
  }
  function buyAsset(assets){
    return assets.find(a=>{
      if(!a||a.type==='pick')return false;
      const view=String(a.view||a.market_view||'').toUpperCase();
      if(view.includes('BUY'))return true;
      const gap=num(a.gap??a.bbb_vs_fp);
      return gap!=null&&gap>=20;
    })||null;
  }
  function cleanModelCopy(){
    const summary=document.querySelector('.trade-summary-card');
    if(summary){
      const label=summary.querySelector('.trade-summary-label');
      if(label&&label.textContent.trim()==='V2 VALUE MODEL')label.textContent='BBB VALUE MODEL';
      const p=summary.querySelector('p');
      if(p&&p.textContent.includes('V2 protects elite assets'))p.textContent="BBB gives extra weight to elite cornerstone players and discounts extra depth pieces more aggressively.";
    }
    const reason=document.querySelector('#bbbTradeReason');
    if(reason){
      const wrap=reason.closest('.bbb-trade-reason');
      const label=wrap?.querySelector('span');
      if(label)label.textContent='BBB TAKE';
    }
  }
  function ensureStyles(){
    if(document.querySelector('#bbbSimpleDecisionStyles'))return;
    const style=document.createElement('style');
    style.id='bbbSimpleDecisionStyles';
    style.textContent=`
      .bbb-trade-reason{padding:13px 14px!important}
      .bbb-trade-reason>span{color:#5dd996!important}
      .bbb-trade-reason p{font-size:11px!important;line-height:1.55!important;color:#c2d0c8!important}
      .bbb-trade-split{display:none!important}
      .bbb-simple-edge{display:inline-flex;margin-top:9px;border:1px solid #28533f;background:#0a2017;color:#74dda5;border-radius:999px;padding:5px 8px;font-size:8px;font-weight:950;letter-spacing:.04em}
      .bbb-simple-edge.fair{border-color:#5c512e;background:#211d0e;color:#dbc778}
    `;
    document.head.appendChild(style);
  }
  function setEdgeChip(text,fair){
    const reason=document.querySelector('#bbbTradeReason');
    const wrap=reason?.closest('.bbb-trade-reason');
    if(!wrap)return;
    let chip=wrap.querySelector('.bbb-simple-edge');
    if(!chip){chip=document.createElement('span');chip.className='bbb-simple-edge';wrap.appendChild(chip);}
    chip.classList.toggle('fair',!!fair);
    chip.textContent=text;
  }
  function buildTake(a,b,winner){
    if(!winner)return 'This is close enough that roster need and player preference should break the tie.';
    const win=winner==='A'?a:b;
    const lose=winner==='A'?b:a;
    const winTop=bestPlayer(win),loseTop=bestPlayer(lose);
    const wr=rankFor(winTop),lr=rankFor(loseTop);
    if(winTop&&loseTop&&wr&&lr&&wr+8<lr&&win.length<=lose.length){
      return `Team ${winner} gets the best player in the deal, ${winTop.name}, and the consolidation edge outweighs the extra depth on Team ${winner==='A'?'B':'A'}.`;
    }
    if(win.length<lose.length){
      return `Team ${winner} gets the more concentrated package, and BBB discounts some of the extra depth on Team ${winner==='A'?'B':'A'}.`;
    }
    if(currentMode()==='bbb'){
      const buy=buyAsset(win);
      if(buy)return `BBB is meaningfully higher than the market on ${buy.name}, which is the biggest reason Team ${winner} comes out ahead.`;
    }
    if(winTop)return `Team ${winner} has the stronger adjusted package, led by ${winTop.name}.`;
    return `Team ${winner} has the stronger adjusted package after BBB's cornerstone and package discounts.`;
  }
  function renderSimpleDecision(){
    ensureStyles();
    cleanModelCopy();
    const reason=document.querySelector('#bbbTradeReason');
    const verdict=document.querySelector('#tradeVerdict');
    const sub=document.querySelector('#tradeVerdictSub');
    if(!reason||!verdict||!sub)return;

    const a=sideAssets('A'),b=sideAssets('B');
    const av=adjustedValue('A'),bv=adjustedValue('B');
    if(!a.length||!b.length||!av||!bv){
      reason.textContent='Add assets to both sides and BBB will explain the single biggest reason behind the result.';
      setEdgeChip('WAITING FOR BOTH SIDES',true);
      return;
    }

    const max=Math.max(av,bv),min=Math.min(av,bv);
    const ratio=min/max;
    const edge=(max/min-1)*100;
    const winner=av===bv?null:(av>bv?'A':'B');
    const fair=ratio>=.97;

    if(fair)verdict.textContent='FAIR TRADE';
    else if(ratio>=.92)verdict.textContent=`LEAN TEAM ${winner}`;
    else if(ratio>=.84)verdict.textContent=`ACCEPT TEAM ${winner}`;
    else verdict.textContent=`STRONG ACCEPT TEAM ${winner}`;

    sub.textContent=fair?'Adjusted values are within 3%.':`Team ${winner} has a ${edge.toFixed(1)}% adjusted ${currentMode()==='market'?'market':'BBB'} value edge.`;
    reason.textContent=buildTake(a,b,fair?null:winner);
    setEdgeChip(fair?'WITHIN 3%':`TEAM ${winner} +${edge.toFixed(1)}%`,fair);
  }

  function polish(){cleanModelCopy();renderSimpleDecision();}

  if(typeof tradeRender==='function'&&!tradeRender.__bbbSimpleDecision){
    const original=tradeRender;
    const wrapped=function(){const result=original.apply(this,arguments);polish();return result;};
    wrapped.__bbbSimpleDecision=true;
    tradeRender=wrapped;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(polish,0));
  else setTimeout(polish,0);
})();
