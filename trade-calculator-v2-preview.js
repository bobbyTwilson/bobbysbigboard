// Bobby's Big Board — Trade Calculator V2 preview.
// UI-only redesign. Existing valuation logic and trade math are unchanged.
(function(){
  const root=()=>document.getElementById('tradeView');
  if(document.getElementById('bbb-trade-v2-preview-styles'))return;

  const style=document.createElement('style');
  style.id='bbb-trade-v2-preview-styles';
  style.textContent=`
    /* Desktop: the two sides are the comparison. Verdict sits beneath them. */
    #tradeView .trade-section{padding-top:50px!important}
    #tradeView .trade-topbar{margin-bottom:20px!important}
    #tradeView .trade-grid{
      display:grid!important;
      grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
      grid-template-areas:'sideA sideB' 'verdict verdict'!important;
      gap:18px!important;
      align-items:start!important;
    }
    #tradeView .trade-grid>.trade-team-card:first-child{grid-area:sideA}
    #tradeView .trade-grid>.trade-team-card:last-child{grid-area:sideB}
    #tradeView .trade-grid>.trade-verdict-card{grid-area:verdict}

    #tradeView .trade-team-card{
      min-height:390px;
      padding:22px!important;
      border:1px solid #214536!important;
      border-radius:18px!important;
      background:linear-gradient(155deg,#0c1812,#07100c)!important;
      box-shadow:0 18px 48px rgba(0,0,0,.17);
    }
    #tradeView .trade-team-head{
      margin-bottom:17px!important;
      padding-bottom:15px;
      border-bottom:1px solid #173329;
    }
    #tradeView .trade-side-label{
      color:#67daa0!important;
      font-size:9px!important;
      letter-spacing:.14em!important;
    }
    #tradeView .trade-team-head strong{
      margin-top:6px!important;
      color:#f7faf8;
      font-size:36px!important;
      line-height:1!important;
      letter-spacing:-.045em;
    }
    #tradeView .asset-count{
      padding:6px 9px!important;
      border-color:#2a4d3d!important;
      background:#09130f;
      color:#8fa399!important;
      font-size:9px!important;
    }
    #tradeView .trade-search{
      min-height:50px;
      padding:13px 14px!important;
      border:1px solid #2a5743!important;
      border-radius:12px!important;
      background:#050b08!important;
      font-size:13px!important;
    }
    #tradeView .trade-search:focus{
      border-color:#4bd08b!important;
      box-shadow:0 0 0 3px rgba(75,208,139,.09);
    }
    #tradeView .trade-results{
      top:calc(100% + 7px)!important;
      border-radius:12px!important;
      border-color:#315d49!important;
      box-shadow:0 20px 55px rgba(0,0,0,.45)!important;
    }
    #tradeView .trade-result{
      min-height:58px;
      padding:11px 13px!important;
    }
    #tradeView .trade-result strong{font-size:12px!important}
    #tradeView .trade-result-value{font-size:13px!important}
    #tradeView .trade-assets{
      gap:9px!important;
      margin-top:14px!important;
      min-height:225px!important;
    }
    #tradeView .trade-empty{
      min-height:205px!important;
      border-color:#284838!important;
      border-radius:12px!important;
      background:linear-gradient(145deg,#07100c,#08130e)!important;
      color:#71857a!important;
    }
    #tradeView .trade-asset{
      min-height:68px;
      padding:12px 13px!important;
      border-color:#214334!important;
      border-radius:12px!important;
      background:#09140f!important;
    }
    #tradeView .trade-asset-name{
      color:#f5f8f6!important;
      font-size:13px!important;
    }
    #tradeView .trade-asset-meta{margin-top:4px;font-size:9px!important}
    #tradeView .trade-asset-value strong{color:#75dda7!important;font-size:15px!important}
    #tradeView .trade-remove{
      width:31px!important;
      height:31px!important;
      cursor:pointer;
      transition:.15s ease;
    }
    #tradeView .trade-remove:hover{
      border-color:#754141!important;
      background:#261313!important;
      color:#f19a9a!important;
    }

    /* Verdict becomes a result dashboard rather than a narrow middle column. */
    #tradeView .trade-verdict-card{
      position:static!important;
      display:grid!important;
      grid-template-columns:minmax(0,1.3fr) minmax(300px,.7fr)!important;
      grid-template-areas:
        'kicker totals'
        'verdict totals'
        'sub totals'
        'balance totals'
        'fairness totals'
        'note note'!important;
      gap:8px 28px!important;
      padding:25px 27px!important;
      border:1px solid #2d614a!important;
      border-radius:18px!important;
      background:radial-gradient(circle at 83% 0%,rgba(26,143,86,.18),transparent 36%),linear-gradient(145deg,#0b1812,#07100c)!important;
      box-shadow:0 22px 60px rgba(0,0,0,.2);
    }
    #tradeView .verdict-kicker{grid-area:kicker;align-self:end}
    #tradeView .trade-verdict{
      grid-area:verdict;
      margin:3px 0 2px!important;
      color:#f7faf8;
      font-size:clamp(31px,4vw,48px)!important;
      line-height:.98!important;
      letter-spacing:-.05em;
    }
    #tradeView .trade-verdict-sub{
      grid-area:sub;
      max-width:680px;
      min-height:0!important;
      color:#9bada3!important;
      font-size:12px!important;
      line-height:1.65;
    }
    #tradeView .bbb-trade-balance{grid-area:balance;margin:10px 0 2px}
    #tradeView .bbb-trade-balance-head{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      margin-bottom:7px;
      color:#73897d;
      font-size:8px;
      font-weight:950;
      letter-spacing:.1em;
      text-transform:uppercase;
    }
    #tradeView .bbb-trade-balance-track{
      position:relative;
      height:10px;
      overflow:hidden;
      border:1px solid #254536;
      border-radius:999px;
      background:#050a08;
    }
    #tradeView .bbb-trade-balance-fill{
      height:100%;
      width:50%;
      background:linear-gradient(90deg,#66d99e,#23865a);
      transition:width .2s ease;
    }
    #tradeView .bbb-trade-balance-mid{
      position:absolute;
      top:-2px;
      bottom:-2px;
      left:50%;
      width:2px;
      z-index:2;
      background:#d2ddd7;
      opacity:.7;
    }
    #tradeView .fairness-wrap{
      grid-area:fairness;
      margin:9px 0 0!important;
      max-width:680px;
    }
    #tradeView .fairness-row{font-size:9px!important}
    #tradeView .fairness-track{height:7px!important;background:#13231c!important}
    #tradeView .adjusted-grid{
      grid-area:totals;
      align-self:stretch;
      display:grid!important;
      grid-template-columns:1fr 1fr!important;
      gap:10px!important;
      padding-left:25px;
      border-left:1px solid #1f4032;
    }
    #tradeView .adjusted-grid div{
      display:flex;
      min-width:0;
      min-height:132px;
      flex-direction:column;
      justify-content:center;
      padding:16px!important;
      border:1px solid #214435!important;
      border-radius:13px!important;
      background:#08120d!important;
    }
    #tradeView .adjusted-grid span{
      color:#74897d!important;
      font-size:8px!important;
      font-weight:950;
      letter-spacing:.08em;
    }
    #tradeView .adjusted-grid strong{
      margin-top:8px;
      color:#f7faf8;
      font-size:30px!important;
      line-height:1;
    }
    #tradeView .trade-note{
      grid-area:note;
      margin-top:15px!important;
      padding-top:14px!important;
      font-size:9px!important;
    }

    #tradeView .trade-explainer-grid{margin-top:20px!important}

    @media(max-width:760px){
      #tradeView .trade-section{padding-top:38px!important}
      #tradeView .trade-grid{
        grid-template-columns:1fr!important;
        grid-template-areas:'sideA' 'sideB' 'verdict'!important;
        gap:12px!important;
      }
      #tradeView .trade-team-card{min-height:0;padding:16px!important;border-radius:15px!important}
      #tradeView .trade-team-head{padding-bottom:12px;margin-bottom:13px!important}
      #tradeView .trade-team-head strong{font-size:29px!important}
      #tradeView .trade-search{min-height:47px;font-size:12px!important}
      #tradeView .trade-assets{min-height:115px!important}
      #tradeView .trade-empty{min-height:105px!important}
      #tradeView .trade-asset{min-height:60px;padding:10px!important}

      #tradeView .trade-verdict-card{
        grid-template-columns:1fr!important;
        grid-template-areas:'kicker' 'verdict' 'sub' 'totals' 'balance' 'fairness' 'note'!important;
        gap:8px!important;
        padding:18px!important;
        border-radius:15px!important;
      }
      #tradeView .trade-verdict{font-size:34px!important}
      #tradeView .trade-verdict-sub{font-size:11px!important}
      #tradeView .adjusted-grid{
        padding:0!important;
        border-left:0!important;
        margin:8px 0 4px;
      }
      #tradeView .adjusted-grid div{min-height:88px;padding:12px!important}
      #tradeView .adjusted-grid strong{font-size:22px!important}
      #tradeView .bbb-trade-balance{margin-top:9px}
      #tradeView .trade-explainer-grid{margin-top:14px!important}
    }
  `;
  document.head.appendChild(style);

  function readNumber(el){
    return Number(String(el?.textContent||'0').replace(/[^0-9.-]/g,''))||0;
  }

  function ensureBalance(){
    const trade=root();
    if(!trade)return false;
    const verdict=trade.querySelector('.trade-verdict-card');
    if(!verdict)return false;
    if(!verdict.querySelector('.bbb-trade-balance')){
      const balance=document.createElement('div');
      balance.className='bbb-trade-balance';
      balance.innerHTML='<div class="bbb-trade-balance-head"><span>Team A value</span><span>Trade balance</span><span>Team B value</span></div><div class="bbb-trade-balance-track"><div class="bbb-trade-balance-fill"></div><div class="bbb-trade-balance-mid"></div></div>';
      const fairness=verdict.querySelector('.fairness-wrap');
      verdict.insertBefore(balance,fairness||verdict.querySelector('.adjusted-grid'));
    }
    updateBalance();
    return true;
  }

  function updateBalance(){
    const trade=root();
    if(!trade)return;
    const a=readNumber(trade.querySelector('#teamAAdjusted'));
    const b=readNumber(trade.querySelector('#teamBAdjusted'));
    const fill=trade.querySelector('.bbb-trade-balance-fill');
    if(!fill)return;
    const total=a+b;
    const pct=total?Math.max(7,Math.min(93,(a/total)*100)):50;
    fill.style.width=pct+'%';
  }

  function init(){
    if(!ensureBalance())return;
    const trade=root();
    // Existing trade renderer updates text in-place; observe only value text changes.
    const values=[trade.querySelector('#teamAAdjusted'),trade.querySelector('#teamBAdjusted')].filter(Boolean);
    values.forEach(el=>new MutationObserver(updateBalance).observe(el,{childList:true,characterData:true,subtree:true}));
    updateBalance();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));
  else setTimeout(init,0);
})();
