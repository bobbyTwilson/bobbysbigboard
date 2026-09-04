// Preview-only user-facing copy cleanup for Bobby's Big Board Trade Calculator.
// Removes internal "V2" terminology while preserving the underlying valuation model.
(function(){
  function cleanReasonCopy(){
    const reason=document.querySelector('#bbbTradeReason');
    if(!reason)return;
    let text=String(reason.textContent||'').trim();
    if(!text)return;

    text=text
      .replace(
        'V2 will explain the strongest driver once both sides have assets.',
        'Once both sides have assets, BBB will explain the biggest factor driving the result.'
      )
      .replace(
        'The V2 adjusted values are close after elite-asset and package discounts.',
        'The adjusted values are close after accounting for elite-player premiums and package discounts.'
      )
      .replace(
        'and V2 protects that elite asset from being matched too easily by depth.',
        'and BBB gives extra weight to that cornerstone instead of letting multiple depth pieces cancel it out too easily.'
      )
      .replace(
        'after V2 discounts the extra depth pieces.',
        'after BBB discounts the extra depth pieces in the package.'
      )
      .replace(
        'carries the higher V2 adjusted value after package and cornerstone premiums.',
        'has the higher adjusted value after accounting for package size and cornerstone value.'
      );

    reason.textContent=text;
  }

  function cleanVerdictCopy(){
    const sub=document.querySelector('#tradeVerdictSub');
    if(sub&&sub.textContent.includes('V2 adjusted values are within 3%.')){
      sub.textContent=sub.textContent.replace('V2 adjusted values are within 3%.','Adjusted values are within 3%.');
    }
  }

  function cleanModelExplainer(){
    const summary=document.querySelector('.trade-summary-card');
    if(!summary)return;
    const label=summary.querySelector('.trade-summary-label');
    if(label&&label.textContent.trim()==='V2 VALUE MODEL')label.textContent='BBB VALUE MODEL';
    const p=summary.querySelector('p');
    if(p&&p.textContent.includes('V2 protects elite assets')){
      p.textContent="BBB gives extra weight to elite cornerstone players, discounts extra depth pieces more aggressively, and lets you compare Bobby's board with market-rank value.";
    }
  }

  function cleanTradeCopy(){
    cleanReasonCopy();
    cleanVerdictCopy();
    cleanModelExplainer();
  }

  if(typeof tradeRender==='function'&&!tradeRender.__bbbCopyPolish){
    const original=tradeRender;
    const wrapped=function(){
      const result=original.apply(this,arguments);
      cleanTradeCopy();
      return result;
    };
    wrapped.__bbbCopyPolish=true;
    tradeRender=wrapped;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(cleanTradeCopy,0));
  else setTimeout(cleanTradeCopy,0);
})();
