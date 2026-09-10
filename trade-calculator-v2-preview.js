// Bobby's Big Board — Trade Calculator V2 preview.
// UI-only polish. Existing valuation logic and trade math are unchanged.
(function(){
  const root=()=>document.getElementById('trade');
  if(document.getElementById('bbb-trade-v2-preview-styles'))return;

  const style=document.createElement('style');
  style.id='bbb-trade-v2-preview-styles';
  style.textContent=`
    #trade .trade-grid{
      display:grid!important;
      grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
      grid-template-areas:'sideA sideB' 'verdict verdict'!important;
      gap:16px!important;
      align-items:start!important;
    }
    #trade .trade-side:first-child{grid-area:sideA}
    #trade .trade-side:last-child{grid-area:sideB}
    #trade .verdict{grid-area:verdict}

    #trade .trade-side{
      position:relative;
      min-height:365px;
      padding:19px!important;
      border:1px solid #1d3a2e!important;
      border-radius:16px!important;
      background:linear-gradient(155deg,#0b1511,#07100c)!important;
      box-shadow:0 18px 45px rgba(0,0,0,.14);
    }
    #trade .trade-side:before{
      display:block;
      margin-bottom:5px;
      color:#5fd69a;
      font-size:9px;
      font-weight:950;
      letter-spacing:.14em;
      text-transform:uppercase;
    }
    #trade .trade-side:first-child:before{content:'SIDE A'}
    #trade .trade-side:last-child:before{content:'SIDE B'}
    #trade .trade-side h3{
      margin:0 0 15px!important;
      color:#f6f8f6;
      font-size:22px!important;
      letter-spacing:-.02em;
    }
    #trade .trade-side input{
      min-height:48px;
      padding:12px 14px!important;
      border:1px solid #28513f!important;
      border-radius:11px!important;
      background:#050b08!important;
      font-size:13px!important;
    }
    #trade .trade-side input:focus{
      border-color:#42c883!important;
      box-shadow:0 0 0 3px rgba(66,200,131,.08);
    }
    #trade .trade-results{
      z-index:10;
      gap:7px!important;
      margin:8px 0 0!important;
    }
    #trade .trade-result{
      min-height:54px;
      padding:10px 12px!important;
      border-color:#203e31!important;
      border-radius:10px!important;
      background:#09140f!important;
    }
    #trade .trade-result:hover{background:#0d2118!important;border-color:#326149!important}
    #trade .trade-result strong{font-size:12px}
    #trade .trade-result span{display:block;margin-top:3px;font-size:9px!important}

    #trade #tradeAssetsA,#trade #tradeAssetsB{
      display:grid;
      gap:8px;
      margin-top:13px;
    }
    #trade .trade-asset{
      min-height:62px;
      padding:11px 12px!important;
      border-color:#1d392d!important;
      border-radius:11px!important;
      background:#08120d!important;
    }
    #trade .trade-asset>div:first-child strong{
      color:#f5f8f6;
      font-size:13px;
      line-height:1.25;
    }
    #trade .trade-asset>div:first-child span{
      display:block;
      margin-top:4px;
      color:#71857a!important;
      font-size:9px!important;
      font-weight:800;
    }
    #trade .trade-asset>div:last-child{
      display:flex;
      align-items:center;
      gap:9px;
    }
    #trade .trade-asset>div:last-child>strong{
      color:#76dea8;
      font-size:14px;
    }
    #trade .trade-remove{
      width:30px!important;
      height:30px!important;
      flex:none;
      border-color:#384940!important;
      color:#899991!important;
      cursor:pointer;
    }
    #trade .trade-remove:hover{border-color:#744040!important;color:#ef9898!important;background:#251111!important}
    #trade .trade-side .empty{
      margin-top:13px;
      padding:32px 18px!important;
      border:1px dashed #1b362b;
      border-radius:11px;
      background:#060d09;
      color:#65796e!important;
      font-size:11px;
    }

    #trade .verdict{
      position:static!important;
      display:grid!important;
      grid-template-columns:minmax(0,1.2fr) minmax(280px,.8fr)!important;
      grid-template-areas:'headline scores' 'meter scores' 'reason scores'!important;
      gap:14px 30px!important;
      padding:21px 23px!important;
      border:1px solid #24523e!important;
      border-radius:16px!important;
      background:radial-gradient(circle at 80% 0%,rgba(22,126,76,.16),transparent 34%),linear-gradient(145deg,#0b1711,#07100c)!important;
      box-shadow:0 22px 55px rgba(0,0,0,.16);
    }
    #trade .verdict>.kicker{grid-area:headline;align-self:end}
    #trade .verdict h3{
      grid-area:headline;
      align-self:end;
      margin:20px 0 0!important;
      padding-top:5px;
      color:#f7faf8;
      font-size:clamp(24px,3.2vw,38px)!important;
      line-height:1!important;
      letter-spacing:-.04em;
    }
    #trade #tradeVerdictSub{
      grid-area:reason;
      margin:0!important;
      max-width:660px;
      color:#9cadA4!important;
      font-size:12px!important;
      line-height:1.65;
    }
    #trade .bbb-trade-v2-meter{
      grid-area:meter;
      margin-top:2px;
    }
    #trade .bbb-trade-v2-meter-labels{
      display:flex;
      justify-content:space-between;
      gap:12px;
      margin-bottom:7px;
      color:#6e8377;
      font-size:8px;
      font-weight:950;
      letter-spacing:.1em;
      text-transform:uppercase;
    }
    #trade .bbb-trade-v2-meter-track{
      position:relative;
      height:8px;
      overflow:hidden;
      border:1px solid #1c392d;
      border-radius:999px;
      background:#050a08;
    }
    #trade .bbb-trade-v2-meter-mid{
      position:absolute;
      top:-3px;bottom:-3px;left:50%;
      width:1px;
      background:#628073;
      z-index:2;
    }
    #trade .bbb-trade-v2-meter-fill{
      height:100%;
      width:50%;
      border-radius:999px;
      background:linear-gradient(90deg,#1d6f49,#57d796);
      transition:width .22s ease;
    }
    #trade .bbb-trade-v2-scores{
      grid-area:scores;
      align-self:stretch;
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:10px;
      padding-left:22px;
      border-left:1px solid #1d392e;
    }
    #trade .bbb-trade-v2-scores .score{
      display:flex!important;
      min-width:0;
      min-height:96px;
      flex-direction:column;
      justify-content:center;
      align-items:flex-start;
      gap:5px;
      padding:13px!important;
      border:1px solid #1d3b2f!important;
      border-radius:12px;
      background:#07100c;
    }
    #trade .bbb-trade-v2-scores .score span{
      color:#71867a!important;
      font-size:9px!important;
      font-weight:950;
      letter-spacing:.08em;
      text-transform:uppercase;
    }
    #trade .bbb-trade-v2-scores .score strong{
      color:#f5f8f6;
      font-size:25px;
      line-height:1;
    }
    #trade .bbb-trade-v2-scores #clearTrade{
      grid-column:1/-1;
      min-height:40px;
      border-radius:9px!important;
      cursor:pointer;
    }

    @media(max-width:760px){
      #trade .section-head{margin-bottom:18px!important}
      #trade .trade-grid{
        grid-template-columns:1fr!important;
        grid-template-areas:'sideA' 'sideB' 'verdict'!important;
        gap:11px!important;
      }
      #trade .trade-side{
        min-height:0;
        padding:15px!important;
        border-radius:14px!important;
      }
      #trade .trade-side h3{font-size:19px!important;margin-bottom:12px!important}
      #trade .trade-side input{min-height:46px;font-size:12px!important}
      #trade .trade-asset{min-height:58px;padding:10px!important}
      #trade .trade-asset>div:first-child strong{font-size:12px}
      #trade .trade-asset>div:last-child>strong{font-size:13px}
      #trade .trade-side .empty{margin-top:10px;padding:22px 12px!important}

      #trade .verdict{
        grid-template-columns:1fr!important;
        grid-template-areas:'headline' 'scores' 'meter' 'reason'!important;
        gap:13px!important;
        padding:17px!important;
        border-radius:14px!important;
      }
      #trade .verdict h3{
        margin-top:18px!important;
        font-size:27px!important;
      }
      #trade .bbb-trade-v2-scores{
        grid-template-columns:1fr 1fr;
        padding:0!important;
        border-left:0!important;
      }
      #trade .bbb-trade-v2-scores .score{min-height:79px;padding:11px!important}
      #trade .bbb-trade-v2-scores .score strong{font-size:21px}
      #trade #tradeVerdictSub{font-size:11px!important}
    }
  `;
  document.head.appendChild(style);

  function numberFrom(el){
    return Number(String(el?.textContent||'0').replace(/[^0-9.-]/g,''))||0;
  }

  function enhance(){
    const trade=root();
    if(!trade)return false;
    const verdict=trade.querySelector('.verdict');
    if(!verdict)return false;

    if(!verdict.querySelector('.bbb-trade-v2-meter')){
      const meter=document.createElement('div');
      meter.className='bbb-trade-v2-meter';
      meter.innerHTML='<div class="bbb-trade-v2-meter-labels"><span>Team A edge</span><span>Even</span><span>Team B edge</span></div><div class="bbb-trade-v2-meter-track"><div class="bbb-trade-v2-meter-mid"></div><div class="bbb-trade-v2-meter-fill"></div></div>';
      const sub=verdict.querySelector('#tradeVerdictSub');
      verdict.insertBefore(meter,sub||null);
    }

    let scoreWrap=verdict.querySelector('.bbb-trade-v2-scores');
    if(!scoreWrap){
      scoreWrap=document.createElement('div');
      scoreWrap.className='bbb-trade-v2-scores';
      const scores=[...verdict.querySelectorAll(':scope > .score')];
      const clear=verdict.querySelector(':scope > #clearTrade');
      scores.forEach(x=>scoreWrap.appendChild(x));
      if(clear)scoreWrap.appendChild(clear);
      verdict.appendChild(scoreWrap);
    }

    updateMeter();
    return true;
  }

  function updateMeter(){
    const trade=root();
    if(!trade)return;
    const a=numberFrom(trade.querySelector('#teamAAdjusted'));
    const b=numberFrom(trade.querySelector('#teamBAdjusted'));
    const fill=trade.querySelector('.bbb-trade-v2-meter-fill');
    if(!fill)return;
    let pct=50;
    if(a||b){
      const total=a+b;
      pct=total?Math.max(8,Math.min(92,(a/total)*100)):50;
    }
    fill.style.width=pct+'%';
  }

  function init(){
    if(!enhance())return;
    const trade=root();
    new MutationObserver(()=>{enhance();updateMeter();}).observe(trade,{childList:true,subtree:true,characterData:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));
  else setTimeout(init,0);
})();
